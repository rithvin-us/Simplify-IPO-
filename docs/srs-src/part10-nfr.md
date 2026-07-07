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
