// GitHub-style collaboration: access requests, issues, and commits.
//   workspace router  -> mounted at /api/workspaces/:id  (requests/issues/commits within a workspace)
//   requests router   -> mounted at /api/requests        (a reviewer's cross-workspace inbox)
const express = require('express');
const { authRequired } = require('../auth');
const store = require('../store');

const { db } = store;

function loadWs(req, res, next) {
  const id = Number(req.params.id);
  const ws = db.workspaces.find((w) => w.id === id);
  if (!ws) return res.status(404).json({ error: 'workspace not found' });
  if (!store.isMember(id, req.user.id)) return res.status(403).json({ error: 'not a workspace member' });
  req.workspace = ws;
  next();
}

const withAuthor = (rows) => rows.map((r) => ({
  ...r, author: store.publicUser(db.users.find((u) => u.id === r.author_id)),
}));

// ===================== workspace-scoped router =====================
const workspace = express.Router({ mergeParams: true });

// --- Access requests (company invites its legal advisor + merchant banker) ---
// Only the workspace creator (the company/SME) may request collaborators.
workspace.post('/requests', authRequired, loadWs, (req, res) => {
  if (req.workspace.created_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'only the company (workspace creator) can request collaborators' });
  }
  const { target_email, target_role, message } = req.body || {};
  if (!target_email || !['merchant_banker', 'legal_counsel'].includes(target_role)) {
    return res.status(400).json({ error: 'target_email and target_role (merchant_banker | legal_counsel) required' });
  }
  const target = store.findUserByEmail(target_email);
  if (target && store.isMember(req.workspace.id, target.id)) return res.status(409).json({ error: 'already a member' });
  const existing = db.accessRequests.find((r) => r.workspace_id === req.workspace.id
    && r.target_email === target_email.toLowerCase() && r.status === 'pending');
  if (existing) return res.status(409).json({ error: 'a pending request to this person already exists' });

  const request = {
    id: store.nextId('request'),
    workspace_id: req.workspace.id,
    requester_id: req.user.id,
    target_email: target_email.toLowerCase(),
    target_role,
    message: message || '',
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  db.accessRequests.push(request);
  store.logActivity(req.workspace.id, req.user.id, 'access_requested', { target_email: request.target_email, role: target_role });
  res.status(201).json({ request });
});

workspace.get('/requests', authRequired, loadWs, (req, res) => {
  res.json({ requests: db.accessRequests.filter((r) => r.workspace_id === req.workspace.id) });
});

// --- Issues ---
workspace.get('/issues', authRequired, loadWs, (req, res) => {
  const issues = withAuthor(db.issues.filter((i) => i.workspace_id === req.workspace.id))
    .map((i) => ({ ...i, comments: db.issueComments.filter((c) => c.issue_id === i.id).length }));
  res.json({ issues });
});

workspace.post('/issues', authRequired, loadWs, (req, res) => {
  const { title, body, section_key } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const issue = {
    id: store.nextId('issue'),
    workspace_id: req.workspace.id,
    author_id: req.user.id,
    title,
    body: body || '',
    section_key: section_key || null,
    status: 'open',
    created_at: new Date().toISOString(),
  };
  db.issues.push(issue);
  store.logActivity(req.workspace.id, req.user.id, 'issue_opened', { title });
  res.status(201).json({ issue });
});

workspace.get('/issues/:iid', authRequired, loadWs, (req, res) => {
  const issue = db.issues.find((i) => i.id === Number(req.params.iid) && i.workspace_id === req.workspace.id);
  if (!issue) return res.status(404).json({ error: 'issue not found' });
  const comments = withAuthor(db.issueComments.filter((c) => c.issue_id === issue.id));
  res.json({ issue: withAuthor([issue])[0], comments });
});

workspace.post('/issues/:iid/comments', authRequired, loadWs, (req, res) => {
  const issue = db.issues.find((i) => i.id === Number(req.params.iid) && i.workspace_id === req.workspace.id);
  if (!issue) return res.status(404).json({ error: 'issue not found' });
  const comment = {
    id: store.nextId('issueComment'), issue_id: issue.id, author_id: req.user.id,
    body: (req.body && req.body.body) || '', created_at: new Date().toISOString(),
  };
  db.issueComments.push(comment);
  res.status(201).json({ comment: withAuthor([comment])[0] });
});

// Close / reopen — author, a merchant banker, or admin.
workspace.post('/issues/:iid/status', authRequired, loadWs, (req, res) => {
  const issue = db.issues.find((i) => i.id === Number(req.params.iid) && i.workspace_id === req.workspace.id);
  if (!issue) return res.status(404).json({ error: 'issue not found' });
  const { status } = req.body || {};
  if (!['open', 'closed'].includes(status)) return res.status(400).json({ error: 'status must be open | closed' });
  if (issue.author_id !== req.user.id && !['merchant_banker', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'only the author or a merchant banker can change issue status' });
  }
  issue.status = status;
  store.logActivity(req.workspace.id, req.user.id, 'issue_status', { title: issue.title, status });
  res.json({ issue });
});

// --- Commits (a recorded, signed change to the draft — merchant-banker familiar) ---
workspace.get('/commits', authRequired, loadWs, (req, res) => {
  const commits = withAuthor(db.commits.filter((c) => c.workspace_id === req.workspace.id)).reverse();
  res.json({ commits });
});

workspace.post('/commits', authRequired, loadWs, (req, res) => {
  const { message, section_key } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });
  const commit = {
    id: store.nextId('commit'),
    workspace_id: req.workspace.id,
    author_id: req.user.id,
    message,
    section_key: section_key || null,
    created_at: new Date().toISOString(),
  };
  db.commits.push(commit);
  store.logActivity(req.workspace.id, req.user.id, 'commit', { message, section: section_key || null });
  res.status(201).json({ commit: withAuthor([commit])[0] });
});

// ===================== cross-workspace requests inbox =====================
const requests = express.Router();

function decorate(r) {
  const ws = db.workspaces.find((w) => w.id === r.workspace_id);
  return {
    ...r,
    company_name: ws ? ws.company_name : '(unknown)',
    requester: store.publicUser(db.users.find((u) => u.id === r.requester_id)),
  };
}

// Requests addressed to me (by email) that are still pending.
requests.get('/incoming', authRequired, (req, res) => {
  const mine = db.accessRequests.filter((r) => r.target_email === req.user.email && r.status === 'pending');
  res.json({ requests: mine.map(decorate) });
});

// Requests I raised as a company, across my workspaces.
requests.get('/outgoing', authRequired, (req, res) => {
  const mine = db.accessRequests.filter((r) => r.requester_id === req.user.id);
  res.json({ requests: mine.map(decorate) });
});

function resolveRequest(action) {
  return (req, res) => {
    const r = db.accessRequests.find((x) => x.id === Number(req.params.rid));
    if (!r) return res.status(404).json({ error: 'request not found' });
    if (r.target_email !== req.user.email) return res.status(403).json({ error: 'this request is not addressed to you' });
    if (r.status !== 'pending') return res.status(409).json({ error: `request already ${r.status}` });
    r.status = action === 'accept' ? 'accepted' : 'declined';
    if (action === 'accept') {
      store.addMember(r.workspace_id, req.user.id, r.target_role, r.requester_id);
      store.logActivity(r.workspace_id, req.user.id, 'access_accepted', { role: r.target_role });
    } else {
      store.logActivity(r.workspace_id, req.user.id, 'access_declined', {});
    }
    res.json({ request: decorate(r) });
  };
}

requests.post('/:rid/accept', authRequired, resolveRequest('accept'));
requests.post('/:rid/decline', authRequired, resolveRequest('decline'));

module.exports = { workspace, requests };
