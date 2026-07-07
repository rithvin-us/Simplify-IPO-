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
