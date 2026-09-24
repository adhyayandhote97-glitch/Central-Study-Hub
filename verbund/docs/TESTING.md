# Testing against the design specifications (for Criteria D)

Each specification from Criteria B strand i, how this build supports it, and how to test it.

| # | Specification | What the build does | How to test it |
|---|---|---|---|
| 1 | **Aesthetics** | Design 3 palette, serif headings, light/dark mode, one dominant element per page (`docs/DESIGN_SYSTEM.md`) | **User survey:** teachers, admins, an expert and students rate the look from 0–6 |
| 2 | **Organisation and navigation** | Every page is one click from the sidebar or home page. The four core pages sit in the order of the task (Students → Matching → Review → Dashboard). There is no sign-in. | **Survey + timed tasks:** time how long each person takes for the task list below, and have them rate each task 0–5 |
| 3 | **Matching accuracy** | Weighted score with visible breakdown; "most to lose picks first" assignment | **Expert evaluation:** Matching → *blind comparison sheet* (CSV). The expert writes their own pick for each new student first, then compares with Verbund's. |
| 4 | **Compatibility** | Plain HTML/CSS/JS, no build step; responsive from 320px to 1440px+; no horizontal scrolling | **Self testing:** Chrome, Edge, Firefox, Safari, Opera GX on Windows and macOS, plus an Android phone and an iPhone. Check each page at phone and laptop width in light and dark mode. |
| 5 | **Utility** | Verb-first labels, one primary button per view, empty states that say what to do next | **User acceptance testing:** the task list below, done without help, rated 0–5 |
| 6 | **Data privacy and legal compliance** | Data minimisation (no nationality/gender/religion); consent recorded with version and date; audit log; download/delete per student; anonymising by retention period; local-only AI; strict Content-Security-Policy; data file git-ignored | **Expert evaluation:** walk the expert through Settings → Privacy and data, the audit log, a student's *Download data* and *Delete*. Note that this version has no sign-in (removed at the client's request). |
| 7 | **Content and explanation quality** | Every pairing has an explanation built only from its own breakdown. With Ollama, the local model rewrites it, and bad replies are rejected. | **Expert and peer evaluation:** for 8 pairings, check that each explanation matches the side-by-side table |
| 8 | **Reliability and performance** | Matching is pure Python and the AI runs in the background, so pages never wait for it | **Self testing:** `python -m scripts.benchmark` (results below) and the 35 automated tests (`python -m pytest`) |

## Task list for Specs 2 and 5 (user acceptance testing)

Give each tester this list with no other help. Time each task and ask for a 0–5 ease rating.

1. Find out how many new students still need a buddy.
2. Add a new student called *Ravi Shah*, Grade 8, homeroom 8A, who speaks Gujarati at home.
3. Open Ravi's questionnaire and fill it in.
4. Run matching.
5. Open the weakest suggestion and explain, in your own words, why it scored low.
6. Choose a different buddy for that student and give a reason.
7. Approve all the remaining suggestions at once.
8. Export the list of pairings as a CSV file.
9. Find where the change you made in task 6 was recorded.
10. Download everything Verbund holds about one student.

## Benchmark results (Spec 8)

This was run in the development container: 5 runs per size, with random mock students. The
weighted algorithm only; explanations are written in the background.

| New students | Buddies | Pairs scored | Median time | Slowest run | Placed | Errors |
|---:|---:|---:|---:|---:|---:|---:|
| 20 | 80 | 1,600 | 3.9 ms | 4.5 ms | 20 | 0 |
| 60 | 240 | 14,400 | 23.7 ms | 30.0 ms | 60 | 0 |
| 150 | 600 | 90,000 | 188 ms | 206 ms | 150 | 0 |
| 300 | 1,200 | 360,000 | 738 ms | 762 ms | 300 | 0 |

A school intake of a few dozen new students takes well under a tenth of a second. Re-run the
benchmark on the school's own computer and record those numbers in Criteria D.

With Ollama, each explanation takes about 3–60 seconds depending on the computer. These run
one at a time in the background, and each Review page updates when its explanation is ready.
