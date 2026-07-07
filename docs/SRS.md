# IPO DRAFTING WORKSPACE (IPOW)

## Software Requirement Specification

**"A Collaborative Platform for SME-Led, Expert-Reviewed IPO Offer Document Drafting"**

Addressing SEBI Problem Statement 4 — *Simplifying IPO Offer Document Preparation for SMEs*

**Submitted by:** [Team Name] *(Development Vendor)*

**Sponsoring Organization:** [Team / Hackathon Entity — addressing SEBI Problem Statement 4]

**Document Version:** 1.0 &nbsp;&nbsp;|&nbsp;&nbsp; **Date:** 07.07.2026

---

## Document Control

| Version | Date | Description of Change | Reason for Change | Affected Section | Reviewed by | Approved by |
|---|---|---|---|---|---|---|
| 1.0 | 07.07.2026 | Initial release of the Software Requirement Specification for the IPO Drafting Workspace | Baseline SRS covering Phase 1 (Modules 1–14) and Phase 2 roadmap (Modules 15–20) | All | [Reviewer Name] | [Approver Name] |

## Stakeholders

| S.No | Organization Name |
|---|---|
| 1 | Securities and Exchange Board of India (SEBI) — Problem Statement Sponsor |
| 2 | [Team Name] — Development Vendor |
| 3 | SME Issuer Companies (Prospective Users) |
| 4 | Merchant Banking Firms (Prospective Users) |
| 5 | Legal Counsel Firms (Prospective Users) |

## Confidentiality Statement

This document contains proprietary information of [Team Name] prepared in response to SEBI Problem Statement 4. It shall not be reproduced, distributed, or disclosed to any third party, in whole or in part, without prior written consent of [Team Name], except for the purpose of evaluation by the hackathon organizers and designated reviewers.

---

## Table of Contents

- **1.1 Introduction**
  - 1.1.1 Purpose of the Document
  - 1.1.2 Scope of the System
  - 1.1.3 Acronyms
- **1.2 Overall Description**
  - 1.2.1 Functional Scope
  - 1.2.2 Integration Scope
  - 1.2.3 Draft Health & Progress Monitoring Scope
  - 1.2.4 Phased Implementation Scope
  - 1.2.5 Technical & Operational Scope
  - 1.2.6 Support & Maintenance Scope
  - 1.2.7 User Classes and Characteristics
  - 1.2.8 Operating Environment
  - 1.2.9 Design and Implementation Constraints
  - 1.2.10 Assumptions and Dependencies
- **1.3 System Overview & Architecture**
  - 1.3.1 Solution Architecture
  - 1.3.2 System Architecture — Layered View
  - 1.3.3 Technology Stack Summary
- **1.4 Functional Requirements**
  - 1.4.1 User Management Module (UM)
  - 1.4.2 IPO Workspace Management Module (WSP)
  - 1.4.3 Guided Wizard & Data Capture Module (WIZ)
  - 1.4.4 Document Upload & Repository Module (DOC)
  - 1.4.5 Smart Document Parser Module (PARSE)
  - 1.4.6 IPO Data Management Module (DATA)
  - 1.4.7 Validation Engine Module (VAL)
  - 1.4.8 AI Draft Generation Module (DRAFT)
  - 1.4.9 Section Ownership, Locking & Review Workflow Module (OWN)
  - 1.4.10 Review & Collaboration Module (REV)
  - 1.4.11 Draft Health Score & Dashboard Module (HLTH)
  - 1.4.12 Activity Feed & Auto-save Module (ACT)
  - 1.4.13 Export & Compliance Summary Module (EXP)
  - 1.4.14 Billing & Subscription Module (BILL)
  - 1.4.15–1.4.20 Phase 2 Roadmap Modules (NOT built in this version)
- **1.5 Non-Functional Requirements**
  - 1.5.1 Performance Requirements
  - 1.5.2 Availability and Reliability Requirements
  - 1.5.3 Scalability Requirements
  - 1.5.4 Security Requirements
  - 1.5.5 Usability Requirements
  - 1.5.6 Maintainability Requirements
  - 1.5.7 Interoperability Requirements
  - 1.5.8 Compliance Requirements
  - 1.5.9 Localization and Language Requirements

---
# 1.1 Introduction

The IPO Drafting Workspace (IPOW) is a collaborative web platform that enables Small and Medium Enterprise (SME) promoters to independently prepare a substantially complete draft of a Draft Red Herring Prospectus (DRHP), with Artificial Intelligence (AI) handling data extraction and section drafting while merchant bankers and legal counsel review and approve before anything is submitted to SEBI. Unlike a chatbot or a single-click "AI writes your document" tool, the platform is built around a shared, role-based IPO Workspace per company where the SME, merchant banker, and legal counsel co-author the same evolving draft, each with clearly scoped responsibilities, section ownership, and review authority.

## 1.1.1 Purpose of the Document

The purpose of this Software Requirement Specification (SRS) is to define, in complete and testable terms, the functional and non-functional requirements of the IPO Drafting Workspace. The document is intended to serve as:

- The single authoritative reference for the development team during design, implementation, and testing of the Phase 1 prototype.
- A clear scope boundary for evaluators and reviewers, explicitly distinguishing capabilities **built now** (Phase 1, Modules 1–14) from capabilities described as **roadmap only** (Phase 2, Modules 15–20).
- The basis for acceptance verification: every functional requirement is written as a single, atomic, testable "System shall…" statement with a unique requirement identifier.
- A communication instrument between the development vendor, hackathon evaluators, and prospective stakeholders (SME issuers, merchant bankers, legal counsel).

## 1.1.2 Scope of the System

The system shall enable an SME promoter to capture business, financial, and legal particulars through a guided wizard; upload supporting documents in multiple formats; have structured data extracted automatically with confidence scoring and source attribution; validate the captured data for completeness, disclosure gaps, and cross-document inconsistencies; generate a DRHP draft section by section using a Large Language Model (LLM); route the draft through parallel merchant banker and legal counsel review with section-level ownership and locking; and export the approved draft to Word (.docx) and PDF formats.

**In scope (Phase 1):** user management with role-based access, per-company IPO Workspaces, guided data capture, categorized document upload with a required-documents checklist, AI-assisted extraction, a central structured IPO database, a validation engine, AI section-wise draft generation, section ownership/locking/review workflow, collaborative review, Draft Health Score and dashboard, activity feed and auto-save, export with compliance summary, and billing/subscription flows.

**Out of scope (Phase 2 roadmap, described but NOT built):** SEBI Regulation RAG, a deeper AI Consistency Engine, multi-language drafting, enterprise security (MFA, Zero Trust, HSM), version history, and real-time collaborative editing.

The system produces a **draft** offer document only. Review and certification by authorised intermediaries remains mandatory before any regulatory submission; the system preserves and enforces this intermediary role through its review workflow.

## 1.1.3 Acronyms

| Acronym | Expansion |
|---|---|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| DRHP | Draft Red Herring Prospectus |
| DHS | Draft Health Score |
| FR | Functional Requirement |
| HSM | Hardware Security Module |
| ICDR | Issue of Capital and Disclosure Requirements (SEBI Regulations) |
| IPO | Initial Public Offering |
| IPOW | IPO Drafting Workspace (system short name) |
| JSON | JavaScript Object Notation |
| JWT | JSON Web Token |
| LLM | Large Language Model |
| MB | Merchant Banker |
| MFA | Multi-Factor Authentication |
| MIS | Management Information System |
| NFR | Non-Functional Requirement |
| OCR | Optical Character Recognition |
| RAG | Retrieval-Augmented Generation |
| RBAC | Role-Based Access Control |
| REST | Representational State Transfer |
| S3 | Amazon Simple Storage Service |
| SEBI | Securities and Exchange Board of India |
| SME | Small and Medium Enterprise |
| SPA | Single Page Application |
| SRS | Software Requirement Specification |
| TLS | Transport Layer Security |
| UI | User Interface |

---
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
# 1.3 System Overview & Architecture

## 1.3.1 Solution Architecture

The IPO Drafting Workspace is delivered as a three-tier cloud application. A React Single Page Application (SPA) serves all four user roles from one codebase, routing users to role-specific dashboards after JWT authentication. Application traffic is handled by a Node.js/Express service that owns authentication, workspace and membership management, wizard data capture, section state, review workflow, dashboards, and billing. AI and document-heavy workloads are isolated in a FastAPI (Python) service that owns text/OCR extraction, LLM-based structured extraction, validation reasoning, section drafting, and Word/PDF rendering. Both services share one PostgreSQL database as the system of record; uploaded files and generated exports reside in AWS S3.

**Architecture diagram (described for redraw):** A top-to-bottom flow. Box "User (SME / MB / Legal / Admin)" → arrow "HTTPS/TLS" → box "React SPA". SPA → arrow "REST + JWT" → box "Node.js Application Services". Node box → arrow → box "PostgreSQL (system of record)". Node box → arrow "internal REST" → box "FastAPI AI/Document Services". FastAPI box → three outbound arrows: "LLM API (Claude/GPT)", "S3 (documents/exports)", and back to "PostgreSQL (extracted fields, flags, drafts)". Node box → two further outbound arrows: "Payment Gateway" and "Email Service". A decision diamond "Role?" sits between login and three dashboard boxes (SME Dashboard, MB Dashboard, Legal Dashboard).

**Key architectural highlights:**

- Single React SPA; role-based routing and RBAC-gated API access.
- Hybrid backend: Node.js for transactional application logic; FastAPI for AI/document processing — allowing the AI service to scale and fail independently of the core application.
- One LLM API integration reused for three purposes: extraction (PARSE), validation reasoning (VAL), and drafting (DRAFT); prompts are versioned templates, not code.
- PostgreSQL as the single structured store: workspaces, members, sections, documents metadata, extracted fields (with confidence + source), validation flags, review comments, activity log, billing records.
- S3 for binary storage only; the database stores keys/metadata, never file contents.
- Asynchronous job pattern for parse/extract/draft/export with status polling from the SPA (no WebSockets required in Phase 1).
- Draft Health Score computed on read via aggregation (a database view), never denormalized.

## 1.3.2 System Architecture — Layered View

**Layered diagram (described for redraw):** Six horizontal layers stacked top to bottom, each a labelled band with its components as boxes inside: (1) Client Layer — "Browser: React SPA"; (2) Edge/Security Layer — "TLS termination, JWT verification, RBAC middleware, rate limiting"; (3) Presentation Layer — "SPA views: Login, Dashboards, Wizard, Extraction Preview, Draft Viewer, Validation Panel, Review View, Export Summary"; (4) Application/Business Logic Layer — two side-by-side boxes: "Node.js services (auth, workspace, wizard, sections, review, dashboard, billing)" and "FastAPI services (parse, extract, validate, draft, export)" joined by an "internal REST" arrow; (5) Data Layer — "PostgreSQL 16"; (6) External Integration Layer — five boxes: "LLM API", "OCR/Extraction libraries", "AWS S3", "Payment Gateway", "Email Service". Vertical arrows connect each adjacent layer.

- **Client Layer:** The browser runs the React SPA; all state-changing calls carry the JWT. No business logic resides in the client beyond input validation for usability.
- **Edge/Security Layer:** TLS 1.2+ termination, JWT signature/expiry verification, role-based authorization middleware, and basic rate limiting are applied before any request reaches business logic.
- **Presentation Layer:** The nine locked screens (login; dashboard; wizard steps; extraction preview; draft viewer; validation panel; review view; export summary; export) are rendered by the SPA against REST resources.
- **Application/Business Logic Layer:** The Node.js service implements transactional workflows (accounts, workspaces, membership/invitations, wizard persistence, section locking and status transitions, review actions, dashboard aggregation, billing). The FastAPI service implements compute/AI workflows (document text extraction, LLM structured extraction with confidence/source tagging, validation passes, per-section draft generation, docx/PDF rendering). The Node service is the sole caller of the FastAPI service.
- **Data Layer:** PostgreSQL holds all structured data and the `workspace_progress` aggregation view backing the Draft Health Score. Referential integrity is enforced at the database level.
- **External Integration Layer:** The LLM API is invoked only from the FastAPI service; S3 is accessed from both services (upload streaming from Node, read/render from FastAPI); the payment gateway and email service are invoked only from the Node service.

## 1.3.3 Technology Stack Summary

| Component | Technology | Version / Notes |
|---|---|---|
| Frontend | React | 18.x, built with Vite; React Router for role-based routing |
| Application backend | Node.js + Express | Node 20 LTS; REST/JSON |
| AI/document backend | FastAPI (Python) | Python 3.12+; FastAPI 0.115+; Uvicorn |
| Database | PostgreSQL | 16.x; single system of record; `workspace_progress` view for DHS |
| File storage | AWS S3 | Standard tier; local-disk adapter for development |
| Authentication | JWT + bcrypt | HS256 signing; 8-hour token expiry; RBAC claims (role) in token |
| AI/LLM | Claude or GPT via API | Prompt-engineered; no fine-tuning; structured JSON outputs |
| Document parsing | PyMuPDF, python-docx, openpyxl | PDF / Word / Excel text and table extraction |
| Export engine | python-docx + PDF renderer | .docx generation; PDF rendered from the same content |
| Payments | Payment gateway (TBD) | Razorpay recommended; sandbox/stub in Phase 1 |
| Email | Transactional email API | e.g., AWS SES; console transport in development |
| Caching (optional) | Redis | Recommended if auto-save/session load requires it; not mandatory Phase 1 |
| Hosting | AWS (recommended) | Single region; aligns with S3 usage |

---
# 1.4 Functional Requirements

This section specifies the functional requirements of the IPO Drafting Workspace. Requirements are grouped by module; every requirement is a single, atomic, testable statement phrased as "System shall…" and carries a unique identifier of the form FR-&lt;MODULE_ABBR&gt;-##. Phase 1 modules (1.4.1–1.4.14) are specified in full; Phase 2 roadmap modules (1.4.15–1.4.20) are described briefly and are explicitly NOT built in this version.

This section ensures:

- Complete traceability from user needs to testable requirements via stable requirement identifiers.
- Explicit actor, precondition, and postcondition definitions per module.
- Documented process flows and integration points so each module can be built and verified independently.
- A Draft Health Score / dashboard linkage requirement closing every Phase 1 module, guaranteeing monitoring coverage.

**List of Modules**

| # | Module | Abbreviation | Phase |
|---|---|---|---|
| 1 | User Management | UM | Phase 1 — built |
| 2 | IPO Workspace Management | WSP | Phase 1 — built |
| 3 | Guided Wizard & Data Capture | WIZ | Phase 1 — built |
| 4 | Document Upload & Repository | DOC | Phase 1 — built |
| 5 | Smart Document Parser | PARSE | Phase 1 — built |
| 6 | IPO Data Management | DATA | Phase 1 — built |
| 7 | Validation Engine | VAL | Phase 1 — built |
| 8 | AI Draft Generation | DRAFT | Phase 1 — built |
| 9 | Section Ownership, Locking & Review Workflow | OWN | Phase 1 — built |
| 10 | Review & Collaboration | REV | Phase 1 — built |
| 11 | Draft Health Score & Dashboard | HLTH | Phase 1 — built |
| 12 | Activity Feed & Auto-save | ACT | Phase 1 — built |
| 13 | Export & Compliance Summary | EXP | Phase 1 — built |
| 14 | Billing & Subscription | BILL | Phase 1 — built |
| 15 | SEBI Regulation RAG | — | Phase 2 — NOT built |
| 16 | AI Consistency Engine | — | Phase 2 — NOT built |
| 17 | Multi-language Drafting | — | Phase 2 — NOT built |
| 18 | Enterprise Security | — | Phase 2 — NOT built |
| 19 | Version History | — | Phase 2 — NOT built |
| 20 | Real-Time Collaborative Editing | — | Phase 2 — NOT built |

**Top-Level System Flow**

**Flow chart (described for redraw):** Ten sequential boxes with arrows, one decision diamond, and one parallel split. (1) "Login (JWT, role detection)" → diamond "Role?" branching to SME/MB/Legal dashboards → (2) "Guided Wizard & Document Upload (5 steps, categorized uploads, required-docs checklist)" → (3) "Smart Document Parser (OCR/text extraction + LLM structured extraction with confidence + source tags)" → (4) "Structured IPO Database (PostgreSQL)" → (5) "Validation Engine (missing fields, disclosure gaps, cross-document consistency)" → (6) "AI Draft Generation (section-by-section DRHP)" → (7) "Section Ownership / Locking / Review Status" → (8) parallel split into two boxes "Merchant Banker Review" and "Legal Counsel Review", both re-joining at → (9) "Export Summary (readiness check)" → (10) "Final Export (Word .docx / PDF)". A feedback arrow returns from both review boxes to box 6/7 labelled "change requested".

---

## 1.4.1 User Management Module (UM)

### 1.4.1.1 Description

The User Management Module provides authentication, automatic role detection, role-based routing, and the invitation flow through which SMEs bring merchant bankers and legal counsel into a workspace. It establishes the RBAC foundation consumed by every other module. A single login page serves all roles; the system determines the role from the account and routes the user to the corresponding dashboard.

### 1.4.1.2 Actors

- SME Promoter
- Merchant Banker
- Legal Counsel
- Admin
- System (session/token management)

### 1.4.1.3 Preconditions

- The user possesses provisioned credentials (created by Admin or seed process, or via invitation acceptance).
- The platform is reachable over HTTPS and the database is available.

### 1.4.1.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-UM-01 | User Management | Authentication | System shall authenticate users via email and password against bcrypt-hashed credentials. |
| 2 | FR-UM-02 | User Management | Authentication | System shall issue a signed JWT on successful login containing user ID, role, and an expiry of 8 hours. |
| 3 | FR-UM-03 | User Management | Authentication | System shall reject any API request bearing a missing, malformed, expired, or invalid-signature JWT with HTTP 401. |
| 4 | FR-UM-04 | User Management | Role Detection | System shall determine the user's role (SME, Merchant Banker, Legal Counsel, Admin) from the account record at login without requiring the user to select a role. |
| 5 | FR-UM-05 | User Management | Role Routing | System shall redirect each authenticated user to the dashboard corresponding to their role. |
| 6 | FR-UM-06 | User Management | Access Control | System shall enforce role-based authorization on every API endpoint such that a user can invoke only operations permitted to their role. |
| 7 | FR-UM-07 | User Management | Account Management | System shall allow the Admin to create, deactivate, and reactivate user accounts. |
| 8 | FR-UM-08 | User Management | Account Management | System shall prevent login by deactivated accounts and invalidate their subsequent API access. |
| 9 | FR-UM-09 | User Management | Invitations | System shall allow an SME Promoter to invite a merchant banker or legal counsel to a specific workspace by email address. |
| 10 | FR-UM-10 | User Management | Invitations | System shall send an invitation email containing a single-use, time-limited (72-hour) acceptance link via the email service. |
| 11 | FR-UM-11 | User Management | Invitations | System shall bind an accepted invitation to the invited email address and grant membership only to the matching authenticated account. |
| 12 | FR-UM-12 | User Management | Session | System shall terminate the client session on logout by discarding the token client-side and rejecting the token after expiry server-side. |
| 13 | FR-UM-13 | User Management | Audit | System shall record login success, login failure, invitation issuance, and invitation acceptance events in the activity log with timestamp and actor. |
| 14 | FR-UM-14 | User Management | Dashboard Linkage | System shall expose per-workspace membership and pending-invitation counts to the Draft Health Score & Dashboard Module. |

### 1.4.1.5 Process Flow

1. User opens the login page and submits email and password.
2. System verifies credentials against the stored bcrypt hash.
3. On success, system issues a JWT embedding user ID and role; on failure, system returns a generic authentication error.
4. System routes the user to the role-appropriate dashboard.
5. For invitations: SME enters invitee email and role; system creates an invitation record and dispatches the email; invitee follows the link, authenticates (or is provisioned), and is added as a workspace member.
6. All authentication and invitation events are written to the activity log.

**Flow diagram (described):** Start → box "Login form" → box "Verify bcrypt hash" → diamond "Valid?" — No → box "Generic error" → End; Yes → box "Issue JWT (id, role, 8h)" → diamond "Role?" → three parallel boxes "SME Dashboard" / "MB Dashboard" / "Legal Dashboard" → End. Side lane: box "SME sends invite" → box "Email service: single-use 72h link" → box "Invitee authenticates" → box "Membership granted".

### 1.4.1.6 Inputs

- Email address and password (login).
- Invitee email address, target workspace, and invited role (invitation).
- Admin account-management actions (create/deactivate/reactivate).

### 1.4.1.7 Outputs

- Signed JWT and role-based dashboard redirect.
- Invitation record and dispatched invitation email.
- Activity log entries for authentication and invitation events.

### 1.4.1.8 Business Rules

- A user account shall hold exactly one role; multi-role users shall use separate accounts.
- Legal counsel shall access only workspaces they are explicitly invited to.
- Merchant bankers shall access only workspaces where they hold membership and an active subscription (see BILL).
- Invitation links shall be single-use and shall expire 72 hours after issuance.
- Login failures shall not disclose whether the email or the password was incorrect.

### 1.4.1.9 Validation Rules

- Email shall be syntactically valid and unique across accounts.
- Password shall be at least 8 characters at account creation.
- Invited role shall be one of: merchant_banker, legal_counsel.
- An invitation shall reference an existing workspace owned by the inviting SME.

### 1.4.1.10 Integration Points

- Email/Notification Service — invitation and account emails.
- PostgreSQL — users, workspace_members, invitations, activity_log.

**Integration diagram (described):** Box "Node auth service" with arrows to "PostgreSQL (users/members)" and "Email Service (invites)"; inbound arrow from "React SPA (login form)".

### 1.4.1.11 Postconditions

- Authenticated session exists with role claims; user is on the correct dashboard.
- Accepted invitations result in persistent workspace membership.
- All authentication/invitation events are auditable in the activity log.

---

## 1.4.2 IPO Workspace Management Module (WSP)

### 1.4.2.1 Description

The IPO Workspace Management Module provides the central organizing concept of the platform: one IPO Workspace per company, acting as the shared container for wizard data, documents, sections, validation flags, reviews, activity, and export artifacts. It manages workspace creation, membership, and project-level settings, and gates access so that every other module operates strictly within workspace boundaries.

### 1.4.2.2 Actors

- SME Promoter (creator/owner)
- Merchant Banker (member)
- Legal Counsel (member)
- Admin (oversight)

### 1.4.2.3 Preconditions

- The SME Promoter is authenticated (UM).
- For full feature access, the workspace payment state is "paid" (BILL); creation itself is permitted pre-payment.

### 1.4.2.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-WSP-01 | Workspace | Creation | System shall allow an authenticated SME Promoter to create an IPO Workspace by providing the company name. |
| 2 | FR-WSP-02 | Workspace | Creation | System shall initialize a newly created workspace with the standard DRHP section set (Company Overview, Business, Financial Summary, Risk Factors, Objects of Issue) in status "empty". |
| 3 | FR-WSP-03 | Workspace | Creation | System shall initialize a newly created workspace with the SEBI-mapped required-documents checklist per wizard step. |
| 4 | FR-WSP-04 | Workspace | Configuration | System shall allow the workspace owner to edit workspace settings limited to company name and CIN. |
| 5 | FR-WSP-05 | Workspace | Membership | System shall associate members to a workspace with a member role of SME, Merchant Banker, or Legal Counsel. |
| 6 | FR-WSP-06 | Workspace | Membership | System shall allow the workspace owner to remove a merchant banker or legal counsel member from the workspace. |
| 7 | FR-WSP-07 | Workspace | Listing | System shall list, for each authenticated user, only the workspaces in which they hold membership. |
| 8 | FR-WSP-08 | Workspace | Listing | System shall display, per listed workspace, the company name, Draft Health Score, and pending-action count for the viewing role. |
| 9 | FR-WSP-09 | Workspace | Access Control | System shall deny access to any workspace-scoped resource (documents, sections, flags, comments, exports) to non-members with HTTP 403. |
| 10 | FR-WSP-10 | Workspace | Access Control | System shall permit a merchant banker to hold membership in multiple workspaces concurrently under one subscription. |
| 11 | FR-WSP-11 | Workspace | Lifecycle | System shall allow the workspace owner to archive a workspace, rendering it read-only for all members. |
| 12 | FR-WSP-12 | Workspace | Audit | System shall record workspace creation, setting changes, membership changes, and archival in the activity log. |
| 13 | FR-WSP-13 | Workspace | Dashboard Linkage | System shall expose workspace membership, status, and per-workspace aggregates to the Draft Health Score & Dashboard Module. |

### 1.4.2.5 Process Flow

1. SME Promoter selects "Create IPO Workspace" and enters the company name.
2. System creates the workspace, seeds the standard DRHP sections in status "empty", and attaches the required-documents checklist.
3. System registers the creator as owner-member and records the creation in the activity log.
4. SME invites the merchant banker and legal counsel (UM invitation flow); accepted invitees become members.
5. Members see the workspace on their dashboards; all subsequent module operations are scoped to this workspace.

**Flow diagram (described):** Start → box "Create workspace (company name)" → box "Seed sections (empty) + doc checklist" → box "Register owner member" → box "Invite MB / Legal (UM)" → diamond "Invitation accepted?" — Yes → box "Add member" → box "Workspace visible on member dashboards" → End.

### 1.4.2.6 Inputs

- Company name (mandatory), CIN (optional).
- Membership actions (invite via UM, remove, archive).

### 1.4.2.7 Outputs

- Persistent workspace record with seeded sections and checklist.
- Membership records; workspace list views per role.
- Activity log entries for workspace lifecycle events.

### 1.4.2.8 Business Rules

- Each workspace shall represent exactly one company's IPO preparation.
- Only the SME owner shall invite or remove members and archive the workspace.
- A merchant banker without an active subscription shall not open workspaces beyond read-only dashboard listing (see BILL).
- Archived workspaces shall reject all write operations.
- Workspace deletion shall not be available in Phase 1; archival is the terminal state. *(Assumption: avoids destructive loss of audit trail in a prototype.)*

### 1.4.2.9 Validation Rules

- Company name shall be non-empty and at most 255 characters.
- CIN, when provided, shall match the 21-character Indian CIN format.
- Membership operations shall reference existing users and workspaces.

### 1.4.2.10 Integration Points

- PostgreSQL — ipo_workspaces, workspace_members, sections (seeding), activity_log.
- UM — invitation flow; BILL — payment state gating.

**Integration diagram (described):** Box "Workspace service (Node)" with arrows to "PostgreSQL", "UM invitations", "BILL payment state"; inbound from "SPA dashboard".

### 1.4.2.11 Postconditions

- Workspace exists with seeded sections and checklist; members hold scoped access.
- All other modules can operate within the workspace boundary.

---

## 1.4.3 Guided Wizard & Data Capture Module (WIZ)

### 1.4.3.1 Description

The Guided Wizard & Data Capture Module walks the SME promoter through five sequenced steps — Company → Promoters → Financials → Legal → Risk Factors — capturing the structured particulars a DRHP requires. Each step presents its form fields, the documents needed for that step, and an indicative time estimate. Fields may be filled manually or pre-populated from parser output (PARSE); all values persist to the IPO Data Management Module (DATA) with auto-save (ACT).

### 1.4.3.2 Actors

- SME Promoter
- System (pre-population from extraction)

### 1.4.3.3 Preconditions

- SME Promoter is an authenticated member of the workspace (UM, WSP).
- Workspace is not archived.

### 1.4.3.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-WIZ-01 | Wizard | Step Flow | System shall present the wizard as five ordered steps: Company, Promoters, Financials, Legal, Risk Factors. |
| 2 | FR-WIZ-02 | Wizard | Step Flow | System shall allow the SME to navigate freely between steps without losing entered data. |
| 3 | FR-WIZ-03 | Wizard | Step Flow | System shall display, per step, the list of documents needed and an indicative completion-time estimate. |
| 4 | FR-WIZ-04 | Wizard | Data Capture | System shall persist every field value to the IPO database keyed by workspace and field identifier. |
| 5 | FR-WIZ-05 | Wizard | Data Capture | System shall auto-save in-progress field edits and display a "Last saved" timestamp (see ACT). |
| 6 | FR-WIZ-06 | Wizard | Pre-population | System shall pre-populate wizard fields from accepted parser extractions, visually distinguishing pre-filled values from manually entered values. |
| 7 | FR-WIZ-07 | Wizard | Pre-population | System shall allow the SME to overwrite any pre-populated value, and shall record the resulting value as manually entered. |
| 8 | FR-WIZ-08 | Wizard | Progress | System shall compute and display per-step completion as the percentage of mandatory fields populated. |
| 9 | FR-WIZ-09 | Wizard | Validation | System shall indicate mandatory fields and flag empty mandatory fields within the step UI without blocking navigation. |
| 10 | FR-WIZ-10 | Wizard | Access Control | System shall restrict wizard write access to SME-role members of the workspace. |
| 11 | FR-WIZ-11 | Wizard | Upload Linkage | System shall allow document upload from within each wizard step, tagged to that step (see DOC). |
| 12 | FR-WIZ-12 | Wizard | Audit | System shall record step completion transitions in the activity log. |
| 13 | FR-WIZ-13 | Wizard | Dashboard Linkage | System shall expose per-step completion percentages to the Draft Health Score & Dashboard Module. |

### 1.4.3.5 Process Flow

1. SME opens the workspace and enters the wizard at the first incomplete step.
2. The step displays fields, needed documents, and a time estimate.
3. SME enters values manually and/or uploads documents; parser output (after SME acceptance in PARSE) pre-fills matching fields.
4. Auto-save persists edits continuously; the "Last saved" timestamp updates.
5. SME proceeds through all five steps; per-step completion updates on the dashboard.

**Flow diagram (described):** Start → box "Open wizard at first incomplete step" → box "Render fields + docs-needed + time estimate" → parallel boxes "Manual entry" and "Upload → PARSE → accepted values pre-fill" → box "Auto-save (debounced PATCH)" → diamond "More steps?" — Yes → loop to render next step; No → box "Wizard complete → progress to dashboard" → End.

### 1.4.3.6 Inputs

- Manually entered field values per step.
- Accepted extraction values (from PARSE via DATA).
- Step navigation actions and per-step document uploads.

### 1.4.3.7 Outputs

- Persisted structured field values in the IPO database.
- Per-step completion percentages; "Last saved" timestamps.
- Activity log entries for step transitions.

### 1.4.3.8 Business Rules

- Only SME-role members shall edit wizard data; MB and Legal shall have read-only visibility.
- Pre-populated values shall never be committed to the canonical IPO data without SME acceptance.
- Navigation shall not be blocked by incomplete mandatory fields; completeness is enforced at validation (VAL) and export (EXP) instead.

### 1.4.3.9 Validation Rules

- Numeric fields (e.g., revenue, shareholding %) shall accept only numeric input with defined units.
- Percentage fields shall be within 0–100.
- Date fields shall be valid calendar dates not in the future where the field semantics require it (e.g., incorporation date).
- Field values shall respect per-field maximum lengths.

### 1.4.3.10 Integration Points

- DATA — canonical persistence of field values.
- PARSE — source of pre-population values; DOC — per-step uploads; ACT — auto-save.

**Integration diagram (described):** Box "Wizard UI (SPA)" → arrows to "Node wizard API" → "PostgreSQL ipo_data"; side arrows from "PARSE extracted_fields (accepted)" into pre-fill, and from wizard upload control to "DOC upload API".

### 1.4.3.11 Postconditions

- Structured IPO data for the five steps persists in the database, distinguishable by origin (manual vs extracted).
- Step progress metrics are available to the dashboard and DHS.

---
## 1.4.4 Document Upload & Repository Module (DOC)

### 1.4.4.1 Description

The Document Upload & Repository Module manages multi-format upload (PDF, Word, Excel), categorization, and storage of all supporting documents in a workspace. Every upload is assigned a document category (Corporate, Financial, Legal, Compliance, Supporting) and optionally tagged to a wizard step. A SEBI-mapped required-documents checklist per wizard step tracks which mandatory documents have been provided. Files are stored in S3; only metadata resides in the database.

### 1.4.4.2 Actors

- SME Promoter (uploader)
- Merchant Banker, Legal Counsel (read access)
- System (storage, checklist maintenance)

### 1.4.4.3 Preconditions

- Authenticated SME member of a non-archived workspace.
- Storage backend (S3 or local adapter) reachable.

### 1.4.4.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-DOC-01 | Document Upload | Upload | System shall accept document uploads in PDF (.pdf), Word (.docx), and Excel (.xlsx) formats. |
| 2 | FR-DOC-02 | Document Upload | Upload | System shall reject uploads exceeding 25 MB per file with a descriptive error. |
| 3 | FR-DOC-03 | Document Upload | Upload | System shall verify file type by content signature, not extension alone, and reject mismatches. |
| 4 | FR-DOC-04 | Document Upload | Categorization | System shall require every upload to carry exactly one category from: Corporate, Financial, Legal, Compliance, Supporting. |
| 5 | FR-DOC-05 | Document Upload | Categorization | System shall allow an upload to be tagged to the wizard step from which it was initiated. |
| 6 | FR-DOC-06 | Document Upload | Storage | System shall store file binaries in S3 (or the configured local adapter) and persist only the storage key and metadata in the database. |
| 7 | FR-DOC-07 | Document Upload | Checklist | System shall maintain a required-documents checklist per wizard step, seeded from the SEBI-mapped platform configuration. |
| 8 | FR-DOC-08 | Document Upload | Checklist | System shall mark a checklist item as satisfied when a document is uploaded against it, and unsatisfied if that document is removed. |
| 9 | FR-DOC-09 | Document Upload | Listing | System shall list workspace documents filterable by category, wizard step, and parse status. |
| 10 | FR-DOC-10 | Document Upload | Lifecycle | System shall allow the uploader to delete a document that has not yet been used as an accepted extraction source; documents cited as an accepted source shall be non-deletable. |
| 11 | FR-DOC-11 | Document Upload | Access Control | System shall restrict upload and delete to SME members; MB and Legal members shall have download/view access only. |
| 12 | FR-DOC-12 | Document Upload | Parse Handoff | System shall enqueue every successful upload for parsing (PARSE) and expose its parse status (pending, parsing, parsed, failed). |
| 13 | FR-DOC-13 | Document Upload | Audit | System shall record upload, delete, and checklist state changes in the activity log. |
| 14 | FR-DOC-14 | Document Upload | Dashboard Linkage | System shall expose document counts by category/status and checklist completion percentage to the Draft Health Score & Dashboard Module. |

### 1.4.4.5 Process Flow

1. SME selects a file within a wizard step (or the repository view) and assigns a category.
2. System validates format, size, and content signature.
3. System streams the binary to S3, persists metadata, and marks the matching checklist item satisfied.
4. System enqueues the document for parsing and sets parse status "pending".
5. Repository list and checklist update; the event is logged.

**Flow diagram (described):** Start → box "Select file + category" → diamond "Format/size/signature valid?" — No → box "Reject with reason" → End; Yes → box "Stream to S3, persist metadata" → box "Checklist item satisfied" → box "Enqueue for PARSE (status pending)" → box "Log event" → End.

### 1.4.4.6 Inputs

- File binary; category selection; optional wizard-step tag.

### 1.4.4.7 Outputs

- Stored object in S3; document metadata record; updated checklist state; parse queue entry; activity log entry.

### 1.4.4.8 Business Rules

- Every document shall belong to exactly one workspace and one category.
- Checklist definitions shall be platform configuration (Admin-managed), not per-workspace editable.
- A document referenced as the source of an accepted extracted value shall not be deletable while that reference exists.

### 1.4.4.9 Validation Rules

- Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.
- Maximum file size 25 MB; maximum filename length 500 characters.
- Category shall be one of the five defined enum values.

### 1.4.4.10 Integration Points

- AWS S3 — binary storage; PostgreSQL — documents, checklist state; PARSE — parse queue; ACT — activity log.

**Integration diagram (described):** Box "Upload API (Node)" → arrows to "S3 (binary)", "PostgreSQL (metadata/checklist)", "FastAPI /parse (enqueue)"; inbound from "Wizard/Repository UI".

### 1.4.4.11 Postconditions

- Document durably stored with metadata, category, and checklist linkage; parsing scheduled; repository and dashboard views current.

---

## 1.4.5 Smart Document Parser Module (PARSE)

### 1.4.5.1 Description

The Smart Document Parser Module converts uploaded documents into structured IPO data. It first extracts raw text and tables (PyMuPDF for PDF, python-docx for Word, openpyxl for Excel; OCR pathway for scanned documents), then invokes the LLM with a structured-output prompt to map document content onto the target field schema. Every extracted value carries a confidence score (0–1) and a source-document tag, and is presented to the SME in an editable extraction preview before acceptance — nothing enters the canonical IPO data as a black box.

### 1.4.5.2 Actors

- System (parser/LLM pipeline)
- SME Promoter (reviews and accepts extraction output)

### 1.4.5.3 Preconditions

- Document uploaded and enqueued (DOC) with parse status "pending".
- LLM API reachable with valid credentials.

### 1.4.5.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-PARSE-01 | Document Parser | Text Extraction | System shall extract raw text and tabular content from PDF, Word, and Excel documents. |
| 2 | FR-PARSE-02 | Document Parser | Text Extraction | System shall route image-only or scanned PDFs through an OCR pathway before field extraction. |
| 3 | FR-PARSE-03 | Document Parser | Field Extraction | System shall submit extracted text to the LLM API with a structured-output prompt targeting the platform field schema and requiring strict JSON output. |
| 4 | FR-PARSE-04 | Document Parser | Field Extraction | System shall record, for every extracted value, a confidence score between 0 and 1 returned in the same LLM call. |
| 5 | FR-PARSE-05 | Document Parser | Field Extraction | System shall record, for every extracted value, the source document identifier and the supporting verbatim quote. |
| 6 | FR-PARSE-06 | Document Parser | Field Extraction | System shall discard any LLM output value not conforming to the target field schema and log the discard. |
| 7 | FR-PARSE-07 | Document Parser | Preview | System shall present extracted values in an editable extraction preview, grouped by wizard step, showing value, confidence, and source document. |
| 8 | FR-PARSE-08 | Document Parser | Preview | System shall visually highlight extracted values with confidence below 0.70 for mandatory SME attention. |
| 9 | FR-PARSE-09 | Document Parser | Acceptance | System shall commit extracted values to the canonical IPO data (DATA) only upon explicit SME acceptance, individually or in bulk. |
| 10 | FR-PARSE-10 | Document Parser | Status | System shall progress document parse status through pending → parsing → parsed, or to failed with a stored failure reason. |
| 11 | FR-PARSE-11 | Document Parser | Asynchrony | System shall execute parsing asynchronously and expose polling status to the UI with progress indication. |
| 12 | FR-PARSE-12 | Document Parser | Access Control | System shall restrict extraction preview and acceptance actions to SME members of the workspace. |
| 13 | FR-PARSE-13 | Document Parser | Audit | System shall record parse start, completion, failure, and acceptance events in the activity log. |
| 14 | FR-PARSE-14 | Document Parser | Dashboard Linkage | System shall expose parse status counts and unaccepted-extraction counts to the Draft Health Score & Dashboard Module. |

### 1.4.5.5 Process Flow

1. Queue worker picks a pending document and sets status "parsing".
2. Text/table extraction runs by format; OCR applies for scanned content.
3. LLM structured-extraction call returns JSON: field key, value, confidence, supporting quote.
4. Non-conforming values are discarded and logged; conforming values persist as extracted_fields tagged with the source document.
5. Status becomes "parsed"; SME opens the extraction preview, edits/accepts values; accepted values commit to canonical IPO data and pre-fill the wizard.

**Flow diagram (described):** Start → box "Dequeue document (status parsing)" → diamond "Machine-readable?" — No → box "OCR pathway" → merge; Yes → merge → box "LLM structured extraction (JSON: value + confidence + quote)" → diamond "Schema-conformant?" — No → box "Discard + log" ; Yes → box "Persist extracted_fields (confidence, source)" → box "Status parsed" → box "SME preview: edit/accept" → box "Accepted → DATA commit + wizard pre-fill" → End.

### 1.4.5.6 Inputs

- Parsed queue entries (document ID, storage key, category, step tag); target field schema; prompt template.

### 1.4.5.7 Outputs

- extracted_fields records (value, confidence, source document, quote); parse status transitions; extraction preview UI data; activity log entries.

### 1.4.5.8 Business Rules

- The parser shall never fabricate values; fields not evidenced in the document shall be omitted.
- No extracted value shall enter canonical IPO data without explicit SME acceptance.
- Prompt templates shall be versioned configuration, editable without redeployment.
- A failed parse shall not block manual data entry for the same fields.

### 1.4.5.9 Validation Rules

- Confidence shall be numeric within [0, 1]; values outside the range invalidate the record.
- field_key shall exist in the platform field schema.
- LLM output shall be strict JSON; non-JSON responses trigger one automatic retry, then failure.

### 1.4.5.10 Integration Points

- LLM API — structured extraction (one of three LLM consumers); S3 — document retrieval; PostgreSQL — extracted_fields, documents.parse_status; DATA — acceptance commit; ACT — logging.

**Integration diagram (described):** Box "FastAPI parse/extract service" ← arrow from "Node (enqueue)"; arrows out to "S3 (fetch binary)", "LLM API (structured prompt)", "PostgreSQL (extracted_fields)"; arrow "accepted values" to "DATA".

### 1.4.5.11 Postconditions

- Document parse status is terminal (parsed/failed); extracted values await or have received SME acceptance; accepted values are in canonical IPO data with full provenance.

---

## 1.4.6 IPO Data Management Module (DATA)

### 1.4.6.1 Description

The IPO Data Management Module is the structured central data store for all captured particulars — the single source feeding the wizard (WIZ), the validation engine (VAL), and draft generation (DRAFT). It holds canonical field values keyed by workspace and field identifier, tracks each value's origin (manual entry vs accepted extraction), and preserves provenance links back to source documents.

### 1.4.6.2 Actors

- System (persistence layer)
- SME Promoter (indirect, via wizard and extraction acceptance)

### 1.4.6.3 Preconditions

- Workspace exists (WSP); field schema configuration loaded.

### 1.4.6.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-DATA-01 | IPO Data | Schema | System shall maintain a platform-level field schema defining field key, label, data type, wizard step, and mandatory flag for every capturable field. |
| 2 | FR-DATA-02 | IPO Data | Persistence | System shall store exactly one canonical value per workspace per field key. |
| 3 | FR-DATA-03 | IPO Data | Persistence | System shall record, for every canonical value, its origin: manual entry or accepted extraction with source document reference. |
| 4 | FR-DATA-04 | IPO Data | Persistence | System shall record the updating user and timestamp on every canonical value write. |
| 5 | FR-DATA-05 | IPO Data | Update Semantics | System shall overwrite the canonical value on subsequent writes, retaining only the latest value (no version history in Phase 1). |
| 6 | FR-DATA-06 | IPO Data | Retrieval | System shall serve field values grouped by wizard step to the wizard UI. |
| 7 | FR-DATA-07 | IPO Data | Retrieval | System shall serve the complete structured dataset for a workspace as a single JSON document to the Validation Engine and AI Draft Generation modules. |
| 8 | FR-DATA-08 | IPO Data | Typing | System shall enforce the schema data type (text, number, percentage, date, enum) on every write and reject non-conforming values. |
| 9 | FR-DATA-09 | IPO Data | Tracked Fields | System shall designate a configured subset of numeric fields (employee count, revenue, promoter shareholding %, net worth) as cross-document tracked fields retaining all per-source extracted values alongside the canonical value. |
| 10 | FR-DATA-10 | IPO Data | Access Control | System shall permit canonical writes only from SME members (via wizard or acceptance) and system processes; MB and Legal access shall be read-only. |
| 11 | FR-DATA-11 | IPO Data | Audit | System shall record bulk acceptance commits and schema-violation rejections in the activity log. |
| 12 | FR-DATA-12 | IPO Data | Dashboard Linkage | System shall expose mandatory-field completion ratios per wizard step to the Draft Health Score & Dashboard Module. |

### 1.4.6.5 Process Flow

1. Write request arrives from wizard auto-save or extraction acceptance.
2. System validates the field key against the schema and enforces the data type.
3. System upserts the canonical value with origin, user, and timestamp.
4. For tracked fields, per-source extracted values are retained in parallel for consistency checking.
5. Read paths serve step-grouped values to the wizard and the full JSON dataset to VAL and DRAFT.

**Flow diagram (described):** Start → box "Write (wizard / acceptance)" → diamond "Field in schema & type valid?" — No → box "Reject + log" → End; Yes → box "Upsert canonical value (origin, user, ts)" → diamond "Tracked field?" — Yes → box "Retain per-source values" → merge; No → merge → box "Serve reads: wizard (by step), VAL/DRAFT (full JSON)" → End.

### 1.4.6.6 Inputs

- Field writes from WIZ and PARSE acceptance; field schema configuration.

### 1.4.6.7 Outputs

- Canonical ipo_data records with provenance; full-workspace JSON dataset; per-step completion ratios.

### 1.4.6.8 Business Rules

- The canonical value shall always be the single source of truth for validation and drafting; raw extracted values shall never bypass acceptance.
- Schema changes shall be Admin-level configuration and shall not retroactively invalidate stored values silently; violations surface as validation flags.

### 1.4.6.9 Validation Rules

- Writes shall reference an existing workspace and schema-defined field key.
- Data-type enforcement per FR-DATA-08; enum fields shall accept only defined options.

### 1.4.6.10 Integration Points

- PostgreSQL — ipo_data, extracted_fields (tracked-field retention); WIZ, PARSE (writers); VAL, DRAFT, HLTH (readers).

**Integration diagram (described):** Central box "ipo_data (PostgreSQL)" with inbound arrows from "WIZ auto-save" and "PARSE acceptance", outbound arrows to "VAL (full JSON)", "DRAFT (full JSON)", "HLTH (completion ratios)".

### 1.4.6.11 Postconditions

- Canonical, typed, provenance-tagged dataset exists per workspace, current to the latest accepted/entered values, and is served consistently to all consumers.

---
## 1.4.7 Validation Engine Module (VAL)

### 1.4.7.1 Description

The Validation Engine Module examines the canonical IPO dataset and raises validation flags of three types: **missing** (rule-based detection of empty mandatory fields), **disclosure_gap** (LLM-assisted comparison of captured data against hardcoded SEBI ICDR disclosure reference snippets), and **inconsistent** (cross-document comparison of the tracked numeric fields — employee count, revenue, promoter shareholding %, net worth — where different source documents yield different values). Each flag carries a specific, actionable reason and, for inconsistencies, the conflicting source values. Flags surface in the Missing Info Panel and gate export readiness.

### 1.4.7.2 Actors

- System (validation pipeline)
- SME Promoter (views and resolves flags)
- Merchant Banker, Legal Counsel (view flags)

### 1.4.7.3 Preconditions

- Canonical IPO data exists (DATA); for inconsistency checks, at least two source values exist for a tracked field.
- LLM API reachable for the disclosure-gap pass.

### 1.4.7.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-VAL-01 | Validation Engine | Missing Fields | System shall detect every schema-mandatory field with no canonical value and raise a flag of type "missing". |
| 2 | FR-VAL-02 | Validation Engine | Missing Fields | System shall include in each missing-field flag the field label, owning wizard step, and target DRHP section. |
| 3 | FR-VAL-03 | Validation Engine | Disclosure Gaps | System shall submit the canonical dataset to the LLM with hardcoded SEBI ICDR SME disclosure reference snippets and raise flags of type "disclosure_gap" for material gaps identified. |
| 4 | FR-VAL-04 | Validation Engine | Disclosure Gaps | System shall require each disclosure-gap flag to carry a one-sentence, specific, actionable reason. |
| 5 | FR-VAL-05 | Validation Engine | Consistency | System shall compare all per-source values of each tracked field and raise a flag of type "inconsistent" when values differ beyond exact match (numeric tolerance configurable, default 0). |
| 6 | FR-VAL-06 | Validation Engine | Consistency | System shall attach to each inconsistency flag the conflicting values and their source document identifiers. |
| 7 | FR-VAL-07 | Validation Engine | Triggering | System shall run validation on demand (SME-triggered) and automatically before draft generation and before export summary computation. |
| 8 | FR-VAL-08 | Validation Engine | Lifecycle | System shall mark a flag resolved automatically when its underlying condition no longer holds on re-validation. |
| 9 | FR-VAL-09 | Validation Engine | Lifecycle | System shall allow the SME to acknowledge (not delete) a flag with a note; acknowledged flags shall remain visible and counted separately. |
| 10 | FR-VAL-10 | Validation Engine | Presentation | System shall present open flags in a Missing Info Panel grouped by type and wizard step, ordered missing → inconsistent → disclosure_gap. |
| 11 | FR-VAL-11 | Validation Engine | Access Control | System shall restrict flag resolution actions to SME members; MB and Legal members shall have read access. |
| 12 | FR-VAL-12 | Validation Engine | Audit | System shall record validation runs, flag creation, and flag resolution in the activity log. |
| 13 | FR-VAL-13 | Validation Engine | Dashboard Linkage | System shall expose open/resolved flag counts by type to the Draft Health Score & Dashboard Module, where they form a DHS component. |

### 1.4.7.5 Process Flow

1. Validation triggers (SME action, pre-draft, or pre-export).
2. Rule pass: mandatory-field scan produces "missing" flags.
3. Tracked-field pass: per-source value comparison produces "inconsistent" flags with source values.
4. LLM pass: dataset plus hardcoded ICDR snippets produce "disclosure_gap" flags with actionable reasons.
5. Existing flags re-evaluate; satisfied conditions auto-resolve. Panel and DHS update.

**Flow diagram (described):** Start → box "Trigger (manual / pre-draft / pre-export)" → three parallel boxes "Rule pass: missing", "Diff pass: tracked-field inconsistencies", "LLM pass: ICDR disclosure gaps" → merge box "Upsert flags; auto-resolve satisfied" → box "Missing Info Panel + DHS update" → End.

### 1.4.7.6 Inputs

- Canonical dataset (DATA); per-source tracked-field values; field schema mandatory flags; hardcoded ICDR snippets; validation prompt template.

### 1.4.7.7 Outputs

- validation_flags records (type, field/section, reason, source values, resolved state); Missing Info Panel view; activity log entries.

### 1.4.7.8 Business Rules

- Flags shall never be deletable; they resolve by data correction or remain acknowledged.
- The disclosure-gap pass shall use only the hardcoded ICDR snippet set in this version (no RAG — Phase 2, Module 15).
- Open "missing" flags on mandatory fields shall block export readiness (EXP); acknowledged flags shall not block but shall be listed in the export summary.

### 1.4.7.9 Validation Rules

- Every flag shall carry issue_type ∈ {missing, inconsistent, disclosure_gap} and a non-empty reason.
- Inconsistency flags shall reference at least two source values.
- LLM pass output shall be strict JSON conforming to the flag schema; non-conforming items are discarded and logged.

### 1.4.7.10 Integration Points

- LLM API — disclosure-gap reasoning (one of three LLM consumers); PostgreSQL — validation_flags; DATA — dataset input; EXP — readiness gating; HLTH — DHS component; ACT — logging.

**Integration diagram (described):** Box "FastAPI validate service" with inbound "DATA full JSON", outbound to "LLM API", "PostgreSQL validation_flags"; arrows from flags table to "EXP readiness" and "HLTH DHS".

### 1.4.7.11 Postconditions

- Current, typed flag set reflects the dataset state; export readiness and DHS reflect open flags; all runs are auditable.

---

## 1.4.8 AI Draft Generation Module (DRAFT)

### 1.4.8.1 Description

The AI Draft Generation Module produces the DRHP draft **one section at a time** — Company Overview, Business, Financial Summary, Risk Factors, Objects of Issue — from the canonical IPO dataset, using per-section prompt templates that embed section-specific instructions and hardcoded SEBI ICDR disclosure snippets. Single-click full-document generation is intentionally excluded to preserve reviewability. Each section supports Generate, Regenerate, and Edit-manually actions; where required data is absent, the generator inserts explicit [INFORMATION REQUIRED] markers rather than inventing content.

### 1.4.8.2 Actors

- SME Promoter (initiates generation, edits output)
- System (LLM drafting pipeline)

### 1.4.8.3 Preconditions

- Canonical IPO data populated for the target section's inputs (DATA); validation has run (VAL); the target section is not locked by another user (OWN).

### 1.4.8.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-DRAFT-01 | AI Draft Generation | Generation | System shall generate DRHP content per individual section on explicit user action, never as a single full-document operation. |
| 2 | FR-DRAFT-02 | AI Draft Generation | Generation | System shall construct each generation request from the section-specific prompt template, the canonical dataset JSON, and hardcoded ICDR snippets for that section. |
| 3 | FR-DRAFT-03 | AI Draft Generation | Generation | System shall insert the marker "[INFORMATION REQUIRED: …]" wherever required information is absent, and shall not fabricate content. |
| 4 | FR-DRAFT-04 | AI Draft Generation | Generation | System shall produce section output as structured rich text (markdown) suitable for Word/PDF conversion. |
| 5 | FR-DRAFT-05 | AI Draft Generation | Regeneration | System shall support regeneration of a section, replacing prior AI content after user confirmation. |
| 6 | FR-DRAFT-06 | AI Draft Generation | Manual Edit | System shall allow the SME to edit generated section content manually in place, subject to section locking (OWN). |
| 7 | FR-DRAFT-07 | AI Draft Generation | Status | System shall set section status to "ai_generated" on generation completion and to "sme_verified" when the SME confirms the content. |
| 8 | FR-DRAFT-08 | AI Draft Generation | Asynchrony | System shall execute generation asynchronously with per-section progress indication in the Draft Viewer. |
| 9 | FR-DRAFT-09 | AI Draft Generation | Pre-check | System shall run validation (VAL) before generation and display open flags relevant to the target section prior to invoking the LLM. |
| 10 | FR-DRAFT-10 | AI Draft Generation | Failure Handling | System shall surface LLM failures (timeout, refusal, malformed output) as a retriable section-level error without corrupting existing content. |
| 11 | FR-DRAFT-11 | AI Draft Generation | Access Control | System shall restrict generation and regeneration actions to SME members of the workspace. |
| 12 | FR-DRAFT-12 | AI Draft Generation | Audit | System shall record generation, regeneration, and manual-edit events with section and actor in the activity log. |
| 13 | FR-DRAFT-13 | AI Draft Generation | Dashboard Linkage | System shall expose per-section generation status to the Draft Health Score & Dashboard Module. |

### 1.4.8.5 Process Flow

1. SME opens the Draft Viewer and selects a section; relevant open validation flags display.
2. SME clicks Generate (or Regenerate with confirmation).
3. System acquires the section lock, assembles the prompt (template + dataset + ICDR snippets), and calls the LLM asynchronously.
4. Output persists as section content; status becomes "ai_generated"; missing inputs appear as [INFORMATION REQUIRED] markers.
5. SME edits manually as needed and confirms → status "sme_verified"; the section proceeds to review (OWN/REV).

**Flow diagram (described):** Start → box "Select section in Draft Viewer" → box "Show open VAL flags for section" → diamond "Generate / Regenerate?" → box "Acquire lock (OWN)" → box "Assemble prompt: template + DATA JSON + ICDR snippets" → box "LLM call (async, progress)" → diamond "Success?" — No → box "Retriable error; content unchanged" → End; Yes → box "Persist content; status ai_generated" → box "SME manual edit (optional)" → box "SME confirm → sme_verified" → End.

### 1.4.8.6 Inputs

- Section selection and user action; canonical dataset JSON; per-section prompt template; ICDR snippet set.

### 1.4.8.7 Outputs

- Section content (markdown) with any [INFORMATION REQUIRED] markers; section status transitions; activity log entries.

### 1.4.8.8 Business Rules

- Full-document one-click generation shall not be provided.
- Generated content shall derive only from the canonical dataset; the generator shall not use unaccepted extractions.
- Regeneration shall require explicit confirmation because prior AI content is replaced (no version history in Phase 1).
- A section under review lock by another role shall not be generatable or editable.

### 1.4.8.9 Validation Rules

- Generation shall be rejected if the section is locked by another user.
- LLM output shall be non-empty markdown; empty or refused outputs trigger the failure path (FR-DRAFT-10).
- Prompt assembly shall fail fast if the dataset JSON is unavailable.

### 1.4.8.10 Integration Points

- LLM API — section drafting (one of three LLM consumers); DATA — dataset input; VAL — pre-generation flags; OWN — locking/status; PostgreSQL — sections.content; ACT — logging.

**Integration diagram (described):** Box "FastAPI draft service" with inbound from "Node sections API (generate action)", arrows to "LLM API", "PostgreSQL sections", side inputs from "DATA" and "prompt templates"; status arrows to "OWN".

### 1.4.8.11 Postconditions

- Target section holds reviewable draft content with explicit gaps marked; status reflects generation/verification state; DHS updated.

---

## 1.4.9 Section Ownership, Locking & Review Workflow Module (OWN)

### 1.4.9.1 Description

The Section Ownership, Locking & Review Workflow Module governs the per-section state machine that lets three roles work on one evolving draft without collisions. Each section carries an owner role, an optional lock (holder + timestamp), and a review status progressing through: empty → ai_generated → sme_verified → mb_reviewed → legal_reviewed → final. Locking is pessimistic with refresh-on-load semantics — no real-time infrastructure is used (real-time co-editing is Phase 2, Module 20).

### 1.4.9.2 Actors

- SME Promoter, Merchant Banker, Legal Counsel (lock holders / status actors)
- System (state machine enforcement)

### 1.4.9.3 Preconditions

- Sections seeded at workspace creation (WSP); actors are authenticated workspace members.

### 1.4.9.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-OWN-01 | Section Ownership | State Model | System shall maintain, per section: owner role, lock holder, lock timestamp, and review status. |
| 2 | FR-OWN-02 | Section Ownership | State Model | System shall enforce the status progression empty → ai_generated → sme_verified → mb_reviewed → legal_reviewed → final, permitting regression only via an explicit change request (REV). |
| 3 | FR-OWN-03 | Section Ownership | Locking | System shall grant an exclusive edit lock on a section to the requesting member when no lock is held. |
| 4 | FR-OWN-04 | Section Ownership | Locking | System shall reject edit, generate, and status-change operations on a section locked by another user with HTTP 409 and the lock holder's identity. |
| 5 | FR-OWN-05 | Section Ownership | Locking | System shall release a lock on explicit user release, on session logout, or automatically after 30 minutes of inactivity. |
| 6 | FR-OWN-06 | Section Ownership | Locking | System shall display lock state (holder, since when) on every section in the Draft Viewer, refreshed on page load. |
| 7 | FR-OWN-07 | Section Ownership | Status Transitions | System shall permit sme_verified → mb_reviewed only by a Merchant Banker member, and → legal_reviewed only by a Legal Counsel member. |
| 8 | FR-OWN-08 | Section Ownership | Status Transitions | System shall set a section to "final" only when both merchant banker and legal counsel approvals exist (REV). |
| 9 | FR-OWN-09 | Section Ownership | Change Requests | System shall regress a section to "sme_verified" (or "ai_generated" if content must be regenerated) when a reviewer files a change request, unlocking it for SME action. |
| 10 | FR-OWN-10 | Section Ownership | Access Control | System shall permit content edits only to the role consistent with the section's current status (SME before review; reviewers comment rather than edit). |
| 11 | FR-OWN-11 | Section Ownership | Audit | System shall record every lock acquisition/release and status transition with actor and timestamp in the activity log. |
| 12 | FR-OWN-12 | Section Ownership | Dashboard Linkage | System shall expose per-section status and lock state to the Draft Health Score & Dashboard Module. |

### 1.4.9.5 Process Flow

1. Member opens a section; UI shows status and lock state (refresh-on-load).
2. Member requests the edit lock; system grants if free, else returns holder identity.
3. Member performs the role-appropriate action (SME edit/verify; MB/Legal review via REV).
4. Status transitions per the state machine; locks release on action completion, logout, or 30-minute timeout.
5. Both approvals present → section becomes "final".

**Flow diagram (described):** State diagram with six states in a row: empty → ai_generated (on DRAFT generate) → sme_verified (SME confirm) → mb_reviewed (MB approve) → legal_reviewed (Legal approve) → final (both approvals). Backward arrows labelled "change request (REV)" from mb_reviewed/legal_reviewed to sme_verified, and "regenerate" from sme_verified to ai_generated. A side lane shows lock lifecycle: "request lock" → diamond "free?" — Yes → "hold (max 30 min idle)" → "release"; No → "409 + holder".

### 1.4.9.6 Inputs

- Lock requests/releases; status transition actions; reviewer approvals and change requests (REV).

### 1.4.9.7 Outputs

- Updated section state (status, lock); 409 conflict responses with holder identity; activity log entries.

### 1.4.9.8 Business Rules

- A section under review by one role shall be locked from edits by others.
- No section shall skip a state in the forward progression.
- "final" shall be irreversible except by an Admin-level intervention recorded in the activity log. *(Assumption: prevents accidental unfinalization in a prototype.)*
- Lock timeout shall be 30 minutes of inactivity.

### 1.4.9.9 Validation Rules

- Transition requests shall name a valid target state adjacent in the state machine.
- Approval-driven transitions shall verify the actor's role and workspace membership.
- Lock release shall be honored only from the holder or the timeout process.

### 1.4.9.10 Integration Points

- PostgreSQL — sections (status, locked_by, locked_at); DRAFT — generation gating; REV — approval/change-request triggers; HLTH — status aggregation; ACT — logging.

**Integration diagram (described):** Central box "sections state machine (Node)" with bidirectional arrows to "DRAFT (generate gate)" and "REV (approve/change-request)", outbound to "PostgreSQL sections", "HLTH", "ACT".

### 1.4.9.11 Postconditions

- Section state and lock reflect the last legal transition; concurrent edit collisions are prevented; the full transition history is auditable.

---
## 1.4.10 Review & Collaboration Module (REV)

### 1.4.10.1 Description

The Review & Collaboration Module implements the expert-review layer that preserves the mandatory role of authorised intermediaries. Merchant banker and legal counsel review **in parallel**, per section: commenting, filing change requests, and approving or rejecting. Reviewer queues list sections awaiting each role's attention; consolidated comments return to the SME for action. Approvals feed the OWN state machine; both approvals are required for a section to become final.

### 1.4.10.2 Actors

- Merchant Banker, Legal Counsel (reviewers)
- SME Promoter (responds to comments and change requests)

### 1.4.10.3 Preconditions

- Reviewer is an authenticated workspace member; target section is in status "sme_verified" or later (OWN).

### 1.4.10.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-REV-01 | Review | Queues | System shall present each reviewer a queue of sections pending their role's review across all workspaces they belong to. |
| 2 | FR-REV-02 | Review | Comments | System shall allow reviewers to attach threaded comments to any section. |
| 3 | FR-REV-03 | Review | Comments | System shall allow the SME to reply to reviewer comments within the same thread. |
| 4 | FR-REV-04 | Review | Change Requests | System shall allow a reviewer to file a change request on a section with a mandatory description, regressing its status per FR-OWN-09. |
| 5 | FR-REV-05 | Review | Approval | System shall allow a merchant banker to approve or reject a section, and a legal counsel to approve or reject a section, independently and in parallel. |
| 6 | FR-REV-06 | Review | Approval | System shall record approver identity, role, action, and timestamp on every approval or rejection. |
| 7 | FR-REV-07 | Review | Approval | System shall mark a section "final" only when both roles' approvals are present (per FR-OWN-08). |
| 8 | FR-REV-08 | Review | Consolidation | System shall present the SME a consolidated view of all comments and change requests across sections, filterable by state (open/resolved). |
| 9 | FR-REV-09 | Review | Notification | System shall notify the SME (activity feed and email) when a review action (comment, change request, approval, rejection) occurs. |
| 10 | FR-REV-10 | Review | Notification | System shall notify reviewers (activity feed and email) when a section enters their review queue. |
| 11 | FR-REV-11 | Review | Access Control | System shall restrict review actions to the reviewer roles and to workspaces where the reviewer holds membership. |
| 12 | FR-REV-12 | Review | Audit | System shall record every comment, change request, approval, and rejection in the activity log. |
| 13 | FR-REV-13 | Review | Dashboard Linkage | System shall expose pending-review counts and approval progress per workspace to the Draft Health Score & Dashboard Module. |

### 1.4.10.5 Process Flow

1. Section reaches "sme_verified"; it appears in both reviewer queues; reviewers are notified.
2. Reviewer opens the section, reads content, adds comments; either files a change request (section regresses to SME) or approves/rejects.
3. SME sees consolidated comments, edits content (OWN lock), re-verifies; section re-enters queues.
4. When both MB and Legal approvals exist, the section becomes "final".

**Flow diagram (described):** Box "Section sme_verified" → parallel split to "MB queue" and "Legal queue" → each to diamond "Action?" with three exits: "Comment" (loops to SME consolidated view), "Change request" (arrow back to "SME edits → re-verify"), "Approve" → merge diamond "Both approvals?" — Yes → box "Section final"; No → wait state.

### 1.4.10.6 Inputs

- Reviewer comments, change-request descriptions, approve/reject actions; SME replies.

### 1.4.10.7 Outputs

- review_comments records; section status transitions (via OWN); notifications; consolidated comment views; activity log entries.

### 1.4.10.8 Business Rules

- Reviewers shall comment and request changes but shall not edit section content directly.
- Merchant banker and legal counsel reviews shall be independent; neither shall be blocked by the other's pending state.
- A change request shall carry a mandatory, non-empty description.
- Approval of a section shall be revoked automatically if the section content changes afterward, returning it to the reviewer's queue.

### 1.4.10.9 Validation Rules

- Review actions shall reference an existing section in a reviewable status.
- Comment bodies shall be non-empty and at most 5,000 characters.
- Approve/reject shall be idempotent per reviewer per section content-state.

### 1.4.10.10 Integration Points

- OWN — status transitions; Email Service — review notifications; PostgreSQL — review_comments; ACT — activity feed/logging; HLTH — pending counts.

**Integration diagram (described):** Box "Review service (Node)" with arrows to "OWN state machine", "PostgreSQL review_comments", "Email Service", "ACT feed"; inbound from "MB/Legal Review UI" and "SME consolidated view".

### 1.4.10.11 Postconditions

- Review record trail exists per section; approvals accumulate toward "final"; SME has an actionable consolidated comment view.

---

## 1.4.11 Draft Health Score & Dashboard Module (HLTH)

### 1.4.11.1 Description

The Draft Health Score & Dashboard Module is the platform's monitoring and reporting layer (in place of a conventional MIS). It computes the Draft Health Score (DHS) — a 0–100 aggregate of section progress, validation resolution, required-document completion, and review approvals — and renders a Jira-style dashboard per workspace: counts by section status, document status, open flags, pending reviews, plus the activity feed's latest events. All values are computed on read from existing records; nothing is separately maintained.

### 1.4.11.2 Actors

- SME Promoter, Merchant Banker, Legal Counsel (viewers)
- System (aggregation)

### 1.4.11.3 Preconditions

- Workspace exists with any amount of data; viewer is an authenticated member.

### 1.4.11.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-HLTH-01 | Health & Dashboard | DHS | System shall compute the Draft Health Score as a 0–100 value aggregating: % sections at or beyond sme_verified, % validation flags resolved, % required documents uploaded, and % sections with both approvals. |
| 2 | FR-HLTH-02 | Health & Dashboard | DHS | System shall compute the DHS on read via aggregation and shall not store it as an independently updatable value. |
| 3 | FR-HLTH-03 | Health & Dashboard | DHS | System shall display the DHS with a breakdown of its four components on the workspace dashboard. |
| 4 | FR-HLTH-04 | Health & Dashboard | Dashboard | System shall display per-workspace counts of sections by review status. |
| 5 | FR-HLTH-05 | Health & Dashboard | Dashboard | System shall display per-workspace counts of documents by category and parse status, and checklist completion. |
| 6 | FR-HLTH-06 | Health & Dashboard | Dashboard | System shall display open validation flags by type with links into the Missing Info Panel. |
| 7 | FR-HLTH-07 | Health & Dashboard | Dashboard | System shall display pending review actions for the viewing role (review queue preview for MB/Legal; open change requests for SME). |
| 8 | FR-HLTH-08 | Health & Dashboard | Dashboard | System shall display the five most recent activity feed events per workspace (see ACT). |
| 9 | FR-HLTH-09 | Health & Dashboard | Multi-workspace | System shall present merchant bankers a portfolio view listing all their workspaces with DHS and pending-action counts. |
| 10 | FR-HLTH-10 | Health & Dashboard | Access Control | System shall show dashboard data only for workspaces where the viewer holds membership. |
| 11 | FR-HLTH-11 | Health & Dashboard | Performance | System shall serve dashboard aggregates from indexed queries or the workspace_progress view without full-table scans. |
| 12 | FR-HLTH-12 | Health & Dashboard | Export Linkage | System shall surface export readiness (per EXP criteria) as a dashboard indicator. |

### 1.4.11.5 Process Flow

1. Member opens the dashboard; system runs aggregate queries scoped to their memberships.
2. DHS computes from the four component ratios; breakdown renders alongside counts and the activity feed excerpt.
3. Links route to the wizard, Missing Info Panel, Draft Viewer, review queue, or export summary respectively.

**Flow diagram (described):** Start → box "Load dashboard" → box "Aggregate: sections, flags, docs, approvals (workspace_progress view)" → box "Compute DHS (weighted mean of 4 ratios)" → box "Render: DHS + breakdown, status counts, open flags, pending reviews, last-5 activity" → arrows out to "Wizard / Panel / Viewer / Queue / Export" → End.

### 1.4.11.6 Inputs

- Live records: sections, validation_flags, documents/checklist, review approvals, activity_log.

### 1.4.11.7 Outputs

- DHS value with component breakdown; Jira-style status dashboard; portfolio view (MB); export-readiness indicator.

### 1.4.11.8 Business Rules

- The DHS shall be deterministic: identical underlying data shall always yield the identical score.
- Component weights shall be platform configuration (default equal weights). *(Assumption: equal weighting is a reasonable prototype default.)*
- No dashboard element shall expose data from workspaces outside the viewer's membership.

### 1.4.11.9 Validation Rules

- Ratios with zero denominators shall be treated as 0% complete, not errors.
- DHS shall clamp to [0, 100].

### 1.4.11.10 Integration Points

- PostgreSQL — workspace_progress view and aggregate queries over sections, validation_flags, documents, review_comments, activity_log; every other Phase 1 module (as data suppliers per their closing FRs).

**Integration diagram (described):** Central box "Dashboard service (Node)" with inbound data arrows from "WSP, WIZ, DOC, PARSE, DATA, VAL, DRAFT, OWN, REV, ACT, EXP, BILL" (labelled "closing-FR linkages") and one outbound arrow to "SPA dashboard".

### 1.4.11.11 Postconditions

- Viewer sees a current, role-scoped, computed picture of workspace health; no stored state was mutated by viewing.

---

## 1.4.12 Activity Feed & Auto-save Module (ACT)

### 1.4.12.1 Description

The Activity Feed & Auto-save Module provides the platform's audit trail and edit-safety layer. Every significant event — uploads, extractions, generation, comments, approvals, status changes, exports, billing — lands in a per-workspace activity log; the latest five render as a lightweight feed on the dashboard (a full notification center is out of scope). Auto-save persists in-progress wizard and section edits via debounced writes and displays a "Last saved" timestamp; only the current state is kept (version history is Phase 2, Module 19).

### 1.4.12.2 Actors

- System (event capture, auto-save)
- All member roles (feed viewers; edit originators)

### 1.4.12.3 Preconditions

- Workspace exists; originating modules emit events; user holds an active session for auto-save.

### 1.4.12.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-ACT-01 | Activity & Auto-save | Event Capture | System shall record an activity event for every: document upload/delete, parse completion/failure, extraction acceptance, validation run, draft generation/regeneration, manual edit, lock acquisition/release, status transition, comment, change request, approval/rejection, export, invitation, membership change, and billing event. |
| 2 | FR-ACT-02 | Activity & Auto-save | Event Capture | System shall store, per event: workspace, actor (or system), event type, structured detail payload, and timestamp. |
| 3 | FR-ACT-03 | Activity & Auto-save | Feed | System shall display the five most recent events per workspace on the dashboard, newest first. |
| 4 | FR-ACT-04 | Activity & Auto-save | Feed | System shall provide a full, paginated activity log view per workspace, filterable by event type and actor. |
| 5 | FR-ACT-05 | Activity & Auto-save | Feed | System shall render events in human-readable form including actor name, action, target, and relative time. |
| 6 | FR-ACT-06 | Activity & Auto-save | Auto-save | System shall auto-save wizard field edits via debounced writes no later than 3 seconds after the last keystroke. |
| 7 | FR-ACT-07 | Activity & Auto-save | Auto-save | System shall auto-save manual section edits on the same debounce policy while the editor holds the section lock. |
| 8 | FR-ACT-08 | Activity & Auto-save | Auto-save | System shall display a "Last saved" timestamp adjacent to every auto-saved editing surface, updating on each successful save. |
| 9 | FR-ACT-09 | Activity & Auto-save | Auto-save | System shall retain only the latest saved state (no version history) and shall warn the user before actions that replace content (e.g., regeneration). |
| 10 | FR-ACT-10 | Activity & Auto-save | Failure Handling | System shall indicate visibly when an auto-save attempt fails and shall retry automatically while the editing session remains open. |
| 11 | FR-ACT-11 | Activity & Auto-save | Access Control | System shall show activity data only to members of the workspace concerned. |
| 12 | FR-ACT-12 | Activity & Auto-save | Immutability | System shall treat activity log records as append-only; no user role shall edit or delete events. |
| 13 | FR-ACT-13 | Activity & Auto-save | Dashboard Linkage | System shall supply the dashboard's recent-events component and event-count aggregates to the Draft Health Score & Dashboard Module. |

### 1.4.12.5 Process Flow

1. A module completes a significant action and emits an event (workspace, actor, type, detail).
2. System appends the event to the activity log; dashboard feed reflects it on next load.
3. In parallel, editing surfaces debounce user input and PATCH the current state; on success the "Last saved" timestamp updates; on failure a visible indicator shows and retries continue.

**Flow diagram (described):** Two lanes. Lane A: box "Module action completes" → box "Append event (append-only)" → box "Feed shows last 5 on dashboard load". Lane B: box "User types" → box "Debounce ≤3 s" → box "PATCH current state" → diamond "Saved?" — Yes → box "Update 'Last saved' ts"; No → box "Show failure indicator + retry" (loop).

### 1.4.12.6 Inputs

- Event emissions from all modules; user edit streams from wizard and section editors.

### 1.4.12.7 Outputs

- Append-only activity_log records; dashboard feed excerpt; paginated log view; persisted current edit state with timestamps.

### 1.4.12.8 Business Rules

- The activity log shall be append-only and immutable to all user roles.
- Auto-save shall never persist to a section whose lock the editor no longer holds.
- A full notification center UI shall not be built in this version; the last-5 feed plus email notifications (REV/UM) suffice.

### 1.4.12.9 Validation Rules

- Events shall carry a known event type and reference an existing workspace.
- Auto-save writes shall validate against the same schema/type rules as ordinary writes (DATA, OWN).

### 1.4.12.10 Integration Points

- PostgreSQL — activity_log; all Phase 1 modules — event emitters; WIZ/DRAFT editors — auto-save clients; HLTH — feed consumer.

**Integration diagram (described):** Box "activity_log (append-only)" with inbound arrows from all module boxes; outbound arrow to "Dashboard feed (HLTH)". Separate small loop diagram for debounced auto-save between "Editor UI" and "Node PATCH endpoint".

### 1.4.12.11 Postconditions

- Every significant action is durably and immutably recorded; in-progress work survives interruption to the last debounced save.

---
## 1.4.13 Export & Compliance Summary Module (EXP)

### 1.4.13.1 Description

The Export & Compliance Summary Module closes the workflow: it computes export readiness, presents an Export Summary screen confirming that all sections are approved and no required documents or mandatory fields are missing, and renders the final draft DRHP to Word (.docx) and PDF. Exports carry a prominent draft watermark/disclaimer, since the system output is a draft requiring intermediary certification before any regulatory submission.

### 1.4.13.2 Actors

- SME Promoter (initiates export)
- Merchant Banker (readiness oversight)
- System (readiness computation, rendering)

### 1.4.13.3 Preconditions

- Workspace sections carry review statuses (OWN/REV); validation has run (VAL); workspace payment state is "paid" (BILL).

### 1.4.13.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-EXP-01 | Export | Readiness | System shall compute export readiness as: all sections in status "final", zero open "missing" flags on mandatory fields, and all required-documents checklist items satisfied. |
| 2 | FR-EXP-02 | Export | Summary Screen | System shall present an Export Summary screen showing per-section approval status, open validation flags (including acknowledged), and checklist completion before any export action. |
| 3 | FR-EXP-03 | Export | Summary Screen | System shall block final export while readiness criteria are unmet, listing each unmet criterion with a link to resolve it. |
| 4 | FR-EXP-04 | Export | Summary Screen | System shall allow a clearly labelled "draft export" of the current state at any time, watermarked "DRAFT — NOT FOR SUBMISSION", independent of readiness. |
| 5 | FR-EXP-05 | Export | Rendering | System shall render the assembled document to Word (.docx) preserving section order, headings, and formatting from the stored markdown. |
| 6 | FR-EXP-06 | Export | Rendering | System shall render the same assembled content to PDF such that Word and PDF outputs are content-identical. |
| 7 | FR-EXP-07 | Export | Rendering | System shall include a generated cover page (company name, workspace, export timestamp, DHS at export) and a table of contents in both formats. |
| 8 | FR-EXP-08 | Export | Rendering | System shall execute rendering asynchronously with progress indication and deliver files as downloads and as stored objects in S3. |
| 9 | FR-EXP-09 | Export | Disclaimer | System shall stamp every export with a disclaimer that the document is a draft prepared with AI assistance and requires merchant banker and legal counsel certification before regulatory submission. |
| 10 | FR-EXP-10 | Export | Access Control | System shall restrict export initiation to SME members of a paid workspace; MB members shall be able to download completed exports. |
| 11 | FR-EXP-11 | Export | Audit | System shall record every export (initiator, type draft/final, timestamp, file references) in the activity log. |
| 12 | FR-EXP-12 | Export | Dashboard Linkage | System shall expose export readiness state and last-export metadata to the Draft Health Score & Dashboard Module. |

### 1.4.13.5 Process Flow

1. SME opens the Export Summary; system computes readiness (sections final, flags clear, checklist complete).
2. If unmet, blockers list with resolution links; SME may still produce a watermarked draft export.
3. If met, SME triggers final export; system assembles sections in order, generates cover page and table of contents, renders .docx and PDF asynchronously.
4. Files store to S3 and download to the user; the event logs; dashboard updates last-export metadata.

**Flow diagram (described):** Start → box "Open Export Summary" → box "Compute readiness (EXP-01)" → diamond "Ready?" — No → box "List blockers + links" → optional box "Watermarked draft export" → End; Yes → box "Assemble sections + cover + ToC" → box "Render .docx and PDF (async)" → box "Store to S3 + download" → box "Log + dashboard update" → End.

### 1.4.13.6 Inputs

- Section contents and statuses; validation flags; checklist state; export action.

### 1.4.13.7 Outputs

- Export Summary view; .docx and PDF artifacts (downloaded and stored in S3); activity log entries; readiness indicator.

### 1.4.13.8 Business Rules

- Final (non-watermarked) export shall be impossible while readiness criteria are unmet.
- Every export shall carry the AI-assistance and draft-status disclaimer; the watermark shall additionally appear on non-final exports.
- Exports shall reflect only canonical stored content; no live LLM call occurs at export time.

### 1.4.13.9 Validation Rules

- Export requests shall reference a paid, non-archived workspace.
- Rendering shall fail atomically: no partially assembled artifact is stored or delivered.

### 1.4.13.10 Integration Points

- python-docx / PDF renderer — document generation; S3 — artifact storage; VAL/OWN/DOC — readiness inputs; BILL — payment gating; ACT — logging; HLTH — readiness indicator.

**Integration diagram (described):** Box "FastAPI export service" with inbound "sections + flags + checklist (readiness inputs)" and "SME export action (via Node)"; outbound to "docx/PDF renderer", "S3 (artifacts)", "ACT log". Side gate box "BILL: paid?" before the action arrow.

### 1.4.13.11 Postconditions

- Content-identical .docx and PDF artifacts exist in S3 and with the user; the export is auditable; readiness state is visible on the dashboard.

---

## 1.4.14 Billing & Subscription Module (BILL)

### 1.4.14.1 Description

The Billing & Subscription Module implements the monetization model: SME promoters pay per IPO project (per workspace), merchant bankers hold an annual subscription covering unlimited workspaces, and legal counsel access is free via invitation. Payments flow through an external payment gateway (provider TBD; Razorpay recommended); in Phase 1 the gateway may run in sandbox/stub mode with identical internal state transitions.

### 1.4.14.2 Actors

- SME Promoter (per-project payer)
- Merchant Banker (subscriber)
- Admin (subscription oversight)
- System (gateway integration, state gating)

### 1.4.14.3 Preconditions

- Authenticated user; payment gateway (or stub) configured.

### 1.4.14.4 Functional Requirements

| S.No | Requirement Number | Module | Submodule | Functional Requirement Description |
|---|---|---|---|---|
| 1 | FR-BILL-01 | Billing | SME Payment | System shall require a one-time per-workspace payment from the SME before full workspace features (parsing, drafting, export) are enabled. |
| 2 | FR-BILL-02 | Billing | SME Payment | System shall permit workspace creation, wizard data entry, and document upload prior to payment, gating AI processing and export on payment completion. |
| 3 | FR-BILL-03 | Billing | SME Payment | System shall create a payment order via the payment gateway and update the workspace payment state to "paid" only upon gateway confirmation. |
| 4 | FR-BILL-04 | Billing | MB Subscription | System shall maintain annual subscriptions for merchant bankers with states: active, expired, cancelled. |
| 5 | FR-BILL-05 | Billing | MB Subscription | System shall permit a merchant banker with an active subscription to join and review an unlimited number of workspaces. |
| 6 | FR-BILL-06 | Billing | MB Subscription | System shall restrict a merchant banker whose subscription is expired or cancelled to read-only dashboard listing of their workspaces. |
| 7 | FR-BILL-07 | Billing | Legal Access | System shall grant legal counsel workspace access free of charge, exclusively through the invitation flow. |
| 8 | FR-BILL-08 | Billing | Gateway | System shall verify payment gateway callbacks/webhooks by signature before applying any state change. |
| 9 | FR-BILL-09 | Billing | Gateway | System shall handle failed or abandoned payments by retaining the order in a "created/failed" state and allowing retry without duplicate charges. |
| 10 | FR-BILL-10 | Billing | Records | System shall persist all payment and subscription records with amount, currency (INR), gateway reference, status, and timestamps. |
| 11 | FR-BILL-11 | Billing | Access Control | System shall restrict subscription administration (extension, cancellation) to the Admin role. |
| 12 | FR-BILL-12 | Billing | Audit | System shall record payment order creation, confirmation, failure, and subscription state changes in the activity log. |
| 13 | FR-BILL-13 | Billing | Dashboard Linkage | System shall expose workspace payment state and subscription status to the Draft Health Score & Dashboard Module for gating indicators. |

### 1.4.14.5 Process Flow

1. SME creates a workspace (unpaid); data entry and upload proceed; AI/export features indicate the payment gate.
2. SME initiates payment; system creates a gateway order; user completes payment; gateway webhook (signature-verified) confirms; workspace becomes "paid" and gated features unlock.
3. Merchant banker purchases/renews an annual subscription via the same gateway pattern; active subscription enables multi-workspace review.
4. Legal counsel joins via invitation with no billing interaction.

**Flow diagram (described):** Lane 1 (SME): box "Create workspace (unpaid)" → box "Initiate payment → gateway order" → box "Gateway checkout" → diamond "Webhook signature valid & paid?" — Yes → box "Workspace paid; unlock AI/export"; No → box "Order failed; retry allowed". Lane 2 (MB): same gateway pattern into box "Subscription active (annual)" → diamond "Expired?" — Yes → "Read-only listing". Lane 3 (Legal): box "Invitation accepted → free access".

### 1.4.14.6 Inputs

- Payment initiation actions; gateway callbacks/webhooks; Admin subscription actions.

### 1.4.14.7 Outputs

- Payment and subscription records; workspace payment state; feature gating signals; activity log entries.

### 1.4.14.8 Business Rules

- Legal counsel shall never be charged.
- One SME payment shall map to exactly one workspace; payments shall not be transferable between workspaces.
- No state change shall occur from an unverified gateway callback.
- In sandbox/stub mode, all state transitions shall be identical to production mode. *(Assumption: keeps the demo faithful to real behavior.)*

### 1.4.14.9 Validation Rules

- Amounts shall be positive INR values matching the configured price list.
- Webhook signatures shall verify against the gateway secret; replayed webhook events shall be idempotent.

### 1.4.14.10 Integration Points

- Payment Gateway (TBD; Razorpay recommended) — orders, checkout, webhooks; PostgreSQL — payments, subscriptions; WSP/PARSE/DRAFT/EXP — feature gating; ACT — logging; Email Service — payment receipts.

**Integration diagram (described):** Box "Billing service (Node)" with bidirectional arrows to "Payment Gateway (orders/webhooks)"; outbound to "PostgreSQL (payments, subscriptions)", "Email (receipts)", and gating arrows to "PARSE / DRAFT / EXP".

### 1.4.14.11 Postconditions

- Payment/subscription state durably recorded and enforced across gated features; complete billing audit trail exists.

---

## 1.4.15 – 1.4.20 Phase 2 Roadmap Modules (NOT built in this version)

The following modules are documented for future scope only. They are explicitly **NOT built** in this version; no functional requirements are enumerated for them.

### 1.4.15 SEBI Regulation RAG Module (Phase 2 — NOT built)

**Description:** Retrieval-augmented lookup over the SEBI ICDR corpus (SME chapters, circulars, templates) so that validation and drafting prompts cite retrieved, current regulation text rather than hardcoded snippets.
**Rationale for deferral:** Hardcoded ICDR snippet injection into prompts achieves comparable draft quality for the covered sections at a fraction of the build cost; a vector store, ingestion pipeline, and citation UI are not justified within the prototype window. The interim mechanism is explicitly identified in FR-VAL-03 and FR-DRAFT-02.

### 1.4.16 AI Consistency Engine (Phase 2 — NOT built)

**Description:** Deep cross-section and cross-document reasoning that detects narrative contradictions (not just numeric mismatches) across the full draft and source corpus.
**Rationale for deferral:** Phase 1's Validation Engine already covers mandatory-field gaps, disclosure gaps, and numeric cross-document diffs on tracked fields — the highest-value, lowest-cost subset. General contradiction detection requires substantial evaluation work to avoid noisy false positives.

### 1.4.17 Multi-language Drafting Module (Phase 2 — NOT built)

**Description:** Drafting and UI localization in additional Indian languages.
**Rationale for deferral:** DRHP submissions are English-language; multi-language value is in promoter accessibility, which is secondary to core workflow completeness for the prototype. Captured as NFR-LOC constraints.

### 1.4.18 Enterprise Security Module (Phase 2 — NOT built)

**Description:** MFA, Zero Trust network architecture, and HSM-backed key management.
**Rationale for deferral:** The Phase 1 baseline (TLS, bcrypt, JWT, RBAC, encrypted storage) is appropriate for a prototype handling demo data. Enterprise controls become mandatory before production handling of real issuer data, and are stated as roadmap in Section 1.5.4.

### 1.4.19 Version History Module (Phase 2 — NOT built)

**Description:** Full version tracking and rollback for section content and wizard data.
**Rationale for deferral:** Auto-save with a last-saved timestamp (ACT) protects in-progress work; full versioning adds storage and UI complexity without changing the demo narrative. Regeneration overwrite risk is mitigated by explicit confirmation (FR-DRAFT-05, FR-ACT-09).

### 1.4.20 Real-Time Collaborative Editing Module (Phase 2 — NOT built)

**Description:** Simultaneous multi-cursor editing of sections by multiple members.
**Rationale for deferral:** Section-level pessimistic locking with refresh-on-load (OWN) prevents collisions with zero real-time infrastructure (no WebSockets/CRDTs). Real-time co-editing is a scaling refinement, not a prototype necessity.

---
# 1.5 Non-Functional Requirements

This section specifies the non-functional requirements of the IPO Drafting Workspace across nine categories: Performance, Availability and Reliability, Scalability, Security, Usability, Maintainability, Interoperability, Compliance, and Localization/Language. Every requirement is a single measurable "shall" statement with numeric targets scaled for an SME/merchant-banker SaaS collaboration tool — deliberately not government-portal-scale figures. AI and document-processing operations are asynchronous by design; their targets are stated as job-completion times with progress indication rather than sub-second response times.

## 1.5.1 Performance Requirements

| NFR ID | Requirement Name | Description |
|---|---|---|
| NFR-PERF-01 | Page Load Time | The system shall render each of the nine core screens to interactive state within 3 seconds on a 10 Mbps connection at the 95th percentile. |
| NFR-PERF-02 | API Response Time | The system shall complete synchronous CRUD API calls within 500 ms at the 95th percentile under nominal load. |
| NFR-PERF-03 | Dashboard Aggregation | The system shall serve the dashboard (DHS plus all counts) within 2 seconds at the 95th percentile for workspaces with up to 500 documents and 10,000 activity events. |
| NFR-PERF-04 | Document Upload | The system shall accept and durably store a 25 MB document upload within 30 seconds on a 10 Mbps uplink. |
| NFR-PERF-05 | Parse/Extraction Job | The system shall complete parsing and LLM extraction of a 50-page PDF within 3 minutes at the 95th percentile, with job status visible throughout. |
| NFR-PERF-06 | Section Draft Job | The system shall complete generation of a single DRHP section within 2 minutes at the 95th percentile, with progress indication. |
| NFR-PERF-07 | Export Job | The system shall render the full draft to both .docx and PDF within 3 minutes at the 95th percentile for a 200-page draft. |
| NFR-PERF-08 | Auto-save Latency | The system shall persist a debounced auto-save write within 2 seconds of dispatch at the 95th percentile. |

## 1.5.2 Availability and Reliability Requirements

| NFR ID | Requirement Name | Description |
|---|---|---|
| NFR-AVAIL-01 | Service Uptime | The system shall achieve 99.0% monthly uptime for the web application, excluding scheduled maintenance windows announced 24 hours in advance. |
| NFR-AVAIL-02 | Graceful AI Degradation | The system shall remain fully operable for data capture, upload, review, and dashboard functions when the LLM API is unavailable, queuing or failing AI jobs with clear user messaging. |
| NFR-AVAIL-03 | Job Recovery | The system shall automatically retry failed parse/draft/export jobs once, and shall never lose or corrupt previously stored content on job failure. |
| NFR-AVAIL-04 | Backup | The system shall perform automated daily database backups with 7-day retention and documented restore procedure tested at least once. |
| NFR-AVAIL-05 | Data Durability | The system shall store uploaded documents and exports in S3 (or equivalent) with no single-server durability dependency. |
| NFR-AVAIL-06 | Recovery Objectives | The system shall meet a Recovery Point Objective of 24 hours and a Recovery Time Objective of 8 hours for full-service restoration. |

## 1.5.3 Scalability Requirements

| NFR ID | Requirement Name | Description |
|---|---|---|
| NFR-SCALE-01 | Concurrent Users | The system shall support 200 concurrent authenticated users without degradation beyond stated performance targets. |
| NFR-SCALE-02 | Workspace Volume | The system shall support 1,000 active IPO workspaces without schema or architectural change. |
| NFR-SCALE-03 | Document Volume | The system shall support 500 documents per workspace and 100 GB aggregate S3 storage without redesign. |
| NFR-SCALE-04 | AI Throughput | The system shall process at least 10 concurrent AI jobs (parse/draft) via queue-based scaling of the FastAPI service. |
| NFR-SCALE-05 | Independent Scaling | The system shall allow the AI/document service to scale horizontally independently of the application service. |
| NFR-SCALE-06 | Growth Path | The system shall scale to 1,000 concurrent users through horizontal replication and managed database scaling without application rewrite. |

## 1.5.4 Security Requirements

Baseline: standard secure web-application practice. Enterprise-grade controls (MFA, Zero Trust, HSM-backed key management) are explicitly **roadmap (Phase 2, Module 18), not current scope**.

| NFR ID | Requirement Name | Description |
|---|---|---|
| NFR-SEC-01 | Transport Encryption | The system shall encrypt all client-server and server-integration traffic using TLS 1.2 or higher. |
| NFR-SEC-02 | Credential Storage | The system shall store passwords only as bcrypt hashes with a work factor of at least 10. |
| NFR-SEC-03 | Token Security | The system shall sign JWTs with a server-held secret, enforce an 8-hour expiry, and reject tampered or expired tokens on every request. |
| NFR-SEC-04 | RBAC Enforcement | The system shall enforce role- and membership-based authorization on 100% of workspace-scoped endpoints, denying non-members with HTTP 403. |
| NFR-SEC-05 | Encryption at Rest | The system shall enable encryption at rest for the database and S3 buckets holding issuer documents and data. |
| NFR-SEC-06 | Input Hygiene | The system shall validate and sanitize all user inputs server-side, and use parameterized queries exclusively, preventing injection attacks. |
| NFR-SEC-07 | Upload Safety | The system shall verify uploaded file content signatures against declared types and reject executables and mismatched content. |
| NFR-SEC-08 | Secrets Management | The system shall hold API keys (LLM, gateway, email) in environment/secret configuration, never in source code or client-delivered assets. |
| NFR-SEC-09 | Audit Trail | The system shall retain the append-only activity log for a minimum of 12 months. |
| NFR-SEC-10 | Webhook Verification | The system shall cryptographically verify payment gateway webhook signatures before applying any billing state change. |
| NFR-SEC-11 | Roadmap Boundary | The system shall document MFA, Zero Trust, and HSM controls as Phase 2 roadmap items and shall not represent them as present capabilities. |

## 1.5.5 Usability Requirements

| NFR ID | Requirement Name | Description |
|---|---|---|
| NFR-USE-01 | First-Time Issuer Onboarding | The system shall enable a first-time SME user to create a workspace and complete wizard step 1 within 15 minutes without external training. |
| NFR-USE-02 | Guided Context | The system shall display, on every wizard step, the documents needed and an indicative time estimate before data entry begins. |
| NFR-USE-03 | AI Transparency | The system shall display confidence score and source document for 100% of AI-extracted values presented for acceptance. |
| NFR-USE-04 | Progress Feedback | The system shall show determinate or indeterminate progress indication for every operation exceeding 2 seconds. |
| NFR-USE-05 | Actionable Errors | The system shall phrase every user-facing error with the cause and the next action, never a bare code. |
| NFR-USE-06 | Accessibility Practice | The system shall follow general web accessibility best practice (keyboard navigability, form labels, ≥4.5:1 text contrast) without a formal WCAG/GIGW certification mandate. |
| NFR-USE-07 | Save Visibility | The system shall display a "Last saved" timestamp on all auto-saved surfaces, updating within 2 seconds of each successful save. |

## 1.5.6 Maintainability Requirements

| NFR ID | Requirement Name | Description |
|---|---|---|
| NFR-MAINT-01 | Prompt as Configuration | The system shall store all LLM prompt templates (extraction, validation, drafting) as versioned configuration deployable without application code release. |
| NFR-MAINT-02 | Checklist Configuration | The system shall store required-documents checklists and the field schema as Admin-editable configuration. |
| NFR-MAINT-03 | Service Separation | The system shall keep application (Node) and AI/document (FastAPI) services independently deployable with versioned internal API contracts. |
| NFR-MAINT-04 | Logging | The system shall emit structured logs for every AI call (latency, token usage, outcome) and every integration failure, sufficient to diagnose faults without code changes. |
| NFR-MAINT-05 | Migrations | The system shall apply all database schema changes through ordered, repeatable migration scripts. |
| NFR-MAINT-06 | Provider Swap | The system shall isolate the LLM provider behind a single adapter such that switching between Claude and GPT requires configuration plus at most one module change. |

## 1.5.7 Interoperability Requirements

| NFR ID | Requirement Name | Description |
|---|---|---|
| NFR-INTER-01 | API Standards | The system shall expose all client-server interfaces as REST/JSON over HTTPS. |
| NFR-INTER-02 | LLM Integration | The system shall integrate with the LLM provider via its published HTTPS API using structured (JSON-schema-constrained) outputs. |
| NFR-INTER-03 | Storage Integration | The system shall access file storage via the S3 API, remaining compatible with S3-compatible substitutes and a local development adapter. |
| NFR-INTER-04 | Payment Integration | The system shall integrate with the selected payment gateway via its REST API and signed webhooks, isolated behind a gateway adapter. |
| NFR-INTER-05 | Email Integration | The system shall send transactional email via a provider-agnostic interface supporting SMTP or HTTPS API transports. |
| NFR-INTER-06 | Export Formats | The system shall produce exports in standards-compliant .docx (Office Open XML) and PDF formats openable in Microsoft Word 2016+ and standard PDF readers. |

## 1.5.8 Compliance Requirements

| NFR ID | Requirement Name | Description |
|---|---|---|
| NFR-COMP-01 | ICDR Alignment | The system shall structure generated DRHP sections and the required-documents checklist in descriptive alignment with SEBI ICDR SME disclosure norms, as encoded in its templates and hardcoded snippets. |
| NFR-COMP-02 | Draft Status Disclosure | The system shall mark every generated document as a draft requiring intermediary review and certification, on the cover page and in a footer disclaimer, in 100% of exports. |
| NFR-COMP-03 | AI Disclosure | The system shall disclose AI assistance in document preparation within every exported artifact. |
| NFR-COMP-04 | Data Protection Practice | The system shall apply general data-protection best practice to promoter and financial data: encryption in transit and at rest, membership-scoped access, and append-only audit logging. |
| NFR-COMP-05 | Intermediary Preservation | The system shall make merchant banker and legal counsel approval structurally prerequisite to final export, preserving the intermediary role required before regulatory submission. |
| NFR-COMP-06 | No Filing Claim | The system shall not transmit any document to SEBI nor represent any output as filed or approved by SEBI. |

## 1.5.9 Localization and Language Requirements

| NFR ID | Requirement Name | Description |
|---|---|---|
| NFR-LOC-01 | English-Only Release | The system shall provide all UI text, generated drafts, and exports in English (Indian conventions) in this version. |
| NFR-LOC-02 | Roadmap Boundary | The system shall treat multi-language drafting as Phase 2 roadmap (Module 17) and shall not expose partial translations in this version. |
| NFR-LOC-03 | Locale Formats | The system shall format currency in INR with Indian digit grouping (lakh/crore where labelled) and dates as DD.MM.YYYY throughout the UI and exports. |
| NFR-LOC-04 | Encoding | The system shall store and render all text as UTF-8 end to end. |

---

*End of Software Requirement Specification — IPO Drafting Workspace v1.0, 07.07.2026.*
