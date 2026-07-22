/* Risk Parity from Scratch — code, VERBATIM from the T7_RiskParity_Futures
   notebook. String.raw preserves backslashes. */

export const LOAD_CODE = String.raw`TICKERS = ["ES=F", "ZN=F", "GC=F", "HG=F", "CL=F"]
NAMES = {"ES=F": "S&P 500", "ZN=F": "10y Note", "GC=F": "Gold", "HG=F": "Copper", "CL=F": "WTI"}
START, END = "2015-01-01", "2024-12-31"

def load_prices(tickers, start, end):
    """Continuous futures adjusted-close via yfinance."""
    import yfinance as yf
    df = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)["Close"]
    return df[tickers].dropna()

px = load_prices(TICKERS, START, END)
rets = px.pct_change().dropna()

Sigma = rets.cov() * 252
vol = pd.Series(np.sqrt(np.diag(Sigma)), index=TICKERS)
print(f"{len(px)} trading days, {px.index[0].date()} → {px.index[-1].date()}\n")
print("Annualised volatility:")
print(vol.rename(index=NAMES).round(3))`;

export const RC_CODE = String.raw`def risk_contributions(w, Sigma):
    """Risk contribution of each asset (sums to portfolio vol)."""
    w = np.asarray(w)
    sigma_p = np.sqrt(w @ Sigma @ w)
    mrc = (Sigma @ w) / sigma_p
    return w * mrc, sigma_p

n = len(TICKERS)
w_eq = np.repeat(1/n, n)
rc_eq, sig_eq = risk_contributions(w_eq, Sigma.values)

tbl = pd.DataFrame({"weight": w_eq, "risk contrib": rc_eq,
                    "risk share": rc_eq / sig_eq}, index=[NAMES[t] for t in TICKERS])
print(tbl.round(3))
print(f"\nPortfolio vol: {sig_eq:.1%} — but risk shares range "
      f"{(rc_eq/sig_eq).min():.0%} to {(rc_eq/sig_eq).max():.0%}, far from equal.")`;

export const SOLVE_CODE = String.raw`from scipy.optimize import minimize

def rp_objective(w, Sigma):
    rc, sigma_p = risk_contributions(w, Sigma)
    target = sigma_p / len(w)
    return np.sum((rc - target) ** 2)          # equalise risk contributions

cons = ({"type": "eq", "fun": lambda w: w.sum() - 1},)
bnds = tuple((0.0, 1.0) for _ in range(n))
res = minimize(rp_objective, w_eq, args=(Sigma.values,), method="SLSQP",
               bounds=bnds, constraints=cons, tol=1e-12)

w_rp = res.x
rc_rp, sig_rp = risk_contributions(w_rp, Sigma.values)

tbl = pd.DataFrame({"RP weight": w_rp, "risk share": rc_rp / sig_rp},
                   index=[NAMES[t] for t in TICKERS])
print(tbl.round(3))
print(f"\nRisk shares now range {(rc_rp/sig_rp).min():.1%} to {(rc_rp/sig_rp).max():.1%} "
      f"— all ≈ {1/n:.0%}. Portfolio vol: {sig_rp:.1%}")`;

export const VALIDATE_CODE = String.raw`import riskfolio as rp

port = rp.Portfolio(returns=rets)
port.assets_stats(method_mu="hist", method_cov="hist")
w_lib = port.rp_optimization(model="Classic", rm="MV", rf=0, b=None)

compare = pd.DataFrame({
    "from scratch (SciPy)": w_rp,
    "Riskfolio-lib": w_lib["weights"].values,
}, index=[NAMES[t] for t in TICKERS])
compare["abs diff"] = (compare.iloc[:, 0] - compare.iloc[:, 1]).abs()
print(compare.round(4))
print(f"\nMax weight difference: {compare['abs diff'].max():.2e}  (solver tolerance)")`;

export const LEVERAGE_CODE = String.raw`target_vol = 0.10
leverage = target_vol / sig_rp
w_levered = w_rp * leverage

print(f"Unlevered RP vol: {sig_rp:.1%}")
print(f"Leverage to reach {target_vol:.0%}: {leverage:.2f}x")
print(f"Gross exposure: {w_levered.sum():.2f}  (vs 1.00 unlevered)\n")
print(pd.Series(w_levered, index=[NAMES[t] for t in TICKERS], name="levered weight").round(3))`;
