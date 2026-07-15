"""Generate the two GBM/SPY figures in the site's editorial style (cream plate,
serif, monochrome) — matching the other article figures. Pulls live SPY data and
uses the notebook's seed, so the figures reproduce the notebook's simulation.
Run:  python scripts/make_gbm_spy_figures.py
"""
import os
import numpy as np
import pandas as pd
from scipy import stats
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "public", "figures"))
os.makedirs(OUT, exist_ok=True)
np.random.seed(42)

# ---- editorial style (matches the RiskParity / Brownian-motion figures) ----
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

def headline(fig, title, dek, x=0.065, y1=0.94, y2=0.86):
    fig.text(x, y1, title, fontsize=24, fontweight="bold", color=INK, ha="left", va="top")
    fig.text(x, y2, dek, fontsize=13.5, style="italic", color=GREY, ha="left", va="top")

# ---- GBM (verbatim from the notebook) ----
def gbm_returns(mu, sigma, dt, n_steps, n_paths):
    z = np.random.normal(size=(n_steps, n_paths))
    return np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * z)

def gbm_paths(s0, mu, sigma, dt, n_steps, n_paths):
    rets = gbm_returns(mu, sigma, dt, n_steps, n_paths)
    return s0 * np.vstack([np.ones(rets.shape[1]), rets]).cumprod(axis=0)

def load_prices(ticker, start, end):
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
px = load_prices(TICKER, "2018-01-01", "2024-12-31")
log_ret = np.log(px / px.shift(1)).dropna()
s0 = float(px.iloc[-1])
sigma_hat = float(log_ret.std() * np.sqrt(252))
mu_hat = float(log_ret.mean() * 252 + 0.5 * sigma_hat**2)
print(f"  {TICKER}: last close {s0:,.2f}, mu {mu_hat:.2%}, sigma {sigma_hat:.2%}")

DT, HORIZON, N_PATHS = 1 / 252, 252 * 5, 1_000
paths = gbm_paths(s0, mu_hat, sigma_hat, DT, HORIZON, N_PATHS)
t_ax = np.arange(paths.shape[0]) / 252
p5, p95 = np.percentile(paths, [5, 95], axis=1)

# ---- Figure 4.2 — the cone of plausible futures ----
fig, ax = plt.subplots(figsize=(13.5, 6.0))
fig.subplots_adjust(top=0.74, left=0.075, right=0.965, bottom=0.11)
ax.plot(t_ax, paths, color=GREY, lw=0.2, alpha=0.22)
ax.fill_between(t_ax, p5, p95, color=INK, alpha=0.10, label="5–95% band")
ax.plot(t_ax, paths.mean(axis=1), color=INK, lw=2, ls="--", label="Mean path")
ax.set_xlabel("Years"); ax.set_ylabel("Simulated price"); ax.set_xlim(0, HORIZON / 252)
ax.legend(frameon=False, loc="upper left")
headline(fig, f"{TICKER}: 1,000 GBM paths over five years",
         "Each grey line is one simulated future; the band spans the 5th–95th percentile.")
fig.text(0.965, 0.015, f"calibrated to SPY  ·  μ={mu_hat:.1%}  ·  σ={sigma_hat:.1%}",
         ha="right", va="bottom", fontsize=9, color=GREY, style="italic")
fig.savefig(os.path.join(OUT, "gbm-cone.png"), dpi=150)
plt.close(fig)

# ---- Figure 4.3 — terminal distribution is log-normal ----
T = HORIZON / 252
s_T = paths[-1]
x = np.linspace(s_T.min(), s_T.max(), 400)
pdf = stats.lognorm.pdf(x, s=sigma_hat * np.sqrt(T), scale=s0 * np.exp((mu_hat - 0.5 * sigma_hat**2) * T))

fig, ax = plt.subplots(figsize=(13.5, 5.4))
fig.subplots_adjust(top=0.71, left=0.075, right=0.965, bottom=0.13)
ax.hist(s_T, bins=60, density=True, color=GREY, alpha=0.35, label="Simulated $S_T$")
ax.plot(x, pdf, color=INK, lw=2, label="Theoretical log-normal")
ax.axvline(s_T.mean(), color=INK, ls="--", lw=1.4, label=f"Mean   {s_T.mean():,.0f}")
ax.axvline(np.median(s_T), color=GREY, ls="--", lw=1.4, label=f"Median {np.median(s_T):,.0f}")
ax.set_xlabel("Price"); ax.set_ylabel("Density"); ax.legend(frameon=False, loc="upper right")
headline(fig, "Terminal price after five years is log-normal",
         "The histogram matches the theoretical density — and the mean sits above the median.",
         y1=0.93, y2=0.85)
fig.savefig(os.path.join(OUT, "gbm-terminal.png"), dpi=150)
plt.close(fig)
print("wrote gbm-cone.png and gbm-terminal.png to", OUT)
