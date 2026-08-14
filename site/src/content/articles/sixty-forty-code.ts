/* 60/40 in 2022 — code, VERBATIM from the CS8_6040_2022_Correlation_Flip notebook.
   Nothing was executed: the article publishes his prose and code as written,
   with no computed results or figures, so his own yfinance/Stooq loader stands
   unmodified. */

export const SETUP_CODE = String.raw`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

plt.rcParams["figure.dpi"] = 110
sns.set_style("whitegrid")`;

export const DATA_CODE = String.raw`TICKERS = ["SPY", "AGG", "TLT"]
START, END = "2003-10-01", "2023-12-31"

def load_prices(tickers, start, end):
    """Adjusted-close prices: yfinance first, Stooq as fallback."""
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
print(f"{len(px)} trading days, {px.index[0].date()} → {px.index[-1].date()}")`;

export const ANNUAL_CODE = String.raw`annual = (1 + rets).resample("YE").prod() - 1
annual.index = annual.index.year

ax = annual[["SPY", "AGG"]].plot(kind="bar", figsize=(11, 4.5),
                                  color=["steelblue", "darkorange"], width=0.8)
ax.axhline(0, color="black", lw=0.8)
ax.set_ylabel("Total return"); ax.set_title("Annual returns: stocks (SPY) vs bonds (AGG)")
ax.legend(["SPY (stocks)", "AGG (bonds)"])
for yr, row in annual.iterrows():
    if yr == 2022:
        ax.axvspan(list(annual.index).index(yr) - 0.5, list(annual.index).index(yr) + 0.5,
                   color="crimson", alpha=0.10)
plt.tight_layout(); plt.show()

print(annual.loc[[2008, 2020, 2022]].round(3))
print("\n2008 & 2020: bonds cushioned the crash. 2022: they amplified it.")`;

export const CORR_CODE = String.raw`roll_corr = rets["SPY"].rolling(252).corr(rets["AGG"])

fig, ax = plt.subplots(figsize=(11, 4.5))
ax.plot(roll_corr, color="steelblue", lw=1.2)
ax.axhline(0, color="black", lw=0.8)
ax.axvspan(pd.Timestamp("2022-01-01"), pd.Timestamp("2023-01-01"), color="crimson", alpha=0.12)
ax.set_title("Rolling 1-year stock-bond correlation (SPY vs AGG)")
ax.set_ylabel("Correlation")
plt.tight_layout(); plt.show()

print(f"Average correlation 2004–2021: {roll_corr.loc[:'2021'].mean():+.2f}")
print(f"Peak correlation in 2022–23:   {roll_corr.loc['2022':].max():+.2f}")`;

export const DRAWDOWN_CODE = String.raw`w = {"SPY": 0.60, "AGG": 0.40}
port_rets = (rets[list(w)] * pd.Series(w)).sum(axis=1)          # daily, approx monthly rebalance
port_val = (1 + port_rets).cumprod()
drawdown = port_val / port_val.cummax() - 1

fig, ax = plt.subplots(figsize=(11, 4.5))
ax.fill_between(drawdown.index, drawdown * 100, 0, color="steelblue", alpha=0.6)
ax.axvspan(pd.Timestamp("2022-01-01"), pd.Timestamp("2023-01-01"), color="crimson", alpha=0.12)
ax.set_title("60/40 (SPY/AGG) drawdown")
ax.set_ylabel("Drawdown (%)")
plt.tight_layout(); plt.show()

dd_2022 = drawdown.loc["2022":"2023"].min()
dd_gfc  = drawdown.loc["2007":"2010"].min()
ret_2022 = (1 + port_rets.loc["2022"]).prod() - 1
print(f"60/40 total return 2022:  {ret_2022:+.1%}")
print(f"Max drawdown 2022–23:     {dd_2022:+.1%}")
print(f"Max drawdown GFC 2008-09: {dd_gfc:+.1%}")`;

export const COUNTERFACTUAL_CODE = String.raw`for bond in ["AGG", "TLT"]:
    pr = 0.60 * rets["SPY"] + 0.40 * rets[bond]
    r22 = (1 + pr.loc["2022"]).prod() - 1
    print(f"60/40 with {bond}: 2022 return {r22:+.1%}")`;
