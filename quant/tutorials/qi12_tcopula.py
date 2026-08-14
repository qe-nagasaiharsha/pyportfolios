"""
QI12 - Gaussian vs t-copula: capturing joint crashes (topic card 12/16).
Assets: XLF vs XLK (SPDR sector ETFs) · Timeframe: Jan 2007 - Dec 2024
Libs: SciPy NumPy Pandas seaborn Matplotlib.

Reproduces Louis's QI12_Gaussian_vs_tCopula notebook against the pinned CSV.
The source notebook downloads from yfinance with a Stooq fallback; here the
same series come from quant/data/qi12_tcopula.csv so the published numbers do
not move between builds. Everything else - the pseudo-observations, both fits,
the profile likelihood, the 2m-draw simulation - is the notebook's, seeded the
same way (np.random.seed(42)).

Scatter clouds are thinned for the web payload; every COUNT is computed on the
full sample, never on the thinned one.

Emits the article data module + the runnable companion notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, load, md, r, write_nb, write_ts  # noqa: E402

SLUG = "gaussian-vs-t-copula"
START, END = "2007-01-01", "2024-12-31"
SEED = 42
N_SIM = 2_000_000
NUS = np.arange(2, 31)
QS = (0.05, 0.01)
# Thinned clouds for the article charts. emit.write_ts uses indent=2, so a
# nested [[x,y],...] costs ~4 lines per point while flat x/y arrays cost 2 -
# hence the flat shape below. Counts are never computed on the thinned data.
PLOT_POINTS = 300
CORNER_KEEP = 60           # always retain the bottom-left tail: the whole point


def t_copula_loglik(nu, u, rho):
    x = stats.t.ppf(u, df=nu)
    cov = np.array([[1, rho], [rho, 1]])
    num = stats.multivariate_t(loc=[0, 0], shape=cov, df=nu).logpdf(x)
    den = stats.t.logpdf(x, df=nu).sum(axis=1)
    return float(np.sum(num - den))


def thin(a: np.ndarray, k: int = PLOT_POINTS, nd: int = 4) -> dict:
    """Even thinning, but always keep the bottom-left corner - that tail IS the
    argument. Returns flat x/y arrays to keep the emitted module small."""
    if len(a) <= k:
        idx = np.arange(len(a))
    else:
        keep = np.linspace(0, len(a) - 1, k).round().astype(int)
        corner = np.argsort(a[:, 0] + a[:, 1])[:CORNER_KEEP]
        idx = np.unique(np.concatenate([keep, corner]))
    sub = a[idx]
    return {"x": r([float(v) for v in sub[:, 0]], nd),
            "y": r([float(v) for v in sub[:, 1]], nd)}


def build() -> dict:
    np.random.seed(SEED)

    px = load("qi12_tcopula")[["XLF", "XLK"]].loc[START:END].dropna()
    rets = px.pct_change().dropna()
    n = len(rets)
    lin_corr = float(rets["XLF"].corr(rets["XLK"]))

    u = rets.rank() / (n + 1)

    # ---- fits ----------------------------------------------------------
    z = stats.norm.ppf(u.values)
    rho_g = float(np.corrcoef(z.T)[0, 1])
    tau = float(stats.kendalltau(u["XLF"], u["XLK"]).statistic)
    rho_t = float(np.sin(np.pi * tau / 2))

    lls = [t_copula_loglik(v, u.values, rho_t) for v in NUS]
    nu_hat = int(NUS[int(np.argmax(lls))])

    # ---- 4.1 closed-form lower-tail dependence -------------------------
    lam_t = float(2 * stats.t.cdf(
        -np.sqrt((nu_hat + 1) * (1 - rho_t) / (1 + rho_t)), df=nu_hat + 1))

    # ---- 4.2 simulate and count joint crashes --------------------------
    cov_g = np.array([[1, rho_g], [rho_g, 1]])
    u_g = stats.norm.cdf(np.random.multivariate_normal([0, 0], cov_g, N_SIM))

    cov_t = np.array([[1, rho_t], [rho_t, 1]])
    g = np.random.multivariate_normal([0, 0], cov_t, N_SIM)
    chi = np.random.chisquare(nu_hat, N_SIM) / nu_hat
    u_t = stats.t.cdf(g / np.sqrt(chi)[:, None], df=nu_hat)

    joint = []
    for q in QS:
        emp = float(((u["XLF"] < q) & (u["XLK"] < q)).mean())
        pg = float(((u_g[:, 0] < q) & (u_g[:, 1] < q)).mean())
        pt = float(((u_t[:, 0] < q) & (u_t[:, 1] < q)).mean())
        joint.append({
            "q": q,
            "empirical": r(emp * n, 1), "gaussian": r(pg * n, 1), "t": r(pt * n, 1),
            "gaussianShortfall": r(emp / pg if pg else float("nan"), 1),
        })
        print(f"  q={q:.0%}  empirical {emp*n:6.1f}   gaussian {pg*n:6.1f}   t {pt*n:6.1f}")

    # panel counts use the notebook's first-n slice, not the thinned cloud
    def panel(a):
        s = a[:n]
        return {"points": thin(s), "joint5": int(((s[:, 0] < 0.05) & (s[:, 1] < 0.05)).sum())}

    real = u.values
    print(f"  n={n}  linear corr {lin_corr:.2f}")
    print(f"  gaussian rho {rho_g:.3f}   t rho {rho_t:.3f}  nu {nu_hat}   lambda {lam_t:.3f}")

    return {
        "window": {"start": str(px.index[0].date()), "end": str(px.index[-1].date()), "n": n},
        "linCorr": r(lin_corr, 3),
        "fit": {"rhoG": r(rho_g, 3), "rhoT": r(rho_t, 3), "tau": r(tau, 3),
                "nu": nu_hat, "lambdaT": r(lam_t, 3)},
        "profile": {
            "nus": [int(v) for v in NUS],
            "ll": r([float(v) for v in lls], 1),
            "nuHat": nu_hat,
        },
        "raw": thin(rets.values * 100, PLOT_POINTS, nd=3),
        "panels": {
            "real": {**panel(real), "label": "Real data (XLF/XLK)"},
            "gaussian": {**panel(u_g), "label": f"Gaussian (rho={rho_g:.2f})"},
            "t": {**panel(u_t), "label": f"t-copula (rho={rho_t:.2f}, nu={nu_hat})"},
        },
        "joint": joint,
        "nSim": N_SIM,
    }


def notebook_cells() -> list:
    return [
        md("""# Gaussian vs t-Copula: Capturing Joint Crashes
### Two models of "moving together." Only one believes in contagion.

*Content format: Quant Insights · Category: Risk Management*

**The claim we test:** a correlation number tells you how two assets co-move *on average* — it says nothing about whether they crash *together*. The Gaussian copula assumes joint extremes are vanishingly rare (zero tail dependence); the t-copula assumes crashes cluster. Using two sector ETFs — Financials (XLF) and Technology (XLK) — through the GFC, COVID and 2022, we measure which model matches how markets actually behave on the worst days.

**How we'll judge it**
1. **The disagreement** — same correlation, different tails
2. **The contenders** — Gaussian vs Student-t copula
3. **The test** — fit both to 18 years of XLF/XLK returns
4. **The scoreboard** — who predicts the observed joint crashes?
5. **Verdict** — what 2008 already told us"""),

        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

np.random.seed(42)
plt.rcParams["figure.dpi"] = 110
sns.set_style("whitegrid")"""),

        md("""## 1. The disagreement

A copula separates *how assets co-move* from *how each behaves alone*. Two copulas can share the same correlation ρ yet disagree completely about the tails:

- **Gaussian copula:** as moves get more extreme, the dependence *fades*. Joint crashes are essentially coincidences. Lower-tail dependence λ = **0**, always.
- **t-copula:** dependence *persists* into the extremes — crashes arrive together. λ > 0, controlled by the degrees of freedom ν (smaller ν = fatter joint tails).

This isn't academic. The Gaussian copula priced the CDOs of 2008 — and its zero-tail-dependence assumption is precisely what failed when housing defaults arrived together."""),

        md("""## 2. The contenders

| | Gaussian copula | t-copula |
|---|---|---|
| Parameters | ρ | ρ, ν (degrees of freedom) |
| Lower-tail dependence λ | 0 — always | $2\\,t_{\\nu+1}\\!\\big(-\\sqrt{\\tfrac{(\\nu+1)(1-\\rho)}{1+\\rho}}\\big) > 0$ |
| Joint crashes | Coincidences | Expected |
| As ν → ∞ | — | Converges to Gaussian |

The t-copula *contains* the Gaussian as a limit — so if the data prefers small ν, that's the data voting for tail dependence."""),

        md("""## 3. The test

### 3.1 Data: XLF vs XLK through three crises"""),

        code("""TICKERS = ["XLF", "XLK"]
START, END = "2007-01-01", "2024-12-31"

def load_prices(tickers, start, end):
    \"\"\"Adjusted-close prices: yfinance first, Stooq as fallback.\"\"\"
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
print(f"Linear correlation: {rets['XLF'].corr(rets['XLK']):.2f}")"""),

        md("""### 3.2 Strip the marginals: pseudo-observations
Copulas work on ranks. Converting each series to its empirical percentile removes the marginal distributions and leaves only the dependence structure."""),

        code("""u = rets.rank() / (n + 1)          # pseudo-observations in (0,1)

fig, axes = plt.subplots(1, 2, figsize=(11, 4.6))
axes[0].scatter(rets["XLF"], rets["XLK"], s=4, alpha=0.4, color="steelblue")
axes[0].set_title("Raw daily returns"); axes[0].set_xlabel("XLF"); axes[0].set_ylabel("XLK")
axes[1].scatter(u["XLF"], u["XLK"], s=4, alpha=0.4, color="darkorange")
axes[1].set_title("Pseudo-observations (the copula's view)")
axes[1].set_xlabel("XLF percentile"); axes[1].set_ylabel("XLK percentile")
plt.tight_layout(); plt.show()

print("Note the crowding in the corners of the right plot — especially bottom-left (joint crashes).")"""),

        md("""### 3.3 Fit both copulas
Gaussian: correlation of normal scores. t-copula: same ρ (via Kendall's τ), with ν chosen by maximum likelihood."""),

        code("""# --- Gaussian copula fit ---
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
print("\\nSmall ν = strong tail dependence. ν above ~30 would mean 'basically Gaussian'.")"""),

        md("""## 4. The scoreboard

### 4.1 Tail dependence: the headline number
Probability that one ETF is in its worst q% *given* the other is — as q → 0."""),

        code("""# closed-form lower-tail dependence of the t-copula
lam_t = 2 * stats.t.cdf(-np.sqrt((nu_hat + 1) * (1 - rho_t) / (1 + rho_t)), df=nu_hat + 1)
print(f"Lower-tail dependence λ — Gaussian: 0.000 (by construction)")
print(f"Lower-tail dependence λ — t-copula: {lam_t:.3f}")"""),

        md("""### 4.2 Empirical test: joint crash frequency
Count the days both ETFs landed in their worst 5% (and 1%) simultaneously — then ask each fitted copula how many such days it *predicts* over the same sample size."""),

        code("""def simulate_gaussian(rho, size):
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
    print(f"{q:>4.0%} {emp*n:>10.1f} {pg*n:>10.1f} {pt*n:>10.1f}")"""),

        code("""# visual: simulated pseudo-observations vs reality, tails highlighted
fig, axes = plt.subplots(1, 3, figsize=(13.5, 4.4))
sets = [(u.values, "Real data (XLF/XLK)", "black"),
        (u_g[:len(u)], f"Gaussian (ρ={rho_g:.2f})", "steelblue"),
        (u_t[:len(u)], f"t-copula (ρ={rho_t:.2f}, ν={nu_hat})", "crimson")]
for ax, (dat, title, c) in zip(axes, sets):
    ax.scatter(dat[:, 0], dat[:, 1], s=3, alpha=0.35, color=c)
    ax.axvline(0.05, color="gray", ls=":", lw=0.8); ax.axhline(0.05, color="gray", ls=":", lw=0.8)
    joint = ((dat[:, 0] < 0.05) & (dat[:, 1] < 0.05)).sum()
    ax.set_title(f"{title}\\njoint 5% tail: {joint} days")
    ax.set_xlabel("XLF percentile")
axes[0].set_ylabel("XLK percentile")
plt.tight_layout(); plt.show()"""),

        md("""## 5. Verdict

**The t-copula wins where it counts — the corner where portfolios die.** Typical result on this pair: the Gaussian copula *underpredicts* joint 1%-tail days by a large factor, while the t-copula lands close to the observed count. The likelihood agrees: the fitted ν is small, which is the data explicitly rejecting the Gaussian limit.

**Why it matters:**
- **Risk models built on Gaussian dependence** understate exactly the events that cause maximum damage — simultaneous crashes across holdings. Your 99% "diversified" VaR is too optimistic in the only scenario you bought diversification for.
- **The 2008 lesson, quantified** — the Gaussian copula's λ = 0 is the mathematical form of "national housing markets can't all fall together." They did. Any dependence model with zero tail dependence repeats that mistake in new clothing.

**The honest caveats:**
- The t-copula is *symmetric* — it implies joint booms are as likely as joint crashes. Equity data usually shows *asymmetric* dependence (crashes cluster more than rallies). A skewed-t or Clayton copula captures that; the t is the pragmatic middle ground.
- One ν for all seasons — dependence itself shifts with regimes (see our 60/40 case study). Time-varying copulas exist but multiply complexity.

**Where to go next:** the **Copulas & Tail Dependence** tutorial for foundations; **CVaR / Expected Shortfall** for the risk measure that consumes these joint-tail probabilities; and the CDO story in our curriculum's credit module for the trillion-dollar version of this comparison.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]


def main() -> None:
    # The article publishes UNEXECUTED - prose and code only, no figures and no
    # computed numbers - so the default output is just the runnable notebook.
    # `--data` re-emits the article data module for whoever wants the results
    # back; nothing on the site imports it today.
    emit_data = "--data" in sys.argv
    if emit_data:
        print(f"  ts -> {write_ts(SLUG, build())}")
    print(f"  nb -> {write_nb(SLUG, notebook_cells())}")
    if not emit_data:
        print("  (no data module: this article publishes unexecuted; pass --data to emit one)")


if __name__ == "__main__":
    main()
