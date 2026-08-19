/* Prose carried over VERBATIM from Louis's T1_GBM_SPY_v3-stylized notebook
   (his updated GBM piece, Aug 2026), replacing the earlier version of this
   article. Section numbering and headings are the notebook's
   (1 Introduction … 5 Conclusion). Markdown emphasis preserved as written:
   **bold** -> <b>, *italic* -> <i>.

   UNLIKE the other pieces carried over verbatim, this one PUBLISHES ITS RESULTS.
   The notebook ships with its outputs stored, and its charts are deliberately
   styled to the article surface — the setup cell sets BG to Pale Sisal #F4F2E8
   and the accent to #1FFFFF, the palette <Figure> already uses. Both charts are
   his, extracted straight from the notebook into site/public/figures/, and the
   printed results are his too.

   NO <Lead>: his subtitle line already renders as the dek under the title, so
   repeating it at the top of the body was a duplicate and was removed.

   ONE EDIT (his, 14 Aug): the last two Key Highlights were merged into one —
   "...bedrock of mathematical finance — advanced applications layer additional
   features on top of it." The dropped clause (option pricing theory, Monte Carlo
   defaults) already appears in the bullet above. The v3 notebook still has five.

   ONE OMISSION: his opening cell carries an editorial placeholder —
   "[Content format: Tutorial (T) · Category: Quant Foundations & Derivatives (1)
   =====================> insert project card]" — a note to himself rather than
   copy. Left out; the format and category already render from the catalogue. */

import { Section, P, Bullets, CodeBlock, Figure, Formula } from "@/components/article/prose";
import { ProjectCard } from "@/components/article/ProjectCard";
import { Histogram } from "@/components/charts/echarts/Histogram";
import gbm from "./data/brownian-motion";
import {
  SETUP_CODE, IMPL_CODE, CALIBRATE_CODE, PATHS_CODE, TERMINAL_CODE, MARTINGALE_CODE,
  CALIBRATE_OUT, MARTINGALE_OUT,
} from "./gbm-spy-code";

/* eslint-disable @next/next/no-img-element */
export default function BrownianMotion() {
  return (
    <>
      {/* The card sits UNDER the highlights, full width — it was beside them
          until now, on Louis's earlier "next to the intro text" note. Every
          article carries one in the same place, so the reader always finds the
          spec in the same spot. */}
      <div>
        <div>
          <P>
            <b>Key Highlights:</b>
          </P>
          <Bullets
            items={[
              <>
                <b>Geometric Brownian Motion (GBM)</b>{" "}is the canonical continuous-time model for asset
                prices.
              </>,
              <>GBM powers the <b>Black&ndash;Scholes</b> framework and <b>Monte-Carlo</b> risk engines.</>,
              <>
                It entails most of the <b>intuition practitioners</b>{" "}carry about &ldquo;what could the
                price do?&rdquo;.
              </>,
              <>
                The framework serves as fundamental bedrock of mathematical finance &mdash; advanced
                applications layer additional features on top of it.
              </>,
            ]}
          />
        </div>
        <div className="mt-6">
          <ProjectCard slug="brownian-motion" />
        </div>
      </div>

      <CodeBlock code={SETUP_CODE} />

      <Section id="introduction" n={1} title="Introduction">
        <P>A few simple facts to get up to speed:</P>
        <Bullets
          items={[
            <>
              GBM assumes that <b>percentage returns</b>{" "}&mdash; not price changes &mdash; are random,
              normally distributed, and independent over time.
            </>,
            <>
              Prices therefore stay positive and their terminal distribution is <b>log-normal</b>.
            </>,
            <>
              <b>2 parameters</b>{" "}fully describe the model &mdash; both estimable directly from
              historical data:
              <br />&ndash; the drift <Formula>{String.raw`\mu`}</Formula>{" "}(expected annual log-growth
              plus half-variance)
              <br />&ndash; the volatility <Formula>{String.raw`\sigma`}</Formula>{" "}(annualised standard
              deviation of log returns)
            </>,
          ]}
        />
      </Section>

      <Section id="intuition" n={2} title="Intuition">
        <P>The logic before diving into equations:</P>
        <Bullets
          items={[
            <>
              <b>Returns compound, prices don&apos;t add</b>
              <br />&ndash; A $10 move means something very different at SPY = 100 than at SPY = 600.
              <br />&ndash; What is comparable across price levels is the <b>relative</b>{" "}move.
              <br />&ndash; GBM makes randomness proportional to the current price:{" "}
              <Formula>{String.raw`dS = \mu S\,dt + \sigma S\,dW`}</Formula>.
            </>,
            <>
              <b>Why log-normal</b>
              <br />&ndash; If each day multiplies the price by a small random gross return, the
              log-price is a <b>sum</b>{" "}of many small independent shocks.
              <br />&ndash; Sums of independent shocks are (approximately) normal.
              <br />&ndash; Normal log-price <Formula>{String.raw`\Rightarrow`}</Formula>{" "}log-normal
              price: skewed right, floored at zero.
            </>,
            <>
              <b>Drift vs. noise</b>
              <br />&ndash; Over short horizons the noise term dominates:{" "}
              <Formula>{String.raw`\sigma\sqrt{t}`}</Formula> shrinks slower than{" "}
              <Formula>{String.raw`\mu t`}</Formula> as <Formula>{String.raw`t \to 0`}</Formula>.
              <br />&ndash; Over long horizons drift wins.
              <br />&ndash; This is the same <Formula>{String.raw`\sqrt{t}`}</Formula>{" "}rule that governs
              plain Brownian motion &mdash; GBM simply wraps it in an exponential.
            </>,
          ]}
        />
      </Section>

      <Section id="theory" n={3} title="Theory">
        <P>Below the theoretical foundation and respective equations:</P>
        <Bullets
          items={[
            <>
              <b>The Stochastic Differential Equation (SDE) and its solution</b>
              <br />&ndash; A differential equation with a random term &mdash; so it yields a{" "}
              <i>distribution</i>{" "}of paths, not only one.
              <br />&ndash; <Formula>{String.raw`\mu S_t\,dt`}</Formula> is the <b>drift</b>{" "}
              (deterministic trend); <Formula>{String.raw`\sigma S_t\,dW_t`}</Formula> is the{" "}
              <b>diffusion</b>{" "}(the noise).
              <Formula block>{String.raw`dS_t = \mu S_t\,dt + \sigma S_t\,dW_t`}</Formula>
            </>,
            <>
              <b>Applying Itô&apos;s lemma to <Formula>{String.raw`\ln S_t`}</Formula></b>
              <br />&ndash; The <Formula>{String.raw`-\tfrac{1}{2}\sigma^2`}</Formula>{" "}correction comes
              from <Formula>{String.raw`(dW)^2 = dt`}</Formula>.
              <Formula block>
                {String.raw`S_t = S_0 \exp\!\Big[\big(\mu - \tfrac{1}{2}\sigma^2\big)t + \sigma W_t\Big]`}
              </Formula>
            </>,
            <>
              <b>Exact discretisation</b>
              <br />&ndash; Because the solution is closed-form, we can simulate{" "}
              <b>without discretisation error</b> at any step size{" "}
              <Formula>{String.raw`\Delta t`}</Formula>.
              <Formula block>
                {String.raw`S_{t+\Delta t} = S_t \cdot \exp\!\Big[\big(\mu - \tfrac{1}{2}\sigma^2\big)\Delta t + \sigma \sqrt{\Delta t}\, Z\Big], \qquad Z \sim \mathcal{N}(0,1)`}
              </Formula>
            </>,
          ]}
        />
        <P>
          The key implementations of those small functions: one draws per-step <b>gross returns</b>, the
          other <b>compounds</b>{" "}them into price paths.
        </P>
        <CodeBlock code={IMPL_CODE} />
      </Section>

      <Section id="application" n={4} title="Application">
        <Bullets
          items={[
            <>
              <b>
                Calibrate <Formula>{String.raw`\mu`}</Formula> and{" "}
                <Formula>{String.raw`\sigma`}</Formula>{" "}from real data
              </b>
              <br />&ndash; We pull daily SPY prices, estimate annualised drift and volatility from{" "}
              <b>log returns</b>, and let the data drive the simulation.
            </>,
          ]}
        />
        <CodeBlock code={CALIBRATE_CODE} />
        <CodeBlock file="output" code={CALIBRATE_OUT} />

        <Bullets
          items={[
            <>
              <b>Simulate 1,000 5-year paths</b>
              <br />&ndash; Grey lines are individual paths, the dashed line is the mean of the
              simulated distribution, and the band spans the 5th&ndash;95th percentile.
            </>,
          ]}
        />
        <CodeBlock code={PATHS_CODE} />
        <Figure caption="SPY: 1,000 GBM paths, 5 years  (mu=14.7%, sigma=19.5%)">
          <img
            src="/figures/gbm-cone.png"
            alt="One thousand simulated SPY price paths fanning out over five years; a shaded aqua band spans the 5th to 95th percentile and a dashed line marks the mean path"
            className="w-full rounded-sm"
          />
        </Figure>

        <Bullets
          items={[
            <>
              <b>Terminal distribution</b>{" "}&mdash; is it log-normal?
              <br />&ndash; <b>Verifies the code:</b>{" "}the simulated histogram should match the
              closed-form density{" "}
              <Formula>{String.raw`\ln\!\big(S_T/S_0\big) \sim \mathcal{N}\big((\mu - \tfrac{1}{2}\sigma^2)T,\; \sigma^2 T\big)`}</Formula>{" "}
              &mdash; if it doesn&apos;t, the ½σ² term is usually the culprit.
              <br />&ndash; <b>Proves the claim:</b>{" "}section 2 asserts prices end up log-normal; this is
              where you see the right skew rather than take it on faith.
              <br />&ndash; <b>The practical lesson:</b> the <b>mean sits above the median</b>, so the
              &ldquo;average&rdquo; projected outcome is not the <i>typical</i>{" "}one &mdash; most paths
              land below it.
            </>,
          ]}
        />
        <CodeBlock code={TERMINAL_CODE} />
        <Figure caption="SPY: terminal price distribution after 5 years">
          <Histogram
            ariaLabel="Histogram of simulated terminal SPY prices with the theoretical log-normal density overlaid; vertical lines mark the mean above the median, showing the right skew"
            height={260}
            binEdges={[...gbm.terminal.edges]}
            counts={[...gbm.terminal.density]}
            barName="simulated"
            overlay={{ name: "log-normal density", y: [...gbm.terminal.lognormal], color: "graphite" }}
            vLines={[
              { v: gbm.terminal.mean, color: "rust", label: `Mean ${Math.round(gbm.terminal.mean).toLocaleString()}` },
              { v: gbm.terminal.median, color: "teal", label: `Median ${Math.round(gbm.terminal.median).toLocaleString()}` },
            ]}
            xFmt={{ decimals: 0, prefix: "$", group: true }}
          />
        </Figure>

        <Bullets
          items={[
            <>
              <b>Sanity check:</b>{" "}switch the drift off
              <br />&ndash; With <Formula>{String.raw`\mu = 0`}</Formula> the process becomes a{" "}
              <b>martingale</b>{" "}&mdash; no expected gain &mdash; so the mean terminal price must land
              back at <Formula>{String.raw`S_0`}</Formula>.
              <br />&ndash; Zeroing one parameter isolates the rest: this catches a missing{" "}
              <Formula>{String.raw`-\tfrac{1}{2}\sigma^2`}</Formula>{" "}correction that a full simulation
              might hide.
              <br />&ndash; <b>How to read the result:</b> the sample mean wobbles around{" "}
              <Formula>{String.raw`S_0`}</Formula> with standard error{" "}
              <Formula>{String.raw`\approx S_0\sqrt{e^{\sigma^2T}-1}\big/\sqrt{N}`}</Formula>. Within
              ~2 SE is noise; a persistent gap in one direction that <i>doesn&apos;t</i> shrink as{" "}
              <Formula>{String.raw`N`}</Formula>{" "}grows is a bug.
            </>,
          ]}
        />
        <CodeBlock code={MARTINGALE_CODE} />
        <CodeBlock file="output" code={MARTINGALE_OUT} />
      </Section>

      <Section id="conclusion" n={5} title="Conclusion">
        <P>
          <b>Strengths</b>
        </P>
        <Bullets
          items={[
            <>
              <b>Analytically tractable</b>{" "}&mdash; closed-form solutions (Black&ndash;Scholes) make it
              the natural baseline
            </>,
            <>
              <b>Positive prices, log-normal terminal distribution</b>{" "}&mdash; matches the basic
              stylised fact that prices can&apos;t go negative
            </>,
            <>
              <b>Only two parameters</b>{" "}&mdash; both estimable directly from historical log returns
            </>,
            <>
              <b>Cheap to simulate</b>{" "}&mdash; vectorised NumPy generates millions of paths in seconds
            </>,
          ]}
        />
        <P>
          <b>Weaknesses &amp; Limitations</b>
        </P>
        <Bullets
          items={[
            <><b>Constant volatility</b> &mdash; realilty has vol clusters and spikes</>,
            <><b>No jumps</b> &mdash; crashes like March 2020 are far outside its reach</>,
            <><b>Normal log-returns</b> &mdash; real returns have fat tails</>,
            <><b>Independent increments</b> &mdash; momentum and mean-reversion exist</>,
          ]}
        />
        <P>
          <b>Applications in Practice</b>
        </P>
        <Bullets
          items={[
            <>Baseline for option pricing and Monte-Carlo risk engines</>,
            <>Scenario cones for wealth projections</>,
            <>Base model against which fancier models must justify their complexity</>,
          ]}
        />
        <P>
          <b>Alternatives &amp; Extensions</b>
        </P>
        <Bullets
          items={[
            <>
              <b>Stochastic volatility</b>{" "}&mdash; Heston
            </>,
            <><b>Jump-diffusion</b> &mdash; Merton</>,
            <><b>GARCH-family models</b> &mdash; for clustered volatility</>,
          ]}
        />
      </Section>
    </>
  );
}
