/* Prose carried over VERBATIM from Louis's QI4_Heston_vs_BlackScholes notebook.
   Section numbering and headings are the notebook's (1 disagreement … 5 verdict),
   not the site's usual six-part house format. Markdown emphasis is preserved as
   written: **bold** -> <b>, *italic* -> <i>.

   DELIBERATELY UNEXECUTED. No data module, no charts, no computed numbers — the
   page carries his prose and his code exactly as written and nothing else. The
   calibration in quant/tutorials/qi04_heston.py still reproduces the figures
   (rho = -0.476, mean abs error 0.24 vs 3.54 vol points) if they are ever
   wanted; they would belong in sections 3.1, 3.2 and 4. */

import { Section, SubSection, P, Bullets, CodeBlock, DataTable, Formula } from "@/components/article/prose";
import { SETUP_CODE, SMILE_CODE, HESTON_CODE, RECOVER_CODE, SCORE_CODE } from "./heston-code";

export default function HestonVsBlackScholes() {
  return (
    <>
      <P>
        <b>The claim we test:</b>{" "}
        Black-Scholes assumes a single, constant volatility &mdash; so it predicts the <i>same</i>{" "}
        implied vol at every strike. The market flatly disagrees: implied vol curves into a{" "}
        <b>smile/skew</b>. The Heston model, by letting volatility itself be random, can bend to fit
        that curve. This piece pits the two against a real SPX-style implied-vol surface and measures
        who fits, by how much, and at what cost.
      </P>


      <CodeBlock code={SETUP_CODE} />

      <Section id="disagreement" n={1} title="The disagreement">
        <P>
          Black-Scholes takes one volatility <Formula>{String.raw`\sigma`}</Formula>{" "}and returns one
          price per strike. Invert real option prices back into implied vols and &mdash; if BS were
          right &mdash; you&apos;d get a <b>flat line</b>: the same <Formula>{String.raw`\sigma`}</Formula>{" "}
          at every strike. Instead, equity index options show a pronounced <b>skew</b>: deep
          out-of-the-money puts trade at much higher implied vol than at-the-money or upside calls.
        </P>
        <P>Why? Two BS assumptions break:</P>
        <Bullets
          items={[
            <>
              <b>Volatility isn&apos;t constant</b>{" "}&mdash; it clusters, spikes, and mean-reverts.
            </>,
            <>
              <b>Returns aren&apos;t Gaussian</b>{" "}&mdash; crashes are fatter and more frequent than a
              normal distribution allows, and they cluster in falling markets.
            </>,
          ]}
        />
        <P>
          The skew is the market pricing in exactly those two facts. Any single-vol model is
          structurally unable to reproduce it.
        </P>
      </Section>

      <Section id="contenders" n={2} title="The contenders">
        <DataTable
          variant="prose"
          head={["", "Black-Scholes", "Heston"]}
          rows={[
            ["Volatility", <><b>Constant</b> <Formula key="s">{String.raw`\sigma`}</Formula></>, <><b>Stochastic</b> &mdash; its own mean-reverting process</>],
            ["Free parameters", "1", "5"],
            ["Returns distribution", "Log-normal (Gaussian log-returns)", "Fat-tailed, skewed"],
            ["Can fit the smile?", "No — flat by construction", "Yes"],
            ["Closed form?", "Yes (simple)", "Semi-closed (characteristic function)"],
          ]}
        />
        <P>
          <b>Black-Scholes</b> assumes{" "}
          <Formula>{String.raw`dS = \mu S\,dt + \sigma S\,dW`}</Formula> &mdash; the GBM from{" "}
          Tutorial 1.
        </P>
        <P>
          <b>Heston</b> adds a second equation for variance <Formula>{String.raw`v_t`}</Formula>:
        </P>
        <Formula block>
          {String.raw`dS_t = \mu S_t\,dt + \sqrt{v_t}\,S_t\,dW_t^S, \qquad dv_t = \kappa(\theta - v_t)\,dt + \xi\sqrt{v_t}\,dW_t^v`}
        </Formula>
        <P>
          with <Formula>{String.raw`\text{corr}(dW^S, dW^v) = \rho`}</Formula>. The five parameters:{" "}
          <Formula>{String.raw`\kappa`}</Formula> (mean-reversion speed),{" "}
          <Formula>{String.raw`\theta`}</Formula> (long-run variance),{" "}
          <Formula>{String.raw`\xi`}</Formula> (vol-of-vol), <Formula>{String.raw`\rho`}</Formula>{" "}
          (spot-vol correlation, the skew driver), and <Formula>{String.raw`v_0`}</Formula>{" "}(initial
          variance).
        </P>
      </Section>

      <Section id="test" n={3} title="The test">
        <P>
          We build a representative SPX implied-vol skew (ATM &asymp; 20%, steep put wing &mdash; the
          shape index options actually trade) and give <b>both</b>{" "}models the same job: match it.
        </P>
        <Bullets
          items={[
            <>
              <b>Black-Scholes</b>{" "}gets one degree of freedom &mdash; its best move is a single flat
              line, so we set it to the ATM vol.
            </>,
            <>
              <b>Heston</b>{" "}gets calibrated: we search its five parameters to minimise the gap to the
              market smile.
            </>,
          ]}
        />
        <P>
          <i>
            Note: we use a representative parametric skew so the notebook runs without a live
            option-chain subscription; the calibration machinery is identical for a real SPX/SPY chain.
          </i>
        </P>
        <CodeBlock code={SMILE_CODE} />
        <P>
          Black-Scholes is a horizontal line. The market is a curve. That gap &mdash; biggest in the
          crash-protection put wing &mdash; is the mispricing a single-vol model bakes into every
          out-of-the-money option.
        </P>

        <SubSection label="3.1" title="Calibrate Heston (QuantLib pricing + bounded optimisation)">
          <P>
            A single-maturity smile under-determines five parameters &mdash; unconstrained optimisers
            happily wander into absurd values (<Formula>{String.raw`\kappa`}</Formula>{" "}in the thousands)
            that fit the curve for the wrong reasons. So we calibrate with{" "}
            <b>economically sensible bounds</b>: mean-reversion{" "}
            <Formula>{String.raw`\kappa \in [0.5, 8]`}</Formula>, vol-of-vol{" "}
            <Formula>{String.raw`\xi \leq 2`}</Formula>, correlation{" "}
            <Formula>{String.raw`\rho \in [-0.95, -0.05]`}</Formula>, variances{" "}
            <Formula>{String.raw`\leq 0.25`}</Formula>. QuantLib prices; SciPy searches.
          </P>
          <CodeBlock code={HESTON_CODE} />
        </SubSection>

        <SubSection label="3.2" title="Recover Heston's implied-vol smile">
          <P>
            Price each strike under the calibrated model and invert to implied vol &mdash; same axis as
            the market curve.
          </P>
          <CodeBlock code={RECOVER_CODE} />
        </SubSection>
      </Section>

      <Section id="scoreboard" n={4} title="The scoreboard">
        <CodeBlock code={SCORE_CODE} />
        <P>
          The picture is decisive where it matters most &mdash; the <b>put wing</b>. Black-Scholes
          underprices crash protection by a wide margin (its flat line sits far below the market&apos;s
          elevated put vols), while Heston tracks the curve because its negative{" "}
          <Formula>{String.raw`\rho`}</Formula>{" "}generates exactly that downside skew. Across the surface
          Heston&apos;s mean error is a fraction of Black-Scholes&apos;.
        </P>
      </Section>

      <Section id="verdict" n={5} title="Verdict">
        <P>
          <b>Heston wins the fit &mdash; decisively &mdash; and it isn&apos;t close in the wings.</b>{" "}
          With five parameters versus one, that&apos;s expected; the real question is whether the extra
          complexity earns its keep. The answer depends on the job:
        </P>
        <Bullets
          items={[
            <>
              <b>Pricing a single vanilla at one strike?</b> Black-Scholes with that strike&apos;s{" "}
              <i>own</i>{" "}implied vol is simpler and exact. The smile is a lookup table; you don&apos;t
              need a model to read one row.
            </>,
            <>
              <b>
                Pricing a book across many strikes consistently, or anything exotic (barriers, cliquets,
                forward-starts) whose value depends on the <i>dynamics</i>{" "}of vol?
              </b>{" "}
              Heston is close to essential &mdash; a flat vol would misprice the smile-sensitive payoff.
            </>,
          ]}
        />
        <P>
          <b>What each model really is:</b>
        </P>
        <Bullets
          items={[
            <>
              Black-Scholes isn&apos;t wrong so much as <i>incomplete</i>{" "}&mdash; it&apos;s the quoting
              convention (implied vol) more than a dynamic model. Its flat smile is a feature of using
              one number, not a bug to be fixed.
            </>,
            <>
              Heston buys smile-consistency and fat tails at the cost of five parameters that must be{" "}
              <b>recalibrated</b>{" "}as the surface moves, and a fit that can still miss very short
              maturities (where jumps, not stochastic vol, drive the steep skew).
            </>,
          ]}
        />
        <P>
          <b>The honest trade-off:</b>{" "}more parameters always fit better in-sample. Heston earns trust
          because its parameters are <i>economically interpretable</i> (<Formula>{String.raw`\rho`}</Formula>{" "}
          is the skew, <Formula>{String.raw`\xi`}</Formula> the smile convexity,{" "}
          <Formula>{String.raw`\theta`}</Formula>{" "}the vol term structure) &mdash; it&apos;s fitting the
          smile <i>for the right reasons</i>, not just curve-fitting.
        </P>
        <P>
          <b>Where to go next:</b>{" "}for the very short-dated skew Heston struggles with, add jumps
          (<b>Bates</b>, Heston + Merton jumps); to fit the <i>entire</i>{" "}observed surface exactly rather
          than approximately, <b>Dupire local volatility</b>; and for the constant-vol baseline both are
          measured against, revisit the <b>Black-Scholes</b>{" "}
          tutorial.
        </P>
      </Section>
    </>
  );
}
