-- Phase 2 / 001 — persist the collaboration entities the Phase 1 prototype
-- kept only in memory (access requests, issues, issue comments, commits).

CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE access_requests (
    id           SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES ipo_workspaces(id) ON DELETE CASCADE,
    requester_id INTEGER NOT NULL REFERENCES users(id),
    target_email VARCHAR(255) NOT NULL,
    target_role  user_role NOT NULL,
    message      TEXT,
    status       request_status NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_access_requests_target ON access_requests (target_email, status);
CREATE INDEX idx_access_requests_ws ON access_requests (workspace_id);

CREATE TABLE issues (
    id           SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES ipo_workspaces(id) ON DELETE CASCADE,
    author_id    INTEGER NOT NULL REFERENCES users(id),
    title        VARCHAR(500) NOT NULL,
    body         TEXT,
    section_key  VARCHAR(60),
    status       VARCHAR(10) NOT NULL DEFAULT 'open',   -- open | closed
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_issues_ws ON issues (workspace_id);

CREATE TABLE issue_comments (
    id         SERIAL PRIMARY KEY,
    issue_id   INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    author_id  INTEGER NOT NULL REFERENCES users(id),
    body       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_issue_comments_issue ON issue_comments (issue_id);

CREATE TABLE commits (
    id           SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES ipo_workspaces(id) ON DELETE CASCADE,
    author_id    INTEGER NOT NULL REFERENCES users(id),
    message      VARCHAR(1000) NOT NULL,
    section_key  VARCHAR(60),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_commits_ws ON commits (workspace_id);
