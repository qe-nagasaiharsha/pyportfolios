/* Heston vs Black-Scholes — code, VERBATIM from the QI4_Heston_vs_BlackScholes notebook.
   String.raw preserves backslashes as source text. */

export const SETUP_CODE = String.raw`import numpy as np
import matplotlib.pyplot as plt

np.random.seed(42)
plt.rcParams["figure.dpi"] = 110`;

export const SMILE_CODE = String.raw`# --- representative SPX 3M implied-vol skew (moneyness K/S -> implied vol) ---
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
ax.legend(); plt.tight_layout(); plt.show()`;

export const HESTON_CODE = String.raw`import QuantLib as ql
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
    """Price every strike under Heston, return Black-Scholes implied vols."""
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
print(f"  rho   (spot-vol corr)  = {rho:.2f}   <- negative = downside skew")`;

export const RECOVER_CODE = String.raw`heston_iv = heston_ivs(res.x)
bs_iv = np.full_like(mkt_iv, mkt_iv[4])   # flat at ATM

print("moneyness  market   heston    BS(flat)")
for m, mk, he, bs in zip(moneyness, mkt_iv, heston_iv, bs_iv):
    print(f"  {m:.2f}     {mk:6.1%}  {he:6.1%}   {bs:6.1%}")`;

export const SCORE_CODE = String.raw`fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

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
print(f"Worst strike (put wing) — BS: {bs_err[0]:.2f} pts  vs  Heston: {he_err[0]:.2f} pts")`;
