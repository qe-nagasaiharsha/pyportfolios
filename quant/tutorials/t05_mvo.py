"""
T05 - MVO & the Efficient Frontier (topic card 05/16).
Assets: SPY TLT GLD VNQ VEA VWO · Timeframe: Jan 2015 - Dec 2024 ·
Libs: PyPortfolioOpt Pandas Matplotlib.

Estimates expected returns + covariance from real ETF data, traces the
long-only efficient frontier, solves the max-Sharpe / min-vol portfolios,
and emits the article data module + the runnable notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from pypfopt import EfficientFrontier, expected_returns, risk_models
from pypfopt.risk_models import CovarianceShrinkage

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "mvo-efficient-frontier"
SEED = 42
RF = 0.03
N_RANDOM = 2_000
CLOUD_POINTS = 400
TICKERS = ["SPY", "TLT", "GLD", "VNQ", "VEA", "VWO"]


def main() -> None:
    px = load("t05_mvo")[TICKERS].dropna()

    # --- inputs: expected returns + covariance --------------------------------
    mu = expected_returns.mean_historical_return(px)          # CAGR per asset
    S = risk_models.sample_cov(px)                            # annualised
    lw = CovarianceShrinkage(px)
    S_lw = lw.ledoit_wolf()
    delta = float(lw.delta)                                   # shrinkage intensity

    asset_vol = np.sqrt(np.diag(S.values))
    asset_sharpe = (mu.values - RF) / asset_vol

    # --- optimal portfolios (long-only, rf = 3%) ------------------------------
    ef_ms = EfficientFrontier(mu, S)
    ef_ms.max_sharpe(risk_free_rate=RF)
    w_ms = np.array([ef_ms.clean_weights()[t] for t in TICKERS])
    ret_ms, vol_ms, sharpe_ms = ef_ms.portfolio_performance(risk_free_rate=RF)

    ef_mv = EfficientFrontier(mu, S)
    ef_mv.min_volatility()
    w_mv = np.array([ef_mv.clean_weights()[t] for t in TICKERS])
    ret_mv, vol_mv, sharpe_mv = ef_mv.portfolio_performance(risk_free_rate=RF)

    # same objective under the Ledoit-Wolf matrix -> how fragile are the weights?
    ef_lw = EfficientFrontier(mu, S_lw)
    ef_lw.max_sharpe(risk_free_rate=RF)
    w_ms_lw = np.array([ef_lw.clean_weights()[t] for t in TICKERS])

    # concentration diagnostics (the pedagogical punchline)
    n_held_ms = int((w_ms > 1e-4).sum())
    n_eff_ms = float(1.0 / np.sum(w_ms**2))
    n_eff_mv = float(1.0 / np.sum(w_mv**2))

    # --- efficient frontier: sweep target returns, minimise vol ---------------
    targets = np.linspace(ret_mv, float(mu.max()) * 0.9999, 40)
    frontier: list[list[float]] = []
    for t in targets:
        ef = EfficientFrontier(mu, S)
        ef.efficient_return(target_return=float(t))
        f_ret, f_vol, _ = ef.portfolio_performance(risk_free_rate=RF)
        frontier.append([f_vol, f_ret])

    # --- random long-only portfolios (Dirichlet cloud) ------------------------
    rng = np.random.default_rng(SEED)
    w_rand = rng.dirichlet(np.ones(len(TICKERS)), size=N_RANDOM)
    rand_ret = w_rand @ mu.values
    rand_vol = np.sqrt(np.einsum("ij,jk,ik->i", w_rand, S.values, w_rand))
    keep = np.linspace(0, N_RANDOM - 1, CLOUD_POINTS).round().astype(int)
    cloud = [[float(rand_vol[i]), float(rand_ret[i])] for i in keep]

    # --- capital market line ---------------------------------------------------
    cml_x1 = vol_ms * 1.3
    cml = [[0.0, RF], [cml_x1, RF + sharpe_ms * cml_x1]]

    # --- in-sample growth of $100: max-Sharpe vs equal-weight vs SPY ----------
    rets = px.pct_change().dropna()
    w_eq = np.ones(len(TICKERS)) / len(TICKERS)
    growth = {
        "maxSharpe": 100 * (1 + rets.values @ w_ms).cumprod(),
        "equalWeight": 100 * (1 + rets.values @ w_eq).cumprod(),
        "spy": 100 * (1 + rets["SPY"].values).cumprod(),
    }

    # correlation of daily returns — drives the heatmap that replaced the
    # static mvo-corr.png (charts are drawn from data, not shipped as images)
    corr = rets[TICKERS].corr()

    payload = {
        "corr": {
            "labels": TICKERS,
            "values": [[r(float(corr.loc[a, b]), 2) for b in TICKERS] for a in TICKERS],
        },
        "params": {
            "start": str(px.index[0].date()), "end": str(px.index[-1].date()),
            "n_obs": int(len(px)), "seed": SEED, "rf": RF,
            "nRandom": N_RANDOM, "tickers": TICKERS,
        },
        "frontier": {
            "cloud": r(cloud),
            "line": r(frontier),
            "cml": r(cml),
            "assets": [
                {"t": t, "vol": r(float(asset_vol[i])), "ret": r(float(mu.values[i]))}
                for i, t in enumerate(TICKERS)
            ],
            "maxSharpe": {"vol": r(vol_ms), "ret": r(ret_ms), "sharpe": r(sharpe_ms, 2)},
            "minVol": {"vol": r(vol_mv), "ret": r(ret_mv), "sharpe": r(sharpe_mv, 2)},
        },
        "weights": {
            "labels": TICKERS,
            "maxSharpe": r(list(w_ms)),
            "minVol": r(list(w_mv)),
            "maxSharpeLW": r(list(w_ms_lw)),
            "nHeldMS": n_held_ms,
            "nEffMS": r(n_eff_ms, 2),
            "nEffMV": r(n_eff_mv, 2),
            "lwDelta": r(delta),
        },
        "assetsTable": [
            {"t": t, "ret": r(float(mu.values[i])), "vol": r(float(asset_vol[i])),
             "sharpe": r(float(asset_sharpe[i]), 2)}
            for i, t in enumerate(TICKERS)
        ],
        "growth": {
            "maxSharpe": downsample(growth["maxSharpe"], 240),
            "equalWeight": downsample(growth["equalWeight"], 240),
            "spy": downsample(growth["spy"], 240),
            "xLabels": [[f, l] for f, l in year_labels(rets.index, 2)],
            "final": {k: r(float(v[-1]), 1) for k, v in growth.items()},
        },
    }
    ts = write_ts(SLUG, payload)

    cells = [
        md(f"""# MVO & the Efficient Frontier

**pyportfolios.com tutorial T05** · SPY · TLT · GLD · VNQ · VEA · VWO, Jan 2015 – Dec 2024 · PyPortfolioOpt · Pandas · Matplotlib

Markowitz's 1952 insight — judge every asset by what it does to the *portfolio's*
risk and return, not by its own merits — is still the backbone of asset allocation.
In this notebook we

1. estimate expected returns and the covariance matrix from six real ETFs,
2. trace the long-only efficient frontier with PyPortfolioOpt,
3. solve the max-Sharpe and min-volatility portfolios (rf = {RF:.0%}), and
4. meet mean–variance's famous weakness: extreme sensitivity to its inputs."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from pypfopt import EfficientFrontier, expected_returns, risk_models
from pypfopt.risk_models import CovarianceShrinkage

plt.rcParams["figure.figsize"] = (10, 5)
SEED, RF = 42, 0.03
TICKERS = ["SPY", "TLT", "GLD", "VNQ", "VEA", "VWO"]"""),
        md("""## 1 · Data: six asset-class ETFs

US equities (SPY), long Treasuries (TLT), gold (GLD), REITs (VNQ), developed
international (VEA), and emerging markets (VWO) — a compact multi-asset menu
covering ten years that include a rate-hiking cycle, COVID, and two bull runs."""),
        code("""px = yf.download(TICKERS, start="2015-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"][TICKERS].dropna()
(px / px.iloc[0] * 100).plot(title="Growth of $100, 2015–2024"); plt.ylabel("$");"""),
        md("""## 2 · The two inputs: μ and Σ

Mean–variance needs an expected-return vector and a covariance matrix. We use
the standard historical estimators — annualised geometric mean returns and the
annualised sample covariance — plus a Ledoit–Wolf shrunk covariance for
comparison later. **These estimates carry large errors, and MVO will amplify
them**; that is the lesson of section 6."""),
        code("""mu = expected_returns.mean_historical_return(px)   # CAGR per asset
S  = risk_models.sample_cov(px)                    # annualised covariance

cs = CovarianceShrinkage(px)
S_lw = cs.ledoit_wolf()
print(mu.round(4))
print(f"\\nLedoit-Wolf shrinkage intensity delta = {cs.delta:.4f}")"""),
        md("""## 3 · The random-portfolio cloud and the frontier

2,000 random long-only portfolios (Dirichlet weights) show what's *attainable*;
the efficient frontier is its upper-left edge — for each target return, the
minimum-variance portfolio that reaches it."""),
        code("""rng = np.random.default_rng(SEED)
w_rand = rng.dirichlet(np.ones(len(TICKERS)), size=2000)
rand_ret = w_rand @ mu.values
rand_vol = np.sqrt(np.einsum("ij,jk,ik->i", w_rand, S.values, w_rand))

ef = EfficientFrontier(mu, S)
ef.min_volatility()
ret_mv, vol_mv, _ = ef.portfolio_performance(risk_free_rate=RF)

targets = np.linspace(ret_mv, mu.max() * 0.9999, 40)
frontier = []
for t in targets:
    ef = EfficientFrontier(mu, S)          # fresh solver per target
    ef.efficient_return(target_return=t)
    f_ret, f_vol, _ = ef.portfolio_performance(risk_free_rate=RF)
    frontier.append((f_vol, f_ret))
frontier = np.array(frontier)

plt.scatter(rand_vol, rand_ret, s=6, alpha=0.3, label="random portfolios")
plt.plot(frontier[:, 0], frontier[:, 1], lw=2.5, color="teal", label="efficient frontier")
plt.xlabel("volatility (ann.)"); plt.ylabel("expected return (ann.)"); plt.legend();
plt.show()
"""),
        md(f"""## 4 · Max-Sharpe, min-vol, and the capital market line

With a risk-free rate the whole frontier collapses to one risky portfolio: the
**tangency (max-Sharpe) portfolio**. Every efficient investor holds it, levered
up or down along the capital market line (rf = {RF:.0%})."""),
        code("""ef = EfficientFrontier(mu, S)
ef.max_sharpe(risk_free_rate=RF)
w_ms = pd.Series(ef.clean_weights())
ret_ms, vol_ms, sharpe_ms = ef.portfolio_performance(risk_free_rate=RF, verbose=True)

ef = EfficientFrontier(mu, S)
ef.min_volatility()
w_minvol = pd.Series(ef.clean_weights())
ret_minv, vol_minv, sharpe_minv = ef.portfolio_performance(risk_free_rate=RF)

cml_x = np.array([0, vol_ms * 1.3])
plt.scatter(rand_vol, rand_ret, s=6, alpha=0.25)
plt.plot(frontier[:, 0], frontier[:, 1], lw=2.5, color="teal")
plt.plot(cml_x, RF + sharpe_ms * cml_x, "--", color="grey", label="CML")
plt.scatter([vol_ms], [ret_ms], marker="*", s=220, color="darkorange", label="max Sharpe", zorder=5)
plt.scatter([vol_minv], [ret_minv], marker="D", s=70, color="crimson", label="min vol", zorder=5)
for t in TICKERS:
    plt.annotate(t, (np.sqrt(S.loc[t, t]), mu[t]))
plt.scatter(np.sqrt(np.diag(S)), mu, marker="x", color="k")
plt.xlabel("volatility (ann.)"); plt.ylabel("expected return (ann.)"); plt.legend();
plt.show()
"""),
        md("""## 5 · The weights — and the concentration problem

Look at what the optimiser actually holds. Max-Sharpe piles into the few assets
with the best in-sample Sharpe ratios and zeroes out the rest — a classic MVO
symptom: it treats noisy return estimates as gospel and maximises into their
errors ("error maximisation", Michaud 1989)."""),
        code("""weights = pd.DataFrame({"max Sharpe": w_ms, "min vol": w_minvol})
print(weights.round(4))
weights.plot.bar(title="Optimal weights"); plt.ylabel("weight");

n_eff = 1 / (w_ms**2).sum()
print(f"\\nmax-Sharpe holds {(w_ms > 1e-4).sum()} of {len(TICKERS)} assets"
      f"  ->  effective N = {n_eff:.2f}")

# same objective, Ledoit-Wolf covariance: watch the weights move
ef = EfficientFrontier(mu, S_lw)
ef.max_sharpe(risk_free_rate=RF)
print("\\nmax Sharpe under Ledoit-Wolf covariance:")
print(pd.Series(ef.clean_weights()).round(4))"""),
        md("""## 6 · In-sample performance (read the fine print)

Backtesting the max-Sharpe weights on the *same decade used to fit them* is not
a forecast — it is the optimiser grading its own homework. We plot it anyway,
because the comparison against equal-weight and SPY makes the in-sample flattery
visible and honest."""),
        code("""rets = px.pct_change().dropna()
w_eq = np.ones(len(TICKERS)) / len(TICKERS)

growth = pd.DataFrame({
    "max Sharpe (in-sample)": (1 + rets @ w_ms.values).cumprod(),
    "equal weight":           (1 + rets @ w_eq).cumprod(),
    "SPY":                    (1 + rets["SPY"]).cumprod(),
}) * 100
growth.plot(title="Growth of $100 (weights fitted on this same sample)");
print(growth.iloc[-1].round(1))"""),
        md("""## Takeaways

- The frontier is the upper-left edge of everything attainable; with a
  risk-free asset it collapses to one tangency portfolio plus leverage.
- PyPortfolioOpt reduces the whole workflow to a few lines: estimators in,
  convex solver out.
- The max-Sharpe portfolio is concentrated — MVO amplifies estimation error
  in μ far more than diversification logic would suggest.
- Fixes are the next tutorials: shrink the covariance (Ledoit–Wolf), and
  discipline the return forecasts with priors (Black–Litterman, T06).

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    print(f"maxSharpe: ret={ret_ms:.4f} vol={vol_ms:.4f} sharpe={sharpe_ms:.2f} w={dict(zip(TICKERS, w_ms.round(4)))}")
    print(f"minVol   : ret={ret_mv:.4f} vol={vol_mv:.4f} sharpe={sharpe_mv:.2f} w={dict(zip(TICKERS, w_mv.round(4)))}")
    print(f"LW delta={delta:.4f}  nHeldMS={n_held_ms}  nEffMS={n_eff_ms:.2f}")
    print(f"growth final: {payload['growth']['final']}")


if __name__ == "__main__":
    main()
