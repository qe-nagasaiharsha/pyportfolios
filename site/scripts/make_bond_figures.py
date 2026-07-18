"""Generate the three Bond duration/convexity figures in the site's editorial
style (cream plate, serif, monochrome) and print the table values used in the
article. Pulls live ETF data for the 2022 chart.  Run: python scripts/make_bond_figures.py
"""
import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "public", "figures"))
os.makedirs(OUT, exist_ok=True)

# ---- editorial style ----
BG, INK, GREY, MID, LT, GRID = "#f3f1ea", "#0d0d0d", "#7a7a7a", "#565650", "#b3ac9c", "#d7d3c6"
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

def headline(fig, title, dek, x=0.065, y1=0.94, y2=0.855):
    fig.text(x, y1, title, fontsize=23, fontweight="bold", color=INK, ha="left", va="top")
    fig.text(x, y2, dek, fontsize=13.5, style="italic", color=GREY, ha="left", va="top")

# ---- bond maths (verbatim) ----
def bond_price(face, coupon, y, T, freq=2):
    n = int(round(T * freq)); t = np.arange(1, n + 1)
    cf = np.full(n, face * coupon / freq); cf[-1] += face
    return float(np.sum(cf / (1 + y / freq) ** t))

def duration_convexity(face, coupon, y, T, freq=2, h=1e-4):
    p0 = bond_price(face, coupon, y, T, freq)
    p_up, p_dn = bond_price(face, coupon, y + h, T, freq), bond_price(face, coupon, y - h, T, freq)
    return -(p_up - p_dn) / (2 * h * p0), (p_up - 2 * p0 + p_dn) / (h**2 * p0)

# ---- Figure 4.1 — price vs yield, three maturities ----
yields = np.linspace(0.001, 0.10, 200)
fig, ax = plt.subplots(figsize=(13.5, 5.8))
fig.subplots_adjust(top=0.72, left=0.07, right=0.965, bottom=0.13)
for T, tone in [(2, LT), (10, MID), (30, INK)]:
    ax.plot(yields * 100, [bond_price(100, 0.04, y, T) for y in yields], color=tone, lw=2, label=f"{T}y Treasury")
ax.axhline(100, color=GREY, ls=":", lw=1); ax.axvline(4, color=GREY, ls=":", lw=1)
ax.set_xlabel("Yield (%)"); ax.set_ylabel("Price")
ax.legend(frameon=False, loc="upper right")
headline(fig, "Price falls as yield rises — and longer bonds fall hardest",
         "Same 4% coupon, three maturities: longer = steeper slope (duration) and more curve (convexity).")
fig.savefig(os.path.join(OUT, "bond-price-yield.png"), dpi=150); plt.close(fig)

# ---- duration ladder (printed for the article table) ----
print("=== ladder ===")
for T in [1, 2, 5, 10, 20, 30]:
    d, c = duration_convexity(100, 0.04, 0.04, T)
    p0, p1 = bond_price(100, 0.04, 0.04, T), bond_price(100, 0.04, 0.05, T)
    print(f"{T:>2}y  D={d:5.2f}  C={c:7.1f}  dP(+100bp)={(p1/p0-1)*100:+.2f}%")

# ---- Figure 4.3 — SHY / IEF / TLT in 2022 ----
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

etfs = {"SHY": (1.9, 0.0370), "IEF": (7.5, 0.0237), "TLT": (17.5, 0.0207)}
px = pd.concat([load_prices(t, "2021-12-31", "2022-12-31") for t in etfs], axis=1).dropna()
total_ret = px.iloc[-1] / px.iloc[0] - 1
print("=== etf ===")
for t, (d, dy) in etfs.items():
    print(f"{t}  D={d:.1f}  dY={dy:.2%}  pred={-d*dy:+.1%}  actual={total_ret[t]:+.1%}")

fig, ax = plt.subplots(figsize=(13.5, 5.2))
fig.subplots_adjust(top=0.70, left=0.07, right=0.965, bottom=0.12)
for t, tone in zip(etfs, [LT, MID, INK]):
    ax.plot((px[t] / px[t].iloc[0] * 100).index, px[t] / px[t].iloc[0] * 100, color=tone, lw=2, label=f"{t}  (D≈{etfs[t][0]})")
ax.set_ylabel("Value (indexed to 100)"); ax.legend(frameon=False, loc="lower left")
headline(fig, "2022: the duration ladder, in real life",
         "The longer the ETF's duration, the deeper its drawdown — exactly as the math predicts.",
         y1=0.93, y2=0.84)
fig.savefig(os.path.join(OUT, "bond-etf-2022.png"), dpi=150); plt.close(fig)

# ---- Figure 4.4 — Taylor approximation quality (30y) ----
T = 30
p0 = bond_price(100, 0.04, 0.04, T)
d, c = duration_convexity(100, 0.04, 0.04, T)
shocks = np.linspace(-0.03, 0.03, 61)
exact = np.array([bond_price(100, 0.04, 0.04 + s, T) / p0 - 1 for s in shocks])
lin, quad = -d * shocks, -d * shocks + 0.5 * c * shocks**2
fig, ax = plt.subplots(figsize=(13.5, 5.4))
fig.subplots_adjust(top=0.71, left=0.07, right=0.965, bottom=0.13)
ax.plot(shocks * 100, exact * 100, color=INK, lw=2, label="Exact repricing")
ax.plot(shocks * 100, lin * 100, color=MID, lw=1.8, ls="--", label="Duration only")
ax.plot(shocks * 100, quad * 100, color=INK, lw=1.8, ls=":", label="Duration + convexity")
ax.set_xlabel("Yield shock (%)"); ax.set_ylabel("Price change (%)"); ax.legend(frameon=False, loc="upper right")
headline(fig, "Convexity keeps the approximation honest",
         f"30y bond (D={d:.1f}, C={c:.0f}): duration alone drifts; adding convexity tracks the exact curve.",
         y1=0.94, y2=0.855)
fig.savefig(os.path.join(OUT, "bond-taylor.png"), dpi=150); plt.close(fig)

s = 0.02
print("=== taylor +200bp ===")
print(f"exact={bond_price(100,0.04,0.06,T)/p0-1:+.2%}  dur-only={-d*s:+.2%}  dur+conv={-d*s+0.5*c*s*s:+.2%}")
print("wrote bond-price-yield.png, bond-etf-2022.png, bond-taylor.png")
