/* Geometric Brownian Motion (SPY) — code, VERBATIM from the T1_GBM_SPY notebook.
   String.raw preserves backslashes as source text. */

export const GBM_FUNCS = String.raw`def gbm_returns(mu, sigma, dt, n_steps, n_paths):
    """One-step gross returns under GBM (shape: n_steps x n_paths)."""
    z = np.random.normal(size=(n_steps, n_paths))
    return np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * z)

def gbm_paths(s0, mu, sigma, dt, n_steps, n_paths):
    """Price paths of shape (n_steps + 1, n_paths), starting at s0."""
    rets = gbm_returns(mu, sigma, dt, n_steps, n_paths)
    return s0 * np.vstack([np.ones(rets.shape[1]), rets]).cumprod(axis=0)`;

export const SPY_CALIB = String.raw`TICKER = "SPY"
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

s0        = float(px.iloc[-1])
sigma_hat = float(log_ret.std() * np.sqrt(252))
mu_hat    = float(log_ret.mean() * 252 + 0.5 * sigma_hat**2)  # drift of the SDE, not of log returns

print(f"{TICKER}: {len(px)} daily observations, last close = {s0:,.2f}")
print(f"mu_hat    = {mu_hat:.2%}  (annualised drift)")
print(f"sigma_hat = {sigma_hat:.2%}  (annualised volatility)")`;

export const CONE_CODE = String.raw`DT      = 1 / 252
HORIZON = 252 * 5          # 5 years
N_PATHS = 1_000

paths = gbm_paths(s0, mu_hat, sigma_hat, DT, HORIZON, N_PATHS)
t_ax  = np.arange(paths.shape[0]) / 252

p5, p95 = np.percentile(paths, [5, 95], axis=1)

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(t_ax, paths, color="gray", lw=0.2, alpha=0.35)
ax.fill_between(t_ax, p5, p95, color="steelblue", alpha=0.25, label="5–95% band")
ax.plot(t_ax, paths.mean(axis=1), "k--", label="Mean path")
ax.set_title(f"{TICKER}: {N_PATHS:,} GBM paths, 5 years  (mu={mu_hat:.1%}, sigma={sigma_hat:.1%})")
ax.set_xlabel("Years"); ax.set_ylabel("Simulated price"); ax.legend()
plt.tight_layout(); plt.show()`;

export const TERMINAL_CODE = String.raw`from scipy import stats

T   = HORIZON / 252
s_T = paths[-1]

x   = np.linspace(s_T.min(), s_T.max(), 400)
pdf = stats.lognorm.pdf(x, s=sigma_hat*np.sqrt(T),
                        scale=s0*np.exp((mu_hat - 0.5*sigma_hat**2)*T))

fig, ax = plt.subplots(figsize=(10, 4))
ax.hist(s_T, bins=60, density=True, color="steelblue", alpha=0.55, label="Simulated $S_T$")
ax.plot(x, pdf, "k-", lw=1.5, label="Theoretical log-normal")
ax.axvline(s_T.mean(),   color="black", ls="--", label=f"Mean   {s_T.mean():,.0f}")
ax.axvline(np.median(s_T), color="red",  ls="--", label=f"Median {np.median(s_T):,.0f}")
ax.set_title(f"{TICKER}: terminal price distribution after {T:.0f} years")
ax.set_xlabel("Price"); ax.legend()
plt.tight_layout(); plt.show()`;

export const MARTINGALE_CODE = String.raw`paths_nd = gbm_paths(s0, 0.0, sigma_hat, DT, HORIZON, N_PATHS)
print(f"Mean terminal price (no drift): {paths_nd[-1].mean():,.2f}   vs   S0 = {s0:,.2f}")`;
