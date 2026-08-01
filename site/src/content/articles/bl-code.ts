/* The Black-Litterman Model — code, VERBATIM from the T6_BlackLitterman
   notebook. String.raw preserves backslashes. */

export const LOAD_CODE = String.raw`TICKERS = ["EWJ", "EWG", "EWU", "EWA", "EWC"]
COUNTRY = {"EWJ": "Japan", "EWG": "Germany", "EWU": "UK", "EWA": "Australia", "EWC": "Canada"}
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
        cols[t] = pd.read_csv(url, parse_dates=["Date"], index_col="Date")["Close"].rename(t)
    return pd.concat(cols, axis=1).loc[start:end].dropna()

px = load_prices(TICKERS, START, END)
rets = px.pct_change().dropna()
print(f"{len(px)} trading days, {px.index[0].date()} → {px.index[-1].date()}")`;

export const PRIOR_CODE = String.raw`from pypfopt import risk_models, expected_returns
from pypfopt import black_litterman
from pypfopt.black_litterman import BlackLittermanModel

S = risk_models.sample_cov(px)

# approximate relative market caps (illustrative stand-in for true investable caps)
mcaps = {"EWJ": 6.0, "EWG": 2.5, "EWU": 3.0, "EWA": 1.6, "EWC": 2.8}   # in trillions USD, rough
w_mkt = pd.Series(mcaps) / sum(mcaps.values())

delta = 2.5   # market risk-aversion (typical value)
pi = black_litterman.market_implied_prior_returns(mcaps, delta, S)

prior_tbl = pd.DataFrame({"market weight": w_mkt, "implied return": pi}).round(3)
prior_tbl.index = [f"{t} ({COUNTRY[t]})" for t in prior_tbl.index]
print(prior_tbl)`;

export const VIEW_CODE = String.raw`# absolute + relative views
viewdict = {
    "EWG": 0.10,                 # absolute: Germany returns 10%
}
# a relative view via P/Q would go here too; keep one absolute view for clarity

bl = BlackLittermanModel(S, pi=pi, absolute_views=viewdict, omega="idzorek",
                         view_confidences=[0.50])
bl_returns = bl.bl_returns()

compare = pd.DataFrame({"implied (prior)": pi, "Black-Litterman (posterior)": bl_returns}).round(3)
compare.index = [f"{t} ({COUNTRY[t]})" for t in compare.index]
print(compare)
print("\nNote: only EWG had a view — but the posterior nudges correlated markets too.")`;

export const OPT_CODE = String.raw`from pypfopt import EfficientFrontier

# Black-Litterman optimal weights
ef_bl = EfficientFrontier(bl_returns, S)
ef_bl.max_sharpe(risk_free_rate=0.02)
w_bl = pd.Series(ef_bl.clean_weights())

# naive MVO on historical means, for contrast
mu_hist = expected_returns.mean_historical_return(px)
ef_naive = EfficientFrontier(mu_hist, S)
ef_naive.max_sharpe(risk_free_rate=0.02)
w_naive = pd.Series(ef_naive.clean_weights())

weights = pd.DataFrame({"Market prior": w_mkt, "Black-Litterman": w_bl, "Naive MVO": w_naive}).round(3)
weights.index = [COUNTRY[t] for t in weights.index]
print(weights)

ax = weights.plot(kind="bar", figsize=(10, 5), width=0.8,
                  color=["gray", "steelblue", "darkorange"])
ax.set_ylabel("Weight"); ax.set_title("Allocations: market prior vs Black-Litterman vs naive MVO")
ax.axhline(0, color="black", lw=0.6)
plt.tight_layout(); plt.show()`;

export const NOVIEW_CODE = String.raw`bl_noview = BlackLittermanModel(S, pi=pi, absolute_views={}, omega="idzorek", view_confidences=[])
diff = (bl_noview.bl_returns() - pi).abs().max()
print(f"Max |posterior - prior| with no views: {diff:.2e}  (should be ~0)")`;
