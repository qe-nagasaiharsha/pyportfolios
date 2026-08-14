# Retired articles

Four articles have been taken off the site. None was part of the 16-topic batch
in `TOPIC_CARDS.html`.

Nothing was deleted. Everything each article needs is here, verbatim, and a
restore is copy-back rather than rewrite.

| Slug | Title | Was in | Format | Retired |
|---|---|---|---|---|
| `black-scholes-from-first-principles` | Black–Scholes from First Principles: Deriving the Formula by Replication | Quant Finance Foundations | Tutorial | 7 Aug 2026 |
| `gold-war-and-inflation` | Gold Through War and Inflation: Twenty Years of GLD Against Real Yields | Quant Finance Foundations | Research Note | 7 Aug 2026 |
| `kelly-criterion-position-sizing` | The Kelly Criterion for Position Sizing: Optimal Growth, and Why Half Is Safer | Portfolio Optimization | Tutorial | 7 Aug 2026 |
| `gamestop-short-squeeze` | Anatomy of a Short Squeeze: GameStop, January 2021, Reconstructed From the Tape | Algorithmic Trading | Case Study | 11 Aug 2026 |

The first three predate the batch — written in May and early June 2026, and they
survived the earlier catalogue reconciliation.

`gamestop-short-squeeze` is different: it was an **exemplar**, added on 30 June
2026 in a commit that created three sample articles to demonstrate the content
formats (one Tutorial, one Case Study, one Research Note). It covered the same
January 2021 event as topic card 15, so once Louis's commissioned piece
(`gamestop-momentum-models`) went live the site had two GameStop articles side by
side in Algorithmic Trading. The exemplar was retired and the commissioned one
kept.

**Its hero image was reassigned.** `hero/layered-blue-ridges.jpg` now belongs to
the Alpha Decay article (`alpha-decay-momentum`), which previously used
`hero/mountain-nathan-anderson.jpg`. Restoring this article means picking it a
different hero, or the two will share one.

## What is here

```
entries/<slug>.ts    the catalogue entry, lifted out of site/src/lib/articles.ts
bodies/<slug>.tsx    the article body component
data/<slug>.ts       its computed-data module (figures, tables, chart series)
```

The notebooks were left where they were, in `vault/notebooks/<slug>.ipynb` —
they are served by the API rather than the site build, so they cost nothing by
staying and are one less thing to move back.

## To restore one

1. Move its body and data back:
   ```
   retired-articles/bodies/<slug>.tsx  ->  site/src/content/articles/<slug>.tsx
   retired-articles/data/<slug>.ts     ->  site/src/content/articles/data/<slug>.ts
   ```
2. Paste the object in `entries/<slug>.ts` back into the `ARTICLES` array in
   `site/src/lib/articles.ts`. Position sets the order on the research index,
   and `category` decides which section it lands in.
3. Register the body in `site/src/app/research/[slug]/page.tsx` — one import at
   the top and one line in the `BODIES` map, following the pattern of the
   articles already there.
4. `npm run build` in `site/`.

Everything else follows on its own: the category page, the nav dropdown, the
counts, the sitemap and the generated route all read the `ARTICLES` array.

## Two cross-links that were removed with them

`black-scholes-from-first-principles` was linked from two other places, and
both links were dropped so nothing pointed at a missing page. Restore them
alongside the article if you bring it back:

- `site/src/lib/course.ts` — the "Black–Scholes from first principles" lesson
  carried `article: "black-scholes-from-first-principles"`
- `site/src/lib/literature.ts` — the 1973 Black & Scholes paper carried the
  same, which is what put a "Read our case study" link on it

## Note on old URLs

`/research/<slug>` for these four no longer exists. nginx falls back to
`index.html`, so such a link serves the home page with a 200 rather than a 404.
That is pre-existing behaviour for any unknown article URL, not something these
removals introduced.
