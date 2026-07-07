# 1.2 Overall Description

## 1.2.1 Functional Scope

**a. Onboarding & Workspace Access**

- Single login with automatic role detection and routing to a role-specific dashboard.
- Per-company IPO Workspace creation and shared access management.
- Role-based invitation flow (SME invites merchant banker and legal counsel).

**b. Guided Data Capture**

- Step-by-step wizard: Company → Promoters → Financials → Legal → Risk Factors.
- Categorized document upload with a required-documents checklist mapped to SEBI disclosure needs.

**c. AI-Assisted Extraction**

- OCR/text extraction from uploaded documents (PDF, Word, Excel).
- LLM-based field population with a confidence score and source-document tag per extracted value.
- Structured storage of all extracted and manually entered data in a central IPO database.

**d. Validation & Compliance Checks**

- Missing mandatory field detection (rule-based).
- SEBI disclosure gap flagging (LLM-assisted, against hardcoded ICDR reference snippets).
- Cross-document consistency checks (e.g., the same figure appearing differently across two uploaded documents), scoped to a tracked set of numeric fields.

**e. AI-Assisted Drafting**

- Section-by-section DRHP draft generation (Company Overview, Business, Financial Summary, Risk Factors, Objects of Issue, etc.) — intentionally not a single one-click full-document generation, to preserve reviewability.

**f. Collaborative Review Workflow**

- Section-level ownership, locking, and review status to prevent concurrent edit collisions.
- Parallel commenting, change requests, and approvals by merchant banker and legal counsel.
- Activity feed reflecting edits, comments, approvals, and status changes.

**g. Progress, Health & Export**

- Draft Health Score aggregating completeness, validation status, and approval status.
- Jira-style dashboard showing section/document status per workspace.
- Auto-save of all in-progress edits with a "Last saved" timestamp.
- Export summary confirming all sections approved and no required documents missing.
- Final export to Word (.docx) and PDF.

**h. Monetization & Access Control**

- Per-project payment flow for SME promoters.
- Annual subscription flow for merchant bankers managing multiple IPO projects.
- Free invitation-based access for legal counsel.

## 1.2.2 Integration Scope

| # | Integration | Type | Purpose |
|---|---|---|---|
| 1 | LLM API (Claude/GPT) | API-based | Document data extraction, consistency reasoning, section-by-section DRHP draft generation. One external integration consumed by three modules (PARSE, VAL, DRAFT) for three distinct purposes. |
| 2 | OCR/Text Extraction Service | API/library-based | Pre-processing of uploaded documents before LLM extraction (may be bundled with the LLM API or delivered by libraries such as PyMuPDF). |
| 3 | AWS S3 | API-based | Storage of uploaded supporting documents and generated export files. |
| 4 | Payment Gateway | API-based | SME per-project payments and merchant banker annual subscription billing. *Provider TBD — Razorpay is recommended for INR-denominated Indian-market billing.* |
| 5 | Word/PDF Export Engine | Internal/library-based | Final document generation (docx generation library plus PDF rendering). |
| 6 | Email/Notification Service | API-based | Invitation emails for legal counsel, review notifications, activity alerts. |

## 1.2.3 Draft Health & Progress Monitoring Scope

In place of a conventional government-style MIS, the system provides a **Draft Health Score (DHS)** and a Jira-style progress dashboard as its monitoring and reporting layer:

- The DHS shall be a computed value (not a stored value) aggregating: percentage of sections progressed beyond AI-generated status, percentage of validation flags resolved, and percentage of required documents uploaded.
- The dashboard shall present per-workspace counts of documents by status, sections by review status, open validation flags, and pending review actions.
- Every Phase 1 module carries a closing functional requirement linking its outputs to the DHS/dashboard, ensuring monitoring coverage is complete by construction.
- The activity feed (last 5 events shown on the dashboard, full log stored) provides the audit and progress trail.

## 1.2.4 Phased Implementation Scope

**Phase 1 — Core (built in this version):** Modules 1–14 as enumerated in Section 1.4: User Management; IPO Workspace Management; Guided Wizard & Data Capture; Document Upload & Repository; Smart Document Parser; IPO Data Management; Validation Engine; AI Draft Generation; Section Ownership, Locking & Review Workflow; Review & Collaboration; Draft Health Score & Dashboard; Activity Feed & Auto-save; Export & Compliance Summary; Billing & Subscription.

**Phase 2 — Roadmap (explicitly NOT built in this version):**

| # | Roadmap Module | Status |
|---|---|---|
| 15 | SEBI Regulation RAG Module | NOT built — hardcoded regulation snippets used in prompts in the interim |
| 16 | AI Consistency Engine | NOT built — basic cross-document checks in the Validation Engine only |
| 17 | Multi-language Drafting Module | NOT built — English only in this version |
| 18 | Enterprise Security Module (MFA, Zero Trust, HSM) | NOT built — standard secure web-app baseline applies |
| 19 | Version History Module | NOT built — auto-save with last-saved timestamp only |
| 20 | Real-Time Collaborative Editing Module | NOT built — locking-based collaboration instead |

## 1.2.5 Technical & Operational Scope

- Delivery as a responsive web application (React SPA) accessed via modern evergreen browsers.
- Hybrid backend: Node.js for general application services; FastAPI (Python) for AI/document-processing services.
- PostgreSQL as the single system of record; AWS S3 for file/document storage.
- JWT-based authentication with RBAC across four roles (SME, Merchant Banker, Legal Counsel, Admin).
- Long-running operations (parsing, extraction, drafting, export) executed asynchronously with progress indication in the UI.
- Cloud hosting on AWS is recommended, given S3 usage is already assumed. *(Assumption: single-region deployment is sufficient at this scale.)*

## 1.2.6 Support & Maintenance Scope

- Defect fixes and minor enhancements during the evaluation/pilot period.
- Application and integration logging sufficient to diagnose extraction, validation, drafting, and export failures.
- Database backup on a daily schedule with 7-day retention. *(Assumption: appropriate for a prototype/pilot; production would extend this.)*
- Prompt template maintenance (extraction, validation, drafting) treated as configuration, updatable without application redeployment.
- Documentation deliverables: this SRS, deployment notes, and API reference for the Node and FastAPI services.

## 1.2.7 User Classes and Characteristics

| User Class | Characteristics | Technical Proficiency |
|---|---|---|
| SME Promoter | Completes the guided wizard, uploads supporting documents, reviews AI-extracted data and AI-drafted sections, responds to reviewer comments. First-time issuer; no capital-markets expertise assumed. | Basic web literacy |
| Merchant Banker | Manages multiple IPO projects under an annual subscription; reviews and approves/rejects drafted sections, comments, requests changes, oversees export readiness. | Professional; domain expert |
| Legal Counsel | Joins a specific company's workspace via invitation; reviews legal and risk-factor sections; comments, requests changes, approves from a legal standpoint. | Professional; domain expert |
| Admin (platform-level, optional) | Manages user accounts, subscription status, and platform-wide configuration (required-document checklists, DRHP section templates). | Technical operator |
| System (AI/Automation Engine) | Performs document parsing/extraction, data validation, cross-document consistency checks, and section-by-section draft generation. Not a user-facing actor but referenced throughout as the processing engine. | N/A |

## 1.2.8 Operating Environment

- **Client:** Evergreen desktop browsers (Chrome, Edge, Firefox — latest two major versions); minimum display width 1280 px for the drafting/review views. *(Assumption: reviewer workflows are desktop-centric; mobile is view-only best-effort.)*
- **Server:** Linux-based cloud compute (AWS recommended); Node.js 20 LTS runtime and Python 3.12+ runtime; PostgreSQL 16.
- **Storage:** AWS S3 (or a local-disk adapter in development environments).
- **External services:** LLM API (Claude/GPT) over HTTPS; payment gateway over HTTPS; transactional email service over HTTPS/SMTP.
- **Network:** All client-server and server-integration traffic over TLS 1.2+.

## 1.2.9 Design and Implementation Constraints

- **No LLM fine-tuning or custom model training.** All AI capability shall be delivered through prompt engineering against a hosted LLM API.
- **No SEBI Regulation RAG in this version.** Where regulatory context is required in prompts, hardcoded ICDR snippet text shall be used; the retrieval-augmented variant is Phase 2 (Module 15).
- **No enterprise-grade security controls** (MFA, Zero Trust architecture, HSM-backed key management) in this version; the security baseline is standard secure web-app practice (Section 1.5.4). Enterprise controls are Phase 2 (Module 18).
- **No version history.** Auto-save maintains only the current state with a last-saved timestamp; full section/document version tracking and rollback is Phase 2 (Module 19).
- **No real-time collaborative editing.** Concurrency shall be handled by section-level locking with refresh-on-load semantics; simultaneous multi-cursor editing is Phase 2 (Module 20).
- The generated DRHP is a draft only; the system shall not represent any output as filed, certified, or approved by SEBI.
- English-only user interface and drafting output in this version.

## 1.2.10 Assumptions and Dependencies

- The LLM API (Claude or GPT) remains available with sufficient rate limits and context-window capacity for document extraction and section drafting workloads.
- Uploaded documents are machine-readable or OCR-processable; extremely degraded scans may yield low-confidence or failed extraction, which the system surfaces rather than silently ignores.
- SEBI ICDR disclosure structure referenced in prompts and checklists is aligned descriptively; formal legal verification of regulatory completeness remains the responsibility of the merchant banker and legal counsel.
- A payment gateway account (provider TBD; Razorpay recommended) can be provisioned; until then, the billing module operates against a sandbox/stub gateway.
- AWS account availability for S3; local-disk storage is an accepted development fallback.
- Email deliverability depends on the selected email service provider's sender configuration.
- Persona accounts for demonstration (SME, MB, Legal Counsel) are provisioned by the Admin/seed script rather than open self-registration. *(Assumption: acceptable for prototype; self-registration would be added for production.)*

---
