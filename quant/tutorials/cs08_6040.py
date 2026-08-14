"""
CS08 - 60/40 in 2022: when the stock-bond correlation flipped (topic card 08/16).
Assets: SPY + AGG (+ TLT for the long-duration pain) · Timeframe: Jan 2000 - Dec 2023
Libs: Pandas NumPy Matplotlib seaborn.

Reproduces Louis's CS8_6040_2022_Correlation_Flip notebook against the pinned
CSV. The source notebook downloads from yfinance at run time with a Stooq
fallback; here the same series come from quant/data/cs08_6040.csv so the
article's numbers do not move between builds.

The window starts at AGG's usable history (2003-10-01 in the notebook) even
though the CSV reaches back to 2000 - matching the notebook's START.

Emits the article data module + the runnable companion notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "sixty-forty-correlation-flip"
START, END = "2003-10-01", "2023-12-31"
WINDOW = 252
W_EQUITY, W_BOND = 0.60, 0.40


def build() -> dict:
    px = load("cs08_6040")[["SPY", "AGG", "TLT"]].loc[START:END].dropna()
    rets = px.pct_change().dropna()

    # ---- 4.2 annual returns -------------------------------------------
    annual = (1 + rets).resample("YE").prod() - 1
    annual.index = annual.index.year
    years = [int(y) for y in annual.index]

    # ---- 4.3 the correlation flip -------------------------------------
    roll = rets["SPY"].rolling(WINDOW).corr(rets["AGG"]).dropna()
    pre_mean = float(roll.loc[:"2021"].mean())
    peak_22 = float(roll.loc["2022":].max())
    peak_date = str(roll.loc["2022":].idxmax().date())

    # ---- 4.4 the 60/40 drawdown ---------------------------------------
    port = W_EQUITY * rets["SPY"] + W_BOND * rets["AGG"]
    val = (1 + port).cumprod()
    dd = val / val.cummax() - 1
    dd_2022 = float(dd.loc["2022":"2023"].min())
    dd_gfc = float(dd.loc["2007":"2010"].min())
    ret_2022 = float((1 + port.loc["2022"]).prod() - 1)

    # how long each drawdown took to arrive - 2022 was faster
    peak_22_i = val.loc[:dd.loc["2022":"2023"].idxmin()].idxmax()
    days_22 = int((dd.loc["2022":"2023"].idxmin() - peak_22_i).days)

    # ---- the TLT counterfactual ---------------------------------------
    cf = {}
    for bond in ("AGG", "TLT"):
        pr = W_EQUITY * rets["SPY"] + W_BOND * rets[bond]
        cf[bond] = r(float((1 + pr.loc["2022"]).prod() - 1), 4)

    print(f"  2022: SPY {annual.loc[2022,'SPY']:+.1%}  AGG {annual.loc[2022,'AGG']:+.1%}  "
          f"TLT {annual.loc[2022,'TLT']:+.1%}")
    print(f"  corr  pre-2022 mean {pre_mean:+.2f}   2022+ peak {peak_22:+.2f} ({peak_date})")
    print(f"  60/40 2022 return {ret_2022:+.1%}   dd 2022 {dd_2022:+.1%}   dd GFC {dd_gfc:+.1%}")
    print(f"  counterfactual: AGG {cf['AGG']:+.1%}  TLT {cf['TLT']:+.1%}")

    dd_thin = dd.iloc[::5]
    roll_thin = roll.iloc[::5]

    return {
        "window": {"start": str(px.index[0].date()), "end": str(px.index[-1].date()),
                   "days": int(len(px))},
        "annual": {
            "years": years,
            "spy": r([float(v) for v in annual["SPY"]], 4),
            "agg": r([float(v) for v in annual["AGG"]], 4),
            "tlt": r([float(v) for v in annual["TLT"]], 4),
            "highlight": [2008, 2020, 2022],
        },
        "corr": {
            "preMean": r(pre_mean, 3),
            "peak": r(peak_22, 3),
            "peakDate": peak_date,
            "y": r([float(v) for v in roll_thin], 4),
            "xLabels": [[f, lab] for f, lab in year_labels(roll_thin.index, step=3)],
        },
        "drawdown": {
            "dd2022": r(dd_2022, 4),
            "ddGfc": r(dd_gfc, 4),
            "ret2022": r(ret_2022, 4),
            "days2022": days_22,
            "y": r([float(v) * 100 for v in dd_thin], 3),
            "xLabels": [[f, lab] for f, lab in year_labels(dd_thin.index, step=3)],
        },
        "counterfactual": cf,
    }


def notebook_cells() -> list:
    return [
        md("""# 60/40 in 2022: When the Stock-Bond Correlation Flipped
### During the 2022 inflation shock, the balanced portfolio failed because its diversifier stopped diversifying.

*Content format: Case Study · Category: Portfolio Optimization*

For two decades, the 60/40 portfolio rested on one quiet assumption: **when stocks fall, bonds rally**. In 2022 that assumption broke. Stocks fell ~18%, long Treasuries fell ~31% — the worst year for a US balanced portfolio since the Global Financial Crisis, and by some measures since the 1930s. This case study reconstructs what happened, why the correlation flipped, and what it means for every portfolio built on the stock-bond hedge.

**The forensic file**
1. **The setting** — why 60/40 worked so well for 20 years
2. **The event** — 2022, month by month
3. **The mechanism** — inflation, and why it flips the correlation sign
4. **The evidence** — rolling correlations and drawdowns from real data
5. **Post-mortem** — lessons and what survived"""),

        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

plt.rcParams["figure.dpi"] = 110
sns.set_style("whitegrid")"""),

        md("""## 1. The setting: two decades of a free hedge

From roughly 2000 to 2021, US stock and Treasury returns were **negatively correlated**. Every equity selloff — 2008, 2011, 2018, March 2020 — saw bonds rally as investors fled to safety and the Fed cut rates. A 60/40 investor got equity upside with a built-in shock absorber, and the strategy compounded through every crisis.

The subtlety everyone forgot: that negative correlation is a **regime**, not a law. It held because inflation was low and stable, so growth shocks dominated — bad news for stocks was good news for bonds (rate cuts coming). In the 1970s–90s, when *inflation* shocks dominated, the correlation had been **positive**."""),

        md("""## 2. The event: 2022 month by month

Inflation, dismissed as "transitory" in 2021, printed 7%+ into 2022. The Fed delivered the fastest hiking cycle in four decades — from 0.25% to 4.50% in ten months. Rising yields crushed bond prices (see our duration tutorial: TLT's ~17.5-year duration × ~2% yield rise ≈ −35%), while the same rate shock compressed equity multiples.

**Both engines of 60/40 stalled at once.** There was nowhere to hide inside the classic mix."""),

        md("""## 3. The mechanism: why inflation flips the sign

- **Growth-shock regime** (2000–2021): bad economy → stocks fall, Fed cuts → bonds rise. Correlation **negative**. 60/40 self-hedges.
- **Inflation-shock regime** (1970s, 2022): inflation up → Fed hikes → *discount rates rise for everything* → stocks **and** bonds fall together. Correlation **positive**. The hedge becomes a second exposure to the same risk.

One variable — which type of shock dominates — determines whether bonds protect you or double your bet."""),

        md("""## 4. The evidence

### 4.1 The data
SPY (S&P 500), AGG (aggregate bonds) and TLT (long Treasuries) from AGG's inception through 2023."""),

        code("""TICKERS = ["SPY", "AGG", "TLT"]
START, END = "2003-10-01", "2023-12-31"

def load_prices(tickers, start, end):
    \"\"\"Adjusted-close prices: yfinance first, Stooq as fallback.\"\"\"
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
print(f"{len(px)} trading days, {px.index[0].date()} → {px.index[-1].date()}")"""),

        md("""### 4.2 Annual returns: 2022 in context
The one chart that tells the story — find another year where *both* bars are deeply negative."""),

        code("""annual = (1 + rets).resample("YE").prod() - 1
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
print("\\n2008 & 2020: bonds cushioned the crash. 2022: they amplified it.")"""),

        md("""### 4.3 The correlation flip
Rolling 1-year correlation of daily stock and bond returns. Two decades below zero — then 2022."""),

        code("""roll_corr = rets["SPY"].rolling(252).corr(rets["AGG"])

fig, ax = plt.subplots(figsize=(11, 4.5))
ax.plot(roll_corr, color="steelblue", lw=1.2)
ax.axhline(0, color="black", lw=0.8)
ax.axvspan(pd.Timestamp("2022-01-01"), pd.Timestamp("2023-01-01"), color="crimson", alpha=0.12)
ax.set_title("Rolling 1-year stock-bond correlation (SPY vs AGG)")
ax.set_ylabel("Correlation")
plt.tight_layout(); plt.show()

print(f"Average correlation 2004–2021: {roll_corr.loc[:'2021'].mean():+.2f}")
print(f"Peak correlation in 2022–23:   {roll_corr.loc['2022':].max():+.2f}")"""),

        md("""### 4.4 The damage: 60/40 drawdown
A monthly-rebalanced 60/40 (SPY/AGG). Compare the 2022 drawdown with the GFC — and note how much *faster* 2022 hurt, because nothing offset anything."""),

        code("""w = {"SPY": 0.60, "AGG": 0.40}
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
print(f"Max drawdown GFC 2008-09: {dd_gfc:+.1%}")"""),

        md("""And the counterfactual that stings: a 60/40 built with **TLT** instead of AGG — more duration, more "hedge" — did *worse* in 2022, because the hedge asset itself was the epicenter."""),

        code("""for bond in ["AGG", "TLT"]:
    pr = 0.60 * rets["SPY"] + 0.40 * rets[bond]
    r22 = (1 + pr.loc["2022"]).prod() - 1
    print(f"60/40 with {bond}: 2022 return {r22:+.1%}")"""),

        md("""## 5. Post-mortem

### What failed
- **The model, not the math** — MVO and risk parity both treated the stock-bond correlation as a stable input. It's regime-dependent, and the regime variable is *inflation*.
- **Duration as a hedge** — in an inflation shock, duration is the *risk*, not the hedge (see the bond tutorial's 2022 ETF table).
- **Recency** — twenty years of negative correlation felt like a law of nature. The 1970s said otherwise all along.

### What survived
- **Commodities and trend-following** had a banner 2022 — the diversifiers nobody wanted during the long bull market.
- **Short-duration bonds** (SHY) lost little — the failure was duration, not bonds per se.
- **The principle of diversification** — but across *risk regimes* (inflation vs growth), not just asset classes.

### The lessons
1. Correlation inputs deserve the same stress-testing as returns — *conditional* on inflation regime, not unconditional averages.
2. A hedge that depends on a regime is a position on that regime persisting.
3. The fix isn't abandoning 60/40 — it's knowing which environments it insures against, and which it doesn't.

### Related content
- **Bond Pricing, Duration & Convexity** — why TLT lost 31% (the mechanics behind this case)
- **Risk Parity from Scratch** — the strategy this correlation flip hurt most
- **Copulas & Tail Dependence** — modelling co-movement beyond a single correlation number

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]


def main() -> None:
    # The article publishes UNEXECUTED - prose and code only, no figures and no
    # computed numbers - so the default output is just the runnable notebook.
    # `--data` re-emits the article data module for whoever wants the results
    # back; nothing on the site imports it today.
    emit_data = "--data" in sys.argv
    if emit_data:
        print(f"  ts -> {write_ts(SLUG, build())}")
    print(f"  nb -> {write_nb(SLUG, notebook_cells())}")
    if not emit_data:
        print("  (no data module: this article publishes unexecuted; pass --data to emit one)")


if __name__ == "__main__":
    main()
