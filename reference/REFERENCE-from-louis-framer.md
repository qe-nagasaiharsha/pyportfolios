# Build reference — Louis's liked Framer site → pyportfolios spec

Source (Louis, upwork chat lines 494–501):
- Home:    https://expensive-sparrow-736232.framer.app/home
- Article: https://expensive-sparrow-736232.framer.app/article-page

Captured full-page: `reference/framer-home.png`, `reference/framer-article.png`.

> **Critical framing.** Louis said the article page is *"just a clone from a matlab site"* and the
> template is the generic **"Message AI"** Framer theme. So we borrow this site's **information
> architecture / structure / content order — NOT its visual look.** The *look* comes from our
> valid brand deck (`...2026-05-28-vf.pptx`) + the fin.ai quality bar = our "Quant Research House"
> theme (Lora / Switzer / Courier · navy / sisal / aqua). **Structure from Framer, skin from brand.**

---

## A. Landing page — section order to adopt

Louis's home page section order maps almost 1:1 onto his Milestone-1 "must-haves." Adopt it:

| # | Framer section | Content | Our brand must-have it satisfies |
|---|---|---|---|
| Hero | "Get up to Speed" | "Coding the markets. Technical depth, real-world context, intellectual clarity. Without the noise." + CTA | Slogan family matches brand deck ("Get up to speed · Cancel the noise · Find your edge") |
| 01 | **Our Focus** | Coding / Trading / Markets — 3 pillars w/ bullets | focus (coding, markets, trading/portfolio optimization) |
| 02 | **Markets** | global exchanges, derivatives, asset classes, case studies | markets (asset classes, instruments, sectors) |
| 03 | **Libraries** | 3-step Idea/Problem → Code & Implement → Test; Python stack | libraries (python) |
| 04 | **Models** | 6 groups: bond pricing · portfolio construction · ML · signal generation · risk engines · analytics | concepts/models |
| 05 | **Geographies** | top 15 economies | geographies (top 15 economies) |
| 06 | **Pricing** | Free Starter · Pro $20/mo · Enterprise $950 lifetime | (Workstream-2 territory; stub only for now) |
| — | **FAQ** | platform purpose, tech reqs, AI models, pricing, support | nice-to-have |
| — | Footer | nav + contact | brand contact block (Albuquerque, protonmail) |

Nav (theirs): Finance Fundamentals · Portfolio Optimization · Risk Management · Algorithmic Trading · Start Journey.
→ Ours maps to the 4 categories + Course + Literature (see Milestone brief).

**Decisions for our landing:**
- Keep the 6-section spine (Focus → Markets → Libraries → Models → Geographies → Pricing) + FAQ.
- Replace generic copy with brand-voice slogans from the 05-28 deck.
- Pricing = visually present but mark "coming soon" (subscription mechanics are a later milestone).
- Apply our hero (Lora display + aqua dot + ambient equity curve) instead of the flat Framer hero.

---

## B. Article template — structure to replicate

Their example: **"Market Risk via Extreme Value Theory + t-Copula — Python port"**, subtitle
*"Faithful Python replica of the MATLAB example,"* dated. This is the exact genre of our 8 articles.

Top-to-bottom anatomy to build as our reusable article template:

1. **Top nav** (same global nav as landing)
2. **Title** (large) + **subtitle/dek** (one line) + **byline/metadata** (date, category, "Python", read-time)
3. **Table of Contents** (sticky on desktop — they note "Table of Content" early; we'll make it a real sticky sidebar)
4. **Intro** + a **numbered pipeline** overview (the "here's the whole flow" box)
5. **Numbered body sections** — for their example:
   Data sourcing → Log returns → GARCH-t filtering → Semi-parametric CDFs w/ Pareto tails →
   t-copula calibration → Monte Carlo simulation → Portfolio VaR → Interpretation
6. **Inline code blocks** (monospaced Python) — ours = Courier Prime, our code-card styling
7. **Figures/charts embedded inline** right after the relevant code — ours = our muted-border figure
   with single aqua "insight" line (matches brand "one fresh accent" imagery rule)
8. **Tables** for parameter estimates / summary statistics — ours = tabular-nums, hairline rules
9. **Footer**

**Decisions for our article template:**
- Reading surface = **light (Pale Sisal)** per our hybrid canvas → long-form legibility (brand "reading" use).
- Body = Switzer; section headings = Lora; code/labels/figure captions = Courier Prime.
- Real sticky TOC (theirs is only a label) — better than the reference.
- Notebook link/badge per article (brief requires "articles & notebooks").
- First deliverable per Louis's $300 sub-step = landing + **one** example article in this template.

---

## C. What we deliberately do better than the reference
- Their look is a stock AI-startup template; ours is the bespoke brand (the whole point — "classy").
- Real sticky TOC, real figure styling, tabular numerals, self-hosted fonts, a11y + reduced-motion.
- Coherent dark-landing / light-reading hybrid instead of one flat surface.
