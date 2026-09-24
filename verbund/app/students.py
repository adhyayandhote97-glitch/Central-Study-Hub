"""Student records: reading, saving, CSV import/export and derived status."""

import csv
import io
import json
import re
import sqlite3

from . import db
from .matching.scoring import SLOTS, Profile

LANGUAGE_LEVELS = ["home", "fluent", "learning"]
KINDS = ("language", "interest", "club", "availability")
CONSENT_VERSION = "2026-09"

NEW_STATUSES = {
    "unmatched": "Unmatched",
    "suggested": "Suggested",
    "matched": "Matched",
    "reassigned": "Manually reassigned",
}
BUDDY_STATUSES = {
    "available": "Available",
    "full": "Full",
    "not_volunteering": "Not volunteering",
}


# ---------------------------------------------------------------- reading

def load_attributes(conn: sqlite3.Connection, ids: list[int] | None = None) -> dict[int, dict]:
    sql = "SELECT student_id, kind, value, level FROM student_attributes"
    params: tuple = ()
    if ids is not None:
        if not ids:
            return {}
        sql += f" WHERE student_id IN ({','.join('?' * len(ids))})"
        params = tuple(ids)
    out: dict[int, dict] = {}
    for row in conn.execute(sql + " ORDER BY value", params):
        attrs = out.setdefault(row["student_id"], _empty_attrs())
        if row["kind"] == "language":
            attrs["languages"][row["value"]] = row["level"] or "fluent"
        else:
            attrs[_plural(row["kind"])].append(row["value"])
    return out


def _empty_attrs() -> dict:
    return {"languages": {}, "interests": [], "clubs": [], "availability": []}


def _plural(kind: str) -> str:
    return {"interest": "interests", "club": "clubs", "availability": "availability"}[kind]


def active_matches(conn: sqlite3.Connection) -> dict[int, sqlite3.Row]:
    """The current (not declined) match for each new student."""
    rows = conn.execute(
        "SELECT * FROM matches WHERE status != 'declined' ORDER BY created_at, id"
    ).fetchall()
    return {row["new_student_id"]: row for row in rows}


def places_used(conn: sqlite3.Connection, include_suggested: bool = True) -> dict[int, int]:
    statuses = "('approved','reassigned','suggested')" if include_suggested else "('approved','reassigned')"
    return {
        row["buddy_id"]: row["n"]
        for row in conn.execute(
            f"SELECT buddy_id, COUNT(*) AS n FROM matches WHERE status IN {statuses} GROUP BY buddy_id"
        )
    }


def list_students(conn: sqlite3.Connection, grade: str = "", role: str = "", status: str = "",
                  q: str = "") -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM students WHERE anonymised = 0 ORDER BY role DESC, grade, last_name, first_name"
    ).fetchall()
    attrs = load_attributes(conn)
    matches = active_matches(conn)
    used = places_used(conn)
    names = {r["id"]: f"{r['first_name']} {r['last_name']}" for r in rows}
    out = []
    for row in rows:
        s = _to_dict(row, attrs.get(row["id"], _empty_attrs()))
        _add_status(s, matches.get(row["id"]), used.get(row["id"], 0), names)
        out.append(s)

    if grade:
        out = [s for s in out if str(s["grade"]) == grade]
    if role:
        out = [s for s in out if s["role"] == role]
    if status:
        out = [s for s in out if s["status"] == status]
    if q:
        needle = q.lower()
        out = [s for s in out if needle in s["search_text"]]
    return out


def get_student(conn: sqlite3.Connection, student_id: int) -> dict | None:
    row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if row is None:
        return None
    s = _to_dict(row, load_attributes(conn, [student_id]).get(student_id, _empty_attrs()))
    names = {r["id"]: f"{r['first_name']} {r['last_name']}" for r in conn.execute(
        "SELECT id, first_name, last_name FROM students")}
    _add_status(s, active_matches(conn).get(student_id), places_used(conn).get(student_id, 0), names)
    return s


_SLOT_INDEX = {slot: i for i, slot in enumerate(SLOTS)}


def _to_dict(row: sqlite3.Row, attrs: dict) -> dict:
    s = dict(row)
    s.update(attrs)
    s["availability"] = sorted(attrs["availability"], key=lambda slot: _SLOT_INDEX.get(slot, len(SLOTS)))
    level_order = {level: i for i, level in enumerate(LANGUAGE_LEVELS)}
    s["languages"] = dict(sorted(attrs["languages"].items(), key=lambda kv: (level_order.get(kv[1], 9), kv[0])))
    s["name"] = f"{row['first_name']} {row['last_name']}"
    s["language_text"] = format_languages(attrs["languages"])
    s["search_text"] = " ".join([
        s["name"], row["homeroom"], s["language_text"], " ".join(attrs["clubs"]),
        " ".join(attrs["interests"]),
    ]).lower()
    return s


def _add_status(s: dict, match: sqlite3.Row | None, used: int, names: dict[int, str]) -> None:
    s["match_id"] = None
    s["partner"] = None
    if s["role"] == "new":
        if match is None:
            s["status"] = "unmatched"
        else:
            s["status"] = {"suggested": "suggested", "approved": "matched",
                           "reassigned": "reassigned"}[match["status"]]
            s["match_id"] = match["id"]
            s["partner"] = names.get(match["buddy_id"])
        s["status_label"] = NEW_STATUSES[s["status"]]
    else:
        s["places_used"] = used
        if not s["willing"]:
            s["status"] = "not_volunteering"
        elif used >= s["capacity"]:
            s["status"] = "full"
        else:
            s["status"] = "available"
        s["status_label"] = BUDDY_STATUSES[s["status"]]


def to_profile(row: sqlite3.Row | dict, attrs: dict) -> Profile:
    return Profile(
        id=row["id"],
        first_name=row["first_name"],
        last_name=row["last_name"],
        grade=row["grade"],
        homeroom=row["homeroom"] or "",
        languages=dict(attrs["languages"]),
        interests=set(attrs["interests"]),
        clubs=set(attrs["clubs"]),
        availability=set(attrs["availability"]),
        been_new_before=bool(row["been_new_before"]),
        willing=bool(row["willing"]),
        capacity=int(row["capacity"]),
        consented=bool(row["consent_at"]),
    )


def profiles(conn: sqlite3.Connection, role: str) -> list[Profile]:
    rows = conn.execute(
        "SELECT * FROM students WHERE role = ? AND anonymised = 0 ORDER BY id", (role,)
    ).fetchall()
    attrs = load_attributes(conn, [r["id"] for r in rows])
    return [to_profile(r, attrs.get(r["id"], _empty_attrs())) for r in rows]


def profile(conn: sqlite3.Connection, student_id: int) -> Profile | None:
    row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if row is None:
        return None
    return to_profile(row, load_attributes(conn, [student_id]).get(student_id, _empty_attrs()))


# ---------------------------------------------------------------- writing

def save_student(conn: sqlite3.Connection, data: dict, student_id: int | None = None) -> int:
    """Create or update the school-held fields of a student."""
    fields = {
        "first_name": data["first_name"].strip(),
        "last_name": data["last_name"].strip(),
        "grade": int(data["grade"]),
        "homeroom": (data.get("homeroom") or "").strip().upper(),
        "role": data["role"],
        "capacity": max(1, min(3, int(data.get("capacity") or 1))),
    }
    stamp = db.now()
    if student_id is None:
        cur = conn.execute(
            """INSERT INTO students (first_name, last_name, grade, homeroom, role, capacity,
                   been_new_before, willing, arrival_date, source, created_at, updated_at)
               VALUES (:first_name, :last_name, :grade, :homeroom, :role, :capacity,
                   :been_new_before, :willing, :arrival_date, :source, :stamp, :stamp)""",
            {**fields, "been_new_before": int(bool(data.get("been_new_before"))),
             "willing": int(data.get("willing", True) not in (False, "0", 0)),
             "arrival_date": data.get("arrival_date") or None,
             "source": data.get("source", "school"), "stamp": stamp},
        )
        student_id = cur.lastrowid
    else:
        conn.execute(
            """UPDATE students SET first_name = :first_name, last_name = :last_name, grade = :grade,
                   homeroom = :homeroom, role = :role, capacity = :capacity, updated_at = :stamp
               WHERE id = :id""",
            {**fields, "stamp": stamp, "id": student_id},
        )
    if "languages" in data:
        set_languages(conn, student_id, data["languages"])
    if "clubs" in data:
        set_values(conn, student_id, "club", data["clubs"])
    return student_id


def set_languages(conn: sqlite3.Connection, student_id: int, languages: dict[str, str]) -> None:
    conn.execute("DELETE FROM student_attributes WHERE student_id = ? AND kind = 'language'", (student_id,))
    conn.executemany(
        "INSERT OR REPLACE INTO student_attributes (student_id, kind, value, level) VALUES (?, 'language', ?, ?)",
        [(student_id, tidy(lang), level if level in LANGUAGE_LEVELS else "fluent")
         for lang, level in languages.items() if tidy(lang)],
    )


def set_values(conn: sqlite3.Connection, student_id: int, kind: str, values: list[str]) -> None:
    conn.execute("DELETE FROM student_attributes WHERE student_id = ? AND kind = ?", (student_id, kind))
    clean = {tidy(v) if kind != "availability" else v for v in values}
    if kind == "availability":
        clean &= set(SLOTS)
    conn.executemany(
        "INSERT OR IGNORE INTO student_attributes (student_id, kind, value) VALUES (?, ?, ?)",
        [(student_id, kind, v) for v in sorted(clean) if v],
    )


def save_questionnaire(conn: sqlite3.Connection, student_id: int, answers: dict) -> None:
    stamp = db.now()
    conn.execute(
        """UPDATE students SET consent_at = ?, consent_version = ?, intake_completed_at = ?,
               been_new_before = ?, willing = ?, capacity = ?, updated_at = ?
           WHERE id = ?""",
        (stamp, CONSENT_VERSION, stamp, int(answers["been_new_before"]), int(answers["willing"]),
         max(1, min(3, int(answers.get("capacity") or 1))), stamp, student_id),
    )
    set_languages(conn, student_id, answers["languages"])
    set_values(conn, student_id, "interest", answers["interests"])
    set_values(conn, student_id, "availability", answers["availability"])


def delete_student(conn: sqlite3.Connection, student_id: int) -> None:
    conn.execute("DELETE FROM students WHERE id = ?", (student_id,))


def tidy(value: str) -> str:
    """'  robotics  club ' -> 'Robotics Club' so the same thing always matches."""
    value = re.sub(r"\s+", " ", value or "").strip()
    return " ".join(w if w.isupper() else w[:1].upper() + w[1:] for w in value.split(" "))


# ---------------------------------------------------------------- text formats

def parse_languages(text: str) -> dict[str, str]:
    """'Korean (home); English (fluent)' -> {'Korean': 'home', 'English': 'fluent'}."""
    out: dict[str, str] = {}
    for part in re.split(r"[;,]", text or ""):
        part = part.strip()
        if not part:
            continue
        m = re.match(r"^(.*?)\s*\((\w+)\)\s*$", part)
        name, level = (m.group(1), m.group(2).lower()) if m else (part, "fluent")
        if tidy(name):
            out[tidy(name)] = level if level in LANGUAGE_LEVELS else "fluent"
    return out


def format_languages(languages: dict[str, str]) -> str:
    order = {level: i for i, level in enumerate(LANGUAGE_LEVELS)}
    items = sorted(languages.items(), key=lambda kv: (order.get(kv[1], 9), kv[0]))
    return "; ".join(f"{lang} ({level})" for lang, level in items)


def split_list(text: str) -> list[str]:
    return [tidy(p) for p in re.split(r"[;,]", text or "") if tidy(p)]


IMPORT_COLUMNS = ["first_name", "last_name", "grade", "homeroom", "role", "languages", "clubs",
                  "capacity"]


def parse_import(text: str) -> tuple[list[dict], list[str]]:
    """Read a CSV of data the school already holds. Returns (rows, errors)."""
    rows, errors = [], []
    reader = csv.DictReader(io.StringIO(text.lstrip("﻿")))
    if reader.fieldnames is None:
        return [], ["The file is empty."]
    headers = {h.strip().lower() for h in reader.fieldnames if h}
    missing = [c for c in ("first_name", "last_name", "grade", "role") if c not in headers]
    if missing:
        return [], [f"Missing column{'s' if len(missing) > 1 else ''}: {', '.join(missing)}."]
    for line, raw in enumerate(reader, start=2):
        row = {(k or "").strip().lower(): (v or "").strip() for k, v in raw.items()}
        if not any(row.values()):
            continue
        problems = []
        if not row.get("first_name") or not row.get("last_name"):
            problems.append("name missing")
        if not row.get("grade", "").isdigit():
            problems.append("grade must be a number")
        role = row.get("role", "").lower()
        if role not in ("new", "buddy"):
            problems.append("role must be 'new' or 'buddy'")
        if problems:
            errors.append(f"Row {line}: {', '.join(problems)}.")
            continue
        rows.append({
            "first_name": tidy(row["first_name"]),
            "last_name": tidy(row["last_name"]),
            "grade": int(row["grade"]),
            "homeroom": row.get("homeroom", ""),
            "role": role,
            "languages": parse_languages(row.get("languages", "")),
            "clubs": split_list(row.get("clubs", "")),
            "capacity": int(row["capacity"]) if row.get("capacity", "").isdigit() else 1,
        })
    return rows, errors


def csv_safe(value) -> str:
    """Stop spreadsheet formula injection: cells starting with = + - @ are prefixed."""
    text = "" if value is None else str(value)
    if text and text[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + text
    return text


def to_csv(headers: list[str], rows: list[list]) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    for row in rows:
        writer.writerow([csv_safe(v) for v in row])
    return buf.getvalue()


def student_record(conn: sqlite3.Connection, student_id: int) -> dict | None:
    """Everything Verbund holds about one student (for a data access request)."""
    s = get_student(conn, student_id)
    if s is None:
        return None
    for key in ("search_text", "language_text"):
        s.pop(key, None)
    s["matches"] = [
        {**dict(m), "breakdown": json.loads(m["breakdown"])}
        for m in conn.execute(
            "SELECT * FROM matches WHERE new_student_id = ? OR buddy_id = ? ORDER BY id",
            (student_id, student_id),
        )
    ]
    s["feedback"] = [
        dict(f) for f in conn.execute(
            """SELECT f.* FROM feedback f JOIN matches m ON m.id = f.match_id
               WHERE (m.new_student_id = ? AND f.respondent = 'new')
                  OR (m.buddy_id = ? AND f.respondent = 'buddy')""",
            (student_id, student_id),
        )
    ]
    return s
