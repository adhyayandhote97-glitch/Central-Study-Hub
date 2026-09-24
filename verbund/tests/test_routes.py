import re

from app import db


def flash(response) -> str:
    m = re.search(r'class="flash".*?<p>(.*?)</p>', response.text, re.S)
    return m.group(1) if m else ""


PAGES = ["/", "/dashboard", "/students", "/students?add=1", "/students?open=1", "/matching",
         "/matching?status=", "/review", "/settings", "/intake", "/intake/1"]


def test_every_page_loads_without_sign_in(client):
    for url in PAGES:
        r = client.get(url)
        assert r.status_code == 200, url
    assert client.get("/nope").status_code == 404


def test_security_headers(client):
    r = client.get("/dashboard")
    assert "default-src 'self'" in r.headers["content-security-policy"]
    assert r.headers["x-frame-options"] == "DENY"


def test_full_flow_run_review_override_checkin(client):
    r = client.post("/matching/run")
    assert "Matched 8 of 8 new students" in flash(r)
    with db.session() as conn:
        ids = [row["id"] for row in conn.execute("SELECT id FROM matches WHERE status = 'suggested' ORDER BY score DESC")]
    top, weakest = ids[0], ids[-1]

    r = client.get(f"/review/{top}")
    assert r.status_code == 200 and "Why this pair" in r.text and "Side by side" in r.text

    r = client.post(f"/review/{top}/approve")
    assert "Approved" in flash(r)

    # Changing the buddy needs a reason.
    r = client.post(f"/review/{weakest}/reassign", data={"buddy_id": "1"})
    assert "Choose a buddy and a reason" in flash(r)
    alternative = re.search(r'name="buddy_id" value="(\d+)"', client.get(f"/review/{weakest}").text).group(1)
    r = client.post(f"/review/{weakest}/reassign", data={"buddy_id": alternative, "reason": "Timetable clash"})
    assert r.status_code == 200 and "Manually reassigned" in r.text
    with db.session() as conn:
        assert conn.execute("SELECT status FROM matches WHERE id = ?", (weakest,)).fetchone()[0] == "declined"
        assert conn.execute("SELECT COUNT(*) FROM audit_log WHERE action = 'Chose a different buddy'").fetchone()[0] == 1

    r = client.post(f"/checkin/{top}/new", data={"frequency": "weekly"})
    assert r.status_code == 400
    r = client.post(f"/checkin/{top}/new", data={"frequency": "weekly", "rating": "4", "comment": "Good"})
    assert "Check-in sent" in r.text


def test_bulk_approve_and_decline(client):
    client.post("/matching/run")
    with db.session() as conn:
        ids = [row["id"] for row in conn.execute("SELECT id FROM matches WHERE status = 'suggested'")]
    r = client.post("/matching/approve", data={"match_ids": [str(i) for i in ids[:3]]})
    assert "Approved 3 pairings" in flash(r)
    r = client.post(f"/review/{ids[3]}/decline", data={"reason": "Other"})
    assert "Declined" in flash(r)
    # A declined pair is never suggested again.
    with db.session() as conn:
        declined = conn.execute("SELECT new_student_id, buddy_id FROM matches WHERE id = ?", (ids[3],)).fetchone()
    client.post("/matching/run")
    with db.session() as conn:
        again = conn.execute("SELECT COUNT(*) FROM matches WHERE status = 'suggested' AND new_student_id = ? "
                             "AND buddy_id = ?", tuple(declined)).fetchone()[0]
    assert again == 0


def test_questionnaire_requires_consent_then_saves(client):
    r = client.post("/intake/24", data={"language_0": "Portuguese", "level_0": "home"})
    assert r.status_code == 400 and "Tick the box" in r.text
    r = client.post("/intake/24", data={
        "consent": "yes", "guardian_told": "yes", "language_0": "Portuguese", "level_0": "home",
        "interests": ["Swimming", "Science"], "availability": ["Mon · Lunch", "Thu · Lunch"],
        "been_new_before": "yes"})
    assert r.status_code == 200 and "Thanks" in r.text
    with db.session() as conn:
        row = conn.execute("SELECT consent_at, intake_completed_at FROM students WHERE id = 24").fetchone()
    assert row["consent_at"] and row["intake_completed_at"]


def test_weights_must_add_up_to_100(client):
    r = client.post("/settings/weights", data={"availability": "50", "interests": "50", "language": "10",
                                                "been_new": "0", "grade": "0", "clubs": "0"})
    assert "add up to 110" in flash(r)
    r = client.post("/settings/weights", data={"availability": "30", "interests": "20", "language": "20",
                                                "been_new": "10", "grade": "10", "clubs": "10"})
    assert "version 2" in flash(r)


def test_exports_and_data_rights(client):
    client.post("/matching/run")
    r = client.get("/matching/export.csv")
    assert r.headers["content-type"].startswith("text/csv") and "Free at the same times" in r.text
    assert "Expert's own pick" in client.get("/matching/comparison.csv").text
    assert client.get("/students/export.csv").text.startswith("First name")
    r = client.get("/students/1/record.json")
    assert r.json()["first_name"] == "Arjun"
    r = client.post("/students/1/delete")
    assert "Deleted Arjun Mehta" in flash(r)
    with db.session() as conn:
        assert conn.execute("SELECT COUNT(*) FROM students WHERE id = 1").fetchone()[0] == 0
        assert conn.execute("SELECT COUNT(*) FROM student_attributes WHERE student_id = 1").fetchone()[0] == 0


def test_import_csv(client):
    csv_text = ("first_name,last_name,grade,homeroom,role,languages,clubs,capacity\n"
                "Ravi,Shah,8,8A,new,Gujarati (home); English (fluent),Chess Club,\n"
                "Bad,Row,x,,new,,,\n")
    r = client.post("/students/import", files={"file": ("s.csv", csv_text, "text/csv")})
    assert "Imported 1 student" in flash(r) and "Skipped 1" in flash(r)


def test_retention_purge_anonymises(client):
    with db.session() as conn:
        conn.execute("UPDATE settings SET value = '100' WHERE key = 'retention_days'")
    r = client.post("/settings/purge")
    # 16 buddies and last term's 6 new students were last updated 150+ days ago in the demo data.
    assert "Anonymised 22 records" in flash(r)
    with db.session() as conn:
        names = {row[0] for row in conn.execute("SELECT first_name FROM students WHERE anonymised = 1")}
        comments = conn.execute("SELECT COUNT(*) FROM feedback WHERE comment IS NOT NULL").fetchone()[0]
    assert names == {"Former"} and comments == 0
