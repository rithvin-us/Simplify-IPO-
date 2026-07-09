require('dotenv').config();
const express = require('express');
const cors = require('cors');

const store = require('./store');
const ai = require('./aiClient');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Seed demo users (sme@demo.in / mb@demo.in / legal@demo.in, password "demo").
store.seed();

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
  res.json({ status: 'ok', ai: await ai.health() });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`IPOW backend listening on :${port}  (AI service: ${ai.AI_BASE})`);
});
