// Field-type constraints for server-side validation of wizard data.
// The catalogue (with types/options) lives in the AI service; we fetch it once
// and cache it, so the backend enforces the same rules the UI shows.
const ai = require('./aiClient');

let cache = null;

async function getFieldMap() {
  if (cache) return cache;
  try {
    const res = await fetch(`${ai.AI_BASE}/schema/fields`);
    if (res.ok) {
      const data = await res.json();
      cache = {};
      for (const f of data.fields) cache[f.key] = f;
    }
  } catch { /* AI down — validation is skipped until it is reachable */ }
  return cache || {};
}

// Validate one value against its field spec. Empty is always allowed (a clear).
// Returns null when valid, or an error string.
function validateValue(spec, raw) {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  switch (spec.type) {
    case 'number': {
      if (!/^-?\d+(\.\d+)?$/.test(value.replace(/,/g, ''))) return `${spec.label} must be a number`;
      const n = Number(value.replace(/,/g, ''));
      if (spec.min != null && n < spec.min) return `${spec.label} must be ≥ ${spec.min}`;
      if (spec.max != null && n > spec.max) return `${spec.label} must be ≤ ${spec.max}`;
      return null;
    }
    case 'percent': {
      if (!/^-?\d+(\.\d+)?$/.test(value)) return `${spec.label} must be a number`;
      const n = Number(value);
      if (n < 0 || n > 100) return `${spec.label} must be between 0 and 100`;
      return null;
    }
    case 'currency':
      return /\d/.test(value) ? null : `${spec.label} must include an amount`;
    case 'date':
      return (/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isNaN(Date.parse(value)))
        ? null : `${spec.label} must be a valid date`;
    case 'select':
      return (!spec.options || spec.options.includes(value))
        ? null : `${spec.label} must be one of the listed options`;
    default:
      return null; // text, textarea, tags
  }
}

// Validate a batch of { key: value }. Returns { errors: {key: msg} } (may be empty).
async function validateBatch(fields) {
  const map = await getFieldMap();
  const errors = {};
  for (const [key, value] of Object.entries(fields || {})) {
    const spec = map[key];
    if (!spec) continue; // unknown keys (e.g. promoters.list JSON) pass through
    const err = validateValue(spec, value);
    if (err) errors[key] = err;
  }
  return { errors };
}

module.exports = { getFieldMap, validateValue, validateBatch };
