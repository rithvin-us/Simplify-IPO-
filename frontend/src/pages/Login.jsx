import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('sme@demo.in');
  const [password, setPassword] = useState('demo');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function go(em, pw) {
    setErr(''); setBusy(true);
    try {
      await login(em, pw);
      nav('/');
    } catch {
      setErr('Invalid credentials');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <div className="card" style={{ width: 380 }}>
        <h1>IPOW</h1>
        <p className="muted">IPO Drafting Workspace — sign in</p>
        <form onSubmit={(e) => { e.preventDefault(); go(email, password); }} className="stack">
          <div><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {err && <div className="err">{err}</div>}
          <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="muted" style={{ margin: '1rem 0 .3rem' }}>Quick demo roles (password “demo”):</p>
        <div className="row">
          <button className="ghost sm" onClick={() => go('sme@demo.in', 'demo')}>SME</button>
          <button className="ghost sm" onClick={() => go('mb@demo.in', 'demo')}>Merchant Banker</button>
          <button className="ghost sm" onClick={() => go('legal@demo.in', 'demo')}>Legal Counsel</button>
        </div>
      </div>
    </div>
  );
}
