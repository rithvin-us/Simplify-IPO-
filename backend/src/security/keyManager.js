// Key management abstraction (Module 18 — Enterprise Security).
// JWT signing keys are resolved through a provider so the same call sites work
// from dev (env secret) to production (HSM/KMS-held keys):
//
//   env  — HMAC-SHA256 with JWT_SECRET. Development default.
//   file — RS256 with PEM key files mounted from a secret store. The private
//          key never lives in the repo; verify() only needs the public key,
//          which is the same shape a KMS-exported public key takes.
//   kms / hsm — integration stub. In production the private key material never
//          leaves the HSM: sign() submits the JWT signing input to the device
//          (AWS KMS `kms:Sign`, CloudHSM/PKCS#11 `C_Sign`) and only the public
//          key is loaded here for verification. See docs/SECURITY_ARCHITECTURE.md.
const fs = require('fs');
const jwt = require('jsonwebtoken');

const PROVIDER = (process.env.KEY_PROVIDER || 'env').toLowerCase();

let signKey;
let verifyKey;
let algorithm;

function init() {
  if (PROVIDER === 'env') {
    const secret = process.env.JWT_SECRET || 'change-me';
    if (secret === 'change-me' && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production (or use KEY_PROVIDER=file)');
    }
    signKey = secret;
    verifyKey = secret;
    algorithm = 'HS256';
    return;
  }
  if (PROVIDER === 'file') {
    const priv = process.env.JWT_PRIVATE_KEY_FILE;
    const pub = process.env.JWT_PUBLIC_KEY_FILE;
    if (!priv || !pub) {
      throw new Error('KEY_PROVIDER=file requires JWT_PRIVATE_KEY_FILE and JWT_PUBLIC_KEY_FILE');
    }
    signKey = fs.readFileSync(priv, 'utf8');
    verifyKey = fs.readFileSync(pub, 'utf8');
    algorithm = 'RS256';
    return;
  }
  if (PROVIDER === 'kms' || PROVIDER === 'hsm') {
    throw new Error(
      `KEY_PROVIDER=${PROVIDER} is an integration stub — wire sign() to your KMS/HSM client `
      + '(AWS KMS kms:Sign or PKCS#11 C_Sign) and load the public key for verify(). '
      + 'See docs/SECURITY_ARCHITECTURE.md §3.',
    );
  }
  throw new Error(`unknown KEY_PROVIDER '${PROVIDER}' (env | file | kms | hsm)`);
}
init();

const sign = (payload, opts = {}) => jwt.sign(payload, signKey, { algorithm, ...opts });
const verify = (token) => jwt.verify(token, verifyKey, { algorithms: [algorithm] });
const describe = () => ({ provider: PROVIDER, algorithm });

module.exports = { sign, verify, describe };
