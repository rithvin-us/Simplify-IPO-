// /api/workspaces/:id/documents — upload, auto parse+extract, checklist, accept fields.
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { authRequired } = require('../auth');
const store = require('../store');
const ai = require('../aiClient');
const { ah, loadWs } = require('../middleware');

const router = express.Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');

// Upload a document, persist locally, then parse + extract via the AI service.
router.post('/', authRequired, loadWs, upload.single('file'), ah(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file field required (multipart)' });
  const category = req.body.category || 'supporting';
  const wizard_step = req.body.wizard_step || '';

  const dir = path.join(UPLOAD_DIR, String(req.workspace.id));
  fs.mkdirSync(dir, { recursive: true });
  const safeName = path.basename(req.file.originalname); // strip path components — traversal guard
  const storage_key = path.join(dir, `${Date.now()}_${safeName}`);
  fs.writeFileSync(storage_key, req.file.buffer);

  const doc = await store.createDocument({
    workspace_id: req.workspace.id,
    category,
    wizard_step,
    filename: safeName,
    storage_key,
    mime_type: req.file.mimetype,
    uploaded_by: req.user.id,
    parse_status: 'pending',
  });
  await store.logActivity(req.workspace.id, req.user.id, 'document_uploaded', {
    filename: doc.filename, category,
  });

  let extracted = [];
  try {
    const parsed = await ai.parse(req.file.buffer, safeName);
    const result = await ai.extract({ filename: doc.filename, category, wizard_step, text: parsed.text });
    await store.insertExtractedFields(req.workspace.id, doc.id, result.fields);
    await store.setDocumentParseStatus(doc.id, 'parsed');
    doc.parse_status = 'parsed';
    extracted = result.fields;
    await store.logActivity(req.workspace.id, req.user.id, 'document_extracted', {
      filename: doc.filename, fields: result.count, mode: result.mode,
    });
  } catch (e) {
    await store.setDocumentParseStatus(doc.id, 'failed');
    doc.parse_status = 'failed';
    return res.status(502).json({ error: 'parse/extract failed', detail: String(e), document: doc });
  }

  res.status(201).json({ document: doc, extracted });
}));

// List documents + required-document checklist status.
router.get('/', authRequired, loadWs, ah(async (req, res) => {
  const docs = await store.listDocuments(req.workspace.id);
  const uploaded = new Set(docs.map((d) => d.category));
  const checklist = store.REQUIRED_DOC_CATEGORIES.map((c) => ({ ...c, uploaded: uploaded.has(c.category) }));
  res.json({ documents: docs, checklist });
}));

// Extracted fields awaiting SME confirmation (ExtractionPreview screen).
router.get('/extracted', authRequired, loadWs, ah(async (req, res) => {
  res.json({ fields: await store.listExtractedFields(req.workspace.id) });
}));

// Accept one extracted field into the canonical wizard data.
router.post('/extracted/:fieldId/accept', authRequired, loadWs, ah(async (req, res) => {
  const field = await store.getExtractedField(req.workspace.id, Number(req.params.fieldId));
  if (!field) return res.status(404).json({ error: 'extracted field not found' });
  const value = req.body && req.body.value !== undefined ? String(req.body.value) : field.value;
  await store.upsertIpoData(req.workspace.id, field.field_key, value, req.user.id);
  await store.markExtractedAccepted(field.id);
  res.json({ ok: true, field_key: field.field_key, value });
}));

// Accept every not-yet-accepted extracted field (highest confidence wins per key).
router.post('/extracted/accept-all', authRequired, loadWs, ah(async (req, res) => {
  const fields = await store.listExtractedFields(req.workspace.id);
  const byKey = {};
  for (const f of fields) {
    if (!byKey[f.field_key] || Number(f.confidence) > Number(byKey[f.field_key].confidence)) {
      byKey[f.field_key] = f;
    }
  }
  let n = 0;
  for (const f of Object.values(byKey)) {
    await store.upsertIpoData(req.workspace.id, f.field_key, f.value, req.user.id);
    await store.markExtractedAccepted(f.id);
    n += 1;
  }
  await store.logActivity(req.workspace.id, req.user.id, 'fields_accepted', { fields: n });
  res.json({ ok: true, accepted: n, data: await store.ipoDataMap(req.workspace.id) });
}));

module.exports = router;
