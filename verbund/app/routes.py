"""All pages and form actions. There is no sign-in: every page is one click away."""

import json

from fastapi import APIRouter, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse, RedirectResponse, Response

from . import db
from . import matches as mt
from . import students as st
from .explain import ollama, worker
from .matching.scoring import DEFAULT_WEIGHTS, FACTOR_KEYS, FACTORS, SLOTS
from .web import redirect, render

router = APIRouter()
GRADES = list(range(6, 13))


def _int(value, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _csv_response(text: str, filename: str) -> Response:
    return Response(text, media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


# ---------------------------------------------------------------- home & dashboard

@router.get("/")
def home(request: Request):
    with db.session() as conn:
        stats = mt.dashboard_stats(conn)
        example = next(iter(mt.list_matches(conn)), None)
        pending_intake = conn.execute(
            "SELECT id, first_name, last_name FROM students WHERE intake_completed_at IS NULL "
            "AND anonymised = 0 ORDER BY role, id LIMIT 1").fetchone()
    return render(request, "home.html", {"stats": stats, "example": example, "pending_intake": pending_intake})


@router.get("/dashboard")
def dashboard(request: Request):
    with db.session() as conn:
        context = {
            "active": "dashboard",
            "stats": mt.dashboard_stats(conn),
            "pending": mt.list_matches(conn, status="suggested", sort="low")[:6],
            "fresh": mt.freshness(conn),
            "insights": mt.insights(conn),
            "activity": mt.recent_activity(conn),
            "unplaced": mt.unplaced(conn) if mt.last_run(conn) else [],
        }
    return render(request, "dashboard.html", context)


# ---------------------------------------------------------------- students

@router.get("/students")
def students_page(request: Request, grade: str = "", role: str = "", status: str = "", q: str = "",
                  open: int = 0, add: int = 0):
    with db.session() as conn:
        rows = st.list_students(conn, grade, role, status, q)
        selected = st.get_student(conn, open) if open else None
        history = []
        if selected:
            history = [mt._decorate(r) for r in conn.execute(
                mt.MATCH_SQL + " WHERE m.new_student_id = ? OR m.buddy_id = ? ORDER BY m.id DESC",
                (open, open))]
            db.audit(conn, "Viewed student profile", "student", open)
        fresh = mt.freshness(conn)
    return render(request, "students.html", {
        "active": "students", "students": rows, "selected": selected, "history": history,
        "adding": bool(add), "filters": {"grade": grade, "role": role, "status": status, "q": q},
        "grades": GRADES, "statuses": {**st.NEW_STATUSES, **st.BUDDY_STATUSES}, "fresh": fresh,
    })


def _student_form(form) -> tuple[dict, list[str]]:
    data = {
        "first_name": (form.get("first_name") or "").strip(),
        "last_name": (form.get("last_name") or "").strip(),
        "grade": form.get("grade") or "",
        "homeroom": form.get("homeroom") or "",
        "role": form.get("role") or "",
        "capacity": _int(form.get("capacity"), 1),
        "languages": st.parse_languages(form.get("languages") or ""),
        "clubs": st.split_list(form.get("clubs") or ""),
    }
    errors = []
    if not data["first_name"] or not data["last_name"]:
        errors.append("Enter a first and last name.")
    if not str(data["grade"]).isdigit():
        errors.append("Choose a grade.")
    if data["role"] not in ("new", "buddy"):
        errors.append("Choose whether this is a new student or a buddy.")
    return data, errors


@router.post("/students")
async def create_student(request: Request):
    data, errors = _student_form(await request.form())
    if errors:
        return redirect("/students?add=1", " ".join(errors))
    with db.session() as conn:
        sid = st.save_student(conn, data)
        db.audit(conn, "Added student", "student", sid)
    return redirect(f"/students?open={sid}", f"Added {data['first_name']} {data['last_name']}.")


@router.post("/students/import")
async def import_students(request: Request, file: UploadFile):
    raw = await file.read()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    rows, errors = st.parse_import(text)
    with db.session() as conn:
        for row in rows:
            st.save_student(conn, row)
        if rows:
            db.audit(conn, "Imported students", "student", None, f"{len(rows)} rows from {file.filename}")
    message = f"Imported {len(rows)} student{'s' if len(rows) != 1 else ''}."
    if errors:
        message += f" Skipped {len(errors)}: " + " ".join(errors[:3])
    return redirect("/students", message)


@router.get("/students/export.csv")
def export_students(grade: str = "", role: str = "", status: str = "", q: str = ""):
    with db.session() as conn:
        rows = st.list_students(conn, grade, role, status, q)
        db.audit(conn, "Exported student list", "student", None, f"{len(rows)} rows")
    return _csv_response(st.to_csv(
        ["First name", "Last name", "Grade", "Homeroom", "Role", "Status", "Buddy / new student",
         "Languages", "Clubs", "Interests", "Questionnaire done"],
        [[s["first_name"], s["last_name"], s["grade"], s["homeroom"], s["role"], s["status_label"],
          s["partner"] or "", s["language_text"], "; ".join(s["clubs"]), "; ".join(s["interests"]),
          "yes" if s["intake_completed_at"] else "no"] for s in rows],
    ), "verbund-students.csv")


@router.get("/students/template.csv")
def import_template():
    return _csv_response(st.to_csv(st.IMPORT_COLUMNS, [
        ["Mina", "Park", "8", "8B", "new", "Korean (home); English (learning)", "Art Studio", ""],
        ["Arjun", "Mehta", "8", "8B", "buddy", "Hindi (home); English (fluent)", "Robotics Club; Chess Club", "1"],
    ]), "verbund-import-template.csv")


@router.post("/students/{student_id}")
async def update_student(request: Request, student_id: int):
    data, errors = _student_form(await request.form())
    if errors:
        return redirect(f"/students?open={student_id}", " ".join(errors))
    with db.session() as conn:
        if not conn.execute("SELECT 1 FROM students WHERE id = ?", (student_id,)).fetchone():
            raise HTTPException(404)
        st.save_student(conn, data, student_id)
        db.audit(conn, "Edited student", "student", student_id)
    return redirect(f"/students?open={student_id}", "Saved.")


@router.post("/students/{student_id}/delete")
def delete_student(student_id: int):
    with db.session() as conn:
        s = st.get_student(conn, student_id)
        if s is None:
            raise HTTPException(404)
        st.delete_student(conn, student_id)
        db.audit(conn, "Deleted student and all their data", "student", student_id)
    return redirect("/students", f"Deleted {s['name']} and everything Verbund held about them.")


@router.get("/students/{student_id}/record.json")
def student_record(student_id: int):
    with db.session() as conn:
        record = st.student_record(conn, student_id)
        if record is None:
            raise HTTPException(404)
        db.audit(conn, "Exported a student's data", "student", student_id)
    return Response(json.dumps(record, indent=2), media_type="application/json",
                    headers={"Content-Disposition": f'attachment; filename="verbund-student-{student_id}.json"'})


# ---------------------------------------------------------------- student questionnaire

@router.get("/intake")
def intake_index(request: Request):
    with db.session() as conn:
        rows = st.list_students(conn)
    return render(request, "intake_index.html", {"students": rows})


def _intake_context(conn, student: dict, answers: dict | None = None, errors: list[str] | None = None) -> dict:
    options = json.loads(db.get_setting(conn, "interest_options"))
    answers = answers or {
        "languages": student["languages"],
        "interests": student["interests"],
        "availability": student["availability"],
        "been_new_before": bool(student["been_new_before"]) if student["intake_completed_at"] else None,
        "willing": bool(student["willing"]),
        "capacity": student["capacity"],
        "other_interest": "",
    }
    extra = [i for i in answers["interests"] if i not in options]
    return {"student": student, "answers": answers, "errors": errors or [],
            "interest_options": options + extra, "school_language": mt.school_language(conn),
            "levels": st.LANGUAGE_LEVELS}


@router.get("/intake/{student_id}")
def intake_form(request: Request, student_id: int):
    with db.session() as conn:
        student = st.get_student(conn, student_id)
        if student is None or student["anonymised"]:
            raise HTTPException(404)
        context = _intake_context(conn, student)
    return render(request, "intake.html", context)


@router.post("/intake/{student_id}")
async def intake_submit(request: Request, student_id: int):
    form = await request.form()
    languages = {}
    for i in range(4):
        name = st.tidy(form.get(f"language_{i}") or "")
        if name:
            languages[name] = form.get(f"level_{i}") or "fluent"
    interests = [st.tidy(i) for i in form.getlist("interests")]
    other = st.tidy(form.get("other_interest") or "")
    if other:
        interests += st.split_list(other)
    answers = {
        "languages": languages,
        "interests": interests,
        "availability": [s for s in form.getlist("availability") if s in SLOTS],
        "been_new_before": {"yes": True, "no": False}.get(form.get("been_new_before") or ""),
        "willing": form.get("willing", "yes") == "yes",
        "capacity": _int(form.get("capacity"), 1),
        "other_interest": "",
    }
    errors = []
    if not form.get("consent"):
        errors.append("Tick the box to say you agree, or ask your teacher about it.")
    if not form.get("guardian_told"):
        errors.append("Tick the box to confirm a parent or guardian knows about this.")
    if not languages:
        errors.append("Add at least one language you speak.")
    if answers["been_new_before"] is None:
        errors.append("Say whether you have been new at a school before.")

    with db.session() as conn:
        student = st.get_student(conn, student_id)
        if student is None or student["anonymised"]:
            raise HTTPException(404)
        if errors:
            return render(request, "intake.html", _intake_context(conn, student, answers, errors), 400)
        st.save_questionnaire(conn, student_id, answers)
        db.audit(conn, "Questionnaire submitted", "student", student_id)
    return render(request, "intake_done.html", {"student": student})


# ---------------------------------------------------------------- matching

@router.get("/matching")
def matching_page(request: Request, grade: str = "", band: str = "", status: str = "suggested",
                  sort: str = "score"):
    with db.session() as conn:
        rows = mt.list_matches(conn, status, grade, band, sort)
        context = {
            "active": "matching", "matches": rows, "grades": GRADES,
            "filters": {"grade": grade, "band": band, "status": status, "sort": sort},
            "fresh": mt.freshness(conn), "stats": mt.dashboard_stats(conn),
            "unplaced": mt.unplaced(conn) if mt.last_run(conn) else [],
            "explaining": worker.pending(),
        }
    return render(request, "matching.html", context)


@router.post("/matching/run")
def run_matching():
    with db.session() as conn:
        result = mt.run_matching(conn)
    queued = worker.enqueue(result["match_ids"])
    message = (f"Matched {result['suggested']} of {result['waiting']} new students "
               f"in {result['duration_ms']:.0f} ms.")
    if result["flagged"]:
        message += f" {result['flagged']} flagged for a closer look."
    if result["match_ids"]:
        message += (" The local AI is writing explanations now." if queued
                    else " Explanations use the summary template (Ollama is not running).")
    return redirect("/matching", message)


@router.post("/matching/approve")
async def bulk_approve(request: Request):
    form = await request.form()
    ids = [_int(i) for i in form.getlist("match_ids") if _int(i)]
    if not ids:
        return redirect("/matching", "Tick at least one pairing to approve.")
    with db.session() as conn:
        count = mt.approve(conn, ids)
    return redirect("/matching", f"Approved {count} pairing{'s' if count != 1 else ''}.")


@router.get("/matching/export.csv")
def export_matches(grade: str = "", band: str = "", status: str = "", sort: str = "score"):
    with db.session() as conn:
        rows = mt.list_matches(conn, status, grade, band, sort)
        db.audit(conn, "Exported pairings", "match", None, f"{len(rows)} rows")
    headers = ["New student", "Grade", "Buddy", "Buddy grade", "Score", "Band", "Status"] + \
              [label for _, label in FACTORS] + \
              ["Explanation", "Override reason"]
    return _csv_response(st.to_csv(headers, [
        [m["new_name"], m["new_grade"], m["buddy_name"], m["buddy_grade"], m["score"], m["band"], m["status"]]
        + [f"{f['points']:g}/{f['weight']:g}" for f in m["factors"]]
        + [m["explanation"], m["override_reason"] or ""]
        for m in rows
    ]), "verbund-pairings.csv")


@router.get("/matching/comparison.csv")
def comparison_sheet():
    """Blind sheet for the expert evaluation: the expert writes their own pick first."""
    with db.session() as conn:
        rows = mt.list_matches(conn, sort="name")
        new_students = conn.execute(
            "SELECT id, first_name, last_name, grade, homeroom FROM students "
            "WHERE role = 'new' AND anonymised = 0 ORDER BY last_name").fetchall()
        db.audit(conn, "Exported blind comparison sheet", "match", None)
    by_new = {m["new_student_id"]: m for m in rows}
    return _csv_response(st.to_csv(
        ["New student", "Grade", "Homeroom", "Expert's own pick (fill in first)", "Why",
         "Verbund's pick", "Verbund score", "Which is better? (expert / Verbund / same)", "Notes"],
        [[f"{n['first_name']} {n['last_name']}", n["grade"], n["homeroom"], "", "",
          by_new[n["id"]]["buddy_name"] if n["id"] in by_new else "No suggestion",
          by_new[n["id"]]["score"] if n["id"] in by_new else "", "", ""] for n in new_students],
    ), "verbund-blind-comparison.csv")


# ---------------------------------------------------------------- review

@router.get("/review")
def review_start(request: Request):
    with db.session() as conn:
        queue = mt.review_queue(conn)
        if queue:
            return RedirectResponse(f"/review/{queue[0]}", status_code=303)
        recent = mt.list_matches(conn, sort="name")
    return render(request, "review_empty.html", {"active": "review", "recent": recent})


@router.get("/review/{match_id}")
def review_page(request: Request, match_id: int):
    with db.session() as conn:
        match = mt.get_match(conn, match_id)
        if match is None:
            raise HTTPException(404)
        queue = mt.review_queue(conn)
        new = st.get_student(conn, match["new_student_id"])
        buddy = st.get_student(conn, match["buddy_id"])
        context = {
            "active": "review", "match": match, "new": new, "buddy": buddy,
            "alternatives": mt.alternatives(conn, match) if match["status"] != "declined" else [],
            "reasons": mt.OVERRIDE_REASONS, "feedback": mt.feedback_for(conn, match_id),
            "frequencies": mt.FREQUENCIES, "fresh": mt.freshness(conn),
            "queue_pos": queue.index(match_id) + 1 if match_id in queue else None,
            "queue_len": len(queue),
            "next_id": next((q for q in queue if q != match_id), None),
            "replacement": mt.get_match(conn, match["replaced_by"]) if match["replaced_by"] else None,
            "rows": mt.comparison_rows(match, new, buddy),
            "profiles_changed": max(new["updated_at"], buddy["updated_at"]) > match["created_at"],
        }
        db.audit(conn, "Viewed pairing", "match", match_id)
    return render(request, "review.html", context)


def _next_url(conn, after: int) -> str:
    queue = [q for q in mt.review_queue(conn) if q != after]
    return f"/review/{queue[0]}" if queue else "/review"


@router.post("/review/{match_id}/approve")
def review_approve(match_id: int):
    with db.session() as conn:
        match = mt.get_match(conn, match_id)
        if match is None:
            raise HTTPException(404)
        mt.approve(conn, [match_id])
        url = _next_url(conn, match_id)
    return redirect(url, f"Approved {match['new_first']} and {match['buddy_first']}.")


@router.post("/review/{match_id}/decline")
async def review_decline(request: Request, match_id: int):
    form = await request.form()
    with db.session() as conn:
        match = mt.get_match(conn, match_id)
        if match is None:
            raise HTTPException(404)
        mt.decline(conn, match_id, form.get("reason") or "", form.get("note") or "")
        url = _next_url(conn, match_id)
    return redirect(url, f"Declined. {match['new_first']} will get a new suggestion next time matching runs.")


@router.post("/review/{match_id}/reassign")
async def review_reassign(request: Request, match_id: int):
    form = await request.form()
    buddy_id = _int(form.get("buddy_id"))
    reason = form.get("reason") or ""
    if not buddy_id or reason not in mt.OVERRIDE_REASONS:
        return redirect(f"/review/{match_id}#change", "Choose a buddy and a reason for the change.")
    with db.session() as conn:
        match = mt.get_match(conn, match_id)
        if match is None or match["status"] == "declined":
            raise HTTPException(404)
        new_id = mt.reassign(conn, match_id, buddy_id, reason, form.get("note") or "")
    worker.enqueue([new_id])
    return redirect(f"/review/{new_id}", "Buddy changed and the reason recorded.")


@router.post("/review/{match_id}/explain")
def review_explain(match_id: int):
    queued = worker.enqueue([match_id])
    message = ("Asked the local AI for a new explanation. It appears here in a few seconds."
               if queued else "Ollama is not running, so the summary template is shown. See Settings for setup.")
    return redirect(f"/review/{match_id}", message)


@router.get("/api/matches/{match_id}/explanation")
def explanation_api(match_id: int):
    with db.session() as conn:
        row = conn.execute("SELECT explanation, explanation_status FROM matches WHERE id = ?",
                           (match_id,)).fetchone()
    if row is None:
        raise HTTPException(404)
    return JSONResponse({"text": row["explanation"], "status": row["explanation_status"]})


# ---------------------------------------------------------------- check-ins

@router.get("/checkin/{match_id}/{respondent}")
def checkin_form(request: Request, match_id: int, respondent: str):
    with db.session() as conn:
        match = mt.get_match(conn, match_id)
        if match is None or respondent not in ("new", "buddy") or match["status"] not in ("approved", "reassigned"):
            raise HTTPException(404)
        existing = next((f for f in mt.feedback_for(conn, match_id) if f["respondent"] == respondent), None)
    return render(request, "checkin.html", {"match": match, "respondent": respondent, "existing": existing,
                                            "frequencies": mt.FREQUENCIES})


@router.post("/checkin/{match_id}/{respondent}")
async def checkin_submit(request: Request, match_id: int, respondent: str):
    form = await request.form()
    frequency, rating = form.get("frequency") or "", _int(form.get("rating"))
    with db.session() as conn:
        match = mt.get_match(conn, match_id)
        if match is None or respondent not in ("new", "buddy") or match["status"] not in ("approved", "reassigned"):
            raise HTTPException(404)
        if frequency not in mt.FREQUENCIES or not 1 <= rating <= 5:
            return render(request, "checkin.html", {
                "match": match, "respondent": respondent, "existing": None, "frequencies": mt.FREQUENCIES,
                "error": "Answer both questions, then send."}, 400)
        mt.save_feedback(conn, match_id, respondent, frequency, rating, form.get("comment") or "")
    return render(request, "checkin.html", {"match": match, "respondent": respondent, "done": True,
                                            "frequencies": mt.FREQUENCIES})


# ---------------------------------------------------------------- settings

@router.get("/settings")
def settings_page(request: Request):
    with db.session() as conn:
        version, weights = mt.active_weights(conn)
        context = {
            "active": "settings", "weights": weights, "weights_version": version,
            "school_language": mt.school_language(conn),
            "interest_options": json.loads(db.get_setting(conn, "interest_options")),
            "retention_days": db.get_setting(conn, "retention_days"),
            "audit": [dict(r) for r in conn.execute("SELECT * FROM audit_log ORDER BY id DESC LIMIT 60")],
            "counts": {
                "students": conn.execute("SELECT COUNT(*) FROM students WHERE anonymised = 0").fetchone()[0],
                "anonymised": conn.execute("SELECT COUNT(*) FROM students WHERE anonymised = 1").fetchone()[0],
                "matches": conn.execute("SELECT COUNT(*) FROM matches").fetchone()[0],
                "feedback": conn.execute("SELECT COUNT(*) FROM feedback").fetchone()[0],
            },
            "ollama": ollama.status(),
            "defaults": DEFAULT_WEIGHTS,
        }
    return render(request, "settings.html", context)


@router.post("/settings/weights")
async def save_weights(request: Request):
    form = await request.form()
    weights = {key: max(0, min(60, _int(form.get(key)))) for key in FACTOR_KEYS}
    if form.get("reset"):
        weights = dict(DEFAULT_WEIGHTS)
    if sum(weights.values()) != 100:
        return redirect("/settings#weights", f"The weights add up to {sum(weights.values())}. They must add up to 100.")
    with db.session() as conn:
        version = mt.save_weights(conn, weights)
        db.audit(conn, "Changed weights", "weights", version, json.dumps(weights))
    return redirect("/settings#weights", f"Saved as weights version {version}. Run matching again to use them.")


@router.post("/settings/school")
async def save_school(request: Request):
    form = await request.form()
    language = st.tidy(form.get("school_language") or "") or "English"
    options = st.split_list(form.get("interest_options") or "")
    retention = max(30, min(3650, _int(form.get("retention_days"), 365)))
    with db.session() as conn:
        db.set_setting(conn, "school_language", language)
        if options:
            db.set_setting(conn, "interest_options", json.dumps(options))
        db.set_setting(conn, "retention_days", str(retention))
        db.audit(conn, "Changed school settings", "settings", None)
    return redirect("/settings#school", "School settings saved.")


@router.post("/settings/purge")
def purge():
    with db.session() as conn:
        days = _int(db.get_setting(conn, "retention_days"), 365)
        count = mt.purge_older_than(conn, days)
    return redirect("/settings#privacy",
                    f"Anonymised {count} record{'s' if count != 1 else ''} not updated for {days} days.")


@router.post("/settings/reset-demo")
def reset_demo():
    from .demo import seed
    seed(reset=True)
    return redirect("/dashboard", "Demo data restored.")
