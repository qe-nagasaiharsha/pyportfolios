# Logo drop-zone

Drop logo files here and they appear on the landing page automatically on the next
build. **No code changes needed** — the components detect the file by its name.

- Format: **SVG** preferred (PNG with transparent background also works if you tweak
  the extension in the component).
- Keep each logo in its **original brand colours** — do **not** recolour them
  (brand rule, deck §06). They render on a light chip so any logo stays legible.
- Filename = the **slug** below. Lowercase, exact.

## `libraries/` — the Python quant stack (grouped by purpose, deck §06)

| Group | File names |
|---|---|
| Data & Compute | `numpy.svg` · `pandas.svg` · `scipy.svg` |
| Machine Learning | `scikit-learn.svg` · `statsmodels.svg` · `pymc.svg` |
| Backtesting | `vectorbt.svg` · `backtrader.svg` · `zipline.svg` |
| Portfolio & Performance | `pyportfolioopt.svg` · `cvxpy.svg` · `quantlib.svg` |

Until a file exists, that card shows a neutral monogram (e.g. `np`, `pd`).
Source: each project's site, or https://simpleicons.org. The niche ones
(cvxpy, vectorbt, PyPortfolioOpt, QuantLib, statsmodels) may have no real logo —
leave them as monograms.

## `exchanges/` — major stock exchanges

`nyse.svg` · `nasdaq.svg` · `lse.svg` · `jpx.svg` · `hkex.svg` · `nse.svg` ·
`cme.svg` · `euronext.svg` · `deutsche-borse.svg` · `six.svg` · `asx.svg` · `b3.svg`

Source: each exchange's official site or Wikimedia Commons. (Exchange marks are
trademarked — fine for a reference display.)
