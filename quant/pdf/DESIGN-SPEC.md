# Research-note PDF — design spec

Measured from `risk_parity_research_note.pdf` (the reference note supplied by Louis),
6 pages, produced by WeasyPrint 68.1. Every number below is extracted from the PDF
itself, not estimated. This is the source of truth for `pyportfolios-note.cls`.

## Page

| Property | Value |
|---|---|
| Trim | US Letter, 612 × 792 pt |
| Left / right margin | 39.6 pt (0.55 in) — symmetric |
| Text width | 532.8 pt |
| Columns | 2 × 255.4 pt, gutter 21.6 pt (col 2 starts x = 317.0) |
| First baseline (eyebrow) | y = 48.8 |
| Footer tab | navy rect 7.2 × 16.1 at x = 39.6, y = 753.4 |

Figures and full-width tables break out of the two-column grid to the full 532.8 pt measure.

## Colour

| Token | Hex | Use |
|---|---|---|
| `navy` | `#1a2c5b` | title, headings, footer tab, table header rules, KPI labels |
| `ink` | `#1a1a1a` | body text |
| `ink-secondary` | `#4a4a4a` | source lines, disclosures |
| `ink-muted` | `#6b6b6b` | eyebrow, small italics |
| `cream` | `#f2f0eb` | BOTTOM LINE panel, table header cells |
| `cream-light` | `#f8f7f3` | zebra table rows, code block ground |
| `rule` | `#e5e5e5` | hairlines (0.75 pt) |
| `rule-strong` | `#e0e0e0` | section divider (0.8 pt) |

## Type

Nimbus Sans in the reference = Helvetica clone. LaTeX equivalent: **TeX Gyre Heros**.
Code is DejaVu Sans Mono.

Every row below is verified against actual spans in the reference — not inferred from size alone.

| Size | Font | Colour | Leading | Role |
|---|---|---|---|---|
| 38 pt | Bold | navy | 38.8 pt | Note title |
| 18 pt | Bold | navy | — | **KPI value** |
| 12.5 pt | Bold | navy | — | **Section head** (9 in the note) |
| 12 pt | Regular | navy | 16.8 pt | Deck / standfirst |
| 11 pt | Regular | ink | 16.5 pt | Lede paragraph (opens a section) |
| 10 pt | Bold | navy | — | Subsection / run-in head (7 in the note) |
| 9.5 pt | Regular | ink | 13.8 pt | Body |
| 9.5 pt | Bold | ink | — | Glossary term |
| 9.5 pt | Italic | ink | — | Inline maths |
| 9 pt | Bold | navy | — | Masthead, `BOTTOM LINE` label, **figure title** |
| 9 pt | Regular | muted | — | Eyebrow (`Quantitative Insights`) |
| 9 pt | Regular | ink | — | BOTTOM LINE body |
| 8.5 pt | Bold | navy | — | Running footer |
| 8.5 pt | Regular | muted | — | Figure subtitle |
| 8 pt | Bold | navy | — | Table column header |
| 8 pt | Regular | ink | — | Table body cell |
| 8 pt | Regular | muted | — | KPI caption |
| 7.5 pt | Bold | muted | — | KPI label |
| 7.5 pt | Bold | navy | — | Table section band |
| 7.5 pt | Italic | muted | 10.5 pt | Figure source line |
| 7.5 pt | Regular | secondary | 10.5 pt | Disclosures body |
| 7.5 pt | Mono | ink | — | Code (inset 11.5 pt from margin) |

**Figure block order:** 9 pt bold navy title → 8.5 pt muted subtitle → full-measure
image → 7.5 pt italic muted source line.

## Components

**BOTTOM LINE panel** — one column wide, 255.4 × 117.4 at x = 317.0. Ground `cream`
(`#f2f0eb`) with a **2.2 pt navy left border** (measured: outer path x0 = 317.0, inner
x0 = 319.2 — WeasyPrint renders borders as an even-odd fill between nested rects).

**KPI stat row** (p. 3) — 4 cells at x = 39.6 / 175.8 / 312.0 / 448.2, each **124.2 pt
wide** with a **12 pt gutter**, block y = 69.8 → 122.6. Each cell is a **1.5 pt navy top
rule** (69.8 → 71.3) — no fill, no other borders — above:

| Element | Spec |
|---|---|
| Label | 7.5 pt Bold, `ink-muted` `#6b6b6b`, caps, baseline y = 79.0 |
| Value | 18 pt Bold, `navy`, baseline y = 91.1 |
| Caption | 8 pt Regular, `ink-muted`, baseline y = 112.8 |

**Metrics table** (p. 4) — header cells on `cream` with a 0.75 pt navy rule beneath;
body rows zebra-striped `cream-light`, separated by 0.75 pt `#e5e5e5` hairlines.
Column widths as measured: 207.3 / 96.6 / 135.5 / 93.4 pt. Section bands
(RETURN, RISK-ADJUSTED, DRAWDOWN, TAIL RISK, DISTRIBUTIONAL) are 9 pt bold ink rows.

**Code block** (p. 5) — full measure, `cream-light` ground, DejaVu Sans Mono 7.5 pt.

**Figures** — always full measure (532.8 pt), variable height; observed aspect ratios
2.96 – 5.31, i.e. wide and short. Each is followed by a 7.5 pt `ink-secondary` source line.
Source PNGs in the reference are ~1480 px wide (≈ 2.8× for print density).

**Running footer** — navy tab, then `RESEARCH · QUANTITATIVE INSIGHTS`, the short title,
and the page number.

## Page architecture

1. Eyebrow + kicker + 38 pt title + deck + two-column intro + BOTTOM LINE panel
2. Methodology + two full-measure figures with source lines
3. Page head + 4-up KPI row + two-column analysis + figure
4. Figure + full-measure banded metrics table
5. Interpretation + limitations + reproducibility code block
6. Two-column glossary + rule + disclosures block
