from app import db
from app import students as st


def test_csv_cells_cannot_start_a_formula():
    assert st.csv_safe("=HYPERLINK(\"x\")") == "'=HYPERLINK(\"x\")"
    assert st.csv_safe("+1") == "'+1" and st.csv_safe("@x") == "'@x" and st.csv_safe("-2") == "'-2"
    assert st.csv_safe("Mina") == "Mina" and st.csv_safe(None) == ""


def test_parse_languages():
    assert st.parse_languages("korean (home); English (Fluent), spanish") == {
        "Korean": "home", "English": "fluent", "Spanish": "fluent"}


def test_parse_import_reports_bad_rows():
    text = ("first_name,last_name,grade,homeroom,role,languages,clubs,capacity\n"
            "mina,park,8,8b,new,Korean (home),Art Studio,\n"
            ",NoFirst,8,,new,,,\n"
            "Ari,Lee,eight,,buddy,,,\n"
            "Sam,Roe,9,9A,teacher,,,\n")
    rows, errors = st.parse_import(text)
    assert [r["first_name"] for r in rows] == ["Mina"]
    assert rows[0]["languages"] == {"Korean": "home"} and rows[0]["clubs"] == ["Art Studio"]
    assert len(errors) == 3 and errors[0].startswith("Row 3")


def test_parse_import_needs_columns():
    rows, errors = st.parse_import("name,grade\nA,8\n")
    assert rows == [] and "Missing columns" in errors[0]


def test_save_and_questionnaire_round_trip(fresh_db):
    with db.session() as conn:
        sid = st.save_student(conn, {"first_name": "Ari", "last_name": "Lee", "grade": "8", "homeroom": "8c",
                                     "role": "new", "languages": {"Korean": "home"}, "clubs": ["Choir"]})
        st.save_questionnaire(conn, sid, {"languages": {"Korean": "home", "English": "learning"},
                                          "interests": ["Music", "Chess"], "availability": ["Mon · Lunch", "bogus"],
                                          "been_new_before": True, "willing": True, "capacity": 1})
        s = st.get_student(conn, sid)
    assert s["homeroom"] == "8C" and s["status"] == "unmatched"
    assert s["availability"] == ["Mon · Lunch"]          # unknown slots are dropped
    assert s["interests"] == ["Chess", "Music"] and s["consent_at"]
