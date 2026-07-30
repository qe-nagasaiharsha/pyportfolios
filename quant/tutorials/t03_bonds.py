"""
T03 - Bond Pricing, Duration & Convexity (topic card 03/16).
Assets: US Treasuries (2y-30y) + SHY / IEF / TLT (iShares) · Timeframe: static
pricing + calendar year 2022 · Libs: NumPy Pandas Matplotlib yfinance.

Builds a semi-annual bond pricer from scratch, computes Macaulay/modified
duration and convexity (analytic + finite difference), runs the +-100bp /
+-200bp stress table, then the 2022 case: the yield-curve shift and the
SHY/IEF/TLT drawdowns that made duration THE risk factor of the year.
Emits the article data module + the runnable notebook.

Note: the cached Yahoo yield indices (^IRX ^FVX ^TNX ^TYX) are already in
percent (e.g. ^TNX = 1.434 on 2021-12-01 == 1.434%).
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts  # noqa: E402

SLUG = "bond-pricing-duration-convexity"

FACE = 100.0
COUPON = 0.04   # 4% annual coupon
MATURITY = 10   # years
FREQ = 2        # semi-annual
YTM0 = 0.04     # pricing yield (par bond)


# ------------------------------------------------------------- the pricer --

def bond_price(ytm: float, coupon: float = COUPON, maturity: float = MATURITY,
               freq: int = FREQ, face: float = FACE) -> float:
    """Price a fixed-coupon bond from its yield to maturity."""
    n = int(round(maturity * freq))
    i = ytm / freq
    c = coupon * face / freq
    t = np.arange(1, n + 1)
    cf = np.full(n, c)
    cf[-1] += face
    return float(np.sum(cf / (1 + i) ** t))


def duration_convexity(ytm: float, coupon: float = COUPON, maturity: float = MATURITY,
                       freq: int = FREQ, face: float = FACE) -> tuple[float, float, float]:
    """Analytic Macaulay duration (years), modified duration, convexity (years^2)."""
    n = int(round(maturity * freq))
    i = ytm / freq
    c = coupon * face / freq
    t = np.arange(1, n + 1)
    cf = np.full(n, c)
    cf[-1] += face
    pv = cf / (1 + i) ** t
    price = pv.sum()
    mac = float(np.sum((t / freq) * pv) / price)
    mod = mac / (1 + i)
    conv = float(np.sum(t * (t + 1) * pv) / (price * (1 + i) ** 2 * freq**2))
    return mac, mod, conv


def main() -> None:
    # --- 1 · analytic vs finite-difference risk measures -------------------
    p0 = bond_price(YTM0)
    mac, mod, conv = duration_convexity(YTM0)

    h = 1e-4  # 1bp bump
    p_up, p_dn = bond_price(YTM0 + h), bond_price(YTM0 - h)
    fd_dur = -(p_up - p_dn) / (2 * h * p0)
    fd_conv = (p_up - 2 * p0 + p_dn) / (h**2 * p0)

    # --- 2 · price/yield curve with the duration tangent at 4% -------------
    y_grid = np.arange(0.01, 0.0825, 0.0025)  # 1% .. 8% in 25bp steps
    prices = np.array([bond_price(y) for y in y_grid])
    tangent = p0 * (1 - mod * (y_grid - YTM0))
    grid_pct = y_grid * 100
    x_frac = lambda v: round((v - grid_pct[0]) / (grid_pct[-1] - grid_pct[0]), 4)  # noqa: E731
    py_xlabels = [[x_frac(v), f"{v:.0f}%"] for v in (1, 2, 3, 4, 5, 6, 7, 8)]

    # --- 3 · stress table: duration-only vs +convexity vs full repricing ---
    stress_rows = []
    for bp in (-200, -100, 100, 200):
        dy = bp / 1e4
        full = (bond_price(YTM0 + dy) / p0 - 1) * 100
        dur_only = -mod * dy * 100
        dur_conv = (-mod * dy + 0.5 * conv * dy**2) * 100
        stress_rows.append({
            "bp": bp,
            "durOnly": r(dur_only, 2),
            "durConv": r(dur_conv, 2),
            "full": r(full, 2),
            "convexityGain": r(full - dur_only, 2),
        })

    # --- 4 · the 2022 case: curve shift + ETF total returns ----------------
    yields = load("t03_bonds_yields")  # percent already (^TNX 1.434 == 1.434%)
    etf = load("t03_bonds_etf")

    jan_date, dec_date = "2022-01-03", "2022-12-30"
    curve_cols = ["^IRX", "^FVX", "^TNX", "^TYX"]  # 13w, 5y, 10y, 30y
    jan_curve = yields.loc[jan_date, curve_cols].astype(float)
    dec_curve = yields.loc[dec_date, curve_cols].astype(float)

    # normalise to 100 at the last 2021 close so 2022 is a clean calendar year
    base_date = etf.loc[:"2021-12-31"].index[-1]
    px22 = etf.loc[base_date:"2022-12-31"]
    norm = px22 / px22.iloc[0] * 100
    totals = {c: r(float(norm[c].iloc[-1] / 100 - 1), 4) for c in ("SHY", "IEF", "TLT")}

    n22 = len(norm)
    month_marks = []
    for m in (1, 4, 7, 10):
        pos = norm.index.searchsorted(pd.Timestamp(f"2022-{m:02d}-01"))
        if 0 <= pos < n22:
            month_marks.append([round(pos / (n22 - 1), 4), pd.Timestamp(f"2022-{m:02d}-01").strftime("%b")])

    # --- 5 · empirical durations: ETF returns regressed on 10y dY ----------
    rets = etf.pct_change().dropna()
    dy10 = (yields["^TNX"] / 100).diff().dropna()  # decimal yield changes
    common = rets.index.intersection(dy10.index)
    common = common[(common >= pd.Timestamp("2022-01-01")) & (common <= pd.Timestamp("2022-12-31"))]
    emp_rows = []
    for c in ("SHY", "IEF", "TLT"):
        x, yv = dy10.loc[common].values, rets.loc[common, c].values
        beta, alpha = np.polyfit(x, yv, 1)
        r2 = float(np.corrcoef(x, yv)[0, 1] ** 2)
        emp_rows.append({
            "etf": c,
            "empiricalDuration": r(float(-beta), 2),
            "r2": r(r2, 2),
            "total2022": totals[c],
        })

    payload = {
        "bond": {
            "face": FACE, "coupon": COUPON, "maturity": MATURITY, "freq": FREQ,
            "ytm": YTM0, "price": r(p0, 4),
            "macaulay": r(mac, 4), "modified": r(mod, 4), "convexity": r(conv, 4),
            "fdDuration": r(fd_dur, 4), "fdConvexity": r(fd_conv, 4),
        },
        "priceYield": {
            "yPct": r(list(grid_pct), 2),
            "price": r(list(prices), 2),
            "tangent": r(list(tangent), 2),
            "xLabels": py_xlabels,
            "parFrac": x_frac(YTM0 * 100),
        },
        "stress": {"rows": stress_rows},
        "curve2022": {
            "labels": ["3m", "5y", "10y", "30y"],
            "maturities": [0.25, 5, 10, 30],
            "jan": r(list(jan_curve.values), 2),
            "dec": r(list(dec_curve.values), 2),
            "janDate": jan_date, "decDate": dec_date,
        },
        "etf2022": {
            "shy": downsample(norm["SHY"].values, 260),
            "ief": downsample(norm["IEF"].values, 260),
            "tlt": downsample(norm["TLT"].values, 260),
            "xLabels": month_marks,
            "totals": totals,
            "nDays": int(n22),
        },
        "empirical": {"rows": emp_rows},
    }
    ts = write_ts(SLUG, payload)

    # ------------------------------------------------------------ notebook --
    cells = [
        md("""# Bond Pricing, Duration & Convexity

**pyportfolios.com tutorial T03** · US Treasuries (2y–30y) + SHY / IEF / TLT · static pricing + calendar year 2022 · NumPy · Pandas · Matplotlib · yfinance

Duration is the single number that explains most of what happened to every bond
portfolio in 2022. In this notebook we

1. build a bond pricer from scratch (price from yield, semi-annual coupons),
2. compute Macaulay/modified duration and convexity — analytically and by finite difference,
3. draw the price/yield curve and the duration tangent for a 10y 4% bond,
4. run the ±100bp / ±200bp stress table every risk report contains, and
5. replay 2022: the yield-curve shift and what it did to SHY, IEF, and TLT."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf

plt.rcParams["figure.figsize"] = (10, 5)"""),
        md("""## 1 · A bond pricer from scratch

A fixed-coupon bond is a schedule of cashflows: `2 × maturity` semi-annual coupons of
`coupon × face / 2`, plus the face value at maturity. Price is just the present value
of that schedule, discounted at the (semi-annually compounded) yield to maturity:

$$P(y) = \\sum_{t=1}^{2T} \\frac{CF_t}{(1 + y/2)^t}$$"""),
        code("""FACE, FREQ = 100.0, 2

def bond_price(ytm, coupon=0.04, maturity=10, freq=FREQ, face=FACE):
    n = int(round(maturity * freq))
    i = ytm / freq
    c = coupon * face / freq
    t = np.arange(1, n + 1)
    cf = np.full(n, c)
    cf[-1] += face
    return float(np.sum(cf / (1 + i) ** t))

print(f"10y 4% bond at 4.00% yield: {bond_price(0.04):.4f}   (par, as it must be)")
print(f"10y 4% bond at 5.00% yield: {bond_price(0.05):.4f}")
print(f"10y 4% bond at 3.00% yield: {bond_price(0.03):.4f}")"""),
        md("""## 2 · Duration & convexity — analytic and finite difference

**Macaulay duration** is the PV-weighted average time to cashflow (in years);
**modified duration** `D = Mac / (1 + y/2)` is the first-order price sensitivity
`dP/P ≈ −D·dy`. **Convexity** is the second-order term. We compute both from the
closed-form sums, then verify with a 1bp finite-difference bump — if the two
disagree, the pricer is wrong."""),
        code("""def duration_convexity(ytm, coupon=0.04, maturity=10, freq=FREQ, face=FACE):
    n = int(round(maturity * freq))
    i = ytm / freq
    c = coupon * face / freq
    t = np.arange(1, n + 1)
    cf = np.full(n, c)
    cf[-1] += face
    pv = cf / (1 + i) ** t
    price = pv.sum()
    mac  = np.sum((t / freq) * pv) / price
    mod  = mac / (1 + i)
    conv = np.sum(t * (t + 1) * pv) / (price * (1 + i) ** 2 * freq**2)
    return mac, mod, conv

mac, mod, conv = duration_convexity(0.04)
p0 = bond_price(0.04)

h = 1e-4  # 1bp
fd_dur  = -(bond_price(0.04 + h) - bond_price(0.04 - h)) / (2 * h * p0)
fd_conv = (bond_price(0.04 + h) - 2 * p0 + bond_price(0.04 - h)) / (h**2 * p0)

print(f"Macaulay duration : {mac:.4f} years")
print(f"Modified duration : {mod:.4f}   (finite diff {fd_dur:.4f})")
print(f"Convexity         : {conv:.4f}   (finite diff {fd_conv:.4f})")"""),
        md("""## 3 · The price/yield curve and the duration tangent

Duration is the slope of the price/yield curve at the current yield — a tangent line.
The curve itself bows *above* that tangent everywhere: that bow is convexity, and it
works in the holder's favour in both directions."""),
        code("""y_grid = np.arange(0.01, 0.0825, 0.0025)
prices  = np.array([bond_price(y) for y in y_grid])
tangent = p0 * (1 - mod * (y_grid - 0.04))

plt.plot(y_grid * 100, prices, lw=2, label="full repricing P(y)")
plt.plot(y_grid * 100, tangent, "--", lw=1.5, label="duration tangent at 4%")
plt.scatter([4], [p0], zorder=5, color="k")
plt.xlabel("yield to maturity (%)"); plt.ylabel("price")
plt.title("10y 4% coupon bond — price vs yield"); plt.legend();"""),
        md("""## 4 · The ±100bp / ±200bp stress table

The stress table in every fixed-income risk report, three ways: duration-only
(`−D·Δy`), duration + convexity (`−D·Δy + ½·C·Δy²`), and full repricing (the truth).
Duration-only is symmetric; the truth is not — it loses less and gains more."""),
        code("""rows = []
for bp in (-200, -100, 100, 200):
    dy = bp / 1e4
    full     = (bond_price(0.04 + dy) / p0 - 1) * 100
    dur_only = -mod * dy * 100
    dur_conv = (-mod * dy + 0.5 * conv * dy**2) * 100
    rows.append([bp, dur_only, dur_conv, full, full - dur_only])

pd.DataFrame(rows, columns=["shock (bp)", "duration only %", "dur + convexity %",
                            "full repricing %", "convexity gain %"]).round(2)"""),
        md("""## 5 · 2022 — the year the tangent moved

Now the real thing. Yahoo's Treasury yield indices (^IRX 13-week, ^FVX 5y, ^TNX 10y,
^TYX 30y, quoted in percent) give us the curve at the start and end of 2022 — the
fastest tightening cycle in four decades."""),
        code("""ylds = yf.download(["^IRX", "^FVX", "^TNX", "^TYX"],
                   start="2021-12-01", end="2023-01-10",
                   auto_adjust=True, progress=False)["Close"]

mats  = [0.25, 5, 10, 30]
cols  = ["^IRX", "^FVX", "^TNX", "^TYX"]
jan, dec = ylds.loc["2022-01-03", cols], ylds.loc["2022-12-30", cols]

plt.plot(mats, jan.values, "o-", label="3 Jan 2022")
plt.plot(mats, dec.values, "o-", label="30 Dec 2022")
plt.xlabel("maturity (years)"); plt.ylabel("yield (%)")
plt.title("US Treasury curve — start vs end of 2022"); plt.legend()

pd.DataFrame({"3 Jan 2022": jan.values, "30 Dec 2022": dec.values,
              "shift (bp)": (dec.values - jan.values) * 100}, index=mats).round(2)"""),
        md("""## 6 · Duration as THE risk factor: SHY vs IEF vs TLT

Three iShares Treasury ETFs, one design variable — duration (~1.9y / ~7.5y / ~17.5y).
Same issuer (the US government), same credit risk, same year. Normalised to 100 at the
end of 2021, the 2022 total-return paths separate purely on duration."""),
        code("""px = yf.download(["SHY", "IEF", "TLT"], start="2021-12-01", end="2023-01-10",
                 auto_adjust=True, progress=False)["Close"]

base = px.loc[:"2021-12-31"].index[-1]
norm = px.loc[base:"2022-12-31"]
norm = norm / norm.iloc[0] * 100

norm.plot(title="2022 total return, normalised to 100 (adjusted closes)")
plt.axhline(100, color="k", lw=0.7)

for c in ["SHY", "IEF", "TLT"]:
    print(f"{c}: {norm[c].iloc[-1] / 100 - 1:+.1%} in 2022")"""),
        md("""## 7 · Empirical duration — read it off the tape

Regress each ETF's daily return on the daily change in the 10y yield (in decimal).
The negative of the slope is the *empirical* duration with respect to the 10y point —
the market's own answer to "how long is this fund?"."""),
        code("""rets = px.pct_change().dropna()
dy10 = (ylds["^TNX"] / 100).diff().dropna()
common = rets.index.intersection(dy10.index)
common = common[(common >= "2022-01-01") & (common <= "2022-12-31")]

for c in ["SHY", "IEF", "TLT"]:
    beta, alpha = np.polyfit(dy10.loc[common], rets.loc[common, c], 1)
    r2 = np.corrcoef(dy10.loc[common], rets.loc[common, c])[0, 1] ** 2
    print(f"{c}: empirical duration = {-beta:5.2f}y   R² = {r2:.2f}")"""),
        md("""## Takeaways

- A bond pricer is ~10 lines: discount the cashflow schedule at `y/2` per period.
- Analytic duration/convexity match a 1bp finite-difference bump to 4 decimals —
  always run that cross-check.
- Duration is a tangent line: good for ±100bp, visibly optimistic-pessimistic
  asymmetric beyond that. Convexity closes most of the gap at ±200bp.
- 2022 in one sentence: the curve shifted up ~350–430bp and portfolios lost
  (roughly) duration × shift — ~4% at the short end, ~30% at the long end.
- Empirical (regression) duration recovers the fund's stated duration from
  returns alone — the cleanest evidence that duration is *the* risk factor.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)

    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    print(f"price={p0:.4f} mac={mac:.4f} mod={mod:.4f} conv={conv:.4f} (fd {fd_dur:.4f}/{fd_conv:.4f})")
    print("stress:", stress_rows)
    print("curve jan:", list(jan_curve.round(2)), "dec:", list(dec_curve.round(2)))
    print("totals 2022:", totals)
    print("empirical:", emp_rows)


if __name__ == "__main__":
    main()
