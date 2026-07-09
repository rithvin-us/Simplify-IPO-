import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api.js';

// Issues (raise / discuss / close) + commits (recorded sign-offs). Merchant
// bankers, familiar with the platform, typically drive both.
export default function IssuesPanel() {
  const { workspaceId } = useOutletContext();
  const [issues, setIssues] = useState([]);
  const [commits, setCommits] = useState([]);
  const [sections, setSections] = useState([]);
  const [active, setActive] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', section_key: '' });
  const [comment, setComment] = useState('');
  const [commitMsg, setCommitMsg] = useState('');
  const [commitSec, setCommitSec] = useState('');

  function load() {
    api.get(`/workspaces/${workspaceId}/issues`).then((r) => setIssues(r.data.issues));
    api.get(`/workspaces/${workspaceId}/commits`).then((r) => setCommits(r.data.commits));
  }
  useEffect(() => {
    load();
    api.get('/meta').then((r) => setSections(r.data.sections || []));
  }, [workspaceId]);

  function open(id) {
    setActive(id);
    api.get(`/workspaces/${workspaceId}/issues/${id}`).then((r) => setDetail(r.data));
  }
  async function create(e) {
    e.preventDefault();
    if (!form.title) return;
    await api.post(`/workspaces/${workspaceId}/issues`, form);
    setForm({ title: '', body: '', section_key: '' }); load();
  }
  async function addComment() {
    await api.post(`/workspaces/${workspaceId}/issues/${active}/comments`, { body: comment });
    setComment(''); open(active); load();
  }
  async function setStatus(status) {
    await api.post(`/workspaces/${workspaceId}/issues/${active}/status`, { status });
    open(active); load();
  }
  async function commit() {
    if (!commitMsg) return;
    await api.post(`/workspaces/${workspaceId}/commits`, { message: commitMsg, section_key: commitSec || null });
    setCommitMsg(''); setCommitSec(''); load();
  }

  return (
    <div className="stack">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        {/* Issues list + create */}
        <div className="card" style={{ flex: 1, minWidth: 300 }}>
          <h3>Issues</h3>
          <form onSubmit={create} className="stack" style={{ marginBottom: '1rem' }}>
            <input placeholder="Issue title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea style={{ minHeight: 60 }} placeholder="Describe the problem…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            <div className="row">
              <select value={form.section_key} onChange={(e) => setForm({ ...form, section_key: e.target.value })} style={{ width: 'auto' }}>
                <option value="">— no section —</option>
                {sections.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}
              </select>
              <button type="submit">Raise issue</button>
            </div>
          </form>
          {issues.length === 0 && <p className="muted">No issues yet.</p>}
          <div className="stack">
            {issues.map((i) => (
              <div key={i.id} onClick={() => open(i.id)} style={{ cursor: 'pointer', padding: '.4rem', borderRadius: 6, background: active === i.id ? '#eef3f9' : 'transparent' }}>
                <span className={`badge ${i.status === 'open' ? 'ai_generated' : 'legal_reviewed'}`}>{i.status}</span>{' '}
                <strong>#{i.id}</strong> {i.title} <span className="muted">· {i.author?.full_name} · {i.comments} 💬</span>
              </div>
            ))}
          </div>
        </div>

        {/* Issue detail */}
        <div className="card" style={{ flex: 1, minWidth: 300 }}>
          {!detail ? <p className="muted">Select an issue.</p> : (
            <>
              <div className="spread">
                <h3 style={{ marginBottom: 0 }}>#{detail.issue.id} {detail.issue.title}</h3>
                <span className={`badge ${detail.issue.status === 'open' ? 'ai_generated' : 'legal_reviewed'}`}>{detail.issue.status}</span>
              </div>
              <p className="muted">by {detail.issue.author?.full_name}{detail.issue.section_key && ` · section: ${detail.issue.section_key}`}</p>
              {detail.issue.body && <div className="draft-preview">{detail.issue.body}</div>}
              <h3 style={{ marginTop: '1rem' }}>Discussion</h3>
              {detail.comments.length === 0 && <p className="muted">No comments.</p>}
              <div className="stack">
                {detail.comments.map((c) => (
                  <div key={c.id} style={{ borderLeft: '3px solid var(--border)', paddingLeft: '.6rem' }}>
                    <strong>{c.author?.full_name}</strong> <span className="muted mono">({c.author?.role})</span>
                    <div>{c.body}</div>
                  </div>
                ))}
              </div>
              <div className="stack" style={{ marginTop: '.8rem' }}>
                <textarea style={{ minHeight: 60 }} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" />
                <div className="row">
                  <button className="ghost sm" onClick={addComment} disabled={!comment}>Comment</button>
                  {detail.issue.status === 'open'
                    ? <button className="sm" onClick={() => setStatus('closed')}>Close issue</button>
                    : <button className="ghost sm" onClick={() => setStatus('open')}>Reopen</button>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Commits */}
      <div className="card">
        <h3>Commits</h3>
        <p className="muted">A commit records a signed change to the draft — a lightweight audit trail of who changed what and why.</p>
        <div className="row" style={{ marginBottom: '.8rem' }}>
          <input placeholder="Commit message (e.g. 'Tightened Objects of the Issue wording')" value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} />
          <select value={commitSec} onChange={(e) => setCommitSec(e.target.value)} style={{ width: 'auto' }}>
            <option value="">— no section —</option>
            {sections.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}
          </select>
          <button onClick={commit} disabled={!commitMsg}>Commit</button>
        </div>
        {commits.length === 0 ? <p className="muted">No commits yet.</p> : (
          <table>
            <thead><tr><th>#</th><th>Message</th><th>Section</th><th>Author</th><th>When</th></tr></thead>
            <tbody>
              {commits.map((c) => (
                <tr key={c.id}>
                  <td className="mono">{c.id}</td><td>{c.message}</td>
                  <td className="muted">{c.section_key || '—'}</td>
                  <td>{c.author?.full_name}</td>
                  <td className="muted">{new Date(c.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
