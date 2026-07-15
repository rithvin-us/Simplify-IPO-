// /api/auth — login (with optional MFA step-up), register, MFA enrolment.
const express = require('express');
const {
  verifyPassword, signToken, signMfaToken, verifyToken,
  authRequired, generateMfaSecret, verifyMfaCode,
} = require('../auth');
const store = require('../store');
const { ah } = require('../middleware');

const router = express.Router();
const ROLES = ['sme', 'merchant_banker', 'legal_counsel', 'admin'];

// Step 1: password. If the account has MFA enabled, a full token is NOT issued
// yet — the client gets a short-lived mfa_token to exchange at /mfa/login.
router.post('/login', ah(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await store.findUserByEmail(email || '');
  if (!user || !verifyPassword(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  if (user.mfa_enabled) {
    return res.json({ mfa_required: true, mfa_token: signMfaToken(user) });
  }
  res.json({ token: signToken(user), user: store.publicUser(user) });
}));

// Step 2: exchange mfa_token + TOTP code for a full session token.
router.post('/mfa/login', ah(async (req, res) => {
  const { mfa_token, code } = req.body || {};
  let payload;
  try {
    payload = verifyToken(mfa_token || '');
  } catch {
    return res.status(401).json({ error: 'invalid or expired MFA token' });
  }
  if (payload.scope !== 'mfa') return res.status(401).json({ error: 'not an MFA token' });
  const user = await store.getUserById(payload.sub);
  if (!user || !user.mfa_enabled || !verifyMfaCode(user.mfa_secret, code)) {
    return res.status(401).json({ error: 'invalid MFA code' });
  }
  res.json({ token: signToken(user), user: store.publicUser(user) });
}));

router.post('/register', ah(async (req, res) => {
  const { email, password, full_name, role } = req.body || {};
  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'email, password, full_name, role required' });
  }
  if (!ROLES.includes(role)) return res.status(400).json({ error: `role must be one of ${ROLES.join(', ')}` });
  if (await store.findUserByEmail(email)) return res.status(409).json({ error: 'email already registered' });
  const user = await store.createUser({ email, password, full_name, role });
  res.status(201).json({ token: signToken(user), user: store.publicUser(user) });
}));

router.get('/me', authRequired, ah(async (req, res) => {
  const user = await store.getUserById(req.user.id);
  if (!user) return res.status(401).json({ error: 'user no longer exists' });
  res.json({ user: { ...store.publicUser(user), mfa_enabled: user.mfa_enabled } });
}));

// --- MFA enrolment (authenticated) ---

// Generate a TOTP secret; stored but NOT enabled until a valid code proves
// the user actually enrolled it in an authenticator app.
router.post('/mfa/setup', authRequired, ah(async (req, res) => {
  const user = await store.getUserById(req.user.id);
  const { secret, otpauth_url } = generateMfaSecret(user.email);
  await store.setMfaSecret(user.id, secret);
  res.json({ secret, otpauth_url });
}));

router.post('/mfa/enable', authRequired, ah(async (req, res) => {
  const user = await store.getUserById(req.user.id);
  if (!user.mfa_secret) return res.status(400).json({ error: 'run /auth/mfa/setup first' });
  if (!verifyMfaCode(user.mfa_secret, (req.body || {}).code)) {
    return res.status(401).json({ error: 'invalid code' });
  }
  await store.setMfaEnabled(user.id, true);
  res.json({ ok: true, mfa_enabled: true });
}));

router.post('/mfa/disable', authRequired, ah(async (req, res) => {
  const user = await store.getUserById(req.user.id);
  if (user.mfa_enabled && !verifyMfaCode(user.mfa_secret, (req.body || {}).code)) {
    return res.status(401).json({ error: 'invalid code' });
  }
  await store.setMfaEnabled(user.id, false);
  res.json({ ok: true, mfa_enabled: false });
}));

module.exports = router;
