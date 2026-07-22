# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "pandas", "matplotlib", "yfinance", "pyportfolioopt"]
# ///
"""
Mean-Variance Optimization & the Efficient Frontier — a six-asset portfolio.

A self-contained project script. It pulls ten years of prices for six
asset-class ETFs, draws the correlation matrix, generates a 20,000-portfolio
Monte-Carlo cloud, and solves for the exact minimum-variance and maximum-Sharpe
portfolios with PyPortfolioOpt. Two figures are saved next to this file:

  1. figure_1_correlation.png  the correlation matrix — the source of the free lunch
  2. figure_2_frontier.png     the Monte-Carlo bullet, exact frontier and the two optima

You normally don't run this by hand — double-click the launcher for your OS
(run-macos.command / run-linux.sh / run-windows.bat) and it will install
everything and run this for you. `python mvo_efficient_frontier.py` also works
if you already have the libraries. Internet is needed for the price history.
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


TICKERS = ["SPY", "TLT", "GLD", "VNQ", "VEA", "VWO"]
START, END = "2015-01-01", "2024-12-31"

print("[data] loading ETF price history ...")
px = load_prices(TICKERS, START, END)
rets = px.pct_change().dropna()

mu = rets.mean() * 252
Sigma = rets.cov() * 252
vol = np.sqrt(np.diag(Sigma))

print(f"  {len(px)} trading days, {px.index[0].date()} -> {px.index[-1].date()}\n")
print(pd.DataFrame({"ann. return": mu, "ann. vol": vol, "Sharpe": mu / vol}).round(3))

# --------------------------------------------------- correlation matrix ----
print("\n[1/2] Correlation matrix ...")
corr = rets.corr()
fig, ax = plt.subplots(figsize=(6.5, 5.5))
im = ax.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)
ax.set_xticks(range(len(TICKERS))); ax.set_xticklabels(TICKERS)
ax.set_yticks(range(len(TICKERS))); ax.set_yticklabels(TICKERS)
for i in range(len(TICKERS)):
    for j in range(len(TICKERS)):
        ax.text(j, i, f"{corr.iloc[i, j]:.2f}", ha="center", va="center",
                color="white" if abs(corr.iloc[i, j]) > 0.5 else "black", fontsize=9)
fig.colorbar(im, fraction=0.046, pad=0.04)
ax.set_title("Correlation of daily returns")
fig.tight_layout()
save(fig, "figure_1_correlation.png")

# ------------------------------------------------- Monte-Carlo + optima ----
print("[2/2] Monte-Carlo cloud + exact optima ...")
N, n, rf = 20_000, len(TICKERS), 0.02
w = np.random.dirichlet(np.ones(n), N)
port_ret = w @ mu.values
port_vol = np.sqrt(np.einsum("ij,jk,ik->i", w, Sigma.values, w))
port_sharpe = (port_ret - rf) / port_vol

from pypfopt import EfficientFrontier, expected_returns, risk_models

mu_pp = expected_returns.mean_historical_return(px)
S_pp = risk_models.sample_cov(px)

ef = EfficientFrontier(mu_pp, S_pp)
ef.max_sharpe(risk_free_rate=rf)
w_sharpe = ef.clean_weights()
perf_sharpe = ef.portfolio_performance(risk_free_rate=rf)

ef2 = EfficientFrontier(mu_pp, S_pp)
ef2.min_volatility()
w_minvar = ef2.clean_weights()
perf_minvar = ef2.portfolio_performance(risk_free_rate=rf)

print("\n" + str(pd.DataFrame({"Max Sharpe": w_sharpe, "Min Variance": w_minvar}).round(3)))
print(f"\nMax Sharpe : return {perf_sharpe[0]:.1%}, vol {perf_sharpe[1]:.1%}, Sharpe {perf_sharpe[2]:.2f}")
print(f"Min Variance: return {perf_minvar[0]:.1%}, vol {perf_minvar[1]:.1%}, Sharpe {perf_minvar[2]:.2f}")

# exact frontier curve: min vol for a sweep of target returns
front_vol, front_ret = [], []
for tr in np.linspace(mu_pp.min() + 1e-4, mu_pp.max() - 1e-4, 60):
    try:
        efi = EfficientFrontier(mu_pp, S_pp)
        efi.efficient_return(target_return=tr)
        p = efi.portfolio_performance()
        front_ret.append(p[0]); front_vol.append(p[1])
    except Exception:
        pass

fig, ax = plt.subplots(figsize=(10, 6))
sc = ax.scatter(port_vol, port_ret, c=port_sharpe, cmap="viridis", s=6, alpha=0.5)
ax.plot(front_vol, front_ret, "k-", lw=2, label="Efficient frontier")
ax.scatter(vol, mu.values, c="red", marker="D", s=60, zorder=5)
for i, t in enumerate(TICKERS):
    ax.annotate(t, (vol[i], mu.values[i]), textcoords="offset points", xytext=(7, 3))
ax.scatter(perf_sharpe[1], perf_sharpe[0], marker="*", color="red", s=280, label="Max Sharpe", zorder=6)
ax.scatter(perf_minvar[1], perf_minvar[0], marker="*", color="black", s=220, label="Min Variance", zorder=6)
fig.colorbar(sc, label="Sharpe ratio")
ax.set_xlabel("Annualised volatility"); ax.set_ylabel("Annualised return")
ax.set_title(f"{N:,} random portfolios, the exact frontier and the two special portfolios")
ax.legend()
fig.tight_layout()
save(fig, "figure_2_frontier.png")

print("\nDone.")
