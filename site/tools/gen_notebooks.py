#!/usr/bin/env python3
"""Generate the 8 article notebooks into site/public/notebooks/.

Each notebook is SELF-CONTAINED and runnable offline: it synthesises its own
seeded data with numpy, so it runs on a stock scientific-Python stack without a
network or vendor data. Comments point to where you'd swap in real prices
(yfinance) and the production libraries (arch / statsmodels) used in the article.
"""
from __future__ import annotations

import json
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "notebooks"

REQ = "Runs on numpy + pandas + scipy + matplotlib. Synthetic, seeded data — illustrative, not investment advice."


def md(*lines: str) -> dict:
    text = "\n".join(lines)
    return {"cell_type": "markdown", "metadata": {}, "source": text.splitlines(keepends=True)}


def code(src: str) -> dict:
    src = src.strip("\n")
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": src.splitlines(keepends=True),
    }


def notebook(title: str, slug: str, dek: str, cells: list[dict]) -> dict:
    header = md(
        f"# {title}",
        "",
        f"_{dek}_",
        "",
        f"**pyportfolios.com** · [/research/{slug}](https://pyportfolios.com/research/{slug})",
        "",
        f"> {REQ}",
    )
    return {
        "cells": [header, *cells],
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3.x"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


NB: dict[str, dict] = {}

# ----------------------------------------------------------- time value of money
NB["time-value-of-money"] = notebook(
    "The time value of money, in code",
    "time-value-of-money",
    "Discounting, compounding conventions, and the yield curve.",
    [
        md("## Discount a cashflow stream off a zero curve"),
        code(
            """
import numpy as np
import pandas as pd

def discount_factors(times, zero_rates):       # continuous compounding
    return np.exp(-np.asarray(zero_rates) * np.asarray(times))

# a 5% annual-coupon bond, par 100, 5 years
cf = pd.DataFrame({"t": [1, 2, 3, 4, 5], "flow": [5, 5, 5, 5, 105]})
curve = {1: 0.030, 2: 0.033, 3: 0.035, 4: 0.036, 5: 0.037}   # zero rates

cf["rate"] = cf["t"].map(curve)
cf["df"]   = discount_factors(cf["t"], cf["rate"])
cf["pv"]   = cf["flow"] * cf["df"]
print(cf.round(4))
print(f"\\nBond price: {cf['pv'].sum():,.2f}")
"""
        ),
        md("## The discount curve — one dollar gets cheaper the later it arrives"),
        code(
            """
import matplotlib.pyplot as plt

t = np.linspace(0, 30, 200)
plt.figure(figsize=(7, 3.2))
plt.plot(t, np.exp(-0.037 * t), color="#0a8a8a", lw=2)
plt.title("Discount factor DF(t)")
plt.xlabel("maturity (years)"); plt.ylabel("DF(t)")
plt.tight_layout(); plt.show()
"""
        ),
    ],
)

# ---------------------------------------------------------------- black scholes
NB["black-scholes-from-first-principles"] = notebook(
    "Black–Scholes from first principles",
    "black-scholes-from-first-principles",
    "Price and hedge a European option, then see the smile the model cannot make.",
    [
        md("## Price and Greeks"),
        code(
            """
import numpy as np
from scipy.stats import norm

def bs_price(S, K, T, r, sigma, kind="call"):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if kind == "call":
        return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

def bs_greeks(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    pdf = norm.pdf(d1)
    return {
        "delta": norm.cdf(d1),
        "gamma": pdf / (S * sigma * np.sqrt(T)),
        "vega":  S * pdf * np.sqrt(T) / 100,
        "theta": (-(S * pdf * sigma) / (2 * np.sqrt(T))
                  - r * K * np.exp(-r * T) * norm.cdf(d2)) / 365,
        "rho":   K * T * np.exp(-r * T) * norm.cdf(d2) / 100,
    }

print(f"price = {bs_price(100, 100, 1.0, 0.02, 0.20):.2f}")
for k, v in bs_greeks(100, 100, 1.0, 0.02, 0.20).items():
    print(f"{k:>6}: {v: .4f}")
"""
        ),
        md("## Put–call parity sanity check, and the volatility smile"),
        code(
            """
import matplotlib.pyplot as plt

# parity: C - P = S - K e^{-rT}
C = bs_price(100, 100, 1, 0.02, 0.2, "call")
P = bs_price(100, 100, 1, 0.02, 0.2, "put")
assert abs((C - P) - (100 - 100 * np.exp(-0.02))) < 1e-8

# a stylised equity skew (real IV is recovered by inverting market prices)
K = np.linspace(70, 130, 30)
iv = 0.20 + 0.0008 * (K - 100) ** 2 / 10 - 0.0009 * (K - 100)
plt.figure(figsize=(7, 3.2))
plt.plot(K, iv, color="#0a8a8a", lw=2)
plt.title("Implied volatility by strike (stylised)")
plt.xlabel("strike"); plt.ylabel("implied vol")
plt.tight_layout(); plt.show()
"""
        ),
    ],
)

# ---------------------------------------------------------------- ledoit wolf
NB["ledoit-wolf-shrinkage"] = notebook(
    "Ledoit–Wolf shrinkage, from scratch",
    "ledoit-wolf-shrinkage",
    "Build the shrinkage estimator and measure its out-of-sample payoff.",
    [
        md("## The estimator (matches sklearn.covariance.LedoitWolf)"),
        code(
            """
import numpy as np

def ledoit_wolf(X):
    \"\"\"X: (T, N) returns, rows = observations. Returns (shrunk_cov, delta).\"\"\"
    T, N = X.shape
    X = X - X.mean(axis=0)
    S = X.T @ X / T
    mu = np.trace(S) / N
    F = mu * np.eye(N)
    d2 = ((S - F) ** 2).sum() / N
    X2 = X ** 2
    b2 = ((X2.T @ X2) / T - S ** 2).sum() / (N * T)
    b2 = min(b2, d2)
    delta = b2 / d2 if d2 > 0 else 0.0
    return (1 - delta) * S + delta * F, delta
"""
        ),
        md("## Out-of-sample: minimum-variance portfolio, sample vs shrinkage"),
        code(
            """
rng = np.random.default_rng(0)
T, N, k = 320, 40, 3
beta = rng.normal(size=(N, k))
factors = rng.normal(size=(T, k))
idio = rng.normal(size=(T, N)) * 0.6
X = (factors @ beta.T + idio) / 100        # daily-ish returns with factor structure

def min_var(cov):
    inv = np.linalg.pinv(cov)
    w = inv @ np.ones(cov.shape[0])
    return w / w.sum()

split = 220
Xtr, Xte = X[:split], X[split:]
S = np.cov(Xtr, rowvar=False)
LW, delta = ledoit_wolf(Xtr)
print(f"shrinkage intensity delta = {delta:.3f}\\n")

for name, M in [("sample", S), ("ledoit-wolf", LW)]:
    w = min_var(M)
    oos_vol = np.std(Xte @ w) * np.sqrt(252)
    print(f"{name:>12}:  OOS vol {oos_vol:6.2%}   max |w| {np.abs(w).max():5.2f}")
"""
        ),
    ],
)

# ---------------------------------------------------------------- HRP
NB["hierarchical-risk-parity"] = notebook(
    "Hierarchical Risk Parity, end to end",
    "hierarchical-risk-parity",
    "Allocate without inverting a covariance matrix.",
    [
        md("## HRP in ~40 lines"),
        code(
            """
import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage
from scipy.spatial.distance import squareform

def _ivp(cov):
    ivp = 1 / np.diag(cov)
    return ivp / ivp.sum()

def _cluster_var(cov, items):
    c = cov.loc[items, items]
    w = _ivp(c)                          # 1-D inverse-variance weights
    return float(w @ c.values @ w)       # wᵀ Σ w as a scalar

def _quasi_diag(link):
    link = link.astype(int)
    order = pd.Series([link[-1, 0], link[-1, 1]])
    n = link[-1, 3]
    while order.max() >= n:
        order.index = range(0, order.shape[0] * 2, 2)
        clusters = order[order >= n]
        i, j = clusters.index, clusters.values - n
        order[i] = link[j, 0]
        order = pd.concat([order, pd.Series(link[j, 1], index=i + 1)])
        order = order.sort_index().reset_index(drop=True)
    return order.tolist()

def hrp(returns):
    cov, corr = returns.cov(), returns.corr()
    dist = np.sqrt((1 - corr) / 2.0)
    link = linkage(squareform(dist, checks=False), "single")
    order = corr.index[_quasi_diag(link)].tolist()
    w = pd.Series(1.0, index=order)
    clusters = [order]
    while clusters:
        clusters = [c[s:e] for c in clusters
                    for s, e in ((0, len(c) // 2), (len(c) // 2, len(c)))
                    if len(c) > 1]
        for i in range(0, len(clusters), 2):
            c0, c1 = clusters[i], clusters[i + 1]
            v0, v1 = _cluster_var(cov, c0), _cluster_var(cov, c1)
            alpha = 1 - v0 / (v0 + v1)
            w[c0] *= alpha
            w[c1] *= 1 - alpha
    return w.sort_index()
"""
        ),
        md("## Run it on three correlated blocks"),
        code(
            """
rng = np.random.default_rng(1)
def block(n, rho, T):
    z = rng.normal(size=(T, 1)); e = rng.normal(size=(T, n))
    return np.sqrt(rho) * z + np.sqrt(1 - rho) * e

T = 600
R = np.hstack([block(4, 0.7, T), block(4, 0.5, T), block(2, 0.3, T)]) / 100
returns = pd.DataFrame(R, columns=[f"A{i:02d}" for i in range(R.shape[1])])

w = hrp(returns)
print(w.round(3))
print(f"\\nlargest weight: {w.max():.1%}   effective N: {1 / (w ** 2).sum():.1f}")
"""
        ),
    ],
)

# ---------------------------------------------------------------- EVT + t-copula
NB["evt-t-copula-var"] = notebook(
    "Market risk via EVT + t-copula",
    "evt-t-copula-var",
    "A runnable, offline version of the GARCH/EVT/copula tail-risk pipeline.",
    [
        md(
            "## Note",
            "",
            "The article filters volatility with a **GARCH-t** (`arch`). To keep this notebook",
            "dependency-light and runnable anywhere, we use an **EWMA** volatility filter as a",
            "stand-in. Swap in `arch_model(..., vol='GARCH', dist='t')` for production.",
        ),
        code(
            """
import numpy as np
import pandas as pd
from scipy.stats import genpareto, t as student_t, rankdata, chi2

rng = np.random.default_rng(2)
T, N, nu_true = 2000, 3, 5
corr_true = np.array([[1, .5, .3], [.5, 1, .4], [.3, .4, 1.0]])
L = np.linalg.cholesky(corr_true)

# correlated Student-t shocks -> fat tails + tail dependence
g = (L @ rng.standard_normal((N, T))).T
mix = np.sqrt(nu_true / chi2.rvs(nu_true, size=(T, 1), random_state=rng))
rets = pd.DataFrame(g * mix * 0.01, columns=["A", "B", "C"])
weights = np.array([0.4, 0.35, 0.25])
"""
        ),
        md("## 1) EWMA filter  2) EVT (POT) margins  3) t-copula  4) Monte Carlo VaR"),
        code(
            """
# 1) volatility filter -> standardised residuals
ewm_var = rets.ewm(span=33).var()
Z = (rets / np.sqrt(ewm_var)).dropna()
sigma_fcast = np.sqrt(ewm_var.iloc[-1].values)

# 2) semi-parametric margins: empirical body + GPD (Pareto) upper tail
def fit_pot(z, q=0.95):
    u = np.quantile(z, q)
    xi, _, beta = genpareto.fit(z[z > u] - u, floc=0)
    return u, xi, beta

tails = {c: fit_pot(Z[c].values) for c in Z}

def inv_margin(u, z, tail):
    out = np.quantile(z, u)
    hi = u > 0.95
    u_t, xi, beta = tail
    out[hi] = u_t + genpareto.ppf((u[hi] - 0.95) / 0.05, xi, scale=beta)
    return out

# 3) t-copula on the pseudo-observations
U = Z.apply(lambda s: rankdata(s) / (len(s) + 1)).values
nu = 6
corr = np.corrcoef(student_t.ppf(U, df=nu), rowvar=False)

# 4) simulate, invert margins, re-inflate by forecast vol
def t_copula_sample(corr, nu, n):
    Lc = np.linalg.cholesky(corr)
    z = (Lc @ rng.standard_normal((corr.shape[0], n))).T
    w = np.sqrt(nu / chi2.rvs(nu, size=(n, 1), random_state=rng))
    return student_t.cdf(z * w, df=nu)

n = 100_000
Us = t_copula_sample(corr, nu, n)
sim = np.column_stack([inv_margin(Us[:, k], Z[c].values, tails[c]) for k, c in enumerate(Z)])
sim_rets = sim * sigma_fcast

pnl = sim_rets @ weights
loss = -pnl
for a in (0.95, 0.99):
    var = np.quantile(loss, a)
    cvar = loss[loss >= var].mean()
    print(f"{a:.0%}   VaR {var:6.2%}   CVaR {cvar:6.2%}")

# contrast with a naive Gaussian VaR
mu, sd = pnl.mean(), pnl.std()
from scipy.stats import norm
print(f"\\nGaussian 99% VaR (understates): {-(mu + sd * norm.ppf(0.01)):6.2%}")
"""
        ),
    ],
)

# ---------------------------------------------------------------- VaR / CVaR
NB["var-cvar-three-ways"] = notebook(
    "VaR & CVaR, three ways",
    "var-cvar-three-ways",
    "Historical, parametric and Monte Carlo tail risk — then a Kupiec backtest.",
    [
        md("## Three estimators of the same number"),
        code(
            """
import numpy as np
from scipy.stats import norm, t as student_t

rng = np.random.default_rng(7)
# fat-tailed daily P&L (Student-t, scaled)
pnl = student_t.rvs(5, size=4000, random_state=rng) * 0.01

def hist(pnl, a=0.99):
    loss = -pnl; v = np.quantile(loss, a); return v, loss[loss >= v].mean()

def normal_var(pnl, a=0.99):
    return -(pnl.mean() + pnl.std(ddof=1) * norm.ppf(1 - a))

def t_var(pnl, a=0.99):
    nu, mu, sg = student_t.fit(pnl)
    return -(mu + sg * student_t.ppf(1 - a, nu))

hv, hc = hist(pnl)
print(f"historical    99% VaR {hv:6.2%}   CVaR {hc:6.2%}")
print(f"normal        99% VaR {normal_var(pnl):6.2%}")
print(f"student-t     99% VaR {t_var(pnl):6.2%}")
"""
        ),
        md("## Kupiec proportion-of-failures backtest"),
        code(
            """
def kupiec_pof(exceed, a=0.99):
    n = len(exceed); x = int(exceed.sum()); p = 1 - a
    pi = x / n if n else 0.0
    if x == 0:
        return x, n, np.nan
    lr = -2 * (np.log((1 - p)**(n - x) * p**x)
               - np.log((1 - pi)**(n - x) * pi**x))
    return x, n, lr            # compare LR to chi2(1): 3.84 at 95%

var99 = np.quantile(-pnl, 0.99)
exceed = (-pnl) > var99
x, n, lr = kupiec_pof(exceed)
print(f"exceedances {x}/{n} = {x/n:.2%}  (target 1.00%)   Kupiec LR {lr:.2f}")
"""
        ),
    ],
)

# ---------------------------------------------------------------- momentum
NB["cross-sectional-momentum"] = notebook(
    "Momentum, honestly backtested",
    "cross-sectional-momentum",
    "A 12-1 cross-sectional book with the look-ahead gaps closed.",
    [
        md("## Synthetic monthly panel with a little embedded momentum"),
        code(
            """
import numpy as np
import pandas as pd

rng = np.random.default_rng(3)
T, N = 240, 60                                   # 20y monthly, 60 names
shock = rng.normal(0, 0.06, size=(T, N))
mret = pd.DataFrame(shock)
# inject mild persistence so winners keep winning (then we must NOT cheat to see it)
for t in range(12, T):
    mret.iloc[t] += 0.05 * mret.iloc[t-12:t-1].mean()
"""
        ),
        md("## Signal, the single explicit lag, costs"),
        code(
            """
mom = (1 + mret).rolling(11).apply(np.prod, raw=True) - 1     # info through month t
ranks = mom.rank(axis=1, pct=True)
longs  = (ranks >= 0.9).astype(float)
shorts = (ranks <= 0.1).astype(float)
w = longs.div(longs.sum(axis=1), axis=0) - shorts.div(shorts.sum(axis=1), axis=0)

port = (w.shift(1) * mret).sum(axis=1)            # weights at t earn returns at t+1
turnover = w.diff().abs().sum(axis=1) / 2
net = port - (turnover * 0.0010).shift(1)         # 10 bps round-trip

def sharpe(r): return np.sqrt(12) * r.mean() / r.std()
print(f"gross Sharpe {sharpe(port.dropna()):.2f}")
print(f"  net Sharpe {sharpe(net.dropna()):.2f}")
print(f"avg monthly turnover {turnover.mean():.0%}")
"""
        ),
        md("## The decile spread (the momentum signature)"),
        code(
            """
import matplotlib.pyplot as plt
dec = pd.qcut(mom.stack(), 10, labels=False)
fwd = mret.shift(-1).stack()
avg = fwd.groupby(dec).mean()
plt.figure(figsize=(7, 3.2))
plt.bar(range(1, 11), avg.values * 100,
        color=["#4a4a42"]*7 + ["#0a8a8a"]*3)
plt.title("Average next-month return by momentum decile")
plt.xlabel("decile (1 = losers, 10 = winners)"); plt.ylabel("% / month")
plt.tight_layout(); plt.show()
"""
        ),
    ],
)

# ---------------------------------------------------------------- pairs
NB["pairs-trading-cointegration"] = notebook(
    "Pairs trading & cointegration",
    "pairs-trading-cointegration",
    "Build a cointegrated pair, trade the z-score, and pay the spread.",
    [
        md(
            "## Note",
            "",
            "The article uses `statsmodels` (`adfuller`, OLS). Here we estimate the hedge ratio",
            "with `numpy.polyfit` so the notebook runs without statsmodels; the ADF test is shown",
            "as an optional cell.",
        ),
        code(
            """
import numpy as np
import pandas as pd

rng = np.random.default_rng(4)
n = 1500
common = np.cumsum(rng.normal(0, 1, n))           # shared stochastic trend
A = 50 + common + rng.normal(0, 1, n)
spread_true = rng.normal(0, 1, n)
spread_true = pd.Series(spread_true).ewm(span=10).mean().values * 3   # mean-reverting
B = 30 + 0.8 * common + spread_true               # B shares A's trend -> cointegrated
A = pd.Series(A); B = pd.Series(B)

beta = np.polyfit(np.log(B), np.log(A), 1)[0]     # hedge ratio
spread = np.log(A) - beta * np.log(B)
print(f"hedge ratio beta = {beta:.2f}")
"""
        ),
        md("## Z-score signal with entry/exit hysteresis, and a costed backtest"),
        code(
            """
window, entry, exit_ = 60, 2.0, 0.5
z = (spread - spread.rolling(window).mean()) / spread.rolling(window).std()

state = np.where(z < -entry, 1, np.where(z > entry, -1, np.nan))
pos = pd.Series(state, index=z.index)
pos[z.abs() < exit_] = 0
pos = pos.ffill().fillna(0)

pnl = pos.shift(1) * spread.diff()
net = pnl - pos.diff().abs().shift(1) * 0.0005     # 5 bps per leg change
sharpe = np.sqrt(252) * net.mean() / net.std()
print(f"net Sharpe {sharpe:.2f}   trades {int(pos.diff().abs().sum())}")
"""
        ),
        md(
            "## Optional — the formal Engle–Granger test (needs statsmodels)",
        ),
        code(
            """
try:
    from statsmodels.tsa.stattools import adfuller
    print(f"ADF p-value on the spread: {adfuller(spread.dropna())[1]:.4f}")
except ImportError:
    print("statsmodels not installed -> pip install statsmodels")
"""
        ),
    ],
)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, nb in NB.items():
        path = OUT / f"{slug}.ipynb"
        path.write_text(json.dumps(nb, indent=1), encoding="utf-8")
        print(f"wrote {path.relative_to(OUT.parent.parent)}")
    print(f"\\n{len(NB)} notebooks -> {OUT}")


if __name__ == "__main__":
    main()
