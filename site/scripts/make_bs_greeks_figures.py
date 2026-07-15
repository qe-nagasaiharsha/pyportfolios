"""Generate the two Black-Scholes Greeks figures in the site's editorial style
(cream plate, serif, monochrome) — matching the Brownian-motion figures.
Calibrated to the T2 notebook's executed QQQ run.  Run:  python scripts/make_bs_greeks_figures.py
"""
import os
import numpy as np
from scipy.stats import norm
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "public", "figures"))
os.makedirs(OUT, exist_ok=True)

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

def headline(fig, title, dek, x=0.065, y1=0.955, y2=0.905):
    fig.text(x, y1, title, fontsize=25, fontweight="bold", color=INK, ha="left", va="top")
    fig.text(x, y2, dek, fontsize=14, style="italic", color=GREY, ha="left", va="top")

# ---- Black-Scholes ----
def bs_price(S, K, T, r, sigma, kind="call"):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if kind == "call":
        return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

def bs_greeks(S, K, T, r, sigma, kind="call"):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    s = 1 if kind == "call" else -1
    return {
        "delta": s * norm.cdf(s * d1),
        "gamma": norm.pdf(d1) / (S * sigma * np.sqrt(T)),
        "vega": S * norm.pdf(d1) * np.sqrt(T),
        "theta": (-S * norm.pdf(d1) * sigma / (2 * np.sqrt(T)) - s * r * K * np.exp(-r * T) * norm.cdf(s * d2)),
    }

# calibrated to the notebook's executed QQQ run
S0, SIGMA, R, T3M = 511.80, 0.1802, 0.045, 0.25
K_ATM = round(S0)

# ---- Figure 4.2 — Greeks across strikes (2x2) ----
strikes = np.linspace(0.80 * S0, 1.20 * S0, 200)
G = {k: [] for k in ["delta", "gamma", "vega", "theta"]}
for K in strikes:
    gk = bs_greeks(S0, K, T3M, R, SIGMA, "call")
    for k in G:
        G[k].append(gk[k])

fig, axes = plt.subplots(2, 2, figsize=(13.5, 8.4))
fig.subplots_adjust(top=0.79, hspace=0.36, wspace=0.19, left=0.07, right=0.965, bottom=0.085)
labels = {"delta": "Delta  —  hedge ratio", "gamma": "Gamma  —  convexity",
          "vega": "Vega  —  vol sensitivity", "theta": "Theta  —  time decay (per year)"}
for ax, k in zip(axes.flat, ["delta", "gamma", "vega", "theta"]):
    ax.plot(strikes / S0, G[k], color=INK, lw=2)
    ax.axvline(1.0, color=GREY, ls=":", lw=1)
    ax.set_title(labels[k], loc="left", color=GREY, fontsize=12, pad=8)
    ax.set_xlabel("Moneyness   K / S")
headline(fig, "The Greeks across strikes",
         "Gamma and Vega peak at the money; Delta rolls from 0 to 1 like a smoothed step.")
fig.text(0.965, 0.012, f"QQQ 3M call  ·  S={S0:,.0f}  ·  σ={SIGMA:.0%}  ·  r={R:.1%}",
         ha="right", va="bottom", fontsize=9, color=GREY, style="italic")
fig.savefig(os.path.join(OUT, "bs-greeks.png"), dpi=150)
plt.close(fig)

# ---- Figure 4.3 — time decay ----
mats = np.linspace(1e-3, 1.0, 200)
atm = [bs_price(S0, K_ATM, t, R, SIGMA, "call") for t in mats]
otm = [bs_price(S0, 1.05 * S0, t, R, SIGMA, "call") for t in mats]
fig, ax = plt.subplots(figsize=(13.5, 5.6))
fig.subplots_adjust(top=0.70, left=0.07, right=0.965, bottom=0.14)
ax.plot(mats * 12, atm, color=INK, lw=2, label=f"ATM  (K={K_ATM})")
ax.plot(mats * 12, otm, color=GREY, lw=2, ls="--", label="5% OTM")
ax.set_xlabel("Months to expiry")
ax.set_ylabel("Call value")
ax.invert_xaxis()
ax.legend(frameon=False, loc="lower left")
headline(fig, "Time decay — the option's ticking clock",
         "Theta is gentle far from expiry and accelerates sharply in the final weeks.",
         y1=0.94, y2=0.855)
fig.savefig(os.path.join(OUT, "bs-theta.png"), dpi=150)
plt.close(fig)
print("wrote bs-greeks.png and bs-theta.png to", OUT)
