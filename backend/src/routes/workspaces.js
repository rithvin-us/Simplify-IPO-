// /api/workspaces — workspace lifecycle, membership, wizard data, validation, dashboard.
const express = require('express');
const { authRequired, requireRole } = require('../auth');
const store = require('../store');
const ai = require('../aiClient');
const { validateBatch } = require('../fieldSchema');

const { db } = store;
const router = express.Router();

// Resolve :id, enforce membership, attach req.workspace.
function loadWs(req, res, next) {
  const id = Number(req.params.id);
  const ws = db.workspaces.find((w) => w.id === id);
  if (!ws) return res.status(404).json({ error: 'workspace not found' });
  if (!store.isMember(id, req.user.id)) return res.status(403).json({ error: 'not a workspace member' });
  req.workspace = ws;
  next();
}

// Create a workspace (SME) and seed its DRHP sections.
router.post('/', authRequired, requireRole('sme', 'admin'), (req, res) => {
  const { company_name, cin } = req.body || {};
  if (!company_name) return res.status(400).json({ error: 'company_name required' });
  const ws = {
    id: store.nextId('workspace'),
    company_name,
    cin: cin || null,
    created_by: req.user.id,
    payment_state: 'unpaid',
    created_at: new Date().toISOString(),
  };
  db.workspaces.push(ws);
  db.members.push({ workspace_id: ws.id, user_id: req.user.id, member_role: req.user.role });
  for (const s of store.SECTIONS) {
    db.sections.push({
      id: store.nextId('section'),
      workspace_id: ws.id,
      section_key: s.key,
      title: s.title,
      content: null,
      status: 'empty',
      owner_role: s.owner_role,
      locked_by: null,
    });
  }
  store.logActivity(ws.id, req.user.id, 'workspace_created', { company_name });
  res.status(201).json(ws);
});

// List workspaces the caller can see.
router.get('/', authRequired, (req, res) => {
  const list = db.workspaces
    .filter((w) => store.isMember(w.id, req.user.id))
    .map((w) => ({ ...w, health: store.computeHealth(w.id).score }));
  res.json(list);
});

router.get('/:id', authRequired, loadWs, (req, res) => {
  const id = req.workspace.id;
  const members = db.members
    .filter((m) => m.workspace_id === id)
    .map((m) => ({ ...m, user: store.publicUser(db.users.find((u) => u.id === m.user_id)) }));
  const sections = db.sections.filter((s) => s.workspace_id === id);
  res.json({ workspace: req.workspace, members, sections, health: store.computeHealth(id) });
});

// Invite a member (creator or merchant banker) by email.
router.post('/:id/members', authRequired, loadWs, (req, res) => {
  if (req.workspace.created_by !== req.user.id && !['merchant_banker', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'only the workspace creator or a merchant banker can invite members' });
  }
  const { email, member_role } = req.body || {};
  const user = store.findUserByEmail(email || '');
  if (!user) return res.status(404).json({ error: 'no user with that email' });
  if (store.isMember(req.workspace.id, user.id)) return res.status(409).json({ error: 'already a member' });
  db.members.push({
    workspace_id: req.workspace.id,
    user_id: user.id,
    member_role: member_role || user.role,
    invited_by: req.user.id,
    joined_at: new Date().toISOString(),
  });
  store.logActivity(req.workspace.id, req.user.id, 'member_invited', { email: user.email, role: member_role || user.role });
  res.status(201).json({ ok: true, member: store.publicUser(user) });
});

// --- Wizard data (structured IPO fields) ---
router.get('/:id/data', authRequired, loadWs, (req, res) => {
  res.json({ data: store.ipoDataMap(req.workspace.id) });
});

// Autosave a batch of fields. body: { fields: { "company.name": "...", ... } }
// Values are type-checked against the field schema; invalid -> 422 with per-field errors.
router.put('/:id/data', authRequired, loadWs, async (req, res) => {
  const fields = (req.body && req.body.fields) || {};
  const { errors } = await validateBatch(fields);
  if (Object.keys(errors).length) return res.status(422).json({ error: 'validation failed', errors });
  let n = 0;
  for (const [key, value] of Object.entries(fields)) {
    store.upsertIpoData(req.workspace.id, key, String(value), req.user.id);
    n += 1;
  }
  store.logActivity(req.workspace.id, req.user.id, 'data_saved', { fields: n });
  res.json({ ok: true, saved: n, data: store.ipoDataMap(req.workspace.id) });
});

// --- Validation engine ---
router.post('/:id/validate', authRequired, loadWs, async (req, res) => {
  try {
    const result = await ai.validate({
      ipo_data: store.ipoDataMap(req.workspace.id),
      tracked_sources: store.trackedSources(req.workspace.id),
    });
    // Replace this workspace's flags with the fresh run.
    db.validationFlags = db.validationFlags.filter((v) => v.workspace_id !== req.workspace.id);
    for (const f of result.flags) {
      db.validationFlags.push({
        id: store.nextId('flag'),
        workspace_id: req.workspace.id,
        field_key: f.field_key || null,
        section_key: f.section_key || null,
        issue_type: f.issue_type,
        reason: f.reason,
        resolved: false,
      });
    }
    store.logActivity(req.workspace.id, req.user.id, 'validation_run', { flags: result.count, mode: result.mode });
    res.json({ mode: result.mode, flags: db.validationFlags.filter((v) => v.workspace_id === req.workspace.id) });
  } catch (e) {
    res.status(502).json({ error: 'AI validation failed', detail: String(e) });
  }
});

router.get('/:id/flags', authRequired, loadWs, (req, res) => {
  res.json({ flags: db.validationFlags.filter((v) => v.workspace_id === req.workspace.id) });
});

router.post('/:id/flags/:flagId/resolve', authRequired, loadWs, (req, res) => {
  const flag = db.validationFlags.find(
    (v) => v.id === Number(req.params.flagId) && v.workspace_id === req.workspace.id,
  );
  if (!flag) return res.status(404).json({ error: 'flag not found' });
  flag.resolved = true;
  res.json({ ok: true, flag });
});

// --- Dashboard (health score + activity feed) ---
router.get('/:id/dashboard', authRequired, loadWs, (req, res) => {
  const id = req.workspace.id;
  const activity = db.activity
    .filter((a) => a.workspace_id === id)
    .slice(-25)
    .reverse()
    .map((a) => ({ ...a, actor: store.publicUser(db.users.find((u) => u.id === a.actor_id)) }));
  const sections = db.sections.filter((s) => s.workspace_id === id)
    .map((s) => ({ section_key: s.section_key, title: s.title, status: s.status, owner_role: s.owner_role }));
  const flags = db.validationFlags.filter((v) => v.workspace_id === id);
  res.json({
    health: store.computeHealth(id),
    sections,
    open_flags: flags.filter((f) => !f.resolved).length,
    total_flags: flags.length,
    activity,
  });
});

module.exports = router;
