"""Matching runs, suggestions, teacher decisions, check-ins and dashboard numbers."""

import json
import sqlite3
import time
from datetime import datetime, timedelta, timezone

from . import db
from . import students as st
from .explain.template import slot_words, template_explanation
from .matching.assign import assign, rank_candidates
from .matching.insights import MIN_RESPONSES, factor_insights
from .matching.scoring import GOOD, SLOTS, band, score_pair

OVERRIDE_REASONS = [
    "Knows the students personally",
    "Timetable clash",
    "Buddy asked for a change",
    "Pastoral or wellbeing reason",
    "Better language support",
    "Other",
]
FREQUENCIES = {"never": "Not yet", "once": "Once", "weekly": "About once a week", "more": "More than once a week"}


# ---------------------------------------------------------------- weights & settings

def active_weights(conn: sqlite3.Connection) -> tuple[int, dict[str, float]]:
    row = conn.execute("SELECT version, data FROM weights WHERE active = 1 ORDER BY version DESC").fetchone()
    return row["version"], json.loads(row["data"])


def save_weights(conn: sqlite3.Connection, weights: dict[str, int]) -> int:
    version = conn.execute("SELECT COALESCE(MAX(version), 0) + 1 FROM weights").fetchone()[0]
    conn.execute("UPDATE weights SET active = 0")
    conn.execute("INSERT INTO weights (version, data, created_at, active) VALUES (?, ?, ?, 1)",
                 (version, json.dumps(weights), db.now()))
    return version


def school_language(conn: sqlite3.Connection) -> str:
    return db.get_setting(conn, "school_language")


# ---------------------------------------------------------------- running the algorithm

def run_matching(conn: sqlite3.Connection) -> dict:
    """Replace open suggestions with a fresh set for every new student without a confirmed buddy."""
    started = time.perf_counter()
    version, weights = active_weights(conn)
    language = school_language(conn)

    conn.execute("DELETE FROM matches WHERE status = 'suggested'")
    confirmed = {r["new_student_id"] for r in conn.execute(
        "SELECT new_student_id FROM matches WHERE status IN ('approved','reassigned')")}
    waiting = [p for p in st.profiles(conn, "new") if p.id not in confirmed]
    buddies = st.profiles(conn, "buddy")
    used = st.places_used(conn, include_suggested=False)
    declined = {(r["new_student_id"], r["buddy_id"]) for r in conn.execute(
        "SELECT new_student_id, buddy_id FROM matches WHERE status = 'declined'")}

    suggestions = assign(waiting, buddies, weights, language, used, declined)
    names = {p.id: p.first_name for p in waiting + buddies}
    stamp = db.now()
    duration_ms = (time.perf_counter() - started) * 1000
    flagged = sum(1 for s in suggestions if s.buddy_id is None or s.score < GOOD)
    run_id = conn.execute(
        """INSERT INTO matching_runs (ran_at, weights_version, new_count, suggested_count, flagged_count, duration_ms)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (stamp, version, len(waiting), sum(1 for s in suggestions if s.buddy_id), flagged, duration_ms),
    ).lastrowid

    new_ids = []
    for s in suggestions:
        if s.buddy_id is None:
            continue
        factors = [f.to_dict() for f in s.factors]
        text = template_explanation(names[s.new_id], names[s.buddy_id], s.score, factors)
        new_ids.append(conn.execute(
            """INSERT INTO matches (run_id, new_student_id, buddy_id, score, breakdown, weights_version,
                   status, explanation, explanation_status, excluded, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, 'suggested', ?, 'template', ?, ?, ?)""",
            (run_id, s.new_id, s.buddy_id, s.score, json.dumps(factors), version, text,
             json.dumps(s.excluded), stamp, stamp),
        ).lastrowid)
    db.audit(conn, "Ran matching", "run", run_id,
             f"{len(new_ids)} suggestions for {len(waiting)} new students, weights v{version}")
    return {"run_id": run_id, "match_ids": new_ids, "waiting": len(waiting),
            "suggested": len(new_ids), "flagged": flagged, "duration_ms": duration_ms}


def unplaced(conn: sqlite3.Connection) -> list[dict]:
    """New students with no current match, and why no buddy was found."""
    active = st.active_matches(conn)
    waiting = [p for p in st.profiles(conn, "new") if p.id not in active]
    if not waiting:
        return []
    _, weights = active_weights(conn)
    language = school_language(conn)
    buddies = st.profiles(conn, "buddy")
    used = st.places_used(conn)
    declined = {(r["new_student_id"], r["buddy_id"]) for r in conn.execute(
        "SELECT new_student_id, buddy_id FROM matches WHERE status = 'declined'")}
    out = []
    for p in waiting:
        candidates, excluded = rank_candidates(p, buddies, weights, language, declined)
        full = sum(1 for c in candidates if used.get(c.buddy.id, 0) >= c.buddy.capacity)
        if full:
            excluded["already has a new student"] += full
        out.append({"id": p.id, "name": p.name, "grade": p.grade, "excluded": dict(excluded),
                    "open": len(candidates) - full})
    return out


# ---------------------------------------------------------------- reading matches

MATCH_SQL = """
SELECT m.*, n.first_name AS new_first, n.last_name AS new_last, n.grade AS new_grade,
       n.homeroom AS new_homeroom, b.first_name AS buddy_first, b.last_name AS buddy_last,
       b.grade AS buddy_grade, b.homeroom AS buddy_homeroom
FROM matches m
JOIN students n ON n.id = m.new_student_id
JOIN students b ON b.id = m.buddy_id
"""


def _decorate(row: sqlite3.Row) -> dict:
    m = dict(row)
    m["factors"] = json.loads(m["breakdown"])
    m["excluded"] = json.loads(m["excluded"] or "{}")
    m["band"] = band(m["score"])
    m["new_name"] = f"{m['new_first']} {m['new_last']}"
    m["buddy_name"] = f"{m['buddy_first']} {m['buddy_last']}"
    top = sorted((f for f in m["factors"] if f["points"] > 0), key=lambda f: -f["points"])
    m["headline"] = "; ".join(f["note"] for f in top[:2]) or "Little in common on any factor"
    return m


def list_matches(conn: sqlite3.Connection, status: str = "", grade: str = "", band_filter: str = "",
                 sort: str = "score") -> list[dict]:
    rows = [_decorate(r) for r in conn.execute(MATCH_SQL + " WHERE m.status != 'declined'")]
    if status:
        rows = [m for m in rows if m["status"] == status]
    if grade:
        rows = [m for m in rows if str(m["new_grade"]) == grade]
    if band_filter:
        rows = [m for m in rows if m["band"] == band_filter]
    if sort == "name":
        rows.sort(key=lambda m: (m["new_last"], m["new_first"]))
    elif sort == "low":
        rows.sort(key=lambda m: (m["score"], m["new_last"]))
    else:
        rows.sort(key=lambda m: (-m["score"], m["new_last"]))
    return rows


def get_match(conn: sqlite3.Connection, match_id: int) -> dict | None:
    row = conn.execute(MATCH_SQL + " WHERE m.id = ?", (match_id,)).fetchone()
    return _decorate(row) if row else None


def review_queue(conn: sqlite3.Connection) -> list[int]:
    """Suggestions waiting for a decision, lowest score first (they need the most care)."""
    return [r["id"] for r in conn.execute(
        "SELECT id FROM matches WHERE status = 'suggested' ORDER BY score, id")]


def alternatives(conn: sqlite3.Connection, match: dict, limit: int = 5) -> list[dict]:
    """Other buddies with room for this new student, best first."""
    new = st.profile(conn, match["new_student_id"])
    _, weights = active_weights(conn)
    declined = {(r["new_student_id"], r["buddy_id"]) for r in conn.execute(
        "SELECT new_student_id, buddy_id FROM matches WHERE status = 'declined'")}
    used = st.places_used(conn)
    used[match["buddy_id"]] = used.get(match["buddy_id"], 1) - 1  # this match's place is freed on change
    candidates, _ = rank_candidates(new, st.profiles(conn, "buddy"), weights, school_language(conn), declined)
    out = []
    for c in candidates:
        if c.buddy.id == match["buddy_id"] or used.get(c.buddy.id, 0) >= c.buddy.capacity:
            continue
        top = sorted((f for f in c.factors if f.points > 0), key=lambda f: -f.points)
        out.append({"id": c.buddy.id, "name": c.buddy.name, "grade": c.buddy.grade, "score": c.score,
                    "band": band(c.score), "headline": "; ".join(f.note for f in top[:2]),
                    "factors": [f.to_dict() for f in c.factors]})
        if len(out) == limit:
            break
    return out


# ---------------------------------------------------------------- teacher decisions

def approve(conn: sqlite3.Connection, match_ids: list[int]) -> int:
    stamp = db.now()
    count = 0
    for mid in match_ids:
        cur = conn.execute(
            "UPDATE matches SET status = 'approved', decided_at = ?, updated_at = ? "
            "WHERE id = ? AND status = 'suggested'",
            (stamp, stamp, mid),
        )
        if cur.rowcount:
            count += 1
            db.audit(conn, "Approved pairing", "match", mid)
    return count


def decline(conn: sqlite3.Connection, match_id: int, reason: str = "", note: str = "") -> None:
    stamp = db.now()
    conn.execute(
        "UPDATE matches SET status = 'declined', override_reason = ?, override_note = ?, decided_at = ?, "
        "updated_at = ? WHERE id = ?",
        (reason or None, note or None, stamp, stamp, match_id),
    )
    db.audit(conn, "Declined pairing", "match", match_id, reason or None)


def reassign(conn: sqlite3.Connection, match_id: int, buddy_id: int, reason: str, note: str = "") -> int:
    """Teacher override: replace the buddy, keep a record of why."""
    old = get_match(conn, match_id)
    new = st.profile(conn, old["new_student_id"])
    buddy = st.profile(conn, buddy_id)
    version, weights = active_weights(conn)
    score, factors = score_pair(new, buddy, weights, school_language(conn))
    factors = [f.to_dict() for f in factors]
    stamp = db.now()
    new_id = conn.execute(
        """INSERT INTO matches (run_id, new_student_id, buddy_id, score, breakdown, weights_version, status,
               explanation, explanation_status, excluded, override_reason, override_note,
               created_at, decided_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'reassigned', ?, 'template', '{}', ?, ?, ?, ?, ?)""",
        (old["run_id"], new.id, buddy.id, score, json.dumps(factors), version,
         template_explanation(new.first_name, buddy.first_name, score, factors),
         reason, note or None, stamp, stamp, stamp),
    ).lastrowid
    conn.execute(
        "UPDATE matches SET status = 'declined', override_reason = ?, override_note = ?, replaced_by = ?, "
        "decided_at = ?, updated_at = ? WHERE id = ?",
        (reason, note or None, new_id, stamp, stamp, match_id),
    )
    db.audit(conn, "Chose a different buddy", "match", new_id,
             f"{old['buddy_name']} -> {buddy.name}. Reason: {reason}" + (f" ({note})" if note else ""))
    return new_id


# ---------------------------------------------------------------- check-ins

def save_feedback(conn: sqlite3.Connection, match_id: int, respondent: str, frequency: str,
                  rating: int, comment: str) -> None:
    conn.execute(
        """INSERT INTO feedback (match_id, respondent, frequency, rating, comment, submitted_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(match_id, respondent) DO UPDATE SET frequency = excluded.frequency,
               rating = excluded.rating, comment = excluded.comment, submitted_at = excluded.submitted_at""",
        (match_id, respondent, frequency, rating, comment.strip() or None, db.now()),
    )
    db.audit(conn, "Check-in received", "match", match_id, respondent)


def feedback_for(conn: sqlite3.Connection, match_id: int) -> list[dict]:
    return [dict(r) for r in conn.execute(
        "SELECT * FROM feedback WHERE match_id = ? ORDER BY respondent DESC", (match_id,))]


def insights(conn: sqlite3.Connection) -> dict:
    rows = conn.execute(
        """SELECT m.breakdown, AVG(f.rating) AS rating, COUNT(f.id) AS responses
           FROM matches m JOIN feedback f ON f.match_id = m.id
           WHERE m.status IN ('approved', 'reassigned')
           GROUP BY m.id"""
    ).fetchall()
    responses = sum(r["responses"] for r in rows)
    pairs = [(json.loads(r["breakdown"]), r["rating"]) for r in rows]
    return {
        "responses": responses,
        "pairs": len(pairs),
        "needed": MIN_RESPONSES,
        "ready": responses >= MIN_RESPONSES,
        "rows": factor_insights(pairs) if responses >= MIN_RESPONSES else [],
        "average": round(sum(r for _, r in pairs) / len(pairs), 1) if pairs else None,
    }


# ---------------------------------------------------------------- dashboard numbers

def last_run(conn: sqlite3.Connection) -> dict | None:
    row = conn.execute("SELECT * FROM matching_runs ORDER BY id DESC LIMIT 1").fetchone()
    return dict(row) if row else None


def freshness(conn: sqlite3.Connection) -> dict:
    """For the 'last updated' indicator: when matching last ran, and what changed since."""
    run = last_run(conn)
    synced = conn.execute("SELECT MAX(updated_at) FROM students").fetchone()[0]
    changed = 0
    if run:
        changed = conn.execute(
            "SELECT COUNT(*) FROM students WHERE updated_at > ? AND anonymised = 0", (run["ran_at"],)
        ).fetchone()[0]
    return {"run": run, "synced_at": synced, "changed_since_run": changed}


def dashboard_stats(conn: sqlite3.Connection) -> dict:
    new_total = conn.execute("SELECT COUNT(*) FROM students WHERE role = 'new' AND anonymised = 0").fetchone()[0]
    counts = {r["status"]: r["n"] for r in conn.execute(
        "SELECT status, COUNT(*) AS n FROM matches GROUP BY status")}
    confirmed_new = conn.execute(
        "SELECT COUNT(DISTINCT new_student_id) FROM matches m JOIN students s ON s.id = m.new_student_id "
        "WHERE m.status IN ('approved','reassigned') AND s.anonymised = 0").fetchone()[0]
    decided = counts.get("approved", 0) + counts.get("reassigned", 0)
    low = conn.execute("SELECT COUNT(*) FROM matches WHERE status = 'suggested' AND score < ?", (GOOD,)).fetchone()[0]
    # Before the first run nobody has been "left without a buddy" yet.
    unplaced_count = len(unplaced(conn)) if last_run(conn) else 0
    confirmed_pairs = conn.execute(
        "SELECT COUNT(*) FROM matches WHERE status IN ('approved','reassigned')").fetchone()[0]
    checked_in = conn.execute(
        "SELECT COUNT(DISTINCT match_id) FROM feedback f JOIN matches m ON m.id = f.match_id "
        "WHERE m.status IN ('approved','reassigned')").fetchone()[0]
    return {
        "new_total": new_total,
        "need_buddy": new_total - confirmed_new,
        "awaiting_review": counts.get("suggested", 0),
        "approved_unedited_pct": round(100 * counts.get("approved", 0) / decided) if decided else None,
        "decided": decided,
        "flagged": low + unplaced_count,
        "unplaced": unplaced_count,
        "confirmed_pairs": confirmed_pairs,
        "checked_in": checked_in,
    }


def recent_activity(conn: sqlite3.Connection, limit: int = 6) -> list[dict]:
    return [dict(r) for r in conn.execute(
        "SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (limit,))]


# ---------------------------------------------------------------- retention

def purge_older_than(conn: sqlite3.Connection, days: int) -> int:
    """Anonymise students whose records have not been updated for `days` days.

    Names, languages, interests, clubs and free times are removed; scores and
    ratings stay (without names or comments) so the feedback loop still works.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat(timespec="seconds")
    ids = [r["id"] for r in conn.execute(
        "SELECT id FROM students WHERE updated_at < ? AND anonymised = 0", (cutoff,))]
    stamp = db.now()
    for sid in ids:
        conn.execute(
            "UPDATE students SET first_name = 'Former', last_name = 'student', homeroom = '', "
            "anonymised = 1, updated_at = ? WHERE id = ?", (stamp, sid))
        conn.execute("DELETE FROM student_attributes WHERE student_id = ?", (sid,))
        conn.execute(
            "UPDATE feedback SET comment = NULL WHERE match_id IN "
            "(SELECT id FROM matches WHERE new_student_id = ? OR buddy_id = ?)", (sid, sid))
        for m in conn.execute("SELECT id, breakdown FROM matches WHERE new_student_id = ? OR buddy_id = ?",
                              (sid, sid)).fetchall():
            scrubbed = [{**f, "shared": [], "note": "Removed under the retention policy"}
                        for f in json.loads(m["breakdown"])]
            conn.execute("UPDATE matches SET breakdown = ?, explanation = ?, override_note = NULL WHERE id = ?",
                         (json.dumps(scrubbed), "Removed under the retention policy.", m["id"]))
    if ids:
        db.audit(conn, "Anonymised old records", "student", None, f"{len(ids)} students not updated for {days} days")
    return len(ids)


# ---------------------------------------------------------------- review page table

def comparison_rows(match: dict, new: dict, buddy: dict) -> list[dict]:
    """Attribute-by-attribute table: what each student has, with shared items marked."""
    def items(values, other) -> list[tuple[str, bool]]:
        return [(v, v in other) for v in values]

    slot_index = {s: i for i, s in enumerate(SLOTS)}
    new_slots = sorted(new["availability"], key=lambda s: slot_index.get(s, 99))
    buddy_slots = sorted(buddy["availability"], key=lambda s: slot_index.get(s, 99))
    shared_langs = set(new["languages"]) & set(buddy["languages"])
    same_grade = new["grade"] == buddy["grade"]
    same_room = bool(new["homeroom"]) and new["homeroom"] == buddy["homeroom"]

    cells = {
        "availability": (
            [(slot_words(s), s in buddy["availability"]) for s in new_slots],
            [(slot_words(s), s in new["availability"]) for s in buddy_slots],
        ),
        "interests": (items(new["interests"], set(buddy["interests"])),
                      items(buddy["interests"], set(new["interests"]))),
        "language": (
            [(f"{lang} ({lvl})", lang in shared_langs) for lang, lvl in new["languages"].items()],
            [(f"{lang} ({lvl})", lang in shared_langs) for lang, lvl in buddy["languages"].items()],
        ),
        "been_new": (
            [("Yes" if new["been_new_before"] else "No", False)],
            [("Yes" if buddy["been_new_before"] else "No", bool(buddy["been_new_before"]))],
        ),
        "grade": (
            [(f"Grade {new['grade']}", same_grade)] + ([(new["homeroom"], same_room)] if new["homeroom"] else []),
            [(f"Grade {buddy['grade']}", same_grade)] + ([(buddy["homeroom"], same_room)] if buddy["homeroom"] else []),
        ),
        "clubs": (items(new["clubs"], set(buddy["clubs"])), items(buddy["clubs"], set(new["clubs"]))),
    }
    rows = []
    for f in match["factors"]:
        new_items, buddy_items = cells.get(f["key"], ([], []))
        rows.append({**f, "new_items": new_items, "buddy_items": buddy_items})
    return rows
