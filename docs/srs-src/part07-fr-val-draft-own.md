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
