import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../auth.jsx';

const ROLE_LABEL = { sme: 'SME', merchant_banker: 'Merchant Banker', legal_counsel: 'Legal Counsel', admin: 'Admin' };

// Company chooses its legal advisor + merchant banker and requests access
// (GitHub-style). The invitee accepts from their dashboard inbox.
export default function AccessPanel() {
  const { workspaceId } = useOutletContext();
  const { user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [requests, setRequests] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('merchant_banker');
  const [message, setMessage] = useState('');
  const [err, setErr] = useState('');

  function load() {
    api.get(`/workspaces/${workspaceId}`).then((r) => setDetail(r.data));
    api.get(`/workspaces/${workspaceId}/requests`).then((r) => setRequests(r.data.requests));
  }
  useEffect(load, [workspaceId]);

  const isOwner = detail && detail.workspace.created_by === user.id;

  async function request(e) {
    e.preventDefault(); setErr('');
    try {
      await api.post(`/workspaces/${workspaceId}/requests`, { target_email: email, target_role: role, message });
      setEmail(''); setMessage(''); load();
    } catch (e2) { setErr(e2.response?.data?.error || 'request failed'); }
  }

  if (!detail) return <div className="card">Loading…</div>;

  return (
    <div className="stack">
      <div className="card">
        <h3>Collaborators</h3>
        <p className="muted">The company, its merchant banker and legal counsel co-author this DRHP. Contact details below.</p>
        <table>
          <thead><tr><th>Name</th><th>Role</th><th>Email</th></tr></thead>
          <tbody>
            {detail.members.map((m) => (
              <tr key={m.user_id}>
                <td>{m.user?.full_name}{detail.workspace.created_by === m.user_id && ' (owner)'}</td>
                <td><span className="badge ai_generated">{ROLE_LABEL[m.member_role] || m.member_role}</span></td>
                <td className="mono">{m.user?.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOwner && (
        <div className="card" style={{ maxWidth: 520 }}>
          <h3>Request a collaborator</h3>
          <p className="muted">Invite your merchant banker or legal counsel by email. They approve the request before joining.</p>
          <form onSubmit={request} className="stack">
            <div><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mb@demo.in" required /></div>
            <div><label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="merchant_banker">Merchant Banker</option>
                <option value="legal_counsel">Legal Counsel</option>
              </select>
            </div>
            <div><label>Message (optional)</label><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Please help review our DRHP" /></div>
            {err && <div className="err">{err}</div>}
            <button type="submit">Send request</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Access requests</h3>
        {requests.length === 0 ? <p className="muted">No requests yet.</p> : (
          <table>
            <thead><tr><th>Invitee</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.target_email}</td>
                  <td>{ROLE_LABEL[r.target_role]}</td>
                  <td><span className={`badge ${r.status === 'accepted' ? 'legal_reviewed' : r.status === 'declined' ? 'missing' : 'sme_verified'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
