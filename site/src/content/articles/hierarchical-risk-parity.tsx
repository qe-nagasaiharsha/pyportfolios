import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";
import { Heatmap, BarChart, LineChart } from "@/components/charts/DataCharts";
import d from "./data/hierarchical-risk-parity";

/* Legacy upgrade — all figures below render REAL computed results
   (11 SPDR sector ETFs, 2018–2024) baked in by quant/legacy/hrp.py. */

const pc = (v: number, nd = 1) => `${(v * 100).toFixed(nd)}%`;

export default function HierarchicalRiskParity() {
  const w = d.weights;
  return (
    <>
      <Lead>
        Hierarchical Risk Parity asks a quietly radical question: what if we allocated capital
        without ever inverting a covariance matrix? López de Prado’s 2016 method replaces the
        fragile algebra of mean–variance with something a human actually does — group similar things
        together, then split risk between the groups. We run the real algorithm on the eleven SPDR
        sector ETFs, {d.params.start} to {d.params.end}, and let it face its rivals out of sample.
      </Lead>

      <Section id="motivation" n={1} title="The trouble with inversion">
        <P>
          Mean–variance and minimum-variance both invert the covariance matrix
          <InlineCode>Σ</InlineCode>. When assets are highly correlated — as they always are —
          <InlineCode>Σ</InlineCode> is near-singular, and its inverse is a noise amplifier. On our
          sector universe the pathology is not hypothetical: the unconstrained minimum-variance
          portfolio puts <InlineCode>{pc(d.stats.minvar.maxW)}</InlineCode> of capital into a single
          sector ({d.minvarShorts.biggest}, staples) and goes short {d.minvarShorts.nShort} of the
          11 sectors for a combined <InlineCode>{pc(d.minvarShorts.shortSum)}</InlineCode> — all
          from perfectly ordinary daily data.
        </P>
        <P>
          HRP sidesteps the inversion entirely. It uses the correlation structure only to decide
          <Term>who is similar to whom</Term>, and allocates by splitting risk down a tree.
        </P>
      </Section>

      <Section id="tree" n={2} title="Step 1 — hierarchical clustering">
        <P>
          Turn correlations into distances with <InlineCode>d = √(½(1 − ρ))</InlineCode>: perfectly
          correlated assets sit on top of each other, anticorrelated ones far apart. Then run
          agglomerative clustering to build a <Term>dendrogram</Term> — a tree that nests the
          universe into ever-larger groups. On the in-sample window ({d.params.nIs} trading days to{" "}
          {d.params.split}) the first merge is {d.merges.firstPair[0]}–{d.merges.firstPair[1]}{" "}
          (materials and industrials, ρ = {d.merges.firstRho}, distance {d.merges.firstDist}); the
          root closes at distance {d.merges.lastDist}.
        </P>
        <Figure
          caption={`Correlation matrix, in-sample ${d.params.start} → ${d.params.split} — alphabetical order`}
          legend={[{ label: "pairwise ρ", tone: "aqua" }]}
        >
          <Heatmap
            ariaLabel="Eleven by eleven correlation matrix of sector ETFs in alphabetical order, values between 0.35 and 1, with no visible structure away from the diagonal."
            rows={d.corr.labels as unknown as string[]}
            cols={d.corr.labels as unknown as string[]}
            values={d.corr.values as unknown as number[][]}
            h={320}
          />
        </Figure>
      </Section>

      <Section id="quasidiag" n={3} title="Step 2 — quasi-diagonalisation">
        <P>
          Reorder the assets to follow the tree, so that similar assets sit next to each other. This
          <Term>seriation</Term> permutes the covariance matrix toward block-diagonal form: large
          values cluster near the diagonal, and the matrix becomes something you can split cleanly.
          The tree puts the defensive block ({w.labels[0]}, {w.labels[1]}, {w.labels[2]}, {w.labels[3]})
          on one side and the growth block ({w.labels[8]}, {w.labels[9]}, {w.labels[10]}) on the
          other:
        </P>
        <Figure
          caption="The same matrix after quasi-diagonalisation — blocks emerge along the diagonal"
          legend={[{ label: "pairwise ρ", tone: "aqua" }]}
        >
          <Heatmap
            ariaLabel="The same correlation matrix reordered by the cluster tree: high correlations now form visible blocks along the diagonal, defensives first, cyclicals and growth after."
            rows={d.corrOrdered.labels as unknown as string[]}
            cols={d.corrOrdered.labels as unknown as string[]}
            values={d.corrOrdered.values as unknown as number[][]}
            h={320}
          />
        </Figure>
      </Section>

      <Section id="bisection" n={4} title="Step 3 — recursive bisection">
        <P>
          Walk down the ordered tree. At each split, compute each side’s variance under inverse-
          variance weights, then hand more capital to the <Term>lower-variance</Term> side:
          <InlineCode>α = 1 − Var₀ ⁄ (Var₀ + Var₁)</InlineCode>. Recurse until every asset has its
          weight. Risk flows down the hierarchy, never through a matrix inverse. On our universe the
          calm defensive half keeps winning splits, which is why {w.labels[0]} ends up the largest
          HRP position at {pc(d.stats.hrp.maxW)} while every weight stays long and bounded.
        </P>
      </Section>

      <Section id="code" n={5} title="HRP in ~40 lines">
        <P>
          The full algorithm, faithful to the original, on top of <InlineCode>scipy</InlineCode>:
        </P>
        <CodeBlock
          file="hrp.py"
          code={`import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage
from scipy.spatial.distance import squareform

def _ivp(cov):                                   # inverse-variance weights
    ivp = 1 / np.diag(cov)
    return ivp / ivp.sum()

def _cluster_var(cov, items):
    c = cov.loc[items, items]
    w = _ivp(c)                          # 1-D inverse-variance weights
    return float(w @ c.values @ w)       # wᵀ Σ w as a scalar

def _quasi_diag(link):
    link = link.astype(int)
    order = pd.Series([link[-1, 0], link[-1, 1]])
    n = link[-1, 3]                              # number of original leaves
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
    return w.sort_index()`}
        />
      </Section>

      <Section id="compare" n={6} title="HRP vs min-variance">
        <P>
          Estimate every book once on the in-sample window, then hold it through {d.params.nOos}{" "}
          out-of-sample days — the 2022 bear market and the 2023–24 recovery. First the weights
          themselves, in quasi-diagonal order:
        </P>
        <Figure
          caption="Weights by method — min-variance concentrates and shorts; HRP stays long and spread"
          legend={[
            { label: "HRP", tone: "aqua" },
            { label: "inverse-vol · equal", tone: "muted" },
            { label: "min-variance", tone: "muted" },
          ]}
        >
          <BarChart
            ariaLabel="Grouped bar chart of portfolio weights for eleven sectors: HRP, inverse-vol and equal weight bars all sit between 3 and 21 percent, while min-variance swings from plus 79 percent in XLP to minus 55 percent in XLK."
            labels={w.labels as unknown as string[]}
            groups={[
              { values: w.hrp as unknown as number[], color: "teal" },
              { values: w.ivp as unknown as number[], color: "slate" },
              { values: w.ew as unknown as number[], color: "graphite" },
              { values: w.minvar as unknown as number[], color: "rust" },
            ]}
            yFmt={(v) => `${(v * 100).toFixed(0)}%`}
            h={240}
          />
        </Figure>
        <P>
          Out of sample, HRP delivers the lowest realised volatility of the four books while staying
          fully invested and long-only. Min-variance — the in-sample volatility champion at{" "}
          {pc(d.stats.minvar.isVol)} — sees its edge evaporate to {pc(d.stats.minvar.oosVol)} out of
          sample and loses {pc(-d.stats.minvar.totRet)} over the holdout while every diversified
          book finishes up double digits.
        </P>
        <DataTable
          head={["Method", "OOS volatility", "Largest weight", "Effective N"]}
          rows={[
            ["Min-variance (Σ⁻¹)", pc(d.stats.minvar.oosVol), pc(d.stats.minvar.maxW), String(d.stats.minvar.effN)],
            ["Inverse-vol", pc(d.stats.ivp.oosVol), pc(d.stats.ivp.maxW), String(d.stats.ivp.effN)],
            ["Equal weight", pc(d.stats.ew.oosVol), pc(d.stats.ew.maxW), String(d.stats.ew.effN)],
            ["Hierarchical Risk Parity", pc(d.stats.hrp.oosVol), pc(d.stats.hrp.maxW), String(d.stats.hrp.effN)],
          ]}
        />
        <Figure
          caption={`Growth of $1 out of sample, ${d.params.split} → ${d.params.end}`}
          legend={[
            { label: "HRP", tone: "aqua" },
            { label: "inverse-vol · equal", tone: "muted" },
            { label: "min-variance", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Cumulative out-of-sample growth of one dollar for four methods: HRP, inverse-vol and equal weight dip through 2022 then recover to between 1.17 and 1.22, while min-variance drifts sideways and ends below 0.96."
            series={[
              { y: d.oos.minvar as unknown as number[], color: "rust", width: 1.3, dash: "4 3" },
              { y: d.oos.ew as unknown as number[], color: "graphite", width: 1.2, opacity: 0.7 },
              { y: d.oos.ivp as unknown as number[], color: "slate", width: 1.2 },
              { y: d.oos.hrp as unknown as number[], color: "teal", width: 2.2 },
            ]}
            xLabels={d.oos.xLabels as unknown as [number, string][]}
            yFmt={(v) => v.toFixed(2)}
            h={240}
          />
        </Figure>
        <Callout kind="Why it matters">
          HRP is not magic — it discards the expected-return view entirely, and here it also gives
          up some upside to the simpler diversified books. Its edge is robustness: the lowest
          out-of-sample volatility with an effective N of {d.stats.hrp.effN} bets, no shorts, no
          78%-in-one-sector surprises. It fails gracefully exactly where mean–variance fails
          catastrophically. The companion notebook reproduces every number from raw data.
        </Callout>
      </Section>

      <References
        items={[
          "López de Prado, M. (2016). Building Diversified Portfolios that Outperform Out of Sample. Journal of Portfolio Management, 42(4).",
          "López de Prado, M. (2018). Advances in Financial Machine Learning — Chapter 16, Machine Learning Asset Allocation.",
        ]}
      />
    </>
  );
}
