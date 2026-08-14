/* Alpha Decay — code, VERBATIM from the RN16_Alpha_Decay_Momentum notebook.
   Unlike the other articles, nothing here was executed: the page carries the
   prose and the code exactly as written, with no computed results or figures.
   The yfinance loader is his, unchanged. */

export const SETUP_CODE = String.raw`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats
from scipy.optimize import curve_fit

np.random.seed(42)
plt.rcParams["figure.dpi"] = 110`;

export const DATA_CODE = String.raw`TICKERS = ["XLK","XLE","XLF","XLV","XLU","XLP","XLY","XLI","XLB","XLRE","XLC"]
START, END = "2004-01-01", "2024-12-31"

def load_prices(tickers, start, end):
    """Adjusted-close prices via yfinance (XLRE from 2015, XLC from 2018 — handled)."""
    import yfinance as yf
    df = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)["Close"]
    return df[tickers]

px = load_prices(TICKERS, START, END)
rets = px.pct_change()

# 12-1 momentum signal (needs 252d history; NaN until an ETF has it)
mom = px.shift(21) / px.shift(252) - 1

print(f"Sample: {px.index[0].date()} → {px.index[-1].date()}")
print("History start per ETF:")
print(px.apply(lambda s: s.first_valid_index().date()))`;

export const IC_CODE = String.raw`def ic_curve(mom, px, horizons, dates=None):
    """Mean rank IC (Spearman) per forward horizon."""
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
print(icc.round(4))`;

export const DECAY_CODE = String.raw`# fit exponential decay IC(h) = IC0 * exp(-h/tau); half-life = tau * ln 2
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
print(f"Estimated half-life: {half_life:.0f} trading days")`;

export const ERA_CODE = String.raw`era1 = mom.index[(mom.index >= "2005-01-01") & (mom.index <= "2014-12-31")]
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
print(comp.round(4))`;

export const VARIANT_CODE = String.raw`# (a) skip-window sensitivity: 12-1 vs 12-0 vs 6-1 formation
variants = {"12-1 (base)": px.shift(21)/px.shift(252)-1,
            "12-0":        px/px.shift(252)-1,
            "6-1":         px.shift(21)/px.shift(126)-1}
rows = {}
for name, sig in variants.items():
    icc_v = ic_curve(sig, px, [5, 21, 63])
    rows[name] = icc_v["IC"]
print("IC by formation window:")
print(pd.DataFrame(rows).round(4))`;

export const PLACEBO_CODE = String.raw`# (b) placebo: shuffle the signal in time -> IC should be ~0
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
          f"t-stat {sl.mean()/sl.std()*np.sqrt(len(sl)):.2f}")`;
