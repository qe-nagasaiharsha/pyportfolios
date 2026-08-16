"""
T02 - Black-Scholes & the Greeks (topic card 02/16).
Assets: QQQ options (Nasdaq 100 ETF, Invesco) · Timeframe: Jan 2018 - Dec 2024,
trailing 1y vol · Libs: NumPy SciPy Matplotlib.

Prices QQQ options analytically with trailing realized vol as sigma (no live
option-chain data), computes all five Greeks, checks put-call parity, and
demonstrates the implied-vol inversion. Emits the article data module + the
runnable notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from scipy.optimize import brentq
from scipy.stats import norm

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "black-scholes-and-the-greeks"
SEED = 42          # no RNG needed — everything here is closed-form — kept for convention
RF = 0.04          # flat risk-free rate used throughout
T_1Y = 1.0
WINDOW = 252       # trailing realized-vol window


# ---------------------------------------------------------------- pricing --

def d1_d2(s, k, t, rf, sigma):
    d1 = (np.log(s / k) + (rf + 0.5 * sigma**2) * t) / (sigma * np.sqrt(t))
    return d1, d1 - sigma * np.sqrt(t)


def bs_price(s, k, t, rf, sigma, kind="call"):
    d1, d2 = d1_d2(s, k, t, rf, sigma)
    if kind == "call":
        return s * norm.cdf(d1) - k * np.exp(-rf * t) * norm.cdf(d2)
    return k * np.exp(-rf * t) * norm.cdf(-d2) - s * norm.cdf(-d1)


def bs_greeks(s, k, t, rf, sigma, kind="call"):
    """delta, gamma, vega (per 1.00 vol), theta (per year), rho (per 1.00 rate)."""
    d1, d2 = d1_d2(s, k, t, rf, sigma)
    pdf = norm.pdf(d1)
    delta = norm.cdf(d1) if kind == "call" else norm.cdf(d1) - 1.0
    gamma = pdf / (s * sigma * np.sqrt(t))
    vega = s * pdf * np.sqrt(t)
    if kind == "call":
        theta = -s * pdf * sigma / (2 * np.sqrt(t)) - rf * k * np.exp(-rf * t) * norm.cdf(d2)
        rho = k * t * np.exp(-rf * t) * norm.cdf(d2)
    else:
        theta = -s * pdf * sigma / (2 * np.sqrt(t)) + rf * k * np.exp(-rf * t) * norm.cdf(-d2)
        rho = -k * t * np.exp(-rf * t) * norm.cdf(-d2)
    return delta, gamma, vega, theta, rho


def implied_vol(price, s, k, t, rf, kind="call"):
    return brentq(lambda sig: bs_price(s, k, t, rf, sig, kind) - price, 1e-4, 5.0, xtol=1e-10)


# ------------------------------------------------------------------- main --

def main() -> None:
    px_full = load("t02_black_scholes")["QQQ"].dropna()
    logret = np.log(px_full / px_full.shift(1)).dropna()

    # trailing 1y realized vol (the extra 2017 year exists exactly for this)
    vol_full = logret.rolling(WINDOW).std(ddof=1) * np.sqrt(252)

    px = px_full.loc["2018-01-01":]
    vol = vol_full.loc[px.index].dropna()
    px = px.loc[vol.index]  # align: both start at the first date with a full window

    s0 = float(px.iloc[-1])
    sigma = float(vol.iloc[-1])
    k_atm = s0

    # --- (e) ATM 1y call: price, all five Greeks, put-call parity ---------
    c_atm = float(bs_price(s0, k_atm, T_1Y, RF, sigma, "call"))
    p_atm = float(bs_price(s0, k_atm, T_1Y, RF, sigma, "put"))
    delta, gamma, vega, theta, rho = (float(g) for g in bs_greeks(s0, k_atm, T_1Y, RF, sigma, "call"))
    parity_lhs = c_atm - p_atm
    parity_rhs = s0 - k_atm * np.exp(-RF * T_1Y)
    parity_gap = abs(parity_lhs - parity_rhs)

    # implied-vol round trip: invert the ATM price back to sigma
    iv_recovered = float(implied_vol(c_atm, s0, k_atm, T_1Y, RF))
    # and what a 1-vol-pt repricing does (the vega check)
    c_up1pt = float(bs_price(s0, k_atm, T_1Y, RF, sigma + 0.01, "call"))

    # --- (b) call/put price vs strike, moneyness 0.7-1.3 ------------------
    m = np.linspace(0.7, 1.3, 61)
    strikes = m * s0
    call_k = bs_price(s0, strikes, T_1Y, RF, sigma, "call")
    put_k = bs_price(s0, strikes, T_1Y, RF, sigma, "put")

    # --- (c) delta & gamma vs moneyness ------------------------------------
    # vega and theta come along too: the article's Greeks figure shows all four
    # across strikes, and it is drawn from this payload rather than shipped as
    # a static image.
    delta_m, gamma_m, vega_m, theta_m, _ = bs_greeks(s0, strikes, T_1Y, RF, sigma, "call")
    vega_m_pt = vega_m / 100.0        # per vol point
    theta_m_day = theta_m / 365.0     # per calendar day

    # --- (d) vega & theta vs maturity for the ATM strike --------------------
    mats = np.linspace(0.05, 2.0, 40)
    _, _, vega_t, theta_t, _ = bs_greeks(s0, k_atm, mats, RF, sigma, "call")
    vega_t_pt = vega_t / 100.0        # per vol point
    theta_t_day = theta_t / 365.0     # per calendar day

    # --- (d2) call value vs maturity, ATM and 5% OTM -----------------------
    # the decay figure: both curves fall toward zero, steepening near expiry
    call_atm_t = bs_price(s0, k_atm, mats, RF, sigma, "call")
    call_otm_t = bs_price(s0, k_atm * 1.05, mats, RF, sigma, "call")

    # --- (a supplement) the ATM 1y call priced through time ----------------
    # each day: spot + that day's trailing vol -> today's cost of 1y ATM insurance
    call_ts = bs_price(px.values, px.values, T_1Y, RF, vol.values, "call") / px.values  # as % of spot

    # vol regime stats for the prose
    v_hi_i, v_lo_i = int(np.argmax(vol.values)), int(np.argmin(vol.values))

    payload = {
        "params": {
            "start": str(px.index[0].date()), "end": str(px.index[-1].date()),
            "nObs": int(len(px)), "s0": r(s0, 2), "rf": RF, "T": T_1Y,
            "window": WINDOW, "sigma": r(sigma), "seed": SEED,
        },
        "history": {
            "price": downsample(px.values, 260),
            "vol": downsample(vol.values, 260),
            "callPctSpot": downsample(call_ts * 100, 260),
            "xLabels": [[f, l] for f, l in year_labels(px.index, 1)],
            "volHi": {"v": r(float(vol.iloc[v_hi_i])), "date": str(vol.index[v_hi_i].date())},
            "volLo": {"v": r(float(vol.iloc[v_lo_i])), "date": str(vol.index[v_lo_i].date())},
        },
        "ladder": {
            "m": r(list(m)),
            "call": r(list(call_k), 2),
            "put": r(list(put_k), 2),
        },
        "greeksCurve": {
            "m": r(list(m)),
            "delta": r(list(delta_m)),
            "gamma": r(list(gamma_m), 6),
            "vegaPt": r(list(vega_m_pt), 3),
            "thetaDay": r(list(theta_m_day), 4),
        },
        "maturity": {
            "t": r(list(mats)),
            "vegaPt": r(list(vega_t_pt), 3),
            "thetaDay": r(list(theta_t_day), 4),
            "callAtm": r(list(call_atm_t), 2),
            "callOtm5": r(list(call_otm_t), 2),
        },
        "atm": {
            "call": r(c_atm, 2), "put": r(p_atm, 2),
            "delta": r(delta), "gamma": r(gamma, 6),
            "vegaPt": r(vega / 100.0, 3), "thetaDay": r(theta / 365.0, 4),
            "rhoPt": r(rho / 100.0, 3),
            "vegaRaw": r(vega, 2), "thetaYear": r(theta, 2), "rhoRaw": r(rho, 2),
            "parityLhs": r(parity_lhs, 4), "parityRhs": r(parity_rhs, 4),
            "parityGap": r(parity_gap, 10),
            "ivRecovered": r(iv_recovered, 6),
            "callUp1pt": r(c_up1pt, 2),
        },
    }
    ts = write_ts(SLUG, payload)

    # ------------------------------------------------------------ notebook --
    cells = [
        md(f"""# Black–Scholes & the Greeks

**pyportfolios.com tutorial T02** · QQQ options, Jan 2018 – Dec 2024 · NumPy · SciPy · Matplotlib

Black–Scholes is the pricing engine of the listed-options market — not because anyone
believes its assumptions, but because it is the *coordinate system* the market quotes in.
In this notebook we

1. compute trailing 1y realized volatility for QQQ (Invesco's Nasdaq-100 ETF),
2. implement the Black–Scholes price and **all five Greeks** from scratch,
3. price calls and puts across the strike ladder and check put–call parity,
4. read the Greeks as a hedging dashboard (delta/gamma across strikes, vega/theta across maturities),
5. invert the formula — implied volatility, the number the market actually trades."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from scipy.stats import norm
from scipy.optimize import brentq

plt.rcParams["figure.figsize"] = (10, 5)
RF = 0.04          # flat risk-free rate for the whole notebook"""),
        md("""## 1 · Volatility from the tape

Black–Scholes needs one non-observable input: σ. With no option chain in hand we use the
*trailing 252-day realized vol* of QQQ — the classic first estimate a desk reaches for.
We download from 2017 so the rolling window is full from January 2018."""),
        code("""px = yf.download("QQQ", start="2017-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"].squeeze().dropna()
logret = np.log(px / px.shift(1)).dropna()

vol = (logret.rolling(252).std(ddof=1) * np.sqrt(252)).loc["2018-01-01":].dropna()
px = px.loc[vol.index]

fig, ax = plt.subplots(2, 1, sharex=True, figsize=(10, 7))
px.plot(ax=ax[0], title="QQQ adjusted close")
vol.plot(ax=ax[1], title="Trailing 1y realized vol", color="darkred")
ax[1].yaxis.set_major_formatter(lambda v, _: f"{v:.0%}");

s0, sigma = float(px.iloc[-1]), float(vol.iloc[-1])
print(f"spot = {s0:.2f}   trailing vol = {sigma:.1%}")"""),
        md("""## 2 · The pricing engine

Everything funnels through the two standardized distances
$d_1 = \\frac{\\ln(S/K) + (r + \\sigma^2/2)T}{\\sigma\\sqrt T}$, $d_2 = d_1 - \\sigma\\sqrt T$.
The Greeks are the analytic partial derivatives — no finite differences, no loops,
and every function is NumPy-vectorized over strikes and maturities."""),
        code("""def d1_d2(s, k, t, rf, sigma):
    d1 = (np.log(s / k) + (rf + 0.5 * sigma**2) * t) / (sigma * np.sqrt(t))
    return d1, d1 - sigma * np.sqrt(t)

def bs_price(s, k, t, rf, sigma, kind="call"):
    d1, d2 = d1_d2(s, k, t, rf, sigma)
    if kind == "call":
        return s * norm.cdf(d1) - k * np.exp(-rf * t) * norm.cdf(d2)
    return k * np.exp(-rf * t) * norm.cdf(-d2) - s * norm.cdf(-d1)

def bs_greeks(s, k, t, rf, sigma, kind="call"):
    \"\"\"delta, gamma, vega (per 1.00 vol), theta (per year), rho (per 1.00 rate).\"\"\"
    d1, d2 = d1_d2(s, k, t, rf, sigma)
    pdf = norm.pdf(d1)
    delta = norm.cdf(d1) if kind == "call" else norm.cdf(d1) - 1.0
    gamma = pdf / (s * sigma * np.sqrt(t))
    vega  = s * pdf * np.sqrt(t)
    if kind == "call":
        theta = -s * pdf * sigma / (2 * np.sqrt(t)) - rf * k * np.exp(-rf * t) * norm.cdf(d2)
        rho   =  k * t * np.exp(-rf * t) * norm.cdf(d2)
    else:
        theta = -s * pdf * sigma / (2 * np.sqrt(t)) + rf * k * np.exp(-rf * t) * norm.cdf(-d2)
        rho   = -k * t * np.exp(-rf * t) * norm.cdf(-d2)
    return delta, gamma, vega, theta, rho"""),
        md("""## 3 · The strike ladder & put–call parity

Price 1y calls and puts across moneyness 0.7–1.3 at today's spot and vol. The parity
identity $C - P = S - Ke^{-rT}$ holds to machine precision — if it doesn't, the
implementation is wrong. It is the cheapest unit test in quantitative finance."""),
        code("""T = 1.0
m = np.linspace(0.7, 1.3, 61)
K = m * s0
calls, puts = bs_price(s0, K, T, RF, sigma, "call"), bs_price(s0, K, T, RF, sigma, "put")

plt.plot(m, calls, label="call"); plt.plot(m, puts, label="put")
plt.axvline(1.0, ls="--", lw=1, color="grey")
plt.xlabel("moneyness K / S"); plt.ylabel("price ($)")
plt.legend(); plt.title("1y QQQ option prices across strikes");

gap = np.abs((calls - puts) - (s0 - K * np.exp(-RF * T))).max()
print(f"max |C - P - (S - K e^-rT)| = {gap:.2e}   (machine precision)")"""),
        md("""## 4 · The Greeks as a hedging dashboard

**Delta** is the hedge ratio and a rough moneyness gauge; **gamma** is how fast that hedge
goes stale — it peaks near the money, which is where hedging costs live. For the ATM 1y
call we print the full dashboard a desk would quote."""),
        code("""delta, gamma_, vega, theta, rho = bs_greeks(s0, K, T, RF, sigma, "call")

fig, ax1 = plt.subplots()
ax1.plot(m, delta, label="delta")
ax2 = ax1.twinx()
ax2.plot(m, gamma_, color="darkred", label="gamma")
ax1.set_xlabel("moneyness K / S"); ax1.set_ylabel("delta"); ax2.set_ylabel("gamma")
ax1.set_title("Delta & gamma across strikes (1y)");

d0, g0, v0, t0, r0 = bs_greeks(s0, s0, T, RF, sigma, "call")
c0 = bs_price(s0, s0, T, RF, sigma, "call")
print(f"ATM 1y call     = {c0:8.2f}")
print(f"delta           = {d0:8.4f}   (shares to short per call)")
print(f"gamma           = {g0:8.6f}   (delta drift per $1 spot move)")
print(f"vega / vol pt   = {v0/100:8.3f}   ($ per 1 vol point)")
print(f"theta / day     = {t0/365:8.4f}   ($ decay per calendar day)")
print(f"rho / rate pt   = {r0/100:8.3f}   ($ per 1% rate move)")"""),
        md("""## 5 · Vega and theta across maturities

For the ATM strike, vega grows like $\\sqrt T$ — long-dated options are volatility
instruments — while per-day theta explodes as expiry approaches: the shorter the option,
the faster the clock. This trade-off *is* the term-structure decision every options
book makes."""),
        code("""mats = np.linspace(0.05, 2.0, 40)
_, _, vega_t, theta_t, _ = bs_greeks(s0, s0, mats, RF, sigma, "call")

fig, ax1 = plt.subplots()
ax1.plot(mats, vega_t / 100, label="vega / vol pt")
ax2 = ax1.twinx()
ax2.plot(mats, theta_t / 365, color="darkred", label="theta / day")
ax1.set_xlabel("maturity (years)"); ax1.set_ylabel("vega per vol pt ($)")
ax2.set_ylabel("theta per day ($)")
ax1.set_title("ATM vega & theta vs maturity");"""),
        md("""## 6 · Implied volatility — the market's language

Nobody quotes option prices in dollars on a trading desk; they quote the σ that makes
Black–Scholes reproduce the dollar price. Inverting the formula is a 1-D root-finding
problem (the price is monotonic in σ, so Brent's method is bulletproof). The round trip
recovers our input vol to 10 decimal places."""),
        code("""def implied_vol(price, s, k, t, rf, kind="call"):
    return brentq(lambda sig: bs_price(s, k, t, rf, sig, kind) - price, 1e-4, 5.0,
                  xtol=1e-10)

c0 = bs_price(s0, s0, T, RF, sigma, "call")
iv = implied_vol(c0, s0, s0, T, RF)
print(f"input sigma     = {sigma:.10f}")
print(f"recovered sigma = {iv:.10f}")

# the vega check: +1 vol pt should move the price by ~vega/100
c_up = bs_price(s0, s0, T, RF, sigma + 0.01, "call")
_, _, v0, _, _ = bs_greeks(s0, s0, T, RF, sigma, "call")
print(f"price(+1 vol pt) - price = {c_up - c0:.3f}   vs vega/100 = {v0/100:.3f}")"""),
        md("""## Takeaways

- Five NumPy lines price the option; five more give the entire Greek dashboard analytically.
- Put–call parity holds to machine precision — always run this test before trusting a pricer.
- Delta is the hedge, gamma the hedge's decay, vega the vol exposure, theta the rent you
  pay for gamma, rho the (usually ignorable) rate leg.
- Implied vol is Black–Scholes read backwards — the formula survives as the market's
  quoting convention, not as a model anyone believes.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    print(
        f"s0={s0:.2f} sigma={sigma:.4f} C={c_atm:.2f} P={p_atm:.2f} "
        f"delta={delta:.4f} gamma={gamma:.6f} vega/pt={vega/100:.3f} "
        f"theta/day={theta/365:.4f} rho/pt={rho/100:.3f} parity_gap={parity_gap:.2e} "
        f"iv_roundtrip={iv_recovered:.6f}"
    )


if __name__ == "__main__":
    main()
