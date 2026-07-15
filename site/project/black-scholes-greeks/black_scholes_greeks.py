# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "scipy", "matplotlib", "pandas", "yfinance"]
# ///
"""
Black-Scholes & the Greeks — shown through QQQ (Nasdaq 100) options.

A self-contained project script. It pulls QQQ prices, calibrates volatility,
prices a 3-month option, computes the Greeks, saves two figures (next to this
file), and runs two sanity checks (put-call parity + Monte Carlo):

  1. figure_1_greeks_across_strikes.png  — Delta / Gamma / Vega / Theta vs moneyness
  2. figure_2_time_decay.png             — call value vs time to expiry (Theta at work)

You normally don't run this by hand — double-click the launcher for your OS
(run-macos.command / run-linux.sh / run-windows.bat) and it will install
everything and run this for you. `python black_scholes_greeks.py` also works if
you already have numpy, scipy, matplotlib, pandas and yfinance. An internet
connection is needed to download the QQQ price history.
"""

import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # no display needed — we save PNGs
import matplotlib.pyplot as plt
from scipy.stats import norm

HERE = os.path.dirname(os.path.abspath(__file__))
np.random.seed(42)


def save(fig, name):
    path = os.path.join(HERE, name)
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  saved  {name}")


# ---------------------------------------------------------- Black-Scholes ----
def bs_price(S, K, T, r, sigma, kind="call"):
    """Black-Scholes price for a European call or put."""
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if kind == "call":
        return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)


def bs_greeks(S, K, T, r, sigma, kind="call"):
    """Delta, Gamma, Vega, Theta (per year), Rho for a European option."""
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    sign = 1 if kind == "call" else -1
    return {
        "delta": sign * norm.cdf(sign * d1),
        "gamma": norm.pdf(d1) / (S * sigma * np.sqrt(T)),
        "vega": S * norm.pdf(d1) * np.sqrt(T),
        "theta": (-S * norm.pdf(d1) * sigma / (2 * np.sqrt(T))
                  - sign * r * K * np.exp(-r * T) * norm.cdf(sign * d2)),
        "rho": sign * K * T * np.exp(-r * T) * norm.cdf(sign * d2),
    }


# ------------------------------------------------------------------- data ----
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


TICKER = "QQQ"
START, END = "2018-01-01", "2024-12-31"

print("[data] loading QQQ price history ...")
px = load_prices(TICKER, START, END)
log_ret = np.log(px / px.shift(1)).dropna()

S0 = float(px.iloc[-1])
SIGMA = float(log_ret.tail(252).std() * np.sqrt(252))   # trailing 1y realised vol
R = 0.045                                                # short-term risk-free rate
T3M = 0.25                                               # 3 months
K_ATM = round(S0)                                        # at-the-money strike

call = bs_price(S0, K_ATM, T3M, R, SIGMA, "call")
put = bs_price(S0, K_ATM, T3M, R, SIGMA, "put")
g = bs_greeks(S0, K_ATM, T3M, R, SIGMA, "call")

print(f"  {TICKER} spot = {S0:,.2f}   sigma = {SIGMA:.2%}   r = {R:.2%}")
print(f"  3M ATM call (K={K_ATM}): {call:6.2f}     put: {put:6.2f}")
print(f"  Greeks: delta {g['delta']:.3f}  gamma {g['gamma']:.5f}  vega {g['vega']:.2f}"
      f"  theta {g['theta'] / 365:.3f}/day  rho {g['rho']:.2f}")

# ------------------------------------------------------------- Figure 1 ----
print("[1/2] Greeks across strikes ...")
strikes = np.linspace(0.80 * S0, 1.20 * S0, 200)
G = {k: [] for k in ["delta", "gamma", "vega", "theta"]}
for K in strikes:
    gk = bs_greeks(S0, K, T3M, R, SIGMA, "call")
    for k in G:
        G[k].append(gk[k])

fig, axes = plt.subplots(2, 2, figsize=(11, 6), sharex=True)
for ax, k in zip(axes.flat, G):
    ax.plot(strikes / S0, G[k], color="steelblue")
    ax.axvline(1.0, color="gray", ls=":", lw=1)
    ax.set_title(k.capitalize())
    ax.set_xlabel("Moneyness  K / S")
fig.suptitle(f"{TICKER} 3M call Greeks across strikes  (S={S0:,.0f}, sigma={SIGMA:.0%})")
fig.tight_layout()
save(fig, "figure_1_greeks_across_strikes.png")

# ------------------------------------------------------------- Figure 2 ----
print("[2/2] Time decay ...")
maturities = np.linspace(1e-3, 1.0, 200)
atm_prices = [bs_price(S0, K_ATM, t, R, SIGMA, "call") for t in maturities]
otm_prices = [bs_price(S0, 1.05 * S0, t, R, SIGMA, "call") for t in maturities]

fig, ax = plt.subplots(figsize=(10, 4))
ax.plot(maturities * 12, atm_prices, label=f"ATM (K={K_ATM})", color="steelblue")
ax.plot(maturities * 12, otm_prices, label="5% OTM", color="darkorange")
ax.set_xlabel("Months to expiry")
ax.set_ylabel("Call value")
ax.set_title(f"{TICKER}: value vs time to expiry — Theta accelerates near zero")
ax.invert_xaxis()
ax.legend()
fig.tight_layout()
save(fig, "figure_2_time_decay.png")

# --------------------------------------------------------------- checks ----
print("\n[checks]")
lhs, rhs = call - put, S0 - K_ATM * np.exp(-R * T3M)
print(f"  put-call parity: C - P = {lhs:.6f}   S - K e^-rT = {rhs:.6f}   diff = {abs(lhs - rhs):.2e}")

N = 200_000
z = np.random.normal(size=N)
S_T = S0 * np.exp((R - 0.5 * SIGMA**2) * T3M + SIGMA * np.sqrt(T3M) * z)
payoff = np.maximum(S_T - K_ATM, 0)
mc_call = np.exp(-R * T3M) * payoff.mean()
se = np.exp(-R * T3M) * payoff.std() / np.sqrt(N)
print(f"  Monte Carlo call: {mc_call:.3f} +/- {2 * se:.3f}   closed form: {call:.3f}")

print(f"\nDone. Two figures were saved in:\n  {HERE}")
