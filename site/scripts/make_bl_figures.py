"""Generate the Black-Litterman figures in the site's editorial style (cream
plate, serif, monochrome) and print the tables used in the article.
Data + computations follow the T6_BlackLitterman notebook verbatim.
Run:  python scripts/make_bl_figures.py
"""
import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "public", "figures"))
os.makedirs(OUT, exist_ok=True)

# ---- editorial style ----
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
TICKERS = ["EWJ", "EWG", "EWU", "EWA", "EWC"]
COUNTRY = {"EWJ": "Japan", "EWG": "Germany", "EWU": "UK", "EWA": "Australia", "EWC": "Canada"}
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
print(f"{len(px)} trading days, {px.index[0].date()} -> {px.index[-1].date()}")

from pypfopt import risk_models, expected_returns, black_litterman
from pypfopt.black_litterman import BlackLittermanModel
from pypfopt import EfficientFrontier

S = risk_models.sample_cov(px)
mcaps = {"EWJ": 6.0, "EWG": 2.5, "EWU": 3.0, "EWA": 1.6, "EWC": 2.8}
w_mkt = pd.Series(mcaps) / sum(mcaps.values())
delta = 2.5
pi = black_litterman.market_implied_prior_returns(mcaps, delta, S)

print("\n=== PRIOR ===")
print(pd.DataFrame({"market weight": w_mkt, "implied return": pi}).round(3))

viewdict = {"EWG": 0.10}
bl = BlackLittermanModel(S, pi=pi, absolute_views=viewdict, omega="idzorek",
                         view_confidences=[0.50])
bl_returns = bl.bl_returns()

print("\n=== PRIOR vs POSTERIOR ===")
print(pd.DataFrame({"implied (prior)": pi, "posterior": bl_returns}).round(3))

ef_bl = EfficientFrontier(bl_returns, S)
ef_bl.max_sharpe(risk_free_rate=0.02)
w_bl = pd.Series(ef_bl.clean_weights())

mu_hist = expected_returns.mean_historical_return(px)
ef_naive = EfficientFrontier(mu_hist, S)
ef_naive.max_sharpe(risk_free_rate=0.02)
w_naive = pd.Series(ef_naive.clean_weights())

weights = pd.DataFrame({"Market prior": w_mkt, "Black-Litterman": w_bl, "Naive MVO": w_naive})
print("\n=== WEIGHTS ===")
print(weights.round(3))

# no-view sanity check
try:
    bl_noview = BlackLittermanModel(S, pi=pi, absolute_views={}, omega="idzorek",
                                    view_confidences=[])
    diff = (bl_noview.bl_returns() - pi).abs().max()
except Exception:
    # pypfopt needs >=1 view; a zero-confidence view is the same statement
    bl_noview = BlackLittermanModel(S, pi=pi, absolute_views={"EWG": 0.10},
                                    omega="idzorek", view_confidences=[0.0])
    diff = (bl_noview.bl_returns() - pi).abs().max()
print(f"\nMax |posterior - prior| with no views: {diff:.2e}")

# ---- Figure 4.3 — prior vs posterior returns (dumbbell) ----
labels = [f"{COUNTRY[t]}  ({t})" for t in TICKERS]
ypos = np.arange(len(TICKERS))[::-1]
fig, ax = plt.subplots(figsize=(13.5, 5.8))
fig.subplots_adjust(top=0.74, left=0.15, right=0.96, bottom=0.13)
for y, t in zip(ypos, TICKERS):
    ax.plot([pi[t], bl_returns[t]], [y, y], color=GRID, lw=2, zorder=1)
ax.scatter(pi.values, ypos, s=90, facecolor=BG, edgecolor=INK, linewidth=1.6,
           zorder=3, label="Implied prior")
ax.scatter(bl_returns.values, ypos, s=90, color=INK, zorder=4, label="Posterior (with view)")
ax.set_yticks(ypos); ax.set_yticklabels(labels)
ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{v:.1%}"))
ax.set_xlabel("Annualised expected return")
ax.legend(frameon=False, loc="lower right")
headline(fig, "One view moves the whole vector",
         "A single 10% view on Germany nudges every correlated market's posterior.",
         y1=0.94, y2=0.86)
fig.text(0.96, 0.012, "View: EWG = 10%  ·  50% confidence (Idzorek)",
         ha="right", va="bottom", fontsize=9, color=GREY, style="italic")
fig.savefig(os.path.join(OUT, "bl-returns.png"), dpi=150)
plt.close(fig)

# ---- Figure 4.4 — allocations: market vs BL vs naive MVO ----
x = np.arange(len(TICKERS))
bw = 0.27
fig, ax = plt.subplots(figsize=(13.5, 6.6))
fig.subplots_adjust(top=0.76, left=0.07, right=0.96, bottom=0.11)
ax.bar(x - bw, w_mkt.values, bw, color=GRID, edgecolor=GREY, linewidth=0.8,
       label="Market prior")
ax.bar(x, w_bl.values, bw, color=INK, label="Black-Litterman")
ax.bar(x + bw, w_naive.values, bw, facecolor=BG, edgecolor=INK, linewidth=1.4,
       hatch="///", label="Naive MVO")
ax.set_xticks(x); ax.set_xticklabels([COUNTRY[t] for t in TICKERS])
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{v:.0%}"))
ax.axhline(0, color=INK, lw=0.8)
ax.set_ylabel("Weight")
ax.legend(frameon=False, loc="upper right")
headline(fig, "Stable tilts, not lurches",
         "Naive MVO goes all-in on the backtest winner; Black-Litterman tilts from the market.")
fig.text(0.96, 0.012, "Max-Sharpe on posterior returns  ·  rf = 2%",
         ha="right", va="bottom", fontsize=9, color=GREY, style="italic")
fig.savefig(os.path.join(OUT, "bl-weights.png"), dpi=150)
plt.close(fig)
print("\nwrote bl-returns.png and bl-weights.png to", OUT)
