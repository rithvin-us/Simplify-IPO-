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
