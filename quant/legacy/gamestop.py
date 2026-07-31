"""
Legacy upgrade - CS15 "Anatomy of a short squeeze: GameStop, 2021".
Assets: GME, XRT, ^VIX daily · Timeframe: Oct 2020 - Mar 2021 (cached cs15_gamestop.csv).

Real event study replacing the illustrative figures: exact closes/returns for the
squeeze dates, spillover into XRT (the ETF short-interest proxy) and ^VIX, the
marked-to-market P&L of a short held through the event, and the pre-event VaR
that was blind to all of it. Emits the article data module + runnable notebook.

NOTE - prices are split-adjusted (GME split 4-for-1 in July 2022), so the famous
$347.51 close on Jan 27 appears as $86.88. Returns are identical either way.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import norm

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts  # noqa: E402

SLUG = "gamestop-short-squeeze"
SEED = 42  # convention; nothing stochastic here

ANCHOR = "2020-12-31"          # year-end short entry for the P&L reconstruction
BAR_LO, BAR_HI = "2021-01-19", "2021-02-04"   # the squeeze fortnight bar chart

EVENTS = [
    ("2021-01-13", "First squeeze leg — SI/float goes mainstream"),
    ("2021-01-22", "Gamma loop engages; weekly calls roll ITM"),
    ("2021-01-25", "Intraday halts begin (volatility circuit breakers)"),
    ("2021-01-26", "Cohen tweet; shorts publicly capitulating"),
    ("2021-01-27", "Peak close — biggest single up-day of the event"),
    ("2021-01-28", "Brokers restrict buying; intraday high then collapse"),
    ("2021-02-01", "Restrictions linger; bid evaporates"),
    ("2021-02-02", "The collapse — worst single down-day"),
]

MONTH_NAMES = {1: "Jan", 2: "Feb", 3: "Mar", 10: "Oct", 11: "Nov", 12: "Dec"}


def month_labels(index: pd.DatetimeIndex) -> list[list]:
    """[fraction, 'Mon'] pairs at each month start inside the window."""
    n = len(index)
    out: list[list] = []
    seen: set[tuple[int, int]] = set()
    for i, d in enumerate(index):
        key = (d.year, d.month)
        if key not in seen:
            seen.add(key)
            out.append([round(i / max(n - 1, 1), 4), MONTH_NAMES[d.month]])
    return out


def call_delta(S: float, K: float, T: float, rr: float, sigma: float) -> float:
    d1 = (np.log(S / K) + (rr + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    return float(norm.cdf(d1))


def main() -> None:
    df = load("cs15_gamestop").dropna()
    gme, xrt, vix = df["GME"], df["XRT"], df["^VIX"]
    ret = gme.pct_change().dropna()          # simple returns (the headline numbers)
    logret = np.log(gme).diff().dropna()

    anchor_px = float(gme.loc[ANCHOR])

    # --- headline stats ----------------------------------------------------
    run_up = float(gme.max() / anchor_px - 1)                     # peak close vs year-end
    short_pnl = 1 - gme.loc[ANCHOR:] / anchor_px                  # $1 short, marked daily
    worst_short = float(short_pnl.min())
    rvol = logret.rolling(10).std() * np.sqrt(252)
    peak_rvol = float(rvol.max())

    # --- pre-event "calm" VaR (Oct-Dec 2020) --------------------------------
    pre = ret.loc[:"2020-12-31"]
    pre_sigma = float(pre.std(ddof=1))
    var99 = float(np.percentile(pre, 1))                          # historical 1d 99% VaR
    jan27 = float(ret.loc["2021-01-27"])
    feb02 = float(ret.loc["2021-02-02"])
    sigma_mult = jan27 / pre_sigma

    # --- squeeze fortnight bars ---------------------------------------------
    win = ret.loc[BAR_LO:BAR_HI]
    bar_labels = [f"{d.month}/{d.day}" for d in win.index]
    extreme = (win.abs() > 0.55)                                  # flags the +134.8% / -60% days
    bars_base = [0.0 if e else round(float(v) * 100, 1) for v, e in zip(win, extreme)]
    bars_hot = [round(float(v) * 100, 1) if e else 0.0 for v, e in zip(win, extreme)]

    # --- event table ---------------------------------------------------------
    event_rows = []
    for d, note in EVENTS:
        ts = pd.Timestamp(d)
        event_rows.append({
            "date": d,
            "close": r(float(gme.loc[ts]), 2),
            "ret": r(float(ret.loc[ts]) * 100, 1),
            "note": note,
        })

    # --- spillover: XRT + VIX normalised to 100 at the window start ----------
    xrt_idx = 100 * xrt / xrt.iloc[0]
    vix_idx = 100 * vix / vix.iloc[0]
    # peaks *inside the squeeze weeks* (the Oct election week VIX high is noise here)
    xrt_sq = xrt.loc["2021-01-11":"2021-02-05"]
    vix_sq = vix.loc["2021-01-11":"2021-02-05"]
    xrt_peak_d, vix_peak_d = xrt_sq.idxmax(), vix_sq.idxmax()

    # --- dealer-gamma delta ladder (deterministic BS example from the article)
    gamma_s = [40, 60, 80, 100]
    gamma_delta = [round(100 * call_delta(S, 60, 0.05, 0.0, 1.2), 1) for S in gamma_s]

    payload = {
        "params": {
            "start": str(df.index[0].date()), "end": str(df.index[-1].date()),
            "nObs": int(len(df)), "anchor": ANCHOR,
            "anchorClose": r(anchor_px, 2), "seed": SEED,
        },
        "gme": {"y": downsample(gme.values, 260), "xLabels": month_labels(gme.index)},
        "spill": {
            "xrt": downsample(xrt_idx.values, 260),
            "vix": downsample(vix_idx.values, 260),
            "xLabels": month_labels(df.index),
            "xrtPeakRet": r(float(xrt_sq.max() / xrt.loc[ANCHOR] - 1)),
            "xrtPeakDate": str(xrt_peak_d.date()),
            "vixPeak": r(float(vix_sq.max()), 2),
            "vixPeakDate": str(vix_peak_d.date()),
        },
        "bars": {"labels": bar_labels, "base": bars_base, "hot": bars_hot},
        "events": event_rows,
        "shortPnl": {
            "y": downsample(short_pnl.values, 260),
            "xLabels": month_labels(short_pnl.index),
        },
        "gamma": {"s": gamma_s, "delta": gamma_delta},
        "stats": {
            "runUp": r(run_up), "worstShort": r(worst_short),
            "peakRvol": r(peak_rvol), "peakClose": r(float(gme.max()), 2),
            "peakDate": str(gme.idxmax().date()),
            "preSigma": r(pre_sigma), "var99": r(var99),
            "jan27": r(jan27), "feb02": r(feb02), "sigmaMult": r(sigma_mult, 1),
            "startClose": r(float(gme.iloc[0]), 2),
        },
    }
    ts_path = write_ts(SLUG, payload)

    # ------------------------------------------------------------- notebook --
    cells = [
        md(f"""# Anatomy of a short squeeze: GameStop, 2021

**pyportfolios.com case study CS15** · GME, XRT, ^VIX daily, Oct 2020 – Mar 2021 · NumPy · pandas · matplotlib · yfinance

Real data, real event study. We reconstruct the January 2021 squeeze from the tape:
the run-up, the exact +134.8% and −60% days, the spillover into XRT (the ETF whose
short interest made it a squeeze proxy) and the VIX, the mark-to-market P&L of a
short held through the event, and the pre-event VaR that saw none of it coming.

*Prices are split-adjusted (GME split 4-for-1 in July 2022): the famous $347.51
close on Jan 27 appears as $86.88. Returns are unaffected.*"""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from scipy.stats import norm

plt.rcParams["figure.figsize"] = (10, 5)"""),
        md("""## 1 · Data: GME, XRT and the VIX

Three series tell the story: the stock, the sector ETF that the short interest was
partly routed through, and the market's fear gauge."""),
        code("""px = yf.download(["GME", "XRT", "^VIX"], start="2020-10-01", end="2021-04-01",
                 auto_adjust=True, progress=False)["Close"].dropna()
gme, xrt, vix = px["GME"], px["XRT"], px["^VIX"]
gme.plot(title="GME close (split-adjusted), Oct 2020 – Mar 2021");"""),
        md("""## 2 · Run-up, realised vol, short P&L

Anchor a $1 short at the 2020 year-end close and mark it daily. A short's loss is
unbounded — this series shows exactly how unbounded it got."""),
        code("""ret = gme.pct_change().dropna()
logret = np.log(gme).diff().dropna()
anchor = float(gme.loc["2020-12-31"])

run_up = gme.max() / anchor - 1
rvol = logret.rolling(10).std() * np.sqrt(252)
short_pnl = 1 - gme.loc["2020-12-31":] / anchor      # negative = loss

print(f"year-end close   ${anchor:.2f}  (split-adjusted)")
print(f"peak close       ${gme.max():.2f}  on {gme.idxmax().date()}")
print(f"run-up           {run_up:+.0%}")
print(f"peak 10d rvol    {rvol.max():.0%} annualised")
print(f"worst short P&L  {short_pnl.min():+.0%} of the initial proceeds")
short_pnl.plot(title="P&L of a $1 short opened 2020-12-31, marked daily");"""),
        md("""## 3 · The event tape, day by day

The two bars every risk report should have flagged: **+134.8% on Jan 27** and
**−60.0% on Feb 2**."""),
        code("""events = ["2021-01-13", "2021-01-22", "2021-01-25", "2021-01-26",
          "2021-01-27", "2021-01-28", "2021-02-01", "2021-02-02"]
tape = pd.DataFrame({"close": gme.loc[events].round(2),
                     "return": (ret.loc[events] * 100).round(1)})
print(tape)

win = ret.loc["2021-01-19":"2021-02-04"] * 100
win.index = win.index.strftime("%m/%d")              # categorical axis for the bars
win.plot.bar(title="GME daily returns, Jan 19 - Feb 4 (%)")
plt.axhline(0, color="k", lw=0.5);"""),
        md("""## 4 · Spillover: XRT and the VIX

XRT held GME, and short interest routed through the ETF meant the squeeze dragged
the whole wrapper with it; the VIX repriced the same week."""),
        code("""idx = 100 * px / px.iloc[0]
idx[["XRT", "^VIX"]].plot(title="XRT and ^VIX, rebased to 100 at Oct 1 2020")

sq = slice("2021-01-11", "2021-02-05")            # the squeeze weeks
xs, vs = xrt.loc[sq], vix.loc[sq]
print(f"XRT squeeze peak  {xs.max():.2f} on {xs.idxmax().date()}"
      f"  ({xs.max()/xrt.loc['2020-12-31']-1:+.1%} vs year-end)")
print(f"VIX squeeze peak  {vs.max():.2f} on {vs.idxmax().date()}")"""),
        md("""## 5 · Dealer gamma: hedge demand vs price

Black–Scholes delta of the calls retail was buying: as spot runs toward and through
the strike, the dealer's hedge ratio sprints from a few shares per contract to ~100."""),
        code("""def call_delta(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    return norm.cdf(d1)

for S in [40, 60, 80, 100]:
    print(S, round(100 * call_delta(S, K=60, T=0.05, r=0.0, sigma=1.2), 1),
          "shares/contract")"""),
        md("""## 6 · The VaR that was blind

Calibrate a historical 99% one-day VaR on GameStop's own Oct–Dec 2020 returns —
the standard calm-sample setup — then compare it with what Jan 27 delivered."""),
        code("""pre = ret.loc[:"2020-12-31"]
var99 = np.percentile(pre, 1)
jan27 = float(ret.loc["2021-01-27"])

print(f"pre-event daily sigma   {pre.std(ddof=1):.2%}")
print(f"historical 99% 1d VaR   {var99:.2%}")
print(f"Jan 27 actual return    {jan27:+.1%}")
print(f"... i.e. {jan27 / pre.std(ddof=1):.0f} sigma on the calm calibration")"""),
        md("""## Takeaways

- Short interest above float turns sellers into *contractually forced* buyers; price
  is the only free variable.
- The gamma loop is the accelerant: dealer hedge demand ramps with spot.
- The blow-up was invisible to price-history VaR — the leading indicators were
  positioning numbers (SI/float, days-to-cover, options OI), not returns.
- A $1 short held from year-end lost a multiple of its proceeds; sizing for the
  tail is the only defence.

*© pyportfolios.com — runnable companion to the case study. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)

    print(f"ts  -> {ts_path}")
    print(f"nb  -> {nb_path}")
    print(f"anchor={anchor_px:.2f} peak={gme.max():.2f} run_up={run_up:+.0%} "
          f"jan27={jan27:+.1%} feb02={feb02:+.1%} worst_short={worst_short:+.0%} "
          f"peak_rvol={peak_rvol:.0%} var99={var99:.2%} sigma_mult={sigma_mult:.0f}")


if __name__ == "__main__":
    main()
