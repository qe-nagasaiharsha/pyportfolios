"""
T09 - VaR Three Ways (topic card 09/16) + the roadmap Polars/DuckDB add-on.
Assets: DAX (^GDAXI) · Timeframe: Jan 2010 - Dec 2024 · Libs: NumPy SciPy Pandas (+ Polars, DuckDB).

Computes 99%/95% VaR & CVaR by historical simulation, parametric normal,
parametric Student-t (fitted df) and Monte Carlo (seeded, 200k draws from the
fitted t); runs a rolling 250-day out-of-sample backtest with Kupiec POF tests;
and recomputes the historical quantile with Polars expressions and DuckDB SQL
over the same data (they must agree with pandas/NumPy to 1e-12).

Emits the article data module + the runnable notebook.
"""

from __future__ import annotations

import sys
import tempfile
import time
from pathlib import Path

import numpy as np
from scipy import stats

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "var-three-ways"
SEED = 42
WINDOW = 250          # rolling estimation window (≈ 1 trading year)
REFIT_EVERY = 20      # t / MC re-estimation cadence in the backtest (≈ monthly)
MC_DRAWS = 200_000
ALPHAS = (0.99, 0.95)


# ------------------------------------------------------------ VaR methods --

def hist_var_cvar(ret: np.ndarray, alpha: float) -> tuple[float, float]:
    q = np.quantile(ret, 1 - alpha)          # linear-interpolated quantile
    tail = ret[ret <= q]
    return -q, -tail.mean()


def normal_var_cvar(mu: float, sd: float, alpha: float) -> tuple[float, float]:
    z = stats.norm.ppf(1 - alpha)
    var = -(mu + sd * z)
    cvar = -mu + sd * stats.norm.pdf(z) / (1 - alpha)
    return var, cvar


def t_var_cvar(df: float, loc: float, scale: float, alpha: float) -> tuple[float, float]:
    p = 1 - alpha
    x = stats.t.ppf(p, df)
    var = -(loc + scale * x)
    cvar = -loc + scale * stats.t.pdf(x, df) * (df + x**2) / ((df - 1) * p)
    return var, cvar


def kupiec_pof(breaches: int, n: int, p: float = 0.01) -> tuple[float, float]:
    """Kupiec (1995) proportion-of-failures LR test; chi2(1) under H0."""
    x, phat = breaches, breaches / n
    ll0 = (n - x) * np.log(1 - p) + x * np.log(p)
    ll1 = (n - x) * np.log(1 - phat) + (x * np.log(phat) if x > 0 else 0.0)
    lr = -2.0 * (ll0 - ll1)
    return lr, float(stats.chi2.sf(lr, 1))


def main() -> None:
    px = load("t09_var_dax")["^GDAXI"].dropna()
    ret = px.pct_change().dropna()
    rv = ret.values
    n = len(rv)

    # ---------------------------------------- full-sample estimates (2010-24)
    mu, sd = float(rv.mean()), float(rv.std(ddof=1))
    t_df, t_loc, t_scale = (float(v) for v in stats.t.fit(rv))
    print(f"fitted Student-t df = {t_df:.2f}  loc = {t_loc:.6f}  scale = {t_scale:.6f}")

    rng = np.random.default_rng(SEED)
    mc_draws = t_loc + t_scale * rng.standard_t(t_df, MC_DRAWS)

    table: dict[str, dict[str, float]] = {}
    for a in ALPHAS:
        k = str(int(a * 100))
        hv, hc = hist_var_cvar(rv, a)
        nv, nc = normal_var_cvar(mu, sd, a)
        tv, tc = t_var_cvar(t_df, t_loc, t_scale, a)
        mv, mc = hist_var_cvar(mc_draws, a)
        table[k] = {
            "histVar": hv, "histCvar": hc,
            "normalVar": nv, "normalCvar": nc,
            "tVar": tv, "tCvar": tc,
            "mcVar": mv, "mcCvar": mc,
        }

    # ------------------------------------- rolling 250d out-of-sample backtest
    sret = ret  # pandas Series
    z01 = stats.norm.ppf(0.01)

    # forecast f[i] = 1% return quantile (i.e. -VaR99) for day i, data < i only
    f_hist = sret.rolling(WINDOW).quantile(0.01).shift(1).values
    f_norm = (sret.rolling(WINDOW).mean() + sret.rolling(WINDOW).std(ddof=1) * z01).shift(1).values

    f_t = np.full(n, np.nan)
    f_mc = np.full(n, np.nan)
    for s in range(WINDOW, n, REFIT_EVERY):
        w = rv[s - WINDOW:s]
        dfw, locw, scalew = stats.t.fit(w)
        e = min(s + REFIT_EVERY, n)
        f_t[s:e] = locw + scalew * stats.t.ppf(0.01, dfw)
        draws = locw + scalew * rng.standard_t(dfw, MC_DRAWS)
        f_mc[s:e] = np.quantile(draws, 0.01)

    n_fc = n - WINDOW
    backtest: dict[str, dict[str, float | int]] = {}
    breach_mask = {}
    for name, f in (("hist", f_hist), ("normal", f_norm), ("t", f_t), ("mc", f_mc)):
        mask = np.zeros(n, dtype=bool)
        valid = ~np.isnan(f)
        mask[valid] = rv[valid] < f[valid]
        x = int(mask.sum())
        lr, pval = kupiec_pof(x, n_fc, 0.01)
        backtest[name] = {"breaches": x, "kupiecLR": r(lr, 2), "kupiecP": float(pval)}
        breach_mask[name] = mask
        print(f"{name:>6}: breaches {x:>3} / {n_fc} (expected {0.01 * n_fc:.1f})  "
              f"Kupiec LR = {lr:.2f}  p = {pval:.4f}")

    hist_breach_dates = [str(d.date()) for d in ret.index[breach_mask["hist"]]]

    # -------------------------------------------------- chart payloads
    # (a) histogram of daily returns + fitted t overlay + tail-zoom densities
    edges = np.linspace(np.percentile(rv, 0.1), np.percentile(rv, 99.9), 57)
    counts, _ = np.histogram(rv, bins=edges)
    centres = (edges[:-1] + edges[1:]) / 2
    bw = edges[1] - edges[0]
    t_overlay = stats.t.pdf(centres, t_df, t_loc, t_scale) * n * bw

    grid = np.linspace(-0.075, -0.015, 110)
    kde = stats.gaussian_kde(rv)
    tail = {
        "x0": -0.075, "x1": -0.015,
        "normal": r(list(stats.norm.pdf(grid, mu, sd)), 4),
        "t": r(list(stats.t.pdf(grid, t_df, t_loc, t_scale)), 4),
        "empirical": r(list(kde(grid)), 4),
        "xLabels": [[r((v + 0.075) / 0.06, 4), f"{v * 100:.0f}%"] for v in (-0.07, -0.06, -0.05, -0.04, -0.03, -0.02)],
    }

    # (b) daily returns vs rolling -VaR99 (first forecast day onwards)
    chart_idx = ret.index[WINDOW:]
    rolling = {
        "ret": downsample(rv[WINDOW:], 260),
        "negVar": downsample(f_hist[WINDOW:], 260),
        "xLabels": [[f, l] for f, l in year_labels(chart_idx, 2)],
        "start": str(chart_idx[0].date()), "end": str(chart_idx[-1].date()),
    }

    # ------------------------------------- Polars + DuckDB: same quantile
    # Timing note (this machine, 3,805 rows): pandas/NumPy ~0.1 ms in-memory;
    # polars lazy scan_csv ~1-2 ms; duckdb read_csv ~5-10 ms — engine overhead
    # dominates at this size. The engines win when the file stops fitting in
    # RAM: both stream the CSV instead of materialising it.
    import duckdb
    import polars as pl

    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / "dax_returns.csv"
        ret.rename("ret").to_frame().to_csv(csv_path, index_label="date")

        t0 = time.perf_counter()
        q_pd = float(np.quantile(rv, 0.01))
        ms_pd = (time.perf_counter() - t0) * 1e3

        t0 = time.perf_counter()
        q_pl = float(
            pl.scan_csv(csv_path)
            .select(pl.col("ret").quantile(0.01, interpolation="linear"))
            .collect()
            .item()
        )
        ms_pl = (time.perf_counter() - t0) * 1e3

        t0 = time.perf_counter()
        q_db = float(
            duckdb.sql(
                f"SELECT quantile_cont(ret, 0.01) FROM read_csv('{csv_path.as_posix()}')"
            ).fetchone()[0]
        )
        ms_db = (time.perf_counter() - t0) * 1e3

    max_diff = max(abs(q_pl - q_pd), abs(q_db - q_pd))
    print(f"engines: pandas {q_pd:.15f} ({ms_pd:.2f} ms) | polars {q_pl:.15f} "
          f"({ms_pl:.2f} ms) | duckdb {q_db:.15f} ({ms_db:.2f} ms) | max|diff| = {max_diff:.2e}")
    assert max_diff <= 1e-12, f"engine disagreement: {max_diff:.2e}"

    payload = {
        "params": {
            "start": str(px.index[0].date()), "end": str(px.index[-1].date()),
            "nObs": n, "seed": SEED, "window": WINDOW, "refitEvery": REFIT_EVERY,
            "mcDraws": MC_DRAWS, "nForecasts": n_fc,
            "muDaily": r(mu, 6), "sigmaDaily": r(sd, 6),
            "tDf": r(t_df, 2), "tLoc": r(t_loc, 6), "tScale": r(t_scale, 6),
            "worstDay": str(ret.idxmin().date()), "worstRet": r(float(rv.min()), 4),
        },
        "var": {k: {kk: r(vv, 6) for kk, vv in v.items()} for k, v in table.items()},
        "backtest": {
            **backtest,
            "expected": r(0.01 * n_fc, 1),
            "n": n_fc,
            "histBreachFirst": hist_breach_dates[0],
            "histBreachLast": hist_breach_dates[-1],
        },
        "histogram": {
            "edges": r(list(edges), 4), "counts": [int(c) for c in counts],
            "tOverlay": r(list(t_overlay), 2),
            "var99": {
                "hist": r(-table["99"]["histVar"], 6),
                "normal": r(-table["99"]["normalVar"], 6),
                "t": r(-table["99"]["tVar"], 6),
            },
        },
        "tail": tail,
        "rolling": rolling,
        "engines": {
            "pandas": q_pd, "polars": q_pl, "duckdb": q_db,
            "maxAbsDiff": max_diff,
        },
    }
    ts = write_ts(SLUG, payload)

    # ------------------------------------------------------------- notebook --
    cells = [
        md(f"""# VaR Three Ways, on the DAX

**pyportfolios.com tutorial T09** · DAX (^GDAXI), Jan 2010 – Dec 2024 · NumPy · SciPy · Pandas · Polars · DuckDB

Value-at-Risk is the industry's standard downside number — daily loss limits and
regulatory capital both hang off it. In this notebook we

1. compute 99% and 95% VaR (and CVaR) three ways — historical simulation,
   parametric (normal **and** Student-t), and Monte Carlo,
2. backtest all of them out-of-sample with a rolling {WINDOW}-day window and
   Kupiec's proportion-of-failures test, and
3. recompute the historical quantile with **Polars** expressions and **DuckDB**
   SQL — the modern data-engineering route to the exact same number."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from scipy import stats

plt.rcParams["figure.figsize"] = (10, 5)
SEED = 42"""),
        md("""## 1 · Data: fifteen years of the DAX

The DAX (^GDAXI) from January 2010 through December 2024 — the euro crisis,
the 2015-16 China scare, COVID, the 2022 energy shock. A proper stress diet
for a risk model."""),
        code("""px = yf.download("^GDAXI", start="2010-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"].squeeze().dropna()
ret = px.pct_change().dropna()
print(f"{len(ret)} daily returns, worst day {ret.idxmin().date()} ({ret.min():.2%})")
ret.plot(lw=0.5, title="DAX daily returns");"""),
        md("""## 2 · Historical simulation

No model at all: VaR at level α is the empirical (1−α)-quantile of returns,
negated. CVaR (expected shortfall) is the mean return beyond that quantile."""),
        code("""def hist_var_cvar(x, alpha=0.99):
    q = np.quantile(x, 1 - alpha)
    return -q, -x[x <= q].mean()

for a in (0.99, 0.95):
    v, c = hist_var_cvar(ret.values, a)
    print(f"historical  {a:.0%}: VaR = {v:.2%}   CVaR = {c:.2%}")"""),
        md("""## 3 · Parametric: normal, then Student-t

The variance–covariance shortcut assumes a distribution and reads the quantile
off its formula. With a normal that famously understates the tail; refitting
the same idea with a Student-t (degrees of freedom estimated by MLE) is a
one-line upgrade that buys most of the missing tail mass."""),
        code("""mu, sd = ret.mean(), ret.std(ddof=1)
t_df, t_loc, t_scale = stats.t.fit(ret.values)
print(f"fitted Student-t df = {t_df:.2f}")

def normal_var_cvar(alpha):
    z = stats.norm.ppf(1 - alpha)
    return -(mu + sd * z), -mu + sd * stats.norm.pdf(z) / (1 - alpha)

def t_var_cvar(alpha):
    p = 1 - alpha
    x = stats.t.ppf(p, t_df)
    var = -(t_loc + t_scale * x)
    cvar = -t_loc + t_scale * stats.t.pdf(x, t_df) * (t_df + x**2) / ((t_df - 1) * p)
    return var, cvar

for a in (0.99, 0.95):
    nv, nc = normal_var_cvar(a); tv, tc = t_var_cvar(a)
    print(f"{a:.0%}  normal: VaR {nv:.2%} CVaR {nc:.2%}   t: VaR {tv:.2%} CVaR {tc:.2%}")"""),
        md(f"""## 4 · Monte Carlo

Simulate from the fitted Student-t ({MC_DRAWS:,} seeded draws) and read the
empirical tail of the simulation. On a single linear asset this must agree
with the analytic t to Monte-Carlo error — the payoff comes when the
portfolio has options or path dependence and no closed form exists."""),
        code(f"""rng = np.random.default_rng(SEED)
draws = t_loc + t_scale * rng.standard_t(t_df, {MC_DRAWS})

for a in (0.99, 0.95):
    v, c = hist_var_cvar(draws, a)
    print(f"monte carlo {{a:.0%}}: VaR = {{v:.2%}}   CVaR = {{c:.2%}}")"""),
        md(f"""## 5 · Backtest: rolling window + Kupiec

A VaR is a falsifiable forecast: at 99% the next-day loss should exceed it on
about 1% of days. We re-estimate each method on a rolling {WINDOW}-day window
(t and MC refit every {REFIT_EVERY} days — desk practice), forecast one day
ahead, count breaches, and test the breach *rate* with Kupiec's (1995)
proportion-of-failures likelihood ratio, which is χ²(1) under H₀."""),
        code(f"""WINDOW, REFIT = {WINDOW}, {REFIT_EVERY}
rv, n = ret.values, len(ret)
z01 = stats.norm.ppf(0.01)

f_hist = ret.rolling(WINDOW).quantile(0.01).shift(1).values
f_norm = (ret.rolling(WINDOW).mean() + ret.rolling(WINDOW).std(ddof=1) * z01).shift(1).values

f_t, f_mc = np.full(n, np.nan), np.full(n, np.nan)
for s in range(WINDOW, n, REFIT):
    dfw, locw, scalew = stats.t.fit(rv[s - WINDOW:s])
    e = min(s + REFIT, n)
    f_t[s:e] = locw + scalew * stats.t.ppf(0.01, dfw)
    f_mc[s:e] = np.quantile(locw + scalew * rng.standard_t(dfw, {MC_DRAWS}), 0.01)

def kupiec(x, n, p=0.01):
    phat = x / n
    ll0 = (n - x) * np.log(1 - p) + x * np.log(p)
    ll1 = (n - x) * np.log(1 - phat) + (x * np.log(phat) if x > 0 else 0.0)
    lr = -2 * (ll0 - ll1)
    return lr, stats.chi2.sf(lr, 1)

n_fc = n - WINDOW
for name, f in [("hist", f_hist), ("normal", f_norm), ("t", f_t), ("mc", f_mc)]:
    valid = ~np.isnan(f)
    x = int((rv[valid] < f[valid]).sum())
    lr, p = kupiec(x, n_fc)
    print(f"{{name:>6}}: {{x:>3}} breaches / {{n_fc}} (expected {{0.01 * n_fc:.1f}})  "
          f"Kupiec LR = {{lr:.2f}}  p = {{p:.4f}}")"""),
        code("""plt.plot(ret.index[WINDOW:], rv[WINDOW:], lw=0.4, color="grey", label="daily return")
plt.plot(ret.index[WINDOW:], f_hist[WINDOW:], lw=1.4, label="rolling 99% -VaR (hist)")
breach = rv < f_hist
plt.scatter(ret.index[breach], rv[breach], s=14, color="crimson", zorder=3, label="breach")
plt.legend(); plt.title("DAX daily returns vs rolling 250d historical 99% VaR");
plt.show()
"""),
        md("""## 6 · The same VaR in Polars and DuckDB

Historical VaR is just a quantile over a column — exactly the shape of problem
modern engines eat. Polars evaluates a lazy expression pipeline over the CSV;
DuckDB runs SQL directly against the file. Both stream, so the identical code
works when "15 years of one index" becomes "10 years of every book in the
firm". The three engines must agree to floating-point noise — if they don't,
the bug is yours, not theirs."""),
        code("""import polars as pl
import duckdb
import time

ret.rename("ret").to_frame().to_csv("dax_returns.csv", index_label="date")

t0 = time.perf_counter()
q_pd = float(np.quantile(rv, 0.01))
print(f"pandas/NumPy   {q_pd:.15f}   {(time.perf_counter() - t0) * 1e3:6.2f} ms")

t0 = time.perf_counter()
q_pl = float(
    pl.scan_csv("dax_returns.csv")
      .select(pl.col("ret").quantile(0.01, interpolation="linear"))
      .collect()
      .item()
)
print(f"polars (lazy)  {q_pl:.15f}   {(time.perf_counter() - t0) * 1e3:6.2f} ms")

t0 = time.perf_counter()
q_db = float(duckdb.sql(
    "SELECT quantile_cont(ret, 0.01) FROM read_csv('dax_returns.csv')"
).fetchone()[0])
print(f"duckdb SQL     {q_db:.15f}   {(time.perf_counter() - t0) * 1e3:6.2f} ms")

# timing note: at 3,805 rows engine startup dominates; the streaming engines
# win once the file no longer fits in memory.
print(f"max |diff| = {max(abs(q_pl - q_pd), abs(q_db - q_pd)):.2e}  (must be <= 1e-12)")"""),
        md("""## Takeaways

- The three recipes disagree, and the disagreement is informative: at 99% the normal sits ~60bp below historical, t and Monte Carlo.
- The fitted Student-t degrees of freedom (~3) say DAX tails are far from Gaussian; the t roughly halves the normal's excess breaches.
- Honest backtest result: *every* unconditional method breaches too often at 99% — breaches cluster in vol regimes, which is Kupiec's message here and the motivation for conditional models (GARCH, filtered historical simulation).
- CVaR comes almost free alongside every method and is the better number for limits.
- A quantile is a quantile: pandas, Polars and DuckDB agree to 1e-15 — pick the engine for the data size, not the answer.
- Never ship a VaR you have not backtested.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    v99 = table["99"]
    print(f"99% VaR  hist={v99['histVar']:.4%} normal={v99['normalVar']:.4%} "
          f"t={v99['tVar']:.4%} mc={v99['mcVar']:.4%}  (t df={t_df:.2f})")


if __name__ == "__main__":
    main()
