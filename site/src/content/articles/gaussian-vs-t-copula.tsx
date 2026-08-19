/* Prose carried over VERBATIM from Louis's QI12_Gaussian_vs_tCopula notebook.
   Section numbering and headings are the notebook's (1 disagreement … 5 verdict).
   Markdown emphasis preserved as written: **bold** -> <b>, *italic* -> <i>.

   DELIBERATELY UNEXECUTED. No data module, no charts, no computed numbers — the
   page carries his prose and his code exactly as written and nothing else.
   quant/tutorials/qi12_tcopula.py still reproduces the results (nu = 3,
   lambda = 0.424; at the 1% tail: 20.0 observed vs 20.4 t-copula vs 10.7
   Gaussian) if they are ever wanted — that comparison is the article's
   headline, and section 4.2 currently asserts it without showing it. */

import { Section, SubSection, P, Bullets, CodeBlock, DataTable, Formula } from "@/components/article/prose";
import { ProjectCard } from "@/components/article/ProjectCard";
import { SETUP_CODE, DATA_CODE, PSEUDO_CODE, FIT_CODE, LAMBDA_CODE, JOINT_CODE, PANELS_CODE } from "./t-copula-code";

export default function GaussianVsTCopula() {
  return (
    <>
      <P>
        <b>The claim we test:</b>{" "}
        a correlation number tells you how two assets co-move <i>on average</i>{" "}&mdash; it says nothing
        about whether they crash <i>together</i>. The Gaussian copula assumes joint extremes are
        vanishingly rare (zero tail dependence); the t-copula assumes crashes cluster. Using two sector
        ETFs &mdash; Financials (XLF) and Technology (XLK) &mdash; through the GFC, COVID and 2022, we
        measure which model matches how markets actually behave on the worst days.
      </P>

      {/* topic-report card — the spec for the piece, in the same place
          on every article */}
      <ProjectCard slug="gaussian-vs-t-copula" />


      <CodeBlock code={SETUP_CODE} />

      <Section id="disagreement" n={1} title="The disagreement">
        <P>
          A copula separates <i>how assets co-move</i> from <i>how each behaves alone</i>. Two copulas
          can share the same correlation <Formula>{String.raw`\rho`}</Formula>{" "}yet disagree completely
          about the tails:
        </P>
        <Bullets
          items={[
            <>
              <b>Gaussian copula:</b> as moves get more extreme, the dependence <i>fades</i>. Joint
              crashes are essentially coincidences. Lower-tail dependence{" "}
              <Formula>{String.raw`\lambda`}</Formula> = <b>0</b>, always.
            </>,
            <>
              <b>t-copula:</b> dependence <i>persists</i>{" "}into the extremes &mdash; crashes arrive
              together. <Formula>{String.raw`\lambda > 0`}</Formula>, controlled by the degrees of
              freedom <Formula>{String.raw`\nu`}</Formula> (smaller{" "}
              <Formula>{String.raw`\nu`}</Formula>{" "}= fatter joint tails).
            </>,
          ]}
        />
        <P>
          This isn&apos;t academic. The Gaussian copula priced the CDOs of 2008 &mdash; and its
          zero-tail-dependence assumption is precisely what failed when housing defaults arrived
          together.
        </P>
      </Section>

      <Section id="contenders" n={2} title="The contenders">
        <DataTable
          variant="prose"
          head={["", "Gaussian copula", "t-copula"]}
          rows={[
            ["Parameters", <Formula key="a">{String.raw`\rho`}</Formula>, <><Formula key="b">{String.raw`\rho, \nu`}</Formula> (degrees of freedom)</>],
            [<>Lower-tail dependence <Formula key="l">{String.raw`\lambda`}</Formula></>, "0 — always",
              <Formula key="c">{String.raw`2\,t_{\nu+1}\!\big(-\sqrt{\tfrac{(\nu+1)(1-\rho)}{1+\rho}}\big) > 0`}</Formula>],
            ["Joint crashes", "Coincidences", "Expected"],
            [<>As <Formula key="d">{String.raw`\nu \to \infty`}</Formula></>, "—", "Converges to Gaussian"],
          ]}
        />
        <P>
          The t-copula <i>contains</i> the Gaussian as a limit &mdash; so if the data prefers small{" "}
          <Formula>{String.raw`\nu`}</Formula>, that&apos;s the data voting for tail dependence.
        </P>
      </Section>

      <Section id="test" n={3} title="The test">
        <SubSection label="3.1" title="Data: XLF vs XLK through three crises">
          <CodeBlock code={DATA_CODE} />
        </SubSection>

        <SubSection label="3.2" title="Strip the marginals: pseudo-observations">
          <P>
            Copulas work on ranks. Converting each series to its empirical percentile removes the
            marginal distributions and leaves only the dependence structure.
          </P>
          <CodeBlock code={PSEUDO_CODE} />
        </SubSection>

        <SubSection label="3.3" title="Fit both copulas">
          <P>
            Gaussian: correlation of normal scores. t-copula: same{" "}
            <Formula>{String.raw`\rho`}</Formula> (via Kendall&apos;s{" "}
            <Formula>{String.raw`\tau`}</Formula>), with <Formula>{String.raw`\nu`}</Formula>{" "}chosen by
            maximum likelihood.
          </P>
          <CodeBlock code={FIT_CODE} />
        </SubSection>
      </Section>

      <Section id="scoreboard" n={4} title="The scoreboard">
        <SubSection label="4.1" title="Tail dependence: the headline number">
          <P>
            Probability that one ETF is in its worst q% <i>given</i>{" "}the other is &mdash; as q &rarr; 0.
          </P>
          <CodeBlock code={LAMBDA_CODE} />
        </SubSection>

        <SubSection label="4.2" title="Empirical test: joint crash frequency">
          <P>
            Count the days both ETFs landed in their worst 5% (and 1%) simultaneously &mdash; then ask
            each fitted copula how many such days it <i>predicts</i> over the same sample size.
          </P>
          <CodeBlock code={JOINT_CODE} />
          <CodeBlock code={PANELS_CODE} />
        </SubSection>
      </Section>

      <Section id="verdict" n={5} title="Verdict">
        <P>
          <b>The t-copula wins where it counts &mdash; the corner where portfolios die.</b> Typical
          result on this pair: the Gaussian copula <i>underpredicts</i> joint 1%-tail days by a large
          factor, while the t-copula lands close to the observed count. The likelihood agrees: the
          fitted <Formula>{String.raw`\nu`}</Formula> is small, which is the data explicitly rejecting
          the Gaussian limit.
        </P>
        <P>
          <b>Why it matters:</b>
        </P>
        <Bullets
          items={[
            <>
              <b>Risk models built on Gaussian dependence</b>{" "}understate exactly the events that cause
              maximum damage &mdash; simultaneous crashes across holdings. Your 99%
              &ldquo;diversified&rdquo; VaR is too optimistic in the only scenario you bought
              diversification for.
            </>,
            <>
              <b>The 2008 lesson, quantified</b> &mdash; the Gaussian copula&apos;s{" "}
              <Formula>{String.raw`\lambda = 0`}</Formula>{" "}is the mathematical form of &ldquo;national
              housing markets can&apos;t all fall together.&rdquo; They did. Any dependence model with
              zero tail dependence repeats that mistake in new clothing.
            </>,
          ]}
        />
        <P>
          <b>The honest caveats:</b>
        </P>
        <Bullets
          items={[
            <>
              The t-copula is <i>symmetric</i> &mdash; it implies joint booms are as likely as joint
              crashes. Equity data usually shows <i>asymmetric</i> dependence (crashes cluster more than
              rallies). A skewed-t or Clayton copula captures that; the t is the pragmatic middle
              ground.
            </>,
            <>
              One <Formula>{String.raw`\nu`}</Formula>{" "}for all seasons &mdash; dependence itself shifts
              with regimes (see our{" "}
              60/40 case study). Time-varying
              copulas exist but multiply complexity.
            </>,
          ]}
        />
        <P>
          <b>Where to go next:</b> the{" "}
          <b>Copulas &amp; Tail Dependence</b> tutorial
          for foundations; <b>CVaR / Expected Shortfall</b>{" "}
          for the risk measure that consumes these joint-tail probabilities; and the CDO story in our
          curriculum&apos;s credit module for the trillion-dollar version of this comparison.
        </P>
      </Section>
    </>
  );
}
