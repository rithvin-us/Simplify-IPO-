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
