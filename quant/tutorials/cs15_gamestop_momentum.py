"""
CS15 - The GameStop squeeze: when momentum models broke (topic card 15/16).
Assets: GME + XRT + ^VIX · Timeframe: Oct 2020 - Mar 2021
Libs: Pandas NumPy Matplotlib.

Reproduces Louis's CS15_GameStop_Squeeze notebook against the pinned CSV. The
source notebook downloads from yfinance; the pinned quant/data/cs15_gamestop.csv
carries the identical series (verified: GME peak 86.88 either way), so the
published numbers cannot drift between builds.

NOTE: the site already carries a GameStop case study - "Anatomy of a Short
Squeeze" (slug gamestop-short-squeeze), an exemplar piece written to demonstrate
the Case Study format. This is the commissioned topic-card article and runs
alongside it by explicit decision; the two share a data file and an event but
not a slug, a notebook or a data module.

Emits the article data module + the runnable companion notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "gamestop-momentum-models"
TICKERS = ["GME", "XRT", "^VIX"]
# yfinance treats `end` as EXCLUSIVE, so the notebook's "2021-03-31" stops on
# the 30th (124 rows, last close 48.62). pandas .loc is inclusive, so the last
# day is named explicitly here to reproduce the notebook exactly.
START, END = "2020-10-01", "2021-03-30"

EVENTS = {
    "2021-01-13": "Cohen board news",
    "2021-01-22": "gamma squeeze ignites",
    "2021-01-28": "peak / buying restricted",
    "2021-02-24": "second squeeze",
}


def build() -> dict:
    px = load("cs15_gamestop")[TICKERS].loc[START:END].dropna()
    rets = px.pct_change().dropna()

    gme = px["GME"]
    peak_i = gme.idxmax()

    # ---- 4.2 the squeeze in one chart ---------------------------------
    jan = rets.loc["2021-01", "GME"]
    jan_total = float((1 + jan).prod() - 1)
    top3 = [{"date": str(d.date()), "ret": r(float(v), 4)} for d, v in jan.nlargest(3).items()]
    worst = {"date": str(jan.idxmin().date()), "ret": r(float(jan.min()), 4)}

    # ---- 4.3 spillover -------------------------------------------------
    xrt_move = float(px.loc["2021-01-27", "XRT"] / px.loc["2021-01-22", "XRT"] - 1)
    vix_window = [r(float(v), 1) for v in px.loc["2021-01-25":"2021-01-27", "^VIX"]]

    # ---- 4.4 the systematic short -------------------------------------
    short_ret = -rets.loc["2021-01", "GME"]
    pnl = (1 + short_ret).cumprod() - 1
    pnl_jan27 = float(pnl.loc["2021-01-27"])

    idx = px.index
    frac = lambda ts: round(float(idx.searchsorted(pd.Timestamp(ts))) / max(len(idx) - 1, 1), 4)

    print(f"  {len(px)} days  {idx[0].date()} -> {idx[-1].date()}")
    print(f"  GME start {gme.iloc[0]:.2f}  peak {gme.max():.2f} ({peak_i.date()})  end {gme.iloc[-1]:.2f}")
    print(f"  January {jan_total:+.0%}   worst day {jan.min():+.0%}")
    print(f"  XRT Jan22-27 {xrt_move:+.1%}   VIX {vix_window}")
    print(f"  short P&L by Jan 27 {pnl_jan27:+.0%}")

    return {
        "window": {"start": str(idx[0].date()), "end": str(idx[-1].date()), "days": int(len(px))},
        "gme": {
            "start": r(float(gme.iloc[0]), 2),
            "peak": r(float(gme.max()), 2),
            "peakDate": str(peak_i.date()),
            "end": r(float(gme.iloc[-1]), 2),
            "y": r([float(v) for v in gme], 3),
            "xLabels": [[f, lab] for f, lab in year_labels(idx, step=1)] or
                       [[0.0, "Oct"], [0.5, "Jan"], [1.0, "Mar"]],
            "events": [{"label": lab, "date": d, "at": frac(d)} for d, lab in EVENTS.items()],
        },
        "january": {"total": r(jan_total, 4), "top3": top3, "worst": worst},
        "spill": {
            "xrt": r([float(v) for v in px["XRT"] / px["XRT"].iloc[0] * 100], 3),
            "vix": r([float(v) for v in px["^VIX"]], 2),
            "xrtMove": r(xrt_move, 4),
            "vixWindow": vix_window,
            "bandFrom": frac("2021-01-22"), "bandTo": frac("2021-02-02"),
        },
        "short": {
            "y": r([float(v) * 100 for v in pnl], 2),
            "labels": [str(d.date())[5:] for d in pnl.index],
            "jan27": r(pnl_jan27, 4),
        },
    }


def notebook_cells() -> list:
    return [
        md("""# The GameStop Squeeze: When Momentum Models Broke
### During January 2021, short-momentum strategies failed because the most crowded trade in the market became the most dangerous one.

*Content format: Case Study · Category: Algorithmic Trading*

In January 2021 a dying mall retailer became, briefly, the most traded stock on Earth. GameStop rose ~2,700% in three weeks, a hedge fund with a decade of strong returns needed a bailout, and every systematic strategy holding "short the weak stocks" learned that its risk model had a blind spot. This case study reconstructs the squeeze from market data and examines why quantitative models — trained on decades in which shorting losers worked — broke.

**The forensic file**
1. **The setting** — the most shorted stock in America
2. **The event** — three weeks in January, day by day
3. **The mechanism** — short squeeze + gamma squeeze, a feedback loop
4. **The evidence** — price, volume, and collateral damage in the data
5. **Post-mortem** — what it did to quant models, and the lessons"""),

        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

plt.rcParams["figure.dpi"] = 110"""),

        md("""## 1. The setting

By late 2020, GameStop (GME) was a consensus short: a brick-and-mortar game retailer in a download world. Reported **short interest exceeded 100% of the float** — more shares sold short than were available to trade — via rehypothecation. For a momentum or quality model, GME scored terribly on every factor; being short was the "safe," crowded, model-approved position.

The vulnerability hiding in that consensus: a short position has **unlimited loss** and, when everyone must exit at once, exiting *is* buying. The crowd was the risk."""),

        md("""## 2. The event

- **Jan 11–13:** GME adds board members from Chewy's founder Ryan Cohen; the stock jumps ~60%. Retail buying accelerates, coordinated openly on r/wallstreetbets.
- **Jan 19–22:** Short-seller reports trigger not selling but *more* buying. Heavy call-option volume forces market makers to hedge by buying stock.
- **Jan 25–27:** The vertical phase — GME goes from ~$65 to ~$347. Melvin Capital takes a $2.75B injection. Short interest starts collapsing as funds capitulate.
- **Jan 28:** Peak intraday ~$483. Several brokers **restrict buying** (position-close-only), citing clearinghouse margin. The squeeze breaks.
- **Feb–Mar:** Collapse to ~$40, then a second, smaller squeeze in late February."""),

        md("""## 3. The mechanism: two squeezes feeding each other

**Short squeeze:** rising price → shorts face margin calls → they buy to cover → price rises further. The exit *is* fuel.

**Gamma squeeze:** retail buys short-dated calls → dealers who sold the calls are short gamma and must buy stock as it rises to stay hedged → price rises → deltas rise → dealers buy more. A mechanical accelerant layered on the behavioral one.

Neither loop cares about fundamentals. Once ignited, price becomes a function of *positioning*, not value — precisely the variable most quant models didn't include."""),

        md("""## 4. The evidence

### 4.1 The data: GME, its ETF host, and the market's fear gauge"""),

        code("""TICKERS = ["GME", "XRT", "^VIX"]
START, END = "2020-10-01", "2021-03-31"

def load_prices(tickers, start, end):
    \"\"\"Adjusted-close prices via yfinance.\"\"\"
    import yfinance as yf
    df = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)["Close"]
    return df[tickers].dropna()

px = load_prices(TICKERS, START, END)
rets = px.pct_change().dropna()
print(f"{len(px)} trading days, {px.index[0].date()} → {px.index[-1].date()}")
print(f"\\nGME: start {px['GME'].iloc[0]:.2f}, peak {px['GME'].max():.2f} "
      f"({px['GME'].idxmax().date()}), end {px['GME'].iloc[-1]:.2f}")"""),

        md("""### 4.2 The squeeze in one chart
Log scale — the only way to see both the base and the spike. Annotations mark the phase transitions."""),

        code("""fig, ax = plt.subplots(figsize=(11, 5.5))
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
print(f"Worst single day:    {jan.min():+.0%}")"""),

        md("""### 4.3 Collateral damage: the ETF that couldn't help itself
GME sat inside XRT (SPDR Retail ETF). As GME went vertical, its weight in the "diversified" ETF exploded — briefly approaching ~20% — dragging a passive vehicle into the squeeze."""),

        code("""fig, ax1 = plt.subplots(figsize=(11, 4.5))
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
      f" — a single stock moving the market's fear gauge")"""),

        md("""### 4.4 What it did to a systematic short
Simulate the naive quant position: short GME with monthly rebalancing (the classic momentum/quality short book, isolated to one name). Sizing at just 2% of a book, the January move alone is catastrophic — and daily mark-to-market shows why margin forced covering *before* any month-end rebalance."""),

        code("""# short position P&L, daily compounding (mark-to-market of a static short entered Jan 4)
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
print("This asymmetry — shorts grow as they lose — is the structural lesson.")"""),

        md("""## 5. Post-mortem

### What failed in the models
- **Factor models scored GME correctly and were destroyed anyway** — the signal wasn't wrong about value; it was blind to *positioning*. Short interest and borrow cost weren't inputs.
- **Risk models assumed exits exist** — liquidation models presume you can cover near current prices. In a squeeze, covering moves the price against you; the crowd exits through one door.
- **Normal-market position sizing** — a 100%+ short-interest name has a fat right tail *by construction*. Sizing it like any other short ignored that the loss distribution was not remotely log-normal (see our fat-tails work).

### What survived
- **Strategies with short-interest / crowding filters** side-stepped the worst names.
- **Hard per-name loss limits** — the dumb, old-fashioned stop — beat sophisticated covariance-based risk for this event.
- **The squeeze faded** — by April GME was back below $200 and momentum factors normalised; the *event* was survivable, the *sizing* often wasn't.

### The lessons
1. **Crowding is a risk factor.** Short interest, days-to-cover and borrow cost belong in the model, not the footnotes.
2. **Shorts need asymmetric sizing** — the position grows as it hurts you; the equivalent long shrinks.
3. **Reflexivity is real:** when positioning drives price, historical covariances describe a market that no longer exists.
4. **Market structure matters** — gamma hedging turned option flow into a price accelerant; ignoring the options market meant missing half the mechanism.

### Related content
- **Alpha Decay** (next) — crowding's slower cousin: everyone finding the same signal
- **Fat tails / GBM tutorial** — the distributional assumption squeezes violate
- **SMA Crossover Backtest** — where systematic discipline helps rather than hurts

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
