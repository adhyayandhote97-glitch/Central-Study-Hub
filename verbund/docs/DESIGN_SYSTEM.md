# Verbund design system

This is a locked rulebook, so the interface looks designed rather than generated. The colour
and spacing values live in `app/static/css/tokens.css`, and components only use those tokens.

The base is **Design 3** from Criteria B: Sienna, Rusty Brown, Dusty Rose and Floral White,
serif headings, and a light/dark toggle. On top of that come the **left sidebar from Design
5** and the four amendments (status labels, a "last updated" indicator, extra row spacing,
and Export CSV).

## Rules that avoid the "AI-generated" look

| Default look to avoid | What Verbund does instead |
|---|---|
| Inter / Roboto / Arial | **Newsreader** (editorial serif) for headings; **Atkinson Hyperlegible Next** for body text; **Atkinson Hyperlegible Mono** for scores. Atkinson was designed by the Braille Institute for legibility, which suits students and staff reading English as an additional language. All fonts are self-hosted. |
| Purple/indigo gradients, glow | Warm, solid Design 3 colours. No gradients anywhere. |
| Glassmorphism cards | Solid surfaces with a 1px border, 4px radius on controls and 6px on panels. No blur, and no shadows except the focus ring. |
| Centred row of three equal cards | The dashboard leads with **one big number**, then a thin stat strip, then an asymmetric 2/3 + 1/3 split. The Review page is main column + narrow decision column. |
| Every heading the same polite size | One dominant element per page: the headline number (Dashboard), the ranked list (Matching), the score (Review). Page titles are 48px serif; body text is 17px. |
| Stock photos / AI illustrations | None. The home page shows a **real pairing rendered from the data**. Screenshots in the report come from the running app. |
| Mixed icon sets | Phosphor Regular only, from one self-hosted SVG sprite. |
| Buzzword copy | Plain, specific, verb-first labels ("Approve pairing", "Choose a different buddy"). Banned: *seamless, unlock, empower, AI-powered, leverage, elevate, revolutionise, effortless*. |

## Colour tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#fffaf0` Floral White | `#1c1512` | page background |
| `--surface` | `#ffffff` | `#251c18` | panels, sidebar |
| `--ink` | `#2a1d17` | `#f5ebdd` | main text |
| `--ink-2` / `--ink-3` | `#5e4a40` / `#74625a` | `#cdbcaa` / `#a8958a` | secondary text / hints |
| `--sienna` | `#a0522d` Sienna | `#d98a62` | primary action, accents |
| `--sienna-hover` | `#7a3a1e` Rusty Brown | `#eaa27c` | hover and pressed |
| `--rose` / `--rose-tint` | `#c9918a` Dusty Rose / `#f6e3df` | `#d7a8a1` / `#4a2c2a` | shared-trait highlight, "why" rule |

Every text/background pair passes **WCAG AA (4.5:1)**, and form control borders pass
**3:1**. Both were checked with a contrast script during the build.

**Status labels** always show a text label as well as a colour: Matched (moss), Suggested
(sienna on rose), Manually reassigned (plum), Unmatched (stone), Declined (rust),
Weak/Full (ochre).

## The score bar (the signature element)

The score bar is one stacked horizontal bar. Each coloured segment is the points one factor
earned, and the pale remainder is the points the pair did not earn. The same six colours are
used on every page, always with a legend.

| Factor | Light | Dark |
|---|---|---|
| Free at the same times | `#2a6db3` | `#4f95dd` |
| Shared interests | `#c0602e` | `#cf7445` |
| Shared language | `#00928a` | `#00a396` |
| Buddy has been new before | `#6a5bb0` | `#8f82dd` |
| Same grade or homeroom | `#b08a10` | `#b08a20` |
| Shared clubs | `#b04a7e` | `#c8619a` |

This palette and order were validated for colour-blind separation (protanopia/deuteranopia
ΔE ≥ 10.9), normal-vision separation (ΔE ≥ 19.4) and ≥ 3:1 contrast, in both modes.

## Type and spacing

- **Type scale:** 48 / 32 / 22 / 17 / 15 / 13 px. Page titles use Newsreader 600; labels are uppercase 13px with tracking.
- **Spacing:** 4px base: 4, 8, 12, 16, 24, 32, 48, 64.
- **Table rows:** 52px tall (amendment 3).
- **Layout:** sidebar 240px; content max-width 1120px. Below 900px the sidebar becomes a top bar with a scrollable row of links.

## Buttons

| Kind | Look | Rule |
|---|---|---|
| Primary | solid sienna | at most one per view |
| Secondary | ink outline on surface | |
| Quiet | underlined text | |
| Danger | rust outline | always confirms first |

All buttons are 40px tall with sentence-case, verb-first labels.
