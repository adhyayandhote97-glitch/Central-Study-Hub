from app.matching.scoring import DEFAULT_WEIGHTS, Profile, band, normalise_weights, score_pair


def make(pid=1, first="A", grade=8, homeroom="8B", languages=None, interests=(), clubs=(), availability=(),
         been_new=False, **kw):
    return Profile(id=pid, first_name=first, last_name="Test", grade=grade, homeroom=homeroom,
                   languages=languages or {"English": "fluent"}, interests=set(interests), clubs=set(clubs),
                   availability=set(availability), been_new_before=been_new, **kw)


def points(factors):
    return {f.key: f.points for f in factors}


def test_hand_calculated_pair():
    # Worked example used in the report: every number below can be checked by hand.
    new = make(1, "Kenji", languages={"Japanese": "home", "English": "learning"},
               interests=["Football", "Science", "Gaming"], availability=["Mon · Lunch", "Tue · Lunch"], homeroom="8C")
    buddy = make(2, "Haruto", languages={"Japanese": "home", "English": "fluent"},
                 interests=["Football", "Gaming", "Science"], clubs=["Football Team"],
                 availability=["Mon · Lunch", "Tue · Lunch", "Thu · Lunch"], homeroom="8C")
    score, factors = score_pair(new, buddy, DEFAULT_WEIGHTS)
    assert points(factors) == {"availability": 25, "interests": 20, "language": 20, "been_new": 0,
                               "grade": 10, "clubs": 0}
    assert score == 75
    assert band(score) == "strong"


def test_only_school_language_earns_a_little():
    new = make(1, languages={"Korean": "home", "English": "learning"})
    buddy = make(2, languages={"English": "home"})
    _, factors = score_pair(new, buddy, DEFAULT_WEIGHTS, school_language="English")
    lang = next(f for f in factors if f.key == "language")
    assert lang.similarity == 0.3
    assert lang.points == 6


def test_shared_second_language_scores_less_than_home_language():
    new = make(1, languages={"Turkish": "home", "German": "fluent"})
    buddy = make(2, languages={"German": "home"})
    _, factors = score_pair(new, buddy, DEFAULT_WEIGHTS)
    assert next(f for f in factors if f.key == "language").similarity == 0.7


def test_partial_overlaps_and_grade_steps():
    new = make(1, interests=["Chess", "Music", "Art", "Dance"], clubs=["Choir", "Model UN"],
               availability=["Mon · Lunch", "Tue · Lunch", "Wed · Lunch", "Thu · Lunch"])
    buddy = make(2, grade=9, homeroom="9A", interests=["Chess"], clubs=["Choir"],
                 availability=["Mon · Lunch"], been_new=True)
    _, factors = score_pair(new, buddy, DEFAULT_WEIGHTS)
    sims = {f.key: f.similarity for f in factors}
    assert sims["interests"] == 1.0      # buddy listed one interest and it is shared
    assert sims["availability"] == 0.33  # 1 shared of min(4, 3)
    assert sims["clubs"] == 0.7          # one club in common
    assert sims["grade"] == 0.4          # one grade apart
    assert sims["been_new"] == 1.0


def test_missing_questionnaire_data_is_marked():
    new = make(1, interests=[], availability=[])
    _, factors = score_pair(new, make(2), DEFAULT_WEIGHTS)
    missing = {f.key for f in factors if f.missing}
    assert missing == {"availability", "interests"}


def test_weights_are_normalised_to_100():
    w = normalise_weights({"availability": 1, "interests": 1, "language": 0, "been_new": 0, "grade": 0, "clubs": 0})
    assert w["availability"] == 50 and w["interests"] == 50
    assert sum(normalise_weights({}).values()) == 100


def test_score_is_always_between_0_and_100():
    best = make(1, languages={"Hindi": "home"}, interests=["A", "B", "C"], clubs=["X", "Y"],
                availability=["Mon · Lunch", "Tue · Lunch", "Wed · Lunch"])
    twin = make(2, languages={"Hindi": "home"}, interests=["A", "B", "C"], clubs=["X", "Y"],
                availability=["Mon · Lunch", "Tue · Lunch", "Wed · Lunch"], been_new=True)
    score, _ = score_pair(best, twin, DEFAULT_WEIGHTS)
    assert score == 100
    stranger = make(3, grade=10, homeroom="", languages={"Welsh": "home"})
    score, _ = score_pair(best, stranger, DEFAULT_WEIGHTS)
    assert 0 <= score < 10


def test_fast_ranking_score_always_matches_full_breakdown():
    import random

    from app.matching.scoring import normalise_weights, quick_score
    from scripts.benchmark import mock

    rng = random.Random(42)
    weights = {"availability": 30, "interests": 15, "language": 25, "been_new": 5, "grade": 15, "clubs": 10}
    for w in (DEFAULT_WEIGHTS, weights):
        normalised = normalise_weights(w)
        for _ in range(3000):
            new, buddy = mock(1, rng, "new"), mock(2, rng, "buddy")
            full, _ = score_pair(new, buddy, w)
            assert quick_score(new, buddy, normalised) == full
