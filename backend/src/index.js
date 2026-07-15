require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');

const store = require('./store');
const ai = require('./aiClient');
const realtime = require('./realtime');
const { runMigrations } = require('../scripts/migrate');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Route modules.
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/workspaces/:id/documents', require('./routes/documents'));
app.use('/api/workspaces/:id/sections', require('./routes/sections'));
app.use('/api/workspaces/:id/export', require('./routes/export'));

const collab = require('./routes/collab');
app.use('/api/workspaces/:id', collab.workspace);   // requests / issues / commits within a workspace
app.use('/api/requests', collab.requests);           // reviewer's cross-workspace inbox

// Metadata for the wizard/UI: typed field catalogue + section catalogue (from AI service).
app.get('/api/meta', async (_req, res) => {
  let fields = [];
  let stepMeta = {};
  let sections = store.SECTIONS;
  try {
    const [rf, rs] = await Promise.all([
      fetch(`${ai.AI_BASE}/schema/fields`),
      fetch(`${ai.AI_BASE}/schema/sections`),
    ]);
    if (rf.ok) { const d = await rf.json(); fields = d.fields; stepMeta = d.step_meta || {}; }
    if (rs.ok) { const d = await rs.json(); sections = d.sections; }
  } catch { /* AI down — fall back to local section mirror */ }
  res.json({
    fields,
    wizard_steps: ['company', 'promoters', 'financials', 'legal', 'issue', 'risk'],
    step_meta: stepMeta,
    sections,
    doc_checklist: store.REQUIRED_DOC_CATEGORIES,
  });
});

app.get('/api/health', async (_req, res) => {
  let db = 'ok';
  try { await store.pool.query('SELECT 1'); } catch (e) { db = `error: ${e.message}`; }
  res.json({ status: 'ok', db, ai: await ai.health() });
});

// Async route errors land here (via the ah() wrapper in middleware.js).
app.use((err, _req, res, _next) => {
  console.error('unhandled route error:', err);
  res.status(500).json({ error: 'internal error', detail: String(err.message || err) });
});

async function main() {
  if (process.env.RUN_MIGRATIONS === '1') await runMigrations();
  // Seed demo users (sme@demo.in / mb@demo.in / legal@demo.in, password "demo").
  await store.seed();

  const server = http.createServer(app);
  realtime.attach(server); // WebSocket /collab/<workspaceId>/<sectionKey>

  const port = process.env.PORT || 4000;
  server.listen(port, () => {
    console.log(`IPOW backend listening on :${port}  (AI service: ${ai.AI_BASE})`);
  });
}

main().catch((e) => {
  console.error('fatal startup error:', e.message);
  process.exit(1);
});
