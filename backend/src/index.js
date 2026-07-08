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

// Metadata for the wizard/UI: field catalogue (from AI service) + section catalogue.
app.get('/api/meta', async (_req, res) => {
  let fields = [];
  try {
    const r = await fetch(`${ai.AI_BASE}/schema/fields`);
    if (r.ok) {
      const data = await r.json();
      fields = data.fields.map((f) => ({
        key: f.key, label: f.label, wizard_step: f.wizard_step,
        category: f.category, required: f.required,
      }));
    }
  } catch { /* AI down — return sections only */ }
  res.json({
    fields,
    wizard_steps: ['company', 'promoters', 'financials', 'legal', 'issue', 'risk'],
    sections: store.SECTIONS,
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
