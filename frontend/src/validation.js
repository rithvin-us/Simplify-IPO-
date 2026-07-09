// Client-side field validation — mirrors backend/src/fieldSchema.js so the UI
// can show a green (valid) / red (invalid) border the moment a value is entered.
export function validateValue(spec, raw) {
  const value = String(raw ?? '').trim();
  if (!value) return null; // empty is neutral, not invalid
  switch (spec.type) {
    case 'number': {
      if (!/^-?\d+(\.\d+)?$/.test(value.replace(/,/g, ''))) return `${spec.label} must be a number`;
      const n = Number(value.replace(/,/g, ''));
      if (spec.min != null && n < spec.min) return `Must be ≥ ${spec.min}`;
      if (spec.max != null && n > spec.max) return `Must be ≤ ${spec.max}`;
      return null;
    }
    case 'percent': {
      if (!/^-?\d+(\.\d+)?$/.test(value)) return 'Must be a number';
      const n = Number(value);
      if (n < 0 || n > 100) return 'Must be between 0 and 100';
      return null;
    }
    case 'currency':
      return /\d/.test(value) ? null : 'Must include an amount';
    case 'date':
      return (/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isNaN(Date.parse(value)))
        ? null : 'Must be a valid date';
    case 'select':
      return (!spec.options || spec.options.includes(value)) ? null : 'Pick a listed option';
    default:
      return null;
  }
}

// A field is "verified" when it holds a non-empty value that passes its constraints.
export function isVerified(spec, value) {
  return String(value ?? '').trim() !== '' && validateValue(spec, value) === null;
}
