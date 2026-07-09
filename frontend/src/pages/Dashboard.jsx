import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [name, setName] = useState('');
  const [cin, setCin] = useState('');
  const [err, setErr] = useState('');

  function load() {
    api.get('/workspaces').then((r) => setList(r.data)).catch(() => {});
    api.get('/requests/incoming').then((r) => setIncoming(r.data.requests)).catch(() => {});
  }
  useEffect(load, []);

  async function respond(id, action) {
    await api.post(`/requests/${id}/${action}`);
    load();
  }

  async function create(e) {
    e.preventDefault(); setErr('');
    try {
      await api.post('/workspaces', { company_name: name, cin });
      setName(''); setCin(''); load();
    } catch (e2) { setErr(e2.response?.data?.error || 'failed to create'); }
  }

  return (
    <div className="container">
      <h1>Your IPO Workspaces</h1>
      <p className="muted">Signed in as {user.full_name}. Each workspace is one company’s DRHP draft.</p>

      {incoming.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <h3>Access requests for you</h3>
          {incoming.map((r) => (
            <div key={r.id} className="spread" style={{ padding: '.4rem 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong>{r.company_name}</strong> wants you as <span className="badge ai_generated">{r.target_role.replace('_', ' ')}</span>
                <div className="muted">from {r.requester?.full_name}{r.message && ` — “${r.message}”`}</div>
              </div>
              <div className="row">
                <button className="sm" onClick={() => respond(r.id, 'accept')}>Accept</button>
                <button className="ghost sm" onClick={() => respond(r.id, 'decline')}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid">
        {list.map((w) => (
          <Link key={w.id} to={`/w/${w.id}`} className="card" style={{ color: 'inherit', display: 'block' }}>
            <div className="spread">
              <h3 style={{ marginBottom: 0 }}>{w.company_name}</h3>
              <span className="score" style={{ fontSize: '1.4rem' }}>{w.health}</span>
            </div>
            <div className="muted mono">{w.cin || 'CIN pending'}</div>
            <div className="meter" style={{ marginTop: '.6rem' }}><span style={{ width: `${w.health}%` }} /></div>
          </Link>
        ))}
        {list.length === 0 && <div className="muted">No workspaces yet.</div>}
      </div>

      {user.role === 'sme' && (
        <div className="card" style={{ marginTop: '1rem', maxWidth: 480 }}>
          <h3>Start a new IPO</h3>
          <form onSubmit={create} className="stack">
            <div><label>Company name</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><label>CIN (optional)</label><input value={cin} onChange={(e) => setCin(e.target.value)} placeholder="U27100MH2015PLC123456" /></div>
            {err && <div className="err">{err}</div>}
            <button type="submit">Create workspace</button>
          </form>
        </div>
      )}
    </div>
  );
}
