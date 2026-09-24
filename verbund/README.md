# Verbund

Verbund suggests a buddy for every new student at an international school. It scores each
pairing with a weighted algorithm, shows the reasons behind every score, and leaves the final
decision to a teacher.

Stack (from the Design Brief's *Material* specification): **Python + FastAPI**, **SQLite**,
**plain HTML/CSS/JS** (Jinja2 templates, no build step), and optionally **Ollama** running
Qwen 2.5 Coder 7B locally for explanation text. Everything is free and open source.

There is **no sign-in**. Every page is one click away from the sidebar or the home page.

---

## Run it

You need **Python 3.10 or newer** ([python.org](https://www.python.org/downloads/); on Windows
tick *"Add python.exe to PATH"* during install).

**Windows:** double-click `run.bat` (or run it from PowerShell inside the `verbund` folder).

**macOS / Linux:**

```bash
cd verbund
./run.sh
```

The first run creates a virtual environment and installs the packages. Then open
<http://localhost:8000>.

On first start, Verbund fills an empty database with **fictional demo data**: 16 buddies, 8 new
students waiting for a buddy, and 6 pairs from last term with check-ins. **Settings → Restore demo
data** resets it at any time.

To add the local AI, follow [docs/OLLAMA_SETUP.md](docs/OLLAMA_SETUP.md). The app works fully
without it.

### Manual setup (if you prefer)

```bash
cd verbund
python -m venv .venv
.venv/bin/pip install -r requirements-dev.txt        # Windows: .venv\Scripts\pip ...
.venv/bin/uvicorn app.main:app --reload              # Windows: .venv\Scripts\uvicorn ...
```

---

## Pages

| Page | What it does |
|---|---|
| **Home** `/` | What Verbund is, the four steps, and a live pairing from the data |
| **Dashboard** | How many new students still need a buddy, suggestions waiting for review, flagged students, the "What's working" panel from check-ins, recent activity |
| **Students** | Roster with grade/role/status filters and search, status labels (Unmatched, Suggested, Matched, Manually reassigned), add/edit, CSV import, CSV export. The side panel shows each student's profile and pairings, and lets staff download or delete everything held about them. |
| **Matching** | Run matching for every new student at once, see the ranked list, filter by grade/strength/status, bulk approve, export CSV, and download a blind comparison sheet for the expert evaluation |
| **Review** | The score, the explanation, the side-by-side table with shared traits highlighted, and the buddies that were not considered and why. Actions: approve, decline, or choose a different buddy (a reason is required and logged). |
| **Settings** | Factor weights (versioned), school language and interest list, the local AI's status, privacy and retention, and the audit log |
| **Questionnaire** `/intake/{id}` | The student-facing form: consent, languages, interests, free times, whether they have been new before (buddies also volunteer and choose how many they can take) |
| **Check-in** `/checkin/{pair}/{new or buddy}` | The two-week feedback form for each student in a confirmed pair |

## How the score works

Every eligible pair gets points for six factors. The weights add up to 100 and can be changed
in Settings.

| Factor | Default points | Full points when… |
|---|---|---|
| Free at the same times | 25 | 3 or more free slots in common |
| Shared interests | 20 | 3 or more interests in common |
| Shared language | 20 | the buddy speaks the new student's home language. Another shared language gets 70%; only the school language gets 30%. |
| Buddy has been new before | 15 | the buddy was once the new student |
| Same grade or homeroom | 10 | same homeroom. Same grade gets 80%; one grade apart gets 40%. |
| Shared clubs | 10 | 2 or more clubs in common (one club gets 70%) |

**Eligibility.** A buddy is only considered if they volunteered, gave consent, are within one
grade, and were not declined for this student before.

**Assignment.** Suggestions for all new students are made together. At each step, the student
with the most to lose (the biggest gap between their best and second-best available buddy)
gets their best buddy first. This protects students who have only one good option. The same
data always gives the same result.

The code is in `app/matching/`: `scoring.py`, `assign.py` and `insights.py`. It has no database
or AI inside it, so it is easy to test and explain.

## Tests and benchmark

```bash
.venv/bin/python -m pytest              # 35 tests: scoring maths, assignment, explanations, every page and action
.venv/bin/python -m scripts.benchmark   # timing on mock data (Specification 8)
```

## Privacy (Specification 6)

- **Not collected:** nationality, gender, religion or ethnicity.
- **Where data lives:** one SQLite file (`data/verbund.db`), which is git-ignored and never served to the browser.
- **The local AI** runs on the same machine and receives only first names and the score breakdown.
- **Audit log:** views, exports, decisions, weight changes and deletions are all recorded.
- **Student rights:** any student's data can be downloaded (JSON) or deleted from their profile.
- **Retention:** old records can be anonymised. Names and details are removed; scores and ratings are kept.
- **Content-Security-Policy:** the browser only loads files from Verbund itself. Fonts and icons are self-hosted.
- **Removed on request:** there is no sign-in or role-based access in this version. Before real student data is used, you would need to add sign-in back.

## Project structure

```
verbund/
  app/
    main.py            app setup, security headers
    routes.py          every page and form action
    matches.py         matching runs, decisions, check-ins, dashboard numbers
    students.py        student records, CSV import/export
    demo.py            fictional demo data
    matching/          scoring.py, assign.py, insights.py (the algorithm)
    explain/           template.py (fallback text), ollama.py, worker.py (background queue)
    templates/         Jinja2 HTML
    static/            css/tokens.css, css/app.css, js/, fonts/ (self-hosted), icons/sprite.svg
  scripts/             seed.py, benchmark.py
  tests/
  docs/                DESIGN_SYSTEM.md, BUILD_PLAN.md, TESTING.md, OLLAMA_SETUP.md
```
