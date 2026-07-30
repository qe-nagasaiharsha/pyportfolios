import { Section, Lead, P, InlineCode, Term, Callout, PullQuote, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";
import { LineChart, BarChart } from "@/components/charts/DataCharts";
import d from "./data/cross-sectional-momentum";

/* Research article — all figures below render REAL computed results
   (11 SPDR sector ETFs, 2005–2024) baked in by quant/legacy/momentum.py. */

const pc = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`;

export default function CrossSectionalMomentum() {
  const s = d.stats;
  return (
    <>
      <Lead>
        Momentum is the most documented anomaly in finance and the easiest to fake. Lag a signal by
        a single day in the wrong direction and a mediocre strategy turns spectacular — entirely on
        information it could never have had. We build a 12-1 cross-sectional momentum book on the
        eleven S&amp;P sector ETFs, {d.params.start} to {d.params.end}, close every look-ahead gap,
        and only then ask the question that matters: does it survive costs?
      </Lead>

      <Section id="signal" n={1} title="The momentum signal">
        <P>
          Cross-sectional momentum ranks assets against each other: buy recent winners, short recent
          losers. The classic specification is <Term>12-1</Term> — rank on the trailing twelve-month
          return but skip the most recent month, because at the one-month horizon assets tend to{" "}
          <Term>reverse</Term>, and including it pollutes the signal. Relative to the month actually
          held, the ranking window is returns at lags 2 through 12.
        </P>
        <CodeBlock
          file="signal.py"
          code={`import numpy as np
import pandas as pd

# monthly simple returns; columns = the 11 SPDR sectors, index = month-end
mret = prices.resample("ME").last().pct_change()

# 12-1 momentum: compound 11 months, then shift so the window is t-12..t-2
# relative to the month we trade -- the most recent month is skipped
mom = ((1 + mret).rolling(11).apply(np.prod, raw=True) - 1).shift(1)`}
        />
      </Section>

      <Section id="leakage" n={2} title="The look-ahead traps">
        <P>
          This is where most backtests quietly lie. Three traps, each fatal:
        </P>
        <P>
          <Term>Signal timing.</Term> The momentum computed with data through month <InlineCode>t</InlineCode>{" "}
          can only be traded in month <InlineCode>t+1</InlineCode>. Every weight must be lagged
          exactly once before it touches a return.
        </P>
        <P>
          <Term>Survivorship.</Term> If your price panel contains only assets that exist{" "}
          <Term>today</Term>, you have already deleted every loser that went to zero — the precise
          names a short book would have profited from. Use a point-in-time universe. In our sector
          panel that discipline is visible in miniature: XLRE and XLC launch mid-sample, and they
          enter the rankable universe only once they have a full 12-month history.
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
          Rank cross-sectionally each month, go long the top three sectors and short the bottom
          three, equal-weighted and dollar-neutral. The single <InlineCode>.shift(1)</InlineCode>{" "}
          below is the whole anti-look-ahead discipline made explicit — weights set at{" "}
          <InlineCode>t</InlineCode>, returns earned at <InlineCode>t+1</InlineCode>.
        </P>
        <CodeBlock
          file="portfolio.py"
          code={`nsec  = mom.notna().sum(axis=1)          # point-in-time universe size
ranks = mom.rank(axis=1)                 # 1 = worst .. nsec = best

longs  = ranks.sub(nsec, axis=0).ge(-2).astype(float)   # top 3
shorts = ranks.le(3).astype(float)                      # bottom 3

w = longs.div(longs.sum(axis=1), axis=0) - shorts.div(shorts.sum(axis=1), axis=0)

# weights chosen at t are held into t+1 -> lag once
port = (w.shift(1) * mret).sum(axis=1)`}
        />
      </Section>

      <Section id="backtest" n={4} title="An honest backtest">
        <P>
          With the lag in place, here is what {d.params.nMonths} months of real sector data actually
          deliver — and it is not the textbook staircase. The winners (ranks 9–11) do edge out the
          losers, but the spread is faint and far from monotonic: eleven sectors are not three
          thousand stocks, and the great sector-momentum years predate this sample. This chart is
          computed, not drawn — and that is the point of the article.
        </P>
        <Figure
          caption={`Average next-month return by momentum rank, ${d.params.start} → ${d.params.end}`}
          legend={[{ label: "% per month", tone: "aqua" }]}
        >
          <BarChart
            ariaLabel="Average next-month return by momentum rank across 11 sectors: all bars are positive and the winner ranks are only slightly higher than the loser ranks."
            labels={d.rankBars.labels as unknown as string[]}
            groups={[{ values: d.rankBars.values as unknown as number[], color: "teal" }]}
            yFmt={(v) => `${v.toFixed(1)}%`}
          />
        </Figure>
        <P>
          Rank 1 (the losers a short book sells) still averaged {d.rankBars.values[0].toFixed(2)}%
          per month; rank 11 (the winners) {d.rankBars.values[10].toFixed(2)}%. Everything is
          positive because the market drifted up for two decades — a long-short book only earns the{" "}
          <Term>difference</Term>, and gross of costs that difference is thin.
        </P>
      </Section>

      <Section id="costs" n={5} title="After costs & turnover">
        <P>
          Momentum is a high-turnover strategy — winners and losers churn every month. This book
          trades {pc(d.turnoverMo, 0)} of each side per month on average. Charge a realistic cost on
          the notional actually traded and the picture sobers up fast.
        </P>
        <CodeBlock
          file="costs.py"
          code={`turnover = w.diff().abs().sum(axis=1) / 2           # one-way, per side of book
cost_per_unit = 0.0010                              # 10 bps on traded notional
net = port - (turnover * cost_per_unit * 2).shift(1)

def sharpe(r):
    return np.sqrt(12) * r.mean() / r.std()

print(f"gross Sharpe {sharpe(port.dropna()):.2f}   net Sharpe {sharpe(net.dropna()):.2f}")`}
        />
        <DataTable
          head={["Book", "Ann. return", "Ann. vol", "Sharpe", "Max drawdown"]}
          rows={[
            ["Gross", pc(s.gross.annRet), pc(s.gross.annVol), s.gross.sharpe.toFixed(2), pc(s.gross.maxDD)],
            ["Net of 10 bps", pc(s.net10.annRet), pc(s.net10.annVol), s.net10.sharpe.toFixed(2), pc(s.net10.maxDD)],
            ["Net of 20 bps", pc(s.net20.annRet), pc(s.net20.annVol), s.net20.sharpe.toFixed(2), pc(s.net20.maxDD)],
          ]}
        />
        <Figure
          caption="Long-short equity, gross vs net of 10 bps — 19 years of honest sector momentum"
          legend={[
            { label: "gross", tone: "muted" },
            { label: "net 10 bps", tone: "aqua" },
          ]}
        >
          <LineChart
            ariaLabel="Equity curves of the long-short sector momentum book: roughly flat for years, a sharp collapse in 2009, and no recovery to new highs; the net curve sits below the gross curve throughout."
            series={[
              { y: d.equity.gross as unknown as number[], color: "graphite", width: 1.4 },
              { y: d.equity.net as unknown as number[], color: "teal", width: 1.8 },
            ]}
            xLabels={d.equity.xLabels as unknown as [number, string][]}
            yFmt={(v) => `${v.toFixed(1)}x`}
          />
        </Figure>
      </Section>

      <Section id="verdict" n={6} title="Does it survive?">
        <P>
          On this universe: no — and an honest backtest should be allowed to say so. The gross book
          annualises at {pc(s.gross.annRet)} with a Sharpe of {s.gross.sharpe.toFixed(2)}; net of
          10&nbsp;bps it is {pc(s.net10.annRet)}{" "}a year. The equity curve also exhibits the
          anomaly&rsquo;s known failure mode in full: a rare, violent <Term>momentum crash</Term> in a
          sharp rebound, when the short book of beaten-down sectors rips higher. The single worst
          month is {d.worstMonth.date.slice(0, 7)}, at {pc(d.worstMonth.net)}{" "}— the 2009 reversal,
          exactly where Daniel &amp; Moskowitz put it. Momentum&rsquo;s premium is documented in broad
          single-stock universes; on eleven sector ETFs, in this sample, after costs, it is not
          there. A leaked or survivorship-biased version of this same backtest would happily have
          told you otherwise.
        </P>
        <Callout kind="What to check before you believe a momentum backtest">
          Is every weight lagged? Is the universe point-in-time and survivorship-free? Are costs and
          turnover modelled, not assumed away? Did you test one specification, or a hundred and
          report the best? Every number above is computed from the real sector panel; the companion
          notebook rebuilds the book end to end from raw prices.
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
