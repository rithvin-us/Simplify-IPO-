import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api.js';

export default function ExportSummary() {
  const { workspaceId, workspace } = useOutletContext();
  const [summary, setSummary] = useState(null);
  const [docxAvail, setDocxAvail] = useState(false);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api.get(`/workspaces/${workspaceId}/export/summary`).then((r) => {
      setSummary(r.data.summary); setDocxAvail(r.data.docx_available);
    });
  }, [workspaceId]);

  async function download(fmt) {
    setBusy(fmt);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/export/${fmt}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      if (fmt === 'pdf') {
        window.open(url, '_blank'); // print-ready HTML -> browser Print to PDF
      } else {
        const a = document.createElement('a');
        const co = workspace?.workspace?.company_name || 'DRHP';
        a.href = url; a.download = `DRHP_${co.replace(/\W+/g, '_')}.docx`; a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } finally { setBusy(''); }
  }

  if (!summary) return <div className="card">Loading export summary…</div>;

  return (
    <div className="stack">
      <div className="card">
        <h3>Export readiness</h3>
        <div className="row" style={{ gap: '2rem' }}>
          <div><div className="score" style={{ fontSize: '1.6rem' }}>{summary.sections_present}/{summary.sections_total}</div><span className="muted">sections drafted</span></div>
          <div><div className="score" style={{ fontSize: '1.6rem', color: summary.information_required_markers ? 'var(--warn)' : 'var(--ok)' }}>{summary.information_required_markers}</div><span className="muted">[INFORMATION REQUIRED] markers</span></div>
          <div><div className="score" style={{ fontSize: '1.6rem' }}>{summary.sections_finalized}</div><span className="muted">reviewer-approved</span></div>
        </div>
        {summary.sections_missing.length > 0 && (
          <div className="notice" style={{ marginTop: '.8rem' }}>Not yet drafted: {summary.sections_missing.join(', ')}</div>
        )}
        <p style={{ marginTop: '.8rem' }}>
          Status: {summary.ready_for_export
            ? <span className="ok">Ready — all sections drafted, no open information markers.</span>
            : <span className="err">Not ready — complete drafting and resolve information markers first.</span>}
        </p>
      </div>

      <div className="card">
        <h3>Download draft DRHP</h3>
        <p className="muted">Draft only — mandatory review and certification by authorised intermediaries is required before any SEBI submission.</p>
        <div className="row">
          <button onClick={() => download('docx')} disabled={!docxAvail || busy}>{busy === 'docx' ? 'Preparing…' : 'Download Word (.docx)'}</button>
          <button className="ghost" onClick={() => download('pdf')} disabled={busy}>{busy === 'pdf' ? 'Opening…' : 'Open PDF (print)'}</button>
          {!docxAvail && <span className="muted">Word export needs python-docx on the AI service.</span>}
        </div>
      </div>
    </div>
  );
}
