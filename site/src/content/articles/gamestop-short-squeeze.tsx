import { Section, Lead, P, InlineCode, Term, Callout, PullQuote, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";

export default function GamestopShortSqueeze() {
  return (
    <>
      <Lead>
        In January 2021 a left-for-dead video-game retailer ran from roughly $4 to an intraday $120 in
        three weeks, detonating several billion dollars of short positions. GameStop is the cleanest
        modern textbook on how a crowded short, a small float, and an options feedback loop combine into
        a squeeze. We rebuild the mechanics in data and measure the risk a short book never priced.
      </Lead>

      <Section id="setup" n={1} title="The setup: a crowded short">
        <P>
          A <Term>short seller</Term> borrows shares, sells them, and hopes to buy them back cheaper. The
          danger is asymmetric: a short&rsquo;s profit is capped at 100% (the stock can only fall to
          zero) while the loss is unbounded. GameStop was extraordinary because <Term>short interest</Term>
          {" "}exceeded its <Term>free float</Term> — more shares were sold short than actually existed to
          trade freely, a structural impossibility sustained only by re-lending the same borrowed shares.
        </P>
        <DataTable
          head={["Metric", "Late 2020 / Jan 2021", "What it means"]}
          rows={[
            ["Short interest / float", "> 100%", "Every share shorted more than once"],
            ["Days to cover", "≈ 5+ days", "Shorts can't exit quickly without moving price"],
            ["Free float", "Small", "Little supply to absorb forced buying"],
            ["Borrow fee", "Elevated", "Costly to stay short"],
          ]}
        />
      </Section>

      <Section id="squeeze" n={2} title="How a squeeze ignites">
        <P>
          A short squeeze is a <Term>forced-buyer</Term> cascade. As price rises, shorts face mounting
          mark-to-market losses and margin calls. To cut risk they must <em>buy</em> shares to cover — but
          buying pushes the price higher, triggering more margin calls and more covering. With short
          interest above the float and few shares available to borrow or buy, the demand to cover meets a
          wall of no supply. Price is the only variable left free to move.
        </P>
        <PullQuote>
          A squeeze is not buyers beating sellers. It is sellers who are <em>contractually obliged to
          become buyers</em>, into a market with nothing to sell them.
        </PullQuote>
      </Section>

      <Section id="gamma" n={3} title="The gamma feedback loop">
        <P>
          The 2021 episode added a second, faster engine: options. Retail bought enormous quantities of
          out-of-the-money <Term>call options</Term>. The dealers who sold those calls are short gamma,
          so to stay hedged they must buy the underlying as it rises — and buy <em>more</em> as the calls
          move toward the money. This <Term>gamma squeeze</Term> is a feedback loop bolted onto the
          short squeeze: rising price forces dealer buying, which raises price, which forces more buying.
        </P>
        <CodeBlock
          file="gamma.py"
          code={`import numpy as np
from scipy.stats import norm

def call_delta(S, K, T, r, sigma):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    return norm.cdf(d1)

# As S climbs toward the strike, delta -> 1, so the dealer's
# hedge demand (shares per call) ramps from ~0 to ~100/contract.
for S in [40, 60, 80, 100]:
    print(S, round(100 * call_delta(S, K=60, T=0.05, r=0.0, sigma=1.2), 1))`}
        />
      </Section>

      <Section id="measure" n={4} title="Measuring it in data">
        <P>
          With daily prices you can quantify what the tape did. Compute the run-up, the realised
          volatility blow-out, and — the number a risk manager cares about — the loss to a constant
          short position held through the event.
        </P>
        <CodeBlock
          file="measure.py"
          code={`import numpy as np, pandas as pd

px = gme["adj_close"]                      # daily GME prices, Dec 2020 - Feb 2021
ret = np.log(px).diff()

run_up  = px.max() / px["2020-12-31"] - 1          # peak vs year-end
rvol    = ret.rolling(10).std() * np.sqrt(252)     # annualised realised vol

# P&L of a $1 short opened at year-end, marked daily (loss is unbounded)
short_pnl = 1 - px / px["2020-12-31"]              # negative = loss
print(f"run-up {run_up:.0%}   worst short P&L {short_pnl.min():.0%}")`}
        />
        <Figure caption="GME close, Dec 2020 → Feb 2021, with realised-vol overlay (illustrative)" legend={[{ label: "Price", tone: "aqua" }, { label: "Realised vol", tone: "muted" }]}>
          <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label="GameStop price spikes vertically in late January then falls sharply, while realised volatility explodes.">
            <line x1="30" y1="170" x2="580" y2="170" stroke="#4a4a42" strokeOpacity="0.4" strokeWidth="1" />
            <path d="M30,162 L260,158 L300,150 L330,96 L350,40 L368,70 L390,30 L410,120 L450,150 L520,140 L580,148" fill="none" stroke="#0a8a8a" strokeWidth="2" />
            <path d="M30,168 L300,166 L340,150 L360,110 L390,70 L430,120 L520,150 L580,160" fill="none" stroke="#4a4a42" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x="392" y="26" className="t-mono" fontSize="11" fill="#0a8a8a">≈ $120</text>
            <text x="34" y="186" className="t-mono" fontSize="11" fill="#4a4a42">Dec</text>
            <text x="556" y="186" className="t-mono" fontSize="11" fill="#4a4a42">Feb</text>
          </svg>
        </Figure>
      </Section>

      <Section id="risk" n={5} title="The risk a short book ignored">
        <P>
          A standard <Term>Value-at-Risk</Term> model, calibrated on GameStop&rsquo;s own quiet history,
          would have reported a tiny one-day risk — the stock had been a sleepy, low-volatility name. That
          is exactly the trap. VaR built on a calm sample is blind to a regime change driven by
          <em>positioning</em>, not fundamentals. The squeeze risk lived in three numbers a price-only
          model never sees: short-interest-to-float, days-to-cover, and the options gamma profile.
        </P>
        <Callout kind="Why the model was blind">
          Historical VaR assumes tomorrow looks like the sampled past. When the driver is crowded
          positioning — short interest above float, a forced-buyer cascade, dealer gamma — the past is
          irrelevant. Position data, not price data, was the leading indicator.
        </Callout>
      </Section>

      <Section id="lessons" n={6} title="What it teaches">
        <P>
          GameStop is not a story about a meme; it is a story about <Term>asymmetry and crowding</Term>.
          Capped upside and unbounded downside make a short an option you are <em>selling</em> — and a
          crowded short with no float is the most expensive option you can sell. The transferable lessons:
          watch positioning, not just price; respect that liquidity vanishes precisely when you need to
          exit; and never let a model calibrated on calm tell you a crowded trade is safe.
        </P>
        <Callout kind="The case-study checklist">
          What was the crowding signal (short interest, days-to-cover)? What was the accelerant (options
          gamma)? Why did standard risk models miss it? Could you have sized to survive the tail? Figures
          and numbers above are illustrative; the notebook reconstructs the run-up, vol blow-out and
          short P&amp;L from daily data.
        </Callout>
      </Section>

      <References
        items={[
          "U.S. SEC (2021). Staff Report on Equity and Options Market Structure Conditions in Early 2021.",
          "Pedersen, L. H. (2022). Game On: Social Networks and Markets. Working paper.",
          "Brunnermeier, M. & Pedersen, L. (2009). Market Liquidity and Funding Liquidity. Review of Financial Studies, 22(6).",
        ]}
      />
    </>
  );
}
