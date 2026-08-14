"""
QI04 - Heston vs Black-Scholes: fitting the vol smile (topic card 04/16).
Libs: QuantLib SciPy NumPy.

Reproduces Louis's QI4_Heston_vs_BlackScholes notebook and emits the article
data module + the runnable companion notebook.

Two things to know about this one:

  * The nine target implied vols are a REPRESENTATIVE SPX-style 3M skew, not
    quotes from a live chain. That is the source notebook's own choice and it
    says so ("we use a representative parametric skew so the notebook runs
    without a live option-chain subscription"). Everything downstream - the
    fitted parameters, the recovered smile, every error figure - is genuine
    optimiser output computed from that curve.

  * quant/data/qi04_heston.csv (SPY / ^SPX closes, fetched for this topic) is
    NOT used. The source notebook does not touch the underlying, and the
    article follows it verbatim. The file stays pinned for whenever a version
    that needs the underlying is written.

The article prose is the notebook's markdown, carried over verbatim, so the
section structure here (1 disagreement / 2 contenders / 3 test / 4 scoreboard
/ 5 verdict) is the notebook's, not the site's usual six-part house format.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, md, r, write_nb, write_ts  # noqa: E402

SLUG = "heston-vs-black-scholes"

# --- calibration setup (mirrors the source notebook exactly) ---------------
S0, T, RF, DIV = 100.0, 0.25, 0.03, 0.0
MONEYNESS = np.array([0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20])
MKT_IV = np.array([0.32, 0.285, 0.255, 0.228, 0.205, 0.192, 0.188, 0.191, 0.198])
X0 = [0.042, 2.0, 0.045, 0.8, -0.7]                      # v0, kappa, theta, xi, rho
LO = [0.005, 0.5, 0.005, 0.05, -0.95]
HI = [0.25, 8.0, 0.25, 2.0, -0.05]


def build_calibration() -> dict:
    import QuantLib as ql
    from scipy.optimize import least_squares

    today = ql.Date(15, 6, 2024)
    ql.Settings.instance().evaluationDate = today
    day_count = ql.Actual365Fixed()
    calendar = ql.NullCalendar()

    strikes = MONEYNESS * S0
    spot_h = ql.QuoteHandle(ql.SimpleQuote(S0))
    r_ts = ql.YieldTermStructureHandle(ql.FlatForward(today, RF, day_count))
    q_ts = ql.YieldTermStructureHandle(ql.FlatForward(today, DIV, day_count))
    expiry = today + ql.Period(3, ql.Months)

    def heston_ivs(params):
        v0, kappa, theta, xi, rho = params
        proc = ql.HestonProcess(r_ts, q_ts, spot_h, v0, kappa, theta, xi, rho)
        eng = ql.AnalyticHestonEngine(ql.HestonModel(proc))
        bsm = ql.BlackScholesMertonProcess(
            spot_h, q_ts, r_ts,
            ql.BlackVolTermStructureHandle(
                ql.BlackConstantVol(today, calendar, 0.20, day_count)))
        out = []
        for k in strikes:
            opt = ql.VanillaOption(ql.PlainVanillaPayoff(ql.Option.Call, k),
                                   ql.EuropeanExercise(expiry))
            opt.setPricingEngine(eng)
            try:
                out.append(opt.impliedVolatility(opt.NPV(), bsm))
            except Exception:
                out.append(np.nan)
        return np.array(out)

    # xtol/ftol carried over from the source notebook for fidelity. Measured:
    # they make no difference to this fit (identical to 10 dp with SciPy's
    # defaults) - the residual is smooth and converges well inside both.
    res = least_squares(lambda p: np.nan_to_num(heston_ivs(p) - MKT_IV, nan=0.5),
                        X0, bounds=(LO, HI), xtol=1e-12, ftol=1e-12)
    v0, kappa, theta, xi, rho = (float(v) for v in res.x)

    heston_iv = heston_ivs(res.x)
    bs_iv = np.full_like(MKT_IV, MKT_IV[4])          # flat at the ATM vol
    he_err = np.abs(heston_iv - MKT_IV) * 100
    bs_err = np.abs(bs_iv - MKT_IV) * 100

    print(f"  calibrated: v0={v0:.4f} kappa={kappa:.2f} theta={theta:.4f} "
          f"xi={xi:.2f} rho={rho:.3f}")
    print(f"  mean abs err  heston {he_err.mean():.2f}  bs {bs_err.mean():.2f} vol pts")

    return {
        "params": {
            "v0": r(v0), "kappa": r(kappa, 2), "theta": r(theta),
            "xi": r(xi, 2), "rho": r(rho, 3),
            "v0Vol": r(float(np.sqrt(v0)), 4),
            "thetaVol": r(float(np.sqrt(theta)), 4),
        },
        "smile": {
            "moneyness": r(list(MONEYNESS), 2),
            "market": r(list(MKT_IV), 4),
            "heston": r(list(heston_iv), 4),
            "bs": r(list(bs_iv), 4),
            "hestonErr": r(list(he_err), 2),
            "bsErr": r(list(bs_err), 2),
        },
        "fit": {
            "hestonMae": r(float(he_err.mean()), 2),
            "bsMae": r(float(bs_err.mean()), 2),
            "putWingHeston": r(float(he_err[0]), 2),
            "putWingBs": r(float(bs_err[0]), 2),
            "ratio": r(float(bs_err.mean() / he_err.mean()), 1),
        },
    }


# ------------------------------------------------------------- notebook ---
# Markdown carried over verbatim from QI4_Heston_vs_BlackScholes.ipynb.

def notebook_cells() -> list:
    return [
        md("""# Heston vs Black-Scholes: Fitting the Volatility Smile
### One model prices every strike with the same number. The other doesn't have to.

*Content format: Quant Insights · Category: Quant Foundations & Derivatives*

**The claim we test:** Black-Scholes assumes a single, constant volatility — so it predicts the *same* implied vol at every strike. The market flatly disagrees: implied vol curves into a **smile/skew**. The Heston model, by letting volatility itself be random, can bend to fit that curve. This piece pits the two against a real SPX-style implied-vol surface and measures who fits, by how much, and at what cost.

**How we'll judge it**
1. **The disagreement** — what the market smile looks like and why BS can't produce it
2. **The contenders** — one number vs five parameters
3. **The test** — calibrate both to the same option chain
4. **The scoreboard** — fit error, strike by strike
5. **Verdict** — when the extra complexity earns its keep"""),

        code("""import numpy as np
import matplotlib.pyplot as plt

np.random.seed(42)
plt.rcParams["figure.dpi"] = 110"""),

        md("""## 1. The disagreement

Black-Scholes takes one volatility $\\sigma$ and returns one price per strike. Invert real option prices back into implied vols and — if BS were right — you'd get a **flat line**: the same $\\sigma$ at every strike. Instead, equity index options show a pronounced **skew**: deep out-of-the-money puts trade at much higher implied vol than at-the-money or upside calls.

Why? Two BS assumptions break:
- **Volatility isn't constant** — it clusters, spikes, and mean-reverts.
- **Returns aren't Gaussian** — crashes are fatter and more frequent than a normal distribution allows, and they cluster in falling markets.

The skew is the market pricing in exactly those two facts. Any single-vol model is structurally unable to reproduce it."""),

        md("""## 2. The contenders

| | Black-Scholes | Heston |
|---|---|---|
| Volatility | **Constant** $\\sigma$ | **Stochastic** — its own mean-reverting process |
| Free parameters | 1 | 5 |
| Returns distribution | Log-normal (Gaussian log-returns) | Fat-tailed, skewed |
| Can fit the smile? | No — flat by construction | Yes |
| Closed form? | Yes (simple) | Semi-closed (characteristic function) |

**Black-Scholes** assumes $dS = \\mu S\\,dt + \\sigma S\\,dW$ — the GBM from Tutorial 1.

**Heston** adds a second equation for variance $v_t$:

$$dS_t = \\mu S_t\\,dt + \\sqrt{v_t}\\,S_t\\,dW_t^S, \\qquad dv_t = \\kappa(\\theta - v_t)\\,dt + \\xi\\sqrt{v_t}\\,dW_t^v$$

with $\\text{corr}(dW^S, dW^v) = \\rho$. The five parameters: $\\kappa$ (mean-reversion speed), $\\theta$ (long-run variance), $\\xi$ (vol-of-vol), $\\rho$ (spot-vol correlation, the skew driver), and $v_0$ (initial variance)."""),

        md("""## 3. The test

We build a representative SPX implied-vol skew (ATM ≈ 20%, steep put wing — the shape index options actually trade) and give **both** models the same job: match it.

- **Black-Scholes** gets one degree of freedom — its best move is a single flat line, so we set it to the ATM vol.
- **Heston** gets calibrated: we search its five parameters to minimise the gap to the market smile.

*Note: we use a representative parametric skew so the notebook runs without a live option-chain subscription; the calibration machinery is identical for a real SPX/SPY chain.*"""),

        code("""# --- representative SPX 3M implied-vol skew (moneyness K/S -> implied vol) ---
S0, T, r, q = 100.0, 0.25, 0.03, 0.0
moneyness = np.array([0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20])
strikes   = moneyness * S0

# market smile: high vol in the put wing, gentle rise in far calls (typical equity skew)
mkt_iv = np.array([0.32, 0.285, 0.255, 0.228, 0.205, 0.192, 0.188, 0.191, 0.198])

fig, ax = plt.subplots(figsize=(9, 5))
ax.plot(moneyness, mkt_iv * 100, "o-", color="black", label="Market implied vol (SPX-style skew)")
ax.axhline(mkt_iv[4] * 100, color="steelblue", ls="--", label="Black-Scholes (single vol = ATM)")
ax.set_xlabel("Moneyness  K / S"); ax.set_ylabel("Implied volatility (%)")
ax.set_title("The disagreement: market skew vs the flat line BS must draw")
ax.legend(); plt.tight_layout(); plt.show()"""),

        md("""Black-Scholes is a horizontal line. The market is a curve. That gap — biggest in the crash-protection put wing — is the mispricing a single-vol model bakes into every out-of-the-money option."""),

        md("""### 3.1 Calibrate Heston (QuantLib pricing + bounded optimisation)
A single-maturity smile under-determines five parameters — unconstrained optimisers happily wander into absurd values (κ in the thousands) that fit the curve for the wrong reasons. So we calibrate with **economically sensible bounds**: mean-reversion κ ∈ [0.5, 8], vol-of-vol ξ ≤ 2, correlation ρ ∈ [−0.95, −0.05], variances ≤ 0.25. QuantLib prices; SciPy searches."""),

        code("""import QuantLib as ql
from scipy.optimize import least_squares

today = ql.Date(15, 6, 2024)
ql.Settings.instance().evaluationDate = today
day_count = ql.Actual365Fixed()
calendar = ql.NullCalendar()

spot_h = ql.QuoteHandle(ql.SimpleQuote(S0))
r_ts = ql.YieldTermStructureHandle(ql.FlatForward(today, r, day_count))
q_ts = ql.YieldTermStructureHandle(ql.FlatForward(today, q, day_count))
maturity = ql.Period(3, ql.Months)
expiry = today + maturity

def heston_ivs(params):
    \"\"\"Price every strike under Heston, return Black-Scholes implied vols.\"\"\"
    v0, kappa, theta, xi, rho = params
    proc = ql.HestonProcess(r_ts, q_ts, spot_h, v0, kappa, theta, xi, rho)
    eng = ql.AnalyticHestonEngine(ql.HestonModel(proc))
    bsm = ql.BlackScholesMertonProcess(spot_h, q_ts, r_ts,
            ql.BlackVolTermStructureHandle(
                ql.BlackConstantVol(today, calendar, 0.20, day_count)))
    ivs = []
    for K in strikes:
        opt = ql.VanillaOption(ql.PlainVanillaPayoff(ql.Option.Call, K),
                               ql.EuropeanExercise(expiry))
        opt.setPricingEngine(eng)
        try:
            ivs.append(opt.impliedVolatility(opt.NPV(), bsm))
        except Exception:
            ivs.append(np.nan)
    return np.array(ivs)

def residuals(p):
    return np.nan_to_num(heston_ivs(p) - mkt_iv, nan=0.5)

x0     = [0.042, 2.0, 0.045, 0.8, -0.7]                          # v0, kappa, theta, xi, rho
bounds = ([0.005, 0.5, 0.005, 0.05, -0.95], [0.25, 8.0, 0.25, 2.0, -0.05])
res = least_squares(residuals, x0, bounds=bounds, xtol=1e-12, ftol=1e-12)

v0, kappa, theta, xi, rho = res.x
print("Calibrated Heston parameters (bounded):")
print(f"  v0    (initial var)    = {v0:.4f}  -> vol {np.sqrt(v0):.1%}")
print(f"  theta (long-run var)   = {theta:.4f}  -> vol {np.sqrt(theta):.1%}")
print(f"  kappa (mean-reversion) = {kappa:.2f}")
print(f"  xi    (vol-of-vol)     = {xi:.2f}")
print(f"  rho   (spot-vol corr)  = {rho:.2f}   <- negative = downside skew")"""),

        md("""### 3.2 Recover Heston's implied-vol smile
Price each strike under the calibrated model and invert to implied vol — same axis as the market curve."""),

        code("""heston_iv = heston_ivs(res.x)
bs_iv = np.full_like(mkt_iv, mkt_iv[4])   # flat at ATM

print("moneyness  market   heston    BS(flat)")
for m, mk, he, bs in zip(moneyness, mkt_iv, heston_iv, bs_iv):
    print(f"  {m:.2f}     {mk:6.1%}  {he:6.1%}   {bs:6.1%}")"""),

        md("""## 4. The scoreboard"""),

        code("""fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

# left: the three curves
ax1.plot(moneyness, mkt_iv * 100, "o-", color="black", label="Market", lw=2)
ax1.plot(moneyness, heston_iv * 100, "s--", color="crimson", label="Heston (calibrated)")
ax1.plot(moneyness, bs_iv * 100, "--", color="steelblue", label="Black-Scholes (flat)")
ax1.set_xlabel("Moneyness  K / S"); ax1.set_ylabel("Implied vol (%)")
ax1.set_title("Fit to the smile"); ax1.legend()

# right: absolute pricing error in vol points
bs_err = np.abs(bs_iv - mkt_iv) * 100
he_err = np.abs(heston_iv - mkt_iv) * 100
x = np.arange(len(moneyness)); w = 0.38
ax2.bar(x - w/2, bs_err, w, color="steelblue", label="Black-Scholes")
ax2.bar(x + w/2, he_err, w, color="crimson", label="Heston")
ax2.set_xticks(x); ax2.set_xticklabels([f"{m:.2f}" for m in moneyness], rotation=45)
ax2.set_xlabel("Moneyness  K / S"); ax2.set_ylabel("|error| (vol points)")
ax2.set_title("Absolute implied-vol error by strike"); ax2.legend()
plt.tight_layout(); plt.show()

print(f"Mean abs error — Black-Scholes: {bs_err.mean():.2f} vol pts")
print(f"Mean abs error — Heston:        {he_err.mean():.2f} vol pts")
print(f"Worst strike (put wing) — BS: {bs_err[0]:.2f} pts  vs  Heston: {he_err[0]:.2f} pts")"""),

        md("""The picture is decisive where it matters most — the **put wing**. Black-Scholes underprices crash protection by a wide margin (its flat line sits far below the market's elevated put vols), while Heston tracks the curve because its negative $\\rho$ generates exactly that downside skew. Across the surface Heston's mean error is a fraction of Black-Scholes'."""),

        md("""## 5. Verdict

**Heston wins the fit — decisively — and it isn't close in the wings.** With five parameters versus one, that's expected; the real question is whether the extra complexity earns its keep. The answer depends on the job:

- **Pricing a single vanilla at one strike?** Black-Scholes with that strike's *own* implied vol is simpler and exact. The smile is a lookup table; you don't need a model to read one row.
- **Pricing a book across many strikes consistently, or anything exotic (barriers, cliquets, forward-starts) whose value depends on the *dynamics* of vol?** Heston is close to essential — a flat vol would misprice the smile-sensitive payoff.

**What each model really is:**
- Black-Scholes isn't wrong so much as *incomplete* — it's the quoting convention (implied vol) more than a dynamic model. Its flat smile is a feature of using one number, not a bug to be fixed.
- Heston buys smile-consistency and fat tails at the cost of five parameters that must be **recalibrated** as the surface moves, and a fit that can still miss very short maturities (where jumps, not stochastic vol, drive the steep skew).

**The honest trade-off:** more parameters always fit better in-sample. Heston earns trust because its parameters are *economically interpretable* ($\\rho$ is the skew, $\\xi$ the smile convexity, $\\theta$ the vol term structure) — it's fitting the smile *for the right reasons*, not just curve-fitting.

**Where to go next:** for the very short-dated skew Heston struggles with, add jumps (**Bates**, Heston + Merton jumps); to fit the *entire* observed surface exactly rather than approximately, **Dupire local volatility**; and for the constant-vol baseline both are measured against, revisit the **Black-Scholes** tutorial.

*© pyportfolios.com — runnable companion to the article.*"""),
    ]


def main() -> None:
    # The article publishes UNEXECUTED - prose and code only, no figures and no
    # computed numbers - so the default output is just the runnable notebook.
    # `--data` re-emits the article data module for whoever wants the results
    # back; nothing on the site imports it today.
    emit_data = "--data" in sys.argv
    if emit_data:
        print(f"  ts -> {write_ts(SLUG, build_calibration())}")
    print(f"  nb -> {write_nb(SLUG, notebook_cells())}")
    if not emit_data:
        print("  (no data module: this article publishes unexecuted; pass --data to emit one)")


if __name__ == "__main__":
    main()
