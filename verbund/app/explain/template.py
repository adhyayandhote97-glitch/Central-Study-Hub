"""Plain-language explanation built directly from the score breakdown.

This is used straight away for every suggestion, and stays in place whenever
Ollama is not running. It never says anything the breakdown does not contain.
"""

from ..matching.scoring import band

DAY_NAMES = {"Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", "Thu": "Thursday", "Fri": "Friday"}
BAND_WORDS = {"strong": "a strong match", "good": "a good match", "weak": "a weak match that needs a teacher's eye"}


def slot_words(slot: str) -> str:
    """'Mon · Lunch' -> 'Monday lunch'."""
    day, _, period = slot.partition(" · ")
    return f"{DAY_NAMES.get(day, day)} {period.lower()}".strip()


def join_and(items: list[str]) -> str:
    items = [i for i in items if i]
    if len(items) <= 1:
        return "".join(items)
    return ", ".join(items[:-1]) + " and " + items[-1]


def join_clauses(clauses: list[str]) -> str:
    """Join clauses that may contain 'and' themselves, keeping them readable."""
    clauses = [c for c in clauses if c]
    if len(clauses) <= 1:
        return "".join(clauses)
    if any(" and " in c for c in clauses):
        return "; ".join(clauses[:-1]) + "; and " + clauses[-1]
    return ", ".join(clauses[:-1]) + " and " + clauses[-1]


def factor_phrase(factor: dict, new_first: str, buddy_first: str) -> str:
    """What the pair has in common on one factor."""
    key, shared = factor["key"], factor["shared"]
    if key == "availability":
        return f"they are both free on {join_and([slot_words(s) for s in shared[:3]])}"
    if key == "interests":
        return f"they both like {join_and([s.lower() for s in shared[:3]])}"
    if key == "language":
        if factor["similarity"] >= 1:
            return f"they both speak {shared[0]}, {new_first}'s home language"
        return f"they both speak {join_and(shared[:2])}"
    if key == "been_new":
        return f"{buddy_first} has been the new student before"
    if key == "grade":
        if factor["similarity"] >= 1:
            return f"they share a homeroom ({shared[0]})" if shared else "they share a homeroom"
        if factor["similarity"] >= 0.8:
            return "they are in the same grade"
        return "they are one grade apart"
    if key == "clubs":
        return f"they are both in {join_and(shared[:2])}"
    return factor["note"][:1].lower() + factor["note"][1:]


def gap_phrase(factor: dict, new_first: str, buddy_first: str) -> str:
    """What the pair does not have in common on one factor."""
    return {
        "availability": "they have no free time in common",
        "interests": "they share no interests",
        "language": "they share no language",
        "been_new": f"{buddy_first} has not been new at a school before",
        "grade": "they are in different grades",
        "clubs": "they are not in any of the same clubs",
    }.get(factor["key"], factor["label"].lower())


def template_explanation(new_first: str, buddy_first: str, score: int, factors: list[dict]) -> str:
    strong = sorted((f for f in factors if f["points"] > 0 and f["similarity"] >= 0.7),
                    key=lambda f: -f["points"])
    partial = sorted((f for f in factors if 0 < f["similarity"] < 0.7), key=lambda f: -f["points"])
    unknown = [f for f in factors if f.get("missing")]
    gaps = sorted((f for f in factors if f["similarity"] == 0 and f["weight"] > 0 and not f.get("missing")),
                  key=lambda f: -f["weight"])

    sentences = [f"{buddy_first} scores {score} out of 100 as a buddy for {new_first}, "
                 f"which is {BAND_WORDS[band(score)]}."]
    reasons = strong[:3] or partial[:2]
    if reasons:
        lead = "Most of the points come from this:" if strong else "The points come from this:"
        phrases = [factor_phrase(f, new_first, buddy_first) for f in reasons]
        sentences.append(f"{lead} {join_clauses(phrases)}.")
    if unknown:
        labels = join_and(["free times" if f["key"] == "availability" else "interests" for f in unknown])
        sentences.append(f"{new_first} has not given their {labels} yet, so they could not count.")
    if gaps:
        phrases = [gap_phrase(f, new_first, buddy_first) for f in gaps[:2]]
        sentences.append("On the other hand, " + join_clauses(phrases) + ".")
    return " ".join(sentences)
