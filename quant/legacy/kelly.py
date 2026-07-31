"""
Legacy upgrade - Kelly Criterion for Position Sizing (research article).
Assets: SPY · Timeframe: Jan 2000 - Dec 2024 · Data: legacy_kelly.csv
(self-cached from Yahoo Finance on first run - 25 years spanning the dot-com
bust, the GFC and COVID, so the tails are real).

Computes the continuous Kelly fraction f* = mu/sigma^2 on real SPY daily
returns, the realised growth-vs-fraction curve g(f) = 252*E[ln(1+f*r)], the
historical wealth paths at full / half / quarter Kelly (daily rebalanced), and
a seeded 10-year bootstrap of drawdowns per sizing. Emits the article data
module + the runnable notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import DATA, code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "kelly-criterion-position-sizing"
SEED = 42
CSV = "legacy_kelly"
F_GRID_MAX = 5.5          # fractions to scan for the growth curve
BOOT_PATHS = 2000         # seeded bootstrap paths for the drawdown table
BOOT_YEARS = 10


def self_cache() -> pd.Series:
    """SPY 2000-2024 adjusted closes; download once, then always read the CSV."""
    out = DATA / f"{CSV}.csv"
    if not out.exists():
        import yfinance as yf
        df = yf.download("SPY", start="2000-01-01", end="2025-01-01",
                         auto_adjust=True, progress=False)
        close = df["Close"]
        close.columns = ["SPY"]
        close.dropna().to_csv(out)
        print(f"cached -> {out} rows={len(close)}")
    return load(CSV)["SPY"].dropna()


def max_drawdowns(wealth: np.ndarray) -> np.ndarray:
    """Max drawdown along axis 1 of a (paths, time) wealth array."""
    peak = np.maximum.accumulate(wealth, axis=1)
    return (wealth / peak - 1.0).min(axis=1)


def main() -> None:
    px = self_cache()
    ret = px.pct_change().dropna()
    n = len(ret)
    yrs = n / 252

    mu_d, var_d = float(ret.mean()), float(ret.var(ddof=1))
    mu_a, sigma_a = mu_d * 252, float(np.sqrt(var_d * 252))
    f_star = mu_d / var_d                          # = (mu_a/sigma_a^2), rf ~ 0

    # ---- realised growth curve g(f) on the actual 25y of daily returns ------
    fgrid = np.linspace(0.0, F_GRID_MAX, 111)
    rv = ret.values
    g = np.array([252 * np.mean(np.log1p(f * rv)) for f in fgrid])
    g_star = 252 * np.mean(np.log1p(f_star * rv))
    g_half = 252 * np.mean(np.log1p(0.5 * f_star * rv))
    g_quarter = 252 * np.mean(np.log1p(0.25 * f_star * rv))

    # ---- historical wealth paths, daily rebalanced to a fixed fraction ------
    fracs = {"full": f_star, "half": 0.5 * f_star, "quarter": 0.25 * f_star, "unlevered": 1.0}
    wealth = {k: np.cumprod(1.0 + f * rv) for k, f in fracs.items()}
    hist_stats = {}
    for k, w in wealth.items():
        eq = np.concatenate([[1.0], w])
        dd = float((eq / np.maximum.accumulate(eq) - 1.0).min())
        hist_stats[k] = {
            "f": r(float(fracs[k]), 2),
            "cagr": r(float(eq[-1] ** (1 / yrs) - 1), 4),
            "vol": r(float(np.std(fracs[k] * rv, ddof=1) * np.sqrt(252)), 4),
            "maxDD": r(dd, 4),
            "terminal": r(float(eq[-1]), 2),
            "gCaptured": r(float(252 * np.mean(np.log1p(fracs[k] * rv)) / g_star), 4),
        }

    # ---- seeded bootstrap: 10y ahead, drawdown distribution per sizing ------
    rng = np.random.default_rng(SEED)
    idx = rng.integers(0, n, size=(BOOT_PATHS, BOOT_YEARS * 252))
    sims = rv[idx]
    boot = {}
    for k in ("full", "half", "quarter"):
        w = np.cumprod(1.0 + fracs[k] * sims, axis=1)
        boot[k] = {
            "medTerminal": r(float(np.median(w[:, -1])), 2),
            "p5Terminal": r(float(np.percentile(w[:, -1], 5)), 2),
            "medMaxDD": r(float(np.median(max_drawdowns(w))), 4),
            "worstDD5": r(float(np.percentile(max_drawdowns(w), 5)), 4),  # worst 5% of paths
        }

    payload = {
        "params": {
            "start": str(px.index[0].date()), "end": str(px.index[-1].date()),
            "nObs": n, "years": r(yrs, 1), "seed": SEED,
            "muAnnual": r(mu_a), "sigmaAnnual": r(sigma_a),
            "fStar": r(float(f_star), 2),
            "gStar": r(float(g_star), 4), "gHalf": r(float(g_half), 4),
            "gQuarter": r(float(g_quarter), 4),
            "bootPaths": BOOT_PATHS, "bootYears": BOOT_YEARS,
        },
        "growthCurve": {
            "f": r(list(fgrid), 3),
            "g": r(list(g), 4),
            "peak": {"f": r(float(f_star), 2), "g": r(float(g_star), 4)},
            "half": {"f": r(float(0.5 * f_star), 2), "g": r(float(g_half), 4)},
            "quarter": {"f": r(float(0.25 * f_star), 2), "g": r(float(g_quarter), 4)},
        },
        "wealth": {  # log10 wealth so the chart is readable across 25 years
            k: downsample(np.log10(np.concatenate([[1.0], w])), 240)
            for k, w in wealth.items()
        },
        "wealthXLabels": [[f, l] for f, l in year_labels(px.index, 4)],
        "histStats": hist_stats,
        "boot": boot,
    }
    ts = write_ts(SLUG, payload)

    cells = [
        md(f"""# The Kelly criterion for position sizing

**pyportfolios.com research** · SPY, Jan 2000 – Dec 2024 · NumPy · Pandas · Matplotlib · yfinance

The growth-optimal bet size on real data. We

1. estimate the continuous Kelly fraction **f\\* = μ/σ²** from 25 years of SPY,
2. trace the realised growth-vs-fraction curve g(f) and find its peak,
3. rebalance daily to full / half / quarter Kelly through the dot-com bust,
   the GFC and COVID, and
4. bootstrap {BOOT_PATHS:,} ten-year futures (seed {SEED}) to see the drawdown
   price of each sizing.

The punchline is the flatness of the peak: half-Kelly gives up little growth
for far less pain."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf

plt.rcParams["figure.figsize"] = (10, 5)
SEED = 42"""),
        md("""## 1 · Data: 25 years of SPY

A quarter century that includes two ~50% bear markets and a pandemic crash —
exactly the tails Kelly sizing has to survive."""),
        code("""px = yf.download("SPY", start="2000-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"].squeeze().dropna()
ret = px.pct_change().dropna()
print(f"{len(ret)} daily returns, {len(ret)/252:.1f} years")"""),
        md("""## 2 · The Kelly fraction from μ and σ

For continuous returns the growth-optimal leverage is f* = μ/σ² (excess
returns; we take cash ≈ 0 for clarity — subtracting a realistic T-bill rate
lowers f* further, it never raises it)."""),
        code("""mu_a    = ret.mean() * 252
sigma_a = ret.std(ddof=1) * np.sqrt(252)
f_star  = ret.mean() / ret.var(ddof=1)

print(f"mu     = {mu_a: .4f} / yr")
print(f"sigma  = {sigma_a: .4f} / yr")
print(f"f*     = {f_star: .2f}x leverage")"""),
        md("""## 3 · The growth curve g(f), realised

Instead of the quadratic approximation f·μ − f²σ²/2 we compute the *exact*
realised growth rate g(f) = 252 · E[ln(1 + f·r)] on the actual daily returns —
fat tails included. The curve rises to a single peak at f* and then rolls over
into negative territory: past the peak, more risk buys *less* growth."""),
        code("""fgrid = np.linspace(0, 5.5, 111)
g = np.array([252 * np.mean(np.log1p(f * ret.values)) for f in fgrid])

plt.plot(fgrid, g, color="#4a4a42")
for f, label, c in [(f_star, "full", "#0a8a8a"), (f_star/2, "half", "#b07d2b")]:
    plt.axvline(f, ls="--", lw=1, color=c)
    plt.annotate(f"{label} Kelly", (f, g.max()*0.15), color=c, rotation=90)
plt.axhline(0, color="k", lw=0.5)
plt.title("realised growth rate vs bet fraction, SPY 2000-2024")
plt.xlabel("fraction f (leverage)"); plt.ylabel("g(f) per year");

for f, label in [(f_star, "full"), (f_star/2, "half"), (f_star/4, "quarter")]:
    gf = 252 * np.mean(np.log1p(f * ret.values))
    print(f"{label:>8} Kelly f={f:4.2f}: g = {gf:6.4f}/yr")"""),
        md("""## 4 · Full vs half vs quarter Kelly through 25 real years

Rebalance daily to a constant fraction and let history do its worst. Wealth is
plotted on a log scale — with leverage above 2× the drawdowns are the story,
not the terminal wealth."""),
        code("""fracs = {"full": f_star, "half": f_star/2, "quarter": f_star/4, "SPY 1x": 1.0}
for label, f in fracs.items():
    eq = pd.Series(np.cumprod(1 + f * ret.values), index=ret.index)
    dd = (eq / eq.cummax() - 1).min()
    cagr = eq.iloc[-1] ** (252 / len(eq)) - 1
    print(f"{label:>8} (f={f:4.2f}): terminal {eq.iloc[-1]:7.2f}x  "
          f"CAGR {cagr:6.2%}  maxDD {dd:6.1%}")
    eq.plot(logy=True, label=f"{label} (f={f:.2f})")
plt.legend(); plt.title("daily-rebalanced constant-fraction wealth, log scale");"""),
        md("""## 5 · The drawdown price, bootstrapped

Resample 10-year futures from the same return distribution (seeded) and read
the drawdown distribution per sizing. This is the table that talks people out
of full Kelly."""),
        code("""rng = np.random.default_rng(SEED)
sims = ret.values[rng.integers(0, len(ret), size=(2000, 2520))]

def max_dd(w):
    peak = np.maximum.accumulate(w, axis=1)
    return (w / peak - 1).min(axis=1)

print(f"{'sizing':>8} {'median 10y':>12} {'5th pct':>9} {'median maxDD':>13}")
for label, f in [("full", f_star), ("half", f_star/2), ("quarter", f_star/4)]:
    w = np.cumprod(1 + f * sims, axis=1)
    print(f"{label:>8} {np.median(w[:, -1]):11.2f}x {np.percentile(w[:, -1], 5):8.2f}x "
          f"{np.median(max_dd(w)):12.1%}")"""),
        md("""## Takeaways

- On real SPY data f* ≈ 2× — and nobody should run it: μ is the least reliable
  estimate in finance, and the curve punishes overshooting far more than
  undershooting.
- The peak is flat: half-Kelly keeps most of the growth rate for roughly half
  the volatility and a far shallower worst drawdown.
- Full Kelly turned the GFC into a near-wipeout drawdown; half Kelly hurt but
  survived comfortably. That asymmetry is the whole argument.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    print(f"mu={mu_a:.4f} sigma={sigma_a:.4f} f*={f_star:.2f} "
          f"g*={g_star:.4f} gHalf={g_half:.4f} ({g_half / g_star:.0%}) "
          f"gQuarter={g_quarter:.4f} ({g_quarter / g_star:.0%})")
    for k, v in hist_stats.items():
        print(f"{k:>10}: f={v['f']} CAGR={v['cagr']} maxDD={v['maxDD']} "
              f"terminal={v['terminal']}x gCap={v['gCaptured']}")
    print("boot:", boot)


if __name__ == "__main__":
    main()
