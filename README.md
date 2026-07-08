# IPO Drafting Workspace (IPOW)

> A Collaborative Platform for SME-Led, Expert-Reviewed IPO Offer Document Drafting

Addresses **SEBI Problem Statement 4** — Simplifying IPO Offer Document Preparation for SMEs.

A collaborative web platform where an SME promoter builds a substantially complete draft DRHP with AI assistance (document extraction, section-by-section drafting, validation), while merchant bankers and legal counsel review and approve before any regulatory submission.

## Repository Structure

```
IPO/
├── docs/            # SRS (.md/.docx/.pdf), RUNBOOK.md
├── INSTRUCTIONS.md  # Setup + demo walkthrough (start here)
├── frontend/        # React SPA (9 screens: login, dashboard, wizard, extraction, validation, draft, review, export)
├── backend/         # Node.js/Express — auth, workspaces, wizard data, documents, sections, reviews, dashboard, export
├── ai-service/      # FastAPI — /parse /extract /validate /draft /export (+ optional real LLM)
├── database/        # PostgreSQL schema (production target; prototype uses an in-memory store of the same shape)
└── .env.example     # Environment variable template
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| App backend | Node.js + Express |
| AI/document backend | FastAPI (Python) |
| Database | PostgreSQL (schema); prototype runs on an in-memory store of the same shape |
| File storage | Local disk (S3-ready) |
| Auth | JWT + `crypto.scrypt` (no native build), role-based access control |
| AI | Claude / GPT via API — with a deterministic stub fallback so it runs offline with no key |
| Export | python-docx → Word; print-ready HTML → PDF |

## Roles

- **SME Promoter** — fills guided wizard, uploads documents, reviews AI drafts
- **Merchant Banker** — reviews/approves sections across multiple IPO projects
- **Legal Counsel** — invited per-workspace, reviews legal/risk sections
- **Admin** — platform configuration (optional in demo)

## Core Pipeline

Login → Guided Wizard + Document Upload → Smart Document Parser (OCR + LLM extraction with confidence + source tags) → Structured IPO Database → Validation Engine (missing fields, SEBI disclosure gaps, cross-document consistency) → AI Section-wise Draft Generator → Section Ownership/Locking → Parallel MB + Legal Review → Export Summary → Word/PDF.

## Documentation

- [INSTRUCTIONS.md](INSTRUCTIONS.md) — setup, run, and demo walkthrough (**start here**)
- [docs/RUNBOOK.md](docs/RUNBOOK.md) — developer runbook, endpoint map, troubleshooting
- [Software Requirement Specification](docs/SRS.md) — full SRS (also available as .docx / .pdf in `docs/`)

## Running the prototype (dev)

Three services. Runs fully offline — no Postgres, no LLM key required (deterministic stub fallbacks). See [docs/RUNBOOK.md](docs/RUNBOOK.md).

```
# 1. AI service (FastAPI)      → http://localhost:8000
cd ai-service && pip install -r requirements.txt && python -m uvicorn app.main:app --port 8000

# 2. Backend (Express)         → http://localhost:4000
cd backend && npm install && npm run dev

# 3. Frontend (React/Vite)     → http://localhost:5173
cd frontend && npm install && npm run dev
```

Demo logins (seeded): `sme@demo.in`, `mb@demo.in`, `legal@demo.in` — password `demo` for all.
