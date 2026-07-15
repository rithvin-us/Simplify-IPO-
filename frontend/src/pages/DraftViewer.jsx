import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api.js';
import { useAuth } from '../auth.jsx';
import CollabEditor from '../components/CollabEditor.jsx';
import VersionHistory from '../components/VersionHistory.jsx';

// Module 17 — languages the AI service can draft in natively.
const DRAFT_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
];

export default function DraftViewer() {
  const { workspaceId } = useOutletContext();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [sections, setSections] = useState([]);
  const [active, setActive] = useState(null);
  const [missing, setMissing] = useState([]);
  const [citations, setCitations] = useState([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [descs, setDescs] = useState({});
  const [draftLang, setDraftLang] = useState('en');
  const [showHistory, setShowHistory] = useState(false);
  // Reads the live CRDT text out of the collaborative editor.
  const contentRef = useRef(null);

  function load() {
    api.get(`/workspaces/${workspaceId}/sections`).then((r) => {
      setSections(r.data.sections);
      if (!active && r.data.sections.length) select(r.data.sections[0]);
    });
  }
  useEffect(load, [workspaceId]);
  useEffect(() => {
    api.get('/meta').then((r) => {
      const m = {};
      (r.data.sections || []).forEach((s) => { m[s.key] = s.description; });
      setDescs(m);
    });
  }, []);

  function select(s) {
    setActive(s); setMissing([]); setCitations([]); setNote(''); setShowHistory(false);
  }

  async function generate() {
    setBusy(true); setNote('');
    try {
      const { data } = await api.post(
        `/workspaces/${workspaceId}/sections/${active.section_key}/generate`,
        { language: draftLang },
      );
      setMissing(data.missing || []);
      setCitations(data.citations || []);
      setNote(t('draft.generated', { mode: data.mode }));
      load();
    } finally { setBusy(false); }
  }

  async function save() {
    const content = contentRef.current ? contentRef.current() : (active.content || '');
    const { data } = await api.put(
      `/workspaces/${workspaceId}/sections/${active.section_key}`,
      { content },
    );
    setActive(data.section);
    setNote(t('draft.saved'));
    load();
  }

  const isFinal = active?.status === 'final';

  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <div className="card" style={{ width: 240, flex: '0 0 240px' }}>
        <h3>{t('draft.sections')}</h3>
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
        {!active ? <p className="muted">{t('draft.select')}</p> : (
          <>
            <div className="spread">
              <h3 style={{ marginBottom: 0 }}>{active.title}</h3>
              <div className="row">
                <select value={draftLang} onChange={(e) => setDraftLang(e.target.value)} title={t('draft.language')}>
                  {DRAFT_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                <button className="ghost" onClick={generate} disabled={busy || isFinal}>
                  {busy ? t('draft.generating') : (active.content ? t('draft.regenerate') : t('draft.generate'))}
                </button>
                <button onClick={save} disabled={isFinal}>{t('draft.save')}</button>
                <button className="ghost" onClick={() => setShowHistory((v) => !v)}>
                  {showHistory ? t('draft.hideHistory') : t('draft.history')}
                </button>
              </div>
            </div>
            {descs[active.section_key] && <div className="field-desc" style={{ marginTop: '.4rem' }}>{descs[active.section_key]}</div>}
            {missing.length > 0 && <div className="notice" style={{ marginTop: '.6rem' }}>{t('draft.missing', { fields: missing.join(', ') })}</div>}
            {citations.length > 0 && <div className="field-desc" style={{ marginTop: '.4rem' }}>{t('draft.citations', { refs: citations.join('; ') })}</div>}
            {note && <p className="ok">{note}</p>}

            {isFinal ? (
              <>
                <div className="notice" style={{ marginTop: '.6rem' }}>{t('draft.finalNotice')}</div>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: '.6rem' }}>{active.content}</pre>
              </>
            ) : (
              <CollabEditor
                key={`${workspaceId}/${active.section_key}`}
                workspaceId={workspaceId}
                sectionKey={active.section_key}
                user={user}
                contentRef={contentRef}
              />
            )}

            {showHistory && (
              <VersionHistory
                workspaceId={workspaceId}
                sectionKey={active.section_key}
                onRestored={load}
                onClose={() => setShowHistory(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
