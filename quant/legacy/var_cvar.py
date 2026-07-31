"""
Legacy upgrade - VaR & CVaR three ways (article: var-cvar-three-ways).
Assets: 60/40 SPY + AGG (reuses quant/data/cs08_6040.csv) · 2003-2023.

The conceptual sibling of the DAX tutorial (var-three-ways) — same estimators,
different book, no Polars/DuckDB. Computes 99% VaR/CVaR by historical
simulation, parametric normal, parametric Student-t and Monte Carlo (seeded),
plus a rolling 250-day historical-VaR backtest with Kupiec's POF test.
Emits the article data module + the standalone runnable notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from scipy import stats

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, load, md, r, write_nb, write_ts  # noqa: E402

SLUG = "var-cvar-three-ways"
SEED = 42
W_SPY, W_AGG = 0.6, 0.4
WINDOW = 250
MC_DRAWS = 200_000
CHART_YEAR = "2020"          # the one-year breach chart window


def hist_var_cvar(x: np.ndarray, alpha: float) -> tuple[float, float]:
    q = np.quantile(x, 1 - alpha)
    return -q, -x[x <= q].mean()


def kupiec_pof(breaches: int, n: int, p: float = 0.01) -> tuple[float, float]:
    x, phat = breaches, breaches / n
    ll0 = (n - x) * np.log(1 - p) + x * np.log(p)
    ll1 = (n - x) * np.log(1 - phat) + (x * np.log(phat) if x > 0 else 0.0)
    lr = -2.0 * (ll0 - ll1)
    return lr, float(stats.chi2.sf(lr, 1))


def main() -> None:
    px = load("cs08_6040")[["SPY", "AGG"]].dropna()
    rets = px.pct_change().dropna()
    port = W_SPY * rets["SPY"] + W_AGG * rets["AGG"]   # daily-rebalanced 60/40
    rv = port.values
    n = len(rv)

    # ------------------------------------------- full-sample 99% estimates
    mu, sd = float(rv.mean()), float(rv.std(ddof=1))
    t_df, t_loc, t_scale = (float(v) for v in stats.t.fit(rv))
    rng = np.random.default_rng(SEED)
    mc_draws = t_loc + t_scale * rng.standard_t(t_df, MC_DRAWS)

    table = {}
    for a in (0.99, 0.95):
        k = str(int(a * 100))
        hv, hc = hist_var_cvar(rv, a)
        z = stats.norm.ppf(1 - a)
        nv = -(mu + sd * z)
        nc = -mu + sd * stats.norm.pdf(z) / (1 - a)
        xt = stats.t.ppf(1 - a, t_df)
        tv = -(t_loc + t_scale * xt)
        tc = -t_loc + t_scale * stats.t.pdf(xt, t_df) * (t_df + xt**2) / ((t_df - 1) * (1 - a))
        mv, mcv = hist_var_cvar(mc_draws, a)
        table[k] = {"hist": r(hv), "histCvar": r(hc), "normal": r(nv), "normalCvar": r(nc),
                    "t": r(tv), "tCvar": r(tc), "mc": r(mv), "mcCvar": r(mcv)}
        print(f"{a:.0%}: hist {hv:.4%}/{hc:.4%}  normal {nv:.4%}  t {tv:.4%}  mc {mv:.4%}")
    print(f"fitted t df = {t_df:.2f}")

    # --------------------------- rolling 250d backtest (hist & normal VaR99)
    z01 = stats.norm.ppf(0.01)
    f_hist = port.rolling(WINDOW).quantile(0.01).shift(1).values
    f_norm = (port.rolling(WINDOW).mean() + port.rolling(WINDOW).std(ddof=1) * z01).shift(1).values

    n_fc = n - WINDOW
    backtest = {}
    masks = {}
    for name, f in (("hist", f_hist), ("normal", f_norm)):
        valid = ~np.isnan(f)
        mask = np.zeros(n, dtype=bool)
        mask[valid] = rv[valid] < f[valid]
        x = int(mask.sum())
        lr, pval = kupiec_pof(x, n_fc, 0.01)
        backtest[name] = {"breaches": x, "rate": r(x / n_fc), "kupiecLR": r(lr, 2), "kupiecP": r(pval, 4)}
        masks[name] = mask
        print(f"{name:>6}: {x} breaches / {n_fc} (expected {0.01 * n_fc:.1f})  "
              f"LR = {lr:.2f}  p = {pval:.4f}")

    # ------------------------------- one-year breach chart window (CHART_YEAR)
    in_win = port.index.year == int(CHART_YEAR)
    win_ret = rv[in_win]
    win_var = f_hist[in_win]
    win_breach = masks["hist"][in_win]
    frac = np.where(win_breach)[0] / max(len(win_ret) - 1, 1)
    chart = {
        "ret": r(list(win_ret * 100), 3),
        "negVar": r(list(win_var * 100), 3),
        "breachFrac": r(list(frac), 4),
        "nBreach": int(win_breach.sum()),
        "nDays": int(len(win_ret)),
        "year": CHART_YEAR,
        "xLabels": [[r(i / (len(win_ret) - 1), 4), lab] for i, lab in
                    [(list(port.index[in_win].month).index(m), lab)
                     for m, lab in ((1, "Jan"), (4, "Apr"), (7, "Jul"), (10, "Oct"))]],
    }
    print(f"{CHART_YEAR}: {chart['nBreach']} breaches in {chart['nDays']} days")

    payload = {
        "params": {
            "start": str(rets.index[0].date()), "end": str(rets.index[-1].date()),
            "nObs": n, "seed": SEED, "window": WINDOW, "mcDraws": MC_DRAWS,
            "wSpy": W_SPY, "wAgg": W_AGG, "nForecasts": n_fc,
            "muDaily": r(mu, 6), "sigmaDaily": r(sd, 6),
            "tDf": r(t_df, 2),
            "worstDay": str(port.idxmin().date()), "worstRet": r(float(rv.min()), 4),
        },
        "var": table,
        "backtest": {**backtest, "expected": r(0.01 * n_fc, 1), "n": n_fc},
        "chart": chart,
    }
    ts = write_ts(SLUG, payload)
    src = ts.read_text(encoding="utf-8").replace(
        f"quant/tutorials/{SLUG.replace('-', '_')}.py", "quant/legacy/var_cvar.py")
    ts.write_text(src, encoding="utf-8")

    # ------------------------------------------------------------ notebook
    cells = [
        md(f"""# VaR & CVaR, three ways

**pyportfolios.com** · [/research/var-cvar-three-ways](https://pyportfolios.com/research/var-cvar-three-ways) · 60/40 SPY + AGG, 2003 – 2023 · NumPy · SciPy · Pandas · yfinance

One number, three recipes — and the recipes disagree exactly when it matters.
On a daily-rebalanced 60/40 equity/bond book we

1. compute 99% (and 95%) VaR and CVaR by **historical simulation**,
   **parametric** (normal and Student-t) and **Monte Carlo** ({MC_DRAWS:,} seeded draws),
2. backtest a rolling {WINDOW}-day historical VaR out of sample, and
3. score the breach rate with Kupiec's proportion-of-failures test."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from scipy import stats

plt.rcParams["figure.figsize"] = (10, 5)
SEED = 42"""),
        md("""## 1 · Data: two decades of the 60/40

SPY (S&P 500) and AGG (US aggregate bonds) from AGG's 2003 inception through
2023 — the GFC, the 2011 and 2018 wobbles, COVID, and 2022, the year the
diversifier failed. Daily-rebalanced 60/40."""),
        code("""px = yf.download(["SPY", "AGG"], start="2003-01-01", end="2024-01-01",
                 auto_adjust=True, progress=False)["Close"].dropna()
rets = px.pct_change().dropna()
port = 0.6 * rets["SPY"] + 0.4 * rets["AGG"]
rv = port.values
print(f"{len(port)} days, worst {port.idxmin().date()} ({port.min():.2%})")"""),
        md("""## 2 · Historical simulation

No model: VaR at level α is the empirical (1−α)-quantile of returns, negated;
CVaR is the mean return beyond it."""),
        code("""def hist_var_cvar(x, alpha=0.99):
    q = np.quantile(x, 1 - alpha)
    return -q, -x[x <= q].mean()

for a in (0.99, 0.95):
    v, c = hist_var_cvar(rv, a)
    print(f"historical {a:.0%}: VaR = {v:.3%}   CVaR = {c:.3%}")"""),
        md("""## 3 · Parametric: normal, then Student-t

The variance–covariance formula, then the one-line tail fix: replace the
normal with a Student-t whose degrees of freedom are fitted by MLE."""),
        code("""mu, sd = rv.mean(), rv.std(ddof=1)
t_df, t_loc, t_scale = stats.t.fit(rv)
print(f"fitted Student-t df = {t_df:.2f}")

for a in (0.99, 0.95):
    z = stats.norm.ppf(1 - a)
    nv = -(mu + sd * z)
    tv = -(t_loc + t_scale * stats.t.ppf(1 - a, t_df))
    print(f"{a:.0%}  normal VaR {nv:.3%}   Student-t VaR {tv:.3%}")"""),
        md(f"""## 4 · Monte Carlo

Simulate {MC_DRAWS:,} seeded draws from the fitted Student-t and read the
empirical tail. On one linear book this must agree with the analytic t to
Monte-Carlo error — its value appears once the portfolio has optionality."""),
        code(f"""rng = np.random.default_rng(SEED)
draws = t_loc + t_scale * rng.standard_t(t_df, {MC_DRAWS})

for a in (0.99, 0.95):
    v, c = hist_var_cvar(draws, a)
    print(f"monte carlo {{a:.0%}}: VaR = {{v:.3%}}   CVaR = {{c:.3%}}")"""),
        md(f"""## 5 · Backtest: rolling window + Kupiec

Forecast day *t*'s 99% VaR from the previous {WINDOW} days only, count
breaches, and test the rate with Kupiec's (1995) likelihood ratio
(χ²(1) under H₀: true breach probability = 1%)."""),
        code(f"""WINDOW = {WINDOW}
f_hist = port.rolling(WINDOW).quantile(0.01).shift(1).values
f_norm = (port.rolling(WINDOW).mean()
          + port.rolling(WINDOW).std(ddof=1) * stats.norm.ppf(0.01)).shift(1).values

def kupiec(x, n, p=0.01):
    phat = x / n
    ll0 = (n - x) * np.log(1 - p) + x * np.log(p)
    ll1 = (n - x) * np.log(1 - phat) + (x * np.log(phat) if x > 0 else 0.0)
    lr = -2 * (ll0 - ll1)
    return lr, stats.chi2.sf(lr, 1)

n, n_fc = len(rv), len(rv) - WINDOW
for name, f in (("hist", f_hist), ("normal", f_norm)):
    valid = ~np.isnan(f)
    x = int((rv[valid] < f[valid]).sum())
    lr, p = kupiec(x, n_fc)
    print(f"{{name:>6}}: {{x}} breaches / {{n_fc}} (expected {{0.01 * n_fc:.1f}})  "
          f"Kupiec LR = {{lr:.2f}}  p = {{p:.4f}}")"""),
        code("""breach = rv < f_hist
year = port.index.year == 2020
plt.plot(port.index[year], rv[year], lw=0.7, color="grey", label="daily return")
plt.plot(port.index[year], f_hist[year], lw=1.5, label="rolling 99% -VaR (hist)")
plt.scatter(port.index[year & breach], rv[year & breach],
            s=22, color="crimson", zorder=3, label="breach")
plt.legend(); plt.title("60/40 daily returns vs rolling 250d 99% VaR - 2020");"""),
        md("""## Takeaways

- The three recipes give materially different 99% VaRs on the same book; the
  normal sits lowest — fat tails are exactly what it assumes away.
- The fitted Student-t df is small: even a sleepy 60/40 book is far from Gaussian.
- Rolling historical VaR breaches too often, and the breaches cluster (March
  2020) — Kupiec rejects the 1% rate, which is the case for conditional models.
- CVaR comes free alongside each method and is the better number for limits.
- Never ship a VaR you have not backtested.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")


if __name__ == "__main__":
    main()
