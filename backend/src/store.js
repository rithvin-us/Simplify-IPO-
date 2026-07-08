// In-memory data store modelling database/schema.sql — no Postgres needed for
// the prototype. Swap for a `pg` Pool in production; the shapes match the schema.
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

const db = {
  users: [],
  workspaces: [],
  members: [],          // {workspace_id, user_id, member_role}
  sections: [],         // {id, workspace_id, section_key, title, content, status, owner_role, locked_by}
  documents: [],        // {id, workspace_id, category, wizard_step, filename, storage_key, uploaded_by, parse_status}
  extractedFields: [],  // {id, workspace_id, field_key, value, confidence, source_document_id, accepted}
  ipoData: [],          // {workspace_id, field_key, value, updated_by}
  validationFlags: [],  // {id, workspace_id, field_key, section_key, issue_type, reason, resolved}
  reviewComments: [],   // {id, section_id, author_id, action, body}
  activity: [],         // {id, workspace_id, actor_id, event_type, detail, created_at}
};

const seq = {};
function nextId(kind) {
  seq[kind] = (seq[kind] || 0) + 1;
  return seq[kind];
}

function createUser({ email, password, full_name, role }) {
  const user = {
    id: nextId('user'),
    email: email.toLowerCase(),
    password_hash: hashPassword(password),
    full_name,
    role,
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  return user;
}

function findUserByEmail(email) {
  return db.users.find((u) => u.email === String(email).toLowerCase());
}

function publicUser(u) {
  return u && { id: u.id, email: u.email, full_name: u.full_name, role: u.role };
}

function logActivity(workspace_id, actor_id, event_type, detail = {}) {
  const row = {
    id: nextId('activity'),
    workspace_id,
    actor_id,
    event_type,
    detail,
    created_at: new Date().toISOString(),
  };
  db.activity.push(row);
  return row;
}

function isMember(workspace_id, user_id) {
  const ws = db.workspaces.find((w) => w.id === workspace_id);
  if (ws && ws.created_by === user_id) return true;
  return db.members.some((m) => m.workspace_id === workspace_id && m.user_id === user_id);
}

function ipoDataMap(workspace_id) {
  const map = {};
  for (const row of db.ipoData) {
    if (row.workspace_id === workspace_id) map[row.field_key] = row.value;
  }
  return map;
}

function upsertIpoData(workspace_id, field_key, value, updated_by) {
  let row = db.ipoData.find((r) => r.workspace_id === workspace_id && r.field_key === field_key);
  if (row) {
    row.value = value;
    row.updated_by = updated_by;
    row.updated_at = new Date().toISOString();
  } else {
    row = { workspace_id, field_key, value, updated_by, updated_at: new Date().toISOString() };
    db.ipoData.push(row);
  }
  return row;
}

// tracked_sources for the validation engine: {field_key: [{document_id, value}]}
function trackedSources(workspace_id) {
  const out = {};
  for (const f of db.extractedFields) {
    if (f.workspace_id !== workspace_id) continue;
    (out[f.field_key] = out[f.field_key] || []).push({
      document_id: f.source_document_id,
      value: f.value,
    });
  }
  return out;
}

// Draft Health Score (0-100): section progress, validation progress, doc checklist.
function computeHealth(workspace_id) {
  const secs = db.sections.filter((s) => s.workspace_id === workspace_id);
  const advanced = secs.filter((s) => !['empty', 'ai_generated'].includes(s.status)).length;
  const sectionProgress = secs.length ? advanced / secs.length : 0;

  const flags = db.validationFlags.filter((v) => v.workspace_id === workspace_id);
  const validationProgress = flags.length ? flags.filter((v) => v.resolved).length / flags.length : 1;

  const uploadedCats = new Set(
    db.documents.filter((d) => d.workspace_id === workspace_id).map((d) => d.category),
  );
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

// Seed demo users so the app is immediately usable.
function seed() {
  if (db.users.length) return;
  createUser({ email: 'sme@demo.in', password: 'demo', full_name: 'Ramesh Verma (SME)', role: 'sme' });
  createUser({ email: 'mb@demo.in', password: 'demo', full_name: 'Priya Nair (Merchant Banker)', role: 'merchant_banker' });
  createUser({ email: 'legal@demo.in', password: 'demo', full_name: 'Arjun Rao (Legal Counsel)', role: 'legal_counsel' });
}

module.exports = {
  db, nextId, SECTIONS, REQUIRED_DOC_CATEGORIES,
  createUser, findUserByEmail, publicUser, logActivity, isMember,
  ipoDataMap, upsertIpoData, trackedSources, computeHealth, seed,
};
