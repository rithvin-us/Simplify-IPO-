import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../api.js';

const STEP_LABEL = {
  company: 'Company', promoters: 'Promoters', financials: 'Financials',
  legal: 'Legal', issue: 'The Issue', risk: 'Risk',
};
const STEP_CATEGORY = {
  company: 'corporate', promoters: 'corporate', financials: 'financial',
  legal: 'legal', issue: 'corporate', risk: 'compliance',
};

export default function Wizard() {
  const { workspaceId } = useOutletContext();
  const [meta, setMeta] = useState(null);
  const [values, setValues] = useState({});
  const [checklist, setChecklist] = useState([]);
  const [saved, setSaved] = useState('');
  const [uploading, setUploading] = useState('');

  function loadDocs() {
    api.get(`/workspaces/${workspaceId}/documents`).then((r) => setChecklist(r.data.checklist));
  }
  useEffect(() => {
    api.get('/meta').then((r) => setMeta(r.data));
    api.get(`/workspaces/${workspaceId}/data`).then((r) => setValues(r.data.data || {}));
    loadDocs();
  }, [workspaceId]);

  function set(key, v) { setValues((s) => ({ ...s, [key]: v })); setSaved(''); }

  async function save() {
    await api.put(`/workspaces/${workspaceId}/data`, { fields: values });
    setSaved('Saved');
  }

  async function upload(step, file) {
    if (!file) return;
    setUploading(step);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', STEP_CATEGORY[step]);
    fd.append('wizard_step', step);
    try {
      await api.post(`/workspaces/${workspaceId}/documents`, fd);
      loadDocs();
    } finally { setUploading(''); }
  }

  if (!meta) return <div className="card">Loading…</div>;
  const byStep = {};
  meta.fields.forEach((f) => { (byStep[f.wizard_step] = byStep[f.wizard_step] || []).push(f); });

  return (
    <div className="stack">
      <div className="notice">
        Fill what you know, upload supporting documents, then review auto-extracted values on the{' '}
        <Link to={`/w/${workspaceId}/extraction`}>Extraction</Link> tab.
      </div>

      {meta.wizard_steps.map((step) => (
        <div className="card" key={step}>
          <h3>{STEP_LABEL[step] || step}</h3>
          <div className="grid">
            {(byStep[step] || []).map((f) => (
              <div key={f.key}>
                <label>{f.label}{f.required && <span className="err"> *</span>}</label>
                <input value={values[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: '.8rem' }}>
            <label style={{ margin: 0 }}>Upload {STEP_CATEGORY[step]} document:</label>
            <input type="file" style={{ width: 'auto' }} disabled={uploading === step}
              onChange={(e) => upload(step, e.target.files[0])} />
            {uploading === step && <span className="muted">extracting…</span>}
          </div>
        </div>
      ))}

      <div className="card">
        <div className="spread">
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
            {saved && <span className="ok">{saved}</span>}
            <button onClick={save}>Save wizard data</button>
          </div>
        </div>
      </div>
    </div>
  );
}
