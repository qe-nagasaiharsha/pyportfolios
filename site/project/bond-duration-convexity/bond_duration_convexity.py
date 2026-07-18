# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "scipy", "matplotlib", "pandas", "yfinance"]
# ///
"""
Bond Pricing, Duration & Convexity — via US Treasuries and the ETFs of 2022.

A self-contained project script. It prices fixed-coupon bonds, computes duration
and convexity, prints the duration ladder, checks the theory against the SHY/IEF/
TLT ETF drawdowns of 2022, and saves three figures (next to this file):

  1. figure_1_price_yield.png   price vs yield for 2y / 10y / 30y Treasuries
  2. figure_2_etf_2022.png      SHY / IEF / TLT through 2022 (indexed to 100)
  3. figure_3_taylor.png        30y bond: duration vs duration+convexity vs exact

You normally don't run this by hand — double-click the launcher for your OS
(run-macos.command / run-linux.sh / run-windows.bat) and it will install
everything and run this for you. `python bond_duration_convexity.py` also works
if you already have the libraries. An internet connection is needed to download
the ETF price history.
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


# --------------------------------------------------------------- bonds ----
def bond_price(face, coupon, y, T, freq=2):
    """Price of a fixed-coupon bond (coupon = annual rate, y = YTM)."""
    n = int(round(T * freq))
    t = np.arange(1, n + 1)
    cf = np.full(n, face * coupon / freq)
    cf[-1] += face
    return float(np.sum(cf / (1 + y / freq) ** t))


def duration_convexity(face, coupon, y, T, freq=2, h=1e-4):
    """Modified duration (years) and convexity via central differences."""
    p0 = bond_price(face, coupon, y, T, freq)
    p_up, p_dn = bond_price(face, coupon, y + h, T, freq), bond_price(face, coupon, y - h, T, freq)
    dur = -(p_up - p_dn) / (2 * h * p0)
    conv = (p_up - 2 * p0 + p_dn) / (h**2 * p0)
    return dur, conv


p = bond_price(100, 0.04, 0.04, 10)
d, c = duration_convexity(100, 0.04, 0.04, 10)
print(f"[check] 10y 4% bond at par: P = {p:.2f}, duration = {d:.2f}y, convexity = {c:.1f}")

# ------------------------------------------------------------ Figure 1 ----
print("[1/3] Price vs yield ...")
yields = np.linspace(0.001, 0.10, 200)
fig, ax = plt.subplots(figsize=(10, 5))
for T, color in [(2, "steelblue"), (10, "darkorange"), (30, "crimson")]:
    ax.plot(yields * 100, [bond_price(100, 0.04, y, T) for y in yields], color=color, label=f"{T}y Treasury")
ax.axhline(100, color="gray", ls=":", lw=1)
ax.axvline(4, color="gray", ls=":", lw=1)
ax.set_xlabel("Yield (%)")
ax.set_ylabel("Price")
ax.set_title("Price vs yield - 4% coupon, three maturities")
ax.legend()
fig.tight_layout()
save(fig, "figure_1_price_yield.png")

# --------------------------------------------------- duration ladder ----
print("\n[ladder] +100bp shock")
rows = []
for T in [1, 2, 5, 10, 20, 30]:
    d, c = duration_convexity(100, 0.04, 0.04, T)
    p0, p1 = bond_price(100, 0.04, 0.04, T), bond_price(100, 0.04, 0.05, T)
    rows.append([T, round(d, 2), round(c, 1), f"{(p1 / p0 - 1) * 100:.2f}%"])
print(pd.DataFrame(rows, columns=["Maturity (y)", "Mod. duration", "Convexity", "Exact dP for +100bp"]).to_string(index=False))


# ------------------------------------------------------------ Figure 2 ----
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


print("\n[2/3] SHY / IEF / TLT in 2022 ...")
etfs = {"SHY": (1.9, 0.0370), "IEF": (7.5, 0.0237), "TLT": (17.5, 0.0207)}
px = pd.concat([load_prices(t, "2021-12-31", "2022-12-31") for t in etfs], axis=1).dropna()
total_ret = px.iloc[-1] / px.iloc[0] - 1
print(f"  {'ETF':4} {'duration':>9} {'dY 2022':>8} {'predicted -D*dY':>16} {'actual 2022':>12}")
for t, (d, dy) in etfs.items():
    print(f"  {t:4} {d:9.1f} {dy:8.2%} {-d * dy:16.1%} {total_ret[t]:12.1%}")

fig, ax = plt.subplots(figsize=(10, 4))
(px / px.iloc[0] * 100).plot(ax=ax, color=["steelblue", "darkorange", "crimson"])
ax.set_title("2022: the duration ladder in real life (indexed to 100)")
ax.set_ylabel("Value")
fig.tight_layout()
save(fig, "figure_2_etf_2022.png")

# ------------------------------------------------------------ Figure 3 ----
print("\n[3/3] Taylor approximation quality (30y) ...")
T = 30
p0 = bond_price(100, 0.04, 0.04, T)
d, c = duration_convexity(100, 0.04, 0.04, T)
shocks = np.linspace(-0.03, 0.03, 61)
exact = np.array([bond_price(100, 0.04, 0.04 + s, T) / p0 - 1 for s in shocks])
lin, quad = -d * shocks, -d * shocks + 0.5 * c * shocks**2

fig, ax = plt.subplots(figsize=(10, 4.5))
ax.plot(shocks * 100, exact * 100, "k", label="Exact repricing")
ax.plot(shocks * 100, lin * 100, "--", color="steelblue", label="Duration only")
ax.plot(shocks * 100, quad * 100, "--", color="darkorange", label="Duration + convexity")
ax.set_xlabel("Yield shock (%)")
ax.set_ylabel("Price change (%)")
ax.set_title(f"30y bond: Taylor approximation quality (D={d:.1f}, C={c:.0f})")
ax.legend()
fig.tight_layout()
save(fig, "figure_3_taylor.png")

s = 0.02
print(f"\n[check] +200bp: exact {bond_price(100, 0.04, 0.06, T) / p0 - 1:+.2%}   "
      f"dur-only {-d * s:+.2%}   dur+conv {-d * s + 0.5 * c * s * s:+.2%}")
print(f"\nDone. Three figures were saved in:\n  {HERE}")
