# Criteria C strand i: build plan

This plan follows the 8-day implementation timeline from Criteria A strand iv. Someone else
could rebuild Verbund by following it. Each row names the files it produces, so the plan can
be checked against the finished code.

| Sr. No | Task | Description | Process to achieve | Resources | Time |
|---|---|---|---|---|---|
| 1 | Finalise spec and content (Day 1) | Lock the six scoring factors and their weights, the questionnaire fields, and the demo data | Map each factor to the research answers (Erasmus+ 92.6% contact, 54.6% interests, survey). Choose what *not* to collect (nationality, gender, religion). Write fictional demo students. | Report, Google Docs | 3 h |
| 2 | Project setup (Day 2) | Folder structure, virtual environment, dependencies | `python -m venv .venv`; install FastAPI, Uvicorn, Jinja2, httpx; create `app/`, `tests/`, `scripts/`, `docs/`; commit to git | Python, VS Code, Git | 1.5 h |
| 3 | Database (Day 2) | Tables for students, attributes, weights, runs, matches, check-ins, audit log, settings | Write `app/schema.sql`; `app/db.py` opens one connection per request, with foreign keys on; seed script `app/demo.py` | SQLite | 2 h |
| 4 | Branding / design system (Day 3) | Colour tokens, fonts, icons, component styles | Design 3 palette as CSS custom properties with a separate dark set; self-host Newsreader + Atkinson Hyperlegible; build a Phosphor SVG sprite; check contrast (`docs/DESIGN_SYSTEM.md`) | CSS, Phosphor, Google Fonts files | 3 h |
| 5 | Core layout (Day 3) | Base page, sidebar (from Design 5), theme toggle, mobile top bar | `templates/layout.html`, `staff.html`, `macros.html`; `static/js/theme-init.js` stops the theme flashing on load | HTML, CSS, JS | 2 h |
| 6 | Navigation and page layouts (Day 4) | Home, Dashboard, Students, Matching, Review, Settings, all linked with no sign-in | `app/routes.py` with one function per page; shared flash messages and "last updated" partial | FastAPI, Jinja2 | 3 h |
| 7 | Student data input (Day 5) | Add/edit, CSV import/export, questionnaire with consent | `app/students.py` (parse and validate the CSV, escape formulas on export); `templates/intake.html` (5 numbered sections) | FastAPI, HTML forms | 4 h |
| 8 | Scoring algorithm (Day 6) | Weighted compatibility score and eligibility rules | `app/matching/scoring.py` (pure functions); hand-calculated unit tests in `tests/test_scoring.py` | Python, pytest | 3 h |
| 9 | Matching dashboard (Day 6) | Suggest a buddy for everyone at once, ranked list, filters, bulk approve | `app/matching/assign.py` ("most to lose picks first"); `templates/matching.html` | Python, JS | 3 h |
| 10 | Explanations (Day 7) | Plain-language "why this pair" | `app/explain/template.py` (always available); `ollama.py` + `worker.py` (local AI in a background queue, rejects bad replies) | Ollama, Qwen 2.5 Coder 7B | 3 h |
| 11 | Override and feedback (Day 7) | Approve / decline / choose a different buddy with a reason; two-week check-ins; "What's working" panel | `app/matches.py`; `templates/review.html`, `checkin.html`; `app/matching/insights.py` | FastAPI | 3 h |
| 12 | Privacy and settings (Day 7) | Versioned weights, retention, data download/delete, audit log, security headers | `templates/settings.html`; Content-Security-Policy in `app/main.py` | FastAPI | 2 h |
| 13 | Test and fix (Day 8) | Unit and page tests, browser/device checks, performance | `pytest` (35 tests); Playwright screenshots at 320–1440px in light and dark; `scripts/benchmark.py` | pytest, Chrome, Playwright | 4 h |

**Total:** about 36.5 hours over 8 days.
