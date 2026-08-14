/* Gaussian vs t-copula — code, VERBATIM from the QI12_Gaussian_vs_tCopula notebook.
   Nothing was executed: the article publishes his prose and code as written,
   with no computed results or figures, so his own yfinance/Stooq loader stands
   unmodified. */

export const SETUP_CODE = String.raw`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

np.random.seed(42)
plt.rcParams["figure.dpi"] = 110
sns.set_style("whitegrid")`;

export const DATA_CODE = String.raw`TICKERS = ["XLF", "XLK"]
START, END = "2007-01-01", "2024-12-31"

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
n = len(rets)
print(f"{n} trading days, {px.index[0].date()} → {px.index[-1].date()}")
print(f"Linear correlation: {rets['XLF'].corr(rets['XLK']):.2f}")`;

export const PSEUDO_CODE = String.raw`u = rets.rank() / (n + 1)          # pseudo-observations in (0,1)

fig, axes = plt.subplots(1, 2, figsize=(11, 4.6))
axes[0].scatter(rets["XLF"], rets["XLK"], s=4, alpha=0.4, color="steelblue")
axes[0].set_title("Raw daily returns"); axes[0].set_xlabel("XLF"); axes[0].set_ylabel("XLK")
axes[1].scatter(u["XLF"], u["XLK"], s=4, alpha=0.4, color="darkorange")
axes[1].set_title("Pseudo-observations (the copula's view)")
axes[1].set_xlabel("XLF percentile"); axes[1].set_ylabel("XLK percentile")
plt.tight_layout(); plt.show()

print("Note the crowding in the corners of the right plot — especially bottom-left (joint crashes).")`;

export const FIT_CODE = String.raw`# --- Gaussian copula fit ---
z = stats.norm.ppf(u.values)
rho_g = np.corrcoef(z.T)[0, 1]

# --- t-copula fit: rho from Kendall's tau, nu by profile likelihood ---
tau = stats.kendalltau(u["XLF"], u["XLK"]).statistic
rho_t = np.sin(np.pi * tau / 2)

def t_copula_loglik(nu, u, rho):
    x = stats.t.ppf(u, df=nu)
    cov = np.array([[1, rho], [rho, 1]])
    num = stats.multivariate_t(loc=[0, 0], shape=cov, df=nu).logpdf(x)
    den = stats.t.logpdf(x, df=nu).sum(axis=1)
    return np.sum(num - den)

nus = np.arange(2, 31)
lls = [t_copula_loglik(v, u.values, rho_t) for v in nus]
nu_hat = nus[int(np.argmax(lls))]

fig, ax = plt.subplots(figsize=(9, 3.8))
ax.plot(nus, lls, "o-", color="steelblue")
ax.axvline(nu_hat, color="crimson", ls="--", label=f"MLE: ν = {nu_hat}")
ax.set_xlabel("Degrees of freedom ν"); ax.set_ylabel("Copula log-likelihood")
ax.set_title("The data votes: profile likelihood over ν"); ax.legend()
plt.tight_layout(); plt.show()

print(f"Gaussian copula: rho = {rho_g:.3f}")
print(f"t-copula:        rho = {rho_t:.3f}, nu = {nu_hat}")
print("\nSmall ν = strong tail dependence. ν above ~30 would mean 'basically Gaussian'.")`;

export const LAMBDA_CODE = String.raw`# closed-form lower-tail dependence of the t-copula
lam_t = 2 * stats.t.cdf(-np.sqrt((nu_hat + 1) * (1 - rho_t) / (1 + rho_t)), df=nu_hat + 1)
print(f"Lower-tail dependence λ — Gaussian: 0.000 (by construction)")
print(f"Lower-tail dependence λ — t-copula: {lam_t:.3f}")`;

export const JOINT_CODE = String.raw`def simulate_gaussian(rho, size):
    cov = np.array([[1, rho], [rho, 1]])
    z = np.random.multivariate_normal([0, 0], cov, size)
    return stats.norm.cdf(z)

def simulate_t(rho, nu, size):
    cov = np.array([[1, rho], [rho, 1]])
    g = np.random.multivariate_normal([0, 0], cov, size)
    chi = np.random.chisquare(nu, size) / nu
    x = g / np.sqrt(chi)[:, None]
    return stats.t.cdf(x, df=nu)

N_SIM = 2_000_000
u_g = simulate_gaussian(rho_g, N_SIM)
u_t = simulate_t(rho_t, nu_hat, N_SIM)

print(f"{'q':>4} {'empirical':>10} {'Gaussian':>10} {'t-copula':>10}   (joint-crash days per sample of {n})")
for q in [0.05, 0.01]:
    emp = float(((u['XLF'] < q) & (u['XLK'] < q)).mean())
    pg  = float(((u_g[:,0] < q) & (u_g[:,1] < q)).mean())
    pt  = float(((u_t[:,0] < q) & (u_t[:,1] < q)).mean())
    print(f"{q:>4.0%} {emp*n:>10.1f} {pg*n:>10.1f} {pt*n:>10.1f}")`;

export const PANELS_CODE = String.raw`# visual: simulated pseudo-observations vs reality, tails highlighted
fig, axes = plt.subplots(1, 3, figsize=(13.5, 4.4))
sets = [(u.values, "Real data (XLF/XLK)", "black"),
        (u_g[:len(u)], f"Gaussian (ρ={rho_g:.2f})", "steelblue"),
        (u_t[:len(u)], f"t-copula (ρ={rho_t:.2f}, ν={nu_hat})", "crimson")]
for ax, (dat, title, c) in zip(axes, sets):
    ax.scatter(dat[:, 0], dat[:, 1], s=3, alpha=0.35, color=c)
    ax.axvline(0.05, color="gray", ls=":", lw=0.8); ax.axhline(0.05, color="gray", ls=":", lw=0.8)
    joint = ((dat[:, 0] < 0.05) & (dat[:, 1] < 0.05)).sum()
    ax.set_title(f"{title}\njoint 5% tail: {joint} days")
    ax.set_xlabel("XLF percentile")
axes[0].set_ylabel("XLK percentile")
plt.tight_layout(); plt.show()`;
