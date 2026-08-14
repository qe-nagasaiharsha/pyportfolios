/* Geometric Brownian Motion — code, VERBATIM from the T1_GBM_SPY_v3-stylized
   notebook (Louis's updated version, Aug 2026).

   That notebook ships WITH its outputs, and its charts are deliberately styled
   to the site surface — the setup cell sets BG to Pale Sisal #F4F2E8 and the
   accent to #1FFFFF, the same palette the article's <Figure> uses. So unlike the
   other pieces carried over verbatim, this one publishes its results: the two
   rendered charts are extracted straight out of the notebook into
   site/public/figures/. */

export const SETUP_CODE = String.raw`# Setup

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

np.random.seed(42)  # reproducibility (standard arbitrary number)
plt.rcParams["figure.dpi"] = 110

# ---- house style ---------------------------------------------------------
BG    = "#F4F2E8"   # Pale Sisal
INK   = "#151515"   # Anthracite
AQUA  = "#1FFFFF"   # accent
GREY  = "#7A7A7A"

HEAD  = {"fontname": "Switzer", "fontsize": 11, "fontweight": "bold", "color": INK}

plt.rcParams.update({
    "font.family": "monospace",
    "font.monospace": ["Courier Prime", "Courier New", "DejaVu Sans Mono"],
    "font.size": 8,
    "axes.titlesize": 11, "axes.labelsize": 8,
    "xtick.labelsize": 7.5, "ytick.labelsize": 7.5, "legend.fontsize": 7.5,
    "figure.facecolor": BG, "axes.facecolor": BG, "savefig.facecolor": BG,
    "axes.edgecolor": GREY, "axes.labelcolor": GREY,
    "xtick.color": GREY, "ytick.color": GREY,
    "axes.spines.top": False, "axes.spines.right": False,
    "axes.grid": True, "grid.alpha": 0.3, "grid.color": "#CCCCCC", "grid.linewidth": 0.5,
    "legend.frameon": False,
    "lines.linewidth": 2.0, "lines.markersize": 0,
})`;

export const IMPL_CODE = String.raw`# Implementation

def gbm_returns(mu, sigma, dt, n_steps, n_paths):
    """One-step gross returns under GBM (shape: n_steps x n_paths)."""
    z = np.random.normal(size=(n_steps, n_paths))
    return np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * z)

def gbm_paths(s0, mu, sigma, dt, n_steps, n_paths):
    """Price paths of shape (n_steps + 1, n_paths), starting at s0."""
    rets = gbm_returns(mu, sigma, dt, n_steps, n_paths)
    return s0 * np.vstack([np.ones(rets.shape[1]), rets]).cumprod(axis=0)`;

export const CALIBRATE_CODE = String.raw`TICKER = "SPY"
START, END = "2018-01-01", "2024-12-31"

import yfinance as yf

px = (yf.download(TICKER, start=START, end=END, auto_adjust=True, progress=False)["Close"]
        .squeeze().rename(TICKER).dropna())

log_ret = np.log(px / px.shift(1)).dropna()

s0        = float(px.iloc[-1])
sigma_hat = float(log_ret.std() * np.sqrt(252))
mu_hat    = float(log_ret.mean() * 252 + 0.5 * sigma_hat**2)  # drift of the SDE, not of log returns

print(f"{TICKER}: {len(px)} daily observations, last close = {s0:,.2f}")
print(f"mu_hat    = {mu_hat:.2%}  (annualised drift)")
print(f"sigma_hat = {sigma_hat:.2%}  (annualised volatility)")`;

export const PATHS_CODE = String.raw`DT      = 1 / 252
HORIZON = 252 * 5          # 5 years
N_PATHS = 1_000

paths = gbm_paths(s0, mu_hat, sigma_hat, DT, HORIZON, N_PATHS)
t_ax  = np.arange(paths.shape[0]) / 252

p5, p95 = np.percentile(paths, [5, 95], axis=1)

fig, ax = plt.subplots(figsize=(10, 5))
ax.fill_between(t_ax, p5, p95, color=AQUA, alpha=0.35, lw=0, zorder=1,
                label="5\u201395% band")
ax.plot(t_ax, paths[:, :200], color="#BBBBBB", lw=0.35, alpha=0.45, zorder=2)
ax.plot(t_ax, paths.mean(axis=1), color=INK, lw=2.2, ls="--", zorder=3,
        label="Mean path")
ax.set_title(f"{TICKER}: {N_PATHS:,} GBM paths, 5 years  "
             f"(mu={mu_hat:.1%}, sigma={sigma_hat:.1%})", **HEAD)
ax.set_xlabel("Years"); ax.set_ylabel("Simulated price"); ax.legend()
plt.tight_layout(); plt.show()`;

export const TERMINAL_CODE = String.raw`from scipy import stats

T   = HORIZON / 252
s_T = paths[-1]

x   = np.linspace(s_T.min(), s_T.max(), 400)
pdf = stats.lognorm.pdf(x, s=sigma_hat*np.sqrt(T),
                        scale=s0*np.exp((mu_hat - 0.5*sigma_hat**2)*T))

fig, ax = plt.subplots(figsize=(10, 4))
ax.hist(s_T, bins=60, density=True, color=AQUA, alpha=0.55,
        edgecolor=INK, linewidth=0.25, label="Simulated $S_T$")
ax.plot(x, pdf, color=INK, lw=2.2, label="Theoretical log-normal")
ax.axvline(s_T.mean(),     color=INK, lw=1.8, ls="--", label=f"Mean   {s_T.mean():,.0f}")
ax.axvline(np.median(s_T), color=INK, lw=1.8,          label=f"Median {np.median(s_T):,.0f}")
ax.set_title(f"{TICKER}: terminal price distribution after {T:.0f} years", **HEAD)
ax.set_xlabel("Price"); ax.legend()
plt.tight_layout(); plt.show()`;

export const MARTINGALE_CODE = String.raw`paths_nd = gbm_paths(s0, 0.0, sigma_hat, DT, HORIZON, N_PATHS)
print(f"Mean terminal price (no drift): {paths_nd[-1].mean():,.2f}   vs   S0 = {s0:,.2f}")`;

/* stdout exactly as stored in the notebook's outputs — not reformatted. */

export const CALIBRATE_OUT = `SPY: 1760 daily observations, last close = 578.32
mu_hat    = 14.75%  (annualised drift)
sigma_hat = 19.54%  (annualised volatility)`;

export const MARTINGALE_OUT = `Mean terminal price (no drift): 588.06   vs   S0 = 578.32`;
