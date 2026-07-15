// Data access layer over PostgreSQL (Phase 2). Replaces the Phase 1 in-memory
// arrays; every function is async and maps 1:1 onto database/schema.sql plus
// the Phase 2 migrations. Route modules never touch SQL directly — they call
// these repository functions.
const { query, tx, pool } = require('./db');
const { hashPassword } = require('./auth');

// DRHP section catalogue (mirrors ai-service/app/schema.py SECTIONS).
const SECTIONS = [
  { key: 'company_overview', title: 'Company Overview', owner_role: 'sme' },
  { key: 'business', title: 'Our Business', owner_role: 'sme' },
  { key: 'financial_summary', title: 'Financial Information', owner_role: 'sme' },
  { key: 'risk_factors', title: 'Risk Factors', owner_role: 'legal_counsel' },
  { key: 'objects_of_issue', title: 'Objects of the Issue', owner_role: 'merchant_banker' },
];

// Required-document checklist (DOC module). category -> label.
const REQUIRED_DOC_CATEGORIES = [
  { category: 'corporate', label: 'Certificate of Incorporation / MOA-AOA' },
  { category: 'financial', label: 'Audited / restated financial statements' },
  { category: 'legal', label: 'Litigation & statutory approvals summary' },
];

const one = (r) => r.rows[0] || null;
const all = (r) => r.rows;

// SQL fragment: author columns as a JSON object (avoids N+1 user lookups).
const AUTHOR_JSON = (alias = 'u') =>
  `json_build_object('id', ${alias}.id, 'email', ${alias}.email, 'full_name', ${alias}.full_name, 'role', ${alias}.role)`;

// ---------------------------------------------------------------- users ----

function publicUser(u) {
  return u && { id: u.id, email: u.email, full_name: u.full_name, role: u.role };
}

async function createUser({ email, password, full_name, role }) {
  return one(await query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [String(email).toLowerCase(), hashPassword(password), full_name, role],
  ));
}

async function findUserByEmail(email) {
  return one(await query('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase()]));
}

async function getUserById(id) {
  return one(await query('SELECT * FROM users WHERE id = $1', [id]));
}

async function setMfaSecret(userId, secret) {
  await query('UPDATE users SET mfa_secret = $2, mfa_enabled = false WHERE id = $1', [userId, secret]);
}

async function setMfaEnabled(userId, enabled) {
  if (enabled) {
    await query('UPDATE users SET mfa_enabled = true WHERE id = $1', [userId]);
  } else {
    await query('UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE id = $1', [userId]);
  }
}

// ----------------------------------------------------------- workspaces ----

async function getWorkspace(id) {
  return one(await query('SELECT * FROM ipo_workspaces WHERE id = $1', [id]));
}

async function isMember(workspace_id, user_id) {
  const r = await query(
    `SELECT 1 FROM ipo_workspaces w
     LEFT JOIN workspace_members m ON m.workspace_id = w.id AND m.user_id = $2
     WHERE w.id = $1 AND (w.created_by = $2 OR m.user_id IS NOT NULL)
     LIMIT 1`,
    [workspace_id, user_id],
  );
  return r.rows.length > 0;
}

async function addMember(workspace_id, user_id, member_role, invited_by) {
  if (await isMember(workspace_id, user_id)) return false;
  await query(
    `INSERT INTO workspace_members (workspace_id, user_id, member_role, invited_by, joined_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (workspace_id, user_id) DO NOTHING`,
    [workspace_id, user_id, member_role, invited_by ?? null],
  );
  return true;
}

async function listMembers(workspace_id) {
  return all(await query(
    `SELECT m.*, ${AUTHOR_JSON('u')} AS user
     FROM workspace_members m JOIN users u ON u.id = m.user_id
     WHERE m.workspace_id = $1 ORDER BY m.joined_at NULLS FIRST`,
    [workspace_id],
  ));
}

// Creates the workspace, self-membership and the section skeleton atomically.
async function createWorkspace({ company_name, cin, created_by, creator_role }) {
  return tx(async (client) => {
    const ws = (await client.query(
      `INSERT INTO ipo_workspaces (company_name, cin, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [company_name, cin || null, created_by],
    )).rows[0];
    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, member_role, joined_at)
       VALUES ($1, $2, $3, now())`,
      [ws.id, created_by, creator_role],
    );
    for (const s of SECTIONS) {
      await client.query(
        `INSERT INTO sections (workspace_id, section_key, title, status, owner_role)
         VALUES ($1, $2, $3, 'empty', $4)`,
        [ws.id, s.key, s.title, s.owner_role],
      );
    }
    return ws;
  });
}

async function listWorkspacesFor(user_id) {
  return all(await query(
    `SELECT DISTINCT w.* FROM ipo_workspaces w
     LEFT JOIN workspace_members m ON m.workspace_id = w.id
     WHERE w.created_by = $1 OR m.user_id = $1
     ORDER BY w.id`,
    [user_id],
  ));
}

// -------------------------------------------------------------- sections ----

async function listSections(workspace_id) {
  return all(await query(
    'SELECT * FROM sections WHERE workspace_id = $1 ORDER BY id', [workspace_id],
  ));
}

async function getSection(workspace_id, section_key) {
  return one(await query(
    'SELECT * FROM sections WHERE workspace_id = $1 AND section_key = $2',
    [workspace_id, section_key],
  ));
}

async function updateSection(section_id, { content, status }) {
  return one(await query(
    `UPDATE sections
     SET content = COALESCE($2, content),
         status  = COALESCE($3, status),
         updated_at = now()
     WHERE id = $1 RETURNING *`,
    [section_id, content ?? null, status ?? null],
  ));
}

// Realtime persistence path: content only, no status transition.
async function saveSectionContent(section_id, content) {
  await query(
    'UPDATE sections SET content = $2, updated_at = now() WHERE id = $1',
    [section_id, content],
  );
}

// ---------------------------------------------------- section versions ----

async function createSectionVersion(section_id, { content, status, edited_by, change_note }) {
  return one(await query(
    `INSERT INTO section_versions (section_id, version_no, content, status, edited_by, change_note)
     SELECT $1, COALESCE(MAX(version_no), 0) + 1, $2, $3, $4, $5
     FROM section_versions WHERE section_id = $1
     RETURNING *`,
    [section_id, content ?? null, status ?? null, edited_by ?? null, change_note ?? null],
  ));
}

async function listSectionVersions(section_id) {
  return all(await query(
    `SELECT v.id, v.version_no, v.status, v.change_note, v.created_at,
            length(coalesce(v.content, '')) AS chars,
            ${AUTHOR_JSON('u')} AS editor
     FROM section_versions v LEFT JOIN users u ON u.id = v.edited_by
     WHERE v.section_id = $1
     ORDER BY v.version_no DESC`,
    [section_id],
  ));
}

async function getSectionVersion(section_id, version_id) {
  return one(await query(
    `SELECT v.*, ${AUTHOR_JSON('u')} AS editor
     FROM section_versions v LEFT JOIN users u ON u.id = v.edited_by
     WHERE v.section_id = $1 AND v.id = $2`,
    [section_id, version_id],
  ));
}

// -------------------------------------------------------- review comments ----

async function listSectionComments(section_id) {
  return all(await query(
    `SELECT c.*, ${AUTHOR_JSON('u')} AS author
     FROM review_comments c JOIN users u ON u.id = c.author_id
     WHERE c.section_id = $1 ORDER BY c.id`,
    [section_id],
  ));
}

async function addReviewComment(section_id, author_id, action, body) {
  return one(await query(
    `INSERT INTO review_comments (section_id, author_id, action, body)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [section_id, author_id, action, body || ''],
  ));
}

// ------------------------------------------------------------- documents ----

async function createDocument(doc) {
  return one(await query(
    `INSERT INTO documents (workspace_id, wizard_step, category, filename, storage_key, mime_type, uploaded_by, parse_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [doc.workspace_id, doc.wizard_step || null, doc.category, doc.filename,
      doc.storage_key, doc.mime_type || null, doc.uploaded_by, doc.parse_status || 'pending'],
  ));
}

async function setDocumentParseStatus(document_id, parse_status) {
  await query('UPDATE documents SET parse_status = $2 WHERE id = $1', [document_id, parse_status]);
}

async function listDocuments(workspace_id) {
  return all(await query(
    'SELECT * FROM documents WHERE workspace_id = $1 ORDER BY id', [workspace_id],
  ));
}

async function insertExtractedFields(workspace_id, document_id, fields) {
  const rows = [];
  for (const f of fields) {
    rows.push(one(await query(
      `INSERT INTO extracted_fields (workspace_id, field_key, value, confidence, source_document_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [workspace_id, f.field_key, String(f.value), f.confidence ?? null, document_id],
    )));
  }
  return rows;
}

async function listExtractedFields(workspace_id) {
  return all(await query(
    'SELECT * FROM extracted_fields WHERE workspace_id = $1 ORDER BY id', [workspace_id],
  ));
}

async function getExtractedField(workspace_id, field_id) {
  return one(await query(
    'SELECT * FROM extracted_fields WHERE workspace_id = $1 AND id = $2',
    [workspace_id, field_id],
  ));
}

async function markExtractedAccepted(field_id) {
  await query('UPDATE extracted_fields SET accepted = true WHERE id = $1', [field_id]);
}

// --------------------------------------------------------------- ipo data ----

async function ipoDataMap(workspace_id) {
  const rows = all(await query(
    'SELECT field_key, value FROM ipo_data WHERE workspace_id = $1', [workspace_id],
  ));
  const map = {};
  for (const r of rows) map[r.field_key] = r.value;
  return map;
}

async function upsertIpoData(workspace_id, field_key, value, updated_by) {
  return one(await query(
    `INSERT INTO ipo_data (workspace_id, field_key, value, updated_by, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (workspace_id, field_key)
     DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()
     RETURNING *`,
    [workspace_id, field_key, value, updated_by],
  ));
}

// tracked_sources for the validation engine: {field_key: [{document_id, value}]}
async function trackedSources(workspace_id) {
  const rows = all(await query(
    `SELECT field_key, source_document_id, value
     FROM extracted_fields WHERE workspace_id = $1`,
    [workspace_id],
  ));
  const out = {};
  for (const f of rows) {
    (out[f.field_key] = out[f.field_key] || []).push({
      document_id: f.source_document_id,
      value: f.value,
    });
  }
  return out;
}

// -------------------------------------------------------- validation flags ----

async function replaceFlags(workspace_id, flags) {
  return tx(async (client) => {
    await client.query('DELETE FROM validation_flags WHERE workspace_id = $1', [workspace_id]);
    const rows = [];
    for (const f of flags) {
      rows.push((await client.query(
        `INSERT INTO validation_flags (workspace_id, field_key, section_key, issue_type, reason)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [workspace_id, f.field_key || null, f.section_key || null, f.issue_type, f.reason],
      )).rows[0]);
    }
    return rows;
  });
}

async function listFlags(workspace_id) {
  return all(await query(
    'SELECT * FROM validation_flags WHERE workspace_id = $1 ORDER BY id', [workspace_id],
  ));
}

async function resolveFlag(workspace_id, flag_id) {
  return one(await query(
    `UPDATE validation_flags SET resolved = true
     WHERE workspace_id = $1 AND id = $2 RETURNING *`,
    [workspace_id, flag_id],
  ));
}

// --------------------------------------------------------------- activity ----

async function logActivity(workspace_id, actor_id, event_type, detail = {}) {
  return one(await query(
    `INSERT INTO activity_log (workspace_id, actor_id, event_type, detail)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [workspace_id, actor_id, event_type, JSON.stringify(detail)],
  ));
}

async function listActivity(workspace_id, limit = 25) {
  return all(await query(
    `SELECT a.*, ${AUTHOR_JSON('u')} AS actor
     FROM activity_log a LEFT JOIN users u ON u.id = a.actor_id
     WHERE a.workspace_id = $1
     ORDER BY a.id DESC LIMIT $2`,
    [workspace_id, limit],
  ));
}

// ------------------------------------------------------------ health score ----

// Draft Health Score (0-100): section progress, validation progress, doc checklist.
async function computeHealth(workspace_id) {
  const [secs, flags, docs] = await Promise.all([
    query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status NOT IN ('empty', 'ai_generated'))::int AS advanced
       FROM sections WHERE workspace_id = $1`,
      [workspace_id],
    ),
    query(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE resolved)::int AS resolved
       FROM validation_flags WHERE workspace_id = $1`,
      [workspace_id],
    ),
    query(
      'SELECT DISTINCT category FROM documents WHERE workspace_id = $1',
      [workspace_id],
    ),
  ]);

  const s = secs.rows[0];
  const f = flags.rows[0];
  const sectionProgress = s.total ? s.advanced / s.total : 0;
  const validationProgress = f.total ? f.resolved / f.total : 1;
  const uploadedCats = new Set(docs.rows.map((d) => d.category));
  const docProgress = REQUIRED_DOC_CATEGORIES.filter((c) => uploadedCats.has(c.category)).length
    / REQUIRED_DOC_CATEGORIES.length;

  const score = Math.round((sectionProgress * 0.4 + validationProgress * 0.3 + docProgress * 0.3) * 100);
  return {
    score,
    section_progress: Math.round(sectionProgress * 100),
    validation_progress: Math.round(validationProgress * 100),
    document_progress: Math.round(docProgress * 100),
  };
}

// -------------------------------------------------------- access requests ----

async function createAccessRequest({ workspace_id, requester_id, target_email, target_role, message }) {
  return one(await query(
    `INSERT INTO access_requests (workspace_id, requester_id, target_email, target_role, message)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [workspace_id, requester_id, String(target_email).toLowerCase(), target_role, message || ''],
  ));
}

async function findPendingRequest(workspace_id, target_email) {
  return one(await query(
    `SELECT * FROM access_requests
     WHERE workspace_id = $1 AND target_email = $2 AND status = 'pending'`,
    [workspace_id, String(target_email).toLowerCase()],
  ));
}

async function listWorkspaceRequests(workspace_id) {
  return all(await query(
    'SELECT * FROM access_requests WHERE workspace_id = $1 ORDER BY id DESC', [workspace_id],
  ));
}

const REQUEST_DECORATION = `
  SELECT r.*, w.company_name,
         ${AUTHOR_JSON('u')} AS requester
  FROM access_requests r
  JOIN ipo_workspaces w ON w.id = r.workspace_id
  JOIN users u ON u.id = r.requester_id`;

async function listIncomingRequests(email) {
  return all(await query(
    `${REQUEST_DECORATION} WHERE r.target_email = $1 AND r.status = 'pending' ORDER BY r.id DESC`,
    [String(email).toLowerCase()],
  ));
}

async function listOutgoingRequests(requester_id) {
  return all(await query(
    `${REQUEST_DECORATION} WHERE r.requester_id = $1 ORDER BY r.id DESC`,
    [requester_id],
  ));
}

async function getAccessRequest(request_id) {
  return one(await query(`${REQUEST_DECORATION} WHERE r.id = $1`, [request_id]));
}

async function setRequestStatus(request_id, status) {
  return one(await query(
    'UPDATE access_requests SET status = $2 WHERE id = $1 RETURNING *',
    [request_id, status],
  ));
}

// ------------------------------------------------------------------ issues ----

async function createIssue({ workspace_id, author_id, title, body, section_key }) {
  return one(await query(
    `INSERT INTO issues (workspace_id, author_id, title, body, section_key)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [workspace_id, author_id, title, body || '', section_key || null],
  ));
}

async function listIssues(workspace_id) {
  return all(await query(
    `SELECT i.*, ${AUTHOR_JSON('u')} AS author,
            (SELECT COUNT(*)::int FROM issue_comments c WHERE c.issue_id = i.id) AS comments
     FROM issues i JOIN users u ON u.id = i.author_id
     WHERE i.workspace_id = $1 ORDER BY i.id DESC`,
    [workspace_id],
  ));
}

async function getIssue(workspace_id, issue_id) {
  return one(await query(
    `SELECT i.*, ${AUTHOR_JSON('u')} AS author
     FROM issues i JOIN users u ON u.id = i.author_id
     WHERE i.workspace_id = $1 AND i.id = $2`,
    [workspace_id, issue_id],
  ));
}

async function listIssueComments(issue_id) {
  return all(await query(
    `SELECT c.*, ${AUTHOR_JSON('u')} AS author
     FROM issue_comments c JOIN users u ON u.id = c.author_id
     WHERE c.issue_id = $1 ORDER BY c.id`,
    [issue_id],
  ));
}

async function addIssueComment(issue_id, author_id, body) {
  return one(await query(
    `INSERT INTO issue_comments (issue_id, author_id, body)
     VALUES ($1, $2, $3) RETURNING *`,
    [issue_id, author_id, body || ''],
  ));
}

async function setIssueStatus(issue_id, status) {
  return one(await query(
    'UPDATE issues SET status = $2 WHERE id = $1 RETURNING *', [issue_id, status],
  ));
}

// ----------------------------------------------------------------- commits ----

async function createCommit({ workspace_id, author_id, message, section_key }) {
  return one(await query(
    `INSERT INTO commits (workspace_id, author_id, message, section_key)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [workspace_id, author_id, message, section_key || null],
  ));
}

async function listCommits(workspace_id) {
  return all(await query(
    `SELECT c.*, ${AUTHOR_JSON('u')} AS author
     FROM commits c JOIN users u ON u.id = c.author_id
     WHERE c.workspace_id = $1 ORDER BY c.id DESC`,
    [workspace_id],
  ));
}

// -------------------------------------------------------------------- seed ----

// Seed demo users so the app is immediately usable.
async function seed() {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM users');
  if (rows[0].n > 0) return;
  await createUser({ email: 'sme@demo.in', password: 'demo', full_name: 'Ramesh Verma (SME)', role: 'sme' });
  await createUser({ email: 'mb@demo.in', password: 'demo', full_name: 'Priya Nair (Merchant Banker)', role: 'merchant_banker' });
  await createUser({ email: 'legal@demo.in', password: 'demo', full_name: 'Arjun Rao (Legal Counsel)', role: 'legal_counsel' });
  console.log('seeded demo users (sme@demo.in / mb@demo.in / legal@demo.in, password "demo")');
}

module.exports = {
  pool, SECTIONS, REQUIRED_DOC_CATEGORIES, publicUser, seed,
  // users
  createUser, findUserByEmail, getUserById, setMfaSecret, setMfaEnabled,
  // workspaces & membership
  getWorkspace, isMember, addMember, listMembers, createWorkspace, listWorkspacesFor,
  // sections & versions
  listSections, getSection, updateSection, saveSectionContent,
  createSectionVersion, listSectionVersions, getSectionVersion,
  // review comments
  listSectionComments, addReviewComment,
  // documents & extraction
  createDocument, setDocumentParseStatus, listDocuments,
  insertExtractedFields, listExtractedFields, getExtractedField, markExtractedAccepted,
  // ipo data & validation
  ipoDataMap, upsertIpoData, trackedSources, replaceFlags, listFlags, resolveFlag,
  // activity & health
  logActivity, listActivity, computeHealth,
  // collaboration
  createAccessRequest, findPendingRequest, listWorkspaceRequests,
  listIncomingRequests, listOutgoingRequests, getAccessRequest, setRequestStatus,
  createIssue, listIssues, getIssue, listIssueComments, addIssueComment, setIssueStatus,
  createCommit, listCommits,
};
