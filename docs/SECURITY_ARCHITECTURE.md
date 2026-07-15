# IPOW — Enterprise Security Architecture (Module 18)

Phase 2 security design for the IPO Drafting Workspace: MFA, key management
(HSM-ready), and Zero Trust enforcement. Maps every control to the code that
implements it.

## 1. Authentication & MFA

Password sign-in stays scrypt-hashed (`backend/src/auth.js`). MFA adds a TOTP
second factor (RFC 6238, `otplib`):

```
POST /api/auth/login          password ok, MFA off  -> { token, user }
POST /api/auth/login          password ok, MFA on   -> { mfa_required, mfa_token }   (5-min JWT, scope: "mfa")
POST /api/auth/mfa/login      { mfa_token, code }   -> { token, user }
```

Enrolment (authenticated):

```
POST /api/auth/mfa/setup      -> { secret, otpauth_url }   stored, NOT yet enabled
POST /api/auth/mfa/enable     { code }                     enabled only after a valid code
POST /api/auth/mfa/disable    { code }
```

Design properties:

- The `mfa_token` is scope-limited; `authRequired` rejects it for every API
  route and the WebSocket layer rejects it on upgrade — a stolen intermediate
  token grants nothing.
- Secrets live in `users.mfa_secret` (migration `003_mfa.sql`). In production,
  encrypt this column with a KMS data key (envelope encryption, §3).
- TOTP window is ±1 step (30 s) for clock drift.

Hardening roadmap: WebAuthn/passkeys as a second method, recovery codes,
rate-limiting `/mfa/login` attempts per account.

## 2. Token & session model

- JWTs are signed via the **keyManager** (§3), 8 h expiry (`JWT_EXPIRES_IN`).
- Claims carry identity only (`sub`, email, role, name). Authorisation is
  never taken from the token alone — see §4.
- Realtime connections authenticate with the same JWT at WebSocket upgrade
  (`backend/src/realtime.js`). Note: the token travels as a query parameter,
  which can land in proxy logs; in production replace with a one-time,
  short-lived *connection ticket* issued over REST, or pass the token via the
  WebSocket subprotocol header.

## 3. Key management — HSM/KMS integration

All signing flows go through `backend/src/security/keyManager.js`, selected by
`KEY_PROVIDER`:

| Provider | Algorithm | Key location | Use |
|---|---|---|---|
| `env` | HS256 | `JWT_SECRET` env var | development default |
| `file` | RS256 | PEM files mounted from a secret store (Vault/K8s secret) | staging |
| `kms` / `hsm` | RS256/ES256 | **never leaves the HSM** | production (stub today) |

Production integration contract (the stub documents the exact seam):

1. Key pair is generated *inside* AWS KMS / CloudHSM / a PKCS#11 token
   (non-exportable).
2. `sign()` submits the JWT signing input to the device — `kms:Sign` or
   PKCS#11 `C_Sign` — so private key material never enters process memory.
3. `verify()` uses only the exported **public** key; services that merely
   verify tokens need no HSM access at all.
4. Key rotation: publish a JWKS with `kid` headers; keep N and N-1 valid
   during rollover.

Envelope encryption (same KMS root) for data at rest: `users.mfa_secret`,
uploaded documents in `UPLOAD_DIR`/S3, and future DRHP export archives.

## 4. Zero Trust enforcement

Principle: **no request is trusted because of where it came from or what it
holds — every request re-proves identity and authorisation.**

Implemented controls:

- **Per-request membership checks** — `loadWs` (`backend/src/middleware.js`)
  re-queries workspace membership from Postgres on *every* workspace-scoped
  request; role claims in the JWT are never sufficient.
- **Per-connection realtime checks** — the WebSocket upgrade re-verifies the
  JWT, membership, and section state (`final` ⇒ refused) before any CRDT sync.
- **Least-privilege roles** — `requireRole` gates workspace creation; section
  status transitions are role-mapped (`STATUS_ROLE` in routes/sections.js);
  review verdicts are reviewer-only.
- **Immutable audit trail** — `activity_log` records every material action
  (uploads, generation, edits, rollbacks, review verdicts, consistency runs)
  with actor and timestamp; `section_versions` makes content history
  tamper-evident by construction (append-only).
- **Service segmentation** — the AI service is a separate container with no
  credentials for the app database's user tables; it sees only the payloads
  the backend forwards. In production, put backend↔ai-service behind mTLS
  (service mesh) and give the ai-service a DB role limited to
  `regulation_chunks_*`.
- **Secrets hygiene** — all secrets arrive via environment/secret store; the
  `env` key provider refuses the default secret when `NODE_ENV=production`.

Roadmap: per-workspace data encryption keys, IP/device posture signals on
login, anomaly alerts on the audit stream, short-lived (15 min) access tokens
with refresh rotation.

## 5. Transport & headers (deployment checklist)

- TLS everywhere (terminate at the ingress; `wss://` for /collab).
- `helmet` middleware for HSTS/CSP once served from a real domain.
- CORS: pin `cors()` to the frontend origin in production.
- Postgres: TLS connections + SCRAM auth; the compose file's credentials are
  development-only.
