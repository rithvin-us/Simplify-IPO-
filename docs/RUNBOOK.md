# IPOW — Developer Runbook

How to install, run and debug the IPO Drafting Workspace prototype end-to-end.
The whole pipeline runs **fully offline** — no PostgreSQL and no LLM API key are
required. Missing pieces degrade gracefully (in-memory store, deterministic stub
extraction/drafting), so every stage is runnable and observable.

## Architecture

```
frontend (React/Vite :5173)
        │  /api  (Vite proxy)
        ▼
backend (Node/Express :4000)  ── in-memory store (models database/schema.sql)
        │  HTTP
        ▼
ai-service (FastAPI :8000)     ── parse → extract → validate → draft → export
        │  (optional)
        ▼
Anthropic / OpenAI            ── only if a key is configured; else stub logic
```

Pipeline (SRS §1.1.2): **Login → Wizard + Upload → Parse/Extract → Structured
data → Validate → Draft (per section) → Section lock/review → Export (Word/PDF).**

## Prerequisites

- Node.js ≥ 18 (tested on 24) and npm
- Python ≥ 3.10 (tested on 3.14)

## Install

```bash
# AI service
cd ai-service
python -m pip install -r requirements.txt          # core (runs offline)
# python -m pip install -r requirements-optional.txt  # optional: real LLM + PDF/xlsx parsers

# Backend
cd ../backend && npm install

# Frontend
cd ../frontend && npm install
```

## Run (three terminals)

```bash
# 1) AI service        → http://localhost:8000  (docs at /docs)
cd ai-service && python -m uvicorn app.main:app --port 8000

# 2) Backend           → http://localhost:4000
cd backend && npm run dev

# 3) Frontend          → http://localhost:5173
cd frontend && npm run dev
```

Open http://localhost:5173 and sign in with a seeded demo account:

| Role | Email | Password |
|---|---|---|
| SME promoter | `sme@demo.in` | `demo` |
| Merchant banker | `mb@demo.in` | `demo` |
| Legal counsel | `legal@demo.in` | `demo` |

## Demo flow

1. **SME** signs in → *Start a new IPO* (company name + CIN).
2. **Wizard** tab: type known fields and/or upload documents. A plain-text file
   with `Label: value` lines (e.g. `Revenue FY25: INR 48 crore`) extracts cleanly
   in offline mode.
3. **Extraction** tab: review confidence-scored, source-tagged fields → *Accept all*.
4. **Validation** tab: *Run validation* → missing fields, cross-document conflicts,
   disclosure gaps.
5. **Draft** tab: *Generate* each section; edit; *Save* (marks verified).
6. Invite MB + Legal (POST `…/members`), who **Review** and Approve/Reject.
7. **Export** tab: download Word (.docx) or open print-ready HTML → Print to PDF.

## Enabling a real LLM (optional)

Stub mode is the default. To use a model, install the optional deps and set env
vars **before starting the AI service**:

```bash
# Windows PowerShell
$env:LLM_PROVIDER="anthropic"; $env:ANTHROPIC_API_KEY="sk-ant-..."
python -m uvicorn app.main:app --port 8000
```

`GET http://localhost:8000/health` reports the active mode. `LLM_PROVIDER` may be
`anthropic`, `openai`, or `stub`.

## Debugging

- **Backend health incl. AI reachability:** `GET http://localhost:4000/api/health`
- **AI service mode:** `GET http://localhost:8000/health`
- **AI API docs / try endpoints:** http://localhost:8000/docs
- Backend logs its AI target on boot: `IPOW backend listening on :4000 (AI service: …)`.
- If uploads fail with a 502, the AI service is down — start it first.

## Endpoint map (backend)

| Area | Route |
|---|---|
| Auth | `POST /api/auth/login` · `POST /api/auth/register` · `GET /api/auth/me` |
| Workspaces | `POST/GET /api/workspaces` · `GET /api/workspaces/:id` · `POST /api/workspaces/:id/members` |
| Wizard data | `GET/PUT /api/workspaces/:id/data` |
| Documents | `POST/GET /api/workspaces/:id/documents` · `GET …/documents/extracted` · `POST …/extracted/accept-all` |
| Validation | `POST /api/workspaces/:id/validate` · `GET …/flags` · `POST …/flags/:id/resolve` |
| Sections | `GET …/sections` · `POST …/sections/:key/generate` · `PUT …/sections/:key` · `POST …/:key/{lock,unlock,status,comments}` |
| Dashboard | `GET /api/workspaces/:id/dashboard` |
| Export | `GET …/export/summary` · `GET …/export/docx` · `GET …/export/pdf` |
| Meta | `GET /api/meta` |

## Notes & limits (prototype)

- Data is **in-memory** — it resets when the backend restarts. `database/schema.sql`
  is the production target; swap the store for a `pg` pool (shapes match).
- Passwords use Node `crypto.scrypt` (no native build). JWT for sessions.
- The system produces a **draft** only; intermediary review/certification is
  enforced through the section review workflow before any SEBI submission.
