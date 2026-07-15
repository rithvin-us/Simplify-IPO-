// Shared route helpers for the async (Postgres-backed) route modules.
const store = require('./store');

// Express 4 does not forward rejected promises to the error handler — wrap
// every async handler so a thrown error becomes a 500 instead of a hang.
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Resolve :id, enforce membership (Zero Trust: verified on every request,
// never inferred from the token alone), attach req.workspace.
const loadWs = ah(async (req, res, next) => {
  const id = Number(req.params.id);
  const ws = Number.isInteger(id) ? await store.getWorkspace(id) : null;
  if (!ws) return res.status(404).json({ error: 'workspace not found' });
  if (!(await store.isMember(id, req.user.id))) {
    return res.status(403).json({ error: 'not a workspace member' });
  }
  req.workspace = ws;
  next();
});

module.exports = { ah, loadWs };
