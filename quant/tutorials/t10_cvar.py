"""
T10 - CVaR / Expected Shortfall (topic card 10/16).
Assets: HYG + VWO · Timeframe: Jan 2007 - Dec 2024 (incl. GFC) · Libs: SciPy Riskfolio-Lib.

Computes historical & Student-t VaR/CVaR for two fat-tailed assets and a 50/50
portfolio, demonstrates VaR's tail blindness and its subadditivity failure,
zooms into the GFC, and compares CVaR-optimal vs mean-variance weights with
Riskfolio-Lib. Emits the article data module + the runnable notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "cvar-expected-shortfall"
LEVELS = (0.975, 0.99)


# ------------------------------------------------------------ estimators --

def var_hist(x: np.ndarray, a: float) -> float:
    """Historical VaR at confidence a, reported as a positive loss."""
    return float(-np.quantile(x, 1 - a))


def cvar_hist(x: np.ndarray, a: float) -> float:
    """Historical CVaR/ES at confidence a: mean loss beyond the VaR quantile."""
    q = np.quantile(x, 1 - a)
    return float(-x[x <= q].mean())


def var_t(params: tuple[float, float, float], a: float) -> float:
    nu, loc, scale = params
    return float(-(loc + scale * stats.t.ppf(1 - a, nu)))


def cvar_t(params: tuple[float, float, float], a: float) -> float:
    """Acerbi's closed-form expected shortfall for a Student-t."""
    nu, loc, scale = params
    p = 1 - a
    xp = stats.t.ppf(p, nu)
    es_std = stats.t.pdf(xp, nu) * (nu + xp**2) / ((nu - 1) * p)
    return float(-loc + scale * es_std)


def main() -> None:
    px = load("t10_cvar").dropna()  # HYG lists Apr 2007; align both series
    rets = px.pct_change().dropna()
    rets["PORT"] = 0.5 * rets["HYG"] + 0.5 * rets["VWO"]  # daily-rebalanced 50/50

    # --- VaR's blindness: two synthetic P&L histories, identical 99% VaR ----
    # 1,000 daily P&L observations each; only the 10 worst days differ.
    body = np.linspace(-0.024, 0.024, 990)  # identical benign body
    tail_a = np.full(10, -0.026)                                  # thin tail
    tail_b = np.array([-0.026, -0.03, -0.04, -0.05, -0.06, -0.07,
                       -0.08, -0.10, -0.12, -0.15])               # fat tail
    da, db = np.sort(np.r_[body, tail_a]), np.sort(np.r_[body, tail_b])
    blind = {
        "varA": r(var_hist(da, 0.99)), "varB": r(var_hist(db, 0.99)),
        "cvarA": r(cvar_hist(da, 0.99)), "cvarB": r(cvar_hist(db, 0.99)),
    }

    # --- per-asset risk table: historical + Student-t at 97.5% / 99% -------
    tfits = {c: stats.t.fit(rets[c].values) for c in ("HYG", "VWO", "PORT")}
    risk: dict[str, dict] = {}
    for c in ("HYG", "VWO", "PORT"):
        x = rets[c].values
        worst_i = int(np.argmin(x))
        risk[c] = {
            "annVol": r(float(x.std(ddof=1) * np.sqrt(252))),
            "var975": r(var_hist(x, 0.975)), "var99": r(var_hist(x, 0.99)),
            "cvar975": r(cvar_hist(x, 0.975)), "cvar99": r(cvar_hist(x, 0.99)),
            "var975t": r(var_t(tfits[c], 0.975)), "var99t": r(var_t(tfits[c], 0.99)),
            "cvar975t": r(cvar_t(tfits[c], 0.975)), "cvar99t": r(cvar_t(tfits[c], 0.99)),
            "ratio99": r(cvar_hist(x, 0.99) / var_hist(x, 0.99), 2),
            "nu": r(float(tfits[c][0]), 2),
            "worstDay": r(float(x[worst_i])),
            "worstDate": str(rets.index[worst_i].date()) if c == "PORT" else str(rets[c].idxmin().date()),
        }

    # --- subadditivity: CVaR always passes; scan VaR for a violation --------
    h, v, p = rets["HYG"].values, rets["VWO"].values, rets["PORT"].values
    sub = {
        "cvar99Port": r(cvar_hist(p, 0.99)),
        "cvar99Blend": r(0.5 * cvar_hist(h, 0.99) + 0.5 * cvar_hist(v, 0.99)),
        "var99Port": r(var_hist(p, 0.99)),
        "var99Blend": r(0.5 * var_hist(h, 0.99) + 0.5 * var_hist(v, 0.99)),
    }
    # full-sample scan finds no VaR violation; calendar-year subsamples do
    violations = []
    for y in range(2008, 2025):
        w = rets.loc[str(y)]
        for a in np.arange(0.90, 0.9951, 0.0025):
            vp = var_hist(w["PORT"].values, a)
            vb = 0.5 * var_hist(w["HYG"].values, a) + 0.5 * var_hist(w["VWO"].values, a)
            if vp > vb + 1e-12:
                violations.append({"year": y, "alpha": r(float(a)), "port": r(vp), "blend": r(vb), "gap": vp - vb})
    best = max(violations, key=lambda d: d["gap"])
    sub["nViolations"] = len(violations)
    sub["worstViolation"] = {k: best[k] for k in ("year", "alpha", "port", "blend")}
    # deterministic two-bond violation (classic Artzner example, PD = 0.7%)
    # each bond alone: P(loss) = 0.7% < 1%  -> 99% VaR = 0
    # 50/50 mix: P(lose >= half) = 1 - 0.993^2 = 1.395% > 1% -> 99% VaR > 0
    sub["bondPd"] = 0.007
    sub["bondMixP"] = r(1 - (1 - 0.007) ** 2)

    # --- histogram of HYG daily returns + fitted t overlay ------------------
    x = rets["HYG"].values
    edges = np.linspace(np.quantile(x, 0.0005), np.quantile(x, 0.9995), 57)
    counts, _ = np.histogram(x, bins=edges)
    centres = (edges[:-1] + edges[1:]) / 2
    nu, loc, scale = tfits["HYG"]
    dens = stats.t.pdf(centres, nu, loc, scale) * len(x) * (edges[1] - edges[0])
    hist = {
        "edges": r(list(edges)), "counts": [int(c) for c in counts],
        "tOverlay": r(list(dens), 2),
        "var99": r(-risk["HYG"]["var99"]), "cvar99": r(-risk["HYG"]["cvar99"]),
    }

    # --- GFC zoom: HYG cumulative 2007-2010, worst days vs the 99% VaR ------
    gwin = rets.loc["2007":"2010", "HYG"]
    cum = (1 + gwin).cumprod()
    worst5 = gwin.nsmallest(5)
    crisis = rets.loc["2008-09":"2009-03", "HYG"]
    exceed = int((crisis < -risk["HYG"]["var99"]).sum())
    gfc = {
        "y": downsample(cum.values, 200),
        "xLabels": [[f, l] for f, l in year_labels(gwin.index, 1)],
        "worst": [{"d": str(d.date()), "r": r(float(ret))} for d, ret in worst5.items()],
        "crisisDays": int(len(crisis)),
        "exceed99": exceed,
        "expected99": r(0.01 * len(crisis), 1),
        "trough": r(float(cum.min())),
    }

    # --- Riskfolio-Lib: CVaR-optimal vs MV-optimal weights -------------------
    # MinRisk corners at 100% HYG under BOTH measures (cov(H,V) > var(H)), so
    # the informative frontier point is an equal tail-loss budget spent through
    # each lens: allow an expected worst-1%-day loss of 4%. The MV desk
    # translates that budget into a vol cap via normality (ES99 = 2.665 sigma);
    # the CVaR desk constrains the realized tail directly.
    import warnings

    warnings.filterwarnings("ignore", category=UserWarning, module="cvxpy")  # riskfolio-internal deprecation noise
    import riskfolio as rp

    BUDGET = 0.04  # 99% expected shortfall budget, daily
    sig_budget = BUDGET / (stats.norm.pdf(stats.norm.ppf(0.01)) / 0.01)  # normal ES -> vol

    Y = rets[["HYG", "VWO"]]

    def rf_port() -> "rp.Portfolio":
        port = rp.Portfolio(returns=Y)
        port.assets_stats(method_mu="hist", method_cov="hist")
        port.alpha = 0.01  # 99% CVaR
        return port

    p_mv = rf_port()
    w_mr_mv = p_mv.optimization(model="Classic", rm="MV", obj="MinRisk", hist=True)
    p_mv.upperdev = sig_budget
    w_mv = p_mv.optimization(model="Classic", rm="MV", obj="MaxRet", hist=True)

    p_cv = rf_port()
    w_mr_cv = p_cv.optimization(model="Classic", rm="CVaR", obj="MinRisk", hist=True)
    p_cv.upperCVaR = BUDGET
    w_cv = p_cv.optimization(model="Classic", rm="CVaR", obj="MaxRet", hist=True)

    def port_stats(w: pd.DataFrame) -> dict:
        pr = (Y * w["weights"].values).sum(axis=1).values
        return {
            "HYG": r(float(w.loc["HYG", "weights"])), "VWO": r(float(w.loc["VWO", "weights"])),
            "annRet": r(float(pr.mean() * 252)),
            "annVol": r(float(pr.std(ddof=1) * np.sqrt(252))),
            "var99": r(var_hist(pr, 0.99)), "cvar99": r(cvar_hist(pr, 0.99)),
        }

    rf = {
        "budget": BUDGET, "sigBudget": r(float(sig_budget)),
        "minRiskMv": {"HYG": r(float(w_mr_mv.loc["HYG", "weights"]))},
        "minRiskCvar": {"HYG": r(float(w_mr_cv.loc["HYG", "weights"]))},
        "mv": port_stats(w_mv),
        "cvar": port_stats(w_cv),
    }

    payload = {
        "params": {
            "start": str(px.index[0].date()), "end": str(px.index[-1].date()),
            "nObs": int(len(rets)),
        },
        "blind": blind,
        "risk": risk,
        "sub": sub,
        "hist": hist,
        "gfc": gfc,
        "rf": rf,
    }
    ts = write_ts(SLUG, payload)

    # ------------------------------------------------------------ notebook --
    cells = [
        md("""# CVaR / Expected Shortfall

**pyportfolios.com tutorial T10** · HYG + VWO, Jan 2007 – Dec 2024 · SciPy · Riskfolio-Lib

Value-at-Risk answers "how bad is the threshold?"; expected shortfall (CVaR) answers
"how bad is it *beyond* the threshold?" — which is what actually hurts. In this notebook we

1. build two synthetic P&L histories with **identical 99% VaR** but wildly different tails,
2. estimate 97.5% / 99% VaR and CVaR for HYG, VWO and a 50/50 mix — historical and
   Student-t parametric (Acerbi's closed form),
3. show CVaR is subadditive where VaR can fail (the coherence property Basel cared about),
4. zoom into HYG through the GFC, and
5. compare CVaR-optimal vs mean-variance weights with Riskfolio-Lib."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from scipy import stats

plt.rcParams["figure.figsize"] = (10, 5)"""),
        md("""## 1 · Data: two fat-tailed assets

HYG (iShares high-yield corporate bond ETF) and VWO (Vanguard emerging-markets equity):
low-vol-looking credit and honest EM volatility, both with tails a normal distribution
cannot describe. The sample includes the GFC, the 2011 EM selloff, the COVID crash and
the 2022 rate shock. HYG listed in April 2007, so the aligned sample starts there."""),
        code("""px = yf.download(["HYG", "VWO"], start="2007-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"].dropna()
rets = px.pct_change().dropna()
rets["PORT"] = 0.5 * rets["HYG"] + 0.5 * rets["VWO"]   # daily-rebalanced 50/50
rets.describe().T[["mean", "std", "min", "max"]]"""),
        md("""## 2 · What VaR cannot see

Two 1,000-day P&L histories that agree on 990 days and on the *10th-worst* day —
so their 99% historical VaR is identical — but whose worst days differ by 6×.
VaR is a quantile: it reads the threshold and is blind to everything beyond it.
CVaR is the **mean of the tail**, so it sees the difference immediately."""),
        code("""def var_hist(x, a):
    return -np.quantile(x, 1 - a)

def cvar_hist(x, a):
    q = np.quantile(x, 1 - a)
    return -x[x <= q].mean()

body   = np.linspace(-0.024, 0.024, 990)          # identical benign body
tail_a = np.full(10, -0.026)                      # thin tail
tail_b = np.array([-0.026, -0.03, -0.04, -0.05, -0.06,
                   -0.07, -0.08, -0.10, -0.12, -0.15])   # fat tail
da, db = np.r_[body, tail_a], np.r_[body, tail_b]

for name, d in [("thin tail", da), ("fat tail", db)]:
    print(f"{name}: 99% VaR = {var_hist(d, .99):.2%}   99% CVaR = {cvar_hist(d, .99):.2%}")"""),
        md("""## 3 · Historical & Student-t VaR / CVaR

Historical estimates read the empirical distribution directly. The parametric route fits
a Student-t (fat tails, three parameters) and uses **Acerbi's closed-form expected
shortfall** for the t:

$$\\mathrm{ES}_p = -\\mu + \\sigma\\,\\frac{f_\\nu(x_p)\\,(\\nu + x_p^2)}{(\\nu-1)\\,p},
\\qquad x_p = F_\\nu^{-1}(p),\\ p = 1-\\alpha.$$

We report both at 97.5% and 99% — 97.5% ES is the FRTB standard, 99% VaR the old one."""),
        code("""def var_t(params, a):
    nu, loc, scale = params
    return -(loc + scale * stats.t.ppf(1 - a, nu))

def cvar_t(params, a):                      # Acerbi & Tasche closed form
    nu, loc, scale = params
    p = 1 - a
    xp = stats.t.ppf(p, nu)
    return -loc + scale * stats.t.pdf(xp, nu) * (nu + xp**2) / ((nu - 1) * p)

rows = []
for c in ["HYG", "VWO", "PORT"]:
    x = rets[c].values
    fit = stats.t.fit(x)
    rows.append({
        "asset": c, "nu": fit[0],
        "hist VaR99": var_hist(x, .99),  "hist CVaR99": cvar_hist(x, .99),
        "t VaR99":    var_t(fit, .99),   "t CVaR99":    cvar_t(fit, .99),
        "hist CVaR97.5": cvar_hist(x, .975),
        "CVaR/VaR": cvar_hist(x, .99) / var_hist(x, .99),
        "worst day": x.min(),
    })
pd.DataFrame(rows).set_index("asset").round(4)"""),
        code("""x = rets["HYG"].values
nu, loc, scale = stats.t.fit(x)
edges = np.linspace(np.quantile(x, 0.0005), np.quantile(x, 0.9995), 57)
plt.hist(x, bins=edges, density=True, alpha=0.45, label="HYG daily returns")
grid = np.linspace(edges[0], edges[-1], 400)
plt.plot(grid, stats.t.pdf(grid, nu, loc, scale), lw=2, label=f"Student-t (nu={nu:.1f})")
plt.axvline(-var_hist(x, .99),  ls="--", c="firebrick", label="99% VaR")
plt.axvline(-cvar_hist(x, .99), ls="--", c="darkorange", label="99% CVaR")
plt.legend(); plt.title("HYG daily returns — the gap between VaR and CVaR is the tail");
plt.show()
"""),
        md("""## 4 · Subadditivity — the coherence test

Artzner et al. (1999) demand of a *coherent* risk measure that diversification never
increases it: $\\rho(A+B) \\le \\rho(A) + \\rho(B)$. CVaR always passes; VaR can fail.
The classic counterexample: two independent bonds, each defaulting with probability
0.7%. Alone, each has **zero** 99% VaR (P(loss) < 1%). A 50/50 mix loses on
$1 - 0.993^2 = 1.39\\%$ of scenarios — above 1% — so the diversified portfolio has
*positive* 99% VaR. Diversification "created" risk, according to VaR."""),
        code("""# empirical check on HYG/VWO at 99% (full sample)
for name, fn in [("VaR", var_hist), ("CVaR", cvar_hist)]:
    port  = fn(rets["PORT"].values, .99)
    blend = 0.5 * fn(rets["HYG"].values, .99) + 0.5 * fn(rets["VWO"].values, .99)
    print(f"99% {name}: portfolio = {port:.2%}   0.5·HYG + 0.5·VWO = {blend:.2%}"
          f"   subadditive: {port <= blend}")

# historical VaR violates subadditivity in calendar-year subsamples
hits = []
for y in range(2008, 2025):
    w = rets.loc[str(y)]
    for a in np.arange(0.90, 0.9951, 0.0025):
        vp = var_hist(w["PORT"].values, a)
        vb = 0.5 * var_hist(w["HYG"].values, a) + 0.5 * var_hist(w["VWO"].values, a)
        if vp > vb:
            hits.append((y, round(a, 4), vp, vb))
print(f"\\nyear-level VaR subadditivity violations: {len(hits)}")
for y, a, vp, vb in sorted(hits, key=lambda t: t[3] - t[2])[:3]:
    print(f"  {y} @ alpha={a}: VaR(port) = {vp:.2%} > blend = {vb:.2%}")

# CVaR never violates — try it
assert not [1 for y, a, _, _ in hits
            if cvar_hist(rets.loc[str(y), "PORT"].values, a) >
               0.5 * cvar_hist(rets.loc[str(y), "HYG"].values, a)
             + 0.5 * cvar_hist(rets.loc[str(y), "VWO"].values, a)]"""),
        md("""## 5 · The GFC, seen from the tail

HYG's full-sample 99% VaR is a number the GFC ignored. Count the exceedances from
September 2008 to March 2009 against what a 1% tail should deliver."""),
        code("""gwin = rets.loc["2007":"2010", "HYG"]
(1 + gwin).cumprod().plot(title="HYG cumulative return through the GFC")
for d, ret in gwin.nsmallest(5).items():
    print(f"{d.date()}  {ret: .2%}")

crisis = rets.loc["2008-09":"2009-03", "HYG"]
var99 = var_hist(rets["HYG"].values, .99)
print(f"\\ndays beyond full-sample 99% VaR in Sep-08..Mar-09: "
      f"{(crisis < -var99).sum()} of {len(crisis)} (expected ~{0.01*len(crisis):.1f})")"""),
        md("""## 6 · CVaR-optimal vs mean-variance allocation (Riskfolio-Lib)

With only two assets, pure MinRisk corners at 100% HYG under *both* measures — vol and
tail agree on which asset is the quieter one. The measures diverge the moment you spend
a **risk budget**. Give both desks the same mandate — "your expected loss on the worst
1% of days may not exceed 4%" — and let each maximise return against it:

- the **MV desk** translates the budget into a vol cap via normality
  ($\\mathrm{ES}_{99\\%} = 2.665\\,\\sigma$ for a Gaussian), then optimises with `rm="MV"`;
- the **CVaR desk** constrains the realized 99% CVaR directly with `rm="CVaR"`.

Because both assets' tails are fatter than normal, the vol-translated budget is far too
generous — the MV desk loads up on VWO and quietly blows through the true tail budget."""),
        code("""import riskfolio as rp
from scipy import stats as st

BUDGET = 0.04                                    # 99% ES budget, daily
sig_budget = BUDGET / (st.norm.pdf(st.norm.ppf(0.01)) / 0.01)   # = BUDGET / 2.665
Y = rets[["HYG", "VWO"]]

p_mv = rp.Portfolio(returns=Y)
p_mv.assets_stats(method_mu="hist", method_cov="hist")
p_mv.upperdev = sig_budget                       # normal-translated vol cap
w_mv = p_mv.optimization(model="Classic", rm="MV", obj="MaxRet", hist=True)

p_cv = rp.Portfolio(returns=Y)
p_cv.assets_stats(method_mu="hist", method_cov="hist")
p_cv.alpha = 0.01
p_cv.upperCVaR = BUDGET                          # the tail budget itself
w_cv = p_cv.optimization(model="Classic", rm="CVaR", obj="MaxRet", hist=True)

for name, w in [("MV desk (vol-translated budget)", w_mv), ("CVaR desk", w_cv)]:
    pr = (Y * w["weights"].values).sum(axis=1).values
    print(f"{name}: HYG {w.loc['HYG', 'weights']:.1%} / VWO {w.loc['VWO', 'weights']:.1%}"
          f" -> realized 99% CVaR {cvar_hist(pr, .99):.2%} vs budget {BUDGET:.0%}")"""),
        md("""## Takeaways

- VaR is a quantile: it prices the door to the tail, not what is behind it. Two books
  with identical 99% VaR can differ 3× in expected tail loss.
- CVaR is coherent — subadditive by construction — while VaR can punish diversification
  (the two-bond example). This is why Basel's FRTB replaced 99% VaR with 97.5% ES.
- HYG is the poster child: modest volatility, brutal CVaR/VaR ratio. Credit smiles now
  and cries later; variance-based tools systematically over-allocate to it.
- Spend the same tail budget through a variance lens and a CVaR lens and you get very
  different books (≈84% vs ≈25% VWO here) — the vol-translated budget ignores exactly
  the tail it was meant to cap.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)

    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    for c in ("HYG", "VWO", "PORT"):
        k = risk[c]
        print(f"{c:4s} var99={k['var99']:.4f} cvar99={k['cvar99']:.4f} ratio={k['ratio99']:.2f} "
              f"worst={k['worstDay']:.4f} ({k['worstDate']}) nu={k['nu']}")
    print(f"sub: cvar port={sub['cvar99Port']} blend={sub['cvar99Blend']} | "
          f"var port={sub['var99Port']} blend={sub['var99Blend']} violations={sub['nViolations']}")
    print(f"rf : mv HYG={rf['mv']['HYG']} cvar HYG={rf['cvar']['HYG']}")
    print(f"gfc: exceed={gfc['exceed99']}/{gfc['crisisDays']} expected={gfc['expected99']} trough={gfc['trough']}")


if __name__ == "__main__":
    main()
