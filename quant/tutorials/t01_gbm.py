"""
T01 - GBM: Simulating Price Paths (topic card 01/16).
Assets: SPY · Timeframe: Jan 2018 - Dec 2024 · Libs: NumPy Pandas Matplotlib yfinance SciPy.

Computes real parameters from SPY, simulates GBM paths (seeded), and emits the
article data module + the runnable notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from scipy import stats

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "gbm-simulating-price-paths"
SEED = 42
N_PATHS = 5_000
HORIZON_DAYS = 252


def main() -> None:
    px = load("t01_gbm")["SPY"].dropna()
    logret = np.log(px / px.shift(1)).dropna()

    mu_d, sigma_d = logret.mean(), logret.std(ddof=1)
    mu_a, sigma_a = mu_d * 252, sigma_d * np.sqrt(252)
    s0 = float(px.iloc[-1])

    # --- simulate GBM: S_t = S0 exp((mu - sigma^2/2) t + sigma W_t) --------
    rng = np.random.default_rng(SEED)
    dt = 1 / 252
    z = rng.standard_normal((N_PATHS, HORIZON_DAYS))
    increments = (mu_a - 0.5 * sigma_a**2) * dt + sigma_a * np.sqrt(dt) * z
    paths = s0 * np.exp(np.cumsum(increments, axis=1))
    paths = np.hstack([np.full((N_PATHS, 1), s0), paths])

    # percentile cone + sample paths for the chart
    pct = {p: np.percentile(paths, p, axis=0) for p in (5, 25, 50, 75, 95)}
    sample_idx = rng.choice(N_PATHS, 24, replace=False)

    # terminal distribution vs the lognormal the model implies
    terminal = paths[:, -1]
    edges = np.linspace(terminal.min(), np.percentile(terminal, 99.5), 41)
    counts, _ = np.histogram(terminal, bins=edges)
    centres = (edges[:-1] + edges[1:]) / 2
    ln_sigma = sigma_a * np.sqrt(1.0)
    ln_mu = np.log(s0) + (mu_a - 0.5 * sigma_a**2) * 1.0
    dens = stats.lognorm.pdf(centres, s=ln_sigma, scale=np.exp(ln_mu))
    dens_counts = dens * N_PATHS * (edges[1] - edges[0])

    # normality check on the real returns (the model's weak spot)
    jb_stat, jb_p = stats.jarque_bera(logret)
    kurt = stats.kurtosis(logret, fisher=True)
    skew = stats.skew(logret)

    payload = {
        "params": {
            "start": str(px.index[0].date()), "end": str(px.index[-1].date()),
            "n_obs": int(len(logret)), "s0": r(s0, 2),
            "muAnnual": r(mu_a), "sigmaAnnual": r(sigma_a),
            "muDaily": r(mu_d, 6), "sigmaDaily": r(sigma_d, 6),
            "seed": SEED, "nPaths": N_PATHS, "horizonDays": HORIZON_DAYS,
        },
        "history": {
            "y": downsample(px.values, 260),
            "xLabels": [[f, l] for f, l in year_labels(px.index, 1)],
        },
        "cone": {
            "p5": downsample(pct[5], 130), "p25": downsample(pct[25], 130),
            "p50": downsample(pct[50], 130), "p75": downsample(pct[75], 130),
            "p95": downsample(pct[95], 130),
            "samples": [downsample(paths[i], 130) for i in sample_idx[:8]],
        },
        "terminal": {
            "edges": r(list(edges), 2), "counts": [int(c) for c in counts],
            "lognormal": r(list(dens_counts), 2),
            "pctiles": {str(p): r(float(np.percentile(terminal, p)), 2) for p in (5, 25, 50, 75, 95)},
            "probLoss": r(float((terminal < s0).mean())),
        },
        "reality": {
            "jbStat": r(float(jb_stat), 1), "jbP": r(float(jb_p), 6),
            "excessKurtosis": r(float(kurt), 2), "skew": r(float(skew), 2),
        },
    }
    ts = write_ts(SLUG, payload)

    cells = [
        md(f"""# GBM: Simulating Price Paths

**pyportfolios.com tutorial T01** · SPY, Jan 2018 – Dec 2024 · NumPy · Pandas · Matplotlib · yfinance · SciPy

Geometric Brownian Motion is the workhorse stochastic process of quantitative finance —
the engine inside Black–Scholes, Monte-Carlo pricing, and every "wealth projection cone"
you have ever seen. In this notebook we

1. estimate GBM parameters (drift μ, volatility σ) from real SPY data,
2. simulate {N_PATHS:,} price paths one year forward,
3. read scenario percentiles off the simulated cone, and
4. test where the model breaks (spoiler: the tails)."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from scipy import stats

plt.rcParams["figure.figsize"] = (10, 5)
SEED = 42"""),
        md("""## 1 · Data: SPY adjusted closes

We work with the S&P 500 ETF (SPY, State Street) from January 2018 through December 2024 —
a sample that conveniently contains a melt-up, the COVID crash, a bear market, and two
recoveries."""),
        code("""px = yf.download("SPY", start="2018-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"].squeeze().dropna()
px.plot(title="SPY adjusted close");"""),
        md("""## 2 · Estimating μ and σ

GBM says $dS_t = \\mu S_t\\,dt + \\sigma S_t\\,dW_t$, which makes **log returns**
i.i.d. normal: $\\ln(S_{t+\\Delta}/S_t) \\sim \\mathcal N\\big((\\mu - \\tfrac{\\sigma^2}{2})\\Delta,\\ \\sigma^2 \\Delta\\big)$.
So the estimators are just the sample mean and standard deviation of daily log returns,
annualised by 252."""),
        code("""logret = np.log(px / px.shift(1)).dropna()

mu_annual    = logret.mean() * 252
sigma_annual = logret.std(ddof=1) * np.sqrt(252)
s0 = float(px.iloc[-1])

print(f"mu     = {mu_annual: .4f}  per year")
print(f"sigma  = {sigma_annual: .4f}  per year")
print(f"S0     = {s0:.2f}")"""),
        md("""## 3 · Simulating paths

The exact discretisation (no Euler error) is

$$S_{t+\\Delta} = S_t \\exp\\Big[(\\mu - \\tfrac{\\sigma^2}{2})\\Delta + \\sigma\\sqrt{\\Delta}\\,Z\\Big], \\quad Z \\sim \\mathcal N(0,1).$$

Vectorised over a matrix of standard normals, 5,000 one-year paths cost milliseconds."""),
        code(f"""rng = np.random.default_rng(SEED)
n_paths, horizon, dt = {N_PATHS}, 252, 1/252

z = rng.standard_normal((n_paths, horizon))
increments = (mu_annual - 0.5 * sigma_annual**2) * dt + sigma_annual * np.sqrt(dt) * z
paths = s0 * np.exp(np.cumsum(increments, axis=1))
paths = np.hstack([np.full((n_paths, 1), s0), paths])
paths.shape"""),
        md("""## 4 · The scenario cone

Percentiles across paths at each date give the classic wealth-projection cone. This is
exactly how robo-advisors draw "likely range of outcomes" charts — and how desks stress
a book against a distribution of scenarios rather than one point forecast."""),
        code("""t = np.arange(paths.shape[1])
for p in (5, 25, 50, 75, 95):
    plt.plot(t, np.percentile(paths, p, axis=0), label=f"p{p}")
plt.plot(t, paths[:24].T, lw=0.4, alpha=0.35, color="grey")
plt.legend(); plt.title("GBM scenario cone, 1y forward"); plt.xlabel("trading day");"""),
        md("""## 5 · Terminal distribution

At the horizon GBM implies a **lognormal** terminal price. Overlaying the analytic
lognormal density on the simulated histogram is a free correctness check of the
simulation — they should agree to Monte-Carlo error."""),
        code("""terminal = paths[:, -1]

edges = np.linspace(terminal.min(), np.percentile(terminal, 99.5), 41)
plt.hist(terminal, bins=edges, density=True, alpha=0.5, label="simulated")

ln_mu    = np.log(s0) + (mu_annual - 0.5 * sigma_annual**2)
ln_sigma = sigma_annual
grid = np.linspace(edges[0], edges[-1], 400)
plt.plot(grid, stats.lognorm.pdf(grid, s=ln_sigma, scale=np.exp(ln_mu)),
         lw=2, label="analytic lognormal")
plt.legend(); plt.title("Terminal price distribution (1y)");

for p in (5, 25, 50, 75, 95):
    print(f"p{p:>2}: {np.percentile(terminal, p):8.2f}")
print(f"P(loss after 1y) = {(terminal < s0).mean():.1%}")"""),
        md("""## 6 · Where the model breaks

GBM's returns are normal; real returns are not. Jarque–Bera rejects normality
emphatically, and the excess kurtosis quantifies how much fatter the real tails are.
That is why GBM cones are fine for *central* scenarios and dangerous for *tail* risk —
the subject of the VaR and CVaR tutorials (T09, T10)."""),
        code("""jb = stats.jarque_bera(logret)
print(f"Jarque-Bera stat = {jb.statistic:,.1f}   p-value = {jb.pvalue:.2e}")
print(f"excess kurtosis  = {stats.kurtosis(logret):.2f}   (normal = 0)")
print(f"skew             = {stats.skew(logret):.2f}   (normal = 0)")"""),
        md("""## Takeaways

- μ and σ from log returns fully specify GBM; the exact discretisation has zero scheme error.
- 5,000 paths → a scenario cone and a terminal distribution in milliseconds.
- The analytic lognormal matches the simulation — always run this sanity check.
- Real SPY returns have ~10× the excess kurtosis GBM assumes: use GBM for scenario
  *shapes*, never for tail sizing.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    print(f"mu={mu_a:.4f} sigma={sigma_a:.4f} s0={s0:.2f} kurt={kurt:.2f} P(loss)={payload['terminal']['probLoss']}")


if __name__ == "__main__":
    main()
