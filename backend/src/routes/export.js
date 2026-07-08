// /api/workspaces/:id/export — compliance summary and Word / PDF(HTML) rendering.
const express = require('express');
const { authRequired } = require('../auth');
const store = require('../store');
const ai = require('../aiClient');

const { db } = store;
const router = express.Router({ mergeParams: true });

function loadWs(req, res, next) {
  const id = Number(req.params.id);
  const ws = db.workspaces.find((w) => w.id === id);
  if (!ws) return res.status(404).json({ error: 'workspace not found' });
  if (!store.isMember(id, req.user.id)) return res.status(403).json({ error: 'not a workspace member' });
  req.workspace = ws;
  next();
}

// Assemble the export payload from sections that have content.
function buildPayload(ws) {
  const sections = db.sections
    .filter((s) => s.workspace_id === ws.id && s.content)
    .map((s) => ({ section_key: s.section_key, title: s.title, content: s.content, status: s.status }));
  return { company_name: ws.company_name, sections };
}

router.get('/summary', authRequired, loadWs, async (req, res) => {
  try {
    const result = await ai.exportDoc(buildPayload(req.workspace));
    res.json({ summary: result.summary, docx_available: result.docx_available, health: store.computeHealth(req.workspace.id) });
  } catch (e) {
    res.status(502).json({ error: 'export summary failed', detail: String(e) });
  }
});

router.get('/docx', authRequired, loadWs, async (req, res) => {
  try {
    const result = await ai.exportDoc(buildPayload(req.workspace));
    if (!result.docx_base64) return res.status(409).json({ error: 'docx unavailable (python-docx not installed); use /export/pdf' });
    store.logActivity(req.workspace.id, req.user.id, 'exported', { format: 'docx' });
    const buf = Buffer.from(result.docx_base64, 'base64');
    const name = `DRHP_${req.workspace.company_name.replace(/\W+/g, '_')}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.send(buf);
  } catch (e) {
    res.status(502).json({ error: 'docx export failed', detail: String(e) });
  }
});

// PDF path: return print-ready HTML (browser -> Print to PDF, matching the SRS approach).
router.get('/pdf', authRequired, loadWs, async (req, res) => {
  try {
    const result = await ai.exportDoc(buildPayload(req.workspace));
    store.logActivity(req.workspace.id, req.user.id, 'exported', { format: 'pdf' });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(result.html);
  } catch (e) {
    res.status(502).json({ error: 'pdf export failed', detail: String(e) });
  }
});

module.exports = router;
