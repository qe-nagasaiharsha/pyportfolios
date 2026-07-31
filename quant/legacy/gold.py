"""
Legacy upgrade - RN "Gold through war and inflation".
Assets: GLD, SPY, TIP, IEF daily · Timeframe: Nov 2004 (GLD inception) - Dec 2024.

Self-caches quant/data/legacy_gold.csv (downloaded once via yfinance, same
format as fetch_data.py caches), then computes every number in the article:

  - GLD vs TIP (the tradable inverse-real-yield proxy): monthly beta / corr / R^2
  - inflation-regime table using a TIP-minus-IEF breakeven proxy crossed with
    the direction of real yields (TIP up = real yields falling)
  - event study: GLD normalised to 100 at the 2008 GFC (Lehman), 2020 COVID and
    2022 Ukraine-invasion onsets, -10 to +60 trading days
  - 252d rolling correlation of GLD vs SPY daily returns + full-sample stats

Emits the article data module + the runnable (self-downloading) notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import DATA, code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "gold-war-and-inflation"
SEED = 42  # convention; nothing stochastic here

DATASET = "legacy_gold"
TICKERS = ["GLD", "SPY", "TIP", "IEF"]
START, END = "2004-11-18", "2025-01-01"   # GLD inception -> through Dec 2024

EVENTS = [
    ("gfc", "2008-09-15", "2008 GFC — Lehman Brothers files"),
    ("covid", "2020-02-19", "2020 COVID — pre-crash equity peak"),
    ("ukraine", "2022-02-24", "2022 — Russia invades Ukraine"),
]
PRE, POST = 10, 60


def ensure_cache() -> None:
    out = DATA / f"{DATASET}.csv"
    if out.exists():
        return
    import yfinance as yf

    df = yf.download(TICKERS, start=START, end=END, auto_adjust=True, progress=False)
    close = df["Close"][TICKERS].dropna(how="all")
    close.to_csv(out)
    print(f"cached -> {out}  rows={len(close)}")


def event_window(px: pd.Series, date: str) -> pd.Series:
    """GLD rebased to 100 at the event date, -PRE..+POST trading days."""
    i = int(px.index.searchsorted(pd.Timestamp(date)))
    win = px.iloc[i - PRE: i + POST + 1]
    return 100 * win / px.iloc[i]


def main() -> None:
    ensure_cache()
    df = load(DATASET).dropna()
    gld, spy, tip, ief = df["GLD"], df["SPY"], df["TIP"], df["IEF"]

    # --- monthly returns: gold vs the TIP real-yield proxy -------------------
    mth = df.resample("ME").last()
    mret = np.log(mth / mth.shift(1)).dropna()
    g, t = mret["GLD"], mret["TIP"]
    slope, intercept = (float(v) for v in np.polyfit(t, g, 1))
    beta = slope
    corr = float(g.corr(t))
    r2 = corr**2
    # scatter (monthly returns, in %) + fitted line endpoints for the chart
    scatter_xy = [[r(float(x) * 100, 2), r(float(y) * 100, 2)] for x, y in zip(t, g)]
    fit_xy = [[r(float(x) * 100, 2), r((slope * float(x) + intercept) * 100, 2)]
              for x in (t.min(), t.max())]

    # --- inflation regimes ----------------------------------------------------
    # breakeven proxy: trailing-12m TIP-minus-IEF relative return (rising =
    # inflation expectations rising); real-yield direction: TIP monthly return.
    be = (mret["TIP"] - mret["IEF"]).rolling(12).sum().dropna()
    ga = g.loc[be.index]
    ta = t.loc[be.index]
    hi = be > be.median()
    fall = ta > 0
    buckets = {
        "hiFall": ga[hi & fall], "hiRise": ga[hi & ~fall], "low": ga[~hi],
    }
    regimes = {
        k: {"annRet": r(float(v.mean() * 12)), "n": int(len(v))} for k, v in buckets.items()
    }

    # --- event study ------------------------------------------------------------
    ev_payload: dict[str, object] = {}
    ev_rows = []
    for key, date, label in EVENTS:
        w = event_window(gld, date)
        ev_payload[key] = downsample(w.values, 260)
        v = w.values
        ev_rows.append({
            "label": label, "date": date,
            "d5": r(float(v[PRE + 5] / 100 - 1)),
            "d20": r(float(v[PRE + 20] / 100 - 1)),
            "d60": r(float(v[PRE + 60] / 100 - 1)),
            "peak20": r(float(v[PRE: PRE + 21].max() / 100 - 1)),
        })
    ev_xlabels = [[0.0, "-10d"], [PRE / (PRE + POST), "0"],
                  [(PRE + 20) / (PRE + POST), "+20d"],
                  [(PRE + 40) / (PRE + POST), "+40d"], [1.0, "+60d"]]

    # --- rolling correlation with SPY -------------------------------------------
    dret = np.log(df / df.shift(1)).dropna()
    rc = dret["GLD"].rolling(252).corr(dret["SPY"]).dropna()

    # --- full-sample stats --------------------------------------------------------
    years = (gld.index[-1] - gld.index[0]).days / 365.25
    total = float(gld.iloc[-1] / gld.iloc[0])
    cagr = total ** (1 / years) - 1
    vol = float(dret["GLD"].std(ddof=1) * np.sqrt(252))
    spy_total = float(spy.iloc[-1] / spy.iloc[0])
    spy_cagr = spy_total ** (1 / years) - 1

    payload = {
        "params": {
            "start": str(df.index[0].date()), "end": str(df.index[-1].date()),
            "nObs": int(len(df)), "nMonths": int(len(mret)), "seed": SEED,
        },
        "history": {
            "y": downsample(gld.values, 240),
            "xLabels": [[f, l] for f, l in year_labels(gld.index, 4)],
        },
        "proxy": {
            "scatter": scatter_xy,
            "fit": fit_xy,
            "beta": r(beta, 2), "corr": r(corr, 2), "r2": r(r2, 2),
        },
        "regimes": regimes,
        "events": {
            "series": ev_payload, "rows": ev_rows, "xLabels": ev_xlabels,
        },
        "rollCorr": {
            "y": downsample(rc.values, 240),
            "xLabels": [[f, l] for f, l in year_labels(rc.index, 4)],
            "mean": r(float(rc.mean()), 2), "min": r(float(rc.min()), 2),
            "max": r(float(rc.max()), 2),
        },
        "stats": {
            "years": r(years, 1), "total": r(total, 2), "cagr": r(cagr),
            "vol": r(vol), "spyCagr": r(spy_cagr),
            "corrFull": r(float(dret["GLD"].corr(dret["SPY"])), 2),
        },
    }
    ts_path = write_ts(SLUG, payload)

    # ------------------------------------------------------------------ notebook --
    cells = [
        md("""# Gold through war and inflation

**pyportfolios.com research note** · GLD, SPY, TIP, IEF daily, Nov 2004 – Dec 2024 · NumPy · pandas · matplotlib · yfinance

An empirical read of the two stories gold is sold on — the inflation hedge and the
crisis hedge. We test three things on twenty years of real data:

1. gold versus the **real yield** (proxied by the TIP ETF, whose price moves inversely
   to 10y real yields),
2. gold's return across **inflation regimes** (a TIP-minus-IEF breakeven proxy), and
3. an **event study** around the 2008 GFC, the 2020 COVID shock and the 2022 invasion
   of Ukraine."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf

plt.rcParams["figure.figsize"] = (10, 5)"""),
        md("""## 1 · Data: GLD, SPY, TIP, IEF

GLD from its November 2004 inception. TIP (10y-ish TIPS ETF) is the tradable inverse
of the real yield; IEF (7–10y nominal Treasuries) lets us difference out a breakeven
proxy."""),
        code("""px = yf.download(["GLD", "SPY", "TIP", "IEF"], start="2004-11-18", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"].dropna()
(100 * px / px.iloc[0])[["GLD", "TIP"]].plot(
    title="GLD vs TIP (inverse real-yield proxy), rebased to 100");"""),
        md("""## 2 · Gold tracks real yields

Gold pays no coupon, so its opportunity cost is the real yield. TIP's price rises when
real yields fall — so if the real-yield story is right, monthly gold returns should be
strongly *positively* related to TIP returns."""),
        code("""mret = np.log(px.resample("ME").last()).diff().dropna()
g, t = mret["GLD"], mret["TIP"]

beta = np.polyfit(t, g, 1)[0]
corr = g.corr(t)
print(f"beta (gold on TIP)  {beta:.2f}")
print(f"corr                {corr:.2f}   R^2 {corr**2:.2f}")
plt.scatter(t, g, s=8, alpha=0.5)
grid = np.linspace(t.min(), t.max(), 50)
plt.plot(grid, np.polyfit(t, g, 1) @ [grid, np.ones_like(grid)], "r")
plt.xlabel("TIP monthly log return (real yields falling ->)")
plt.ylabel("GLD monthly log return");"""),
        md("""## 3 · The inflation hedge is conditional

Proxy inflation expectations by the trailing-12m TIP-minus-IEF relative return (a
tradable breakeven). Split months into high/low inflation-expectation regimes, then
split the high-inflation months by whether real yields were falling (TIP up) or
rising. Gold's celebrated hedge should only show up in one cell."""),
        code("""be = (mret["TIP"] - mret["IEF"]).rolling(12).sum().dropna()
g_al, t_al = g.loc[be.index], t.loc[be.index]
hi, fall = be > be.median(), t_al > 0

for name, sel in [("high infl, falling real yields", hi & fall),
                  ("high infl, rising real yields",  hi & ~fall),
                  ("low / stable inflation",         ~hi)]:
    print(f"{name:32s} n={sel.sum():3d}  gold {g_al[sel].mean()*12:+.1%} ann.")"""),
        md("""## 4 · What war (and crisis) adds

Event study: rebase GLD to 100 at each shock onset and trace -10 to +60 trading days.
Lehman (2008-09-15), the COVID equity peak (2020-02-19), the invasion of Ukraine
(2022-02-24)."""),
        code("""events = {"GFC / Lehman": "2008-09-15",
          "COVID": "2020-02-19",
          "Ukraine": "2022-02-24"}
gld = px["GLD"]

for name, d0 in events.items():
    i = gld.index.searchsorted(pd.Timestamp(d0))
    w = 100 * gld.iloc[i-10:i+61] / gld.iloc[i]
    plt.plot(range(-10, len(w)-10), w.values, label=name)
    print(f"{name:14s} +5d {w.iloc[15]/100-1:+.1%}  +20d {w.iloc[30]/100-1:+.1%}"
          f"  +60d {w.iloc[70]/100-1:+.1%}")
plt.axvline(0, color="k", lw=0.7); plt.axhline(100, color="k", lw=0.5)
plt.legend(); plt.title("GLD around shock onsets (=100 at event date)")
plt.xlabel("trading days from event");"""),
        md("""## 5 · Diversifier, not doomsday insurance

The rolling one-year correlation of daily gold and equity returns hovers near zero —
that, not a guaranteed crisis payoff, is the durable portfolio property."""),
        code("""dret = np.log(px).diff().dropna()
rc = dret["GLD"].rolling(252).corr(dret["SPY"]).dropna()
rc.plot(title="GLD vs SPY, 252d rolling correlation")
plt.axhline(0, color="k", lw=0.7)
print(f"mean {rc.mean():+.2f}   range [{rc.min():+.2f}, {rc.max():+.2f}]")

years = (px.index[-1] - px.index[0]).days / 365.25
print(f"GLD CAGR {(px['GLD'].iloc[-1]/px['GLD'].iloc[0])**(1/years)-1:.1%}"
      f"   SPY CAGR {(px['SPY'].iloc[-1]/px['SPY'].iloc[0])**(1/years)-1:.1%}")"""),
        md("""## Takeaways

- Gold's strongest empirical relationship is with the **real yield** (via TIP), not
  headline inflation.
- The inflation hedge is **regime-dependent**: it pays when inflation expectations are
  high *and* real yields are falling, and disappoints when central banks push real
  yields up.
- The conflict/crisis premium is real but **transient** — a fast bid measured in days
  to weeks, then real-yield dynamics reassert control.
- The durable allocation case is the ~zero equity correlation, i.e. diversification —
  not a set-and-forget insurance policy.

*© pyportfolios.com — runnable companion to the research note. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)

    print(f"ts  -> {ts_path}")
    print(f"nb  -> {nb_path}")
    print(f"beta={beta:.2f} corr={corr:.2f} r2={r2:.2f}")
    print("regimes:", {k: v["annRet"] for k, v in regimes.items()})
    print("events:", [(e["label"][:12], e["d5"], e["d20"], e["d60"]) for e in ev_rows])
    print(f"rollcorr mean={payload['rollCorr']['mean']} cagr={cagr:.3f} vol={vol:.3f}")


if __name__ == "__main__":
    main()
