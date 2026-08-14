/* The GameStop Squeeze — code, VERBATIM from the CS15_GameStop_Squeeze notebook.
   Nothing was executed: the article publishes his prose and code as written,
   with no computed results or figures, so his own yfinance loader stands
   unmodified. */

export const SETUP_CODE = String.raw`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

plt.rcParams["figure.dpi"] = 110`;

export const DATA_CODE = String.raw`TICKERS = ["GME", "XRT", "^VIX"]
START, END = "2020-10-01", "2021-03-31"

def load_prices(tickers, start, end):
    """Adjusted-close prices via yfinance."""
    import yfinance as yf
    df = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)["Close"]
    return df[tickers].dropna()

px = load_prices(TICKERS, START, END)
rets = px.pct_change().dropna()
print(f"{len(px)} trading days, {px.index[0].date()} → {px.index[-1].date()}")
print(f"\nGME: start {px['GME'].iloc[0]:.2f}, peak {px['GME'].max():.2f} "
      f"({px['GME'].idxmax().date()}), end {px['GME'].iloc[-1]:.2f}")`;

export const SQUEEZE_CODE = String.raw`fig, ax = plt.subplots(figsize=(11, 5.5))
ax.plot(px.index, px["GME"], color="crimson", lw=1.5)
ax.set_yscale("log")
events = {
    "2021-01-13": "Cohen board news",
    "2021-01-22": "gamma squeeze ignites",
    "2021-01-28": "peak / buying restricted",
    "2021-02-24": "second squeeze",
}
for d, label in events.items():
    d = pd.Timestamp(d)
    if d in px.index or True:
        ax.axvline(d, color="gray", ls=":", lw=1)
        ax.annotate(label, (d, px["GME"].max()*0.7), rotation=90,
                    fontsize=8, ha="right", va="top")
ax.set_title("GME adjusted close (log scale)")
ax.set_ylabel("Price ($, log)")
plt.tight_layout(); plt.show()

jan = rets.loc["2021-01", "GME"]
print(f"January 2021: {(1+jan).prod()-1:+.0%} in one month")
print(f"Biggest single days: {jan.nlargest(3).apply('{:+.0%}'.format).to_dict()}")
print(f"Worst single day:    {jan.min():+.0%}")`;

export const SPILL_CODE = String.raw`fig, ax1 = plt.subplots(figsize=(11, 4.5))
ax1.plot(px.index, px["XRT"] / px["XRT"].iloc[0] * 100, color="steelblue", label="XRT (indexed)")
ax1.set_ylabel("XRT (indexed to 100)", color="steelblue")
ax2 = ax1.twinx()
ax2.plot(px.index, px["^VIX"], color="gray", alpha=0.7, label="VIX")
ax2.set_ylabel("VIX", color="gray")
ax1.axvspan(pd.Timestamp("2021-01-22"), pd.Timestamp("2021-02-02"), color="crimson", alpha=0.10)
ax1.set_title("The spillover: XRT surges with its runaway holding; VIX wakes up")
plt.tight_layout(); plt.show()

print(f"XRT move, Jan 22–27: {px.loc['2021-01-27','XRT']/px.loc['2021-01-22','XRT']-1:+.1%}")
print(f"VIX, Jan 25–27: {px.loc['2021-01-25':'2021-01-27','^VIX'].round(1).to_list()}"
      f" — a single stock moving the market's fear gauge")`;

export const SHORT_CODE = String.raw`# short position P&L, daily compounding (mark-to-market of a static short entered Jan 4)
short_ret = -rets.loc["2021-01", "GME"]
pnl_path = (1 + short_ret).cumprod() - 1

fig, ax = plt.subplots(figsize=(10, 4))
ax.plot(pnl_path.index, pnl_path * 100, color="crimson")
ax.axhline(-100, color="black", ls="--", lw=1, label="-100% = position wiped out")
ax.set_title("P&L of a short position in GME entered Jan 4, 2021 (mark-to-market)")
ax.set_ylabel("Cumulative P&L (%)"); ax.legend()
plt.tight_layout(); plt.show()

print(f"Short P&L by Jan 27: {pnl_path.loc['2021-01-27']:+.0%}")
print("A 2% book position: ~-40% portfolio hit before risk systems could rebalance.")
print("This asymmetry — shorts grow as they lose — is the structural lesson.")`;
