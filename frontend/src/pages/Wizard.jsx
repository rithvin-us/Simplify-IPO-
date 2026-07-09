import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../api.js';
import Field from '../components/Field.jsx';
import PromotersEditor from '../components/PromotersEditor.jsx';
import { validateValue } from '../validation.js';

export default function Wizard() {
  const { workspaceId } = useOutletContext();
  const [meta, setMeta] = useState(null);
  const [values, setValues] = useState({});
  const [docs, setDocs] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [openDesc, setOpenDesc] = useState({});
  const [uploading, setUploading] = useState('');
  const [saved, setSaved] = useState('');
  const [serverErr, setServerErr] = useState({});

  function loadDocs() {
    api.get(`/workspaces/${workspaceId}/documents`).then((r) => { setDocs(r.data.documents); setChecklist(r.data.checklist); });
  }
  useEffect(() => {
    api.get('/meta').then((r) => setMeta(r.data));
    api.get(`/workspaces/${workspaceId}/data`).then((r) => setValues(r.data.data || {}));
    loadDocs();
  }, [workspaceId]);

  const setVal = (key, v) => { setValues((s) => ({ ...s, [key]: v })); setSaved(''); setServerErr((e) => ({ ...e, [key]: undefined })); };
  const mergeVals = (obj) => { setValues((s) => ({ ...s, ...obj })); setSaved(''); };

  async function save() {
    setServerErr({});
    try {
      const { data } = await api.put(`/workspaces/${workspaceId}/data`, { fields: values });
      setValues(data.data); setSaved('Saved ✓');
    } catch (e) {
      if (e.response?.status === 422) setServerErr(e.response.data.errors || {});
      else setSaved('Save failed');
    }
  }

  async function upload(step, category, file) {
    if (!file) return;
    setUploading(step);
    const fd = new FormData();
    fd.append('file', file); fd.append('category', category); fd.append('wizard_step', step);
    try { await api.post(`/workspaces/${workspaceId}/documents`, fd); loadDocs(); }
    finally { setUploading(''); }
  }

  if (!meta) return <div className="card">Loading…</div>;
  const byStep = {};
  meta.fields.forEach((f) => { (byStep[f.wizard_step] = byStep[f.wizard_step] || []).push(f); });

  // Block save while any entered value violates its constraints.
  const invalidCount = meta.fields.filter((f) => validateValue(f, values[f.key])).length;

  return (
    <div className="stack">
      <div className="notice">
        Each field is checked as you type — a green border means it’s verified. Upload documents to auto-fill,
        then review on the <Link to={`/w/${workspaceId}/extraction`}>Extraction</Link> tab.
      </div>

      {meta.wizard_steps.map((step) => {
        const sm = (meta.step_meta || {})[step] || {};
        const category = sm.category || 'supporting';
        const stepDocs = docs.filter((d) => d.category === category);
        return (
          <div className="card" key={step}>
            <div className="spread">
              <h3 style={{ marginBottom: 0 }}>
                {sm.label || step}
                <button type="button" className="info-btn" onClick={() => setOpenDesc((s) => ({ ...s, [step]: !s[step] }))}>ⓘ</button>
              </h3>
            </div>
            {openDesc[step] && sm.description && <div className="field-desc">{sm.description}</div>}

            {step === 'promoters'
              ? <PromotersEditor values={values} onDerive={mergeVals} />
              : (
                <div className="grid">
                  {(byStep[step] || []).map((f) => (
                    <div key={f.key}>
                      <Field spec={f} value={values[f.key]} onChange={(v) => setVal(f.key, v)} />
                      {serverErr[f.key] && <div className="field-err">{serverErr[f.key]}</div>}
                    </div>
                  ))}
                </div>
              )}

            <div className="upload-block">
              <label style={{ margin: 0 }}>Upload: <strong>{sm.doc_label || 'supporting document'}</strong></label>
              <div className="row">
                <input type="file" style={{ width: 'auto' }} disabled={uploading === step}
                  onChange={(e) => { upload(step, category, e.target.files[0]); e.target.value = ''; }} />
                {uploading === step && <span className="muted">extracting…</span>}
              </div>
              {stepDocs.length > 0 && (
                <ul className="doc-list">
                  {stepDocs.map((d) => (
                    <li key={d.id}><span className="mono">{d.filename}</span> <span className={`badge ${d.parse_status === 'parsed' ? 'legal_reviewed' : 'ai_generated'}`}>{d.parse_status}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}

      <div className="card spread">
        <div>
          <strong>Required-document checklist</strong>
          <div className="row" style={{ marginTop: '.5rem' }}>
            {checklist.map((c) => (
              <span key={c.category} className={`badge ${c.uploaded ? 'legal_reviewed' : 'missing'}`}>
                {c.uploaded ? '✓' : '○'} {c.label}
              </span>
            ))}
          </div>
        </div>
        <div className="row">
          {invalidCount > 0 && <span className="err">{invalidCount} field(s) invalid</span>}
          {saved && <span className="ok">{saved}</span>}
          <button onClick={save} disabled={invalidCount > 0}>Save wizard data</button>
        </div>
      </div>
    </div>
  );
}
