// Authentication: scrypt password hashing (no native deps), JWTs signed via
// the keyManager provider, and TOTP helpers for MFA (Module 18).
const crypto = require('crypto');
const { authenticator } = require('otplib');
const keyManager = require('./security/keyManager');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const MFA_TOKEN_EXPIRES_IN = process.env.MFA_TOKEN_EXPIRES_IN || '5m';

// Dedicated TOTP instance (±1 time-step window for clock drift) — avoids
// mutating otplib's shared default options.
const totp = authenticator.clone({ window: 1 });

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const calc = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return calc.length === expected.length && crypto.timingSafeEqual(calc, expected);
}

function signToken(user) {
  return keyManager.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.full_name },
    { expiresIn: JWT_EXPIRES_IN },
  );
}

// Short-lived, scope-limited token issued after the password step when MFA is
// enabled; only /auth/mfa/login accepts it.
function signMfaToken(user) {
  return keyManager.sign({ sub: user.id, scope: 'mfa' }, { expiresIn: MFA_TOKEN_EXPIRES_IN });
}

function verifyToken(token) {
  return keyManager.verify(token);
}

// Express middleware: require a valid Bearer token; attaches req.user.
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing bearer token' });
  try {
    const payload = verifyToken(token);
    if (payload.scope === 'mfa') {
      return res.status(401).json({ error: 'MFA verification incomplete' });
    }
    req.user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
    next();
  } catch {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

// Guard: only allow listed roles.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `requires role: ${roles.join(' | ')}` });
    }
    next();
  };
}

// --- TOTP (MFA) ---

function generateMfaSecret(email) {
  const secret = totp.generateSecret();
  return { secret, otpauth_url: totp.keyuri(email, 'IPOW', secret) };
}

function verifyMfaCode(secret, code) {
  try {
    return totp.check(String(code || '').replace(/\s/g, ''), secret);
  } catch {
    return false;
  }
}

module.exports = {
  hashPassword, verifyPassword,
  signToken, signMfaToken, verifyToken,
  authRequired, requireRole,
  generateMfaSecret, verifyMfaCode,
};
