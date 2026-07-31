"""
T07 - Risk Parity from Scratch (topic card 07/16).
Assets: SPY · TLT · GLD · DBC · Timeframe: Jan 2010 - Dec 2024 · Libs: SciPy (build) · Riskfolio-Lib (validate).

Defines risk contributions, shows why equal capital weights concentrate risk in
equities, solves the equal-risk-contribution (ERC) weights with SciPy SLSQP,
validates against Riskfolio-Lib, and backtests monthly-rebalanced risk parity
vs 60/40 and equal weight. Emits the article data module + runnable notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import riskfolio as rp
from scipy.optimize import minimize

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "risk-parity-from-scratch"
ASSETS = ["SPY", "TLT", "GLD", "DBC"]
TDAYS = 252


def risk_contrib(w: np.ndarray, cov: np.ndarray) -> np.ndarray:
    """RC_i = w_i (Sigma w)_i / (w' Sigma w) — shares that sum to 1."""
    port_var = float(w @ cov @ w)
    return w * (cov @ w) / port_var


def solve_erc(cov: np.ndarray) -> np.ndarray:
    """Equal-risk-contribution weights: SLSQP, long-only, fully invested."""
    n = cov.shape[0]

    def objective(w: np.ndarray) -> float:
        rc = risk_contrib(w, cov)
        return float(np.sum((rc - 1.0 / n) ** 2))

    res = minimize(
        objective,
        x0=np.full(n, 1.0 / n),
        method="SLSQP",
        bounds=[(0.0, 1.0)] * n,
        constraints=[{"type": "eq", "fun": lambda w: w.sum() - 1.0}],
        options={"maxiter": 1_000, "ftol": 1e-16},
    )
    if not res.success:
        raise RuntimeError(f"SLSQP failed: {res.message}")
    return res.x


def perf_stats(rets_m: pd.Series) -> dict[str, float]:
    growth = (1 + rets_m).cumprod()
    n = len(rets_m)
    ann_ret = float(growth.iloc[-1] ** (12 / n) - 1)
    ann_vol = float(rets_m.std(ddof=1) * np.sqrt(12))
    sharpe = float(rets_m.mean() / rets_m.std(ddof=1) * np.sqrt(12))
    max_dd = float((growth / growth.cummax() - 1).min())
    return {"annRet": ann_ret, "annVol": ann_vol, "sharpe": sharpe, "maxDD": max_dd}


def main() -> None:
    px = load("t07_risk_parity")[ASSETS].dropna()
    rets_d = px.pct_change().dropna()
    cov_a = rets_d.cov().values * TDAYS  # annualised covariance
    vols_a = np.sqrt(np.diag(cov_a))

    # --- 1 · naive equal capital weights -> concentrated risk ---------------
    w_eq = np.full(4, 0.25)
    rc_eq = risk_contrib(w_eq, cov_a)
    # the classic hook: in a 60/40, equities are nearly all of the risk
    w_6040 = np.array([0.60, 0.40, 0.0, 0.0])
    rc_6040_spy = float(risk_contrib(w_6040, cov_a)[0])

    # --- 2 · ERC weights via SciPy SLSQP ------------------------------------
    w_erc = solve_erc(cov_a)
    rc_erc = risk_contrib(w_erc, cov_a)
    vol_erc = float(np.sqrt(w_erc @ cov_a @ w_erc))

    # --- 3 · validate against Riskfolio-Lib ---------------------------------
    port = rp.Portfolio(returns=rets_d)
    port.assets_stats(method_mu="hist", method_cov="hist")
    w_rf = port.rp_optimization(model="Classic", rm="MV", rf=0, b=None, hist=True)
    w_rf = w_rf.loc[ASSETS, "weights"].values
    max_diff = float(np.abs(w_erc - w_rf).max())
    print("ERC weights (scipy)    :", np.round(w_erc, 4))
    print("ERC weights (riskfolio):", np.round(w_rf, 4))
    print(f"max |diff|             : {max_diff:.2e}")
    assert max_diff < 1e-3, "scipy and Riskfolio-Lib disagree beyond tolerance"

    # --- 4 · backtest: monthly-rebalanced constant-mix portfolios -----------
    px_m = px.resample("ME").last()
    rets_m = px_m.pct_change().dropna()

    strat_w = {
        "rp": pd.Series(w_erc, index=ASSETS),
        "b6040": pd.Series({"SPY": 0.60, "TLT": 0.40, "GLD": 0.0, "DBC": 0.0}),
        "ew": pd.Series(w_eq, index=ASSETS),
    }
    strat_rets = {k: rets_m.mul(w, axis=1).sum(axis=1) for k, w in strat_w.items()}
    stats = {k: perf_stats(v) for k, v in strat_rets.items()}

    def growth_curve(rets: pd.Series) -> list[float]:
        g = 100 * (1 + rets).cumprod()
        return [100.0] + [round(float(v), 2) for v in g]  # 180 pts, <=260

    # leverage needed for risk parity to run at 60/40's volatility (rf = 0)
    lev = stats["b6040"]["annVol"] / stats["rp"]["annVol"]
    lev_ret = lev * stats["rp"]["annRet"]

    payload = {
        "params": {
            "start": str(px.index[0].date()), "end": str(px.index[-1].date()),
            "assets": ASSETS, "nObs": int(len(rets_d)), "nMonths": int(len(rets_m)),
            "annVols": {a: r(float(v)) for a, v in zip(ASSETS, vols_a)},
        },
        "naive": {
            "weights": r(list(w_eq)),
            "riskContrib": r(list(rc_eq)),
            "spyShareIn6040": r(rc_6040_spy),
        },
        "erc": {
            "weights": r(list(w_erc)),
            "riskContrib": r(list(rc_erc)),
            "portVol": r(vol_erc),
            "scipyWeights": r(list(w_erc), 6),
            "riskfolioWeights": r(list(w_rf), 6),
            "maxDiff": r(max_diff, 8),
        },
        "growth": {
            "rp": growth_curve(strat_rets["rp"]),
            "b6040": growth_curve(strat_rets["b6040"]),
            "ew": growth_curve(strat_rets["ew"]),
            "xLabels": [[f, l] for f, l in year_labels(px_m.index, 2)],
        },
        "stats": {
            **{k: {s: r(v) for s, v in st.items()} for k, st in stats.items()},
            "leverage": {"factor": r(lev, 2), "leveredRet": r(lev_ret)},
        },
    }
    ts = write_ts(SLUG, payload)

    fw = ", ".join(f"{a}: {w:.1%}" for a, w in zip(ASSETS, w_erc))
    cells = [
        md(f"""# Risk Parity from Scratch

**pyportfolios.com tutorial T07** · SPY · TLT · GLD · DBC, Jan 2010 – Dec 2024 · SciPy (build) · Riskfolio-Lib (validate)

A 25%-each portfolio is only diversified in *dollars* — measured in risk, equities
dominate it. Risk parity allocates by **risk contribution** instead of capital:
every asset contributes the same share of portfolio variance. In this notebook we

1. define risk contributions and show how badly equal capital weights concentrate risk,
2. solve the equal-risk-contribution (ERC) weights with `scipy.optimize.minimize`,
3. validate the solution against Riskfolio-Lib's risk-parity optimizer, and
4. backtest monthly-rebalanced risk parity vs 60/40 and equal weight, 2010–2024."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from scipy.optimize import minimize

plt.rcParams["figure.figsize"] = (10, 5)
ASSETS = ["SPY", "TLT", "GLD", "DBC"]"""),
        md("""## 1 · Data: four asset classes

Equities (SPY), long Treasuries (TLT), gold (GLD) and broad commodities (DBC) —
the classic all-weather building blocks. Fifteen years of adjusted closes covering
the post-GFC bull, the 2013 taper tantrum, COVID, and the 2022 bond crash."""),
        code("""px = yf.download(ASSETS, start="2010-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"][ASSETS].dropna()
rets = px.pct_change().dropna()

cov = rets.cov().values * 252            # annualised covariance
vols = np.sqrt(np.diag(cov))
for a, v in zip(ASSETS, vols):
    print(f"{a}: ann. vol = {v:.1%}")"""),
        md("""## 2 · Risk contributions — where equal weights go wrong

Portfolio volatility decomposes exactly across assets. With $\\sigma_p^2 = w'\\Sigma w$,
the **risk contribution share** of asset $i$ is

$$RC_i = \\frac{w_i\\,(\\Sigma w)_i}{w'\\Sigma w}, \\qquad \\sum_i RC_i = 1.$$

Compute it for the naive 25%-each portfolio and the punchline writes itself: capital
is split evenly, risk is not."""),
        code("""def risk_contrib(w, cov):
    return w * (cov @ w) / (w @ cov @ w)

w_eq = np.full(4, 0.25)
rc_eq = risk_contrib(w_eq, cov)

pd.DataFrame({"capital weight": w_eq, "risk contribution": rc_eq},
             index=ASSETS).plot.bar(title="Equal capital ≠ equal risk")
for a, rc in zip(ASSETS, rc_eq):
    print(f"{a}: RC = {rc:.1%}")

# and the classic hook: in a 60/40, equities are almost all of the risk
w_6040 = np.array([0.60, 0.40, 0.0, 0.0])
print(f"SPY share of 60/40 risk: {risk_contrib(w_6040, cov)[0]:.1%}")"""),
        md("""## 3 · Solving for equal risk contributions (SciPy)

The ERC portfolio makes every $RC_i = 1/n$. There is no closed form for general
$\\Sigma$, but the problem is a small smooth optimisation: minimise the sum of squared
deviations of risk contributions from $1/n$, long-only, fully invested — SLSQP eats it."""),
        code("""def solve_erc(cov):
    n = cov.shape[0]
    objective = lambda w: np.sum((risk_contrib(w, cov) - 1/n) ** 2)
    res = minimize(objective, np.full(n, 1/n), method="SLSQP",
                   bounds=[(0, 1)] * n,
                   constraints=[{"type": "eq", "fun": lambda w: w.sum() - 1}],
                   options={"maxiter": 1000, "ftol": 1e-16})
    assert res.success, res.message
    return res.x

w_erc = solve_erc(cov)
rc_erc = risk_contrib(w_erc, cov)
for a, w, rc in zip(ASSETS, w_erc, rc_erc):
    print(f"{a}: weight = {w:.1%}   RC = {rc:.1%}")"""),
        md("""## 4 · Validation: Riskfolio-Lib

Never trust a hand-rolled optimizer without a second opinion. Riskfolio-Lib solves the
same ERC problem through a convex reformulation (Spinu 2013) with a proper conic solver —
if our SLSQP weights match to ~1e-3, both are right."""),
        code("""import riskfolio as rp

port = rp.Portfolio(returns=rets)
port.assets_stats(method_mu="hist", method_cov="hist")
w_rf = port.rp_optimization(model="Classic", rm="MV", rf=0, b=None, hist=True)
w_rf = w_rf.loc[ASSETS, "weights"].values

print("scipy    :", np.round(w_erc, 4))
print("riskfolio:", np.round(w_rf, 4))
print(f"max |diff| = {np.abs(w_erc - w_rf).max():.2e}")"""),
        md("""## 5 · Backtest: risk parity vs 60/40 vs equal weight

Three constant-mix portfolios, rebalanced back to target at every month-end,
2010–2024. (The ERC weights use the full-sample covariance — fine for illustrating
the *risk profile*; a production system re-estimates on a rolling window.)"""),
        code("""px_m = px.resample("ME").last()
rets_m = px_m.pct_change().dropna()

weights = {
    "Risk parity":  pd.Series(w_erc, index=ASSETS),
    "60/40":        pd.Series({"SPY": .6, "TLT": .4, "GLD": 0, "DBC": 0}),
    "Equal weight": pd.Series(0.25, index=ASSETS),
}
curves = {}
for name, w in weights.items():
    pr = rets_m.mul(w, axis=1).sum(axis=1)
    curves[name] = 100 * (1 + pr).cumprod()
    ann_ret = curves[name].iloc[-1] ** (12 / len(pr)) - 1
    ann_vol = pr.std(ddof=1) * np.sqrt(12)
    sharpe  = pr.mean() / pr.std(ddof=1) * np.sqrt(12)
    max_dd  = (curves[name] / curves[name].cummax() - 1).min()
    curves[name] /= curves[name].iloc[0] / 100
    print(f"{name:13s} ret={ann_ret: .2%}  vol={ann_vol:.2%}  "
          f"Sharpe={sharpe:.2f}  maxDD={max_dd: .1%}")

pd.DataFrame(curves).plot(title="Growth of $100, monthly rebalanced (2010–2024)");"""),
        md("""## 6 · The leverage debate

Risk parity's Sharpe is competitive and its drawdowns are the shallowest of the three —
but unlevered it *returns less*, because equalising risk means holding a lot of
low-volatility bonds. The classic prescription (Bridgewater's All Weather, AQR) is to
lever the risk-parity portfolio up to equity-like volatility."""),
        code("""vol_rp   = rets_m.mul(weights["Risk parity"],  axis=1).sum(axis=1).std() * np.sqrt(12)
vol_6040 = rets_m.mul(weights["60/40"], axis=1).sum(axis=1).std() * np.sqrt(12)

lev = vol_6040 / vol_rp
print(f"leverage to run risk parity at 60/40 vol: {lev:.2f}x")
print(f"levered risk-parity return (rf=0 approx): "
      f"{lev * ((1 + rets_m.mul(weights['Risk parity'], axis=1).sum(axis=1)).prod() ** (12/len(rets_m)) - 1):.2%}")"""),
        md(f"""## Takeaways

- Equal capital weights are not diversification: 25% each puts most of the risk in equities.
- The ERC solution ({fw}) equalises risk contributions at 25% each — heavy in bonds, light in equities and commodities.
- SciPy's SLSQP and Riskfolio-Lib's conic solver agree to ~1e-4 — always validate a hand-rolled optimizer.
- Unlevered risk parity earns less than 60/40 but with a better Sharpe and shallower drawdowns; the leverage
  required to match 60/40's volatility is the entire risk-parity debate in one number.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    print("naive RC :", np.round(rc_eq, 4))
    print("ERC RC   :", np.round(rc_erc, 4))
    for k, st in stats.items():
        print(f"{k:6s} ret={st['annRet']:.4f} vol={st['annVol']:.4f} "
              f"sharpe={st['sharpe']:.2f} maxDD={st['maxDD']:.4f}")
    print(f"leverage to 60/40 vol: {lev:.2f}x -> levered ret {lev_ret:.4f}")


if __name__ == "__main__":
    main()
