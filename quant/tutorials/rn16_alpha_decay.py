"""
RN16 - Alpha decay: measuring momentum's shrinking half-life (topic card 16/16).
Assets: 11 SPDR sector ETFs · Timeframe: Jan 2005 - Dec 2024
Libs: Alphalens Pandas statsmodels (per the card; the notebook itself uses
NumPy/Pandas/SciPy directly).

UNLIKE EVERY OTHER TUTORIAL IN THIS FOLDER, this one computes nothing and emits
no data module. The article publishes Louis's RN16_Alpha_Decay_Momentum
notebook verbatim - prose and code, unexecuted - so there are no figures and no
numbers on the page, and nothing for a data module to hold. This script exists
only to emit the runnable companion notebook, which is his cells exactly as
written (including the yfinance loader, not the pinned CSV).

If the decision is ever taken to run it, note two things first:

  1. quant/data/rn16_sectors.csv starts 2005-01-03, but the 12-1 signal needs
     252 days of history, so the study's 2005-2014 era cannot begin until 2006.
     The card's "Jan 2005 - Dec 2024" reads as the ANALYSIS window, which means
     the fetch needs to start in 2004 (or earlier). Re-fetching from 2003 was
     tested and does restore the missing year.
  2. On that fuller data the article's erosion claim holds at the horizons where
     the signal actually exists (3, 5, 10, 21 days) and reverses at 42+ days,
     where both eras are indistinguishable from zero. The placebo check remains
     the same order of magnitude as the live signal - which the notebook's own
     limitations section anticipates ("11 assets is a small cross-section").

Emits: the runnable companion notebook only.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, md, write_nb  # noqa: E402

SLUG = "alpha-decay-momentum"


def notebook_cells() -> list:
    return [
        md("""# Alpha Decay: Measuring Momentum's Shrinking Half-Life
### The data shows that sector momentum's predictive power fades within weeks — and has weakened decade over decade.

*Content format: Research Note · Category: Algorithmic Trading*

**The finding, upfront.** Using 20 years of daily data on the 11 SPDR sector ETFs, we measure how long a cross-sectional momentum signal keeps predicting returns. Two results:

1. **Horizon decay:** the signal's information coefficient (IC) is strongest for the first days after formation and decays roughly exponentially — we estimate its half-life directly from the IC curve.
2. **Calendar decay:** comparing 2005–2014 against 2015–2024, the same signal is materially weaker in the recent decade — consistent with the *alpha erosion* documented after factor publication (McLean & Pontiff 2016).

For a practitioner both numbers bind: the first sets your **turnover**, the second your **expectations**.

**Method file**
1. Data & signal construction
2. Result 1 — the IC decay curve and its half-life
3. Result 2 — decade-over-decade erosion
4. Robustness checks
5. Implications & limitations"""),

        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats
from scipy.optimize import curve_fit

np.random.seed(42)
plt.rcParams["figure.dpi"] = 110"""),

        md("""## 1. Data & signal

**Universe:** the 11 GICS sector SPDRs — a small, clean cross-section with 20+ years of history and no survivorship issues.
**Signal:** classic 12-1 momentum — trailing 252-day return, skipping the most recent 21 days (to avoid short-term reversal) — recomputed daily, expressed as cross-sectional ranks.
**Evaluation:** rank IC — the Spearman correlation between today's signal ranks and *forward* returns over horizons from 1 to 126 trading days.

*(Alphalens automates exactly this pipeline for larger universes; with 11 assets the direct computation keeps every step visible.)*"""),

        code("""TICKERS = ["XLK","XLE","XLF","XLV","XLU","XLP","XLY","XLI","XLB","XLRE","XLC"]
START, END = "2004-01-01", "2024-12-31"

def load_prices(tickers, start, end):
    \"\"\"Adjusted-close prices via yfinance (XLRE from 2015, XLC from 2018 — handled).\"\"\"
    import yfinance as yf
    df = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)["Close"]
    return df[tickers]

px = load_prices(TICKERS, START, END)
rets = px.pct_change()

# 12-1 momentum signal (needs 252d history; NaN until an ETF has it)
mom = px.shift(21) / px.shift(252) - 1

print(f"Sample: {px.index[0].date()} → {px.index[-1].date()}")
print("History start per ETF:")
print(px.apply(lambda s: s.first_valid_index().date()))"""),

        md("""## 2. Result 1 — the IC decay curve

For each day, rank sectors by momentum; correlate those ranks with returns over the *next* h days. Averaging across all days gives the mean IC per horizon — the signal's predictive power as a function of how long you hold."""),

        code("""def ic_curve(mom, px, horizons, dates=None):
    \"\"\"Mean rank IC (Spearman) per forward horizon.\"\"\"
    out = {}
    idx = mom.index if dates is None else mom.loc[dates].index
    for h in horizons:
        fwd = px.shift(-h) / px - 1                     # forward h-day return
        ics = []
        for d in idx[::5]:                              # weekly sampling to reduce overlap
            sig, f = mom.loc[d], fwd.loc[d]
            mask = sig.notna() & f.notna()
            if mask.sum() >= 6:
                ics.append(stats.spearmanr(sig[mask], f[mask]).statistic)
        out[h] = (np.mean(ics), np.std(ics) / np.sqrt(len(ics)))
    return pd.DataFrame(out, index=["IC", "se"]).T

HORIZONS = [1, 2, 3, 5, 10, 21, 42, 63, 126]
icc = ic_curve(mom, px, HORIZONS)
print(icc.round(4))"""),

        code("""# fit exponential decay IC(h) = IC0 * exp(-h/tau); half-life = tau * ln 2
h = np.array(HORIZONS, dtype=float)
ic = icc["IC"].values

def expdecay(h, ic0, tau): return ic0 * np.exp(-h / tau)
(ic0, tau), _ = curve_fit(expdecay, h, ic, p0=[max(ic[0], 0.05), 30], maxfev=5000)
half_life = tau * np.log(2)

fig, ax = plt.subplots(figsize=(10, 5))
ax.errorbar(h, ic, yerr=icc["se"], fmt="o", color="steelblue", capsize=3, label="Mean rank IC")
hh = np.linspace(1, 126, 200)
ax.plot(hh, expdecay(hh, ic0, tau), "--", color="crimson",
        label=f"Exponential fit: half-life ≈ {half_life:.0f} days")
ax.axhline(0, color="black", lw=0.8)
ax.set_xlabel("Forward horizon (trading days)"); ax.set_ylabel("Information coefficient")
ax.set_title("Sector momentum: predictive power vs holding horizon")
ax.legend()
plt.tight_layout(); plt.show()

print(f"IC at 1 day:  {ic[0]:+.3f}")
print(f"IC at 63 days: {icc.loc[63,'IC']:+.3f}")
print(f"Estimated half-life: {half_life:.0f} trading days")"""),

        md("""**Reading the curve:** the signal is worth the most immediately after formation and gives up roughly half its power within the estimated half-life. A strategy that rebalances slower than the half-life is trading mostly *dead* signal — this single number disciplines the turnover decision."""),

        md("""## 3. Result 2 — decade-over-decade erosion

Same signal, same universe, two eras. If momentum alpha erodes as it gets arbitraged (crowding, publication, cheaper implementation), the recent decade should show a flatter curve."""),

        code("""era1 = mom.index[(mom.index >= "2005-01-01") & (mom.index <= "2014-12-31")]
era2 = mom.index[(mom.index >= "2015-01-01") & (mom.index <= "2024-12-31")]

icc1 = ic_curve(mom, px, HORIZONS, era1)
icc2 = ic_curve(mom, px, HORIZONS, era2)

fig, ax = plt.subplots(figsize=(10, 5))
ax.errorbar(h, icc1["IC"], yerr=icc1["se"], fmt="o-", color="steelblue", capsize=3, label="2005–2014")
ax.errorbar(h, icc2["IC"], yerr=icc2["se"], fmt="s-", color="darkorange", capsize=3, label="2015–2024")
ax.axhline(0, color="black", lw=0.8)
ax.set_xlabel("Forward horizon (trading days)"); ax.set_ylabel("Information coefficient")
ax.set_title("The same signal, two decades: alpha erosion in sector momentum")
ax.legend()
plt.tight_layout(); plt.show()

comp = pd.DataFrame({"2005–2014": icc1["IC"], "2015–2024": icc2["IC"]})
comp["change"] = comp.iloc[:, 1] - comp.iloc[:, 0]
print(comp.round(4))"""),

        md("""## 4. Robustness

Three checks that the result isn't an artifact:"""),

        code("""# (a) skip-window sensitivity: 12-1 vs 12-0 vs 6-1 formation
variants = {"12-1 (base)": px.shift(21)/px.shift(252)-1,
            "12-0":        px/px.shift(252)-1,
            "6-1":         px.shift(21)/px.shift(126)-1}
rows = {}
for name, sig in variants.items():
    icc_v = ic_curve(sig, px, [5, 21, 63])
    rows[name] = icc_v["IC"]
print("IC by formation window:")
print(pd.DataFrame(rows).round(4))"""),

        code("""# (b) placebo: shuffle the signal in time -> IC should be ~0
mom_shuffled = mom.sample(frac=1.0, random_state=0).set_axis(mom.index)
icc_placebo = ic_curve(mom_shuffled, px, [5, 21, 63])
print("Placebo (time-shuffled signal):")
print(icc_placebo.round(4))

# (c) long-short spread: top-3 minus bottom-3 sectors, monthly rebalance
ranks = mom.rank(axis=1)
n_valid = ranks.notna().sum(axis=1)
top = ranks.ge(n_valid - 2, axis=0)          # top 3
bot = ranks.le(3, axis=0)                     # bottom 3
monthly = rets.resample("ME").apply(lambda x: (1+x).prod()-1)
sig_m = mom.resample("ME").last().shift(1)    # trade next month on last month's signal
rank_m = sig_m.rank(axis=1)
nv = rank_m.notna().sum(axis=1)
ls = (monthly.where(rank_m.ge(nv-2, axis=0)).mean(axis=1)
      - monthly.where(rank_m.le(3, axis=0)).mean(axis=1)).dropna()
for era, sl in [("2005–2014", ls.loc["2005":"2014"]), ("2015–2024", ls.loc["2015":"2024"])]:
    print(f"L/S top3-bottom3 {era}: ann. return {sl.mean()*12:+.1%}, "
          f"t-stat {sl.mean()/sl.std()*np.sqrt(len(sl)):.2f}")"""),

        md("""## 5. Implications & limitations

### Implications
- **Turnover has a right answer.** With a half-life measured in weeks, monthly rebalancing captures most of the available signal; quarterly leaves much of it dead. Trading costs then decide the exact point.
- **Capacity and expectations.** The decade-over-decade IC decline is what crowding looks like in data — position sizing and return expectations calibrated on the 2005–2014 sample would have systematically disappointed after 2015.
- **Signal research must be dated.** An IC estimated over "all history" mixes two different regimes; the recent-era curve is the honest input for a live strategy.

### Limitations
- **11 assets is a small cross-section** — rank ICs are noisy (note the error bars); the pattern, not any single point, is the result.
- **Overlapping windows** — weekly sampling reduces but doesn't eliminate autocorrelation in IC estimates; block-bootstrap errors would be the rigorous upgrade.
- **One signal, one universe** — this measures *sector* momentum; single-stock momentum decays differently (typically slower formation, faster crowding).
- **No costs** — the L/S spread is gross; at realistic ETF spreads the recent-era net edge thins further.

### Related content
- **GameStop case study** — crowding's fast catastrophic mode; this note is its slow mode
- **SMA Crossover Backtest** — turning a time-series signal into a disciplined strategy
- **Walk-forward validation** (future piece) — the out-of-sample hygiene this note approximates with its era split

*Reference: McLean & Pontiff (2016), "Does Academic Research Destroy Stock Return Predictability?", Journal of Finance.*

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]


def main() -> None:
    nb_path = write_nb(SLUG, notebook_cells())
    print(f"  nb -> {nb_path}")
    print("  (no data module: this article publishes unexecuted)")


if __name__ == "__main__":
    main()
