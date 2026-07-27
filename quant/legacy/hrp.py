"""
Legacy upgrade - Hierarchical Risk Parity (article: hierarchical-risk-parity).
Assets: 11 SPDR sector ETFs (reuses quant/data/rn16_sectors.csv) · 2018-2024.

Runs the real Lopez de Prado HRP (scipy single linkage + quasi-diagonalisation
+ recursive bisection), compares against inverse-vol, equal weight and the
unconstrained minimum-variance (sigma-inverse) portfolio on a static
in-sample / out-of-sample split, and emits the article data module +
the standalone runnable notebook.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage
from scipy.spatial.distance import squareform

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from emit import code, downsample, load, md, r, write_nb, write_ts, year_labels  # noqa: E402

SLUG = "hierarchical-risk-parity"
SEED = 42            # no randomness used; kept for convention
SPLIT = "2022-01-01"  # in-sample < SPLIT <= out-of-sample


# ------------------------------------------------------------------- HRP --
# Faithful to Lopez de Prado (2016); identical to the article's code block.

def _ivp(cov):
    ivp = 1 / np.diag(cov)
    return ivp / ivp.sum()


def _cluster_var(cov, items):
    c = cov.loc[items, items]
    w = _ivp(c)
    return float(w @ c.values @ w)


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


def hrp_weights(returns: pd.DataFrame) -> tuple[pd.Series, list[str], np.ndarray]:
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
    return w.sort_index(), order, link


def eff_n(w: np.ndarray) -> float:
    return float(1.0 / np.sum(np.asarray(w) ** 2))


def main() -> None:
    px = load("rn16_sectors").dropna()           # all 11 sectors live: 2018-06 ->
    rets = px.pct_change().dropna()
    cols = list(rets.columns)

    ins = rets[rets.index < SPLIT]
    oos = rets[rets.index >= SPLIT]

    # ------------------------------------------ the three (plus one) books
    hrp_w, order, link = hrp_weights(ins)

    vol_is = ins.std(ddof=1)
    ivp_w = (1.0 / vol_is) / (1.0 / vol_is).sum()          # inverse-vol
    ew_w = pd.Series(1.0 / len(cols), index=cols)

    cov_is = ins.cov()
    ones = np.ones(len(cols))
    mv_raw = np.linalg.inv(cov_is.values) @ ones           # the fragile one
    mv_w = pd.Series(mv_raw / mv_raw.sum(), index=cols)

    weights = {"hrp": hrp_w, "ivp": ivp_w, "ew": ew_w, "minvar": mv_w}

    # ----------------------------------------------------- OOS performance
    stats = {}
    cum = {}
    for name, w in weights.items():
        pr = oos @ w.reindex(cols)
        stats[name] = {
            "oosVol": r(float(pr.std(ddof=1) * np.sqrt(252)), 4),
            "isVol": r(float((ins @ w.reindex(cols)).std(ddof=1) * np.sqrt(252)), 4),
            "maxW": r(float(w.abs().max()), 4),
            "effN": r(eff_n(w.values), 1),
            "totRet": r(float((1 + pr).prod() - 1), 4),
        }
        cum[name] = downsample((1 + pr).cumprod().values, 240)
        print(f"{name:>7}: OOS vol {stats[name]['oosVol']:.2%}  max|w| {stats[name]['maxW']:.1%}  "
              f"effN {stats[name]['effN']}  OOS total {stats[name]['totRet']:.1%}")

    # ------------------------------------------------------ chart payloads
    corr_is = ins.corr()
    first_i, first_j = int(link[0, 0]), int(link[0, 1])
    merges = {
        "firstPair": [cols[first_i], cols[first_j]],
        "firstDist": r(float(link[0, 2]), 3),
        "firstRho": r(float(corr_is.iloc[first_i, first_j]), 2),
        "lastDist": r(float(link[-1, 2]), 3),
    }

    payload = {
        "params": {
            "start": str(rets.index[0].date()), "end": str(rets.index[-1].date()),
            "split": SPLIT, "nAssets": len(cols),
            "nIs": int(len(ins)), "nOos": int(len(oos)), "seed": SEED,
        },
        "corr": {"labels": cols, "values": r(corr_is.values.tolist(), 2)},
        "corrOrdered": {
            "labels": order,
            "values": r(corr_is.loc[order, order].values.tolist(), 2),
        },
        "merges": merges,
        "weights": {
            "labels": order,
            "hrp": r([float(hrp_w[c]) for c in order]),
            "ivp": r([float(ivp_w[c]) for c in order]),
            "ew": r([float(ew_w[c]) for c in order]),
            "minvar": r([float(mv_w[c]) for c in order]),
        },
        "stats": stats,
        "minvarShorts": {
            "nShort": int((mv_w < 0).sum()),
            "shortSum": r(float(mv_w[mv_w < 0].sum()), 3),
            "biggest": mv_w.abs().idxmax(),
        },
        "oos": {
            **cum,
            "xLabels": [[f, l] for f, l in year_labels(oos.index, 1)],
        },
    }
    ts = write_ts(SLUG, payload)
    src = ts.read_text(encoding="utf-8").replace(
        f"quant/tutorials/{SLUG.replace('-', '_')}.py", "quant/legacy/hrp.py")
    ts.write_text(src, encoding="utf-8")

    # ------------------------------------------------------------ notebook
    cells = [
        md(f"""# Hierarchical Risk Parity, end to end

**pyportfolios.com** · [/research/hierarchical-risk-parity](https://pyportfolios.com/research/hierarchical-risk-parity) · 11 SPDR sector ETFs, 2018 – 2024 · NumPy · Pandas · SciPy · Matplotlib · yfinance

Lopez de Prado's HRP allocates capital **without inverting a covariance matrix**:

1. cluster assets by correlation distance (single linkage),
2. quasi-diagonalise — reorder the covariance matrix along the tree,
3. recursively bisect, splitting risk between cluster halves,
4. compare out-of-sample against inverse-vol, equal weight and min-variance."""),
        code("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf
from scipy.cluster.hierarchy import linkage, dendrogram
from scipy.spatial.distance import squareform

plt.rcParams["figure.figsize"] = (10, 5)
SPLIT = "2022-01-01\""""),
        md("""## 1 · Data: the 11 SPDR sector ETFs

All eleven GICS sector SPDRs. XLC (communication services) only listed in
June 2018, so the joint sample starts there — about 6.5 years of daily data,
split into an estimation window (to end-2021) and a holdout (2022-2024)."""),
        code("""tickers = ["XLB","XLC","XLE","XLF","XLI","XLK","XLP","XLRE","XLU","XLV","XLY"]
px = yf.download(tickers, start="2018-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"].dropna()
rets = px.pct_change().dropna()
ins, oos = rets[rets.index < SPLIT], rets[rets.index >= SPLIT]
print(f"{len(ins)} in-sample days, {len(oos)} out-of-sample days")"""),
        md("""## 2 · Step 1 — hierarchical clustering

Correlations become distances via $d = \\sqrt{\\tfrac{1}{2}(1-\\rho)}$, then
single-linkage agglomerative clustering builds the dendrogram."""),
        code("""corr = ins.corr()
dist = np.sqrt((1 - corr) / 2.0)
link = linkage(squareform(dist, checks=False), "single")

dendrogram(link, labels=corr.index.tolist())
plt.title("Sector dendrogram (correlation distance, single linkage)");"""),
        md("""## 3 · Step 2 — quasi-diagonalisation

Reorder the assets so the tree's leaves are adjacent: large correlations
migrate toward the diagonal and the matrix becomes near block-diagonal."""),
        code("""def quasi_diag(link):
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

order = corr.index[quasi_diag(link)].tolist()
print("quasi-diagonal order:", order)

fig, axes = plt.subplots(1, 2, figsize=(11, 4.6))
for ax, (title, c) in zip(axes, [("original order", corr),
                                 ("quasi-diagonalised", corr.loc[order, order])]):
    im = ax.imshow(c.values, cmap="viridis", vmin=0, vmax=1)
    ax.set_xticks(range(len(c)), c.columns, rotation=90, fontsize=7)
    ax.set_yticks(range(len(c)), c.index, fontsize=7)
    ax.set_title(title)
fig.colorbar(im, ax=axes, shrink=0.8);"""),
        md("""## 4 · Step 3 — recursive bisection

Walk down the ordered list, split each cluster in half, compute each half's
variance under inverse-variance weights, and hand more capital to the calmer
half: $\\alpha = 1 - \\mathrm{Var}_0/(\\mathrm{Var}_0+\\mathrm{Var}_1)$."""),
        code("""def _ivp(cov):
    ivp = 1 / np.diag(cov)
    return ivp / ivp.sum()

def _cluster_var(cov, items):
    c = cov.loc[items, items]
    w = _ivp(c)
    return float(w @ c.values @ w)

def hrp(returns):
    cov, corr = returns.cov(), returns.corr()
    dist = np.sqrt((1 - corr) / 2.0)
    link = linkage(squareform(dist, checks=False), "single")
    order = corr.index[quasi_diag(link)].tolist()
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

hrp_w = hrp(ins)
print(hrp_w.round(4))"""),
        md("""## 5 · The competitors

Inverse-vol (naive risk parity, ignores correlations), equal weight, and the
textbook villain: unconstrained minimum-variance $w \\propto \\Sigma^{-1}\\mathbf 1$,
which *does* invert the covariance matrix."""),
        code("""vol = ins.std(ddof=1)
ivp_w = (1 / vol) / (1 / vol).sum()
ew_w  = pd.Series(1 / len(ins.columns), index=ins.columns)

mv_raw = np.linalg.inv(ins.cov().values) @ np.ones(len(ins.columns))
mv_w   = pd.Series(mv_raw / mv_raw.sum(), index=ins.columns)

W = pd.DataFrame({"HRP": hrp_w, "inverse-vol": ivp_w,
                  "equal": ew_w, "min-var": mv_w}).loc[order]
W.plot.bar(figsize=(11, 4), title="Weights by method (quasi-diagonal order)")
plt.axhline(0, color="k", lw=0.7);
print(W.round(3))"""),
        md("""## 6 · Out-of-sample comparison, 2022-2024

Fit every book once on the estimation window, then hold it through the
2022 bear market and the 2023-24 recovery. Watch three numbers: realised
volatility, the largest single position, and the effective number of bets
$1/\\sum w_i^2$."""),
        code("""def eff_n(w):
    return 1 / (np.asarray(w) ** 2).sum()

rows = []
for name in W:
    pr = oos @ W[name]
    rows.append([name, pr.std(ddof=1) * np.sqrt(252),
                 W[name].abs().max(), eff_n(W[name])])
    (1 + pr).cumprod().plot(label=name)
print(pd.DataFrame(rows, columns=["method", "OOS vol", "max |w|", "eff N"])
        .set_index("method").round(3))
plt.legend(); plt.title("Growth of $1 out of sample (2022-2024)");"""),
        md("""## Takeaways

- HRP never inverts a matrix: correlations only decide *who is grouped with whom*;
  capital then flows down the tree by inverse cluster variance.
- Unconstrained min-variance concentrates and goes short — exactly the noise
  amplification HRP was designed to avoid.
- HRP's weights sit between inverse-vol and equal weight: diversified, all-long, stable.
- The point is not winning every sample — it is failing gracefully where
  $\\Sigma^{-1}$ fails catastrophically.

*© pyportfolios.com — runnable companion to the article. Data: Yahoo Finance via yfinance.*"""),
    ]
    nb_path = write_nb(SLUG, cells)
    print(f"ts  -> {ts}")
    print(f"nb  -> {nb_path}")
    print(f"order: {order}")
    print(f"first merge: {merges['firstPair']} d={merges['firstDist']} rho={merges['firstRho']}")


if __name__ == "__main__":
    main()
