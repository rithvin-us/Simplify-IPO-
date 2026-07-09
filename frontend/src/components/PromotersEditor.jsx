import React, { useState, useEffect } from 'react';

// Repeatable promoter list. Persists detail in `promoters.list` (JSON) and derives
// the flat aggregate fields (promoters.names / holding_pct / experience) that the
// parser, validator and drafter consume — so the pipeline stays unchanged.
export default function PromotersEditor({ values, onDerive }) {
  const [rows, setRows] = useState(() => {
    try { const l = JSON.parse(values['promoters.list'] || '[]'); if (l.length) return l; } catch { /* ignore */ }
    if (values['promoters.names']) {
      return values['promoters.names'].split(',').map((n) => ({ name: n.trim(), holding: '', experience: '' }));
    }
    return [{ name: '', holding: '', experience: '' }];
  });

  useEffect(() => { derive(rows); /* eslint-disable-next-line */ }, []);

  function derive(list) {
    const clean = list.filter((r) => r.name.trim());
    const total = clean.reduce((s, r) => s + (Number(r.holding) || 0), 0);
    onDerive({
      'promoters.list': JSON.stringify(list),
      'promoters.names': clean.map((r) => r.name.trim()).join(', '),
      'promoters.holding_pct': clean.length ? String(Number(total.toFixed(2))) : '',
      'promoters.experience': clean.filter((r) => r.experience.trim()).map((r) => `${r.name.trim()}: ${r.experience.trim()}`).join('; '),
    });
  }

  function update(i, key, val) { const next = rows.map((r, j) => (j === i ? { ...r, [key]: val } : r)); setRows(next); derive(next); }
  function add() { const next = [...rows, { name: '', holding: '', experience: '' }]; setRows(next); derive(next); }
  function remove(i) { const next = rows.filter((_, j) => j !== i); setRows(next.length ? next : [{ name: '', holding: '', experience: '' }]); derive(next); }

  const total = rows.reduce((s, r) => s + (Number(r.holding) || 0), 0);

  return (
    <div>
      {rows.map((r, i) => (
        <div className="promoter-row" key={i}>
          <input placeholder="Promoter name" value={r.name} onChange={(e) => update(i, 'name', e.target.value)} />
          <input type="number" min={0} max={100} step={0.1} placeholder="Holding %" value={r.holding}
            className={r.holding !== '' && (Number(r.holding) < 0 || Number(r.holding) > 100) ? 'invalid' : ''}
            onChange={(e) => update(i, 'holding', e.target.value)} style={{ width: 110 }} />
          <input placeholder="Experience" value={r.experience} onChange={(e) => update(i, 'experience', e.target.value)} />
          <button type="button" className="ghost sm" onClick={() => remove(i)} title="Remove">✕</button>
        </div>
      ))}
      <div className="row" style={{ marginTop: '.5rem' }}>
        <button type="button" className="ghost sm" onClick={add}>+ Add promoter</button>
        <span className={total > 100 ? 'err' : 'muted'}>Total holding: {Number(total.toFixed(2))}%{total > 100 && ' (exceeds 100%)'}</span>
      </div>
    </div>
  );
}
