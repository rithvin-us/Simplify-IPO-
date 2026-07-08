import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api.js';

export default function ValidationPanel() {
  const { workspaceId } = useOutletContext();
  const [flags, setFlags] = useState([]);
  const [mode, setMode] = useState('');
  const [busy, setBusy] = useState(false);

  function load() { api.get(`/workspaces/${workspaceId}/flags`).then((r) => setFlags(r.data.flags)); }
  useEffect(load, [workspaceId]);

  async function run() {
    setBusy(true);
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/validate`);
      setFlags(data.flags); setMode(data.mode);
    } finally { setBusy(false); }
  }
  async function resolve(id) {
    await api.post(`/workspaces/${workspaceId}/flags/${id}/resolve`);
    load();
  }

  const open = flags.filter((f) => !f.resolved);
  return (
    <div className="stack">
      <div className="card spread">
        <div>
          <h3 style={{ marginBottom: 0 }}>Validation Engine — Missing Info & Disclosure Gaps</h3>
          <span className="muted">Missing required fields, cross-document conflicts, and SEBI disclosure gaps.{mode && ` · engine: ${mode}`}</span>
        </div>
        <button onClick={run} disabled={busy}>{busy ? 'Running…' : 'Run validation'}</button>
      </div>

      <div className="card">
        {flags.length === 0
          ? <p className="muted">No flags. Run validation after entering data.</p>
          : (
            <>
              <p className="muted">{open.length} open of {flags.length} total.</p>
              <table>
                <thead><tr><th>Type</th><th>Where</th><th>Issue</th><th></th></tr></thead>
                <tbody>
                  {flags.map((f) => (
                    <tr key={f.id} style={{ opacity: f.resolved ? 0.5 : 1 }}>
                      <td><span className={`badge ${f.issue_type}`}>{f.issue_type.replace('_', ' ')}</span></td>
                      <td className="mono">{f.field_key || f.section_key || '—'}</td>
                      <td>{f.reason}</td>
                      <td>{f.resolved ? <span className="ok">resolved</span> : <button className="ghost sm" onClick={() => resolve(f.id)}>Resolve</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
      </div>
    </div>
  );
}
