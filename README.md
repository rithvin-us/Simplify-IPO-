# IPO Drafting Workspace (IPOW)

> A Collaborative Platform for SME-Led, Expert-Reviewed IPO Offer Document Drafting

Addresses **SEBI Problem Statement 4** — Simplifying IPO Offer Document Preparation for SMEs.

A collaborative web platform where an SME promoter builds a substantially complete draft DRHP with AI assistance (document extraction, section-by-section drafting, validation), while merchant bankers and legal counsel review and approve before any regulatory submission.

## Repository Structure

```
IPO/
├── docs/            # SRS, architecture docs, exported SRS.docx / SRS.pdf
├── frontend/        # React SPA (login, dashboards, wizard, draft viewer, review UI)
├── backend/         # Node.js/Express — application services (auth, workspaces, review, billing)
├── ai-service/      # FastAPI — AI/document services (parsing, extraction, validation, drafting)
├── database/        # PostgreSQL schema and migrations
└── .env.example     # Environment variable template
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| App backend | Node.js + Express |
| AI/document backend | FastAPI (Python) |
| Database | PostgreSQL |
| File storage | AWS S3 (local disk fallback for dev) |
| Auth | JWT + bcrypt, role-based access control |
| AI | Claude / GPT via API (extraction, validation, drafting) |
| Export | python-docx → Word, PDF rendering |

## Roles

- **SME Promoter** — fills guided wizard, uploads documents, reviews AI drafts
- **Merchant Banker** — reviews/approves sections across multiple IPO projects
- **Legal Counsel** — invited per-workspace, reviews legal/risk sections
- **Admin** — platform configuration (optional in demo)

## Core Pipeline

Login → Guided Wizard + Document Upload → Smart Document Parser (OCR + LLM extraction with confidence + source tags) → Structured IPO Database → Validation Engine (missing fields, SEBI disclosure gaps, cross-document consistency) → AI Section-wise Draft Generator → Section Ownership/Locking → Parallel MB + Legal Review → Export Summary → Word/PDF.

## Documentation

- [Software Requirement Specification](docs/SRS.md) — full SRS (also available as .docx / .pdf in `docs/`)
