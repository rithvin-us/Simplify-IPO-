import React, { useState } from 'react';
import { validateValue, isVerified } from '../validation.js';

// One typed, self-validating wizard field.
//  - green border when the value is entered and passes its constraints
//  - red border + message when it violates them
//  - ⓘ toggles a short description ("small description of every block when pressed")
export default function Field({ spec, value, onChange }) {
  const [touched, setTouched] = useState(false);
  const [showDesc, setShowDesc] = useState(false);

  const error = validateValue(spec, value);
  const verified = isVerified(spec, value);
  const cls = verified ? 'valid' : (touched && error ? 'invalid' : '');

  function set(v) { setTouched(true); onChange(v); }

  return (
    <div className="field">
      <label>
        {spec.label}{spec.required && <span className="err"> *</span>}
        <button type="button" className="info-btn" title="What is this?" onClick={() => setShowDesc((s) => !s)}>ⓘ</button>
        {verified && <span className="verified-tick" title="verified">✓</span>}
      </label>
      {showDesc && spec.description && <div className="field-desc">{spec.description}</div>}

      {renderInput(spec, value, set, cls)}

      {touched && error && <div className="field-err">{error}</div>}
    </div>
  );
}

function renderInput(spec, value, set, cls) {
  const v = value ?? '';
  switch (spec.type) {
    case 'select':
      return (
        <select className={cls} value={v} onChange={(e) => set(e.target.value)}>
          <option value="">— select —</option>
          {(spec.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'textarea':
      return <textarea className={`short ${cls}`} value={v} onChange={(e) => set(e.target.value)} />;
    case 'date':
      return <input type="date" className={cls} value={v} onChange={(e) => set(e.target.value)} />;
    case 'number':
      return <input type="number" inputMode="decimal" className={cls} min={spec.min} max={spec.max} step={spec.step || 1} value={v} onChange={(e) => set(e.target.value)} />;
    case 'percent': {
      const step = spec.step || 1;
      const bump = (d) => {
        const n = Math.min(100, Math.max(0, (Number(v || 0) + d * step)));
        set(String(Number(n.toFixed(2))));
      };
      return (
        <div className="stepper">
          <button type="button" onClick={() => bump(-1)}>−</button>
          <input type="number" className={cls} min={0} max={100} step={step} value={v} onChange={(e) => set(e.target.value)} />
          <button type="button" onClick={() => bump(1)}>+</button>
          <span className="unit">%</span>
        </div>
      );
    }
    case 'currency':
      return (
        <div className="with-unit">
          <span className="unit-prefix">{spec.unit || 'INR'}</span>
          <input className={cls} value={v} placeholder="e.g. 48.2 crore" onChange={(e) => set(e.target.value)} />
        </div>
      );
    case 'tags':
      return <TagsInput spec={spec} value={v} set={set} cls={cls} />;
    default:
      return <input className={cls} value={v} onChange={(e) => set(e.target.value)} />;
  }
}

// Dropdown-style suggestions (click to toggle) plus free manual entry.
function TagsInput({ spec, value, set, cls }) {
  const [custom, setCustom] = useState('');
  const selected = value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const commit = (arr) => set([...new Set(arr)].join(', '));
  const toggle = (opt) => commit(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  const add = () => { if (custom.trim()) { commit([...selected, custom.trim()]); setCustom(''); } };

  return (
    <div className={`tags ${cls}`}>
      <div className="tag-options">
        {(spec.options || []).map((o) => (
          <button type="button" key={o} className={`tag ${selected.includes(o) ? 'on' : ''}`} onClick={() => toggle(o)}>{o}</button>
        ))}
      </div>
      <div className="row">
        <input value={custom} placeholder="add your own…" onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" className="ghost sm" onClick={add}>Add</button>
      </div>
      {selected.length > 0 && <div className="muted" style={{ marginTop: '.3rem' }}>{selected.length} selected</div>}
    </div>
  );
}
