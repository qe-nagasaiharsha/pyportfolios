import { Section, Lead, P, InlineCode, Term, Callout, PullQuote, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";
import { BarChart, LineChart } from "@/components/charts/DataCharts";
import d from "./data/ledoit-wolf-shrinkage";

/* Legacy upgrade — every figure below renders REAL computed results
   (11 SPDR sector ETFs, 2018–2024, rolling min-variance backtest) baked in
   by quant/legacy/ledoit_wolf.py. */

const pc = (v: number, nd = 1) => `${(v * 100).toFixed(nd)}%`;

export default function LedoitWolfShrinkage() {
  return (
    <>
      <Lead>
        Hand Markowitz a sample covariance matrix and he will hand you back a portfolio that looks
        brilliant in-sample and detonates out of it. The villain is not the optimiser — it is the
        matrix you fed it. Shrinkage is the cheapest, most reliable fix in quantitative portfolio
        construction, and you can build it from scratch in a dozen lines — then prove it works on
        the 11 SPDR sector ETFs.
      </Lead>

      <Section id="problem" n={1} title="Why the sample covariance fails">
        <P>
          With <InlineCode>N</InlineCode> assets you must estimate <InlineCode>N(N+1)/2</InlineCode>
          covariances. For a 500-name universe that is ~125,000 numbers from a few hundred days of
          data. The sample covariance matrix <InlineCode>S</InlineCode> is unbiased, but its
          estimation error is enormous — and concentrated exactly where it hurts.
        </P>
        <P>
          The mean–variance optimiser inverts <InlineCode>S</InlineCode>. Inversion amplifies the
          smallest eigenvalues, which are the noisiest. The optimiser then pours weight into the
          directions it has estimated <Term>worst</Term>, mistaking sampling noise for free lunch.
          You do not need 500 names to see it: estimate the covariance of
          the {d.params.n} sector ETFs from just {d.params.window} trading days and the condition
          number of <InlineCode>S</InlineCode> is {d.demo.condSample.toFixed(0)} — the same matrix
          after shrinkage sits at {d.demo.condLW.toFixed(0)}. The spectra tell the story: shrinkage
          barely touches the market factor at the top, but lifts the noisy floor that inversion
          divides by.
        </P>
        <Figure
          caption={`Eigenvalue spectrum, last ${d.params.window} trading days of ${d.params.end.slice(0, 4)} — sample vs shrunk (as ann. vol per eigen-direction)`}
          legend={[
            { label: "Ledoit–Wolf", tone: "aqua" },
            { label: "sample", tone: "muted" },
          ]}
        >
          <BarChart
            ariaLabel="Eleven pairs of bars: the largest eigenvalue is nearly identical for both estimators, while the smallest sample eigenvalues are visibly lifted by shrinkage."
            labels={d.demo.eigLabels as unknown as string[]}
            groups={[
              { values: d.demo.specSample as unknown as number[], color: "graphite" },
              { values: d.demo.specLW as unknown as number[], color: "teal" },
            ]}
            yFmt={(v) => `${v.toFixed(0)}%`}
          />
        </Figure>
        <PullQuote>
          The optimiser is an error-maximiser: it systematically over-weights the assets whose risk
          it has underestimated.
        </PullQuote>
      </Section>

      <Section id="shrinkage" n={2} title="The shrinkage idea">
        <P>
          Shrinkage trades a little bias for a large cut in variance. Pull the noisy sample matrix
          toward a structured <Term>target</Term> <InlineCode>F</InlineCode> that has almost no
          estimation error:
        </P>
        <Callout kind="The shrinkage estimator">
          Σ* = δ·F + (1 − δ)·S &nbsp;&nbsp; with intensity δ ∈ [0, 1]
          <br />
          δ = 0 trusts the data completely; δ = 1 trusts the structure completely. The art is
          choosing δ — and Ledoit–Wolf does it analytically, not by tuning.
        </Callout>
      </Section>

      <Section id="target" n={3} title="Choosing the target">
        <P>
          The target should be well-conditioned and roughly right. A robust default — the one
          <InlineCode>scikit-learn</InlineCode> implements — is the <Term>spherical</Term> target:
          the identity scaled by the average sample variance,
          <InlineCode>F = μ·I</InlineCode> where <InlineCode>μ = trace(S)/N</InlineCode>. It throws
          away every off-diagonal, which is precisely the part most polluted by noise, while
          preserving the overall scale of risk. On our demo window that scale
          is μ ≈ ({d.demo.muTargetAnnVolPct}%)² — the average sector variance, annualised.
        </P>
      </Section>

      <Section id="intensity" n={4} title="The optimal intensity">
        <P>
          Ledoit and Wolf derive the <InlineCode>δ</InlineCode> that minimises the expected distance
          between <InlineCode>Σ*</InlineCode> and the true covariance. The answer is intuitive: it
          is the ratio of how noisy the sample matrix is to how far it sits from the target.
        </P>
        <Callout kind="Optimal δ">
          δ* = b² ⁄ d² &nbsp;&nbsp; (clipped to [0, 1])
          <br />
          d² = ‖S − F‖²_F ⁄ N — how far the data is from the structure
          <br />
          b² = mean variance of the entries of S — how much the data is just noise
        </Callout>
        <P>
          More noise (<InlineCode>b²</InlineCode> large) shrinks harder; a sample matrix that genuinely
          departs from the target (<InlineCode>d²</InlineCode> large) shrinks less. No
          cross-validation, no hyperparameter to overfit — the data tells you how much to trust it.
          On the {d.params.window}-day sector window the formula lands
          on δ* = {d.demo.delta.toFixed(3)}; re-estimated on every one of
          the {d.params.nRebalances} rolling windows in the backtest below, δ* breathes with the
          regime — from {d.backtest.deltaMin.toFixed(2)} in calm, structured markets
          to {d.backtest.deltaMax.toFixed(2)} when {d.params.window} days of data are mostly noise
          (mean {d.backtest.deltaMean.toFixed(2)}).
        </P>
      </Section>

      <Section id="code" n={5} title="Implementation from scratch">
        <P>
          The whole estimator, matching <InlineCode>sklearn.covariance.LedoitWolf</InlineCode> to
          numerical precision:
        </P>
        <CodeBlock
          file="ledoit_wolf.py"
          code={`import numpy as np

def ledoit_wolf(X):
    """X: (T, N) returns, rows = observations. Returns (shrunk_cov, delta)."""
    T, N = X.shape
    X = X - X.mean(axis=0)
    S = X.T @ X / T                       # sample covariance (MLE)
    mu = np.trace(S) / N                  # average variance
    F = mu * np.eye(N)                    # spherical target

    d2 = ((S - F) ** 2).sum() / N         # distance from target
    X2 = X ** 2
    b2 = ((X2.T @ X2) / T - S ** 2).sum() / (N * T)   # noise in S
    b2 = min(b2, d2)                      # bound: never shrink past the target
    delta = b2 / d2 if d2 > 0 else 0.0    # optimal intensity, already in [0, 1]

    return (1 - delta) * S + delta * F, delta

# cross-check against scikit-learn, on 60 days of sector-ETF returns:
# from sklearn.covariance import LedoitWolf
# LedoitWolf().fit(X)  ->  delta ${d.demo.deltaSklearn} (ours: ${d.demo.delta}),
#                          covariance matches to max |diff| ${d.demo.maxDiffSklearn}`}
        />
      </Section>

      <Section id="backtest" n={6} title="The out-of-sample test">
        <P>
          The honest test is a minimum-variance portfolio, <InlineCode>w ∝ Σ⁻¹·1</InlineCode>,
          estimated on a rolling window and held forward. We run it on daily returns of
          the {d.params.n} SPDR sector ETFs, {d.params.start} → {d.params.end}: re-estimate both
          matrices every {d.params.hold} trading days on the trailing {d.params.window}-day window
          ({d.params.nRebalances} rebalances), hold the weights, and measure what actually
          happened. Same data, same dates — the only difference is the estimator.
        </P>
        <Figure
          caption="Rolling 63d out-of-sample volatility of the two min-variance portfolios"
          legend={[{ label: "Shrinkage", tone: "aqua" }, { label: "Sample", tone: "muted" }]}
        >
          <LineChart
            ariaLabel="Rolling out-of-sample volatility of both portfolios from 2019 to 2024: the sample-covariance line runs above the shrinkage line through most of the sample, most visibly around the 2020 spike."
            series={[
              { y: d.backtest.rollSample as unknown as number[], color: "graphite", width: 1.4 },
              { y: d.backtest.rollLW as unknown as number[], color: "teal", width: 2.2 },
            ]}
            xLabels={d.backtest.xLabels as unknown as [number, string][]}
            yFmt={(v) => `${v.toFixed(0)}%`}
          />
        </Figure>
        <DataTable
          head={["Estimator", "OOS volatility", "Max |weight|", "Turnover / rebalance"]}
          rows={[
            ["Sample covariance", pc(d.backtest.volSample), pc(d.backtest.maxWSample, 0), d.backtest.turnSample.toFixed(2)],
            ["Ledoit–Wolf", pc(d.backtest.volLW), pc(d.backtest.maxWLW, 0), d.backtest.turnLW.toFixed(2)],
          ]}
        />
        <P>
          Lower realised risk ({pc(d.backtest.volLW)} vs {pc(d.backtest.volSample)} annualised),
          weights that are not grotesque (the sample matrix at one point
          put {pc(d.backtest.maxWSample, 0)} into a single sector ETF; shrinkage
          capped out at {pc(d.backtest.maxWLW, 0)}), and roughly half the turnover to bleed away in
          costs — from a one-line change to how the covariance is estimated. Note what shrinkage
          did <Term>not</Term> do: the volatility gap is real but modest, because eleven sectors is
          a small universe. The weight and turnover pathologies it fixes are what destroy portfolios
          at N = 100+, where the sample matrix is not merely noisy but singular.
        </P>
      </Section>

      <Section id="takeaways" n={7} title="Takeaways">
        <P>
          Shrink toward structure; let the data set the intensity; reach for Ledoit–Wolf by default
          whenever <InlineCode>N</InlineCode> is comparable to <InlineCode>T</InlineCode> — here it
          cut the condition number ~5×, halved turnover, and shaved realised risk, for free. It will
          not make a bad signal good — but it stops a good signal from being destroyed by a noisy
          covariance matrix, which is the more common way portfolios fail.
        </P>
      </Section>

      <References
        items={[
          "Ledoit, O. & Wolf, M. (2004). A Well-Conditioned Estimator for Large-Dimensional Covariance Matrices. Journal of Multivariate Analysis, 88(2).",
          "Ledoit, O. & Wolf, M. (2004). Honey, I Shrunk the Sample Covariance Matrix. Journal of Portfolio Management, 30(4).",
          "Pedregosa et al. (2011). scikit-learn — sklearn.covariance.LedoitWolf.",
          <span key="nb">Companion notebook: <InlineCode>ledoit-wolf-shrinkage.ipynb</InlineCode> — reproduces every figure from raw data (11 SPDR sector ETFs via yfinance).</span>,
        ]}
      />
    </>
  );
}
