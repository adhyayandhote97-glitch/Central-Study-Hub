"""Reliability and performance test (Specification 8).

Generates mock students, runs the matching algorithm several times, and
reports how long it takes and whether any run failed.

    python -m scripts.benchmark
    python -m scripts.benchmark --sizes 20x80 100x400 300x1200 --runs 5
"""

import argparse
import random
import statistics
import time

from app.matching.assign import assign
from app.matching.scoring import DEFAULT_WEIGHTS, SLOTS, Profile

LANGUAGES = ["English", "Hindi", "Korean", "Japanese", "Mandarin", "Spanish", "Arabic", "French", "German",
             "Portuguese", "Tamil", "Turkish", "Italian", "Urdu", "Bengali"]
INTERESTS = ["Football", "Basketball", "Badminton", "Cricket", "Swimming", "Dance", "Chess", "Coding", "Robotics",
             "Science", "Reading", "Writing", "Drawing", "Photography", "Film", "Music", "Theatre", "Debate",
             "Gaming", "Cooking"]
CLUBS = ["Robotics Club", "Model UN", "Choir", "Drama Society", "Eco Club", "Football Team", "Art Studio",
         "Debate Society", "Coding Club", "Basketball Team", "Chess Club"]


def mock(pid: int, rng: random.Random, role: str) -> Profile:
    grade = rng.randint(6, 12)
    home = rng.choice(LANGUAGES)
    languages = {home: "home", "English": "fluent" if home != "English" else "home"}
    if rng.random() < 0.4:
        languages[rng.choice(LANGUAGES)] = "fluent"
    return Profile(
        id=pid, first_name=f"S{pid}", last_name="Mock", grade=grade, homeroom=f"{grade}{rng.choice('ABCD')}",
        languages=languages, interests=set(rng.sample(INTERESTS, rng.randint(1, 5))),
        clubs=set(rng.sample(CLUBS, rng.randint(0, 2))), availability=set(rng.sample(SLOTS, rng.randint(1, 6))),
        been_new_before=rng.random() < 0.4, capacity=rng.choice([1, 1, 2]) if role == "buddy" else 1,
        willing=rng.random() < 0.9 if role == "buddy" else True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Time the matching algorithm on mock data.")
    parser.add_argument("--sizes", nargs="+", default=["10x40", "30x120", "60x240", "150x600", "300x1200"],
                        help="NEWxBUDDIES pairs")
    parser.add_argument("--runs", type=int, default=5)
    args = parser.parse_args()

    print(f"{'New':>5} {'Buddies':>8} {'Pairs scored':>13} {'Median ms':>10} {'Slowest ms':>11} "
          f"{'Placed':>7} {'Errors':>7}")
    for size in args.sizes:
        n_new, n_buddies = (int(x) for x in size.lower().split("x"))
        times, errors, placed = [], 0, 0
        for run in range(args.runs):
            rng = random.Random(run)
            new = [mock(i, rng, "new") for i in range(n_new)]
            buddies = [mock(100_000 + i, rng, "buddy") for i in range(n_buddies)]
            start = time.perf_counter()
            try:
                result = assign(new, buddies, DEFAULT_WEIGHTS)
                placed = sum(1 for s in result if s.buddy_id)
            except Exception as exc:  # recorded, not hidden
                errors += 1
                print("  error:", exc)
            times.append((time.perf_counter() - start) * 1000)
        print(f"{n_new:>5} {n_buddies:>8} {n_new * n_buddies:>13,} {statistics.median(times):>10.1f} "
              f"{max(times):>11.1f} {placed:>7} {errors:>7}")


if __name__ == "__main__":
    main()
