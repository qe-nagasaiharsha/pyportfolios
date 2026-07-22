/* Mean-Variance Optimization & the Efficient Frontier — code, VERBATIM from the
   T5_MVO_Efficient_Frontier notebook. String.raw preserves backslashes. */

export const LOAD_CODE = String.raw`TICKERS = ["SPY", "TLT", "GLD", "VNQ", "VEA", "VWO"]
START, END = "2015-01-01", "2024-12-31"

def load_prices(tickers, start, end):
    """Adjusted-close prices: yfinance first, Stooq as fallback."""
    try:
        import yfinance as yf
        df = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)["Close"]
        if not df.empty:
            return df[tickers].dropna()
    except Exception as exc:
        print(f"yfinance failed ({exc}); trying Stooq…")
    cols = {}
    for t in tickers:
        url = f"https://stooq.com/q/d/l/?s={t.lower()}.us&i=d"
        s = pd.read_csv(url, parse_dates=["Date"], index_col="Date")["Close"].rename(t)
        cols[t] = s
    return pd.concat(cols, axis=1).loc[start:end].dropna()

px = load_prices(TICKERS, START, END)
rets = px.pct_change().dropna()

mu    = rets.mean() * 252          # annualised expected returns
Sigma = rets.cov() * 252           # annualised covariance
vol   = np.sqrt(np.diag(Sigma))

summary = pd.DataFrame({"ann. return": mu, "ann. vol": vol,
                        "Sharpe": mu / vol}).round(3)
print(summary)
print(f"\n{len(px)} trading days, {px.index[0].date()} → {px.index[-1].date()}")`;

export const CORR_CODE = String.raw`corr = rets.corr()

fig, ax = plt.subplots(figsize=(6.5, 5.5))
im = ax.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)
ax.set_xticks(range(len(TICKERS))); ax.set_xticklabels(TICKERS)
ax.set_yticks(range(len(TICKERS))); ax.set_yticklabels(TICKERS)
for i in range(len(TICKERS)):
    for j in range(len(TICKERS)):
        ax.text(j, i, f"{corr.iloc[i,j]:.2f}", ha="center", va="center",
                color="white" if abs(corr.iloc[i,j]) > 0.5 else "black", fontsize=9)
fig.colorbar(im, fraction=0.046, pad=0.04)
ax.set_title("Correlation of daily returns")
plt.tight_layout(); plt.show()`;

export const CLOUD_CODE = String.raw`N = 20_000
n = len(TICKERS)
rf = 0.02

w = np.random.dirichlet(np.ones(n), N)          # random long-only weights summing to 1
port_ret = w @ mu.values
port_vol = np.sqrt(np.einsum("ij,jk,ik->i", w, Sigma.values, w))
port_sharpe = (port_ret - rf) / port_vol

fig, ax = plt.subplots(figsize=(10, 6))
sc = ax.scatter(port_vol, port_ret, c=port_sharpe, cmap="viridis", s=6, alpha=0.5)
# individual assets
ax.scatter(vol, mu.values, c="red", marker="D", s=60, zorder=5)
for i, t in enumerate(TICKERS):
    ax.annotate(t, (vol[i], mu.values[i]), textcoords="offset points", xytext=(7, 3))
fig.colorbar(sc, label="Sharpe ratio")
ax.set_xlabel("Annualised volatility"); ax.set_ylabel("Annualised return")
ax.set_title(f"{N:,} random portfolios — the efficient frontier bullet")
plt.tight_layout(); plt.show()`;

export const OPT_CODE = String.raw`from pypfopt import EfficientFrontier, expected_returns, risk_models, plotting

mu_pp = expected_returns.mean_historical_return(px)
S_pp  = risk_models.sample_cov(px)

# max Sharpe
ef = EfficientFrontier(mu_pp, S_pp)
ef.max_sharpe(risk_free_rate=rf)
w_sharpe = ef.clean_weights()
perf_sharpe = ef.portfolio_performance(risk_free_rate=rf)

# min variance
ef2 = EfficientFrontier(mu_pp, S_pp)
ef2.min_volatility()
w_minvar = ef2.clean_weights()
perf_minvar = ef2.portfolio_performance(risk_free_rate=rf)

weights = pd.DataFrame({"Max Sharpe": w_sharpe, "Min Variance": w_minvar}).round(3)
print(weights)
print(f"\nMax Sharpe : return {perf_sharpe[0]:.1%}, vol {perf_sharpe[1]:.1%}, Sharpe {perf_sharpe[2]:.2f}")
print(f"Min Variance: return {perf_minvar[0]:.1%}, vol {perf_minvar[1]:.1%}, Sharpe {perf_minvar[2]:.2f}")`;
