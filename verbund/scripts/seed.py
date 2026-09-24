"""Load the fictional demo data.

    python -m scripts.seed           # only if the database is empty
    python -m scripts.seed --reset   # wipe everything and reload the demo
"""

import argparse

from app.demo import seed

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--reset", action="store_true", help="delete all data first")
    args = parser.parse_args()
    seed(reset=args.reset)
    print("Demo data ready." if args.reset else "Demo data loaded (skipped if the database already had students).")
