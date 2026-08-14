/* Prose carried over VERBATIM from Louis's CS8_6040_2022_Correlation_Flip notebook.
   Section numbering and headings are the notebook's (1 setting … 5 post-mortem).
   Markdown emphasis preserved as written: **bold** -> <b>, *italic* -> <i>.

   DELIBERATELY UNEXECUTED. No data module, no charts, no computed numbers — the
   page carries his prose and his code exactly as written and nothing else. Any
   figures quoted in the text are his own, written into the markdown.
   quant/tutorials/cs08_6040.py still reproduces the computed results (2022:
   SPY -18.2%, AGG -13.0%, TLT -31.2%; 60/40 -15.6%, drawdown -20.5%) if they
   are ever wanted. */

import { Section, SubSection, P, Bullets, CodeBlock } from "@/components/article/prose";
import { SETUP_CODE, DATA_CODE, ANNUAL_CODE, CORR_CODE, DRAWDOWN_CODE, COUNTERFACTUAL_CODE } from "./sixty-forty-code";

export default function SixtyFortyCorrelationFlip() {
  return (
    <>
      <P>
        For two decades, the 60/40 portfolio rested on one quiet assumption: <b>when stocks fall, bonds
        rally</b>. In 2022 that assumption broke. Stocks fell ~18%, long Treasuries fell ~31% &mdash;
        the worst year for a US balanced portfolio since the Global Financial Crisis, and by some
        measures since the 1930s. This case study reconstructs what happened, why the correlation
        flipped, and what it means for every portfolio built on the stock-bond hedge.
      </P>


      <CodeBlock code={SETUP_CODE} />

      <Section id="setting" n={1} title="The setting: two decades of a free hedge">
        <P>
          From roughly 2000 to 2021, US stock and Treasury returns were <b>negatively correlated</b>.
          Every equity selloff &mdash; 2008, 2011, 2018, March 2020 &mdash; saw bonds rally as investors
          fled to safety and the Fed cut rates. A 60/40 investor got equity upside with a built-in shock
          absorber, and the strategy compounded through every crisis.
        </P>
        <P>
          The subtlety everyone forgot: that negative correlation is a <b>regime</b>, not a law. It held
          because inflation was low and stable, so growth shocks dominated &mdash; bad news for stocks
          was good news for bonds (rate cuts coming). In the 1970s&ndash;90s, when <i>inflation</i>{" "}
          shocks dominated, the correlation had been <b>positive</b>.
        </P>
      </Section>

      <Section id="event" n={2} title="The event: 2022 month by month">
        <P>
          Inflation, dismissed as &ldquo;transitory&rdquo; in 2021, printed 7%+ into 2022. The Fed
          delivered the fastest hiking cycle in four decades &mdash; from 0.25% to 4.50% in ten months.
          Rising yields crushed bond prices (see our{" "}
          duration tutorial: TLT&apos;s ~17.5-year
          duration &times; ~2% yield rise &asymp; &minus;35%), while the same rate shock compressed
          equity multiples.
        </P>
        <P>
          <b>Both engines of 60/40 stalled at once.</b> There was nowhere to hide inside the classic mix.
        </P>
      </Section>

      <Section id="mechanism" n={3} title="The mechanism: why inflation flips the sign">
        <Bullets
          items={[
            <>
              <b>Growth-shock regime</b>{" "}(2000&ndash;2021): bad economy &rarr; stocks fall, Fed cuts
              &rarr; bonds rise. Correlation <b>negative</b>. 60/40 self-hedges.
            </>,
            <>
              <b>Inflation-shock regime</b>{" "}(1970s, 2022): inflation up &rarr; Fed hikes &rarr;{" "}
              <i>discount rates rise for everything</i> &rarr; stocks <b>and</b> bonds fall together.
              Correlation <b>positive</b>. The hedge becomes a second exposure to the same risk.
            </>,
          ]}
        />
        <P>
          One variable &mdash; which type of shock dominates &mdash; determines whether bonds protect
          you or double your bet.
        </P>
      </Section>

      <Section id="evidence" n={4} title="The evidence">
        <SubSection label="4.1" title="The data">
          <P>
            SPY (S&amp;P 500), AGG (aggregate bonds) and TLT (long Treasuries) from AGG&apos;s inception
            through 2023.
          </P>
          <CodeBlock code={DATA_CODE} />
        </SubSection>

        <SubSection label="4.2" title="Annual returns: 2022 in context">
          <P>
            The one chart that tells the story &mdash; find another year where <i>both</i> bars are
            deeply negative.
          </P>
          <CodeBlock code={ANNUAL_CODE} />
        </SubSection>

        <SubSection label="4.3" title="The correlation flip">
          <P>
            Rolling 1-year correlation of daily stock and bond returns. Two decades below zero &mdash;
            then 2022.
          </P>
          <CodeBlock code={CORR_CODE} />
        </SubSection>

        <SubSection label="4.4" title="The damage: 60/40 drawdown">
          <P>
            A monthly-rebalanced 60/40 (SPY/AGG). Compare the 2022 drawdown with the GFC &mdash; and
            note how much <i>faster</i> 2022 hurt, because nothing offset anything.
          </P>
          <CodeBlock code={DRAWDOWN_CODE} />
          <P>
            And the counterfactual that stings: a 60/40 built with <b>TLT</b>{" "}instead of AGG &mdash;
            more duration, more &ldquo;hedge&rdquo; &mdash; did <i>worse</i> in 2022, because the hedge
            asset itself was the epicenter.
          </P>
          <CodeBlock code={COUNTERFACTUAL_CODE} />
        </SubSection>
      </Section>

      <Section id="post-mortem" n={5} title="Post-mortem">
        <SubSection title="What failed">
          <Bullets
            items={[
              <>
                <b>The model, not the math</b> &mdash; MVO and risk parity both treated the stock-bond
                correlation as a stable input. It&apos;s regime-dependent, and the regime variable is{" "}
                <i>inflation</i>.
              </>,
              <>
                <b>Duration as a hedge</b> &mdash; in an inflation shock, duration is the <i>risk</i>,
                not the hedge (see the bond tutorial&apos;s 2022 ETF table).
              </>,
              <>
                <b>Recency</b> &mdash; twenty years of negative correlation felt like a law of nature.
                The 1970s said otherwise all along.
              </>,
            ]}
          />
        </SubSection>
        <SubSection title="What survived">
          <Bullets
            items={[
              <>
                <b>Commodities and trend-following</b>{" "}had a banner 2022 &mdash; the diversifiers nobody
                wanted during the long bull market.
              </>,
              <>
                <b>Short-duration bonds</b>{" "}(SHY) lost little &mdash; the failure was duration, not
                bonds per se.
              </>,
              <>
                <b>The principle of diversification</b> &mdash; but across <i>risk regimes</i>{" "}
                (inflation vs growth), not just asset classes.
              </>,
            ]}
          />
        </SubSection>
        <SubSection title="The lessons">
          <Bullets
            ordered
            items={[
              <>
                Correlation inputs deserve the same stress-testing as returns &mdash; <i>conditional</i>{" "}
                on inflation regime, not unconditional averages.
              </>,
              <>A hedge that depends on a regime is a position on that regime persisting.</>,
              <>
                The fix isn&apos;t abandoning 60/40 &mdash; it&apos;s knowing which environments it
                insures against, and which it doesn&apos;t.
              </>,
            ]}
          />
        </SubSection>
        <SubSection title="Related content">
          <Bullets
            items={[
              <>
                <b>Bond Pricing, Duration &amp; Convexity</b>{" "}
                &mdash; why TLT lost 31% (the mechanics behind this case)
              </>,
              <>
                <b>Risk Parity from Scratch</b> &mdash; the
                strategy this correlation flip hurt most
              </>,
              <>
                <b>Copulas &amp; Tail Dependence</b>{" "}
                &mdash; modelling co-movement beyond a single correlation number
              </>,
            ]}
          />
        </SubSection>
      </Section>
    </>
  );
}
