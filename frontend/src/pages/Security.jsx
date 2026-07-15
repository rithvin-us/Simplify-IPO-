// Module 18 — account security: TOTP MFA enrolment / removal.
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api.js';

export default function Security() {
  const { t } = useTranslation();
  const [me, setMe] = useState(null);
  const [setup, setSetup] = useState(null); // { secret, otpauth_url }
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api.get('/auth/me').then((r) => setMe(r.data.user));
  }
  useEffect(load, []);

  async function startSetup() {
    setErr(''); setMsg(''); setBusy(true);
    try {
      const { data } = await api.post('/auth/mfa/setup');
      setSetup(data);
    } finally { setBusy(false); }
  }

  async function enable(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await api.post('/auth/mfa/enable', { code });
      setMsg(t('security.enabledOk'));
      setSetup(null); setCode('');
      load();
    } catch {
      setErr(t('security.invalidCode'));
    } finally { setBusy(false); }
  }

  async function disable(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await api.post('/auth/mfa/disable', { code });
      setMsg(t('security.disabledOk'));
      setCode('');
      load();
    } catch {
      setErr(t('security.invalidCode'));
    } finally { setBusy(false); }
  }

  if (!me) return null;
  return (
    <div className="center" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
      <div className="card" style={{ width: 480 }}>
        <h2>{t('security.title')}</h2>
        <p className="muted">{t('security.subtitle')}</p>
        <p>
          {t('security.status')}:{' '}
          <span className={`badge ${me.mfa_enabled ? 'final' : 'empty'}`}>
            {me.mfa_enabled ? t('security.enabled') : t('security.disabled')}
          </span>
        </p>

        {msg && <p className="ok">{msg}</p>}
        {err && <div className="err">{err}</div>}

        {!me.mfa_enabled && !setup && (
          <button onClick={startSetup} disabled={busy}>{t('security.setup')}</button>
        )}

        {!me.mfa_enabled && setup && (
          <form onSubmit={enable} className="stack">
            <p className="muted">{t('security.setupHint')}</p>
            <p><b>{t('security.secret')}:</b> <span className="mono">{setup.secret}</span></p>
            <p className="mono" style={{ wordBreak: 'break-all', fontSize: '.8rem' }}>{setup.otpauth_url}</p>
            <div>
              <label>{t('security.code')}</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} />
            </div>
            <button type="submit" disabled={busy || code.length < 6}>{t('security.confirm')}</button>
          </form>
        )}

        {me.mfa_enabled && (
          <form onSubmit={disable} className="stack">
            <p className="muted">{t('security.disableHint')}</p>
            <div>
              <label>{t('security.code')}</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} />
            </div>
            <button type="submit" className="ghost" disabled={busy || code.length < 6}>{t('security.disable')}</button>
          </form>
        )}
      </div>
    </div>
  );
}
