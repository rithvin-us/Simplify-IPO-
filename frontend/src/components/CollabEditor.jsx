// Module 20 — real-time collaborative section editor.
// Yjs CRDT doc synced through the backend's /collab WebSocket; CodeMirror 6
// binding renders remote cursors/selections (awareness) in each peer's colour.
import React, { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { minimalSetup } from 'codemirror';
import { yCollab } from 'y-codemirror.next';
import './collab.css';

const COLORS = ['#2563eb', '#d97706', '#059669', '#dc2626', '#7c3aed', '#0891b2'];

const initials = (name) => String(name || '?')
  .split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function CollabEditor({ workspaceId, sectionKey, user, contentRef, readOnly = false }) {
  const hostRef = useRef(null);
  const [status, setStatus] = useState('connecting');
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    const doc = new Y.Doc();
    const ytext = doc.getText('content');
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const provider = new WebsocketProvider(
      `${proto}://${window.location.host}/collab/${workspaceId}`,
      sectionKey,
      doc,
      { params: { token: localStorage.getItem('ipow_token') || '' } },
    );

    const color = COLORS[(user?.id || 0) % COLORS.length];
    provider.awareness.setLocalStateField('user', {
      name: user?.full_name || 'Anonymous',
      color,
      colorLight: `${color}33`,
      role: user?.role,
    });

    const onStatus = (e) => setStatus(e.status);
    provider.on('status', onStatus);

    const onAwareness = () => {
      const others = [...provider.awareness.getStates().entries()]
        .filter(([clientId]) => clientId !== doc.clientID)
        .map(([, s]) => s.user)
        .filter(Boolean);
      setPeers(others);
    };
    provider.awareness.on('change', onAwareness);

    const view = new EditorView({
      state: EditorState.create({
        doc: ytext.toString(),
        extensions: [
          minimalSetup,
          EditorView.lineWrapping,
          EditorView.editable.of(!readOnly),
          yCollab(ytext, provider.awareness),
        ],
      }),
      parent: hostRef.current,
    });

    if (contentRef) contentRef.current = () => ytext.toString();

    return () => {
      if (contentRef) contentRef.current = null;
      provider.awareness.off('change', onAwareness);
      provider.off('status', onStatus);
      view.destroy();
      provider.destroy();
      doc.destroy();
    };
  }, [workspaceId, sectionKey, readOnly]);

  return (
    <div className="collab-editor">
      <div className="collab-status">
        <span className={`dot ${status}`} />
        <span>{status}</span>
        <span className="peers">
          {peers.map((p, i) => (
            <span key={i} className="peer" style={{ background: p.color }} title={`${p.name} (${p.role || ''})`}>
              {initials(p.name)}
            </span>
          ))}
        </span>
      </div>
      <div ref={hostRef} className="collab-host" />
    </div>
  );
}
