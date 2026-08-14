import { Section, Lead, P, InlineCode, Formula, Term, Callout, PullQuote, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";
import { LineChart, ScatterChart } from "@/components/charts/DataCharts";
import d from "./data/kelly-criterion-position-sizing";

/* Research article — all figures below render REAL computed results
   (SPY 2000–2024, seeded bootstrap) baked in by quant/legacy/kelly.py. */

const pc = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`;
/* same number, LaTeX-safe: a bare % opens a comment and swallows the rest */
const pcTex = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}\\%`;
const gc = d.growthCurve;
const curveXY = gc.f.map((f, i) => [f, gc.g[i]] as [number, number]);

export default function KellyCriterionPositionSizing() {
  return (
    <>
      <Lead>
        Two traders can hold the exact same signal and end the decade in opposite places — one
        compounding, one ruined — purely because of how much they bet each time. The Kelly criterion
        is the answer to &ldquo;how much?&rdquo;: the position size that maximises the long-run growth
        rate of wealth. We derive it from first principles, compute it on twenty-five years of real
        SPY data, and show — with real drawdowns — why almost nobody runs full Kelly.
      </Lead>

      <Section id="idea" n={1} title="The question Kelly answers">
        <P>
          Suppose you have a genuine edge — a bet that pays off more often than not, or a strategy with
          positive expected return. Bet too little and you leave growth on the table. Bet too much and a
          run of losses takes you to zero, from which no edge can recover. There is a single fraction of
          capital in between that is provably optimal for <Term>long-run growth</Term>, and it does not
          depend on your risk preferences — only on the edge and the odds.
        </P>
        <P>
          The key reframing, due to Kelly (1956), is to stop maximising expected <Term>wealth</Term> and
          start maximising expected <Term>log-wealth</Term>. Wealth compounds multiplicatively, so the
          quantity that actually accumulates over many bets is the average <strong className="font-bold text-pearl">growth rate</strong> — the
          mean of the log returns, not the mean of the returns.
        </P>
      </Section>

      <Section id="derivation" n={2} title="Maximising log-growth">
        <P>
          Take the simplest case: a bet that wins with probability <Formula>p</Formula>, paying{" "}
          <Formula>b</Formula> to 1, and loses your stake with probability{" "}
          <Formula>{String.raw`q = 1 - p`}</Formula>. Bet a fraction <Formula>f</Formula> of wealth. After
          one round your wealth multiplies by <Formula>{String.raw`(1 + bf)`}</Formula> on a win or{" "}
          <Formula>{String.raw`(1 - f)`}</Formula> on a loss. The expected log-growth per bet is
        </P>
        <CodeBlock
          file="growth.py"
          code={`# g(f) = p * ln(1 + b*f) + q * ln(1 - f)
# Maximise: take d/df, set to zero
#   p*b / (1 + b*f)  -  q / (1 - f)  =  0
# Solve for f  ->  f* = (p*b - q) / b  =  (p*(b+1) - 1) / b`}
        />
        <P>
          The function <Formula>{String.raw`g(f)`}</Formula> is concave — it rises to a single peak and then
          falls. That peak is the Kelly fraction. Crucially, <Formula>{String.raw`g(f)`}</Formula> goes{" "}
          <strong className="font-bold text-pearl">negative</strong> well before <Formula>{String.raw`f = 1`}</Formula>: bet your whole stack and a single
          loss is fatal, so the long-run growth rate of full-bet gambling is minus infinity.
        </P>
        <PullQuote>
          Kelly maximises the rate at which money compounds — not how much you expect to have after one
          bet, but how fast you grow if you keep playing.
        </PullQuote>
      </Section>

      <Section id="formula" n={3} title="The Kelly fraction">
        <P>
          For the discrete bet, the optimum is <Formula>{String.raw`f^* = \frac{pb - q}{b}`}</Formula>: your edge divided by the
          odds. For continuous returns — a strategy with mean excess return <Formula>{String.raw`\mu`}</Formula> and
          variance <Formula>{String.raw`\sigma^2`}</Formula> — the same maximisation gives the elegant{" "}
          <Formula>{String.raw`f^* = \frac{\mu}{\sigma^2}`}</Formula>. Both say the same thing: size up with edge, size down with risk, and
          punish variance quadratically.
        </P>
        <Callout kind="The two forms you will actually use">
          Discrete odds: <Formula>{String.raw`f^* = \frac{pb - q}{b}`}</Formula>. Continuous returns:{" "}
          <Formula>{String.raw`f^* = \frac{\mu}{\sigma^2}`}</Formula> (with leverage capped at sensible bounds). Both collapse to
          the same idea — bet proportional to edge, inversely to variance.
        </Callout>
      </Section>

      <Section id="code" n={4} title="Kelly in code">
        <P>
          Both forms are a couple of lines. The continuous version is what a systematic book uses: feed it
          the strategy&rsquo;s estimated mean and volatility and it returns the growth-optimal leverage. On
          real SPY data, {d.params.start} to {d.params.end} ({d.params.nObs.toLocaleString()} trading
          days), the estimates are <Formula>{`\\mu = ${pcTex(d.params.muAnnual)}`}</Formula> and{" "}
          <Formula>{`\\sigma = ${pcTex(d.params.sigmaAnnual)}`}</Formula> a year:
        </P>
        <CodeBlock
          file="kelly.py"
          code={`import numpy as np

def kelly_discrete(p: float, b: float) -> float:
    """Fraction to bet on a win-prob p, b-to-1 payoff."""
    q = 1 - p
    return (p * b - q) / b

def kelly_continuous(mu: float, sigma: float) -> float:
    """Growth-optimal leverage for a strategy with excess
    return mu and volatility sigma (same time unit)."""
    return mu / sigma**2

# 55% edge at even money -> bet 10% of capital
print(kelly_discrete(0.55, 1.0))          # 0.10

# SPY 2000-2024: mu = ${d.params.muAnnual.toFixed(4)}, sigma = ${d.params.sigmaAnnual.toFixed(4)}
print(kelly_continuous(${d.params.muAnnual.toFixed(4)}, ${d.params.sigmaAnnual.toFixed(4)}))   # ${d.params.fStar.toFixed(2)}`}
        />
        <P>
          That <InlineCode>{d.params.fStar.toFixed(2)}x</InlineCode>{" "}is the warning the formula always
          gives in practice: full Kelly on estimated parameters says to run the S&amp;P 500 at two and a
          half times leverage — through 2008. It is wildly aggressive, because{" "}
          <Formula>{String.raw`\mu`}</Formula> is never known as precisely as the maths assumes.
        </P>
      </Section>

      <Section id="fractional" n={5} title="Why bet fractional Kelly">
        <P>
          Full Kelly is optimal only if you know <Formula>p</Formula>, <Formula>b</Formula>,{" "}
          <Formula>{String.raw`\mu`}</Formula> and <Formula>{String.raw`\sigma`}</Formula>{" "}exactly. You don&rsquo;t — you estimate
          them, with error. Overestimate the edge and you sail past the peak of the growth curve into the
          region where growth <strong className="font-bold text-pearl">falls</strong> and drawdowns explode. The curve below is not a sketch: it is
          the realised growth rate <Formula>{String.raw`g(f) = 252\,\mathbb{E}\!\left[\ln(1 + f r)\right]`}</Formula> on the actual{" "}
          {d.params.years.toFixed(0)} years of SPY daily returns, fat tails included.
        </P>
        <Figure
          caption="Realised long-run growth rate vs bet fraction, SPY 2000–2024 — the peak is full Kelly"
          legend={[{ label: "Kelly peak", tone: "aqua" }, { label: "g(f)", tone: "muted" }]}
        >
          <ScatterChart
            ariaLabel="Growth rises to a peak of about 11 percent a year at a fraction near 2.5, then falls and turns negative as the bet fraction approaches 5."
            points={[]}
            lines={[{ xy: curveXY, color: "graphite", width: 2 }]}
            marks={[
              { x: gc.peak.f, y: gc.peak.g, label: "full Kelly", color: "teal" },
              { x: gc.half.f, y: gc.half.g, label: "½", color: "amber" },
              { x: gc.quarter.f, y: gc.quarter.g, label: "¼", color: "amber" },
            ]}
            xLabel="bet fraction f (leverage)"
            yFmt={(v) => pc(v, 0)}
          />
        </Figure>
        <P>
          Because the curve is flat near its top, <Term>half-Kelly</Term> captures{" "}
          {pc(d.histStats.half.gCaptured, 0)} of the growth rate for half the volatility — a trade
          almost everyone takes. Here is what each sizing actually did, rebalanced daily through the
          dot-com bust, the GFC and COVID:
        </P>
        <DataTable
          head={["Sizing", "f", "CAGR 2000–24", "Terminal wealth", "Max drawdown", "Growth captured"]}
          rows={[
            ["Full Kelly", `${d.histStats.full.f.toFixed(2)}×`, pc(d.histStats.full.cagr), `${d.histStats.full.terminal.toFixed(1)}×`, pc(d.histStats.full.maxDD), pc(d.histStats.full.gCaptured, 0)],
            ["Half Kelly", `${d.histStats.half.f.toFixed(2)}×`, pc(d.histStats.half.cagr), `${d.histStats.half.terminal.toFixed(1)}×`, pc(d.histStats.half.maxDD), pc(d.histStats.half.gCaptured, 0)],
            ["Quarter Kelly", `${d.histStats.quarter.f.toFixed(2)}×`, pc(d.histStats.quarter.cagr), `${d.histStats.quarter.terminal.toFixed(1)}×`, pc(d.histStats.quarter.maxDD), pc(d.histStats.quarter.gCaptured, 0)],
            ["SPY unlevered", "1.00×", pc(d.histStats.unlevered.cagr), `${d.histStats.unlevered.terminal.toFixed(1)}×`, pc(d.histStats.unlevered.maxDD), pc(d.histStats.unlevered.gCaptured, 0)],
          ]}
        />
        <Figure
          caption="Wealth at full / half / quarter Kelly, daily rebalanced, log scale — the drawdowns are the story"
          legend={[
            { label: "full", tone: "muted" },
            { label: "half / quarter", tone: "aqua" },
          ]}
        >
          <LineChart
            ariaLabel="Three wealth curves over 25 years on a log scale: full Kelly is the most volatile, collapsing by over 90 percent in 2009 before recovering to the highest terminal value; half and quarter Kelly are progressively smoother."
            series={[
              { y: d.wealth.full as unknown as number[], color: "rust", width: 1.6 },
              { y: d.wealth.half as unknown as number[], color: "teal", width: 1.8 },
              { y: d.wealth.quarter as unknown as number[], color: "slate", width: 1.5 },
            ]}
            xLabels={d.wealthXLabels as unknown as [number, string][]}
            yFmt={(v) => `${(10 ** v).toFixed(Math.abs(v) < 0.7 ? 1 : 0)}x`}
          />
        </Figure>
        <P>
          Full Kelly went down {pc(d.histStats.full.maxDD)}{" "}peak-to-trough in the GFC — a hole most
          humans (and all investors with redemptions) abandon at the bottom of. Half Kelly&rsquo;s worst
          drawdown was {pc(d.histStats.half.maxDD)} for a terminal wealth still{" "}
          {d.histStats.half.terminal.toFixed(1)}× the start. A seeded bootstrap of{" "}
          {d.params.bootPaths.toLocaleString()} ten-year futures from the same return distribution
          makes the trade-off explicit:
        </P>
        <DataTable
          head={["Sizing", "Median 10y wealth", "5th pct wealth", "Median max DD", "Worst-5% max DD"]}
          rows={[
            ["Full Kelly", `${d.boot.full.medTerminal.toFixed(1)}×`, `${d.boot.full.p5Terminal.toFixed(2)}×`, pc(d.boot.full.medMaxDD), pc(d.boot.full.worstDD5)],
            ["Half Kelly", `${d.boot.half.medTerminal.toFixed(1)}×`, `${d.boot.half.p5Terminal.toFixed(2)}×`, pc(d.boot.half.medMaxDD), pc(d.boot.half.worstDD5)],
            ["Quarter Kelly", `${d.boot.quarter.medTerminal.toFixed(1)}×`, `${d.boot.quarter.p5Terminal.toFixed(2)}×`, pc(d.boot.quarter.medMaxDD), pc(d.boot.quarter.worstDD5)],
          ]}
        />
      </Section>

      <Section id="takeaways" n={6} title="Takeaways">
        <P>
          Kelly turns &ldquo;how much should I bet?&rdquo; from a feeling into a formula:{" "}
          <Formula>{String.raw`\frac{\text{edge}}{\text{odds}}`}</Formula>, or <Formula>{String.raw`\frac{\mu}{\sigma^2}`}</Formula>. On real SPY data the
          formula says {d.params.fStar.toFixed(2)}× — and the same data shows what running it costs: a{" "}
          {pc(d.histStats.full.maxDD)} drawdown on the way to the fastest compounding. It is the size
          that grows capital fastest <strong className="font-bold text-pearl">and</strong> a hard ceiling above which more risk buys{" "}
          <strong className="font-bold text-pearl">less</strong> growth. In the real world, where parameters are estimated, treat full Kelly as
          the do-not-exceed line and run a fraction of it — half Kelly kept{" "}
          {pc(d.histStats.half.gCaptured, 0)} of the growth rate for a drawdown{" "}
          {pc(d.histStats.half.maxDD)} instead of {pc(d.histStats.full.maxDD)}.
        </P>
        <Callout kind="Before you size a position with Kelly">
          Are your edge and volatility estimates honest and out-of-sample? Have you capped leverage?
          Are you running a fraction (½ or less) to survive estimation error? Every number above is
          computed from real SPY data (seed {String(d.params.seed)} for the bootstrap); the companion
          notebook reproduces the growth curve, the wealth paths and the drawdown table end to end.
        </Callout>
      </Section>

      <References
        items={[
          "Kelly, J. L. (1956). A New Interpretation of Information Rate. Bell System Technical Journal, 35(4).",
          "Thorp, E. O. (2006). The Kelly Criterion in Blackjack, Sports Betting, and the Stock Market. Handbook of Asset and Liability Management.",
          "MacLean, L., Thorp, E. & Ziemba, W. (2011). The Kelly Capital Growth Investment Criterion. World Scientific.",
        ]}
      />
    </>
  );
}
