"""Fictional demo data: 16 buddies, 8 new students waiting for a buddy, and
6 pairs from last term with check-ins (so the "What's working" panel has data).

Every name and detail here is made up.
"""

import json
from datetime import datetime, timedelta, timezone

from . import db
from . import students as st
from .explain.template import template_explanation
from .matching.scoring import DEFAULT_WEIGHTS, score_pair

# (first, last, grade, homeroom, languages, interests, clubs, availability,
#  been_new, capacity, willing, consented)
BUDDIES = [
    ("Arjun", "Mehta", 8, "8B", "Hindi (home); English (fluent)", "Coding; Robotics; Chess",
     "Robotics Club; Chess Club", ["Mon · Lunch", "Wed · Lunch", "Thu · After school"], True, 1, True, True),
    ("Sofia", "Rossi", 8, "8A", "Italian (home); English (fluent); Spanish (learning)", "Dance; Music; Photography",
     "Choir; Drama Society", ["Tue · Break", "Wed · Lunch", "Fri · Lunch"], True, 2, True, True),
    ("Haruto", "Sato", 8, "8C", "Japanese (home); English (fluent)", "Football; Gaming; Science",
     "Football Team", ["Mon · Lunch", "Tue · Lunch", "Thu · Lunch"], False, 1, True, True),
    ("Lina", "Haddad", 9, "9A", "Arabic (home); French (fluent); English (fluent)", "Debate; Reading; Writing",
     "Model UN; Debate Society", ["Mon · Before school", "Wed · Lunch", "Fri · Break"], True, 1, True, True),
    ("Ethan", "Clarke", 9, "9B", "English (home)", "Basketball; Film; Gaming",
     "Basketball Team", ["Tue · Lunch", "Thu · After school"], False, 1, True, True),
    ("Priya", "Nair", 7, "7A", "Malayalam (home); Hindi (fluent); English (fluent)", "Drawing; Reading; Cooking",
     "Art Studio; Eco Club", ["Mon · Lunch", "Wed · Break", "Fri · Lunch"], True, 1, True, True),
    ("Joon-ho", "Kim", 8, "8B", "Korean (home); English (fluent)", "Football; Coding; Music",
     "Coding Club; Football Team", ["Mon · Lunch", "Wed · Lunch", "Fri · After school"], True, 1, True, True),
    ("Amara", "Okafor", 9, "9C", "English (home); Igbo (fluent); French (learning)", "Science; Swimming; Debate",
     "Eco Club; Model UN", ["Tue · Break", "Thu · Lunch"], False, 2, True, True),
    ("Mateo", "García", 7, "7B", "Spanish (home); English (fluent)", "Football; Cricket; Drawing",
     "Football Team", ["Mon · Break", "Wed · Lunch", "Thu · Lunch"], True, 1, True, True),
    ("Chloé", "Martin", 8, "8A", "French (home); English (fluent)", "Theatre; Reading; Writing",
     "Drama Society", ["Tue · Lunch", "Thu · Lunch", "Fri · Break"], False, 1, True, True),
    ("Wei", "Chen", 9, "9A", "Mandarin (home); English (fluent)", "Chess; Coding; Badminton",
     "Chess Club; Coding Club", ["Mon · Lunch", "Wed · After school", "Fri · Lunch"], True, 2, True, True),
    ("Aisha", "Rahman", 7, "7A", "Bengali (home); English (fluent)", "Badminton; Photography; Cooking",
     "Eco Club", ["Tue · Lunch", "Wed · Lunch", "Thu · Break"], False, 2, True, True),
    ("Lukas", "Weber", 8, "8C", "German (home); English (fluent)", "Robotics; Science; Swimming",
     "Robotics Club", ["Wed · Lunch", "Thu · After school"], False, 2, True, True),
    ("Zara", "Ahmed", 8, "8B", "Urdu (home); Hindi (fluent); English (fluent)", "Drawing; Film; Music",
     "Art Studio; Choir", ["Mon · Lunch", "Tue · Break", "Fri · Lunch"], True, 1, True, True),
    ("Oliver", "Brown", 9, "9B", "English (home)", "Football; Cricket; Gaming",
     "Football Team", ["Mon · Lunch"], False, 1, False, True),
    ("Yuna", "Tanaka", 7, "7C", "Japanese (home); English (fluent)", "Dance; Music; Drawing",
     "Choir", [], True, 1, True, False),
]

# New students waiting for a buddy this term. Tomás has not done the questionnaire yet.
NEW_STUDENTS = [
    ("Mina", "Park", 8, "8B", "Korean (home); English (learning)", "Drawing; Music; Film",
     "Art Studio", ["Mon · Lunch", "Wed · Lunch", "Fri · Lunch"], False, True),
    ("Diego", "Fernández", 7, "7B", "Spanish (home); English (fluent)", "Football; Gaming; Drawing",
     "Football Team", ["Mon · Break", "Wed · Lunch"], False, True),
    ("Kenji", "Watanabe", 8, "8C", "Japanese (home); English (learning)", "Football; Science; Gaming",
     "", ["Mon · Lunch", "Tue · Lunch"], True, True),
    ("Fatima", "Al-Sayed", 9, "9A", "Arabic (home); English (fluent)", "Debate; Reading",
     "Model UN", ["Mon · Before school", "Wed · Lunch"], False, True),
    ("Noah", "Williams", 9, "9B", "English (home)", "Basketball; Coding",
     "Basketball Team", ["Tue · Lunch", "Thu · After school"], True, True),
    ("Ananya", "Iyer", 7, "7A", "Tamil (home); English (fluent)", "Reading; Cooking; Badminton",
     "Eco Club", ["Wed · Break", "Fri · Lunch"], False, True),
    ("Elif", "Yılmaz", 8, "8A", "Turkish (home); German (fluent); English (learning)", "Theatre; Writing",
     "", ["Thu · Lunch"], False, True),
    ("Tomás", "Silva", 9, "9C", "Portuguese (home); Spanish (fluent); English (learning)", "",
     "Eco Club", [], False, False),
]

# Last term: (new student, buddy last name, status, override reason, [(respondent, frequency, rating, comment)])
PAST_PAIRS = [
    (("Sara", "Johansson", 8, "8A", "Swedish (home); English (fluent)", "Music; Dance", "Choir",
      ["Wed · Lunch", "Fri · Lunch"], False), "Rossi", "approved", None,
     [("new", "more", 5, "We have lunch together most days."), ("buddy", "weekly", 5, "")]),
    (("Rahul", "Gupta", 9, "9C", "Hindi (home); English (fluent)", "Science; Swimming", "Eco Club",
      ["Tue · Break", "Thu · Lunch"], True), "Okafor", "approved", None,
     [("new", "weekly", 4, ""), ("buddy", "weekly", 5, "Easy to meet at break.")]),
    (("Leo", "Novak", 8, "8C", "Czech (home); English (fluent)", "Robotics", "Robotics Club",
      ["Mon · Break"], False), "Weber", "approved", None,
     [("new", "once", 2, "Our free times never line up."), ("buddy", "once", 3, "")]),
    (("Hana", "Ito", 7, "7A", "Japanese (home); English (fluent)", "Cooking; Photography", "Eco Club",
      ["Tue · Lunch", "Wed · Lunch"], False), "Rahman", "approved", None,
     [("new", "weekly", 5, ""), ("buddy", "weekly", 4, "")]),
    (("Max", "Müller", 9, "9A", "German (home); English (fluent)", "Chess; Badminton", "Chess Club",
      ["Thu · Break"], False), "Chen", "reassigned", "Knows the students personally",
     [("new", "never", 2, ""), ("buddy", "once", 2, "Hard to find a time.")]),
    (("Isabelle", "Dubois", 8, "8A", "French (home); English (learning)", "Theatre; Reading", "Drama Society",
      ["Tue · Lunch", "Thu · Lunch"], False), "Martin", "approved", None,
     [("new", "more", 5, "Chloé helped me with everything in the first week."), ("buddy", "more", 5, "")]),
]

TABLES = ["feedback", "matches", "matching_runs", "student_attributes", "students", "audit_log", "weights"]


def _ago(days: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat(timespec="seconds")


def _insert(conn, first, last, grade, homeroom, role, languages, interests, clubs, availability,
            been_new, capacity=1, willing=True, consented=True, created_days_ago=20) -> int:
    created = _ago(created_days_ago)
    sid = conn.execute(
        """INSERT INTO students (first_name, last_name, grade, homeroom, role, arrival_date, been_new_before,
               willing, capacity, consent_at, consent_version, intake_completed_at, source, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'school', ?, ?)""",
        (first, last, grade, homeroom, role, created[:10] if role == "new" else None, int(been_new),
         int(willing), capacity, created if consented else None, st.CONSENT_VERSION if consented else None,
         created if consented else None, created, created),
    ).lastrowid
    st.set_languages(conn, sid, st.parse_languages(languages))
    st.set_values(conn, sid, "interest", st.split_list(interests))
    st.set_values(conn, sid, "club", st.split_list(clubs))
    st.set_values(conn, sid, "availability", availability)
    return sid


def seed(reset: bool = False) -> None:
    db.init_db()
    with db.session() as conn:
        if not reset and conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]:
            return
        for table in TABLES:
            conn.execute(f"DELETE FROM {table}")
        conn.execute("INSERT INTO weights (version, data, created_at, active) VALUES (1, ?, ?, 1)",
                     (json.dumps(DEFAULT_WEIGHTS), _ago(160)))

        buddy_ids = {}
        for (first, last, grade, room, langs, interests, clubs, avail, been_new, cap, willing,
             consented) in BUDDIES:
            buddy_ids[last] = _insert(conn, first, last, grade, room, "buddy", langs, interests, clubs, avail,
                                      been_new, cap, willing, consented, created_days_ago=160)

        # Last term's pairs, with check-ins.
        for (first, last, grade, room, langs, interests, clubs, avail, been_new), buddy_last, status, reason, \
                answers in PAST_PAIRS:
            new_id = _insert(conn, first, last, grade, room, "new", langs, interests, clubs, avail, been_new,
                             created_days_ago=150)
            buddy_id = buddy_ids[buddy_last]
            new, buddy = st.profile(conn, new_id), st.profile(conn, buddy_id)
            score, factors = score_pair(new, buddy, DEFAULT_WEIGHTS)
            factors = [f.to_dict() for f in factors]
            decided = _ago(145)
            mid = conn.execute(
                """INSERT INTO matches (new_student_id, buddy_id, score, breakdown, weights_version, status,
                       explanation, explanation_status, excluded, override_reason, created_at, decided_at, updated_at)
                   VALUES (?, ?, ?, ?, 1, ?, ?, 'template', '{}', ?, ?, ?, ?)""",
                (new_id, buddy_id, score, json.dumps(factors), status,
                 template_explanation(new.first_name, buddy.first_name, score, factors),
                 reason, _ago(146), decided, decided),
            ).lastrowid
            for respondent, frequency, rating, comment in answers:
                conn.execute(
                    "INSERT INTO feedback (match_id, respondent, frequency, rating, comment, submitted_at) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (mid, respondent, frequency, rating, comment or None, _ago(130)),
                )

        for first, last, grade, room, langs, interests, clubs, avail, been_new, done in NEW_STUDENTS:
            _insert(conn, first, last, grade, room, "new", langs, interests, clubs, avail, been_new,
                    consented=done, created_days_ago=3)

        conn.execute("INSERT INTO audit_log (at, action, entity, detail) VALUES (?, 'Loaded demo data', "
                     "'student', '30 fictional students')", (db.now(),))
