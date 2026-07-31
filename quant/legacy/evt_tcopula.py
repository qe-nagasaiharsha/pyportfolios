"""
Legacy upgrade - EVT + t-copula VaR (article: evt-t-copula-var).
Assets: ^GSPC + ^FTSE (reuses quant/data/t11_copulas.csv) · 2000-2024 · 60/40 book.

The real conditional tail-risk pipeline: GARCH(1,1)-t filter per asset,
semi-parametric margins (empirical body + GPD tails via scipy genpareto),
Student-t copula calibrated by profile MLE (Kendall-tau rho + nu grid),
100k seeded Monte-Carlo scenarios -> portfolio VaR/CVaR, compared against
conditional Gaussian and unconditional historical VaR.
Emits the article data module + the standalone runnable notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from arch import arch_model
from scipy.special import gammaln
from scipy.stats import chi2, genpareto, norm, rankdata, t as student_t

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, load, md, r, write_nb, write_ts  # noqa: E402

SLUG = "evt-t-copula-var"
SEED = 42
WEIGHTS = np.array([0.6, 0.4])   # ^GSPC / ^FTSE
Q_TAIL = 0.95                    # POT threshold quantile
N_SIM = 100_000
NU_GRID = np.arange(2.5, 30.5, 0.5)


def fit_pot(z: np.ndarray, q: float = Q_TAIL) -> tuple[float, float, float]:
    """GPD fit to exceedances over the q-quantile threshold. -> (u, xi, beta)"""
    u = float(np.quantile(z, q))
    excess = z[z > u] - u
    xi, _, beta = genpareto.fit(excess, floc=0)
    return u, float(xi), float(beta)


def tcopula_loglik(x: np.ndarray, rho: float, nu: float) -> float:
    """Bivariate t-copula log-likelihood at t-scores x (n,2)."""
    det = 1.0 - rho * rho
    q = (x[:, 0] ** 2 - 2 * rho * x[:, 0] * x[:, 1] + x[:, 1] ** 2) / det
    d = 2
    log_mvt = (gammaln((nu + d) / 2) - gammaln(nu / 2) - (d / 2) * np.log(nu * np.pi)
               - 0.5 * np.log(det) - (nu + d) / 2 * np.log1p(q / nu))
    log_marg = student_t.logpdf(x, nu).sum(axis=1)
    return float((log_mvt - log_marg).sum())


def inv_margin(u: np.ndarray, z: np.ndarray, lo, hi, q: float = Q_TAIL) -> np.ndarray:
    """Semi-parametric quantile function: empirical body + GPD in both tails."""
    out = np.quantile(z, u)
    up = u > q
    out[up] = hi[0] + genpareto.ppf((u[up] - q) / (1 - q), hi[1], scale=hi[2])
    dn = u < 1 - q
    out[dn] = -(lo[0] + genpareto.ppf((1 - q - u[dn]) / (1 - q), lo[1], scale=lo[2]))
    return out


def main() -> None:
    px = load("t11_copulas")[["^GSPC", "^FTSE"]].dropna()
    rets = np.log(px / px.shift(1)).dropna()
    cols = list(rets.columns)
    n = len(rets)

    # ------------------------------------------- 1. GARCH-t filter per asset
    Z, sigma_f, garch = {}, {}, {}
    for c in cols:
        am = arch_model(100 * rets[c], mean="Constant", vol="GARCH", p=1, q=1, dist="t")
        res = am.fit(disp="off")
        Z[c] = res.std_resid
        sigma_f[c] = float(np.sqrt(res.forecast(horizon=1).variance.iloc[-1, 0]))
        p = res.params
        garch[c] = {"alpha": r(float(p["alpha[1]"]), 3), "beta": r(float(p["beta[1]"]), 3),
                    "nu": r(float(p["nu"]), 1), "sigmaFcast": r(sigma_f[c] / 100, 5)}
        print(f"{c}: alpha+beta={p['alpha[1]'] + p['beta[1]']:.3f}  nu={p['nu']:.1f}  "
              f"sigma_fcast={sigma_f[c] / 100:.4%}/day")
    Z = pd.DataFrame(Z).dropna()

    # -------------------------------- 2. semi-parametric margins (GPD tails)
    tails = {}
    for c in cols:
        z = Z[c].values
        tails[c] = {"upper": fit_pot(z), "lower": fit_pot(-z)}  # lower = loss tail
        print(f"{c}: loss-tail GPD xi={tails[c]['lower'][1]:.3f} beta={tails[c]['lower'][2]:.3f} "
              f"(u={tails[c]['lower'][0]:.3f}) | gain tail xi={tails[c]['upper'][1]:.3f}")

    # ---------------------------------- 3. t-copula by profile MLE on nu grid
    U = Z.apply(lambda s: rankdata(s) / (len(s) + 1)).values
    tau = float(pd.Series(Z[cols[0]]).corr(pd.Series(Z[cols[1]]), method="kendall"))
    rho = float(np.sin(np.pi * tau / 2))                     # Kendall inversion
    lls = []
    for nu in NU_GRID:
        x = student_t.ppf(U, nu)
        lls.append(tcopula_loglik(x, rho, nu))
    nu_hat = float(NU_GRID[int(np.argmax(lls))])
    ll_gauss = tcopula_loglik(norm.ppf(U), rho, 1e6)          # ~Gaussian limit
    print(f"copula: tau={tau:.3f} rho={rho:.3f} nu_hat={nu_hat:.1f} "
          f"logL(t)={max(lls):.1f} vs ~Gaussian {ll_gauss:.1f}")

    # ------------------------------------------ 4. Monte-Carlo from the copula
    rng = np.random.default_rng(SEED)
    L = np.linalg.cholesky(np.array([[1, rho], [rho, 1]]))
    g = (L @ rng.standard_normal((2, N_SIM))).T
    mix = np.sqrt(nu_hat / chi2.rvs(nu_hat, size=(N_SIM, 1), random_state=rng))
    U_sim = student_t.cdf(g * mix, df=nu_hat)

    sim = np.column_stack([
        inv_margin(U_sim[:, k], Z[c].values, tails[c]["lower"], tails[c]["upper"])
        for k, c in enumerate(cols)
    ])
    sf = np.array([sigma_f[c] for c in cols]) / 100          # back to return units
    sim_rets = sim * sf
    pnl = sim_rets @ WEIGHTS
    loss = -pnl

    # ------------------------------------------------- 5. the three answers
    # (a) EVT + t-copula (simulated), (b) conditional Gaussian (variance-
    # covariance on the same vol forecasts), (c) unconditional historical.
    rho_p = float(Z[cols[0]].corr(Z[cols[1]]))               # Pearson, residuals
    sigma_p = float(np.sqrt(WEIGHTS @ (np.outer(sf, sf) * np.array([[1, rho_p], [rho_p, 1]])) @ WEIGHTS))
    hist_pnl = (rets @ WEIGHTS).values

    table = {}
    for a in (0.95, 0.99):
        v = float(np.quantile(loss, a))
        cv = float(loss[loss >= v].mean())
        gauss = float(-norm.ppf(1 - a) * sigma_p)
        hist = float(-np.quantile(hist_pnl, 1 - a))
        table[str(int(a * 100))] = {
            "hist": r(hist), "gauss": r(gauss), "tcop": r(v), "tcopCvar": r(cv),
        }
        print(f"{a:.0%}: hist {hist:.4%}  gauss {gauss:.4%}  t-cop {v:.4%}  CVaR {cv:.4%}")

    gap99 = table["99"]["tcop"] / table["99"]["gauss"] - 1

    # ------------------------------------------------------- chart payloads
    # (a) GPD QQ plot for the S&P loss tail: empirical excess quantiles vs GPD
    u0, xi0, b0 = tails["^GSPC"]["lower"]
    exc = np.sort((-Z["^GSPC"].values)[(-Z["^GSPC"].values) > u0] - u0)
    m = 99
    probs = (np.arange(1, m + 1) - 0.5) / m
    qq_emp = np.quantile(exc, probs)
    qq_gpd = genpareto.ppf(probs, xi0, scale=b0)
    lim = float(max(qq_emp.max(), qq_gpd.max()))

    # (b) simulated loss histogram (in %), with Gaussian overlay + VaR lines
    loss_pct = loss * 100
    edges = np.linspace(float(loss_pct.min()), float(np.percentile(loss_pct, 99.9)), 61)
    counts, _ = np.histogram(loss_pct, bins=edges)
    centres = (edges[:-1] + edges[1:]) / 2
    bw = edges[1] - edges[0]
    gauss_overlay = norm.pdf(centres, 0, sigma_p * 100) * N_SIM * bw

    payload = {
        "params": {
            "assets": cols, "weights": r(list(WEIGHTS), 2),
            "start": str(rets.index[0].date()), "end": str(rets.index[-1].date()),
            "nObs": n, "seed": SEED, "nSim": N_SIM, "qTail": Q_TAIL,
        },
        "garch": garch,
        "tails": {
            c: {"lossXi": r(tails[c]["lower"][1], 3), "lossBeta": r(tails[c]["lower"][2], 3),
                "lossU": r(tails[c]["lower"][0], 3), "gainXi": r(tails[c]["upper"][1], 3),
                "nExceed": int(((-Z[c].values) > tails[c]["lower"][0]).sum())}
            for c in cols
        },
        "copula": {
            "tau": r(tau, 3), "rho": r(rho, 3), "nu": r(nu_hat, 1),
            "rhoPearson": r(rho_p, 3),
            "llT": r(float(max(lls)), 1), "llGauss": r(ll_gauss, 1),
        },
        "qq": {
            "points": [[r(float(a), 3), r(float(b), 3)] for a, b in zip(qq_gpd, qq_emp)],
            "lim": r(lim, 2),
        },
        "var": table,
        "gap99": r(float(gap99), 3),
        "sigmaP": r(sigma_p, 5),
        "histogram": {
            "edges": r(list(edges), 3), "counts": [int(c) for c in counts],
            "gauss": r(list(gauss_overlay), 1),
            "var99tcop": r(table["99"]["tcop"] * 100, 3),
            "var99gauss": r(table["99"]["gauss"] * 100, 3),
        },
    }
    ts = write_ts(SLUG, payload)
    src = ts.read_text(encoding="utf-8").replace(
        f"quant/tutorials/{SLUG.replace('-', '_')}.py", "quant/legacy/evt_tcopula.py")
    ts.write_text(src, encoding="utf-8")

    # ------------------------------------------------------------ notebook
    cells = [
        md(f"""# Market risk via EVT + t-copula

**pyportfolios.com** · [/research/evt-t-copula-var](https://pyportfolios.com/research/evt-t-copula-var) · ^GSPC + ^FTSE, 2000 – 2024 · NumPy · Pandas · SciPy · arch · yfinance

The reference conditional tail-risk pipeline (McNeil–Frey), end to end on real data:

1. GARCH(1,1)-t filter per asset → i.i.d.-ish standardised residuals,
2. semi-parametric margins — empirical body, GPD (Pareto) tails beyond the {Q_TAIL:.0%} quantile,
3. Student-t copula calibrated by profile MLE,
4. {N_SIM:,} seeded Monte-Carlo scenarios → portfolio VaR/CVaR on a 60/40 S&P/FTSE book,
   compared against conditional Gaussian and unconditional historical VaR."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from arch import arch_model                      # pip install arch
from scipy.special import gammaln
from scipy.stats import genpareto, norm, rankdata, t as student_t, chi2

plt.rcParams["figure.figsize"] = (10, 5)
SEED, Q, N_SIM = 42, 0.95, 100_000
weights = np.array([0.6, 0.4])                   # ^GSPC / ^FTSE"""),
        md("""## 1 · Data: 25 years of S&P 500 and FTSE 100

Two developed-market indices with a quarter century of joint history — dot-com,
2008, the euro crisis, COVID, 2022. Log returns on days both markets traded."""),
        code("""px = yf.download(["^GSPC", "^FTSE"], start="2000-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"].dropna()
rets = np.log(px / px.shift(1)).dropna()[["^GSPC", "^FTSE"]]
cols = list(rets.columns)
print(f"{len(rets)} joint trading days, {rets.index[0].date()} -> {rets.index[-1].date()}")"""),
        md("""## 2 · GARCH-t volatility filtering

Fit an AR(0)–GARCH(1,1) with Student-t innovations per asset; keep the
standardised residuals $z = \\varepsilon/\\hat\\sigma$ (close to i.i.d.) and the
one-day-ahead volatility forecast (this is what makes the VaR *conditional*)."""),
        code("""Z, sigma_f = {}, {}
for c in cols:
    res = arch_model(100 * rets[c], mean="Constant",
                     vol="GARCH", p=1, q=1, dist="t").fit(disp="off")
    Z[c] = res.std_resid
    sigma_f[c] = float(np.sqrt(res.forecast(horizon=1).variance.iloc[-1, 0]))
    print(f"{c}: alpha+beta = {res.params['alpha[1]'] + res.params['beta[1]']:.3f}   "
          f"nu = {res.params['nu']:.1f}   sigma_fcast = {sigma_f[c] / 100:.4%}/day")
Z = pd.DataFrame(Z).dropna()"""),
        md(f"""## 3 · Semi-parametric margins: empirical body, Pareto tails

Peaks-over-threshold: beyond the {Q_TAIL:.0%} quantile of each residual series,
fit a Generalised Pareto to the exceedances. A positive shape ξ is a genuine
power-law tail. The QQ plot against the fitted GPD is the honesty check."""),
        code("""def fit_pot(z, q=Q):
    u = float(np.quantile(z, q))
    xi, _, beta = genpareto.fit(z[z > u] - u, floc=0)
    return u, float(xi), float(beta)

tails = {c: {"upper": fit_pot(Z[c].values),
             "lower": fit_pot(-Z[c].values)} for c in cols}   # lower = loss tail
for c in cols:
    u, xi, beta = tails[c]["lower"]
    print(f"{c} loss tail: u = {u:.3f}   xi = {xi:.3f}   beta = {beta:.3f}")

# QQ plot, S&P loss tail
u, xi, beta = tails["^GSPC"]["lower"]
exc = np.sort((-Z["^GSPC"].values)[(-Z["^GSPC"].values) > u] - u)
p = (np.arange(1, 100) - 0.5) / 99
plt.scatter(genpareto.ppf(p, xi, scale=beta), np.quantile(exc, p), s=12)
lim = plt.xlim()[1]
plt.plot([0, lim], [0, lim], "k--", lw=1)
plt.xlabel("GPD quantile"); plt.ylabel("empirical excess quantile")
plt.title("^GSPC loss-tail exceedances vs fitted GPD");"""),
        md("""## 4 · Calibrating the t-copula

Rank-transform the residuals to pseudo-uniforms, pin the copula correlation via
Kendall's τ ($\\rho = \\sin(\\pi\\tau/2)$, robust to the margins), then profile
the log-likelihood over ν. Low ν = strong tail dependence."""),
        code("""U = Z.apply(lambda s: rankdata(s) / (len(s) + 1)).values
tau = Z[cols[0]].corr(Z[cols[1]], method="kendall")
rho = float(np.sin(np.pi * tau / 2))

def tcopula_loglik(x, rho, nu):
    det = 1 - rho**2
    q = (x[:, 0]**2 - 2*rho*x[:, 0]*x[:, 1] + x[:, 1]**2) / det
    log_mvt = (gammaln((nu + 2)/2) - gammaln(nu/2) - np.log(nu*np.pi)
               - 0.5*np.log(det) - (nu + 2)/2 * np.log1p(q/nu))
    return float((log_mvt - student_t.logpdf(x, nu).sum(axis=1)).sum())

grid = np.arange(2.5, 30.5, 0.5)
lls = [tcopula_loglik(student_t.ppf(U, nu), rho, nu) for nu in grid]
nu_hat = float(grid[int(np.argmax(lls))])
print(f"tau = {tau:.3f}   rho = {rho:.3f}   nu_hat = {nu_hat:.1f}")
plt.plot(grid, lls); plt.axvline(nu_hat, ls="--", c="k")
plt.xlabel("nu"); plt.ylabel("copula log-likelihood");"""),
        md("""## 5 · Monte Carlo: joint scenarios with the right tails

Sample the t-copula (Gaussian draw × common χ² mixing — the shared shock is
exactly what creates joint crashes), invert the semi-parametric margins, and
re-inflate by the GARCH volatility forecasts."""),
        code("""rng = np.random.default_rng(SEED)
L = np.linalg.cholesky(np.array([[1, rho], [rho, 1]]))
g = (L @ rng.standard_normal((2, N_SIM))).T
mix = np.sqrt(nu_hat / chi2.rvs(nu_hat, size=(N_SIM, 1), random_state=rng))
U_sim = student_t.cdf(g * mix, df=nu_hat)

def inv_margin(u, z, lo, hi, q=Q):
    out = np.quantile(z, u)                      # empirical body
    up = u > q
    out[up] = hi[0] + genpareto.ppf((u[up] - q) / (1 - q), hi[1], scale=hi[2])
    dn = u < 1 - q
    out[dn] = -(lo[0] + genpareto.ppf((1 - q - u[dn]) / (1 - q), lo[1], scale=lo[2]))
    return out

sim = np.column_stack([inv_margin(U_sim[:, k], Z[c].values,
                                  tails[c]["lower"], tails[c]["upper"])
                       for k, c in enumerate(cols)])
sf = np.array([sigma_f[c] for c in cols]) / 100
pnl = (sim * sf) @ weights
loss = -pnl"""),
        md("""## 6 · Portfolio VaR & CVaR — three answers to one question

EVT + t-copula (simulation), conditional Gaussian (variance–covariance on the
same volatility forecasts), and unconditional historical simulation."""),
        code("""rho_p = Z[cols[0]].corr(Z[cols[1]])
sigma_p = float(np.sqrt(weights @ (np.outer(sf, sf)
                * np.array([[1, rho_p], [rho_p, 1]])) @ weights))
hist_pnl = (rets @ weights).values

print(f"{'level':>6} {'historical':>11} {'gaussian':>9} {'t-copula':>9} {'EVT CVaR':>9}")
for a in (0.95, 0.99):
    v = np.quantile(loss, a)
    cv = loss[loss >= v].mean()
    gauss = -norm.ppf(1 - a) * sigma_p
    hist = -np.quantile(hist_pnl, 1 - a)
    print(f"{a:>6.0%} {hist:>11.3%} {gauss:>9.3%} {v:>9.3%} {cv:>9.3%}")

plt.hist(100 * loss, bins=80, density=True, alpha=0.6, label="EVT + t-copula")
x = np.linspace(100 * loss.min(), 100 * np.percentile(loss, 99.9), 400)
plt.plot(x, norm.pdf(x, 0, 100 * sigma_p), lw=2, label="Gaussian")
plt.axvline(100 * np.quantile(loss, 0.99), ls="--", c="k", label="99% VaR (t-copula)")
plt.xlabel("1-day loss (%)"); plt.legend(); plt.title("Simulated loss distribution");"""),
        md(f"""## Takeaways

- GARCH filtering first (McNeil–Frey) makes everything downstream conditional —
  the VaR tracks today's volatility regime, not a 25-year average.
- Both loss tails fit GPDs with positive shape ξ: genuine power-law tails that a
  normal distribution flatly denies.
- The profiled copula ν is small — strong tail dependence; a Gaussian copula
  (ν → ∞) would assume the two markets decouple exactly when they crash together.
- At 99% the EVT + t-copula VaR sits well above the Gaussian answer on the same
  volatility forecasts; the gap *is* the fat-tail premium.
- All of it is seeded ({SEED}) and reproducible; stress the threshold q and the
  ν grid before trusting any of it with capital.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    print(f"gap99 = {gap99:+.1%} (t-copula vs Gaussian)")


if __name__ == "__main__":
    main()
