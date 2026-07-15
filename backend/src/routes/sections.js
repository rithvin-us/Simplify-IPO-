// /api/workspaces/:id/sections — draft generation, review workflow, version
// history (Module 19). Pessimistic locking is retired in Phase 2: concurrent
// edits flow through the realtime CRDT layer (src/realtime.js); the only hard
// gate left is `final`, which freezes REST and realtime edits alike.
const express = require('express');
const { authRequired } = require('../auth');
const store = require('../store');
const ai = require('../aiClient');
const realtime = require('../realtime');
const { ah, loadWs } = require('../middleware');

const router = express.Router({ mergeParams: true });

// Which role may move a section INTO a given status.
const STATUS_ROLE = {
  sme_verified: ['sme', 'admin'],
  mb_reviewed: ['merchant_banker', 'admin'],
  legal_reviewed: ['legal_counsel', 'admin'],
  final: ['merchant_banker', 'admin'],
};

const findSection = ah(async (req, res, next) => {
  const s = await store.getSection(req.workspace.id, req.params.key);
  if (!s) return res.status(404).json({ error: 'section not found' });
  req.section = s;
  next();
});

// Finalised sections are immutable for everyone except an admin.
function frozen(req, res) {
  if (req.section.status === 'final' && req.user.role !== 'admin') {
    res.status(409).json({ error: 'section is final — reopening requires an admin' });
    return true;
  }
  return false;
}

router.get('/', authRequired, loadWs, ah(async (req, res) => {
  res.json({ sections: await store.listSections(req.workspace.id) });
}));

router.get('/:key', authRequired, loadWs, findSection, ah(async (req, res) => {
  const comments = await store.listSectionComments(req.section.id);
  res.json({ section: req.section, comments });
}));

// Generate (or regenerate) a section draft from structured data.
// Module 17: optional body.language drafts natively in that language.
router.post('/:key/generate', authRequired, loadWs, findSection, ah(async (req, res) => {
  if (frozen(req, res)) return;
  const language = (req.body && req.body.language) || 'en';
  try {
    const result = await ai.draft({
      section_key: req.section.section_key,
      ipo_data: await store.ipoDataMap(req.workspace.id),
      language,
    });
    const section = await store.updateSection(req.section.id, {
      content: result.content, status: 'ai_generated',
    });
    await store.createSectionVersion(req.section.id, {
      content: result.content,
      status: 'ai_generated',
      edited_by: req.user.id,
      change_note: `AI draft (${result.mode}${language !== 'en' ? `, ${language}` : ''})`,
    });
    realtime.resetRoomContent(req.workspace.id, req.section.section_key, result.content);
    await store.logActivity(req.workspace.id, req.user.id, 'section_generated', {
      section: req.section.section_key, mode: result.mode, language,
    });
    res.json({ section, missing: result.missing, mode: result.mode, citations: result.citations || [] });
  } catch (e) {
    res.status(502).json({ error: 'AI draft failed', detail: String(e) });
  }
}));

// Explicit save. Realtime already persists content continuously; this endpoint
// marks the SME pass and cuts an immutable version snapshot.
router.put('/:key', authRequired, loadWs, findSection, ah(async (req, res) => {
  if (frozen(req, res)) return;
  const content = typeof req.body.content === 'string' ? req.body.content : req.section.content;
  const status = ['sme', 'admin'].includes(req.user.role) ? 'sme_verified' : null;
  const section = await store.updateSection(req.section.id, { content, status });
  await store.createSectionVersion(req.section.id, {
    content,
    status: section.status,
    edited_by: req.user.id,
    change_note: (req.body && req.body.note) || 'Manual save',
  });
  await store.logActivity(req.workspace.id, req.user.id, 'section_edited', {
    section: req.section.section_key,
  });
  res.json({ section });
}));

// --- Version history (Module 19) ---

router.get('/:key/versions', authRequired, loadWs, findSection, ah(async (req, res) => {
  res.json({ versions: await store.listSectionVersions(req.section.id) });
}));

router.get('/:key/versions/:vid', authRequired, loadWs, findSection, ah(async (req, res) => {
  const version = await store.getSectionVersion(req.section.id, Number(req.params.vid));
  if (!version) return res.status(404).json({ error: 'version not found' });
  res.json({ version });
}));

router.post('/:key/versions/:vid/rollback', authRequired, loadWs, findSection, ah(async (req, res) => {
  if (frozen(req, res)) return;
  const version = await store.getSectionVersion(req.section.id, Number(req.params.vid));
  if (!version) return res.status(404).json({ error: 'version not found' });
  const content = version.content ?? '';
  const section = await store.updateSection(req.section.id, { content, status: 'sme_verified' });
  await store.createSectionVersion(req.section.id, {
    content,
    status: section.status,
    edited_by: req.user.id,
    change_note: `Rollback to v${version.version_no}`,
  });
  realtime.resetRoomContent(req.workspace.id, req.section.section_key, content);
  await store.logActivity(req.workspace.id, req.user.id, 'section_rollback', {
    section: req.section.section_key, version: version.version_no,
  });
  res.json({ section });
}));

// --- Locking endpoints (retired in Phase 2) ---
const lockGone = (_req, res) => res.status(410).json({
  error: 'pessimistic locks were removed in Phase 2 — sections use real-time collaborative editing (WebSocket /collab)',
});
router.post('/:key/lock', authRequired, loadWs, findSection, lockGone);
router.post('/:key/unlock', authRequired, loadWs, findSection, lockGone);

// Explicit status transition with role enforcement.
router.post('/:key/status', authRequired, loadWs, findSection, ah(async (req, res) => {
  const { status } = req.body || {};
  const allowed = STATUS_ROLE[status];
  if (!allowed) return res.status(400).json({ error: `status must be one of ${Object.keys(STATUS_ROLE).join(', ')}` });
  if (!allowed.includes(req.user.role)) return res.status(403).json({ error: `role ${req.user.role} cannot set ${status}` });
  if (frozen(req, res)) return;
  const section = await store.updateSection(req.section.id, { status });
  if (status === 'final') {
    await store.createSectionVersion(req.section.id, {
      content: section.content, status: 'final', edited_by: req.user.id, change_note: 'Finalised',
    });
  }
  await store.logActivity(req.workspace.id, req.user.id, 'section_status', {
    section: req.section.section_key, status,
  });
  res.json({ section });
}));

// --- Review & Collaboration (REV) ---
router.get('/:key/comments', authRequired, loadWs, findSection, ah(async (req, res) => {
  res.json({ comments: await store.listSectionComments(req.section.id) });
}));

router.post('/:key/comments', authRequired, loadWs, findSection, ah(async (req, res) => {
  const { action, body } = req.body || {};
  const ACTIONS = ['comment', 'change_request', 'approve', 'reject'];
  if (!ACTIONS.includes(action)) return res.status(400).json({ error: `action must be one of ${ACTIONS.join(', ')}` });
  // Only reviewers may approve / reject / request changes; anyone may plain-comment.
  if (['approve', 'reject', 'change_request'].includes(action)
      && !['merchant_banker', 'legal_counsel', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: `role ${req.user.role} cannot ${action.replace('_', ' ')}` });
  }

  const comment = await store.addReviewComment(req.section.id, req.user.id, action, body);

  // Approve advances status per reviewer role; reject/change_request sends it back to SME.
  let section = req.section;
  let newStatus = null;
  if (action === 'approve') {
    if (req.user.role === 'merchant_banker') newStatus = 'mb_reviewed';
    else if (req.user.role === 'legal_counsel') newStatus = 'legal_reviewed';
  } else if (action === 'reject' || action === 'change_request') {
    newStatus = 'sme_verified';
  }
  if (newStatus) section = await store.updateSection(req.section.id, { status: newStatus });

  await store.logActivity(req.workspace.id, req.user.id, 'review_action', {
    section: req.section.section_key, action,
  });
  const author = { id: req.user.id, email: req.user.email, full_name: req.user.name, role: req.user.role };
  res.status(201).json({ comment: { ...comment, author }, section });
}));

module.exports = router;
