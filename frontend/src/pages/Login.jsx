import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login, mfaLogin } = useAuth();
  const { t } = useTranslation();
  const nav = useNavigate();
  const [email, setEmail] = useState('sme@demo.in');
  const [password, setPassword] = useState('demo');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  // MFA step-up state: set when the password was correct but a TOTP code is needed.
  const [mfaToken, setMfaToken] = useState(null);
  const [code, setCode] = useState('');

  async function go(em, pw) {
    setErr(''); setBusy(true);
    try {
      const result = await login(em, pw);
      if (result.mfa_required) {
        setMfaToken(result.mfa_token);
      } else {
        nav('/');
      }
    } catch {
      setErr(t('login.invalid'));
    } finally {
      setBusy(false);
    }
  }

  async function verifyMfa(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await mfaLogin(mfaToken, code);
      nav('/');
    } catch {
      setErr(t('login.mfaInvalid'));
    } finally {
      setBusy(false);
    }
  }

  if (mfaToken) {
    return (
      <div className="center">
        <div className="card" style={{ width: 380 }}>
          <h1>{t('app.title')}</h1>
          <p className="muted">{t('login.mfaTitle')}</p>
          <form onSubmit={verifyMfa} className="stack">
            <p>{t('login.mfaPrompt')}</p>
            <div>
              <label>{t('login.mfaCode')}</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoFocus
                maxLength={6}
              />
            </div>
            {err && <div className="err">{err}</div>}
            <button type="submit" disabled={busy || code.length < 6}>
              {busy ? t('login.verifying') : t('login.verify')}
            </button>
            <button type="button" className="ghost sm" onClick={() => { setMfaToken(null); setCode(''); setErr(''); }}>
              {t('login.back')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="center">
      <div className="card" style={{ width: 380 }}>
        <h1>{t('app.title')}</h1>
        <p className="muted">{t('login.signin')}</p>
        <form onSubmit={(e) => { e.preventDefault(); go(email, password); }} className="stack">
          <div><label>{t('login.email')}</label><input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label>{t('login.password')}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {err && <div className="err">{err}</div>}
          <button type="submit" disabled={busy}>{busy ? t('login.submitting') : t('login.submit')}</button>
        </form>
        <p className="muted" style={{ margin: '1rem 0 .3rem' }}>{t('login.demo')}</p>
        <div className="row">
          <button className="ghost sm" onClick={() => go('sme@demo.in', 'demo')}>SME</button>
          <button className="ghost sm" onClick={() => go('mb@demo.in', 'demo')}>Merchant Banker</button>
          <button className="ghost sm" onClick={() => go('legal@demo.in', 'demo')}>Legal Counsel</button>
        </div>
      </div>
    </div>
  );
}
