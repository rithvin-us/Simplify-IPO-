import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../auth.jsx';

export default function ReviewView() {
  const { workspaceId } = useOutletContext();
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [active, setActive] = useState(null);
  const [detail, setDetail] = useState(null);
  const [body, setBody] = useState('');

  function loadSections() {
    api.get(`/workspaces/${workspaceId}/sections`).then((r) => {
      setSections(r.data.sections);
      if (!active && r.data.sections.length) open(r.data.sections[0].section_key);
    });
  }
  useEffect(loadSections, [workspaceId]);

  function open(key) {
    setActive(key);
    api.get(`/workspaces/${workspaceId}/sections/${key}`).then((r) => setDetail(r.data));
  }

  async function act(action) {
    await api.post(`/workspaces/${workspaceId}/sections/${active}/comments`, { action, body });
    setBody(''); open(active); loadSections();
  }

  const canReview = user.role === 'merchant_banker' || user.role === 'legal_counsel' || user.role === 'admin';

  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <div className="card" style={{ width: 240, flex: '0 0 240px' }}>
        <h3>Sections</h3>
        <div className="stack">
          {sections.map((s) => (
            <div key={s.section_key} onClick={() => open(s.section_key)}
              style={{ cursor: 'pointer', padding: '.4rem', borderRadius: 6, background: active === s.section_key ? '#eef3f9' : 'transparent' }}>
              <div>{s.title}</div>
              <span className={`badge ${s.status}`}>{s.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ flex: 1, minWidth: 320 }}>
        {!detail ? <p className="muted">Select a section to review.</p> : (
          <>
            <div className="spread">
              <h3 style={{ marginBottom: 0 }}>{detail.section.title}</h3>
              <span className={`badge ${detail.section.status}`}>{detail.section.status.replace('_', ' ')}</span>
            </div>
            <div className="draft-preview" style={{ marginTop: '.6rem' }}>{detail.section.content || '(not drafted yet)'}</div>

            <h3 style={{ marginTop: '1rem' }}>Comments</h3>
            {detail.comments.length === 0 && <p className="muted">No comments yet.</p>}
            <div className="stack">
              {detail.comments.map((c) => (
                <div key={c.id} style={{ borderLeft: '3px solid var(--border)', paddingLeft: '.6rem' }}>
                  <span className={`badge ${c.action === 'approve' ? 'legal_reviewed' : c.action === 'reject' ? 'missing' : 'ai_generated'}`}>{c.action.replace('_', ' ')}</span>{' '}
                  <strong>{c.author?.full_name}</strong> <span className="muted mono">({c.author?.role})</span>
                  {c.body && <div>{c.body}</div>}
                </div>
              ))}
            </div>

            {canReview ? (
              <div className="stack" style={{ marginTop: '1rem' }}>
                <textarea style={{ minHeight: 70 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Review note (optional for approve/reject)…" />
                <div className="row">
                  <button className="ghost sm" onClick={() => act('comment')}>Comment</button>
                  <button className="ghost sm" onClick={() => act('change_request')}>Request changes</button>
                  <button className="sm" onClick={() => act('approve')}>Approve</button>
                  <button className="sm" style={{ background: 'var(--err)', borderColor: 'var(--err)' }} onClick={() => act('reject')}>Reject</button>
                </div>
              </div>
            ) : <p className="muted" style={{ marginTop: '1rem' }}>Reviewing is limited to merchant bankers and legal counsel.</p>}
          </>
        )}
      </div>
    </div>
  );
}
