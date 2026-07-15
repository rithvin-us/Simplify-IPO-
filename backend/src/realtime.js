// Real-time collaborative editing (Module 20). Yjs CRDT sync + awareness
// (multi-cursor presence) over raw WebSockets, replacing pessimistic section
// locks. One room per (workspace, section); the room's Y.Doc is seeded from
// sections.content and persisted back on a debounce and on last-disconnect.
//
// Wire protocol matches y-websocket (message 0 = sync, 1 = awareness), so the
// stock `y-websocket` WebsocketProvider on the frontend connects unchanged to
//   ws(s)://host/collab/<workspaceId>/<sectionKey>?token=<jwt>
const { WebSocketServer } = require('ws');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const { verifyToken } = require('./auth');
const store = require('./store');

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const PERSIST_DEBOUNCE_MS = 1500;
const PING_INTERVAL_MS = 30_000;

const rooms = new Map(); // "workspaceId/sectionKey" -> Room

class Room {
  constructor(name, section) {
    this.name = name;
    this.sectionId = section.id;
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.awareness.setLocalState(null);
    this.conns = new Map(); // ws -> Set<awareness clientID>
    this.persistTimer = null;

    if (section.content) this.doc.getText('content').insert(0, section.content);

    this.doc.on('update', (update) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      this.broadcast(encoding.toUint8Array(encoder));
      this.schedulePersist();
    });

    this.awareness.on('update', ({ added, updated, removed }, origin) => {
      const changed = added.concat(updated, removed);
      if (origin && this.conns.has(origin)) {
        const ids = this.conns.get(origin);
        added.forEach((id) => ids.add(id));
        removed.forEach((id) => ids.delete(id));
      }
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changed),
      );
      this.broadcast(encoding.toUint8Array(encoder));
    });
  }

  text() {
    return this.doc.getText('content').toString();
  }

  broadcast(buf) {
    for (const conn of this.conns.keys()) send(conn, buf);
  }

  schedulePersist() {
    clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.persist(), PERSIST_DEBOUNCE_MS);
  }

  async persist() {
    clearTimeout(this.persistTimer);
    this.persistTimer = null;
    try {
      await store.saveSectionContent(this.sectionId, this.text());
    } catch (e) {
      console.error(`realtime persist failed for ${this.name}:`, e.message);
    }
  }

  // REST-side content replacement (regenerate / version rollback) pushed into
  // the live doc so connected editors converge on the new content.
  replaceContent(content) {
    const ytext = this.doc.getText('content');
    this.doc.transact(() => {
      ytext.delete(0, ytext.length);
      if (content) ytext.insert(0, content);
    }, 'rest');
  }
}

function send(conn, buf) {
  if (conn.readyState !== conn.OPEN) return;
  conn.send(buf, (err) => { if (err) conn.close(); });
}

async function getRoom(workspaceId, sectionKey) {
  const name = `${workspaceId}/${sectionKey}`;
  let room = rooms.get(name);
  if (!room) {
    const section = await store.getSection(workspaceId, sectionKey);
    if (!section) return null;
    room = new Room(name, section);
    rooms.set(name, room);
  }
  return room;
}

function setupConnection(conn, room) {
  conn.binaryType = 'arraybuffer';
  conn.isAlive = true;
  room.conns.set(conn, new Set());

  conn.on('pong', () => { conn.isAlive = true; });

  conn.on('message', (data) => {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(data));
      const messageType = decoding.readVarUint(decoder);
      if (messageType === MESSAGE_SYNC) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_SYNC);
        syncProtocol.readSyncMessage(decoder, encoder, room.doc, conn);
        if (encoding.length(encoder) > 1) send(conn, encoding.toUint8Array(encoder));
      } else if (messageType === MESSAGE_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(
          room.awareness, decoding.readVarUint8Array(decoder), conn,
        );
      }
    } catch (e) {
      console.error(`realtime message error in ${room.name}:`, e.message);
    }
  });

  const close = async () => {
    const ids = room.conns.get(conn);
    if (!room.conns.delete(conn)) return;
    if (ids && ids.size) {
      awarenessProtocol.removeAwarenessStates(room.awareness, [...ids], null);
    }
    if (room.conns.size === 0) {
      await room.persist();
      // Re-check after the await: a client may have joined mid-persist, in
      // which case the room must stay alive.
      if (room.conns.size === 0 && rooms.get(room.name) === room) {
        rooms.delete(room.name);
        room.doc.destroy();
      }
    }
  };
  conn.on('close', close);
  conn.on('error', close);

  // Handshake: sync step 1 + current presence.
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(encoder, room.doc);
  send(conn, encoding.toUint8Array(encoder));

  const states = room.awareness.getStates();
  if (states.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, [...states.keys()]),
    );
    send(conn, encoding.toUint8Array(awarenessEncoder));
  }
}

function refuse(socket, status = '401 Unauthorized') {
  socket.write(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

// Attach the collaboration endpoint to the shared HTTP server.
function attach(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (req, socket, head) => {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch {
      return refuse(socket, '400 Bad Request');
    }
    if (!url.pathname.startsWith('/collab/')) return socket.destroy();

    // /collab/<workspaceId>/<sectionKey>?token=<jwt>
    const parts = url.pathname.split('/').filter(Boolean);
    const workspaceId = Number(parts[1]);
    const sectionKey = decodeURIComponent(parts[2] || '');
    if (!Number.isInteger(workspaceId) || !sectionKey) return refuse(socket, '400 Bad Request');

    let payload;
    try {
      payload = verifyToken(url.searchParams.get('token') || '');
    } catch {
      return refuse(socket, '401 Unauthorized');
    }
    if (payload.scope === 'mfa') return refuse(socket, '401 Unauthorized');

    try {
      // Zero Trust: membership and section state verified per connection.
      if (!(await store.isMember(workspaceId, payload.sub))) return refuse(socket, '403 Forbidden');
      const section = await store.getSection(workspaceId, sectionKey);
      if (!section) return refuse(socket, '404 Not Found');
      if (section.status === 'final') return refuse(socket, '409 Conflict'); // finalized sections are read-only via REST

      wss.handleUpgrade(req, socket, head, async (conn) => {
        const room = await getRoom(workspaceId, sectionKey);
        if (!room) return conn.close();
        setupConnection(conn, room);
      });
    } catch (e) {
      console.error('realtime upgrade error:', e.message);
      refuse(socket, '500 Internal Server Error');
    }
  });

  // Keepalive: drop dead sockets so awareness state doesn't linger.
  const interval = setInterval(() => {
    for (const room of rooms.values()) {
      for (const conn of room.conns.keys()) {
        if (conn.isAlive === false) { conn.terminate(); continue; }
        conn.isAlive = false;
        conn.ping();
      }
    }
  }, PING_INTERVAL_MS);
  wss.on('close', () => clearInterval(interval));

  return wss;
}

// Push new content (rollback/regenerate) into a live room, if one exists.
function resetRoomContent(workspaceId, sectionKey, content) {
  const room = rooms.get(`${workspaceId}/${sectionKey}`);
  if (room) room.replaceContent(content);
}

module.exports = { attach, resetRoomContent };
