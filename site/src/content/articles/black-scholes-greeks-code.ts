/* Black-Scholes & the Greeks — code, VERBATIM from the T2_BlackScholes_Greeks_QQQ notebook.
   String.raw preserves backslashes (e.g. \n inside the Python strings) as source text. */

export const BSM_CODE = String.raw`def bs_price(S, K, T, r, sigma, kind="call"):
    """Black-Scholes price for a European call or put."""
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if kind == "call":
        return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

def bs_greeks(S, K, T, r, sigma, kind="call"):
    """Delta, Gamma, Vega, Theta (per year), Rho for a European option."""
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    sign = 1 if kind == "call" else -1
    return {
        "delta": sign * norm.cdf(sign * d1),
        "gamma": norm.pdf(d1) / (S * sigma * np.sqrt(T)),
        "vega":  S * norm.pdf(d1) * np.sqrt(T),
        "theta": (-S * norm.pdf(d1) * sigma / (2 * np.sqrt(T))
                  - sign * r * K * np.exp(-r * T) * norm.cdf(sign * d2)),
        "rho":   sign * K * T * np.exp(-r * T) * norm.cdf(sign * d2),
    }`;

export const QQQ_CODE = String.raw`TICKER = "QQQ"
START, END = "2018-01-01", "2024-12-31"

def load_prices(ticker, start, end):
    """Adjusted-close prices: yfinance first, Stooq as fallback."""
    try:
        import yfinance as yf
        df = yf.download(ticker, start=start, end=end, auto_adjust=True, progress=False)
        if not df.empty:
            return df["Close"].squeeze().rename(ticker).dropna()
    except Exception as exc:
        print(f"yfinance failed ({exc}); trying Stooq…")
    url = f"https://stooq.com/q/d/l/?s={ticker.lower()}.us&i=d"
    df = pd.read_csv(url, parse_dates=["Date"], index_col="Date")
    return df.loc[start:end, "Close"].rename(ticker).dropna()

px = load_prices(TICKER, START, END)
log_ret = np.log(px / px.shift(1)).dropna()

S0    = float(px.iloc[-1])
SIGMA = float(log_ret.tail(252).std() * np.sqrt(252))   # trailing 1y realised vol
R     = 0.045                                           # short-term risk-free rate
T3M   = 0.25                                            # 3 months
K_ATM = round(S0)                                       # at-the-money strike

call = bs_price(S0, K_ATM, T3M, R, SIGMA, "call")
put  = bs_price(S0, K_ATM, T3M, R, SIGMA, "put")

print(f"{TICKER} spot = {S0:,.2f}   sigma = {SIGMA:.2%}   r = {R:.2%}")
print(f"3M ATM call (K={K_ATM}): {call:6.2f}")
print(f"3M ATM put  (K={K_ATM}): {put:6.2f}")

g = bs_greeks(S0, K_ATM, T3M, R, SIGMA, "call")
print("\n3M ATM call Greeks:")
print(f"  delta {g['delta']:7.3f}   gamma {g['gamma']:8.5f}   vega {g['vega']:7.2f}"
      f"   theta {g['theta']/365:7.3f}/day   rho {g['rho']:6.2f}")`;

export const GREEKS_STRIKES_CODE = String.raw`strikes = np.linspace(0.80 * S0, 1.20 * S0, 200)
G = {k: [] for k in ["delta", "gamma", "vega", "theta"]}
for K in strikes:
    gk = bs_greeks(S0, K, T3M, R, SIGMA, "call")
    for k in G: G[k].append(gk[k])

fig, axes = plt.subplots(2, 2, figsize=(11, 6), sharex=True)
for ax, k in zip(axes.flat, G):
    ax.plot(strikes / S0, G[k], color="steelblue")
    ax.axvline(1.0, color="gray", ls=":", lw=1)
    ax.set_title(k.capitalize()); ax.set_xlabel("Moneyness  K / S")
fig.suptitle(f"{TICKER} 3M call Greeks across strikes  (S={S0:,.0f}, sigma={SIGMA:.0%})")
plt.tight_layout(); plt.show()`;

export const THETA_CODE = String.raw`maturities = np.linspace(1e-3, 1.0, 200)
atm_prices  = [bs_price(S0, K_ATM, t, R, SIGMA, "call") for t in maturities]
otm_prices  = [bs_price(S0, 1.05 * S0, t, R, SIGMA, "call") for t in maturities]

fig, ax = plt.subplots(figsize=(10, 4))
ax.plot(maturities * 12, atm_prices, label=f"ATM (K={K_ATM})", color="steelblue")
ax.plot(maturities * 12, otm_prices, label="5% OTM", color="darkorange")
ax.set_xlabel("Months to expiry"); ax.set_ylabel("Call value")
ax.set_title(f"{TICKER}: value vs time to expiry — Theta accelerates near zero")
ax.invert_xaxis(); ax.legend()
plt.tight_layout(); plt.show()`;

export const SANITY_CODE = String.raw`# 1) put-call parity
lhs, rhs = call - put, S0 - K_ATM * np.exp(-R * T3M)
print(f"parity: C - P = {lhs:.6f}   S - K e^-rT = {rhs:.6f}   diff = {abs(lhs-rhs):.2e}")

# 2) Monte Carlo pricing under risk-neutral GBM
N = 200_000
z = np.random.normal(size=N)
S_T = S0 * np.exp((R - 0.5 * SIGMA**2) * T3M + SIGMA * np.sqrt(T3M) * z)
mc_call = np.exp(-R * T3M) * np.maximum(S_T - K_ATM, 0).mean()
se      = np.exp(-R * T3M) * np.maximum(S_T - K_ATM, 0).std() / np.sqrt(N)
print(f"Monte Carlo call: {mc_call:.3f} ± {2*se:.3f}   closed form: {call:.3f}")`;
