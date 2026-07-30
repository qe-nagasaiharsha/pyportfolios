"""
Legacy upgrade - Cross-Sectional Momentum (research article).
Assets: 11 SPDR sector ETFs · Timeframe: Jan 2005 - Dec 2024 · Data: rn16_sectors.csv.

Builds the real 12-1 cross-sectional momentum book on the sector universe:
rank each month-end on the trailing t-12..t-2 compounded return (skip the most
recent month), go long the top 3 / short the bottom 3 equally weighted and
dollar-neutral, lag weights once, charge 10 bp (and 20 bp) on traded notional.
Emits the article data module + the runnable notebook. Fully deterministic.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "cross-sectional-momentum"
TOP_N = 3          # long the top 3 sectors, short the bottom 3
COST_BP = 10       # base cost: 10 bp per unit of one-way traded notional
COST_BP_HI = 20    # stress cost for the honesty table
N_RANK_BINS = 11   # rank bins for the decile-style bar chart


def book_stats(ret: pd.Series) -> dict[str, float]:
    ret = ret.dropna()
    yrs = len(ret) / 12
    cagr = float((1 + ret).prod() ** (1 / yrs) - 1)
    vol = float(ret.std(ddof=1) * np.sqrt(12))
    sharpe = float(np.sqrt(12) * ret.mean() / ret.std(ddof=1))
    eq = (1 + ret).cumprod()
    maxdd = float((eq / eq.cummax() - 1).min())
    return {"annRet": cagr, "annVol": vol, "sharpe": sharpe, "maxDD": maxdd}


def main() -> None:
    px = load("rn16_sectors")                       # daily adjusted closes
    mpx = px.resample("ME").last()
    mret = mpx.pct_change()

    # ---- 12-1 signal: compound months t-11..t-1, skip the most recent month t
    mom = ((1 + mret).rolling(11).apply(np.prod, raw=True) - 1).shift(1)

    # point-in-time universe: a sector is rankable only once it has the full
    # 12-1 window (XLRE from 2016, XLC from 2019 - they enter when they exist)
    nsec = mom.notna().sum(axis=1)
    ranks = mom.rank(axis=1)                        # 1 = worst .. nsec = best

    longs = ranks.sub(nsec, axis=0).ge(-(TOP_N - 1)).astype(float)   # top 3
    shorts = ranks.le(TOP_N).astype(float)                           # bottom 3
    valid = nsec >= 2 * TOP_N
    longs, shorts = longs[valid].fillna(0), shorts[valid].fillna(0)

    w = longs.div(longs.sum(axis=1), axis=0) - shorts.div(shorts.sum(axis=1), axis=0)
    w = w.reindex(mret.index).dropna(how="all")

    # weights chosen at t earn returns at t+1 - the single explicit lag
    port = (w.shift(1) * mret).sum(axis=1)[w.index[1]:]
    turnover = w.diff().abs().sum(axis=1) / 2       # one-way, per side of book
    net10 = port - (turnover * COST_BP / 1e4 * 2).shift(1)[port.index]
    net20 = port - (turnover * COST_BP_HI / 1e4 * 2).shift(1)[port.index]

    stats = {k: book_stats(v) for k, v in
             {"gross": port, "net10": net10, "net20": net20}.items()}
    avg_turn = float(turnover.mean())

    # ---- rank bar chart: average next-month return by momentum rank ---------
    pctrank = (ranks.sub(1)).div(nsec - 1, axis=0).loc[valid[valid].index]
    binidx = (pctrank * (N_RANK_BINS - 1)).round()
    fwd = mret.shift(-1)
    stacked = pd.DataFrame({
        "bin": binidx.stack(), "fwd": fwd.stack().reindex(binidx.stack().index),
    }).dropna()
    rank_avg = stacked.groupby("bin")["fwd"].mean() * 100   # % per month

    # ---- equity curves -------------------------------------------------------
    eq_gross = (1 + port.fillna(0)).cumprod()
    eq_net = (1 + net10.fillna(0)).cumprod()
    worst_i = net10.idxmin()

    payload = {
        "params": {
            "start": str(port.index[0].date()), "end": str(port.index[-1].date()),
            "nMonths": int(len(port)), "topN": TOP_N,
            "costBp": COST_BP, "costBpHi": COST_BP_HI,
            "sectors": list(px.columns),
        },
        "rankBars": {
            "labels": [f"{i + 1}" for i in range(N_RANK_BINS)],
            "values": r(list(rank_avg.reindex(range(N_RANK_BINS)).values), 3),
        },
        "equity": {
            "gross": downsample(eq_gross.values, 240),
            "net": downsample(eq_net.values, 240),
            "xLabels": [[f, l] for f, l in year_labels(port.index, 3)],
        },
        "stats": {
            k: {kk: r(vv, 4) for kk, vv in v.items()} for k, v in stats.items()
        },
        "turnoverMo": r(avg_turn, 4),
        "worstMonth": {"date": str(worst_i.date()), "net": r(float(net10.loc[worst_i]), 4)},
        "hitRate": r(float((net10.dropna() > 0).mean()), 4),
    }
    ts = write_ts(SLUG, payload)

    cells = [
        md(f"""# Momentum, honestly backtested

**pyportfolios.com research** · 11 SPDR sector ETFs, Jan 2005 – Dec 2024 · NumPy · Pandas · Matplotlib · yfinance

A 12-1 cross-sectional momentum book on the S&P sector universe with every
look-ahead gap closed:

1. rank each month-end on the trailing **t-12..t-2** compounded return (skip the last month),
2. long the top {TOP_N} sectors / short the bottom {TOP_N}, equal-weighted, dollar-neutral,
3. lag the weights exactly once, and
4. charge {COST_BP} bp (and {COST_BP_HI} bp) on every unit of traded notional.

Real data, real costs — the point of the exercise is what survives them."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf

plt.rcParams["figure.figsize"] = (10, 5)
TOP_N, COST_BP = 3, 10"""),
        md("""## 1 · Data: the 11 SPDR sector ETFs

XLRE and XLC launch mid-sample (2015 / 2018). We keep them: a sector enters the
rankable universe only once it has a full 12-month history — the point-in-time
discipline the article insists on."""),
        code("""tickers = ["XLB", "XLC", "XLE", "XLF", "XLI", "XLK", "XLP", "XLRE", "XLU", "XLV", "XLY"]
px = yf.download(tickers, start="2005-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"]
mret = px.resample("ME").last().pct_change()
mret.tail(3).round(4)"""),
        md("""## 2 · The 12-1 signal with the skip made explicit

`rolling(11)` compounds months `t-10..t`; the `.shift(1)` moves the window to
`t-11..t-1` so the most recent month is skipped (short-term reversal pollutes it).
Relative to the month we actually hold, that window is lags 2..12 — the classic 12-1."""),
        code("""mom = ((1 + mret).rolling(11).apply(np.prod, raw=True) - 1).shift(1)

nsec  = mom.notna().sum(axis=1)          # point-in-time universe size
ranks = mom.rank(axis=1)                 # 1 = worst .. nsec = best"""),
        md("""## 3 · The book: long top 3, short bottom 3, one explicit lag

Weights formed at month-end `t` earn returns over `t+1`. The single `.shift(1)`
below is the whole anti-look-ahead discipline."""),
        code("""longs  = ranks.sub(nsec, axis=0).ge(-(TOP_N - 1)).astype(float)
shorts = ranks.le(TOP_N).astype(float)
valid  = nsec >= 2 * TOP_N
longs, shorts = longs[valid].fillna(0), shorts[valid].fillna(0)

w = longs.div(longs.sum(axis=1), axis=0) - shorts.div(shorts.sum(axis=1), axis=0)
w = w.reindex(mret.index).dropna(how="all")

port = (w.shift(1) * mret).sum(axis=1)[w.index[1]:]     # weights at t earn t+1
turnover = w.diff().abs().sum(axis=1) / 2               # one-way, per side
net = port - (turnover * COST_BP / 1e4 * 2).shift(1)[port.index]

def sharpe(x): return np.sqrt(12) * x.mean() / x.std(ddof=1)
print(f"gross Sharpe {sharpe(port.dropna()):.2f}   net Sharpe {sharpe(net.dropna()):.2f}")
print(f"avg monthly one-way turnover {turnover.mean():.0%}")"""),
        md("""## 4 · The rank spread — the momentum signature

Average next-month return by momentum rank. On real sectors it is noisier than
the textbook decile chart (11 names, not 3,000 stocks) but the winners-minus-losers
tilt is visible — and it was earned without touching future data."""),
        code("""pctrank = ranks.sub(1).div(nsec - 1, axis=0)
binidx  = (pctrank * 10).round()
stacked = pd.DataFrame({"bin": binidx.stack(),
                        "fwd": mret.shift(-1).stack().reindex(binidx.stack().index)}).dropna()
rank_avg = stacked.groupby("bin")["fwd"].mean() * 100

plt.bar(rank_avg.index + 1, rank_avg.values,
        color=["#4a4a42"] * 8 + ["#0a8a8a"] * 3)
plt.title("Average next-month return by momentum rank (1 = losers)")
plt.xlabel("rank bin"); plt.ylabel("% / month");"""),
        md("""## 5 · Equity, costs, and the crash

Momentum's dark side is visible in the equity curve: the book compounds slowly
and then gets hit in sharp rebounds (2009, 2020), when the shorted losers rip
higher. Costs shave the rest."""),
        code("""net20 = port - (turnover * 20 / 1e4 * 2).shift(1)[port.index]

for label, ret in [("gross", port), ("net 10bp", net), ("net 20bp", net20)]:
    eq = (1 + ret.fillna(0)).cumprod()
    yrs = len(ret.dropna()) / 12
    cagr = eq.iloc[-1] ** (1 / yrs) - 1
    mdd = (eq / eq.cummax() - 1).min()
    print(f"{label:>9}: CAGR {cagr:6.2%}  vol {ret.std()*np.sqrt(12):6.2%}  "
          f"Sharpe {sharpe(ret.dropna()):5.2f}  maxDD {mdd:6.1%}")

(1 + port.fillna(0)).cumprod().plot(label="gross")
(1 + net.fillna(0)).cumprod().plot(label="net 10bp")
plt.legend(); plt.title("12-1 sector momentum, long-short equity");"""),
        md(f"""## Takeaways

- The 12-1 sector book is real but thin: the spread survives {COST_BP} bp costs
  with a visibly lower Sharpe, and {COST_BP_HI} bp takes another bite.
- The worst month is a *momentum crash* — a violent rebound month where the
  short book of beaten-down sectors rips higher.
- Every number here is out-of-sample in the only sense that matters: signals
  use information through `t`, returns accrue at `t+1`, the universe is
  point-in-time.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    for k, v in stats.items():
        print(f"{k:>6}: CAGR {v['annRet']:.4f} vol {v['annVol']:.4f} "
              f"sharpe {v['sharpe']:.2f} maxDD {v['maxDD']:.4f}")
    print(f"turnover/mo {avg_turn:.4f}  hit {payload['hitRate']}  "
          f"worst {payload['worstMonth']}")
    print("rank bars:", payload["rankBars"]["values"])


if __name__ == "__main__":
    main()
