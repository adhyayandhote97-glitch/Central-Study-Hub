"""Weighted compatibility score for one (new student, buddy) pair.

Pure functions only: no database, no AI. The same inputs always give the same
score, which is what makes every suggestion explainable and testable.

Each factor produces a similarity between 0 and 1. Its points are
`weight x similarity`, and the score is the sum of the points (0-100).
The default weights come from the research in Criteria A strand ii:

- availability 25: Erasmus+ found frequency of contact the strongest
  predictor (92.6%); Widstrand found mismatched free time a common failure.
- interests 20: Erasmus+ (54.6%) and the student survey.
- language 20: an Erasmus+ criterion; the survey named shared language.
- been_new 15: the survey asked for "a buddy who had also been new".
- grade 10: being in the same grade or homeroom makes contact easier.
- clubs 10: data the school already holds.
"""

from dataclasses import asdict, dataclass, field

FACTORS: list[tuple[str, str]] = [
    ("availability", "Free at the same times"),
    ("interests", "Shared interests"),
    ("language", "Shared language"),
    ("been_new", "Buddy has been new before"),
    ("grade", "Same grade or homeroom"),
    ("clubs", "Shared clubs"),
]
FACTOR_LABELS = dict(FACTORS)
FACTOR_KEYS = [key for key, _ in FACTORS]

DEFAULT_WEIGHTS: dict[str, int] = {
    "availability": 25,
    "interests": 20,
    "language": 20,
    "been_new": 15,
    "grade": 10,
    "clubs": 10,
}

STRONG = 75  # score >= 75 is a strong match
GOOD = 55    # 55-74 is good; below 55 is flagged for a teacher to look at


@dataclass
class Profile:
    id: int
    first_name: str
    last_name: str
    grade: int
    homeroom: str = ""
    languages: dict[str, str] = field(default_factory=dict)  # language -> home | fluent | learning
    interests: set[str] = field(default_factory=set)
    clubs: set[str] = field(default_factory=set)
    availability: set[str] = field(default_factory=set)
    been_new_before: bool = False
    willing: bool = True
    capacity: int = 1
    consented: bool = True

    @property
    def name(self) -> str:
        return f"{self.first_name} {self.last_name}"


@dataclass
class FactorResult:
    key: str
    label: str
    weight: float
    similarity: float
    points: float
    shared: list[str]
    note: str
    missing: bool = False  # the new student has not given this information yet

    def to_dict(self) -> dict:
        return asdict(self)


def band(score: int) -> str:
    if score >= STRONG:
        return "strong"
    if score >= GOOD:
        return "good"
    return "weak"


def normalise_weights(weights: dict[str, float]) -> dict[str, float]:
    """Scale weights so they add up to 100 (missing factors count as 0)."""
    clean = {key: max(0.0, float(weights.get(key, 0))) for key in FACTOR_KEYS}
    total = sum(clean.values())
    if total == 0:
        return {key: float(value) for key, value in DEFAULT_WEIGHTS.items()}
    return {key: value * 100 / total for key, value in clean.items()}


def _overlap(a: set[str], b: set[str], cap: int = 3) -> tuple[float, list[str]]:
    """Shared items / min(len(a), len(b), cap), capped at 1. Three shared = full marks."""
    shared = sorted(a & b)
    denom = min(len(a), len(b), cap)
    if denom == 0:
        return 0.0, shared
    return min(1.0, len(shared) / denom), shared


def _availability(new: Profile, buddy: Profile) -> tuple[float, list[str], str]:
    shared = sorted(new.availability & buddy.availability, key=_slot_order)
    denom = min(len(new.availability), 3)
    if denom == 0:
        return 0.0, [], f"{new.first_name} has not said when they are free"
    sim = min(1.0, len(shared) / denom)
    if not shared:
        return sim, shared, "No free time in common"
    return sim, shared, f"{len(shared)} free slot{'s' if len(shared) != 1 else ''} in common"


def _language(new: Profile, buddy: Profile, school_language: str) -> tuple[float, list[str], str]:
    shared = set(new.languages) & set(buddy.languages)
    other = sorted(lang for lang in shared if lang.lower() != school_language.lower())
    home = [lang for lang in other if new.languages.get(lang) == "home"]
    if home:
        return 1.0, home, f"Both speak {home[0]}, {new.first_name}'s home language"
    if other:
        return 0.7, other, f"Both speak {other[0]}"
    if shared:
        return 0.3, sorted(shared), f"Only {school_language}, the school language, in common"
    return 0.0, [], "No language in common"


def _grade(new: Profile, buddy: Profile) -> tuple[float, list[str], str]:
    if new.grade == buddy.grade:
        if new.homeroom and new.homeroom == buddy.homeroom:
            return 1.0, [new.homeroom], f"Same homeroom ({new.homeroom})"
        return 0.8, [f"Grade {new.grade}"], f"Same grade (Grade {new.grade})"
    if abs(new.grade - buddy.grade) == 1:
        return 0.4, [], f"One grade apart (Grade {buddy.grade})"
    return 0.0, [], "Different grades"


def _clubs(new: Profile, buddy: Profile) -> tuple[float, list[str], str]:
    shared = sorted(new.clubs & buddy.clubs)
    if len(shared) >= 2:
        return 1.0, shared, f"{len(shared)} clubs in common"
    if len(shared) == 1:
        return 0.7, shared, f"Both in {shared[0]}"
    return 0.0, [], "No clubs in common"


def score_pair(new: Profile, buddy: Profile, weights: dict[str, float],
               school_language: str = "English") -> tuple[int, list[FactorResult]]:
    """Return (score 0-100, per-factor breakdown) for one pair."""
    w = normalise_weights(weights)
    results: list[FactorResult] = []

    sim, shared, note = _availability(new, buddy)
    results.append(_result("availability", w, sim, shared, note, missing=not new.availability))

    sim, shared = _overlap(new.interests, buddy.interests)
    note = (f"{len(shared)} interest{'s' if len(shared) != 1 else ''} in common"
            if shared else "No interests in common")
    if not new.interests:
        note = f"{new.first_name} has not listed interests yet"
    results.append(_result("interests", w, sim, shared, note, missing=not new.interests))

    sim, shared, note = _language(new, buddy, school_language)
    results.append(_result("language", w, sim, shared, note))

    if buddy.been_new_before:
        results.append(_result("been_new", w, 1.0, [], f"{buddy.first_name} has been new at a school before"))
    else:
        results.append(_result("been_new", w, 0.0, [], f"{buddy.first_name} has not been new at a school"))

    sim, shared, note = _grade(new, buddy)
    results.append(_result("grade", w, sim, shared, note))

    sim, shared, note = _clubs(new, buddy)
    results.append(_result("clubs", w, sim, shared, note))

    total = round(sum(r.points for r in results))
    return total, results


def similarities(new: Profile, buddy: Profile, school_language: str = "English") -> dict[str, float]:
    """Fast path used to rank thousands of pairs: the same maths as score_pair,
    without building the text breakdown. tests/test_scoring.py checks that
    both always agree."""
    na = new.availability
    availability = min(1.0, len(na & buddy.availability) / min(len(na), 3)) if na else 0.0

    denom = min(len(new.interests), len(buddy.interests), 3)
    interests = min(1.0, len(new.interests & buddy.interests) / denom) if denom else 0.0

    shared = new.languages.keys() & buddy.languages.keys()
    school = school_language.lower()
    other = [lang for lang in shared if lang.lower() != school]
    if any(new.languages[lang] == "home" for lang in other):
        language = 1.0
    elif other:
        language = 0.7
    elif shared:
        language = 0.3
    else:
        language = 0.0

    if new.grade == buddy.grade:
        grade = 1.0 if new.homeroom and new.homeroom == buddy.homeroom else 0.8
    else:
        grade = 0.4 if abs(new.grade - buddy.grade) == 1 else 0.0

    n_clubs = len(new.clubs & buddy.clubs)
    clubs = 1.0 if n_clubs >= 2 else 0.7 if n_clubs == 1 else 0.0

    return {"availability": availability, "interests": interests, "language": language,
            "been_new": 1.0 if buddy.been_new_before else 0.0, "grade": grade, "clubs": clubs}


def quick_score(new: Profile, buddy: Profile, normalised_weights: dict[str, float],
                school_language: str = "English") -> int:
    sims = similarities(new, buddy, school_language)
    # Round each factor the way score_pair does, so both paths agree exactly.
    return round(sum(round(normalised_weights[k] * sims[k], 1) for k in FACTOR_KEYS))


def _result(key: str, weights: dict[str, float], sim: float, shared: list[str], note: str,
            missing: bool = False) -> FactorResult:
    weight = weights[key]
    return FactorResult(
        key=key,
        label=FACTOR_LABELS[key],
        weight=round(weight, 1),
        similarity=round(sim, 2),
        points=round(weight * sim, 1),
        shared=list(shared),
        note=note,
        missing=missing,
    )


# Availability slots are stored as "Mon · Lunch" so they read well in the UI.
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
PERIODS = ["Before school", "Break", "Lunch", "After school"]
SLOTS = [f"{day} · {period}" for day in DAYS for period in PERIODS]
_SLOT_INDEX = {slot: i for i, slot in enumerate(SLOTS)}


def _slot_order(slot: str) -> int:
    return _SLOT_INDEX.get(slot, len(SLOTS))
