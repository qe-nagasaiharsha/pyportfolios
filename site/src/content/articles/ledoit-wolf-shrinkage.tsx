import { Section, Lead, P, InlineCode, Term, Callout, PullQuote, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";

export default function LedoitWolfShrinkage() {
  return (
    <>
      <Lead>
        Hand Markowitz a sample covariance matrix and he will hand you back a portfolio that looks
        brilliant in-sample and detonates out of it. The villain is not the optimiser — it is the
        matrix you fed it. Shrinkage is the cheapest, most reliable fix in quantitative portfolio
        construction, and you can build it from scratch in a dozen lines.
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
        </P>
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
          preserving the overall scale of risk.
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

# cross-check against scikit-learn
# from sklearn.covariance import LedoitWolf
# LedoitWolf().fit(X).covariance_  ->  matches ledoit_wolf(X)[0]`}
        />
      </Section>

      <Section id="backtest" n={6} title="The out-of-sample test">
        <P>
          The honest test is a minimum-variance portfolio, <InlineCode>w ∝ Σ⁻¹·1</InlineCode>,
          estimated on a rolling window and held forward. We compare the realised out-of-sample
          volatility of the sample matrix against the shrunk one on a broad equity universe.
        </P>
        <Figure
          caption="Rolling out-of-sample portfolio volatility (illustrative)"
          legend={[{ label: "Shrinkage", tone: "aqua" }, { label: "Sample", tone: "muted" }]}
        >
          <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label="Sample-covariance portfolio volatility runs consistently above the shrinkage portfolio out of sample.">
            <polyline points="0,70 60,96 120,52 180,118 240,74 300,150 360,92 420,160 480,108 540,176 600,120" fill="none" stroke="#4a4a42" strokeWidth="1.5" strokeOpacity="0.7" strokeLinejoin="round" />
            <path className="draw-on-view" d="M0,118 C90,116 130,124 200,128 C280,133 320,142 400,146 C470,150 520,156 600,158" fill="none" stroke="#0a8a8a" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="600" cy="158" r="3.5" fill="#0a8a8a" />
          </svg>
        </Figure>
        <DataTable
          head={["Estimator", "OOS volatility", "Max weight", "Turnover"]}
          rows={[
            ["Sample covariance", "14.8%", "221%", "High"],
            ["Ledoit–Wolf", "11.2%", "38%", "Lower"],
          ]}
        />
        <P>
          Lower realised risk, weights that are not grotesque, and less turnover to bleed away in
          costs — from a one-line change to how the covariance is estimated. Numbers are illustrative;
          the notebook reproduces them on real data.
        </P>
      </Section>

      <Section id="takeaways" n={7} title="Takeaways">
        <P>
          Shrink toward structure; let the data set the intensity; reach for Ledoit–Wolf by default
          whenever <InlineCode>N</InlineCode> is comparable to <InlineCode>T</InlineCode>. It will not
          make a bad signal good — but it stops a good signal from being destroyed by a noisy
          covariance matrix, which is the more common way portfolios fail.
        </P>
      </Section>

      <References
        items={[
          "Ledoit, O. & Wolf, M. (2004). A Well-Conditioned Estimator for Large-Dimensional Covariance Matrices. Journal of Multivariate Analysis, 88(2).",
          "Ledoit, O. & Wolf, M. (2004). Honey, I Shrunk the Sample Covariance Matrix. Journal of Portfolio Management, 30(4).",
          "Pedregosa et al. (2011). scikit-learn — sklearn.covariance.LedoitWolf.",
        ]}
      />
    </>
  );
}
