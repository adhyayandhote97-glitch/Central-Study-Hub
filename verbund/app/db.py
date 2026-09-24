"""SQLite access: one short-lived connection per request or task."""

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from . import config

_db_path: Path = config.DATABASE_PATH

DEFAULT_SETTINGS = {
    "school_language": "English",
    "retention_days": "365",
    "interest_options": json.dumps([
        "Football", "Basketball", "Badminton", "Cricket", "Swimming", "Dance",
        "Chess", "Coding", "Robotics", "Science", "Reading", "Writing",
        "Drawing", "Photography", "Film", "Music", "Theatre", "Debate",
        "Gaming", "Cooking",
    ]),
}


def configure(path: Path | str) -> None:
    """Point the app at a different database file (used by tests and scripts)."""
    global _db_path
    _db_path = Path(path)


def db_path() -> Path:
    return _db_path


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def connect() -> sqlite3.Connection:
    _db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(_db_path, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


@contextmanager
def session():
    """Open a connection, commit on success, roll back on error, always close."""
    conn = connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    schema = (config.APP_DIR / "schema.sql").read_text()
    with session() as conn:
        conn.executescript(schema)
        for key, value in DEFAULT_SETTINGS.items():
            conn.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (key, value))
        if conn.execute("SELECT COUNT(*) FROM weights").fetchone()[0] == 0:
            from .matching.scoring import DEFAULT_WEIGHTS
            conn.execute(
                "INSERT INTO weights (version, data, created_at, active) VALUES (1, ?, ?, 1)",
                (json.dumps(DEFAULT_WEIGHTS), now()),
            )


def get_setting(conn: sqlite3.Connection, key: str) -> str:
    row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else DEFAULT_SETTINGS[key]


def set_setting(conn: sqlite3.Connection, key: str, value: str) -> None:
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, value),
    )


def audit(conn: sqlite3.Connection, action: str, entity: str | None = None,
          entity_id: int | None = None, detail: str | None = None) -> None:
    """Record what happened. With no sign-in, the actor is recorded as 'Staff'."""
    conn.execute(
        "INSERT INTO audit_log (at, action, entity, entity_id, detail) VALUES (?, ?, ?, ?, ?)",
        (now(), action, entity, entity_id, detail),
    )
