# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "scipy", "matplotlib", "pandas", "yfinance"]
# ///
"""
Geometric Brownian Motion — simulating price paths, shown through SPY.

A self-contained project script. It pulls SPY prices, calibrates the GBM drift
and volatility, simulates 1,000 five-year paths, saves two figures (next to this
file), and runs a martingale sanity check:

  1. figure_1_paths.png     1,000 GBM price paths — the cone of plausible futures
  2. figure_2_terminal.png  terminal price distribution vs the theoretical log-normal

You normally don't run this by hand — double-click the launcher for your OS
(run-macos.command / run-linux.sh / run-windows.bat) and it will install
everything and run this for you. `python brownian_motion.py` also works if you
already have numpy, scipy, matplotlib, pandas and yfinance. An internet
connection is needed to download the SPY price history.
"""

import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # no display needed — we save PNGs
import matplotlib.pyplot as plt
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
np.random.seed(42)


def save(fig, name):
    path = os.path.join(HERE, name)
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  saved  {name}")


# ------------------------------------------------------------------- GBM ----
def gbm_returns(mu, sigma, dt, n_steps, n_paths):
    """One-step gross returns under GBM (shape: n_steps x n_paths)."""
    z = np.random.normal(size=(n_steps, n_paths))
    return np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * z)


def gbm_paths(s0, mu, sigma, dt, n_steps, n_paths):
    """Price paths of shape (n_steps + 1, n_paths), starting at s0."""
    rets = gbm_returns(mu, sigma, dt, n_steps, n_paths)
    return s0 * np.vstack([np.ones(rets.shape[1]), rets]).cumprod(axis=0)


# ------------------------------------------------------------------ data ----
def load_prices(ticker, start, end):
    """Adjusted-close prices: yfinance first, Stooq as fallback."""
    try:
        import yfinance as yf
        df = yf.download(ticker, start=start, end=end, auto_adjust=True, progress=False)
        if not df.empty:
            return df["Close"].squeeze().rename(ticker).dropna()
    except Exception as exc:
        print(f"  yfinance failed ({exc}); trying Stooq ...")
    url = f"https://stooq.com/q/d/l/?s={ticker.lower()}.us&i=d"
    df = pd.read_csv(url, parse_dates=["Date"], index_col="Date")
    return df.loc[start:end, "Close"].rename(ticker).dropna()


TICKER = "SPY"
START, END = "2018-01-01", "2024-12-31"

print("[data] loading SPY price history ...")
px = load_prices(TICKER, START, END)
log_ret = np.log(px / px.shift(1)).dropna()

s0 = float(px.iloc[-1])
sigma_hat = float(log_ret.std() * np.sqrt(252))
mu_hat = float(log_ret.mean() * 252 + 0.5 * sigma_hat**2)   # drift of the SDE, not of log returns

print(f"  {TICKER}: {len(px)} daily observations, last close = {s0:,.2f}")
print(f"  mu_hat    = {mu_hat:.2%}  (annualised drift)")
print(f"  sigma_hat = {sigma_hat:.2%}  (annualised volatility)")

# ------------------------------------------------------- simulate paths ----
DT, HORIZON, N_PATHS = 1 / 252, 252 * 5, 1_000
paths = gbm_paths(s0, mu_hat, sigma_hat, DT, HORIZON, N_PATHS)
t_ax = np.arange(paths.shape[0]) / 252
p5, p95 = np.percentile(paths, [5, 95], axis=1)

print("[1/2] Simulating 1,000 five-year paths ...")
fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(t_ax, paths, color="gray", lw=0.2, alpha=0.35)
ax.fill_between(t_ax, p5, p95, color="steelblue", alpha=0.25, label="5-95% band")
ax.plot(t_ax, paths.mean(axis=1), "k--", label="Mean path")
ax.set_title(f"{TICKER}: {N_PATHS:,} GBM paths, 5 years  (mu={mu_hat:.1%}, sigma={sigma_hat:.1%})")
ax.set_xlabel("Years")
ax.set_ylabel("Simulated price")
ax.legend()
fig.tight_layout()
save(fig, "figure_1_paths.png")

# --------------------------------------------- terminal distribution ----
print("[2/2] Terminal price distribution ...")
T = HORIZON / 252
s_T = paths[-1]
x = np.linspace(s_T.min(), s_T.max(), 400)
pdf = stats.lognorm.pdf(x, s=sigma_hat * np.sqrt(T), scale=s0 * np.exp((mu_hat - 0.5 * sigma_hat**2) * T))

fig, ax = plt.subplots(figsize=(10, 4))
ax.hist(s_T, bins=60, density=True, color="steelblue", alpha=0.55, label="Simulated S_T")
ax.plot(x, pdf, "k-", lw=1.5, label="Theoretical log-normal")
ax.axvline(s_T.mean(), color="black", ls="--", label=f"Mean   {s_T.mean():,.0f}")
ax.axvline(np.median(s_T), color="red", ls="--", label=f"Median {np.median(s_T):,.0f}")
ax.set_title(f"{TICKER}: terminal price distribution after {T:.0f} years")
ax.set_xlabel("Price")
ax.legend()
fig.tight_layout()
save(fig, "figure_2_terminal.png")

# ------------------------------------------------- martingale check ----
paths_nd = gbm_paths(s0, 0.0, sigma_hat, DT, HORIZON, N_PATHS)
print(f"\n[check] mean terminal price with no drift: {paths_nd[-1].mean():,.2f}   vs   S0 = {s0:,.2f}")
print(f"\nDone. Two figures were saved in:\n  {HERE}")
