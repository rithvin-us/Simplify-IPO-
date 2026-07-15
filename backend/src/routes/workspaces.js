// /api/workspaces — workspace lifecycle, membership, wizard data, validation,
// consistency engine (Module 16), dashboard.
const express = require('express');
const { authRequired, requireRole } = require('../auth');
const store = require('../store');
const ai = require('../aiClient');
const { validateBatch } = require('../fieldSchema');
const { ah, loadWs } = require('../middleware');

const router = express.Router();

// Create a workspace (SME) and seed its DRHP sections.
router.post('/', authRequired, requireRole('sme', 'admin'), ah(async (req, res) => {
  const { company_name, cin } = req.body || {};
  if (!company_name) return res.status(400).json({ error: 'company_name required' });
  const ws = await store.createWorkspace({
    company_name, cin, created_by: req.user.id, creator_role: req.user.role,
  });
  await store.logActivity(ws.id, req.user.id, 'workspace_created', { company_name });
  res.status(201).json(ws);
}));

// List workspaces the caller can see.
router.get('/', authRequired, ah(async (req, res) => {
  const list = await store.listWorkspacesFor(req.user.id);
  const withHealth = await Promise.all(
    list.map(async (w) => ({ ...w, health: (await store.computeHealth(w.id)).score })),
  );
  res.json(withHealth);
}));

router.get('/:id', authRequired, loadWs, ah(async (req, res) => {
  const id = req.workspace.id;
  const [members, sections, health] = await Promise.all([
    store.listMembers(id), store.listSections(id), store.computeHealth(id),
  ]);
  res.json({ workspace: req.workspace, members, sections, health });
}));

// Invite a member (creator or merchant banker) by email.
router.post('/:id/members', authRequired, loadWs, ah(async (req, res) => {
  if (req.workspace.created_by !== req.user.id && !['merchant_banker', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'only the workspace creator or a merchant banker can invite members' });
  }
  const { email, member_role } = req.body || {};
  const user = await store.findUserByEmail(email || '');
  if (!user) return res.status(404).json({ error: 'no user with that email' });
  const added = await store.addMember(req.workspace.id, user.id, member_role || user.role, req.user.id);
  if (!added) return res.status(409).json({ error: 'already a member' });
  await store.logActivity(req.workspace.id, req.user.id, 'member_invited', {
    email: user.email, role: member_role || user.role,
  });
  res.status(201).json({ ok: true, member: store.publicUser(user) });
}));

// --- Wizard data (structured IPO fields) ---
router.get('/:id/data', authRequired, loadWs, ah(async (req, res) => {
  res.json({ data: await store.ipoDataMap(req.workspace.id) });
}));

// Autosave a batch of fields. body: { fields: { "company.name": "...", ... } }
// Values are type-checked against the field schema; invalid -> 422 with per-field errors.
router.put('/:id/data', authRequired, loadWs, ah(async (req, res) => {
  const fields = (req.body && req.body.fields) || {};
  const { errors } = await validateBatch(fields);
  if (Object.keys(errors).length) return res.status(422).json({ error: 'validation failed', errors });
  let n = 0;
  for (const [key, value] of Object.entries(fields)) {
    await store.upsertIpoData(req.workspace.id, key, String(value), req.user.id);
    n += 1;
  }
  await store.logActivity(req.workspace.id, req.user.id, 'data_saved', { fields: n });
  res.json({ ok: true, saved: n, data: await store.ipoDataMap(req.workspace.id) });
}));

// --- Validation engine ---
router.post('/:id/validate', authRequired, loadWs, ah(async (req, res) => {
  try {
    const result = await ai.validate({
      ipo_data: await store.ipoDataMap(req.workspace.id),
      tracked_sources: await store.trackedSources(req.workspace.id),
    });
    // Replace this workspace's flags with the fresh run.
    const flags = await store.replaceFlags(req.workspace.id, result.flags);
    await store.logActivity(req.workspace.id, req.user.id, 'validation_run', {
      flags: result.count, mode: result.mode,
    });
    res.json({ mode: result.mode, flags });
  } catch (e) {
    res.status(502).json({ error: 'AI validation failed', detail: String(e) });
  }
}));

router.get('/:id/flags', authRequired, loadWs, ah(async (req, res) => {
  res.json({ flags: await store.listFlags(req.workspace.id) });
}));

router.post('/:id/flags/:flagId/resolve', authRequired, loadWs, ah(async (req, res) => {
  const flag = await store.resolveFlag(req.workspace.id, Number(req.params.flagId));
  if (!flag) return res.status(404).json({ error: 'flag not found' });
  res.json({ ok: true, flag });
}));

// --- Consistency engine (Module 16): whole-draft cross-section analysis ---
router.post('/:id/consistency', authRequired, loadWs, ah(async (req, res) => {
  const id = req.workspace.id;
  const [sections, ipoData] = await Promise.all([
    store.listSections(id), store.ipoDataMap(id),
  ]);
  try {
    const result = await ai.consistency({
      company_name: req.workspace.company_name,
      ipo_data: ipoData,
      sections: sections
        .filter((s) => s.content)
        .map((s) => ({ section_key: s.section_key, title: s.title, content: s.content, status: s.status })),
    });
    await store.logActivity(id, req.user.id, 'consistency_run', {
      findings: result.count, mode: result.mode,
    });
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: 'AI consistency check failed', detail: String(e) });
  }
}));

// --- Dashboard (health score + activity feed) ---
router.get('/:id/dashboard', authRequired, loadWs, ah(async (req, res) => {
  const id = req.workspace.id;
  const [health, sections, flags, activity] = await Promise.all([
    store.computeHealth(id),
    store.listSections(id),
    store.listFlags(id),
    store.listActivity(id, 25),
  ]);
  res.json({
    health,
    sections: sections.map((s) => ({
      section_key: s.section_key, title: s.title, status: s.status, owner_role: s.owner_role,
    })),
    open_flags: flags.filter((f) => !f.resolved).length,
    total_flags: flags.length,
    activity,
  });
}));

module.exports = router;
