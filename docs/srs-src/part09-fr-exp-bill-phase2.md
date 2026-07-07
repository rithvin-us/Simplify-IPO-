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
