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
