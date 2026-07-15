import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api.js';

const SEVERITY_BADGE = { high: 'missing', medium: 'inconsistent', low: 'disclosure_gap' };

export default function ValidationPanel() {
  const { workspaceId } = useOutletContext();
  const { t } = useTranslation();
  const [flags, setFlags] = useState([]);
  const [mode, setMode] = useState('');
  const [busy, setBusy] = useState(false);
  // Module 16 — whole-draft consistency engine.
  const [findings, setFindings] = useState(null);
  const [cMode, setCMode] = useState('');
  const [cBusy, setCBusy] = useState(false);

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

  async function runConsistency() {
    setCBusy(true);
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/consistency`);
      setFindings(data.findings); setCMode(data.mode);
    } finally { setCBusy(false); }
  }

  const open = flags.filter((f) => !f.resolved);
  return (
    <div className="stack">
      <div className="card spread">
        <div>
          <h3 style={{ marginBottom: 0 }}>{t('validation.title')}</h3>
          <span className="muted">{t('validation.subtitle')}{mode && ` · ${t('validation.engine')}: ${mode}`}</span>
        </div>
        <button onClick={run} disabled={busy}>{busy ? t('validation.running') : t('validation.run')}</button>
      </div>

      <div className="card">
        {flags.length === 0
          ? <p className="muted">{t('validation.none')}</p>
          : (
            <>
              <p className="muted">{t('validation.openOf', { open: open.length, total: flags.length })}</p>
              <table>
                <thead><tr><th>{t('validation.type')}</th><th>{t('validation.where')}</th><th>{t('validation.issue')}</th><th></th></tr></thead>
                <tbody>
                  {flags.map((f) => (
                    <tr key={f.id} style={{ opacity: f.resolved ? 0.5 : 1 }}>
                      <td><span className={`badge ${f.issue_type}`}>{f.issue_type.replace('_', ' ')}</span></td>
                      <td className="mono">{f.field_key || f.section_key || '—'}</td>
                      <td>{f.reason}</td>
                      <td>{f.resolved ? <span className="ok">{t('validation.resolved')}</span> : <button className="ghost sm" onClick={() => resolve(f.id)}>{t('validation.resolve')}</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
      </div>

      <div className="card spread">
        <div>
          <h3 style={{ marginBottom: 0 }}>{t('validation.consistencyTitle')}</h3>
          <span className="muted">{t('validation.consistencySubtitle')}{cMode && ` · ${t('validation.engine')}: ${cMode}`}</span>
        </div>
        <button onClick={runConsistency} disabled={cBusy}>{cBusy ? t('validation.running') : t('validation.runConsistency')}</button>
      </div>

      <div className="card">
        {findings === null
          ? <p className="muted">{t('validation.noFindings')}</p>
          : findings.length === 0
            ? <p className="ok">{t('validation.clean')}</p>
            : (
              <table>
                <thead><tr><th>{t('validation.severity')}</th><th>{t('validation.type')}</th><th>{t('validation.section')}</th><th>{t('validation.finding')}</th></tr></thead>
                <tbody>
                  {findings.map((f, i) => (
                    <tr key={i}>
                      <td><span className={`badge ${SEVERITY_BADGE[f.severity] || 'disclosure_gap'}`}>{f.severity}</span></td>
                      <td className="mono">{f.type}</td>
                      <td className="mono">{f.section_key || '—'}{f.related_sections?.length ? ` ↔ ${f.related_sections.join(', ')}` : ''}</td>
                      <td>{f.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </div>
    </div>
  );
}
