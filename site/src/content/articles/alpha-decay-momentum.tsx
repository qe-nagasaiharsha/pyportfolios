/* Prose carried over VERBATIM from Louis's RN16_Alpha_Decay_Momentum notebook.
   Section numbering and headings are the notebook's (1 data & signal … 5
   implications). Markdown emphasis preserved as written: **bold** -> <b>,
   *italic* -> <i>.

   DELIBERATELY UNEXECUTED. Unlike the other fifteen articles this one carries
   no computed data module and no charts — the notebook ships without stored
   outputs and it was not run, so the page shows the prose and the code exactly
   as written and nothing else. There is no data/<slug>.ts import for the same
   reason. If it is ever run, the figures and an IC table belong in sections 2,
   3 and 4, alongside the code blocks already there. */

import { Section, P, Bullets, CodeBlock, SubSection, References } from "@/components/article/prose";
import { SETUP_CODE, DATA_CODE, IC_CODE, DECAY_CODE, ERA_CODE, VARIANT_CODE, PLACEBO_CODE } from "./alpha-decay-code";

export default function AlphaDecayMomentum() {
  return (
    <>
      <P>
        <b>The finding, upfront.</b>{" "}
        Using 20 years of daily data on the 11 SPDR sector ETFs, we measure how long a cross-sectional
        momentum signal keeps predicting returns. Two results:
      </P>
      <Bullets
        ordered
        items={[
          <>
            <b>Horizon decay:</b>{" "}the signal&apos;s information coefficient (IC) is strongest for the
            first days after formation and decays roughly exponentially &mdash; we estimate its
            half-life directly from the IC curve.
          </>,
          <>
            <b>Calendar decay:</b>{" "}comparing 2005&ndash;2014 against 2015&ndash;2024, the same signal is
            materially weaker in the recent decade &mdash; consistent with the <i>alpha erosion</i>{" "}
            documented after factor publication (McLean &amp; Pontiff 2016).
          </>,
        ]}
      />
      <P>
        For a practitioner both numbers bind: the first sets your <b>turnover</b>, the second your{" "}
        <b>expectations</b>.
      </P>


      <CodeBlock code={SETUP_CODE} />

      <Section id="data" n={1} title="Data & signal">
        <P>
          <b>Universe:</b>{" "}the 11 GICS sector SPDRs &mdash; a small, clean cross-section with 20+ years
          of history and no survivorship issues.
        </P>
        <P>
          <b>Signal:</b>{" "}classic 12-1 momentum &mdash; trailing 252-day return, skipping the most recent
          21 days (to avoid short-term reversal) &mdash; recomputed daily, expressed as cross-sectional
          ranks.
        </P>
        <P>
          <b>Evaluation:</b>{" "}rank IC &mdash; the Spearman correlation between today&apos;s signal ranks
          and <i>forward</i>{" "}returns over horizons from 1 to 126 trading days.
        </P>
        <P>
          <i>
            (Alphalens automates exactly this pipeline for larger universes; with 11 assets the direct
            computation keeps every step visible.)
          </i>
        </P>
        <CodeBlock code={DATA_CODE} />
      </Section>

      <Section id="decay" n={2} title="Result 1 — the IC decay curve">
        <P>
          For each day, rank sectors by momentum; correlate those ranks with returns over the{" "}
          <i>next</i>{" "}h days. Averaging across all days gives the mean IC per horizon &mdash; the
          signal&apos;s predictive power as a function of how long you hold.
        </P>
        <CodeBlock code={IC_CODE} />
        <CodeBlock code={DECAY_CODE} />
        <P>
          <b>Reading the curve:</b>{" "}the signal is worth the most immediately after formation and gives
          up roughly half its power within the estimated half-life. A strategy that rebalances slower
          than the half-life is trading mostly <i>dead</i>{" "}signal &mdash; this single number disciplines
          the turnover decision.
        </P>
      </Section>

      <Section id="erosion" n={3} title="Result 2 — decade-over-decade erosion">
        <P>
          Same signal, same universe, two eras. If momentum alpha erodes as it gets arbitraged
          (crowding, publication, cheaper implementation), the recent decade should show a flatter
          curve.
        </P>
        <CodeBlock code={ERA_CODE} />
      </Section>

      <Section id="robustness" n={4} title="Robustness">
        <P>Three checks that the result isn&apos;t an artifact:</P>
        <CodeBlock code={VARIANT_CODE} />
        <CodeBlock code={PLACEBO_CODE} />
      </Section>

      <Section id="implications" n={5} title="Implications & limitations">
        <SubSection title="Implications">
          <Bullets
            items={[
              <>
                <b>Turnover has a right answer.</b>{" "}With a half-life measured in weeks, monthly
                rebalancing captures most of the available signal; quarterly leaves much of it dead.
                Trading costs then decide the exact point.
              </>,
              <>
                <b>Capacity and expectations.</b>{" "}The decade-over-decade IC decline is what crowding
                looks like in data &mdash; position sizing and return expectations calibrated on the
                2005&ndash;2014 sample would have systematically disappointed after 2015.
              </>,
              <>
                <b>Signal research must be dated.</b>{" "}An IC estimated over &ldquo;all history&rdquo;
                mixes two different regimes; the recent-era curve is the honest input for a live
                strategy.
              </>,
            ]}
          />
        </SubSection>
        <SubSection title="Limitations">
          <Bullets
            items={[
              <>
                <b>11 assets is a small cross-section</b>{" "}&mdash; rank ICs are noisy (note the error
                bars); the pattern, not any single point, is the result.
              </>,
              <>
                <b>Overlapping windows</b>{" "}&mdash; weekly sampling reduces but doesn&apos;t eliminate
                autocorrelation in IC estimates; block-bootstrap errors would be the rigorous upgrade.
              </>,
              <>
                <b>One signal, one universe</b> &mdash; this measures <i>sector</i>{" "}momentum;
                single-stock momentum decays differently (typically slower formation, faster crowding).
              </>,
              <>
                <b>No costs</b>{" "}&mdash; the L/S spread is gross; at realistic ETF spreads the recent-era
                net edge thins further.
              </>,
            ]}
          />
        </SubSection>
        <SubSection title="Related content">
          <Bullets
            items={[
              <>
                <b>GameStop case study</b>{" "}&mdash;
                crowding&apos;s fast catastrophic mode; this note is its slow mode
              </>,
              <>
                <b>SMA Crossover Backtest</b>{" "}&mdash;
                turning a time-series signal into a disciplined strategy
              </>,
              <>
                <b>Walk-forward validation</b>{" "}(future piece) &mdash; the out-of-sample hygiene this
                note approximates with its era split
              </>,
            ]}
          />
        </SubSection>
      </Section>

      {/* his one-line reference, verbatim — not expanded into a full citation */}
      <References
        items={[
          <>
            McLean &amp; Pontiff (2016), &ldquo;Does Academic Research Destroy Stock Return
            Predictability?&rdquo;, <i>Journal of Finance</i>.
          </>,
        ]}
      />
    </>
  );
}
