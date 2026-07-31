"""
T06 - Black-Litterman: Equilibrium + Views (topic card 06/16).
Assets: EWJ · EWG · EWU · EWA · EWC · Timeframe: Jan 2015 - Dec 2024 · Libs: PyPortfolioOpt NumPy.

Demonstrates MVO's instability on raw historical means, then blends
market-implied equilibrium returns with two explicit views (Idzorek
confidences) and emits the article data module + the runnable notebook.
Fully deterministic — no simulation, no RNG.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

from pypfopt import EfficientFrontier, expected_returns, risk_models  # noqa: E402
from pypfopt.black_litterman import BlackLittermanModel, market_implied_prior_returns  # noqa: E402

SLUG = "black-litterman-equilibrium-views"
ORDER = ["EWJ", "EWG", "EWU", "EWA", "EWC"]
COUNTRIES = ["Japan", "Germany", "UK", "Australia", "Canada"]
RF = 0.02          # risk-free rate used throughout
DELTA = 2.5        # market risk-aversion (Black-Litterman default)
TAU = 0.05         # uncertainty scaling on the prior (pypfopt default)
CONFIDENCES = [0.30, 0.30]  # Idzorek confidence per view

# Approximate free-float equity market caps, USD, as of late 2024 (public
# figures, rounded). These set the *prior* weights only — Black-Litterman
# needs relative sizes, not precise values, so rounding is harmless.
MCAPS = {
    "EWJ": 6.2e12,  # Japan
    "EWG": 2.1e12,  # Germany
    "EWU": 3.1e12,  # United Kingdom
    "EWA": 1.7e12,  # Australia
    "EWC": 2.6e12,  # Canada
}

TWEAK_ASSET = "EWU"  # asset whose mean we bump +100bp for the instability demo
TWEAK = 0.01


def unconstrained_weights(mu: np.ndarray, cov: np.ndarray) -> np.ndarray:
    """Inverse-optimization weights w = (delta * Sigma)^-1 (mu - rf).

    The exact inverse of reverse optimization: feeding in the equilibrium
    returns recovers the market-cap weights identically.
    """
    return np.linalg.solve(DELTA * cov, np.asarray(mu, dtype=float) - RF)


def main() -> None:
    px = load("t06_black_litterman")[ORDER].dropna()
    growth = px / px.iloc[0]

    # --- inputs: Ledoit-Wolf covariance + historical means ------------------
    mu_hist = expected_returns.mean_historical_return(px)          # CAGR, annual
    S = risk_models.CovarianceShrinkage(px).ledoit_wolf()          # annualised
    Sv = S.values
    vols = np.sqrt(np.diag(Sv))
    corr = Sv / np.outer(vols, vols)
    avg_corr = float(corr[np.triu_indices(5, k=1)].mean())

    # --- act 1: MVO on raw historical means (the instability demo) ----------
    ef = EfficientFrontier(mu_hist, S)
    ef.max_sharpe(risk_free_rate=RF)
    w_lo = pd.Series(ef.clean_weights())[ORDER]                    # long-only corner
    ret_lo, vol_lo, sharpe_lo = ef.portfolio_performance(risk_free_rate=RF)

    w_hist = unconstrained_weights(mu_hist.values, Sv)             # unconstrained tangency
    mu_tweak = mu_hist.copy()
    mu_tweak[TWEAK_ASSET] += TWEAK
    w_hist_tweak = unconstrained_weights(mu_tweak.values, Sv)
    hist_l1 = float(np.abs(w_hist_tweak - w_hist).sum())

    # --- act 2: reverse-optimize the equilibrium prior ----------------------
    w_mkt = pd.Series(MCAPS)[ORDER] / sum(MCAPS.values())
    prior = market_implied_prior_returns(MCAPS, DELTA, S, risk_free_rate=RF)[ORDER]
    w_prior_check = unconstrained_weights(prior.values, Sv)        # == w_mkt exactly

    # --- act 3: two views, Idzorek confidences -------------------------------
    # view 1 (relative): Japan outperforms Germany by 2%/yr
    # view 2 (absolute): Australia returns 6%/yr
    P = np.array([
        [1.0, -1.0, 0.0, 0.0, 0.0],
        [0.0,  0.0, 0.0, 1.0, 0.0],
    ])
    Q = np.array([0.02, 0.06])
    bl = BlackLittermanModel(
        S, pi=prior.values.reshape(-1, 1), P=P, Q=Q,
        omega="idzorek", view_confidences=CONFIDENCES, risk_aversion=DELTA, tau=TAU,
    )
    post = pd.Series(np.ravel(bl.bl_returns().values), index=ORDER)
    w_bl = unconstrained_weights(post.values, Sv)

    # BL sensitivity: harden view 1 by the same +100bp (2% -> 3%)
    bl_tweak = BlackLittermanModel(
        S, pi=prior.values.reshape(-1, 1), P=P, Q=np.array([Q[0] + TWEAK, Q[1]]),
        omega="idzorek", view_confidences=CONFIDENCES, risk_aversion=DELTA, tau=TAU,
    )
    post_tweak = np.ravel(bl_tweak.bl_returns().values)
    bl_l1 = float(np.abs(unconstrained_weights(post_tweak, Sv) - w_bl).sum())

    payload = {
        "params": {
            "start": str(px.index[0].date()), "end": str(px.index[-1].date()),
            "n_obs": int(len(px)), "rf": RF, "delta": DELTA, "tau": TAU,
            "tickers": ORDER, "countries": COUNTRIES,
            "mcapsT": r([MCAPS[t] / 1e12 for t in ORDER], 1),
            "confidences": CONFIDENCES,
            "avgCorr": r(avg_corr, 2),
        },
        "history": {
            "series": {t: downsample(growth[t].values, 120) for t in ORDER},
            "xLabels": [[f, l] for f, l in year_labels(px.index, 2)],
        },
        "inputs": {
            "vols": r(list(vols)),
            "histMu": r(list(mu_hist[ORDER].values)),
        },
        "returns": {
            "prior": r(list(prior.values)),
            "hist": r(list(mu_hist[ORDER].values)),
            "posterior": r(list(post.values)),
        },
        "weights": {
            "market": r(list(w_mkt.values)),
            "priorCheck": r(list(w_prior_check)),
            "histLongOnly": r(list(w_lo.values)),
            "histUnc": r(list(w_hist)),
            "blUnc": r(list(w_bl)),
            "histPerf": {"ret": r(ret_lo), "vol": r(vol_lo), "sharpe": r(sharpe_lo, 2)},
        },
        "tweak": {
            "asset": TWEAK_ASSET, "bump": TWEAK,
            "histBase": r(list(w_hist)), "histTweaked": r(list(w_hist_tweak)),
            "histL1": r(hist_l1, 3), "blL1": r(bl_l1, 3),
        },
        "views": {
            "rows": [
                {
                    "view": "Japan outperforms Germany by 2%/yr", "type": "relative",
                    "conf": CONFIDENCES[0],
                    "prior": r(float(prior["EWJ"] - prior["EWG"])),
                    "posterior": r(float(post["EWJ"] - post["EWG"])),
                    "target": 0.02,
                },
                {
                    "view": "Australia returns 6%/yr", "type": "absolute",
                    "conf": CONFIDENCES[1],
                    "prior": r(float(prior["EWA"])),
                    "posterior": r(float(post["EWA"])),
                    "target": 0.06,
                },
            ],
            "omega": r([float(v) for v in np.diag(bl.omega)], 6),
        },
    }
    ts = write_ts(SLUG, payload)

    mcap_lines = "\n".join(
        f'    "{t}": {MCAPS[t] / 1e12:.1f}e12,   # {c}' for t, c in zip(ORDER, COUNTRIES)
    )
    cells = [
        md(f"""# Black–Litterman: Equilibrium + Views

**pyportfolios.com tutorial T06** · EWJ · EWG · EWU · EWA · EWC, Jan 2015 – Dec 2024 · PyPortfolioOpt · NumPy

Mean-variance optimization is famously an *error maximiser*: feed it raw historical
means and it hands back extreme corner portfolios that flip violently when an input
moves by basis points. Black–Litterman fixes the inputs instead of the optimizer. In
this notebook we

1. show the instability on five iShares country ETFs,
2. reverse-optimize **equilibrium returns** from market-cap weights,
3. blend in two explicit views with Idzorek confidences, and
4. verify the posterior weights tilt smoothly — and only where the views say."""),
        code("""# pip install PyPortfolioOpt yfinance
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf

from pypfopt import EfficientFrontier, expected_returns, risk_models
from pypfopt.black_litterman import BlackLittermanModel, market_implied_prior_returns

plt.rcParams["figure.figsize"] = (10, 5)
RF, DELTA = 0.02, 2.5"""),
        md("""## 1 · Data: five country ETFs

iShares single-country funds for Japan, Germany, the UK, Australia and Canada —
five developed markets with meaningfully different sector mixes, sharing one decade
(2015–2024) that contains a commodity bust, COVID, and a rate-hiking cycle."""),
        code("""ORDER = ["EWJ", "EWG", "EWU", "EWA", "EWC"]   # JP, DE, UK, AU, CA
px = yf.download(ORDER, start="2015-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"][ORDER].dropna()
(px / px.iloc[0]).plot(title="Growth of $1, 2015-2024");"""),
        md("""## 2 · MVO on raw historical means — the instability demo

Estimate a Ledoit–Wolf shrunk covariance and plain historical mean returns, then
ask for the max-Sharpe portfolio. Long-only, it parks **zero** in three of the five
countries. Unconstrained ($w = (\\delta\\Sigma)^{-1}(\\mu - r_f)$), it shorts the UK
by ~67%. Then bump one input — the UK mean — by a single percentage point and watch
the whole allocation convulse."""),
        code("""mu_hist = expected_returns.mean_historical_return(px)      # annual CAGR
S = risk_models.CovarianceShrinkage(px).ledoit_wolf()       # annualised

ef = EfficientFrontier(mu_hist, S)
ef.max_sharpe(risk_free_rate=RF)
print("long-only max-Sharpe:", ef.clean_weights())

def unconstrained(mu):
    return pd.Series(np.linalg.solve(DELTA * S.values, mu - RF), index=ORDER)

w_hist = unconstrained(mu_hist.values)
mu_bump = mu_hist.copy(); mu_bump["EWU"] += 0.01            # +100bp to the UK
w_bump = unconstrained(mu_bump.values)

print(pd.DataFrame({"base": w_hist, "+100bp UK": w_bump}).round(3))
print(f"L1 weight shift from a 1pp input change: {(w_bump - w_hist).abs().sum():.2f}")"""),
        md("""## 3 · Reverse optimization: the equilibrium prior

Black–Litterman starts from the portfolio nobody argues with — market-cap weights —
and asks *which returns would make it optimal*: $\\Pi = \\delta \\Sigma w_{mkt} + r_f$.
Market caps below are approximate free-float equity totals (late 2024); only their
*relative* sizes matter."""),
        code(f"""MCAPS = {{
{mcap_lines}
}}
w_mkt = pd.Series(MCAPS) / sum(MCAPS.values())

prior = market_implied_prior_returns(MCAPS, DELTA, S, risk_free_rate=RF)
print(pd.DataFrame({{"w_mkt": w_mkt, "equilibrium": prior}}).round(4))

# sanity check: inverting the equilibrium recovers market weights exactly
print(unconstrained(prior.values).round(4))"""),
        md("""## 4 · Two views, with confidence

Views enter through a picking matrix $P$ and a target vector $Q$:

- **relative** — Japan outperforms Germany by 2%/yr → row `[1, -1, 0, 0, 0]`,
- **absolute** — Australia returns 6%/yr → row `[0, 0, 0, 1, 0]`.

Idzorek's method converts a plain-English confidence (here 30% on each) into the
view-uncertainty matrix $\\Omega$, sparing us from guessing its entries directly."""),
        code("""P = np.array([
    [1.0, -1.0, 0.0, 0.0, 0.0],   # Japan beats Germany ...
    [0.0,  0.0, 0.0, 1.0, 0.0],   # Australia returns ...
])
Q = np.array([0.02, 0.06])

bl = BlackLittermanModel(S, pi=prior.values.reshape(-1, 1), P=P, Q=Q,
                         omega="idzorek", view_confidences=[0.30, 0.30],
                         risk_aversion=DELTA, tau=0.05)
post = pd.Series(np.ravel(bl.bl_returns().values), index=ORDER)

pd.DataFrame({"equilibrium": prior, "historical": mu_hist, "posterior": post}).round(4)"""),
        md("""## 5 · Posterior weights — smooth tilts, not convulsions

Invert the posterior exactly as we inverted the prior. Three things to verify:

1. weights move **in the direction of the views** (long Japan vs Germany, trim Australia),
2. assets that appear in **no view** (UK, Canada) stay at their market weights,
3. hardening a view by the same +100bp moves weights ~10× less than the same bump
   did under raw-mean MVO."""),
        code("""w_bl = unconstrained(post.values)
cmp = pd.DataFrame({"market": w_mkt, "hist MVO": w_hist, "Black-Litterman": w_bl})
print(cmp.round(3))
cmp.plot.bar(title="Weights: market cap vs historical MVO vs Black-Litterman");

# sensitivity of the BL weights to the same +100bp, applied to view 1
bl2 = BlackLittermanModel(S, pi=prior.values.reshape(-1, 1), P=P,
                          Q=np.array([0.03, 0.06]), omega="idzorek",
                          view_confidences=[0.30, 0.30], risk_aversion=DELTA, tau=0.05)
w_bl2 = unconstrained(np.ravel(bl2.bl_returns().values))
print(f"BL L1 shift from +100bp on a view: {(w_bl2 - w_bl).abs().sum():.2f}")"""),
        md("""## Takeaways

- Raw historical means hand MVO statistically indistinguishable inputs — it responds
  with corner solutions and violent sensitivity (L1 shift ≈ 1.1 per 1pp input change).
- Reverse optimization gives a prior that is optimal *by construction* at market weights.
- Views are portfolios: relative rows sum to zero, absolute rows pick one asset;
  Idzorek turns "30% confident" into a defensible Ω.
- The posterior tilts only where views act and shrugs at input noise — stable weights
  without extreme bets.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    print(f"prior={r(list(prior.values))} post={r(list(post.values))}")
    print(f"w_hist={r(list(w_hist), 3)} w_bl={r(list(w_bl), 3)} histL1={hist_l1:.3f} blL1={bl_l1:.3f}")


if __name__ == "__main__":
    main()
