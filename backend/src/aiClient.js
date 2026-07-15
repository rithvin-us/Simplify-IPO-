// Thin client for the FastAPI AI service. Uses Node's global fetch (Node 18+).
// If the AI service is unreachable, callers get a clear 502-style error.
const AI_BASE = process.env.AI_SERVICE_URL || `http://127.0.0.1:${process.env.AI_SERVICE_PORT || 8000}`;

async function postJson(path, body) {
  const res = await fetch(`${AI_BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

// Multipart upload to /parse (extract raw text from a document buffer).
async function parse(buffer, filename) {
  const form = new FormData();
  form.append('file', new Blob([buffer]), filename);
  const res = await fetch(`${AI_BASE}/parse`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`AI /parse -> ${res.status} ${await res.text()}`);
  return res.json();
}

const extract = (payload) => postJson('/extract', payload);
const validate = (payload) => postJson('/validate', payload);
const draft = (payload) => postJson('/draft', payload);
const exportDoc = (payload) => postJson('/export', payload);
const consistency = (payload) => postJson('/consistency', payload); // Module 16
const translate = (payload) => postJson('/translate', payload);     // Module 17

async function health() {
  try {
    const res = await fetch(`${AI_BASE}/health`);
    return res.ok ? res.json() : { status: 'error' };
  } catch (e) {
    return { status: 'unreachable', base: AI_BASE, error: String(e) };
  }
}

module.exports = { AI_BASE, parse, extract, validate, draft, exportDoc, consistency, translate, health };
