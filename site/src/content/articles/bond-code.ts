/* Bond Pricing, Duration & Convexity — code, VERBATIM from the T3_Bond_Duration_Convexity notebook. */

export const BOND_FUNCS = String.raw`def bond_price(face, coupon, y, T, freq=2):
    """Price of a fixed-coupon bond (coupon = annual rate, y = YTM)."""
    n = int(round(T * freq))
    t = np.arange(1, n + 1)
    cf = np.full(n, face * coupon / freq)
    cf[-1] += face
    return float(np.sum(cf / (1 + y / freq) ** t))

def duration_convexity(face, coupon, y, T, freq=2, h=1e-4):
    """Modified duration (years) and convexity via central differences."""
    p0 = bond_price(face, coupon, y, T, freq)
    p_up, p_dn = bond_price(face, coupon, y + h, T, freq), bond_price(face, coupon, y - h, T, freq)
    dur  = -(p_up - p_dn) / (2 * h * p0)
    conv =  (p_up - 2 * p0 + p_dn) / (h**2 * p0)
    return dur, conv

# quick check against the rule of thumb
p = bond_price(100, 0.04, 0.04, 10)
d, c = duration_convexity(100, 0.04, 0.04, 10)
print(f"10y 4% bond at par: P = {p:.2f}, duration = {d:.2f}y, convexity = {c:.1f}")`;

export const PRICE_YIELD_CODE = String.raw`yields = np.linspace(0.001, 0.10, 200)
fig, ax = plt.subplots(figsize=(10, 5))
for T, color in [(2, "steelblue"), (10, "darkorange"), (30, "crimson")]:
    prices = [bond_price(100, 0.04, y, T) for y in yields]
    ax.plot(yields * 100, prices, color=color, label=f"{T}y Treasury")
ax.axhline(100, color="gray", ls=":", lw=1)
ax.axvline(4, color="gray", ls=":", lw=1)
ax.set_xlabel("Yield (%)"); ax.set_ylabel("Price")
ax.set_title("Price vs yield — 4% coupon, three maturities")
ax.legend()
plt.tight_layout(); plt.show()`;

export const LADDER_CODE = String.raw`rows = []
for T in [1, 2, 5, 10, 20, 30]:
    d, c = duration_convexity(100, 0.04, 0.04, T)
    p0 = bond_price(100, 0.04, 0.04, T)
    p1 = bond_price(100, 0.04, 0.05, T)          # +100bp, exact
    rows.append([T, round(d, 2), round(c, 1), f"{(p1/p0 - 1)*100:.2f}%"])

ladder = pd.DataFrame(rows, columns=["Maturity (y)", "Mod. duration", "Convexity", "Exact dP for +100bp"])
print(ladder.to_string(index=False))`;

export const ETF_CODE = String.raw`def load_prices(ticker, start, end):
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

etfs = {"SHY": (1.9, 0.0370), "IEF": (7.5, 0.0237), "TLT": (17.5, 0.0207)}  # (duration, 2022 dY)

px = pd.concat([load_prices(t, "2021-12-31", "2022-12-31") for t in etfs], axis=1).dropna()
total_ret = px.iloc[-1] / px.iloc[0] - 1

print(f"{'ETF':4} {'duration':>9} {'dY 2022':>8} {'predicted -D*dY':>16} {'actual 2022':>12}")
for t, (d, dy) in etfs.items():
    print(f"{t:4} {d:9.1f} {dy:8.2%} {-d*dy:16.1%} {total_ret[t]:12.1%}")

(px / px.iloc[0] * 100).plot(figsize=(10, 4), color=["steelblue", "darkorange", "crimson"])
plt.title("2022: the duration ladder in real life (indexed to 100)")
plt.ylabel("Value"); plt.tight_layout(); plt.show()`;

export const TAYLOR_CODE = String.raw`T = 30
p0 = bond_price(100, 0.04, 0.04, T)
d, c = duration_convexity(100, 0.04, 0.04, T)

shocks = np.linspace(-0.03, 0.03, 61)
exact  = np.array([bond_price(100, 0.04, 0.04 + s, T) / p0 - 1 for s in shocks])
lin    = -d * shocks
quad   = -d * shocks + 0.5 * c * shocks**2

fig, ax = plt.subplots(figsize=(10, 4.5))
ax.plot(shocks * 100, exact * 100, "k",  label="Exact repricing")
ax.plot(shocks * 100, lin   * 100, "--", color="steelblue",  label="Duration only")
ax.plot(shocks * 100, quad  * 100, "--", color="darkorange", label="Duration + convexity")
ax.set_xlabel("Yield shock (%)"); ax.set_ylabel("Price change (%)")
ax.set_title(f"30y bond: Taylor approximation quality (D={d:.1f}, C={c:.0f})")
ax.legend()
plt.tight_layout(); plt.show()

s = 0.02
print(f"+200bp: exact {bond_price(100,0.04,0.06,T)/p0-1:+.2%}   dur-only {-d*s:+.2%}   dur+conv {-d*s+0.5*c*s*s:+.2%}")`;
