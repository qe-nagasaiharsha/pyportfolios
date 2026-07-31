"""
Legacy upgrade - Pairs Trading & Cointegration (research article).
Assets: EWA / EWC (Australia / Canada) · Timeframe: Jan 2010 - Dec 2024 ·
Data: t14_kalman.csv (shared with T14, which treats the DYNAMIC hedge; this
article is the STATIC Engle-Granger methodology).

Runs the full Engle-Granger recipe on real prices: OLS hedge ratio on log
levels, ADF tests on each leg and on the residual, OU half-life of the spread,
a rolling z-score band backtest at |z|>2 with 5 bp per leg-change, and the
honest rolling-beta out-of-sample rerun. Emits the article data module + the
runnable notebook. Fully deterministic - no RNG anywhere.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.regression.rolling import RollingOLS
from statsmodels.tsa.stattools import adfuller, coint

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "pairs-trading-cointegration"
Z_WIN = 60        # rolling window for the z-score
ENTRY_Z = 2.0     # enter when |z| > 2
EXIT_Z = 0.5      # flatten when |z| < 0.5
COST = 5e-4       # 5 bp per unit change of position, per leg change
ROLL_WIN = 252    # rolling OLS window for the out-of-sample beta


def zscore_backtest(spread: pd.Series) -> dict:
    """The article's band rules: enter |z|>2, exit |z|<0.5, positions lagged."""
    z = (spread - spread.rolling(Z_WIN).mean()) / spread.rolling(Z_WIN).std(ddof=1)
    state = np.where(z < -ENTRY_Z, 1.0, np.where(z > ENTRY_Z, -1.0, np.nan))
    pos = pd.Series(state, index=z.index)
    pos[z.abs() < EXIT_Z] = 0.0
    pos = pos.ffill().fillna(0.0)

    pnl = pos.shift(1) * spread.diff()               # earn the move, lagged once
    net = pnl - pos.diff().abs().shift(1) * COST     # 5 bp per leg change
    yrs = len(spread) / 252
    entries = int(((pos != 0) & (pos.shift(1) == 0)).sum())

    def sh(x: pd.Series) -> float:
        x = x.dropna()
        return float(np.sqrt(252) * x.mean() / x.std(ddof=1))

    return {
        "z": z, "pos": pos, "gross": pnl, "net": net,
        "grossSharpe": sh(pnl), "netSharpe": sh(net),
        "tradesYr": entries / yrs, "entries": entries,
    }


def main() -> None:
    df = load("t14_kalman").dropna()
    ly, lx = np.log(df["EWC"]), np.log(df["EWA"])

    # ---- Engle-Granger step 1: static OLS hedge ratio on log levels ---------
    ols = sm.OLS(ly, sm.add_constant(lx)).fit()
    alpha, beta = float(ols.params.iloc[0]), float(ols.params.iloc[1])
    spread = ly - beta * lx - alpha                  # the EG residual

    # ---- step 2: unit-root tests --------------------------------------------
    adf_rows = {}
    for name, series in [("logEWA", lx), ("logEWC", ly), ("residual", spread)]:
        stat, pval, *_ = adfuller(series, regression="c", autolag="AIC")
        adf_rows[name] = {"stat": r(float(stat), 3), "p": r(float(pval), 4)}
    eg_stat, eg_p, _ = coint(ly, lx)                 # EG test with proper critical values

    # ---- OU half-life of the residual ---------------------------------------
    ds, lag = spread.diff().dropna(), spread.shift(1).dropna()
    ou = sm.OLS(ds, sm.add_constant(lag.loc[ds.index])).fit()
    theta = float(ou.params.iloc[1])
    half_life = float(-np.log(2) / theta)

    # ---- the classic band backtest + the honest out-of-sample rerun ---------
    bt = zscore_backtest(spread)

    roll = RollingOLS(ly, sm.add_constant(lx), window=ROLL_WIN).fit()
    b_roll = roll.params.shift(1)                    # yesterday's fit only
    spread_oos = (ly - b_roll.iloc[:, 1] * lx - b_roll.iloc[:, 0]).dropna()
    bt_oos = zscore_backtest(spread_oos)

    payload = {
        "params": {
            "start": str(df.index[0].date()), "end": str(df.index[-1].date()),
            "nObs": int(len(df)), "beta": r(beta), "alpha": r(alpha),
            "zWin": Z_WIN, "entryZ": ENTRY_Z, "exitZ": EXIT_Z,
            "costBp": 5, "rollWin": ROLL_WIN,
            "halfLifeDays": r(half_life, 1),
            "egStat": r(float(eg_stat), 3), "egP": r(float(eg_p), 4),
        },
        "adf": adf_rows,
        "spread": {
            "y": downsample(spread.values, 260),
            "xLabels": [[f, l] for f, l in year_labels(df.index, 2)],
        },
        "z": {
            "y": downsample(bt["z"].fillna(0).values, 260),
        },
        "equity": {
            "gross": downsample(bt["gross"].fillna(0).cumsum().values, 240),
            "net": downsample(bt["net"].fillna(0).cumsum().values, 240),
            "oos": downsample(
                bt_oos["net"].fillna(0).cumsum().reindex(df.index).ffill().fillna(0).values, 240),
            "xLabels": [[f, l] for f, l in year_labels(df.index, 2)],
        },
        "stats": {
            "gross": {"sharpe": r(bt["grossSharpe"], 2), "tradesYr": r(bt["tradesYr"], 1)},
            "net": {"sharpe": r(bt["netSharpe"], 2), "tradesYr": r(bt["tradesYr"], 1)},
            "oos": {"sharpe": r(bt_oos["netSharpe"], 2), "tradesYr": r(bt_oos["tradesYr"], 1)},
        },
    }
    ts = write_ts(SLUG, payload)

    cells = [
        md(f"""# Pairs trading & cointegration

**pyportfolios.com research** · EWA / EWC, Jan 2010 – Dec 2024 · NumPy · Pandas · statsmodels · Matplotlib · yfinance

The static Engle–Granger methodology, end to end, on the classic pair
(iShares Australia vs Canada — two commodity-driven markets):

1. OLS hedge ratio on log price levels,
2. ADF unit-root tests on each leg and on the residual,
3. OU half-life of the spread,
4. the band backtest — enter |z| > {ENTRY_Z:.0f}, exit |z| < {EXIT_Z}, 5 bp per leg change,
5. the honest rerun with a rolling out-of-sample hedge ratio.

(The *dynamic* hedge-ratio treatment of this same pair — Kalman filtering —
is its own tutorial and notebook.)"""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import statsmodels.api as sm
import yfinance as yf
from statsmodels.regression.rolling import RollingOLS
from statsmodels.tsa.stattools import adfuller, coint

plt.rcParams["figure.figsize"] = (10, 4.5)"""),
        md("""## 1 · Data: two markets tethered by commodities"""),
        code("""px = yf.download(["EWA", "EWC"], start="2010-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"].dropna()
ly, lx = np.log(px["EWC"]), np.log(px["EWA"])
px.plot(title="EWA vs EWC — adjusted closes");"""),
        md("""## 2 · Engle–Granger step 1: the hedge ratio

Regress one log price on the other. The slope β is the number of units of EWA
that immunise one unit of EWC against the common trend."""),
        code("""ols = sm.OLS(ly, sm.add_constant(lx)).fit()
alpha, beta = ols.params.iloc[0], ols.params.iloc[1]
spread = ly - beta * lx - alpha
print(f"hedge ratio beta = {beta:.3f}   intercept = {alpha:.3f}")"""),
        md("""## 3 · Step 2: unit-root tests

Each log price should be non-stationary (ADF cannot reject a unit root), while
the residual should be stationary (ADF rejects). `coint` runs the same recipe
with the correct Engle–Granger critical values, which are stricter than plain
ADF because β was itself estimated."""),
        code("""for name, s in [("log EWA", lx), ("log EWC", ly), ("EG residual", spread)]:
    stat, pval, *_ = adfuller(s, regression="c", autolag="AIC")
    print(f"ADF {name:<12} stat {stat:7.3f}   p-value {pval:.4f}")

eg_stat, eg_p, _ = coint(ly, lx)
print(f"\\nEngle-Granger coint test: stat {eg_stat:.3f}   p-value {eg_p:.4f}")"""),
        md("""## 4 · How fast does it snap back? The OU half-life

Fit dS = θ·S·dt + noise on the residual: the AR(1) coefficient gives the speed
of mean reversion, and half-life = −ln 2 / θ. This number sets the natural
holding period — and the z-score window should comfortably exceed it."""),
        code("""ds, lag = spread.diff().dropna(), spread.shift(1).dropna()
ou = sm.OLS(ds, sm.add_constant(lag.loc[ds.index])).fit()
theta = ou.params.iloc[1]
print(f"half-life = {-np.log(2)/theta:.1f} trading days")"""),
        md("""## 5 · The band backtest — and the honest rerun

Enter when |z| > 2, flatten when |z| < 0.5, pay 5 bp on every change of
position. Then repeat with a hedge ratio estimated on a rolling 252-day window
lagged one day — no future prices inside β."""),
        code("""Z_WIN, ENTRY, EXIT, COST = 60, 2.0, 0.5, 5e-4

def band_backtest(spread):
    z = (spread - spread.rolling(Z_WIN).mean()) / spread.rolling(Z_WIN).std(ddof=1)
    state = np.where(z < -ENTRY, 1.0, np.where(z > ENTRY, -1.0, np.nan))
    pos = pd.Series(state, index=z.index)
    pos[z.abs() < EXIT] = 0.0
    pos = pos.ffill().fillna(0.0)
    pnl = pos.shift(1) * spread.diff()
    net = pnl - pos.diff().abs().shift(1) * COST
    sh = lambda x: np.sqrt(252) * x.dropna().mean() / x.dropna().std(ddof=1)
    entries = int(((pos != 0) & (pos.shift(1) == 0)).sum())
    return z, pos, net, sh(pnl), sh(net), entries

z, pos, net, g_sh, n_sh, entries = band_backtest(spread)
yrs = len(spread) / 252
print(f"gross Sharpe {g_sh:.2f}   net Sharpe {n_sh:.2f}   trades/yr {entries/yrs:.1f}")

# the honest version: beta from a rolling window, lagged one day
roll = RollingOLS(ly, sm.add_constant(lx), window=252).fit()
b = roll.params.shift(1)
spread_oos = (ly - b.iloc[:, 1] * lx - b.iloc[:, 0]).dropna()
*_, net_oos_sh, entries_oos = band_backtest(spread_oos)[2:]
print(f"rolling-beta OOS net Sharpe {net_oos_sh:.2f}   "
      f"trades/yr {entries_oos/(len(spread_oos)/252):.1f}")"""),
        code("""fig, ax = plt.subplots(2, 1, figsize=(10, 7), sharex=True)
z.plot(ax=ax[0], color="#4a4a42", lw=0.8)
for lvl in (2, -2): ax[0].axhline(lvl, color="#0a8a8a", ls="--", lw=1)
ax[0].set_title("spread z-score with ±2σ entry bands")
net.fillna(0).cumsum().plot(ax=ax[1], color="#0a8a8a")
ax[1].set_title("cumulative net P&L (spread units, 5 bp per leg change)")
plt.tight_layout();"""),
        md("""## Takeaways

- Both legs are I(1); the Engle–Granger residual is stationary at conventional
  levels — the pair is cointegrated over this sample.
- The half-life tells you the natural holding period before you place a trade.
- The in-sample full-period β flatters the backtest; the rolling out-of-sample
  rerun is the number you should believe — and it is materially lower.
- Multiply that haircut by the number of pairs you scanned before settling on
  this one: that is what the Deflated Sharpe Ratio formalises.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    print(f"beta={beta:.3f} alpha={alpha:.3f} halfLife={half_life:.1f}d")
    print("ADF:", adf_rows)
    print(f"EG coint: stat={eg_stat:.3f} p={eg_p:.4f}")
    print(f"gross Sharpe {bt['grossSharpe']:.2f}  net {bt['netSharpe']:.2f}  "
          f"trades/yr {bt['tradesYr']:.1f}")
    print(f"OOS net Sharpe {bt_oos['netSharpe']:.2f}  trades/yr {bt_oos['tradesYr']:.1f}")


if __name__ == "__main__":
    main()
