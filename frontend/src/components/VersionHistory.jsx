// Module 19 — version history: list snapshots, diff against current, rollback.
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api.js';
import { diffLines } from '../utils/diff.js';
import './collab.css';

export default function VersionHistory({ workspaceId, sectionKey, onRestored, onClose }) {
  const { t } = useTranslation();
  const base = `/workspaces/${workspaceId}/sections/${sectionKey}`;
  const [versions, setVersions] = useState(null);
  const [selected, setSelected] = useState(null); // full version row
  const [diff, setDiff] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    api.get(`${base}/versions`).then((r) => setVersions(r.data.versions));
  }, [workspaceId, sectionKey]);

  async function compare(v) {
    setBusy(true); setNote('');
    try {
      const [vr, sr] = await Promise.all([
        api.get(`${base}/versions/${v.id}`),
        api.get(base),
      ]);
      setSelected(vr.data.version);
      setDiff(diffLines(sr.data.section.content || '', vr.data.version.content || ''));
    } finally { setBusy(false); }
  }

  async function restore(v) {
    setBusy(true);
    try {
      await api.post(`${base}/versions/${v.id}/rollback`);
      setNote(t('versions.restored'));
      const r = await api.get(`${base}/versions`);
      setVersions(r.data.versions);
      setSelected(null); setDiff(null);
      onRestored?.();
    } finally { setBusy(false); }
  }

  return (
    <div className="card" style={{ marginTop: '.8rem' }}>
      <div className="spread">
        <h3 style={{ marginBottom: 0 }}>{t('versions.title')}</h3>
        <button className="ghost sm" onClick={onClose}>{t('versions.close')}</button>
      </div>
      {note && <p className="ok">{note}</p>}
      {!versions ? <p className="muted">{t('versions.loading')}</p>
        : versions.length === 0 ? <p className="muted">{t('versions.empty')}</p>
          : (
            <table>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id} style={{ background: selected?.id === v.id ? '#eef3f9' : 'transparent' }}>
                    <td className="mono">v{v.version_no}</td>
                    <td>{v.change_note || '—'}</td>
                    <td className="muted">
                      {t('versions.by')} {v.editor?.full_name || '—'} · {new Date(v.created_at).toLocaleString()} · {v.chars} {t('versions.chars')}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="ghost sm" onClick={() => compare(v)} disabled={busy}>{t('versions.compare')}</button>{' '}
                      <button className="ghost sm" onClick={() => restore(v)} disabled={busy}>{t('versions.restore')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      {diff && (
        <div className="diff-view" style={{ marginTop: '.6rem' }}>
          {diff.map((l, i) => (
            <div key={i} className={`diff-line ${l.type === 'same' ? '' : l.type}`}>
              {l.type === 'add' ? '+ ' : l.type === 'del' ? '- ' : '  '}{l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
