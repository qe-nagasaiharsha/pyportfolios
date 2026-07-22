"""Generate the Mean-Variance / Efficient Frontier figures in the site's editorial
style (cream plate, serif, monochrome) and print the tables used in the article.
Data + computations follow the T5_MVO_Efficient_Frontier notebook verbatim.
Run:  python scripts/make_mvo_figures.py
"""
import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "public", "figures"))
os.makedirs(OUT, exist_ok=True)

# ---- editorial style (matches the Brownian-motion / BS-Greeks figures) ----
BG, INK, GREY, GRID = "#f3f1ea", "#0d0d0d", "#7a7a7a", "#d7d3c6"
plt.rcParams.update({
    "figure.facecolor": BG, "axes.facecolor": BG, "savefig.facecolor": BG,
    "font.family": "serif", "font.serif": ["Georgia", "DejaVu Serif", "Times New Roman"],
    "text.color": INK, "axes.edgecolor": GREY, "axes.labelcolor": GREY,
    "xtick.color": GREY, "ytick.color": GREY, "xtick.labelsize": 10, "ytick.labelsize": 10,
    "axes.labelsize": 11, "axes.linewidth": 0.8,
    "axes.grid": True, "grid.color": GRID, "grid.linewidth": 0.6, "grid.linestyle": ":",
    "axes.spines.top": False, "axes.spines.right": False,
    "legend.fontsize": 10, "figure.dpi": 150,
})

def headline(fig, title, dek, x=0.065, y1=0.955, y2=0.905):
    fig.text(x, y1, title, fontsize=25, fontweight="bold", color=INK, ha="left", va="top")
    fig.text(x, y2, dek, fontsize=14, style="italic", color=GREY, ha="left", va="top")

# ---- data (verbatim from the notebook) ----
np.random.seed(42)
TICKERS = ["SPY", "TLT", "GLD", "VNQ", "VEA", "VWO"]
START, END = "2015-01-01", "2024-12-31"

def load_prices(tickers, start, end):
    try:
        import yfinance as yf
        df = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)["Close"]
        if not df.empty:
            return df[tickers].dropna()
    except Exception as exc:
        print(f"yfinance failed ({exc}); trying Stooq…")
    cols = {}
    for t in tickers:
        url = f"https://stooq.com/q/d/l/?s={t.lower()}.us&i=d"
        cols[t] = pd.read_csv(url, parse_dates=["Date"], index_col="Date")["Close"].rename(t)
    return pd.concat(cols, axis=1).loc[start:end].dropna()

px = load_prices(TICKERS, START, END)
rets = px.pct_change().dropna()
mu = rets.mean() * 252
Sigma = rets.cov() * 252
vol = np.sqrt(np.diag(Sigma))

print("=== SUMMARY TABLE ===")
print(pd.DataFrame({"ann. return": mu, "ann. vol": vol, "Sharpe": mu / vol}).round(3))
print(f"{len(px)} trading days, {px.index[0].date()} -> {px.index[-1].date()}")

corr = rets.corr()
print("\n=== CORRELATION ===")
print(corr.round(2))

# ---- Figure 4.2 — correlation heatmap ----
fig, ax = plt.subplots(figsize=(9.2, 7.4))
fig.subplots_adjust(top=0.80, left=0.09, right=0.86, bottom=0.07)
im = ax.imshow(corr, cmap="RdBu_r", vmin=-1, vmax=1)
ax.set_xticks(range(len(TICKERS))); ax.set_xticklabels(TICKERS)
ax.set_yticks(range(len(TICKERS))); ax.set_yticklabels(TICKERS)
ax.grid(False)
for i in range(len(TICKERS)):
    for j in range(len(TICKERS)):
        v = corr.iloc[i, j]
        ax.text(j, i, f"{v:.2f}", ha="center", va="center", fontsize=10,
                color="white" if abs(v) > 0.55 else INK)
cb = fig.colorbar(im, fraction=0.046, pad=0.04)
cb.outline.set_visible(False)
headline(fig, "The source of the free lunch",
         "Daily-return correlations — Treasuries and gold barely track equities.")
fig.text(0.96, 0.012, f"Daily returns  ·  {px.index[0].year}–{px.index[-1].year}",
         ha="right", va="bottom", fontsize=9, color=GREY, style="italic")
fig.savefig(os.path.join(OUT, "mvo-corr.png"), dpi=150)
plt.close(fig)

# ---- Monte-Carlo cloud (verbatim) ----
N = 20_000
n = len(TICKERS)
rf = 0.02
w = np.random.dirichlet(np.ones(n), N)
port_ret = w @ mu.values
port_vol = np.sqrt(np.einsum("ij,jk,ik->i", w, Sigma.values, w))
port_sharpe = (port_ret - rf) / port_vol

# ---- exact optima with PyPortfolioOpt (verbatim) ----
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

print("\n=== OPTIMAL WEIGHTS ===")
print(pd.DataFrame({"Max Sharpe": w_sharpe, "Min Variance": w_minvar}).round(3))
print(f"Max Sharpe : return {perf_sharpe[0]:.1%}, vol {perf_sharpe[1]:.1%}, Sharpe {perf_sharpe[2]:.2f}")
print(f"Min Variance: return {perf_minvar[0]:.1%}, vol {perf_minvar[1]:.1%}, Sharpe {perf_minvar[2]:.2f}")

# exact frontier curve: min vol for a sweep of target returns
targets = np.linspace(mu_pp.min() + 1e-4, mu_pp.max() - 1e-4, 60)
front_vol, front_ret = [], []
for tr in targets:
    try:
        efi = EfficientFrontier(mu_pp, S_pp)
        efi.efficient_return(target_return=tr)
        p = efi.portfolio_performance()
        front_ret.append(p[0]); front_vol.append(p[1])
    except Exception:
        pass

# ---- Figure 4.3/4.4 — the bullet + frontier + two special portfolios ----
fig, ax = plt.subplots(figsize=(13.5, 7.6))
fig.subplots_adjust(top=0.80, left=0.07, right=0.94, bottom=0.10)
sc = ax.scatter(port_vol, port_ret, c=port_sharpe, cmap="Greys", s=7, alpha=0.55,
                rasterized=True)
ax.plot(front_vol, front_ret, color=INK, lw=2, label="Efficient frontier")
ax.scatter(vol, mu.values, color=INK, marker="D", s=42, zorder=5)
for i, t in enumerate(TICKERS):
    ax.annotate(t, (vol[i], mu.values[i]), textcoords="offset points",
                xytext=(8, 4), fontsize=10, color=INK,
                bbox=dict(facecolor=BG, edgecolor="none", alpha=0.75, pad=1))
ax.scatter(perf_sharpe[1], perf_sharpe[0], marker="*", color=INK, s=380,
           zorder=6, label="Max Sharpe")
ax.scatter(perf_minvar[1], perf_minvar[0], marker="o", facecolor=BG, edgecolor=INK,
           linewidth=2, s=150, zorder=6, label="Min variance")
cb = fig.colorbar(sc, label="Sharpe ratio", fraction=0.035, pad=0.015)
cb.outline.set_visible(False)
ax.set_xlabel("Annualised volatility")
ax.set_ylabel("Annualised return")
ax.legend(frameon=False, loc="lower right")
headline(fig, "The efficient frontier",
         f"{N:,} random portfolios fill the bullet; only the upper-left edge matters.")
fig.text(0.98, 0.012, f"6 ETFs  ·  {px.index[0].year}–{px.index[-1].year}  ·  rf = {rf:.0%}",
         ha="right", va="bottom", fontsize=9, color=GREY, style="italic")
fig.savefig(os.path.join(OUT, "mvo-frontier.png"), dpi=150)
plt.close(fig)
print("\nwrote mvo-corr.png and mvo-frontier.png to", OUT)
