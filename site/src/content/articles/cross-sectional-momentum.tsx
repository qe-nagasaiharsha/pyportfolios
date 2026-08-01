import { Section, Lead, P, InlineCode, Term, Callout, PullQuote, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";

export default function CrossSectionalMomentum() {
  return (
    <>
      <Lead>
        Momentum is the most documented anomaly in finance and the easiest to fake. Lag a signal by
        a single day in the wrong direction and a mediocre strategy turns spectacular — entirely on
        information it could never have had. We build a 12-1 cross-sectional momentum book, close
        every look-ahead gap, and only then ask the question that matters: does it survive costs?
      </Lead>

      <Section id="signal" n={1} title="The momentum signal">
        <P>
          Cross-sectional momentum ranks assets against each other: buy recent winners, short recent
          losers. The classic specification is <Term>12-1</Term> — rank on the trailing twelve-month
          return but skip the most recent month, because at the one-month horizon stocks tend to
          <Term>reverse</Term>, and including it pollutes the signal.
        </P>
        <CodeBlock
          file="signal.py"
          code={`import numpy as np
import pandas as pd

# monthly simple returns; columns = assets, index = month-end
mret = prices.resample("ME").last().pct_change()

# 12-1 momentum: compound an 11-month window ending one month before the trade
mom = (1 + mret).rolling(11).apply(np.prod, raw=True) - 1   # info through month t`}
        />
      </Section>

      <Section id="leakage" n={2} title="The look-ahead traps">
        <P>
          This is where most backtests quietly lie. Three traps, each fatal:
        </P>
        <P>
          <Term>Signal timing.</Term> The momentum computed with data through month <InlineCode>t</InlineCode>
          can only be traded in month <InlineCode>t+1</InlineCode>. Every weight must be lagged
          exactly once before it touches a return.
        </P>
        <P>
          <Term>Survivorship.</Term> If your price panel contains only assets that exist
          <Term>today</Term>, you have already deleted every loser that went to zero — the precise
          names a short book would have profited from. Use a point-in-time universe.
        </P>
        <P>
          <Term>Rebalance realism.</Term> Ranking on the close and trading at that same close is
          impossible. Trade the next open, or accept that your fill is fictional.
        </P>
        <PullQuote>
          A backtest is a measurement of your data hygiene first and your alpha second.
        </PullQuote>
      </Section>

      <Section id="portfolio" n={3} title="Forming the portfolio">
        <P>
          Rank cross-sectionally each month, go long the top decile and short the bottom, equal-
          weighted and dollar-neutral. The single <InlineCode>.shift(1)</InlineCode> below is the
          whole anti-look-ahead discipline made explicit — weights set at <InlineCode>t</InlineCode>,
          returns earned at <InlineCode>t+1</InlineCode>.
        </P>
        <CodeBlock
          file="portfolio.py"
          code={`ranks = mom.rank(axis=1, pct=True)
longs  = (ranks >= 0.9).astype(float)
shorts = (ranks <= 0.1).astype(float)

w = longs.div(longs.sum(axis=1), axis=0) - shorts.div(shorts.sum(axis=1), axis=0)

# weights chosen at t are held into t+1 -> lag once
port = (w.shift(1) * mret).sum(axis=1)`}
        />
      </Section>

      <Section id="backtest" n={4} title="An honest backtest">
        <P>
          With the lag in place, the long-short book shows the familiar momentum signature: a clean,
          near-monotonic spread from the loser decile to the winner decile. Encouraging — but this is
          still gross of every cost.
        </P>
        <Figure caption="Average monthly return by momentum decile (illustrative)" legend={[{ label: "Winners", tone: "aqua" }, { label: "Losers", tone: "muted" }]}>
          <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label="Average return rises almost monotonically from the loser decile to the winner decile.">
            <line x1="0" y1="150" x2="600" y2="150" stroke="#4a4a42" strokeOpacity="0.4" strokeWidth="1" />
            {[-26, -8, -4, 6, 10, 16, 20, 30, 38, 54].map((v, i) => {
              const x = 24 + i * 58;
              const top = v >= 0 ? 150 - v * 2.4 : 150;
              const h = Math.abs(v) * 2.4;
              const isWin = i >= 7;
              return <rect key={i} x={x} y={top} width="34" height={h} fill={isWin ? "#0a8a8a" : "#4a4a42"} fillOpacity={isWin ? 0.9 : 0.45} />;
            })}
            <text x="24" y="178" className="t-mono" fontSize="12" fill="#4a4a42">D1</text>
            <text x="546" y="178" className="t-mono" fontSize="12" fill="#0a8a8a">D10</text>
          </svg>
        </Figure>
      </Section>

      <Section id="costs" n={5} title="After costs & turnover">
        <P>
          Momentum is a high-turnover strategy — winners and losers churn every month. Charge a
          realistic cost on the weight you actually trade and the picture sobers up fast.
        </P>
        <CodeBlock
          file="costs.py"
          code={`turnover = w.diff().abs().sum(axis=1) / 2            # fraction of book traded
cost_per_unit = 0.0010                              # 10 bps round-trip
net = port - (turnover * cost_per_unit).shift(1)

def sharpe(r):
    return np.sqrt(12) * r.mean() / r.std()

print(f"gross Sharpe {sharpe(port):.2f}   net Sharpe {sharpe(net):.2f}")`}
        />
        <DataTable
          head={["Book", "Ann. return", "Ann. vol", "Sharpe", "Turnover / mo"]}
          rows={[
            ["Gross", "11.4%", "13.1%", "0.87", "—"],
            ["Net of 10 bps", "7.9%", "13.1%", "0.60", "168%"],
            ["Net of 20 bps", "4.5%", "13.1%", "0.34", "168%"],
          ]}
        />
      </Section>

      <Section id="verdict" n={6} title="Does it survive?">
        <P>
          Yes — but thinner than the textbook, and conditional. The edge is real and survives modest
          costs, yet it is fragile in two known ways: it is sensitive to transaction-cost
          assumptions, and it suffers rare, violent <Term>momentum crashes</Term> in sharp
          rebounds, when the short book of beaten-down names rips higher. Volatility-scaling the book
          tames the worst of those drawdowns.
        </P>
        <Callout kind="What to check before you believe a momentum backtest">
          Is every weight lagged? Is the universe point-in-time and survivorship-free? Are costs and
          turnover modelled, not assumed away? Did you test one specification, or a hundred and
          report the best? Numbers above are illustrative; the notebook builds the book end to end.
        </Callout>
      </Section>

      <References
        items={[
          "Jegadeesh, N. & Titman, S. (1993). Returns to Buying Winners and Selling Losers. Journal of Finance, 48(1).",
          "Asness, C., Moskowitz, T. & Pedersen, L. (2013). Value and Momentum Everywhere. Journal of Finance, 68(3).",
          "Daniel, K. & Moskowitz, T. (2016). Momentum Crashes. Journal of Financial Economics, 122(2).",
        ]}
      />
    </>
  );
}
