"""Close the loop: which factors went with pairs that students rated highly?

For each factor, confirmed pairs are split into "strong on this factor"
(similarity >= 0.7) and "weak on this factor". The panel compares the average
check-in rating of the two groups. It only *suggests*; an admin decides
whether to change the weights, which keeps teachers in control.
"""

from statistics import mean

from .scoring import FACTOR_LABELS, FACTOR_KEYS

MIN_RESPONSES = 5
STRONG_SIMILARITY = 0.7


def factor_insights(pairs: list[tuple[list[dict], float]]) -> list[dict]:
    """`pairs` = [(breakdown factors, average rating 1-5), ...] for rated pairs."""
    out = []
    for key in FACTOR_KEYS:
        high, low = [], []
        for factors, rating in pairs:
            factor = next((f for f in factors if f["key"] == key), None)
            if factor is None:
                continue
            (high if factor["similarity"] >= STRONG_SIMILARITY else low).append(rating)
        if not high or not low:
            continue
        out.append({
            "key": key,
            "label": FACTOR_LABELS[key],
            "high_avg": round(mean(high), 1),
            "high_n": len(high),
            "low_avg": round(mean(low), 1),
            "low_n": len(low),
            "difference": round(mean(high) - mean(low), 1),
        })
    out.sort(key=lambda row: -row["difference"])
    return out
