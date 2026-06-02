import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";

export default function HierarchicalRiskParity() {
  return (
    <>
      <Lead>
        Hierarchical Risk Parity asks a quietly radical question: what if we allocated capital
        without ever inverting a covariance matrix? López de Prado’s 2016 method replaces the
        fragile algebra of mean–variance with something a human actually does — group similar things
        together, then split risk between the groups.
      </Lead>

      <Section id="motivation" n={1} title="The trouble with inversion">
        <P>
          Mean–variance and minimum-variance both invert the covariance matrix
          <InlineCode>Σ</InlineCode>. When assets are highly correlated — as they always are —
          <InlineCode>Σ</InlineCode> is near-singular, and its inverse is a noise amplifier. The
          result is the familiar pathology: enormous offsetting long/short weights, wild swings from
          tiny input changes, and disastrous out-of-sample behaviour.
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
          universe into ever-larger groups.
        </P>
        <Figure caption="The correlation dendrogram — similar assets merge first">
          <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label="A dendrogram nesting six assets into two clusters that finally merge at the root.">
            <g stroke="#0a8a8a" strokeWidth="2" fill="none">
              <path d="M40,180 L40,140 L110,140 L110,180" />
              <path d="M180,180 L180,150 L110,150" transform="translate(0,-10)" />
              <path d="M75,140 L75,90 L300,90" />
              <path d="M300,180 L300,120 L300,90" />
              <path d="M420,180 L420,140 L490,140 L490,180" />
              <path d="M455,140 L455,60 L210,60" />
              <path d="M210,90 L210,60" />
            </g>
            {["EQ-A", "EQ-B", "EQ-C", "FI-A", "FI-B", "GLD"].map((t, i) => (
              <text key={t} x={40 + i * 88} y="196" textAnchor="middle" className="t-mono" fontSize="12" fill="#4a4a42">{t}</text>
            ))}
          </svg>
        </Figure>
      </Section>

      <Section id="quasidiag" n={3} title="Step 2 — quasi-diagonalisation">
        <P>
          Reorder the assets to follow the tree, so that similar assets sit next to each other. This
          <Term>seriation</Term> permutes the covariance matrix toward block-diagonal form: large
          values cluster near the diagonal, and the matrix becomes something you can split cleanly.
        </P>
      </Section>

      <Section id="bisection" n={4} title="Step 3 — recursive bisection">
        <P>
          Walk down the ordered tree. At each split, compute each side’s variance under inverse-
          variance weights, then hand more capital to the <Term>lower-variance</Term> side:
          <InlineCode>α = 1 − Var₀ ⁄ (Var₀ + Var₁)</InlineCode>. Recurse until every asset has its
          weight. Risk flows down the hierarchy, never through a matrix inverse.
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
          On a multi-asset universe with a rolling out-of-sample test, HRP rarely wins the
          in-sample beauty contest — and routinely wins the one that pays. Its weights stay
          diversified and stable because nothing ever gets inverted.
        </P>
        <DataTable
          head={["Method", "OOS volatility", "Largest weight", "Effective N"]}
          rows={[
            ["Min-variance (Σ⁻¹)", "9.6%", "41%", "6.2"],
            ["Hierarchical Risk Parity", "8.9%", "14%", "18.4"],
          ]}
        />
        <Callout kind="Why it matters">
          HRP is not magic — it discards the expected-return view entirely and can lag when
          correlations are stable and well-estimated. Its edge is robustness: it fails gracefully
          exactly where mean–variance fails catastrophically. Numbers above are illustrative; the
          notebook reproduces them.
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
