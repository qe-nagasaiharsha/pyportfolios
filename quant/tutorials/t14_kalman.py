"""
T14 - Kalman Filters: Dynamic Hedge Ratios (topic card 14/16).
Assets: EWA / EWC pair (Australia / Canada) · Timeframe: Jan 2010 - Dec 2024 ·
Libs: NumPy statsmodels Pandas.

Estimates the EWC~EWA hedge ratio three ways (full-sample OLS, rolling 252d
OLS, a from-scratch NumPy Kalman filter with random-walk states), trades the
resulting spread with identical z-score rules, and emits the article data
module + the runnable notebook. Fully deterministic - no RNG anywhere.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.regression.rolling import RollingOLS
from statsmodels.tsa.stattools import adfuller

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "kalman-filter-hedge-ratios"
DELTA = 1e-5       # state-noise ratio: trans_cov = delta/(1-delta) * I
R_OBS = 1e-3       # observation-noise variance
ROLL_WIN = 252     # rolling-OLS window (1 trading year)
Z_WIN = 60         # trailing window for the spread z-score
ENTRY_Z = 2.0      # enter when |z| > 2, exit when z crosses 0
COST = 1e-3        # 10 bp per unit of traded notional, per leg
START = 252        # trading starts once the rolling OLS has a full window


# ------------------------------------------------------------ the filter --

def kalman_hedge(x: np.ndarray, y: np.ndarray,
                 delta: float = DELTA, r_obs: float = R_OBS):
    """Filter state [beta_t, alpha_t] through y_t = beta_t*x_t + alpha_t + eps.

    Random-walk transition (F = I) with trans_cov Q = delta/(1-delta) * I —
    the standard parameterization (Chan 2013): delta pins how fast the states
    are allowed to wander relative to the observation noise r_obs.
    """
    n = len(x)
    q = (delta / (1.0 - delta)) * np.eye(2)
    state = np.zeros(2)            # diffuse start: beta = alpha = 0
    p_cov = np.eye(2)
    betas, alphas, innov = np.zeros(n), np.zeros(n), np.zeros(n)
    for t in range(n):
        h = np.array([x[t], 1.0])          # observation map for [beta, alpha]
        p_cov = p_cov + q                  # predict (F = I: state unchanged)
        e = y[t] - h @ state               # innovation
        s = h @ p_cov @ h + r_obs          # innovation variance
        k = p_cov @ h / s                  # Kalman gain
        state = state + k * e              # update
        p_cov = p_cov - np.outer(k, h @ p_cov)
        betas[t], alphas[t], innov[t] = state[0], state[1], e
    return betas, alphas, innov


# ----------------------------------------------------------- the backtest --

def backtest(ewa: np.ndarray, ewc: np.ndarray, beta: np.ndarray,
             alpha: np.ndarray, dynamic: bool, cost: float = COST):
    """Z-score mean reversion on spread = EWC - beta*EWA - alpha.

    Enter +1 (long EWC / short beta*EWA) at z < -2, -1 at z > +2, exit when z
    crosses 0. Positions sized to $1 gross notional at entry; the dynamic
    variant re-hedges the EWA leg to the current beta daily. 10 bp cost on
    every unit of traded notional. Signals use the close; P&L accrues from the
    next day - no lookahead in the trading rule.
    """
    n = len(ewa)
    spread = pd.Series(ewc - beta * ewa - alpha)
    z = ((spread - spread.rolling(Z_WIN).mean())
         / spread.rolling(Z_WIN).std(ddof=1)).to_numpy()

    pos = np.zeros(n)
    p = 0.0
    for t in range(START, n):
        zt = z[t]
        if np.isnan(zt):
            pos[t] = p
            continue
        if p == 0.0:
            if zt < -ENTRY_Z:
                p = 1.0
            elif zt > ENTRY_Z:
                p = -1.0
        elif p == 1.0 and zt >= 0.0:
            p = 0.0
        elif p == -1.0 and zt <= 0.0:
            p = 0.0
        pos[t] = p

    ret = np.zeros(n)
    n_ewc = n_ewa = g0 = 0.0
    trades = 0
    for t in range(START, n):
        pnl = n_ewc * (ewc[t] - ewc[t - 1]) + n_ewa * (ewa[t] - ewa[t - 1])
        cost_t = 0.0
        if pos[t] != pos[t - 1]:
            if pos[t - 1] == 0.0:                       # entry
                g0 = ewc[t] + abs(beta[t]) * ewa[t]     # gross notional anchor
                tgt_c, tgt_a = pos[t] / g0, -pos[t] * beta[t] / g0
                trades += 1
            else:                                       # exit
                tgt_c = tgt_a = 0.0
            cost_t = cost * (abs(tgt_c - n_ewc) * ewc[t]
                             + abs(tgt_a - n_ewa) * ewa[t])
            n_ewc, n_ewa = tgt_c, tgt_a
        elif dynamic and pos[t] != 0.0:                 # re-hedge to beta_t
            tgt_a = -pos[t] * beta[t] / g0
            cost_t = cost * abs(tgt_a - n_ewa) * ewa[t]
            n_ewa = tgt_a
        ret[t] = pnl - cost_t

    equity = np.cumprod(1.0 + ret[START:])
    rr = ret[START:]
    ann_ret = rr.mean() * 252
    ann_vol = rr.std(ddof=1) * np.sqrt(252)
    sharpe = ann_ret / ann_vol if ann_vol > 0 else 0.0
    max_dd = float((equity / np.maximum.accumulate(equity) - 1.0).min())
    stats = {"annRet": r(float(ann_ret)), "annVol": r(float(ann_vol)),
             "sharpe": r(float(sharpe), 2), "maxDD": r(max_dd),
             "trades": int(trades)}
    return z, equity, stats


# ------------------------------------------------------------------- main --

def main() -> None:
    df = load("t14_kalman")[["EWA", "EWC"]].dropna()
    ewa, ewc = df["EWA"].to_numpy(), df["EWC"].to_numpy()
    idx = df.index

    # --- baseline 1: one full-sample OLS beta (statsmodels) ---------------
    x_const = sm.add_constant(df["EWA"])
    ols = sm.OLS(df["EWC"], x_const).fit()
    beta_static = float(ols.params["EWA"])
    alpha_static = float(ols.params["const"])
    spread_static = df["EWC"] - beta_static * df["EWA"] - alpha_static
    adf_p = float(adfuller(spread_static.to_numpy())[1])
    ret_corr = float(np.corrcoef(np.diff(np.log(ewa)), np.diff(np.log(ewc)))[0, 1])

    # --- baseline 2: rolling 252d OLS (statsmodels RollingOLS) ------------
    roll = RollingOLS(df["EWC"], x_const, window=ROLL_WIN).fit(params_only=True)
    beta_roll = roll.params["EWA"].to_numpy()
    alpha_roll = roll.params["const"].to_numpy()

    # --- the Kalman filter, from scratch in NumPy --------------------------
    beta_kf, alpha_kf, _ = kalman_hedge(ewa, ewc)

    # --- trade the identical rules on both spreads -------------------------
    beta_st_arr = np.full(len(ewa), beta_static)
    alpha_st_arr = np.full(len(ewa), alpha_static)
    z_kf, eq_kf, st_kf = backtest(ewa, ewc, beta_kf, alpha_kf, dynamic=True)
    z_st, eq_st, st_st = backtest(ewa, ewc, beta_st_arr, alpha_st_arr,
                                  dynamic=False)
    # gross (cost = 0) runs: how much of the story is signal vs frictions
    _, _, st_kf_g = backtest(ewa, ewc, beta_kf, alpha_kf, dynamic=True, cost=0.0)
    _, _, st_st_g = backtest(ewa, ewc, beta_st_arr, alpha_st_arr,
                             dynamic=False, cost=0.0)

    kf_trade = beta_kf[START:]
    roll_trade = beta_roll[START:]

    payload = {
        "params": {
            "start": str(idx[0].date()), "end": str(idx[-1].date()),
            "n_obs": int(len(df)), "delta": DELTA, "rObs": R_OBS,
            "rollWin": ROLL_WIN, "zWin": Z_WIN, "entryZ": ENTRY_Z,
            "costBps": 10, "startIdx": START,
            "betaStatic": r(beta_static), "alphaStatic": r(alpha_static),
            "adfP": r(adf_p), "retCorr": r(ret_corr),
            "betaKfMin": r(float(kf_trade.min())),
            "betaKfMax": r(float(kf_trade.max())),
            "betaKfLast": r(float(beta_kf[-1])),
            "betaRollMin": r(float(roll_trade.min())),
            "betaRollMax": r(float(roll_trade.max())),
        },
        "prices": {
            "ewa": downsample(ewa / ewa[0], 240),
            "ewc": downsample(ewc / ewc[0], 240),
            "xLabels": [[f, l] for f, l in year_labels(idx, 2)],
        },
        "beta": {
            "kalman": downsample(kf_trade, 240),
            "rolling": downsample(roll_trade, 240),
            "xLabels": [[f, l] for f, l in year_labels(idx[START:], 2)],
        },
        "zscore": {
            "z": downsample(np.nan_to_num(z_kf[START:], nan=0.0), 240),
            "xLabels": [[f, l] for f, l in year_labels(idx[START:], 2)],
        },
        "equity": {
            "kalman": downsample(eq_kf, 240),
            "static": downsample(eq_st, 240),
            "xLabels": [[f, l] for f, l in year_labels(idx[START:], 2)],
        },
        "stats": {
            "net": {"kalman": st_kf, "static": st_st},
            "gross": {"kalman": st_kf_g, "static": st_st_g},
        },
    }
    ts = write_ts(SLUG, payload)

    cells = [
        md(f"""# Kalman Filters: Dynamic Hedge Ratios

**pyportfolios.com tutorial T14** · EWA / EWC, Jan 2010 – Dec 2024 · NumPy · statsmodels · Pandas

A pairs trade is only as good as its hedge ratio — and hedge ratios drift. In this
notebook we

1. estimate the EWC~EWA hedge ratio with full-sample OLS and rolling 252-day OLS,
2. build a Kalman filter **from scratch in NumPy** that treats beta and alpha as
   random-walk states,
3. compare the three beta paths, and
4. trade the identical z-score rules on the Kalman spread vs the static spread,
   with 10 bp costs on both legs.

Everything is deterministic — no random numbers anywhere."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import statsmodels.api as sm
import yfinance as yf
from statsmodels.regression.rolling import RollingOLS
from statsmodels.tsa.stattools import adfuller

plt.rcParams["figure.figsize"] = (10, 5)"""),
        md("""## 1 · Data: the classic Chan pair

EWA (iShares MSCI Australia) and EWC (iShares MSCI Canada) — two commodity-heavy,
developed-market ETFs made famous as a cointegration example by Ernest Chan.
Fifteen years of adjusted closes, 2010–2024."""),
        code("""px = yf.download(["EWA", "EWC"], start="2010-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"].dropna()
ewa, ewc = px["EWA"].to_numpy(), px["EWC"].to_numpy()

(px / px.iloc[0]).plot(title="EWA & EWC, normalized");"""),
        md(f"""## 2 · Two OLS baselines

The full-sample regression `EWC ~ EWA` gives one number for 15 years — and it is
computed with data you would not have had for most of the sample. The rolling
{ROLL_WIN}-day OLS is honest but laggy: every observation inside the window has
equal weight, so a year-old data point moves today's beta exactly as much as
yesterday's, and points falling *out* of the window jerk the estimate (the
"window cliff")."""),
        code(f"""x_const = sm.add_constant(px["EWA"])

ols = sm.OLS(px["EWC"], x_const).fit()
beta_static, alpha_static = float(ols.params["EWA"]), float(ols.params["const"])

spread_static = px["EWC"] - beta_static * px["EWA"] - alpha_static
print(f"static beta  = {{beta_static:.4f}}   alpha = {{alpha_static:.4f}}")
print(f"ADF p-value on the static spread = {{adfuller(spread_static.to_numpy())[1]:.4f}}")

roll = RollingOLS(px["EWC"], x_const, window={ROLL_WIN}).fit(params_only=True)
beta_roll = roll.params["EWA"].to_numpy()
alpha_roll = roll.params["const"].to_numpy()"""),
        md(f"""## 3 · The Kalman filter, from scratch

State-space model — the state is the hedge relationship itself:

$$\\begin{{aligned}}
\\text{{state:}} \\quad & \\begin{{bmatrix}}\\beta_t \\\\ \\alpha_t\\end{{bmatrix}}
 = \\begin{{bmatrix}}\\beta_{{t-1}} \\\\ \\alpha_{{t-1}}\\end{{bmatrix}} + \\omega_t,
 \\qquad \\omega_t \\sim \\mathcal N(0, Q) \\\\
\\text{{observation:}} \\quad & EWC_t = \\beta_t \\, EWA_t + \\alpha_t + \\varepsilon_t,
 \\qquad \\varepsilon_t \\sim \\mathcal N(0, R)
\\end{{aligned}}$$

A random walk for the states (transition matrix $F = I$) says: *the hedge ratio
tomorrow is the hedge ratio today, plus noise.* The standard parameterization
(Chan 2013) sets $Q = \\frac{{\\delta}}{{1-\\delta}} I$ with $\\delta = {DELTA:g}$
and $R = {R_OBS:g}$. Delta is the knob: larger → beta adapts faster but is noisier;
smaller → smoother but laggier. $\\delta = 0$ recovers recursive least squares
(a static beta refined forever)."""),
        code(f"""def kalman_hedge(x, y, delta={DELTA:g}, r_obs={R_OBS:g}):
    n = len(x)
    q = (delta / (1.0 - delta)) * np.eye(2)   # trans_cov
    state = np.zeros(2)                       # [beta, alpha], diffuse start
    p_cov = np.eye(2)
    betas, alphas = np.zeros(n), np.zeros(n)
    for t in range(n):
        h = np.array([x[t], 1.0])             # observation map
        p_cov = p_cov + q                     # predict (F = I)
        e = y[t] - h @ state                  # innovation
        s = h @ p_cov @ h + r_obs             # innovation variance
        k = p_cov @ h / s                     # Kalman gain
        state = state + k * e                 # update
        p_cov = p_cov - np.outer(k, h @ p_cov)
        betas[t], alphas[t] = state
    return betas, alphas

beta_kf, alpha_kf = kalman_hedge(ewa, ewc)
print(f"Kalman beta: first tradeable {{beta_kf[252]:.3f}} ... last {{beta_kf[-1]:.3f}}")"""),
        md("""## 4 · Three betas, one pair

Slice off the first year (the rolling OLS warm-up / Kalman burn-in) and compare.
The Kalman beta moves *with* the relationship — exponentially down-weighting old
data — while the rolling OLS drags a 252-day anchor and the static line is a
15-year average of regimes that no longer exist."""),
        code("""t0 = 252
dates = px.index[t0:]
plt.plot(dates, beta_kf[t0:], label="Kalman", lw=1.6)
plt.plot(dates, beta_roll[t0:], label="rolling OLS (252d)", lw=1.2)
plt.axhline(beta_static, color="k", ls="--", lw=1, label="static OLS")
plt.legend(); plt.title("EWC~EWA hedge ratio, three estimators");
plt.show()
"""),
        md(f"""## 5 · Trading the spread

Identical rules on both spreads: z-score the spread on a trailing {Z_WIN}-day
window, enter long (long EWC / short beta·EWA) at z < −{ENTRY_Z:g}, short at
z > +{ENTRY_Z:g}, exit when z crosses 0. Positions are sized to \\$1 gross
notional at entry; the Kalman variant re-hedges the EWA leg to the current beta
each day. 10 bp cost on every unit of traded notional. Signals use the close,
P&L accrues from the next day — no lookahead in the rule (the static beta itself,
of course, is one giant lookahead — that is the point of the comparison)."""),
        code(f"""def backtest(beta, alpha, dynamic, z_win={Z_WIN}, entry={ENTRY_Z:g},
             cost={COST:g}, start=252):
    n = len(ewa)
    spread = pd.Series(ewc - beta * ewa - alpha)
    z = ((spread - spread.rolling(z_win).mean())
         / spread.rolling(z_win).std(ddof=1)).to_numpy()

    pos, p = np.zeros(n), 0.0
    for t in range(start, n):
        zt = z[t]
        if np.isnan(zt):
            pos[t] = p; continue
        if p == 0.0:
            if zt < -entry: p = 1.0
            elif zt > entry: p = -1.0
        elif p == 1.0 and zt >= 0.0: p = 0.0
        elif p == -1.0 and zt <= 0.0: p = 0.0
        pos[t] = p

    ret = np.zeros(n)
    n_ewc = n_ewa = g0 = 0.0
    trades = 0
    for t in range(start, n):
        pnl = n_ewc * (ewc[t] - ewc[t-1]) + n_ewa * (ewa[t] - ewa[t-1])
        c = 0.0
        if pos[t] != pos[t-1]:
            if pos[t-1] == 0.0:                     # entry
                g0 = ewc[t] + abs(beta[t]) * ewa[t]
                tc, ta = pos[t] / g0, -pos[t] * beta[t] / g0
                trades += 1
            else:                                   # exit
                tc = ta = 0.0
            c = cost * (abs(tc - n_ewc) * ewc[t] + abs(ta - n_ewa) * ewa[t])
            n_ewc, n_ewa = tc, ta
        elif dynamic and pos[t] != 0.0:             # re-hedge to beta_t
            ta = -pos[t] * beta[t] / g0
            c = cost * abs(ta - n_ewa) * ewa[t]
            n_ewa = ta
        ret[t] = pnl - c

    rr = ret[start:]
    eq = np.cumprod(1.0 + rr)
    ann, vol = rr.mean() * 252, rr.std(ddof=1) * np.sqrt(252)
    mdd = (eq / np.maximum.accumulate(eq) - 1.0).min()
    return eq, dict(ann_ret=ann, ann_vol=vol, sharpe=ann / vol,
                    max_dd=mdd, trades=trades)

eq_kf, st_kf = backtest(beta_kf, alpha_kf, dynamic=True)
eq_st, st_st = backtest(np.full(len(ewa), beta_static),
                        np.full(len(ewa), alpha_static), dynamic=False)

plt.plot(px.index[252:], eq_kf, label="Kalman beta")
plt.plot(px.index[252:], eq_st, label="static beta")
plt.legend(); plt.title("Spread mean reversion, net of 10 bp costs");
plt.show()
"""),
        md("""## 6 · What the numbers actually say

Run the comparison gross (cost = 0) as well as net, because the two answers
differ — and the difference is the real lesson. The Kalman spread is the better
*signal*: higher gross Sharpe, half the volatility, half the max drawdown. But
it mean-reverts faster, so it trades ~2.7× as often, and at 10 bp per unit of
traded notional the extra turnover eats the entire edge. The static-beta
variant survives 10 bp — while quietly enjoying a 15-year lookahead, since its
beta was fit on the full sample."""),
        code("""eq_kf_g, st_kf_g = backtest(beta_kf, alpha_kf, dynamic=True, cost=0.0)
eq_st_g, st_st_g = backtest(np.full(len(ewa), beta_static),
                            np.full(len(ewa), alpha_static),
                            dynamic=False, cost=0.0)

rows = pd.DataFrame([st_kf, st_st, st_kf_g, st_st_g],
                    index=["Kalman (10bp)", "static (10bp)",
                           "Kalman (gross)", "static (gross)"])
rows.style.format({"ann_ret": "{:.2%}", "ann_vol": "{:.2%}", "sharpe": "{:.2f}",
                   "max_dd": "{:.2%}"})"""),
        md("""## Takeaways

- A hedge ratio is an estimate of a *relationship*, and relationships drift —
  the Kalman filter models the drift instead of averaging over it.
- Five lines of linear algebra (predict, innovate, gain, update, covariance)
  replace a window size with a forgetting rate; delta is the only real knob.
- The rolling OLS lags by construction: equal weights inside the window, a
  cliff at its edge. The filter's exponential weighting has neither problem.
- On EWA/EWC the Kalman spread is the better signal (gross Sharpe 0.55 vs 0.47,
  half the drawdown) but the costlier one to trade: at 10 bp its ~2.7× turnover
  flips the net ranking. Estimation quality and implementability are different
  axes — a backtest that only reports one of them is hiding the other.
- Delta and R were set to textbook values, not tuned on this sample. Tune them
  and you are back in backtest-overfitting territory (see the pairs-trading
  tutorial's caveats).

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    print(f"static beta={beta_static:.4f} alpha={alpha_static:.4f} ADFp={adf_p:.4f}")
    print(f"kalman beta range [{kf_trade.min():.3f}, {kf_trade.max():.3f}] last={beta_kf[-1]:.3f}")
    print(f"rolling beta range [{roll_trade.min():.3f}, {roll_trade.max():.3f}]")
    print(f"kalman net:   {st_kf}")
    print(f"static net:   {st_st}")
    print(f"kalman gross: {st_kf_g}")
    print(f"static gross: {st_st_g}")


if __name__ == "__main__":
    main()
