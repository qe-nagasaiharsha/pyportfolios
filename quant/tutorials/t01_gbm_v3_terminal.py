"""
T01 (v3) - terminal-distribution data for the GBM article's second figure.

Why this exists as its own script:

  t01_gbm.py predates Louis's v3-stylized notebook and calibrates differently -
  it reads the pinned CSV and reports mu as the LOG-return drift, giving
  s0=576.22, mu=0.1278. Louis's v3 downloads live and reports mu as the SDE
  drift (log drift + half variance), giving s0=578.32, mu=0.1475. The article
  publishes HIS numbers, printed verbatim in its output block, so a chart built
  from t01 would contradict the text sitting beside it.

  This mirrors his cells exactly - same window, same estimators, same seed, same
  1,000 paths over five years, same 60 bins - so the histogram matches the
  numbers the article states.

Only the SECOND figure is emitted. The first (the 1,000-path cone) stays a PNG:
drawn as vector it is 5.6 MB against 251 KB, because a thousand paths of 1,261
points each is a quarter of a million line segments. Vector is cheaper for
sparse charts and dearer for dense ones, and that one is dense.

Emits: site/src/content/articles/data/brownian-motion.ts
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from scipy import stats

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import r, write_ts  # noqa: E402

SLUG = "brownian-motion"
TICKER = "SPY"
START, END = "2018-01-01", "2024-12-31"
DT, HORIZON, N_PATHS, BINS = 1 / 252, 252 * 5, 1_000, 60


def gbm_paths(s0, mu, sigma, dt, n_steps, n_paths):
    """Verbatim from his notebook."""
    z = np.random.normal(size=(n_steps, n_paths))
    rets = np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * z)
    return s0 * np.vstack([np.ones(rets.shape[1]), rets]).cumprod(axis=0)


def main() -> None:
    np.random.seed(42)                      # his seed, set before any draw

    import yfinance as yf
    px = (yf.download(TICKER, start=START, end=END, auto_adjust=True, progress=False)["Close"]
            .squeeze().rename(TICKER).dropna())
    log_ret = np.log(px / px.shift(1)).dropna()

    s0 = float(px.iloc[-1])
    sigma_hat = float(log_ret.std() * np.sqrt(252))
    mu_hat = float(log_ret.mean() * 252 + 0.5 * sigma_hat**2)   # SDE drift, as he defines it

    paths = gbm_paths(s0, mu_hat, sigma_hat, DT, HORIZON, N_PATHS)
    s_T = paths[-1]
    T = HORIZON / 252

    # density histogram, as his ax.hist(..., density=True) draws it
    counts, edges = np.histogram(s_T, bins=BINS, density=True)
    centres = (edges[:-1] + edges[1:]) / 2

    # the analytic lognormal, sampled AT THE BIN CENTRES so <Histogram> can
    # overlay it directly (his version samples 400 points across the range)
    overlay = stats.lognorm.pdf(centres, s=sigma_hat * np.sqrt(T),
                                scale=s0 * np.exp((mu_hat - 0.5 * sigma_hat**2) * T))

    print(f"  {TICKER}: {len(px)} obs, last close = {s0:,.2f}")
    print(f"  mu_hat = {mu_hat:.2%}   sigma_hat = {sigma_hat:.2%}")
    print(f"  mean {s_T.mean():,.0f}   median {np.median(s_T):,.0f}")

    payload = {
        "params": {
            "ticker": TICKER, "start": START, "end": END,
            "nObs": int(len(px)), "s0": r(s0, 2),
            "muHat": r(mu_hat, 4), "sigmaHat": r(sigma_hat, 4),
            "years": int(T), "nPaths": N_PATHS, "bins": BINS, "seed": 42,
        },
        "terminal": {
            "edges": r([float(v) for v in edges], 2),
            "density": r([float(v) for v in counts], 8),
            "lognormal": r([float(v) for v in overlay], 8),
            "mean": r(float(s_T.mean()), 2),
            "median": r(float(np.median(s_T)), 2),
        },
    }
    print(f"\nts  -> {write_ts(SLUG, payload)}")


if __name__ == "__main__":
    main()
