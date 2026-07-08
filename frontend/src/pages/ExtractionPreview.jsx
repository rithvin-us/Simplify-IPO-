import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../api.js';

function confClass(c) {
  if (c < 0.6) return 'confidence-low';
  if (c < 0.85) return 'confidence-mid';
  return 'confidence-high';
}

export default function ExtractionPreview() {
  const { workspaceId } = useOutletContext();
  const [fields, setFields] = useState([]);
  const [docs, setDocs] = useState({});
  const [edits, setEdits] = useState({});

  function load() {
    api.get(`/workspaces/${workspaceId}/documents/extracted`).then((r) => setFields(r.data.fields));
    api.get(`/workspaces/${workspaceId}/documents`).then((r) => {
      const m = {}; r.data.documents.forEach((d) => { m[d.id] = d.filename; }); setDocs(m);
    });
  }
  useEffect(load, [workspaceId]);

  async function accept(f) {
    await api.post(`/workspaces/${workspaceId}/documents/extracted/${f.id}/accept`, { value: edits[f.id] ?? f.value });
    load();
  }
  async function acceptAll() {
    await api.post(`/workspaces/${workspaceId}/documents/extracted/accept-all`);
    load();
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="spread">
          <div>
            <h3 style={{ marginBottom: 0 }}>Smart Document Parser — extracted fields</h3>
            <span className="muted">Confidence-scored, source-attributed. Edit any value before accepting into the IPO data.</span>
          </div>
          <button onClick={acceptAll} disabled={!fields.length}>Accept all into wizard</button>
        </div>
      </div>

      <div className="card">
        {fields.length === 0
          ? <p className="muted">No extracted fields yet. Upload documents on the <Link to={`/w/${workspaceId}/wizard`}>Wizard</Link> tab.</p>
          : (
            <table>
              <thead><tr><th>Field</th><th>Value</th><th>Confidence</th><th>Source</th><th></th></tr></thead>
              <tbody>
                {fields.map((f) => (
                  <tr key={f.id}>
                    <td className="mono">{f.field_key}</td>
                    <td><input value={edits[f.id] ?? f.value} onChange={(e) => setEdits((s) => ({ ...s, [f.id]: e.target.value }))} /></td>
                    <td className={confClass(f.confidence)}>{Math.round(f.confidence * 100)}%</td>
                    <td className="muted">{docs[f.source_document_id] || '—'}</td>
                    <td>{f.accepted ? <span className="badge legal_reviewed">✓ accepted</span> : <button className="ghost sm" onClick={() => accept(f)}>Accept</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
