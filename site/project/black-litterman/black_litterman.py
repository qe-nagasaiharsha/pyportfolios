# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "pandas", "matplotlib", "yfinance", "pyportfolioopt"]
# ///
"""
The Black-Litterman Model — blending market equilibrium with your own views.

A self-contained project script. It pulls ten years of prices for five country
ETFs, reverse-optimizes the market's implied equilibrium returns, blends in one
view (Germany returns 10%, 50% confidence, Idzorek), optimizes on the posterior,
and compares against the market prior and naive MVO. Two figures are saved next
to this file:

  1. figure_1_returns.png  implied prior vs Black-Litterman posterior returns
  2. figure_2_weights.png  allocations — market prior vs Black-Litterman vs naive MVO

You normally don't run this by hand — double-click the launcher for your OS
(run-macos.command / run-linux.sh / run-windows.bat) and it will install
everything and run this for you. `python black_litterman.py` also works if you
already have the libraries. Internet is needed for the price history.
"""

import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # no display needed — we save PNGs
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
np.random.seed(42)


def save(fig, name):
    path = os.path.join(HERE, name)
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  saved  {name}")


# ------------------------------------------------------------------ data ----
def load_prices(tickers, start, end):
    """Adjusted-close prices: yfinance first, Stooq as fallback."""
    try:
        import yfinance as yf
        df = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)["Close"]
        if not df.empty:
            return df[tickers].dropna()
    except Exception as exc:
        print(f"  yfinance failed ({exc}); trying Stooq ...")
    cols = {}
    for t in tickers:
        url = f"https://stooq.com/q/d/l/?s={t.lower()}.us&i=d"
        cols[t] = pd.read_csv(url, parse_dates=["Date"], index_col="Date")["Close"].rename(t)
    return pd.concat(cols, axis=1).loc[start:end].dropna()


TICKERS = ["EWJ", "EWG", "EWU", "EWA", "EWC"]
COUNTRY = {"EWJ": "Japan", "EWG": "Germany", "EWU": "UK", "EWA": "Australia", "EWC": "Canada"}
START, END = "2015-01-01", "2024-12-31"

print("[data] loading country-ETF price history ...")
px = load_prices(TICKERS, START, END)
rets = px.pct_change().dropna()
print(f"  {len(px)} trading days, {px.index[0].date()} -> {px.index[-1].date()}")

# --------------------------------------------- prior: implied returns ----
from pypfopt import risk_models, expected_returns, black_litterman
from pypfopt.black_litterman import BlackLittermanModel
from pypfopt import EfficientFrontier

S = risk_models.sample_cov(px)

# approximate relative market caps (illustrative stand-in for true investable caps)
mcaps = {"EWJ": 6.0, "EWG": 2.5, "EWU": 3.0, "EWA": 1.6, "EWC": 2.8}   # in trillions USD, rough
w_mkt = pd.Series(mcaps) / sum(mcaps.values())

delta = 2.5   # market risk-aversion (typical value)
pi = black_litterman.market_implied_prior_returns(mcaps, delta, S)

print("\n[1/3] Implied equilibrium returns (the prior):")
print(pd.DataFrame({"market weight": w_mkt, "implied return": pi}).round(3))

# --------------------------------------------------- the view + blend ----
viewdict = {"EWG": 0.10}   # absolute view: Germany returns 10%
bl = BlackLittermanModel(S, pi=pi, absolute_views=viewdict, omega="idzorek",
                         view_confidences=[0.50])
bl_returns = bl.bl_returns()

print("\n[2/3] Prior vs posterior (one view: EWG = 10%, 50% confidence):")
print(pd.DataFrame({"implied (prior)": pi, "posterior": bl_returns}).round(3))

labels = [f"{COUNTRY[t]}\n({t})" for t in TICKERS]
x = np.arange(len(TICKERS))
fig, ax = plt.subplots(figsize=(10, 5))
ax.bar(x - 0.2, pi.values, 0.4, color="gray", label="Implied prior")
ax.bar(x + 0.2, bl_returns.values, 0.4, color="steelblue", label="Posterior (with view)")
ax.set_xticks(x); ax.set_xticklabels(labels)
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{v:.1%}"))
ax.set_ylabel("Annualised expected return")
ax.set_title("One view on Germany moves every posterior — via correlation")
ax.legend()
fig.tight_layout()
save(fig, "figure_1_returns.png")

# --------------------------------------------- optimize on the blend ----
ef_bl = EfficientFrontier(bl_returns, S)
ef_bl.max_sharpe(risk_free_rate=0.02)
w_bl = pd.Series(ef_bl.clean_weights())

mu_hist = expected_returns.mean_historical_return(px)
ef_naive = EfficientFrontier(mu_hist, S)
ef_naive.max_sharpe(risk_free_rate=0.02)
w_naive = pd.Series(ef_naive.clean_weights())

weights = pd.DataFrame({"Market prior": w_mkt, "Black-Litterman": w_bl, "Naive MVO": w_naive})
weights.index = [COUNTRY[t] for t in weights.index]
print("\n[3/3] Allocations:")
print(weights.round(3))

ax = weights.plot(kind="bar", figsize=(10, 5), width=0.8,
                  color=["gray", "steelblue", "darkorange"])
ax.set_ylabel("Weight")
ax.set_title("Allocations: market prior vs Black-Litterman vs naive MVO")
ax.axhline(0, color="black", lw=0.6)
fig = ax.get_figure()
fig.tight_layout()
save(fig, "figure_2_weights.png")

# ------------------------------------------------- no-view sanity check ----
try:
    bl_noview = BlackLittermanModel(S, pi=pi, absolute_views={}, omega="idzorek",
                                    view_confidences=[])
    diff = (bl_noview.bl_returns() - pi).abs().max()
except Exception:
    bl_noview = BlackLittermanModel(S, pi=pi, absolute_views={"EWG": 0.10},
                                    omega="idzorek", view_confidences=[0.0])
    diff = (bl_noview.bl_returns() - pi).abs().max()
print(f"\nSanity check — max |posterior - prior| with no views: {diff:.2e}  (should be ~0)")

print("\nDone.")
