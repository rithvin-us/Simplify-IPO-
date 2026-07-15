-- Phase 2 / 002 — Module 19: version history for DRHP sections.
-- Every meaningful mutation (AI generation, manual save, rollback, finalisation)
-- appends an immutable snapshot here instead of only mutating sections.content.

CREATE TABLE section_versions (
    id          SERIAL PRIMARY KEY,
    section_id  INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    version_no  INTEGER NOT NULL,
    content     TEXT,
    status      section_status,
    edited_by   INTEGER REFERENCES users(id),
    change_note VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (section_id, version_no)
);
CREATE INDEX idx_section_versions_section ON section_versions (section_id, version_no DESC);
