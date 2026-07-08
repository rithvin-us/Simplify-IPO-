// /api/workspaces/:id/documents — upload, auto parse+extract, checklist, accept fields.
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { authRequired } = require('../auth');
const store = require('../store');
const ai = require('../aiClient');

const { db } = store;
const router = express.Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');

// Membership guard (shared shape with workspaces.js).
function loadWs(req, res, next) {
  const id = Number(req.params.id);
  const ws = db.workspaces.find((w) => w.id === id);
  if (!ws) return res.status(404).json({ error: 'workspace not found' });
  if (!store.isMember(id, req.user.id)) return res.status(403).json({ error: 'not a workspace member' });
  req.workspace = ws;
  next();
}

// Upload a document, persist locally, then parse + extract via the AI service.
router.post('/', authRequired, loadWs, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file field required (multipart)' });
  const category = req.body.category || 'supporting';
  const wizard_step = req.body.wizard_step || '';

  const dir = path.join(UPLOAD_DIR, String(req.workspace.id));
  fs.mkdirSync(dir, { recursive: true });
  const safeName = path.basename(req.file.originalname); // strip path components — traversal guard
  const storage_key = path.join(dir, `${Date.now()}_${safeName}`);
  fs.writeFileSync(storage_key, req.file.buffer);

  const doc = {
    id: store.nextId('document'),
    workspace_id: req.workspace.id,
    category,
    wizard_step,
    filename: safeName,
    storage_key,
    mime_type: req.file.mimetype,
    uploaded_by: req.user.id,
    parse_status: 'pending',
    uploaded_at: new Date().toISOString(),
  };
  db.documents.push(doc);
  store.logActivity(req.workspace.id, req.user.id, 'document_uploaded', { filename: doc.filename, category });

  let extracted = [];
  try {
    const parsed = await ai.parse(req.file.buffer, safeName);
    const result = await ai.extract({ filename: doc.filename, category, wizard_step, text: parsed.text });
    for (const f of result.fields) {
      db.extractedFields.push({
        id: store.nextId('field'),
        workspace_id: req.workspace.id,
        field_key: f.field_key,
        value: String(f.value),
        confidence: f.confidence,
        source_document_id: doc.id,
        accepted: false,
      });
    }
    doc.parse_status = 'parsed';
    extracted = result.fields;
    store.logActivity(req.workspace.id, req.user.id, 'document_extracted', { filename: doc.filename, fields: result.count, mode: result.mode });
  } catch (e) {
    doc.parse_status = 'failed';
    return res.status(502).json({ error: 'parse/extract failed', detail: String(e), document: doc });
  }

  res.status(201).json({ document: doc, extracted });
});

// List documents + required-document checklist status.
router.get('/', authRequired, loadWs, (req, res) => {
  const docs = db.documents.filter((d) => d.workspace_id === req.workspace.id);
  const uploaded = new Set(docs.map((d) => d.category));
  const checklist = store.REQUIRED_DOC_CATEGORIES.map((c) => ({ ...c, uploaded: uploaded.has(c.category) }));
  res.json({ documents: docs, checklist });
});

// Extracted fields awaiting SME confirmation (ExtractionPreview screen).
router.get('/extracted', authRequired, loadWs, (req, res) => {
  res.json({ fields: db.extractedFields.filter((f) => f.workspace_id === req.workspace.id) });
});

// Accept one extracted field into the canonical wizard data.
router.post('/extracted/:fieldId/accept', authRequired, loadWs, (req, res) => {
  const field = db.extractedFields.find(
    (f) => f.id === Number(req.params.fieldId) && f.workspace_id === req.workspace.id,
  );
  if (!field) return res.status(404).json({ error: 'extracted field not found' });
  const value = req.body && req.body.value !== undefined ? String(req.body.value) : field.value;
  store.upsertIpoData(req.workspace.id, field.field_key, value, req.user.id);
  field.accepted = true;
  res.json({ ok: true, field_key: field.field_key, value });
});

// Accept every not-yet-accepted extracted field (highest confidence wins per key).
router.post('/extracted/accept-all', authRequired, loadWs, (req, res) => {
  const byKey = {};
  for (const f of db.extractedFields.filter((x) => x.workspace_id === req.workspace.id)) {
    if (!byKey[f.field_key] || f.confidence > byKey[f.field_key].confidence) byKey[f.field_key] = f;
  }
  let n = 0;
  for (const f of Object.values(byKey)) {
    store.upsertIpoData(req.workspace.id, f.field_key, f.value, req.user.id);
    f.accepted = true;
    n += 1;
  }
  store.logActivity(req.workspace.id, req.user.id, 'fields_accepted', { fields: n });
  res.json({ ok: true, accepted: n, data: store.ipoDataMap(req.workspace.id) });
});

module.exports = router;
