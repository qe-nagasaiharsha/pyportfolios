"""Generate the Risk-Parity figures in the site's editorial style (cream plate,
serif, monochrome) and print the tables used in the article.
Data + computations follow the T7_RiskParity_Futures notebook verbatim.
Run:  python scripts/make_rp_figures.py
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
TICKERS = ["ES=F", "ZN=F", "GC=F", "HG=F", "CL=F"]
NAMES = {"ES=F": "S&P 500", "ZN=F": "10y Note", "GC=F": "Gold", "HG=F": "Copper", "CL=F": "WTI"}
START, END = "2015-01-01", "2024-12-31"

def load_prices(tickers, start, end):
    import yfinance as yf
    df = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)["Close"]
    return df[tickers].dropna()

px = load_prices(TICKERS, START, END)
rets = px.pct_change().dropna()
Sigma = rets.cov() * 252
vol = pd.Series(np.sqrt(np.diag(Sigma)), index=TICKERS)
print(f"{len(px)} trading days, {px.index[0].date()} -> {px.index[-1].date()}")
print("\n=== ANNUALISED VOL ===")
print(vol.rename(index=NAMES).round(3))

def risk_contributions(w, Sigma):
    w = np.asarray(w)
    sigma_p = np.sqrt(w @ Sigma @ w)
    mrc = (Sigma @ w) / sigma_p
    return w * mrc, sigma_p

n = len(TICKERS)
w_eq = np.repeat(1 / n, n)
rc_eq, sig_eq = risk_contributions(w_eq, Sigma.values)
print("\n=== EQUAL WEIGHT ===")
print(pd.DataFrame({"weight": w_eq, "risk contrib": rc_eq, "risk share": rc_eq / sig_eq},
                   index=[NAMES[t] for t in TICKERS]).round(3))
print(f"Portfolio vol: {sig_eq:.1%}, risk shares {min(rc_eq/sig_eq):.0%} to {max(rc_eq/sig_eq):.0%}")

from scipy.optimize import minimize

def rp_objective(w, Sigma):
    rc, sigma_p = risk_contributions(w, Sigma)
    target = sigma_p / len(w)
    return np.sum((rc - target) ** 2)

cons = ({"type": "eq", "fun": lambda w: w.sum() - 1},)
bnds = tuple((0.0, 1.0) for _ in range(n))
res = minimize(rp_objective, w_eq, args=(Sigma.values,), method="SLSQP",
               bounds=bnds, constraints=cons, tol=1e-12)
w_rp = res.x
rc_rp, sig_rp = risk_contributions(w_rp, Sigma.values)
print("\n=== RISK PARITY (SciPy) ===")
print(pd.DataFrame({"RP weight": w_rp, "risk share": rc_rp / sig_rp},
                   index=[NAMES[t] for t in TICKERS]).round(3))
print(f"Portfolio vol: {sig_rp:.1%}, risk shares {min(rc_rp/sig_rp):.1%} to {max(rc_rp/sig_rp):.1%}")

# ---- validate with Riskfolio-lib ----
import riskfolio as rp_lib

port = rp_lib.Portfolio(returns=rets)
port.assets_stats(method_mu="hist", method_cov="hist")
w_lib = port.rp_optimization(model="Classic", rm="MV", rf=0, b=None)
compare = pd.DataFrame({"from scratch (SciPy)": w_rp,
                        "Riskfolio-lib": w_lib["weights"].values},
                       index=[NAMES[t] for t in TICKERS])
compare["abs diff"] = (compare.iloc[:, 0] - compare.iloc[:, 1]).abs()
print("\n=== VALIDATION ===")
print(compare.round(4))
print(f"Max weight difference: {compare['abs diff'].max():.2e}")

# ---- leverage to a 10% vol target ----
target_vol = 0.10
leverage = target_vol / sig_rp
w_lev = w_rp * leverage
print("\n=== LEVERAGE ===")
print(f"Unlevered RP vol: {sig_rp:.1%}  leverage: {leverage:.2f}x  gross: {w_lev.sum():.2f}")
print(pd.Series(w_lev, index=[NAMES[t] for t in TICKERS], name="levered weight").round(3))

# ---- Figure 4.3 — equal weight vs risk parity, capital vs risk share ----
labels = [NAMES[t] for t in TICKERS]
x = np.arange(n)
fig, axes = plt.subplots(1, 2, figsize=(13.5, 6.4), sharey=True)
fig.subplots_adjust(top=0.74, left=0.06, right=0.97, bottom=0.10, wspace=0.08)
panels = [
    (axes[0], w_eq, rc_eq / sig_eq, "Equal weight — risk is concentrated"),
    (axes[1], w_rp, rc_rp / sig_rp, "Risk parity — risk is equalised"),
]
for ax, wgt, share, title in panels:
    ax.bar(x, wgt, 0.72, color=GRID, edgecolor=GREY, linewidth=0.8, label="Capital weight")
    ax.bar(x, share, 0.34, color=INK, label="Risk share")
    ax.axhline(1 / n, color=GREY, ls=":", lw=1.2)
    ax.set_xticks(x); ax.set_xticklabels(labels, fontsize=10)
    ax.set_title(title, loc="left", color=GREY, fontsize=12, pad=8)
axes[0].yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{v:.0%}"))
axes[0].legend(frameon=False, loc="upper left")
headline(fig, "Allocate risk, not capital",
         "Equal capital lets crude and equities dominate; risk parity levels every contribution.")
fig.text(0.97, 0.012,
         f"5 futures  ·  {px.index[0].year}–{px.index[-1].year}  ·  dotted line = 1/{n}",
         ha="right", va="bottom", fontsize=9, color=GREY, style="italic")
fig.savefig(os.path.join(OUT, "rp-risk-shares.png"), dpi=150)
plt.close(fig)
print("\nwrote rp-risk-shares.png to", OUT)
