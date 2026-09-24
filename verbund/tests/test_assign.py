from app.matching.assign import assign, rank_candidates
from app.matching.scoring import DEFAULT_WEIGHTS, Profile


def p(pid, first, grade=8, homeroom="8A", languages=None, interests=(), availability=(), been_new=False,
      capacity=1, willing=True, consented=True):
    return Profile(id=pid, first_name=first, last_name="T", grade=grade, homeroom=homeroom,
                   languages=languages or {"English": "fluent"}, interests=set(interests), clubs=set(),
                   availability=set(availability), been_new_before=been_new, capacity=capacity,
                   willing=willing, consented=consented)


def test_capacity_is_respected():
    buddy_a = p(10, "Ana", interests=["Chess"], availability=["Mon · Lunch"], capacity=1)
    buddy_b = p(11, "Ben")
    new = [p(1, "X", interests=["Chess"], availability=["Mon · Lunch"]),
           p(2, "Y", interests=["Chess"], availability=["Mon · Lunch"])]
    result = assign(new, [buddy_a, buddy_b], DEFAULT_WEIGHTS)
    assert sorted(s.buddy_id for s in result) == [10, 11]


def test_student_with_most_to_lose_chooses_first():
    # Kenji has one excellent option (Haruto) and poor alternatives; Elif is weak with everyone.
    haruto = p(10, "Haruto", languages={"Japanese": "home"}, interests=["Football"], availability=["Mon · Lunch"])
    other = p(11, "Other")
    kenji = p(1, "Kenji", languages={"Japanese": "home"}, interests=["Football"], availability=["Mon · Lunch"])
    elif_ = p(2, "Elif", availability=["Mon · Lunch"])
    result = {s.new_id: s.buddy_id for s in assign([elif_, kenji], [haruto, other], DEFAULT_WEIGHTS)}
    assert result[1] == 10
    assert result[2] == 11


def test_ineligible_buddies_are_counted_with_reasons():
    new = p(1, "New", grade=8)
    buddies = [p(10, "Far", grade=11), p(11, "No", willing=False), p(12, "Nc", consented=False),
               p(13, "Dec"), p(14, "Ok")]
    candidates, excluded = rank_candidates(new, buddies, DEFAULT_WEIGHTS, declined_pairs={(1, 13)})
    assert [c.buddy.id for c in candidates] == [14]
    assert excluded == {"grade too far apart": 1, "not volunteering": 1, "no consent recorded": 1,
                        "declined before": 1}


def test_no_buddy_available():
    result = assign([p(1, "New")], [p(10, "Busy")], DEFAULT_WEIGHTS, used={10: 1})
    assert result[0].buddy_id is None
    assert result[0].excluded == {"already has a new student": 1}


def test_same_data_same_result():
    buddies = [p(10 + i, f"B{i}", interests=["Chess"] if i % 2 else ["Music"]) for i in range(6)]
    new = [p(i, f"N{i}", interests=["Chess"]) for i in range(1, 5)]
    first = [(s.new_id, s.buddy_id, s.score) for s in assign(new, buddies, DEFAULT_WEIGHTS)]
    second = [(s.new_id, s.buddy_id, s.score) for s in assign(list(reversed(new)), list(reversed(buddies)),
                                                              DEFAULT_WEIGHTS)]
    assert sorted(first) == sorted(second)
