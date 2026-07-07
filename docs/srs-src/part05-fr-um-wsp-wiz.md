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
