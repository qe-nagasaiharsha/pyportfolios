import { Section, Lead, P, InlineCode, Term, Callout, PullQuote, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";
import { LineChart, BarChart } from "@/components/charts/DataCharts";
import d from "./data/gamestop-short-squeeze";

/* CS15 — every figure below renders REAL computed results (GME, XRT, ^VIX daily,
   Oct 2020 – Mar 2021) baked in by quant/legacy/gamestop.py from the cached CSV.
   Prices are split-adjusted (GME split 4:1 in July 2022); returns are unaffected. */

const pc = (v: number, dp = 0) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(dp)}%`;

export default function GamestopShortSqueeze() {
  return (
    <>
      <Lead>
        In January 2021 a left-for-dead video-game retailer ran from a ${d.params.anchorClose}{" "}
        year-end close to a ${d.stats.peakClose} peak (split-adjusted) in eighteen trading days —
        {" "}{pc(d.stats.runUp)} — detonating several billion dollars of short positions. GameStop
        is the cleanest modern textbook on how a crowded short, a small float, and an options
        feedback loop combine into a squeeze. We rebuild the mechanics from the daily tape and
        measure the risk a short book never priced.
      </Lead>

      <Section id="setup" n={1} title="The setup: a crowded short">
        <P>
          A <Term>short seller</Term> borrows shares, sells them, and hopes to buy them back cheaper. The
          danger is asymmetric: a short&rsquo;s profit is capped at 100% (the stock can only fall to
          zero) while the loss is unbounded. GameStop was extraordinary because <Term>short interest</Term>
          {" "}exceeded its <Term>free float</Term> — more shares were sold short than actually existed to
          trade freely, a structural impossibility sustained only by re-lending the same borrowed shares.
          The tape entering the event was sleepy: GME closed at ${d.stats.startClose} on {d.params.start}{" "}
          and ${d.params.anchorClose} at year-end.
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
          wall of no supply. Price is the only variable left free to move. The daily returns show the
          cascade compounding: {pc(d.events[1].ret / 100, 1)} on Jan 22, {pc(d.events[3].ret / 100, 1)} on
          Jan 26, then <Term>{pc(d.stats.jan27, 1)}</Term> on Jan 27 — followed by{" "}
          <Term>{pc(d.stats.feb02, 1)}</Term> on Feb 2 once the forced buying stopped.
        </P>
        <Figure
          caption="GME daily returns, Jan 19 → Feb 4 2021 — computed from daily closes"
          legend={[
            { label: "±(55%+) days", tone: "aqua" },
            { label: "other days", tone: "muted" },
          ]}
        >
          <BarChart
            ariaLabel="Bar chart of GameStop daily returns from January 19 to February 4 2021: successive gains peaking at plus 134.8 percent on January 27, then a minus 60 percent collapse on February 2."
            labels={d.bars.labels as unknown as string[]}
            groups={[
              { values: d.bars.base as unknown as number[], color: "graphite" },
              { values: d.bars.hot as unknown as number[], color: "teal" },
            ]}
            yFmt={(v) => `${v.toFixed(0)}%`}
          />
        </Figure>
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
        <DataTable
          head={["Spot S", "Dealer hedge (shares / contract)"]}
          rows={d.gamma.s.map((s, i) => [`$${s}`, d.gamma.delta[i].toFixed(1)])}
        />
        <P>
          At a $60 strike, the dealer&rsquo;s hedge runs from {d.gamma.delta[0].toFixed(1)} shares per
          contract at $40 to {d.gamma.delta[3].toFixed(1)} at $100 — nearly the whole contract bought
          on the way up, mechanically, regardless of any view on the company.
        </P>
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

px = pd.read_csv("cs15_gamestop.csv", index_col=0, parse_dates=True)["GME"]
ret = px.pct_change().dropna()                     # daily GME, Oct 2020 - Mar 2021

run_up  = px.max() / px["2020-12-31"] - 1          # ${pc(d.stats.runUp)} peak vs year-end
rvol    = np.log(px).diff().rolling(10).std() * np.sqrt(252)   # peaks at ${pc(d.stats.peakRvol)}

# P&L of a $1 short opened at year-end, marked daily (loss is unbounded)
short_pnl = 1 - px / px["2020-12-31"]              # bottoms at ${pc(d.stats.worstShort)}
print(f"run-up {run_up:.0%}   worst short P&L {short_pnl.min():.0%}")`}
        />
        <Figure
          caption={`GME close (split-adjusted), ${d.params.start} → ${d.params.end}`}
          legend={[{ label: "GME", tone: "aqua" }]}
        >
          <LineChart
            ariaLabel="GameStop split-adjusted close from October 2020 to March 2021: flat near 3 dollars, a vertical spike to 86.88 on January 27, a collapse to 10, and a second run in March."
            series={[{ y: d.gme.y as unknown as number[], area: true }]}
            xLabels={d.gme.xLabels as unknown as [number, string][]}
          />
        </Figure>
        <DataTable
          head={["Date", "Close ($, split-adj.)", "Day return", "What happened"]}
          rows={d.events.map((e) => [e.date, e.close.toFixed(2), pc(e.ret / 100, 1), e.note])}
        />
        <P>
          The squeeze did not stay inside one ticker. XRT — the retail-sector ETF whose own short
          interest made it a squeeze conduit — jumped {pc(d.spill.xrtPeakRet, 1)} over year-end to its{" "}
          {d.spill.xrtPeakDate} peak, and the VIX closed at {d.spill.vixPeak} the same day GME topped:
          a single small-cap forcing a repricing of index-level risk.
        </P>
        <Figure
          caption="Spillover — XRT and ^VIX, rebased to 100 at Oct 1 2020"
          legend={[
            { label: "XRT", tone: "aqua" },
            { label: "^VIX", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="XRT climbs steadily and spikes in late January 2021 while the VIX jumps roughly 40 percent in the same week before settling back."
            series={[
              { y: d.spill.xrt as unknown as number[], color: "teal", width: 1.8 },
              { y: d.spill.vix as unknown as number[], color: "graphite", width: 1.4, opacity: 0.7 },
            ]}
            xLabels={d.spill.xLabels as unknown as [number, string][]}
          />
        </Figure>
      </Section>

      <Section id="risk" n={5} title="The risk a short book ignored">
        <P>
          A standard <Term>Value-at-Risk</Term> model, calibrated on GameStop&rsquo;s own pre-event
          history, saw little of what was coming. On the Oct–Dec 2020 sample the daily volatility was{" "}
          <InlineCode>{(d.stats.preSigma * 100).toFixed(1)}%</InlineCode> and the historical one-day 99%
          VaR was <InlineCode>{(d.stats.var99 * 100).toFixed(1)}%</InlineCode>. Jan 27 delivered{" "}
          <InlineCode>{pc(d.stats.jan27, 1)}</InlineCode> — a {d.stats.sigmaMult}σ day on that
          calibration. VaR built on a calm sample is blind to a regime change driven by
          <em> positioning</em>, not fundamentals. The squeeze risk lived in three numbers a price-only
          model never sees: short-interest-to-float, days-to-cover, and the options gamma profile.
        </P>
        <DataTable
          head={["Risk number", "Value", "Source"]}
          rows={[
            ["Pre-event daily σ (Oct–Dec 2020)", `${(d.stats.preSigma * 100).toFixed(1)}%`, "computed"],
            ["Historical 99% 1-day VaR", `${(d.stats.var99 * 100).toFixed(1)}%`, "computed"],
            ["Jan 27 actual return", pc(d.stats.jan27, 1), "computed"],
            ["Jan 27 in pre-event sigmas", `${d.stats.sigmaMult}σ`, "computed"],
            ["Peak 10-day realised vol (ann.)", pc(d.stats.peakRvol), "computed"],
            ["Worst mark on a $1 year-end short", pc(d.stats.worstShort), "computed"],
          ]}
        />
        <Figure
          caption="P&L of a $1 short opened 2020-12-31, marked daily — multiples of initial proceeds"
          legend={[{ label: "short P&L", tone: "aqua" }]}
        >
          <LineChart
            ariaLabel="Mark-to-market P&L of a one dollar short opened at 2020 year-end: near zero through early January, plunging to minus 17.4 times the proceeds on January 27, and never recovering above minus one."
            series={[{ y: d.shortPnl.y as unknown as number[], color: "rust", width: 1.8 }]}
            xLabels={d.shortPnl.xLabels as unknown as [number, string][]}
            hLines={[{ v: -1, color: "graphite", dash: "3 3", label: "-100% of proceeds" }]}
          />
        </Figure>
        <Callout kind="Why the model was blind">
          Historical VaR assumes tomorrow looks like the sampled past. When the driver is crowded
          positioning — short interest above float, a forced-buyer cascade, dealer gamma — the past is
          irrelevant. Position data, not price data, was the leading indicator: the {d.stats.sigmaMult}σ
          day was a ~{Math.round(d.stats.jan27 / -d.stats.var99)}× overshoot of the 99% VaR.
        </Callout>
      </Section>

      <Section id="lessons" n={6} title="What it teaches">
        <P>
          GameStop is not a story about a meme; it is a story about <Term>asymmetry and crowding</Term>.
          Capped upside and unbounded downside make a short an option you are <em>selling</em> — and a
          crowded short with no float is the most expensive option you can sell. A $1 short held from
          year-end was marked at {pc(d.stats.worstShort)} of its proceeds at the peak — a{" "}
          {Math.round(-d.stats.worstShort)}× loss on a position whose maximum gain was 1×. The
          transferable lessons: watch positioning, not just price; respect that liquidity vanishes
          precisely when you need to exit; and never let a model calibrated on calm tell you a crowded
          trade is safe.
        </P>
        <Callout kind="The case-study checklist">
          What was the crowding signal (short interest, days-to-cover)? What was the accelerant (options
          gamma)? Why did standard risk models miss it? Could you have sized to survive the tail? The
          companion notebook reconstructs every number above — the {pc(d.stats.runUp)} run-up, the{" "}
          {pc(d.stats.peakRvol)} vol blow-out, the {pc(d.stats.worstShort)} short mark — from the raw
          daily data.
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
