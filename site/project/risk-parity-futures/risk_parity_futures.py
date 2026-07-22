# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "pandas", "scipy", "matplotlib", "yfinance", "riskfolio-lib"]
# ///
"""
Risk Parity from Scratch — allocating by risk, not capital, in five futures.

A self-contained project script. It pulls ten years of continuous-futures
prices (ES, ZN, GC, HG, CL), shows how equal capital weights concentrate risk
in crude, solves the risk-parity weights from scratch with SciPy, validates
them against Riskfolio-lib, and levers the book to a 10% vol target. One
figure is saved next to this file:

  1. figure_1_risk_shares.png  capital vs risk shares — equal weight vs risk parity

You normally don't run this by hand — double-click the launcher for your OS
(run-macos.command / run-linux.sh / run-windows.bat) and it will install
everything and run this for you. `python risk_parity_futures.py` also works if
you already have the libraries. Internet is needed for the price history.
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
TICKERS = ["ES=F", "ZN=F", "GC=F", "HG=F", "CL=F"]
NAMES = {"ES=F": "S&P 500", "ZN=F": "10y Note", "GC=F": "Gold", "HG=F": "Copper", "CL=F": "WTI"}
START, END = "2015-01-01", "2024-12-31"

print("[data] loading continuous-futures price history ...")
import yfinance as yf
px = yf.download(TICKERS, start=START, end=END, auto_adjust=True, progress=False)["Close"][TICKERS].dropna()
rets = px.pct_change().dropna()

Sigma = rets.cov() * 252
vol = pd.Series(np.sqrt(np.diag(Sigma)), index=TICKERS)
print(f"  {len(px)} trading days, {px.index[0].date()} -> {px.index[-1].date()}\n")
print("Annualised volatility:")
print(vol.rename(index=NAMES).round(3))


# ------------------------------------------------- risk contributions ----
def risk_contributions(w, Sigma):
    """Risk contribution of each asset (sums to portfolio vol)."""
    w = np.asarray(w)
    sigma_p = np.sqrt(w @ Sigma @ w)
    mrc = (Sigma @ w) / sigma_p
    return w * mrc, sigma_p


n = len(TICKERS)
w_eq = np.repeat(1 / n, n)
rc_eq, sig_eq = risk_contributions(w_eq, Sigma.values)

print("\n[1/3] Equal weight — the problem:")
print(pd.DataFrame({"weight": w_eq, "risk contrib": rc_eq, "risk share": rc_eq / sig_eq},
                   index=[NAMES[t] for t in TICKERS]).round(3))
print(f"Portfolio vol: {sig_eq:.1%} — risk shares range "
      f"{(rc_eq/sig_eq).min():.0%} to {(rc_eq/sig_eq).max():.0%}, far from equal.")

# --------------------------------------------------- solve risk parity ----
from scipy.optimize import minimize


def rp_objective(w, Sigma):
    rc, sigma_p = risk_contributions(w, Sigma)
    target = sigma_p / len(w)
    return np.sum((rc - target) ** 2)   # equalise risk contributions


cons = ({"type": "eq", "fun": lambda w: w.sum() - 1},)
bnds = tuple((0.0, 1.0) for _ in range(n))
res = minimize(rp_objective, w_eq, args=(Sigma.values,), method="SLSQP",
               bounds=bnds, constraints=cons, tol=1e-12)
w_rp = res.x
rc_rp, sig_rp = risk_contributions(w_rp, Sigma.values)

print("\n[2/3] Risk parity (SciPy, from scratch):")
print(pd.DataFrame({"RP weight": w_rp, "risk share": rc_rp / sig_rp},
                   index=[NAMES[t] for t in TICKERS]).round(3))
print(f"Portfolio vol: {sig_rp:.1%} — every risk share = {1/n:.0%}.")

# figure: capital vs risk shares, equal weight vs risk parity
labels = [NAMES[t] for t in TICKERS]
x = np.arange(n)
fig, axes = plt.subplots(1, 2, figsize=(11, 4.5), sharey=True)
panels = [(axes[0], w_eq, rc_eq / sig_eq, "Equal weight: risk is concentrated"),
          (axes[1], w_rp, rc_rp / sig_rp, "Risk parity: risk is equalised")]
for ax, wgt, share, title in panels:
    ax.bar(labels, wgt, alpha=0.6, label="capital weight", color="gray")
    ax.bar(labels, share, alpha=0.8, label="risk share",
           color="crimson" if wgt is w_eq else "steelblue", width=0.5)
    ax.axhline(1 / n, color="black", ls=":", lw=1)
    ax.set_title(title)
    ax.legend()
fig.tight_layout()
save(fig, "figure_1_risk_shares.png")

# ------------------------------------------- validate with Riskfolio ----
print("\n[3/3] Validation with Riskfolio-lib:")
import riskfolio as rp

port = rp.Portfolio(returns=rets)
port.assets_stats(method_mu="hist", method_cov="hist")
w_lib = port.rp_optimization(model="Classic", rm="MV", rf=0, b=None)

compare = pd.DataFrame({"from scratch (SciPy)": w_rp,
                        "Riskfolio-lib": w_lib["weights"].values},
                       index=[NAMES[t] for t in TICKERS])
compare["abs diff"] = (compare.iloc[:, 0] - compare.iloc[:, 1]).abs()
print(compare.round(4))
print(f"Max weight difference: {compare['abs diff'].max():.2e}  (solver tolerance)")

# --------------------------------------------- leverage to vol target ----
target_vol = 0.10
leverage = target_vol / sig_rp
w_levered = w_rp * leverage

print(f"\nUnlevered RP vol: {sig_rp:.1%}")
print(f"Leverage to reach {target_vol:.0%}: {leverage:.2f}x")
print(f"Gross exposure: {w_levered.sum():.2f}  (vs 1.00 unlevered)\n")
print(pd.Series(w_levered, index=[NAMES[t] for t in TICKERS], name="levered weight").round(3))

print("\nDone.")
