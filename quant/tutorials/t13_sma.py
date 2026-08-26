"""
T13 - SMA Crossover Backtest (topic card 13/16).
Assets: QQQ + BTC-USD · Timeframe: Jan 2015 - Dec 2024 · Libs: vectorbt Pandas Pyfolio.

The systematic trend-following workhorse — and backtesting discipline 101.
Computes the 50/200 golden-cross backtest (long-or-flat, next-day execution,
10bp per-side costs) per asset, the fast x slow Sharpe parameter grid, and a
costs-sensitivity table, then emits the article data module + the notebook.

The simulation core is plain pandas/numpy (position = signal.shift(1)) because
it is transparent and auditable; vectorbt 1.x (Portfolio.from_signals) is used
as an independent cross-check of the fills — final value, max drawdown and
trade count must agree. Stats are annualised per asset (252d QQQ, 365d BTC)
rather than through vectorbt's freq machinery, whose year convention differs.

   NOTE — the markdown cells below are NOT what ships. Since 26 Aug the
   notebook's prose is replaced with the article's own words by
   quant/sync_notebook_prose.py, so the download reads exactly like the page.
   Re-running this script rewrites the notebook from the md() cells here and
   undoes that; run the sync again afterwards.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import vectorbt as vbt

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "sma-crossover-backtest"
FAST, SLOW = 50, 200
FEE = 0.001          # 10bp per side
WARMUP = 250         # bars reserved for SMA warm-up — same for every grid cell
FASTS = [10, 20, 50, 100]
SLOWS = [100, 150, 200, 250]
SENTINEL = -9.99     # grid cell where fast >= slow (no valid crossover system)


def strategy_returns(px: pd.Series, fast: int, slow: int, fee: float) -> pd.Series:
    """Long-or-flat SMA crossover, next-day execution, per-side costs."""
    signal = (px.rolling(fast).mean() > px.rolling(slow).mean()).astype(float)
    position = signal.shift(1).fillna(0.0)          # <- the whole game: no lookahead
    ret = px.pct_change().fillna(0.0)
    cost = position.diff().abs().fillna(0.0) * fee  # pay on every position change
    return (position * ret - cost).iloc[WARMUP:], position.iloc[WARMUP:]


def perf(rets: pd.Series, ann: int) -> dict:
    eq = (1.0 + rets).cumprod()
    yrs = len(rets) / ann
    dd = eq / eq.cummax() - 1.0
    sd = rets.std(ddof=1)
    return {
        "annRet": r(float(eq.iloc[-1] ** (1.0 / yrs) - 1.0)),
        "annVol": r(float(sd * np.sqrt(ann))),
        "sharpe": r(float(rets.mean() / sd * np.sqrt(ann)), 2),
        "maxDD": r(float(dd.min())),
        "final": r(float(100.0 * eq.iloc[-1]), 2),
    }


def sharpe(rets: pd.Series, ann: int) -> float:
    sd = rets.std(ddof=1)
    return 0.0 if sd == 0 else float(rets.mean() / sd * np.sqrt(ann))


def vbt_check(px: pd.Series, name: str) -> dict:
    """Independent fill check via vectorbt Portfolio.from_signals."""
    sig = px.rolling(FAST).mean() > px.rolling(SLOW).mean()
    prev = sig.shift(1).fillna(False)
    entries = (sig & ~prev).iloc[WARMUP:].copy()
    exits = (~sig & prev).iloc[WARMUP:].copy()
    if bool(sig.iloc[WARMUP - 1]):
        entries.iloc[0] = True  # carry the already-open position into the window
    pf = vbt.Portfolio.from_signals(
        px.iloc[WARMUP:], entries, exits, fees=FEE, init_cash=100, freq="1D",
    )
    out = {
        "final": float(pf.final_value()), "maxDD": float(pf.max_drawdown()),
        "trades": int(pf.trades.count()),
    }
    print(f"vbt check {name}: final={out['final']:.2f} maxDD={out['maxDD']:.4f} trades={out['trades']}")
    return out


def asset_block(px: pd.Series, ann: int, name: str) -> dict:
    strat, pos = strategy_returns(px, FAST, SLOW, FEE)
    bh = px.pct_change().fillna(0.0).iloc[WARMUP:]

    stats_s = perf(strat, ann)
    stats_b = perf(bh, ann)
    entries = int((pos.diff() > 0).sum() + (pos.iloc[0] > 0))
    stats_s["trades"] = entries
    stats_s["timeInMkt"] = r(float(pos.mean()), 3)
    stats_b["trades"] = 1
    stats_b["timeInMkt"] = 1.0

    # sanity: pandas core vs vectorbt fills must agree
    chk = vbt_check(px, name)
    assert abs(chk["final"] - stats_s["final"]) / stats_s["final"] < 0.02, name
    assert abs(chk["maxDD"] - stats_s["maxDD"]) < 0.005, name
    assert chk["trades"] == entries, name

    eq_s = (1.0 + strat).cumprod() * 100.0
    eq_b = (1.0 + bh).cumprod() * 100.0

    grid = []
    for f in FASTS:
        row = []
        for s in SLOWS:
            if f >= s:
                row.append(SENTINEL)
            else:
                row.append(r(sharpe(strategy_returns(px, f, s, FEE)[0], ann), 2))
        grid.append(row)

    costs = []
    for f, s in ((FAST, SLOW), (10, 100)):
        row = {"pair": f"{f}/{s}"}
        for fee, key in ((0.0, "s0"), (0.001, "s10"), (0.0025, "s25")):
            rets, p = strategy_returns(px, f, s, fee)
            row[key] = r(sharpe(rets, ann), 2)
            if fee == 0.001:
                row["trades"] = int((p.diff() > 0).sum() + (p.iloc[0] > 0))
                row["final10"] = r(float(100.0 * (1.0 + rets).prod()), 0)
        costs.append(row)

    valid = [v for row in grid for v in row if v != SENTINEL]
    return {
        "start": str(strat.index[0].date()), "end": str(strat.index[-1].date()),
        "nBars": int(len(strat)),
        "stats": {"strategy": stats_s, "buyhold": stats_b},
        "eqLog": {
            "strategy": downsample(np.log10(eq_s.values), 240),
            "buyhold": downsample(np.log10(eq_b.values), 240),
            "xLabels": [[f, l] for f, l in year_labels(strat.index, 2)],
        },
        "grid": grid,
        "gridAboveBH": int(sum(v > stats_b["sharpe"] for v in valid)),
        "gridCells": len(valid),
        "gridBest": r(max(valid), 2), "gridWorst": r(min(valid), 2),
        "costs": costs,
    }


def main() -> None:
    df = load("t13_sma")
    # BTC trades 7 days a week; QQQ only on exchange days -> per-asset dropna,
    # each asset backtested on its own calendar with its own annualisation.
    qqq = df["QQQ"].dropna()
    btc = df["BTC-USD"].dropna()

    blk_q = asset_block(qqq, 252, "QQQ")
    blk_b = asset_block(btc, 365, "BTC-USD")

    all_valid = [v for blk in (blk_q, blk_b) for row in blk["grid"] for v in row if v != SENTINEL]

    payload = {
        "params": {
            "fast": FAST, "slow": SLOW, "feeBp": 10, "warmupBars": WARMUP,
            "fasts": FASTS, "slows": SLOWS, "sentinel": SENTINEL,
            "annQQQ": 252, "annBTC": 365,
            "gridLo": r(min(all_valid), 2), "gridHi": r(max(all_valid), 2),
        },
        "qqq": blk_q,
        "btc": blk_b,
    }
    ts = write_ts(SLUG, payload)

    sq, bq = blk_q["stats"]["strategy"], blk_q["stats"]["buyhold"]
    sb, bb = blk_b["stats"]["strategy"], blk_b["stats"]["buyhold"]

    cells = [
        md(f"""# SMA Crossover Backtest

**pyportfolios.com tutorial T13** · QQQ + BTC-USD, Jan 2015 – Dec 2024 · vectorbt · Pandas · Pyfolio

The 50/200 moving-average crossover — the "golden cross" — is the systematic
trend-following workhorse: one rule, two parameters, centuries of folklore.
It is also the perfect vehicle for **backtesting discipline 101**. In this notebook we

1. build the long-or-flat crossover with **next-day execution** (no lookahead),
2. charge 10bp per side and compare against buy-and-hold on QQQ and BTC-USD,
3. sweep a {len(FASTS)}×{len(SLOWS)} parameter grid to see how fragile the "edge" is per asset, and
4. stress the costs assumption (0 / 10 / 25bp).

The punchline: the *same rule* gets two different verdicts on two assets —
trend behaves differently per asset."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
import vectorbt as vbt

plt.rcParams["figure.figsize"] = (10, 5)"""),
        md("""## 1 · Data: QQQ and BTC-USD closes

Ten years, two very different animals: the Nasdaq-100 ETF (exchange calendar,
~252 bars/year) and Bitcoin (trades every day, ~365 bars/year). BTC has prices
on weekends where QQQ has none, so we **dropna per column** and run each asset
on its own calendar — never forward-fill an exchange-traded asset over weekends
to match crypto, and never annualise both with the same 252."""),
        code("""raw = yf.download(["QQQ", "BTC-USD"], start="2015-01-01", end="2025-01-01",
                  auto_adjust=True, progress=False)["Close"]

qqq = raw["QQQ"].dropna()      # ~252 bars / year
btc = raw["BTC-USD"].dropna()  # ~365 bars / year
print(len(qqq), "QQQ bars ·", len(btc), "BTC bars")"""),
        md(f"""## 2 · The rule — and the lookahead trap

Signal: long when the {FAST}-day SMA is above the {SLOW}-day SMA, flat otherwise.

**The single most important line in this notebook is `shift(1)`.** The SMA
cross is computed on today's *close* — you cannot trade a close you have not
seen yet. Today's signal earns *tomorrow's* return. Skip the shift and you buy
every up-day one bar early: a lookahead bias that flatters almost any signal
and silently fabricates Sharpe. More backtests die of this one line than of
bad ideas.

We charge {FEE * 1e4:.0f}bp per side on every position change, and reserve the
first {WARMUP} bars of each asset for SMA warm-up so every parameter pair later
is judged on the *same* evaluation window."""),
        code(f"""FAST, SLOW, FEE, WARMUP = {FAST}, {SLOW}, {FEE}, {WARMUP}

def backtest(px, fast=FAST, slow=SLOW, fee=FEE):
    signal   = (px.rolling(fast).mean() > px.rolling(slow).mean()).astype(float)
    position = signal.shift(1).fillna(0.0)   # <- no lookahead. The whole game.
    ret      = px.pct_change().fillna(0.0)
    cost     = position.diff().abs().fillna(0.0) * fee
    strat    = position * ret - cost
    return strat.iloc[WARMUP:], position.iloc[WARMUP:]

def stats(rets, ann):
    eq = (1 + rets).cumprod()
    sh = rets.mean() / rets.std(ddof=1) * np.sqrt(ann)
    return {{"annRet": eq.iloc[-1] ** (ann / len(rets)) - 1,
            "annVol": rets.std(ddof=1) * np.sqrt(ann),
            "sharpe": sh,
            "maxDD": (eq / eq.cummax() - 1).min()}}"""),
        md("""## 3 · Equity curves vs buy-and-hold

Growth of $100 (log scale — BTC would render every other line invisible
otherwise). Watch *where* the strategy line detaches from buy-and-hold: it is
always in the big drawdowns. Trend following is not an accelerator; it is a
brake pedal."""),
        code("""fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))
for ax, (name, px, ann) in zip(axes, [("QQQ", qqq, 252), ("BTC-USD", btc, 365)]):
    strat, pos = backtest(px)
    bh = px.pct_change().fillna(0.0).iloc[WARMUP:]
    (100 * (1 + strat).cumprod()).plot(ax=ax, label="50/200 crossover")
    (100 * (1 + bh).cumprod()).plot(ax=ax, label="buy & hold", alpha=0.7)
    ax.set_yscale("log"); ax.set_title(name); ax.legend()

    s, b = stats(strat, ann), stats(bh, ann)
    n_tr = int((pos.diff() > 0).sum() + (pos.iloc[0] > 0))
    print(f"{name:8s} strat: Sharpe {s['sharpe']:.2f} maxDD {s['maxDD']:+.1%} "
          f"({n_tr} trades, {pos.mean():.0%} in market)  |  "
          f"b&h: Sharpe {b['sharpe']:.2f} maxDD {b['maxDD']:+.1%}")
plt.show()
"""),
        md(f"""Numbers to expect (deterministic — this is all closed historical data):

| | ann ret | Sharpe | maxDD | trades | time in mkt |
|---|---|---|---|---|---|
| QQQ 50/200 | {sq['annRet']:.1%} | {sq['sharpe']:.2f} | {sq['maxDD']:.1%} | {sq['trades']} | {sq['timeInMkt']:.0%} |
| QQQ buy-hold | {bq['annRet']:.1%} | {bq['sharpe']:.2f} | {bq['maxDD']:.1%} | — | 100% |
| BTC 50/200 | {sb['annRet']:.1%} | {sb['sharpe']:.2f} | {sb['maxDD']:.1%} | {sb['trades']} | {sb['timeInMkt']:.0%} |
| BTC buy-hold | {bb['annRet']:.1%} | {bb['sharpe']:.2f} | {bb['maxDD']:.1%} | — | 100% |

On QQQ the crossover roughly matches buy-and-hold's Sharpe while cutting the
max drawdown from {bq['maxDD']:.0%} to {sq['maxDD']:.0%}. On BTC it keeps pace
with a monster bull market while sidestepping the worst of the {bb['maxDD']:.0%}
crashes. Neither is a money machine; both are drawdown insurance."""),
        md("""## 4 · Cross-check the fills with vectorbt

Any hand-rolled backtest loop deserves an independent referee. We rebuild the
same trades with `vectorbt`'s `Portfolio.from_signals` — same entry/exit bars,
same fees — and require the final value, max drawdown and trade count to
match. (We keep the *stats* in pandas: vectorbt's Sharpe annualises with its
own year convention, and we want explicit 252 vs 365 per asset.)"""),
        code("""for name, px in [("QQQ", qqq), ("BTC-USD", btc)]:
    sig  = px.rolling(FAST).mean() > px.rolling(SLOW).mean()
    prev = sig.shift(1).fillna(False)
    entries = (sig & ~prev).iloc[WARMUP:].copy()
    exits   = (~sig & prev).iloc[WARMUP:].copy()
    if bool(sig.iloc[WARMUP - 1]):
        entries.iloc[0] = True   # carry the already-open position into the window
    pf = vbt.Portfolio.from_signals(px.iloc[WARMUP:], entries, exits,
                                    fees=FEE, init_cash=100, freq="1D")
    print(f"{name:8s} vectorbt: final ${pf.final_value():,.0f}  "
          f"maxDD {pf.max_drawdown():+.1%}  trades {pf.trades.count()}")"""),
        md("""And a second referee for the *stats*: pyfolio's `perf_stats` on the QQQ
strategy returns. pyfolio hard-codes a 252-day year, so it is only valid for
the exchange-calendar asset — for BTC's 365-day calendar, keep the explicit
pandas stats above."""),
        code("""from pyfolio import timeseries

strat_q, _ = backtest(qqq)
timeseries.perf_stats(strat_q).loc[["Annual return", "Annual volatility",
                                    "Sharpe ratio", "Max drawdown"]]"""),
        md(f"""## 5 · Discipline 101: the parameter grid

One backtest is an anecdote. Before believing 50/200, ask: *does the
neighbourhood agree?* We sweep fast ∈ {{{', '.join(map(str, FASTS))}}} ×
slow ∈ {{{', '.join(map(str, SLOWS))}}} and heat-map the Sharpe of each pair —
{blk_q['gridCells']} valid systems per asset, all with identical execution and costs."""),
        code("""FASTS, SLOWS = [10, 20, 50, 100], [100, 150, 200, 250]

def sharpe_grid(px, ann):
    g = np.full((len(FASTS), len(SLOWS)), np.nan)
    for i, f in enumerate(FASTS):
        for j, s in enumerate(SLOWS):
            if f >= s:
                continue
            rets, _ = backtest(px, f, s)
            g[i, j] = rets.mean() / rets.std(ddof=1) * np.sqrt(ann)
    return g

fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))
for ax, (name, px, ann) in zip(axes, [("QQQ", qqq, 252), ("BTC-USD", btc, 365)]):
    g = sharpe_grid(px, ann)
    bh = px.pct_change().fillna(0.0).iloc[WARMUP:]
    bh_sh = bh.mean() / bh.std(ddof=1) * np.sqrt(ann)
    im = ax.imshow(g, cmap="RdYlGn", vmin=0.6, vmax=1.5)
    for i in range(len(FASTS)):
        for j in range(len(SLOWS)):
            if not np.isnan(g[i, j]):
                ax.text(j, i, f"{g[i, j]:.2f}", ha="center", va="center", fontsize=9)
    ax.set_xticks(range(len(SLOWS)), SLOWS); ax.set_yticks(range(len(FASTS)), FASTS)
    ax.set_xlabel("slow"); ax.set_ylabel("fast")
    ax.set_title(f"{name} — Sharpe (buy-hold = {bh_sh:.2f})")
plt.colorbar(im, ax=axes, shrink=0.8);
plt.show()
"""),
        md(f"""Read the two grids side by side — this is the card's thesis in one picture:

- **QQQ**: every cell lands between {blk_q['gridWorst']:.2f} and {blk_q['gridBest']:.2f},
  straddling buy-and-hold's {bq['sharpe']:.2f}. Only {blk_q['gridAboveBH']} of
  {blk_q['gridCells']} cells beat it, none decisively. Picking the best cell after
  the fact and calling it edge is selection bias, not alpha.
- **BTC**: {blk_b['gridAboveBH']} of {blk_b['gridCells']} cells sit at or above
  buy-and-hold's {bb['sharpe']:.2f}, and *every* cell slashes the max drawdown.
  The trend signal genuinely earned its keep here — the asset trends harder and
  crashes harder.

Same rule, same decade, two verdicts. **Trend behaves differently per asset.**"""),
        md("""## 6 · Costs sensitivity: 0 / 10 / 25 bp

The 50/200 pair trades a handful of times a decade, so costs barely dent it.
Speed the system up (10/100) and the cost line starts to matter. Slow trend
systems are cheap to run; fast ones must clear a real hurdle."""),
        code("""rows = []
for name, px, ann in [("QQQ", qqq, 252), ("BTC-USD", btc, 365)]:
    for f, s in [(50, 200), (10, 100)]:
        row = {"asset": name, "pair": f"{f}/{s}"}
        for bp in (0, 10, 25):
            rets, pos = backtest(px, f, s, fee=bp / 1e4)
            row[f"Sharpe@{bp}bp"] = round(rets.mean() / rets.std(ddof=1) * np.sqrt(ann), 2)
        row["trades"] = int((pos.diff() > 0).sum() + (pos.iloc[0] > 0))
        rows.append(row)
pd.DataFrame(rows).set_index(["asset", "pair"])"""),
        md(f"""## 7 · The in-sample warning

Everything above is **one ten-year sample, evaluated in-sample**. There is no
walk-forward, no out-of-sample holdout, no deflation for the {blk_q['gridCells']}
variants we just eyeballed per asset. 2015–2024 contains two of the strongest
trend decades either asset has ever printed — a regime gift the next decade
owes nobody. Before promoting any cell of that grid, run the honesty checklist
from our cross-sectional momentum article: point-in-time data, walk-forward
splits, costs at the pessimistic end, and a multiple-testing haircut on the
best-looking Sharpe.

## Takeaways

- `signal.shift(1)` is non-negotiable: trade the close *after* the signal, never the close *inside* it.
- On QQQ the crossover is regime insurance — buy-and-hold's Sharpe, ~{abs(sq['maxDD'] / bq['maxDD']):.0%} of its drawdown. On BTC it kept a {bb['sharpe']:.2f}-Sharpe bull market *and* cut the worst crash by a third.
- Judge the neighbourhood, not the cell: QQQ's grid says "no edge, decent brake"; BTC's says "the trend was real (in this sample)".
- Slow trend is nearly free to trade; fast trend pays a visible costs tax.
- One sample proves nothing. Walk-forward or it didn't happen.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    print(f"QQQ  strat sharpe={sq['sharpe']} bh={bq['sharpe']} maxDD {sq['maxDD']} vs {bq['maxDD']} trades={sq['trades']}")
    print(f"BTC  strat sharpe={sb['sharpe']} bh={bb['sharpe']} maxDD {sb['maxDD']} vs {bb['maxDD']} trades={sb['trades']}")
    print(f"grids: QQQ {blk_q['gridAboveBH']}/{blk_q['gridCells']} above bh (best {blk_q['gridBest']}, worst {blk_q['gridWorst']}) · "
          f"BTC {blk_b['gridAboveBH']}/{blk_b['gridCells']} (best {blk_b['gridBest']}, worst {blk_b['gridWorst']})")


if __name__ == "__main__":
    main()
