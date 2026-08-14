/* Prose carried over VERBATIM from Louis's CS15_GameStop_Squeeze notebook.
   Section numbering and headings are the notebook's (1 setting … 5 post-mortem).
   Markdown emphasis preserved as written: **bold** -> <b>, *italic* -> <i>.

   DELIBERATELY UNEXECUTED. No data module, no charts, no computed numbers — the
   page carries his prose and his code exactly as written and nothing else. Any
   figures in the text are his own, written into the markdown.
   quant/tutorials/cs15_gamestop_momentum.py still reproduces the computed
   results (GME $2.44 -> $86.88 on 27 Jan, January +1625%, short P&L -100%) if
   they are ever wanted.

   This is now the site's only GameStop piece. "Anatomy of a Short Squeeze"
   (gamestop-short-squeeze) covered the same event but was an exemplar written to
   demonstrate the Case Study format rather than commissioned content; it was
   retired to retired-articles/ on 11 August 2026 and its hero image passed to
   the Alpha Decay article. */

import { Section, SubSection, P, Bullets, CodeBlock } from "@/components/article/prose";
import { SETUP_CODE, DATA_CODE, SQUEEZE_CODE, SPILL_CODE, SHORT_CODE } from "./gamestop-momentum-code";

export default function GamestopMomentumModels() {
  return (
    <>
      <P>
        In January 2021 a dying mall retailer became, briefly, the most traded stock on Earth. GameStop
        rose ~2,700% in three weeks, a hedge fund with a decade of strong returns needed a bailout, and
        every systematic strategy holding &ldquo;short the weak stocks&rdquo; learned that its risk
        model had a blind spot. This case study reconstructs the squeeze from market data and examines
        why quantitative models &mdash; trained on decades in which shorting losers worked &mdash;
        broke.
      </P>


      <CodeBlock code={SETUP_CODE} />

      <Section id="setting" n={1} title="The setting">
        <P>
          By late 2020, GameStop (GME) was a consensus short: a brick-and-mortar game retailer in a
          download world. Reported <b>short interest exceeded 100% of the float</b>{" "}&mdash; more shares
          sold short than were available to trade &mdash; via rehypothecation. For a momentum or quality
          model, GME scored terribly on every factor; being short was the &ldquo;safe,&rdquo; crowded,
          model-approved position.
        </P>
        <P>
          The vulnerability hiding in that consensus: a short position has <b>unlimited loss</b>{" "}and,
          when everyone must exit at once, exiting <i>is</i>{" "}buying. The crowd was the risk.
        </P>
      </Section>

      <Section id="event" n={2} title="The event">
        <Bullets
          items={[
            <>
              <b>Jan 11&ndash;13:</b>{" "}GME adds board members from Chewy&apos;s founder Ryan Cohen; the
              stock jumps ~60%. Retail buying accelerates, coordinated openly on r/wallstreetbets.
            </>,
            <>
              <b>Jan 19&ndash;22:</b> Short-seller reports trigger not selling but <i>more</i>{" "}buying.
              Heavy call-option volume forces market makers to hedge by buying stock.
            </>,
            <>
              <b>Jan 25&ndash;27:</b>{" "}The vertical phase &mdash; GME goes from ~$65 to ~$347. Melvin
              Capital takes a $2.75B injection. Short interest starts collapsing as funds capitulate.
            </>,
            <>
              <b>Jan 28:</b> Peak intraday ~$483. Several brokers <b>restrict buying</b>
              {" "}(position-close-only), citing clearinghouse margin. The squeeze breaks.
            </>,
            <>
              <b>Feb&ndash;Mar:</b>{" "}Collapse to ~$40, then a second, smaller squeeze in late February.
            </>,
          ]}
        />
      </Section>

      <Section id="mechanism" n={3} title="The mechanism: two squeezes feeding each other">
        <P>
          <b>Short squeeze:</b>{" "}rising price &rarr; shorts face margin calls &rarr; they buy to cover
          &rarr; price rises further. The exit <i>is</i>{" "}fuel.
        </P>
        <P>
          <b>Gamma squeeze:</b>{" "}retail buys short-dated calls &rarr; dealers who sold the calls are
          short gamma and must buy stock as it rises to stay hedged &rarr; price rises &rarr; deltas
          rise &rarr; dealers buy more. A mechanical accelerant layered on the behavioral one.
        </P>
        <P>
          Neither loop cares about fundamentals. Once ignited, price becomes a function of{" "}
          <i>positioning</i>, not value &mdash; precisely the variable most quant models didn&apos;t
          include.
        </P>
      </Section>

      <Section id="evidence" n={4} title="The evidence">
        <SubSection label="4.1" title="The data: GME, its ETF host, and the market's fear gauge">
          <CodeBlock code={DATA_CODE} />
        </SubSection>

        <SubSection label="4.2" title="The squeeze in one chart">
          <P>
            Log scale &mdash; the only way to see both the base and the spike. Annotations mark the
            phase transitions.
          </P>
          <CodeBlock code={SQUEEZE_CODE} />
        </SubSection>

        <SubSection label="4.3" title="Collateral damage: the ETF that couldn't help itself">
          <P>
            GME sat inside XRT (SPDR Retail ETF). As GME went vertical, its weight in the
            &ldquo;diversified&rdquo; ETF exploded &mdash; briefly approaching ~20% &mdash; dragging a
            passive vehicle into the squeeze.
          </P>
          <CodeBlock code={SPILL_CODE} />
        </SubSection>

        <SubSection label="4.4" title="What it did to a systematic short">
          <P>
            Simulate the naive quant position: short GME with monthly rebalancing (the classic
            momentum/quality short book, isolated to one name). Sizing at just 2% of a book, the January
            move alone is catastrophic &mdash; and daily mark-to-market shows why margin forced covering{" "}
            <i>before</i>{" "}any month-end rebalance.
          </P>
          <CodeBlock code={SHORT_CODE} />
        </SubSection>
      </Section>

      <Section id="post-mortem" n={5} title="Post-mortem">
        <SubSection title="What failed in the models">
          <Bullets
            items={[
              <>
                <b>Factor models scored GME correctly and were destroyed anyway</b> &mdash; the signal
                wasn&apos;t wrong about value; it was blind to <i>positioning</i>. Short interest and
                borrow cost weren&apos;t inputs.
              </>,
              <>
                <b>Risk models assumed exits exist</b> &mdash; liquidation models presume you can cover
                near current prices. In a squeeze, covering moves the price against you; the crowd exits
                through one door.
              </>,
              <>
                <b>Normal-market position sizing</b> &mdash; a 100%+ short-interest name has a fat right
                tail <i>by construction</i>. Sizing it like any other short ignored that the loss
                distribution was not remotely log-normal (see our fat-tails work).
              </>,
            ]}
          />
        </SubSection>
        <SubSection title="What survived">
          <Bullets
            items={[
              <>
                <b>Strategies with short-interest / crowding filters</b>{" "}side-stepped the worst names.
              </>,
              <>
                <b>Hard per-name loss limits</b> &mdash; the dumb, old-fashioned stop &mdash; beat
                sophisticated covariance-based risk for this event.
              </>,
              <>
                <b>The squeeze faded</b> &mdash; by April GME was back below $200 and momentum factors
                normalised; the <i>event</i> was survivable, the <i>sizing</i>{" "}often wasn&apos;t.
              </>,
            ]}
          />
        </SubSection>
        <SubSection title="The lessons">
          <Bullets
            ordered
            items={[
              <>
                <b>Crowding is a risk factor.</b> Short interest, days-to-cover and borrow cost belong
                in the model, not the footnotes.
              </>,
              <>
                <b>Shorts need asymmetric sizing</b> &mdash; the position grows as it hurts you; the
                equivalent long shrinks.
              </>,
              <>
                <b>Reflexivity is real:</b> when positioning drives price, historical covariances
                describe a market that no longer exists.
              </>,
              <>
                <b>Market structure matters</b> &mdash; gamma hedging turned option flow into a price
                accelerant; ignoring the options market meant missing half the mechanism.
              </>,
            ]}
          />
        </SubSection>
        <SubSection title="Related content">
          <Bullets
            items={[
              <>
                <b>Alpha Decay</b>{" "}(next) &mdash;
                crowding&apos;s slower cousin: everyone finding the same signal
              </>,
              <>
                <b>Fat tails / GBM tutorial</b> &mdash; the
                distributional assumption squeezes violate
              </>,
              <>
                <b>SMA Crossover Backtest</b> &mdash;
                where systematic discipline helps rather than hurts
              </>,
            ]}
          />
        </SubSection>
      </Section>
    </>
  );
}
