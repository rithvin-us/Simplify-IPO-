import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api.js';

export default function DraftViewer() {
  const { workspaceId } = useOutletContext();
  const [sections, setSections] = useState([]);
  const [active, setActive] = useState(null);
  const [content, setContent] = useState('');
  const [missing, setMissing] = useState([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [descs, setDescs] = useState({});

  function load() {
    api.get(`/workspaces/${workspaceId}/sections`).then((r) => {
      setSections(r.data.sections);
      if (!active && r.data.sections.length) select(r.data.sections[0]);
    });
  }
  useEffect(load, [workspaceId]);
  useEffect(() => {
    api.get('/meta').then((r) => { const m = {}; (r.data.sections || []).forEach((s) => { m[s.key] = s.description; }); setDescs(m); });
  }, []);

  function select(s) { setActive(s); setContent(s.content || ''); setMissing([]); setNote(''); }

  async function generate() {
    setBusy(true); setNote('');
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/sections/${active.section_key}/generate`);
      setContent(data.section.content); setMissing(data.missing || []);
      setNote(`Generated (${data.mode}).`);
      load();
    } finally { setBusy(false); }
  }
  async function save() {
    const { data } = await api.put(`/workspaces/${workspaceId}/sections/${active.section_key}`, { content });
    setActive(data.section); setNote('Saved & marked verified.'); load();
  }

  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <div className="card" style={{ width: 240, flex: '0 0 240px' }}>
        <h3>Sections</h3>
        <div className="stack">
          {sections.map((s) => (
            <div key={s.section_key} onClick={() => select(s)}
              style={{ cursor: 'pointer', padding: '.4rem', borderRadius: 6, background: active?.section_key === s.section_key ? '#eef3f9' : 'transparent' }}>
              <div>{s.title}</div>
              <span className={`badge ${s.status}`}>{s.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ flex: 1, minWidth: 320 }}>
        {!active ? <p className="muted">Select a section.</p> : (
          <>
            <div className="spread">
              <h3 style={{ marginBottom: 0 }}>{active.title}</h3>
              <div className="row">
                <button className="ghost" onClick={generate} disabled={busy}>{busy ? 'Generating…' : (active.content ? 'Regenerate' : 'Generate')}</button>
                <button onClick={save} disabled={!content}>Save</button>
              </div>
            </div>
            {descs[active.section_key] && <div className="field-desc" style={{ marginTop: '.4rem' }}>{descs[active.section_key]}</div>}
            {missing.length > 0 && <div className="notice" style={{ marginTop: '.6rem' }}>Missing data: {missing.join(', ')} — shown as [INFORMATION REQUIRED] in the draft.</div>}
            {note && <p className="ok">{note}</p>}
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Generate a draft, then edit here…" style={{ marginTop: '.6rem' }} />
          </>
        )}
      </div>
    </div>
  );
}
