// GitHub-style collaboration: access requests, issues, and commits.
//   workspace router  -> mounted at /api/workspaces/:id  (requests/issues/commits within a workspace)
//   requests router   -> mounted at /api/requests        (a reviewer's cross-workspace inbox)
const express = require('express');
const { authRequired } = require('../auth');
const store = require('../store');
const { ah, loadWs } = require('../middleware');

// ===================== workspace-scoped router =====================
const workspace = express.Router({ mergeParams: true });

// --- Access requests (company invites its legal advisor + merchant banker) ---
// Only the workspace creator (the company/SME) may request collaborators.
workspace.post('/requests', authRequired, loadWs, ah(async (req, res) => {
  if (req.workspace.created_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'only the company (workspace creator) can request collaborators' });
  }
  const { target_email, target_role, message } = req.body || {};
  if (!target_email || !['merchant_banker', 'legal_counsel'].includes(target_role)) {
    return res.status(400).json({ error: 'target_email and target_role (merchant_banker | legal_counsel) required' });
  }
  const target = await store.findUserByEmail(target_email);
  if (target && await store.isMember(req.workspace.id, target.id)) {
    return res.status(409).json({ error: 'already a member' });
  }
  if (await store.findPendingRequest(req.workspace.id, target_email)) {
    return res.status(409).json({ error: 'a pending request to this person already exists' });
  }

  const request = await store.createAccessRequest({
    workspace_id: req.workspace.id,
    requester_id: req.user.id,
    target_email,
    target_role,
    message,
  });
  await store.logActivity(req.workspace.id, req.user.id, 'access_requested', {
    target_email: request.target_email, role: target_role,
  });
  res.status(201).json({ request });
}));

workspace.get('/requests', authRequired, loadWs, ah(async (req, res) => {
  res.json({ requests: await store.listWorkspaceRequests(req.workspace.id) });
}));

// --- Issues ---
workspace.get('/issues', authRequired, loadWs, ah(async (req, res) => {
  res.json({ issues: await store.listIssues(req.workspace.id) });
}));

workspace.post('/issues', authRequired, loadWs, ah(async (req, res) => {
  const { title, body, section_key } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const issue = await store.createIssue({
    workspace_id: req.workspace.id, author_id: req.user.id, title, body, section_key,
  });
  await store.logActivity(req.workspace.id, req.user.id, 'issue_opened', { title });
  res.status(201).json({ issue });
}));

workspace.get('/issues/:iid', authRequired, loadWs, ah(async (req, res) => {
  const issue = await store.getIssue(req.workspace.id, Number(req.params.iid));
  if (!issue) return res.status(404).json({ error: 'issue not found' });
  const comments = await store.listIssueComments(issue.id);
  res.json({ issue, comments });
}));

workspace.post('/issues/:iid/comments', authRequired, loadWs, ah(async (req, res) => {
  const issue = await store.getIssue(req.workspace.id, Number(req.params.iid));
  if (!issue) return res.status(404).json({ error: 'issue not found' });
  const comment = await store.addIssueComment(issue.id, req.user.id, (req.body && req.body.body) || '');
  const author = { id: req.user.id, email: req.user.email, full_name: req.user.name, role: req.user.role };
  res.status(201).json({ comment: { ...comment, author } });
}));

// Close / reopen — author, a merchant banker, or admin.
workspace.post('/issues/:iid/status', authRequired, loadWs, ah(async (req, res) => {
  const issue = await store.getIssue(req.workspace.id, Number(req.params.iid));
  if (!issue) return res.status(404).json({ error: 'issue not found' });
  const { status } = req.body || {};
  if (!['open', 'closed'].includes(status)) return res.status(400).json({ error: 'status must be open | closed' });
  if (issue.author_id !== req.user.id && !['merchant_banker', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'only the author or a merchant banker can change issue status' });
  }
  const updated = await store.setIssueStatus(issue.id, status);
  await store.logActivity(req.workspace.id, req.user.id, 'issue_status', { title: issue.title, status });
  res.json({ issue: updated });
}));

// --- Commits (a recorded, signed change to the draft — merchant-banker familiar) ---
workspace.get('/commits', authRequired, loadWs, ah(async (req, res) => {
  res.json({ commits: await store.listCommits(req.workspace.id) });
}));

workspace.post('/commits', authRequired, loadWs, ah(async (req, res) => {
  const { message, section_key } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });
  const commit = await store.createCommit({
    workspace_id: req.workspace.id, author_id: req.user.id, message, section_key,
  });
  await store.logActivity(req.workspace.id, req.user.id, 'commit', {
    message, section: section_key || null,
  });
  const author = { id: req.user.id, email: req.user.email, full_name: req.user.name, role: req.user.role };
  res.status(201).json({ commit: { ...commit, author } });
}));

// ===================== cross-workspace requests inbox =====================
const requests = express.Router();

// Requests addressed to me (by email) that are still pending.
requests.get('/incoming', authRequired, ah(async (req, res) => {
  res.json({ requests: await store.listIncomingRequests(req.user.email) });
}));

// Requests I raised as a company, across my workspaces.
requests.get('/outgoing', authRequired, ah(async (req, res) => {
  res.json({ requests: await store.listOutgoingRequests(req.user.id) });
}));

function resolveRequest(action) {
  return ah(async (req, res) => {
    const r = await store.getAccessRequest(Number(req.params.rid));
    if (!r) return res.status(404).json({ error: 'request not found' });
    if (r.target_email !== req.user.email) return res.status(403).json({ error: 'this request is not addressed to you' });
    if (r.status !== 'pending') return res.status(409).json({ error: `request already ${r.status}` });
    const status = action === 'accept' ? 'accepted' : 'declined';
    await store.setRequestStatus(r.id, status);
    if (action === 'accept') {
      await store.addMember(r.workspace_id, req.user.id, r.target_role, r.requester_id);
      await store.logActivity(r.workspace_id, req.user.id, 'access_accepted', { role: r.target_role });
    } else {
      await store.logActivity(r.workspace_id, req.user.id, 'access_declined', {});
    }
    res.json({ request: { ...r, status } });
  });
}

requests.post('/:rid/accept', authRequired, resolveRequest('accept'));
requests.post('/:rid/decline', authRequired, resolveRequest('decline'));

module.exports = { workspace, requests };
