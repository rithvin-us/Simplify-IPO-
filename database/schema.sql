-- IPO Drafting Workspace — PostgreSQL schema
-- Core data model backing the Phase 1 prototype.

CREATE TYPE user_role AS ENUM ('sme', 'merchant_banker', 'legal_counsel', 'admin');
CREATE TYPE section_status AS ENUM ('empty', 'ai_generated', 'sme_verified', 'mb_reviewed', 'legal_reviewed', 'final');
CREATE TYPE document_category AS ENUM ('corporate', 'financial', 'legal', 'compliance', 'supporting');
CREATE TYPE flag_type AS ENUM ('missing', 'inconsistent', 'disclosure_gap');
CREATE TYPE review_action AS ENUM ('comment', 'change_request', 'approve', 'reject');

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          user_role NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ipo_workspaces (
    id            SERIAL PRIMARY KEY,
    company_name  VARCHAR(255) NOT NULL,
    cin           VARCHAR(21),
    created_by    INTEGER NOT NULL REFERENCES users(id),
    payment_state VARCHAR(30) NOT NULL DEFAULT 'unpaid',  -- unpaid | paid
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspace_members (
    workspace_id INTEGER NOT NULL REFERENCES ipo_workspaces(id) ON DELETE CASCADE,
    user_id      INTEGER NOT NULL REFERENCES users(id),
    member_role  user_role NOT NULL,
    invited_by   INTEGER REFERENCES users(id),
    joined_at    TIMESTAMPTZ,
    PRIMARY KEY (workspace_id, user_id)
);

-- DRHP sections: Company Overview, Business, Financial Summary, Risk Factors, Objects of Issue, ...
CREATE TABLE sections (
    id            SERIAL PRIMARY KEY,
    workspace_id  INTEGER NOT NULL REFERENCES ipo_workspaces(id) ON DELETE CASCADE,
    section_key   VARCHAR(60) NOT NULL,          -- e.g. 'company_overview'
    title         VARCHAR(255) NOT NULL,
    content       TEXT,
    status        section_status NOT NULL DEFAULT 'empty',
    owner_role    user_role,
    locked_by     INTEGER REFERENCES users(id),  -- NULL = unlocked
    locked_at     TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, section_key)
);

CREATE TABLE documents (
    id            SERIAL PRIMARY KEY,
    workspace_id  INTEGER NOT NULL REFERENCES ipo_workspaces(id) ON DELETE CASCADE,
    wizard_step   VARCHAR(30),                   -- company | promoters | financials | legal | risk
    category      document_category NOT NULL,
    filename      VARCHAR(500) NOT NULL,
    storage_key   VARCHAR(1000) NOT NULL,        -- S3 key or local path
    mime_type     VARCHAR(100),
    uploaded_by   INTEGER NOT NULL REFERENCES users(id),
    parse_status  VARCHAR(30) NOT NULL DEFAULT 'pending',  -- pending | parsing | parsed | failed
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per field the parser extracted from an uploaded document.
CREATE TABLE extracted_fields (
    id                 SERIAL PRIMARY KEY,
    workspace_id       INTEGER NOT NULL REFERENCES ipo_workspaces(id) ON DELETE CASCADE,
    field_key          VARCHAR(120) NOT NULL,    -- e.g. 'financials.revenue_fy25'
    value              TEXT,
    confidence         NUMERIC(4,3),             -- 0.000 - 1.000 from LLM
    source_document_id INTEGER REFERENCES documents(id),
    accepted           BOOLEAN NOT NULL DEFAULT false,  -- SME confirmed into form
    extracted_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Canonical structured IPO data (wizard fields, post-acceptance).
CREATE TABLE ipo_data (
    workspace_id INTEGER NOT NULL REFERENCES ipo_workspaces(id) ON DELETE CASCADE,
    field_key    VARCHAR(120) NOT NULL,
    value        TEXT,
    updated_by   INTEGER REFERENCES users(id),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (workspace_id, field_key)
);

CREATE TABLE validation_flags (
    id            SERIAL PRIMARY KEY,
    workspace_id  INTEGER NOT NULL REFERENCES ipo_workspaces(id) ON DELETE CASCADE,
    field_key     VARCHAR(120),
    section_key   VARCHAR(60),
    issue_type    flag_type NOT NULL,
    reason        TEXT NOT NULL,
    source_values JSONB,                         -- for cross-document diffs: [{doc_id, value}, ...]
    resolved      BOOLEAN NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE review_comments (
    id           SERIAL PRIMARY KEY,
    section_id   INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    author_id    INTEGER NOT NULL REFERENCES users(id),
    action       review_action NOT NULL,
    body         TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_log (
    id           SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES ipo_workspaces(id) ON DELETE CASCADE,
    actor_id     INTEGER REFERENCES users(id),
    event_type   VARCHAR(60) NOT NULL,           -- upload | extract | generate | comment | approve | export | ...
    detail       JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id),  -- merchant banker
    plan        VARCHAR(30) NOT NULL DEFAULT 'annual',
    status      VARCHAR(30) NOT NULL DEFAULT 'active',
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ
);

CREATE TABLE payments (
    id           SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES ipo_workspaces(id),  -- SME per-project payment
    user_id      INTEGER NOT NULL REFERENCES users(id),
    amount       NUMERIC(12,2) NOT NULL,
    currency     VARCHAR(3) NOT NULL DEFAULT 'INR',
    gateway_ref  VARCHAR(255),
    status       VARCHAR(30) NOT NULL DEFAULT 'created', -- created | paid | failed
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Draft Health Score is computed, not stored:
-- % sections past 'ai_generated' + % validation flags resolved + % required docs uploaded.
CREATE VIEW workspace_progress AS
SELECT
    w.id AS workspace_id,
    COUNT(s.id) FILTER (WHERE s.status NOT IN ('empty', 'ai_generated'))::float
        / NULLIF(COUNT(s.id), 0) AS section_progress,
    COUNT(v.id) FILTER (WHERE v.resolved)::float
        / NULLIF(COUNT(v.id), 0) AS validation_progress
FROM ipo_workspaces w
LEFT JOIN sections s ON s.workspace_id = w.id
LEFT JOIN validation_flags v ON v.workspace_id = w.id
GROUP BY w.id;
