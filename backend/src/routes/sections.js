// /api/workspaces/:id/sections — draft generation, ownership/locking, review workflow.
const express = require('express');
const { authRequired } = require('../auth');
const store = require('../store');
const ai = require('../aiClient');

const { db } = store;
const router = express.Router({ mergeParams: true });

// Which role may move a section INTO a given status.
const STATUS_ROLE = {
  sme_verified: ['sme', 'admin'],
  mb_reviewed: ['merchant_banker', 'admin'],
  legal_reviewed: ['legal_counsel', 'admin'],
  final: ['merchant_banker', 'admin'],
};

function loadWs(req, res, next) {
  const id = Number(req.params.id);
  const ws = db.workspaces.find((w) => w.id === id);
  if (!ws) return res.status(404).json({ error: 'workspace not found' });
  if (!store.isMember(id, req.user.id)) return res.status(403).json({ error: 'not a workspace member' });
  req.workspace = ws;
  next();
}

function findSection(req, res, next) {
  const s = db.sections.find(
    (x) => x.workspace_id === req.workspace.id && x.section_key === req.params.key,
  );
  if (!s) return res.status(404).json({ error: 'section not found' });
  req.section = s;
  next();
}

// Reject edits/transitions on a section locked by someone else.
function notLockedByOther(req, res) {
  const s = req.section;
  if (s.locked_by && s.locked_by !== req.user.id) {
    res.status(423).json({ error: `section locked by user ${s.locked_by}` });
    return false;
  }
  return true;
}

router.get('/', authRequired, loadWs, (req, res) => {
  res.json({ sections: db.sections.filter((s) => s.workspace_id === req.workspace.id) });
});

router.get('/:key', authRequired, loadWs, findSection, (req, res) => {
  const comments = db.reviewComments
    .filter((c) => c.section_id === req.section.id)
    .map((c) => ({ ...c, author: store.publicUser(db.users.find((u) => u.id === c.author_id)) }));
  res.json({ section: req.section, comments });
});

// Generate (or regenerate) a section draft from structured data.
router.post('/:key/generate', authRequired, loadWs, findSection, async (req, res) => {
  if (!notLockedByOther(req, res)) return;
  try {
    const result = await ai.draft({
      section_key: req.section.section_key,
      ipo_data: store.ipoDataMap(req.workspace.id),
    });
    req.section.content = result.content;
    req.section.status = 'ai_generated';
    store.logActivity(req.workspace.id, req.user.id, 'section_generated', { section: req.section.section_key, mode: result.mode });
    res.json({ section: req.section, missing: result.missing, mode: result.mode });
  } catch (e) {
    res.status(502).json({ error: 'AI draft failed', detail: String(e) });
  }
});

// Edit section content (SME). Marks it verified.
router.put('/:key', authRequired, loadWs, findSection, (req, res) => {
  if (!notLockedByOther(req, res)) return;
  if (typeof req.body.content === 'string') req.section.content = req.body.content;
  if (['sme', 'admin'].includes(req.user.role)) req.section.status = 'sme_verified';
  store.logActivity(req.workspace.id, req.user.id, 'section_edited', { section: req.section.section_key });
  res.json({ section: req.section });
});

router.post('/:key/lock', authRequired, loadWs, findSection, (req, res) => {
  if (!notLockedByOther(req, res)) return;
  req.section.locked_by = req.user.id;
  req.section.locked_at = new Date().toISOString();
  res.json({ section: req.section });
});

router.post('/:key/unlock', authRequired, loadWs, findSection, (req, res) => {
  if (req.section.locked_by && req.section.locked_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(423).json({ error: 'only the locking user or an admin can unlock' });
  }
  req.section.locked_by = null;
  req.section.locked_at = null;
  res.json({ section: req.section });
});

// Explicit status transition with role enforcement.
router.post('/:key/status', authRequired, loadWs, findSection, (req, res) => {
  const { status } = req.body || {};
  const allowed = STATUS_ROLE[status];
  if (!allowed) return res.status(400).json({ error: `status must be one of ${Object.keys(STATUS_ROLE).join(', ')}` });
  if (!allowed.includes(req.user.role)) return res.status(403).json({ error: `role ${req.user.role} cannot set ${status}` });
  if (!notLockedByOther(req, res)) return;
  req.section.status = status;
  if (status === 'final') { req.section.locked_by = req.user.id; req.section.locked_at = new Date().toISOString(); }
  store.logActivity(req.workspace.id, req.user.id, 'section_status', { section: req.section.section_key, status });
  res.json({ section: req.section });
});

// --- Review & Collaboration (REV) ---
router.get('/:key/comments', authRequired, loadWs, findSection, (req, res) => {
  const comments = db.reviewComments
    .filter((c) => c.section_id === req.section.id)
    .map((c) => ({ ...c, author: store.publicUser(db.users.find((u) => u.id === c.author_id)) }));
  res.json({ comments });
});

router.post('/:key/comments', authRequired, loadWs, findSection, (req, res) => {
  const { action, body } = req.body || {};
  const ACTIONS = ['comment', 'change_request', 'approve', 'reject'];
  if (!ACTIONS.includes(action)) return res.status(400).json({ error: `action must be one of ${ACTIONS.join(', ')}` });
  // Only reviewers may approve / reject / request changes; anyone may plain-comment.
  if (['approve', 'reject', 'change_request'].includes(action)
      && !['merchant_banker', 'legal_counsel', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: `role ${req.user.role} cannot ${action.replace('_', ' ')}` });
  }

  const comment = {
    id: store.nextId('comment'),
    section_id: req.section.id,
    author_id: req.user.id,
    action,
    body: body || '',
    created_at: new Date().toISOString(),
  };
  db.reviewComments.push(comment);

  // Approve advances status per reviewer role; reject/change_request sends it back to SME.
  if (action === 'approve') {
    if (req.user.role === 'merchant_banker') req.section.status = 'mb_reviewed';
    else if (req.user.role === 'legal_counsel') req.section.status = 'legal_reviewed';
  } else if (action === 'reject' || action === 'change_request') {
    req.section.status = 'sme_verified';
  }
  store.logActivity(req.workspace.id, req.user.id, 'review_action', { section: req.section.section_key, action });
  res.status(201).json({ comment, section: req.section });
});

module.exports = router;
