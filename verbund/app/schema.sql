-- Verbund database schema (SQLite).
-- Deliberately collects no nationality, gender, religion or ethnicity
-- (data minimisation; see docs/DESIGN_SYSTEM.md and the DPDP research).

CREATE TABLE IF NOT EXISTS students (
    id                  INTEGER PRIMARY KEY,
    first_name          TEXT    NOT NULL,
    last_name           TEXT    NOT NULL,
    grade               INTEGER NOT NULL,
    homeroom            TEXT    NOT NULL DEFAULT '',
    role                TEXT    NOT NULL CHECK (role IN ('new', 'buddy')),
    arrival_date        TEXT,
    been_new_before     INTEGER NOT NULL DEFAULT 0,
    willing             INTEGER NOT NULL DEFAULT 1,   -- buddies: volunteered to be a buddy
    capacity            INTEGER NOT NULL DEFAULT 1,   -- buddies: how many new students they can take
    consent_at          TEXT,
    consent_version     TEXT,
    intake_completed_at TEXT,
    anonymised          INTEGER NOT NULL DEFAULT 0,
    source              TEXT    NOT NULL DEFAULT 'school',
    created_at          TEXT    NOT NULL,
    updated_at          TEXT    NOT NULL
);

-- One row per language / interest / club / free time slot.
CREATE TABLE IF NOT EXISTS student_attributes (
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    kind       TEXT    NOT NULL CHECK (kind IN ('language', 'interest', 'club', 'availability')),
    value      TEXT    NOT NULL,
    level      TEXT,                                  -- languages only: home | fluent | learning
    PRIMARY KEY (student_id, kind, value)
);

CREATE TABLE IF NOT EXISTS weights (
    version    INTEGER PRIMARY KEY,
    data       TEXT    NOT NULL,                      -- JSON {factor_key: points}
    created_at TEXT    NOT NULL,
    active     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS matching_runs (
    id              INTEGER PRIMARY KEY,
    ran_at          TEXT    NOT NULL,
    weights_version INTEGER NOT NULL,
    new_count       INTEGER NOT NULL,
    suggested_count INTEGER NOT NULL,
    flagged_count   INTEGER NOT NULL,
    duration_ms     REAL    NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
    id                 INTEGER PRIMARY KEY,
    run_id             INTEGER REFERENCES matching_runs(id) ON DELETE SET NULL,
    new_student_id     INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    buddy_id           INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    score              INTEGER NOT NULL,
    breakdown          TEXT    NOT NULL,              -- JSON list of factor results
    weights_version    INTEGER NOT NULL,
    status             TEXT    NOT NULL CHECK (status IN ('suggested', 'approved', 'declined', 'reassigned')),
    explanation        TEXT,
    explanation_status TEXT    NOT NULL DEFAULT 'template'
                               CHECK (explanation_status IN ('template', 'queued', 'ollama')),
    excluded           TEXT,                          -- JSON {reason: count}
    override_reason    TEXT,
    override_note      TEXT,
    replaced_by        INTEGER REFERENCES matches(id) ON DELETE SET NULL,
    created_at         TEXT    NOT NULL,
    decided_at         TEXT,
    updated_at         TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_matches_new ON matches(new_student_id);
CREATE INDEX IF NOT EXISTS idx_matches_buddy ON matches(buddy_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

CREATE TABLE IF NOT EXISTS feedback (
    id           INTEGER PRIMARY KEY,
    match_id     INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    respondent   TEXT    NOT NULL CHECK (respondent IN ('new', 'buddy')),
    frequency    TEXT    NOT NULL CHECK (frequency IN ('never', 'once', 'weekly', 'more')),
    rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    submitted_at TEXT    NOT NULL,
    UNIQUE (match_id, respondent)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id        INTEGER PRIMARY KEY,
    at        TEXT NOT NULL,
    action    TEXT NOT NULL,
    entity    TEXT,
    entity_id INTEGER,
    detail    TEXT
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
