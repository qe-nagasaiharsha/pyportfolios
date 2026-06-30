import { Section, Lead, P, InlineCode, Term, Callout, PullQuote, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";

export default function KellyCriterionPositionSizing() {
  return (
    <>
      <Lead>
        Two traders can hold the exact same signal and end the decade in opposite places — one
        compounding, one ruined — purely because of how much they bet each time. The Kelly criterion
        is the answer to &ldquo;how much?&rdquo;: the position size that maximises the long-run growth
        rate of wealth. We derive it from first principles, code both forms, and explain why almost
        nobody runs full Kelly.
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
          quantity that actually accumulates over many bets is the average <em>growth rate</em> — the
          mean of the log returns, not the mean of the returns.
        </P>
      </Section>

      <Section id="derivation" n={2} title="Maximising log-growth">
        <P>
          Take the simplest case: a bet that wins with probability <InlineCode>p</InlineCode>, paying
          <InlineCode>b</InlineCode> to 1, and loses your stake with probability{" "}
          <InlineCode>q = 1 − p</InlineCode>. Bet a fraction <InlineCode>f</InlineCode> of wealth. After
          one round your wealth multiplies by <InlineCode>(1 + b·f)</InlineCode> on a win or{" "}
          <InlineCode>(1 − f)</InlineCode> on a loss. The expected log-growth per bet is
        </P>
        <CodeBlock
          file="growth.py"
          code={`# g(f) = p * ln(1 + b*f) + q * ln(1 - f)
# Maximise: take d/df, set to zero
#   p*b / (1 + b*f)  -  q / (1 - f)  =  0
# Solve for f  ->  f* = (p*b - q) / b  =  (p*(b+1) - 1) / b`}
        />
        <P>
          The function <InlineCode>g(f)</InlineCode> is concave — it rises to a single peak and then
          falls. That peak is the Kelly fraction. Crucially, <InlineCode>g(f)</InlineCode> goes{" "}
          <em>negative</em> well before <InlineCode>f = 1</InlineCode>: bet your whole stack and a single
          loss is fatal, so the long-run growth rate of full-bet gambling is minus infinity.
        </P>
        <PullQuote>
          Kelly maximises the rate at which money compounds — not how much you expect to have after one
          bet, but how fast you grow if you keep playing.
        </PullQuote>
      </Section>

      <Section id="formula" n={3} title="The Kelly fraction">
        <P>
          For the discrete bet, the optimum is <Term>f* = (p·b − q) / b</Term>: your edge divided by the
          odds. For continuous returns — a strategy with mean excess return <InlineCode>μ</InlineCode> and
          variance <InlineCode>σ²</InlineCode> — the same maximisation gives the elegant{" "}
          <Term>f* = μ / σ²</Term>. Both say the same thing: size up with edge, size down with risk, and
          punish variance quadratically.
        </P>
        <Callout kind="The two forms you will actually use">
          Discrete odds: <InlineCode>f* = (p·b − q) / b</InlineCode>. Continuous returns:{" "}
          <InlineCode>f* = μ / σ²</InlineCode> (with leverage capped at sensible bounds). Both collapse to
          the same idea — bet proportional to edge, inversely to variance.
        </Callout>
      </Section>

      <Section id="code" n={4} title="Kelly in code">
        <P>
          Both forms are a couple of lines. The continuous version is what a systematic book uses: feed it
          the strategy&rsquo;s estimated mean and volatility and it returns the growth-optimal leverage.
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

# a strategy: 8% excess return, 16% vol -> ~3.1x... too hot
print(kelly_continuous(0.08, 0.16))       # 3.125`}
        />
        <P>
          That <InlineCode>3.1x</InlineCode> is the warning the formula always gives in practice: full
          Kelly on estimated parameters is wildly aggressive, because <InlineCode>μ</InlineCode> is
          never known as precisely as the maths assumes.
        </P>
      </Section>

      <Section id="fractional" n={5} title="Why bet fractional Kelly">
        <P>
          Full Kelly is optimal only if you know <InlineCode>p</InlineCode>, <InlineCode>b</InlineCode>,
          <InlineCode>μ</InlineCode> and <InlineCode>σ</InlineCode> exactly. You don&rsquo;t — you estimate
          them, with error. Overestimate the edge and you sail past the peak of the growth curve into the
          region where growth <em>falls</em> and drawdowns explode. Because the curve is flat near its
          top, <Term>half-Kelly</Term> captures about three-quarters of the growth for a quarter of the
          variance — a trade almost everyone takes.
        </P>
        <DataTable
          head={["Sizing", "Growth captured", "Volatility of growth", "Typical max drawdown"]}
          rows={[
            ["Full Kelly", "100%", "1.00×", "Brutal (≈ 50%+)"],
            ["Half Kelly", "≈ 75%", "0.50×", "Roughly halved"],
            ["Quarter Kelly", "≈ 44%", "0.25×", "Mild"],
          ]}
        />
        <Figure caption="Long-run growth rate as a function of bet fraction (illustrative)" legend={[{ label: "Kelly peak", tone: "aqua" }, { label: "Growth", tone: "muted" }]}>
          <svg viewBox="0 0 600 220" className="w-full" role="img" aria-label="Growth rises to a peak at the Kelly fraction, then falls and turns negative as the bet fraction grows.">
            <line x1="40" y1="170" x2="580" y2="170" stroke="#4a4a42" strokeOpacity="0.4" strokeWidth="1" />
            <line x1="40" y1="20" x2="40" y2="180" stroke="#4a4a42" strokeOpacity="0.4" strokeWidth="1" />
            {/* concave growth curve peaking ~ x=250 */}
            <path d="M40,168 C120,70 200,40 250,40 C340,40 460,120 560,200" fill="none" stroke="#4a4a42" strokeWidth="2" />
            {/* peak marker */}
            <line x1="250" y1="40" x2="250" y2="170" stroke="#0a8a8a" strokeOpacity="0.5" strokeDasharray="4 4" strokeWidth="1.25" />
            <circle cx="250" cy="40" r="4" fill="#0a8a8a" />
            <text x="256" y="36" className="t-mono" fontSize="12" fill="#0a8a8a">full Kelly</text>
            <text x="150" y="190" className="t-mono" fontSize="11" fill="#4a4a42">½ Kelly</text>
            <text x="540" y="190" className="t-mono" fontSize="11" fill="#4a4a42">over-bet</text>
          </svg>
        </Figure>
      </Section>

      <Section id="takeaways" n={6} title="Takeaways">
        <P>
          Kelly turns &ldquo;how much should I bet?&rdquo; from a feeling into a formula:{" "}
          <InlineCode>edge / odds</InlineCode>, or <InlineCode>μ / σ²</InlineCode>. It is the size that
          compounds capital fastest — and a hard ceiling above which more risk buys <em>less</em> growth.
          In the real world, where parameters are estimated, treat full Kelly as the do-not-exceed line
          and run a fraction of it.
        </P>
        <Callout kind="Before you size a position with Kelly">
          Are your edge and volatility estimates honest and out-of-sample? Have you capped leverage?
          Are you running a fraction (½ or less) to survive estimation error? Numbers above are
          illustrative; the notebook simulates full vs fractional Kelly wealth paths so you can see the
          drawdown difference for yourself.
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
