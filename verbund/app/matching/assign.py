"""Bulk matching: suggest one buddy for every new student at once.

Steps:
1. Eligibility (hard rules). A buddy must have volunteered and consented, be
   within one grade, and not have been declined for this student before.
   Buddies who fail a rule are counted with the reason, so staff can see *why*
   someone was never considered.
2. Every eligible pair is scored (see scoring.py).
3. The student with the most to lose chooses first. At each step, every
   waiting student's best available buddy is compared with their second best.
   The student with the biggest gap (their "regret") is given their best
   buddy first, because they would lose the most if someone else took that
   buddy. A student with only one good option has a big gap, so the students
   the report worries about ("harder to place at a glance") are protected,
   without letting a student with no good options at all take someone
   else's ideal buddy. This repeats until everyone is placed or no buddy
   has room left.

Ties go to the student with fewer eligible buddies, then by name and id, so
the same data always gives the same result.
"""

from collections import Counter
from dataclasses import dataclass, field

from .scoring import FactorResult, Profile, normalise_weights, quick_score, score_pair

MAX_GRADE_GAP = 1


@dataclass
class Candidate:
    new: Profile
    buddy: Profile
    score: int
    weights: dict[str, float]
    school_language: str
    _factors: list[FactorResult] | None = None

    @property
    def factors(self) -> list[FactorResult]:
        """The full text breakdown, built only for pairs someone will look at."""
        if self._factors is None:
            _, self._factors = score_pair(self.new, self.buddy, self.weights, self.school_language)
        return self._factors


@dataclass
class Suggestion:
    new_id: int
    buddy_id: int | None
    score: int
    factors: list[FactorResult]
    excluded: dict[str, int] = field(default_factory=dict)
    candidate_count: int = 0


def ineligible_reason(new: Profile, buddy: Profile, declined_pairs: set[tuple[int, int]]) -> str | None:
    if not buddy.willing:
        return "not volunteering"
    if not buddy.consented:
        return "no consent recorded"
    if abs(new.grade - buddy.grade) > MAX_GRADE_GAP:
        return "grade too far apart"
    if (new.id, buddy.id) in declined_pairs:
        return "declined before"
    return None


def rank_candidates(new: Profile, buddies: list[Profile], weights: dict[str, float],
                    school_language: str = "English",
                    declined_pairs: set[tuple[int, int]] | None = None) -> tuple[list[Candidate], Counter]:
    """All eligible buddies for one new student, best first, plus exclusion counts."""
    declined_pairs = declined_pairs or set()
    normalised = normalise_weights(weights)
    excluded: Counter = Counter()
    candidates: list[Candidate] = []
    for buddy in buddies:
        reason = ineligible_reason(new, buddy, declined_pairs)
        if reason:
            excluded[reason] += 1
            continue
        score = quick_score(new, buddy, normalised, school_language)
        candidates.append(Candidate(new, buddy, score, weights, school_language))
    candidates.sort(key=lambda c: (-c.score, c.buddy.last_name, c.buddy.first_name, c.buddy.id))
    return candidates, excluded


def assign(new_students: list[Profile], buddies: list[Profile], weights: dict[str, float],
           school_language: str = "English", used: dict[int, int] | None = None,
           declined_pairs: set[tuple[int, int]] | None = None) -> list[Suggestion]:
    """Suggest a buddy for each new student. `used` = places already taken per buddy."""
    ranked = {
        n.id: rank_candidates(n, buddies, weights, school_language, declined_pairs)
        for n in new_students
    }
    taken: Counter = Counter(used or {})
    waiting = {n.id: n for n in new_students}
    suggestions: list[Suggestion] = []

    def top_two(candidates: list[Candidate]) -> list[Candidate]:
        found = []
        for c in candidates:
            if taken[c.buddy.id] < c.buddy.capacity:
                found.append(c)
                if len(found) == 2:
                    break
        return found

    while waiting:
        best_key, pick = None, None
        for new in waiting.values():
            candidates, _ = ranked[new.id]
            options = top_two(candidates)
            if not options:
                continue
            regret = options[0].score - (options[1].score if len(options) > 1 else 0)
            key = (-regret, len(candidates), new.last_name, new.first_name, new.id)
            if best_key is None or key < best_key:
                best_key, pick = key, (new, options[0])
        if pick is None:
            break  # nobody left who can be placed
        new, chosen = pick
        candidates, excluded = ranked[new.id]
        excluded = Counter(excluded)
        higher = candidates[:candidates.index(chosen)]
        blocked = sum(1 for c in higher if taken[c.buddy.id] >= c.buddy.capacity)
        if blocked:
            excluded["scored higher but had no room"] += blocked
        taken[chosen.buddy.id] += 1
        del waiting[new.id]
        suggestions.append(Suggestion(new.id, chosen.buddy.id, chosen.score, chosen.factors,
                                      dict(excluded), len(candidates)))

    for new in waiting.values():  # no buddy with room
        candidates, excluded = ranked[new.id]
        excluded = Counter(excluded)
        if candidates:
            excluded["already has a new student"] += len(candidates)
        suggestions.append(Suggestion(new.id, None, 0, [], dict(excluded), len(candidates)))
    return suggestions
