import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References, Pipeline } from "@/components/article/prose";
import d from "./data/sma-crossover-backtest";
import { Heatmap } from "@/components/charts/echarts/Heatmap";
import { Line } from "@/components/charts/echarts/Line";

/* T13 / topic card 13-16 — all figures below render REAL computed results
   (QQQ + BTC-USD, Jan 2015 – Dec 2024, deterministic) baked in by
   quant/tutorials/t13_sma.py. Simulation core: pandas (signal.shift(1),
   10bp per side); fills independently cross-checked with vectorbt 1.x. */

const pc = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`;
const usd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
const logFmt = (v: number) => usd(10 ** v);
const gridFmt = (v: number) => (v === d.params.sentinel ? "—" : v.toFixed(2));

const FAST_LABELS = d.params.fasts.map(String);
const SLOW_LABELS = d.params.slows.map(String);

interface LegStats {
  annRet: number;
  annVol: number;
  sharpe: number;
  maxDD: number;
  trades: number;
  timeInMkt: number;
}

function statsRows(name: string, blk: { stats: { strategy: LegStats; buyhold: LegStats } }) {
  const s = blk.stats.strategy;
  const b = blk.stats.buyhold;
  return [
    [`${name} · 50/200 crossover`, pc(s.annRet), pc(s.annVol), s.sharpe.toFixed(2), pc(s.maxDD), String(s.trades), pc(s.timeInMkt, 0)],
    [`${name} · buy & hold`, pc(b.annRet), pc(b.annVol), b.sharpe.toFixed(2), pc(b.maxDD), "—", "100%"],
  ];
}

export default function SmaCrossoverBacktest() {
  const q = d.qqq;
  const b = d.btc;

  return (
    <>
      <Lead>
        The 50/200 moving-average crossover — the <Term>golden cross</Term> — is the systematic
        trend-following workhorse: one rule, two parameters, a century of folklore. That makes it
        the perfect vehicle for backtesting discipline 101. We run the same long-or-flat rule on
        QQQ and BTC-USD over 2015–2024 with next-day execution and 10bp per-side costs, then do
        what most crossover backtests skip: sweep the parameter grid, stress the costs, and admit
        what one in-sample decade can and cannot prove.
      </Lead>

      <Pipeline
        steps={[
          "Download QQQ + BTC-USD closes, 2015–2024 (yfinance), dropna per asset",
          "Signal: 50d SMA above 200d SMA → long, else flat",
          "Execute next day — signal.shift(1), 10bp per side",
          "Compare vs buy-and-hold; cross-check fills with vectorbt",
          "Sweep the 4×4 fast/slow Sharpe grid per asset",
          "Stress costs (0/10/25bp) and file the in-sample caveats",
        ]}
      />

      <Section id="signal" n={1} title="The rule: two moving averages">
        <P>
          Compute a fast and a slow simple moving average of the close. When the fast SMA sits
          above the slow one, the market is trending up — be long. When it drops below, be flat.
          No shorting, no leverage, no discretion. With <InlineCode>fast = {d.params.fast}</InlineCode>{" "}
          and <InlineCode>slow = {d.params.slow}</InlineCode> this is the golden cross of financial
          television fame, and a one-asset special case of <Term>time-series momentum</Term> — the
          effect Moskowitz, Ooi and Pedersen documented across 58 futures markets.
        </P>
        <P>
          We run it on two deliberately different animals: the Nasdaq-100 ETF (exchange calendar,
          ~252 bars a year) and Bitcoin (trades every day of the week, ~365 bars a year). BTC has
          prices on weekends where QQQ has none, so each asset is backtested on its own calendar —
          per-asset <InlineCode>dropna</InlineCode>, per-asset annualisation — never forward-filled
          onto a shared grid.
        </P>
        <Callout kind="Why practitioners care">
          Trend filters run inside real money: managed-futures funds, crypto treasuries, tactical
          ETF overlays. But the reason this tutorial exists is the workflow, not the rule — the
          crossover is simple enough that every backtesting sin (lookahead, ignored costs,
          parameter cherry-picking, in-sample worship) is visible in a single screen of code. Learn
          to catch them here and you will catch them in strategies that matter.
        </Callout>
      </Section>

      <Section id="lookahead" n={2} title="Next-day execution — the shift(1) that keeps you honest">
        <P>
          The most important line in the backtest is not the signal. It is the shift. Today&apos;s
          SMA cross is computed on today&apos;s <Term>close</Term> — a price you cannot trade before
          you have seen it. So today&apos;s signal may only earn <Term>tomorrow&apos;s</Term> return.
          Drop the shift and the backtest buys every up-day one bar early: a lookahead bias that
          flatters almost any signal and quietly fabricates Sharpe.
        </P>
        <CodeBlock
          file="backtest.py"
          code={`def backtest(px, fast=${d.params.fast}, slow=${d.params.slow}, fee=0.001):
    signal   = (px.rolling(fast).mean() > px.rolling(slow).mean()).astype(float)
    position = signal.shift(1).fillna(0.0)   # <- no lookahead. The whole game.
    ret      = px.pct_change().fillna(0.0)
    cost     = position.diff().abs().fillna(0.0) * fee   # 10bp per side
    return (position * ret - cost).iloc[${d.params.warmupBars}:]   # SMA warm-up window`}
        />
        <P>
          Two more discipline details. Every position change pays {d.params.feeBp}bp — entries and
          exits both. And the first {d.params.warmupBars} bars of each asset are reserved for SMA
          warm-up, so every parameter pair we test later is judged on the <Term>same</Term>{" "}
          evaluation window: {q.start} → {q.end} for QQQ, {b.start} → {b.end} for BTC. The pandas
          core above is deliberately transparent; we rebuild the identical trades with
          vectorbt&apos;s <InlineCode>Portfolio.from_signals</InlineCode> as an independent referee
          — final value, max drawdown and trade count agree.
        </P>
      </Section>

      <Section id="results" n={3} title="Same rule, two verdicts">
        <P>
          Growth of $100, log scale (BTC would render every other line invisible otherwise). Watch{" "}
          <Term>where</Term> the strategy detaches from buy-and-hold: always in the big drawdowns.
          A slow trend filter is not an accelerator — it is a brake pedal.
        </P>
        <Figure
          caption={`QQQ — growth of $100 (log scale), ${q.start} → ${q.end}`}
          legend={[
            { label: "50/200 crossover", tone: "aqua" },
            { label: "buy & hold", tone: "muted" },
          ]}
        >
          <Line
            ariaLabel="QQQ: strategy and buy-and-hold equity curves track each other closely; the strategy sidesteps part of the 2022 drawdown and ends slightly below buy-and-hold."
            series={[
              { name: "buy & hold", y: q.eqLog.buyhold as unknown as number[], color: "graphite", width: 1.3, opacity: 0.75 },
              { name: "SMA strategy", y: q.eqLog.strategy as unknown as number[], color: "teal", width: 2 },
            ]}
            xLabels={q.eqLog.xLabels as unknown as [number, string][]}
            yFmt={{ decimals: 0 }}
          />
        </Figure>
        <Figure
          caption={`BTC-USD — growth of $100 (log scale), ${b.start} → ${b.end}`}
          legend={[
            { label: "50/200 crossover", tone: "aqua" },
            { label: "buy & hold", tone: "muted" },
          ]}
        >
          <Line
            ariaLabel="Bitcoin: both curves rise from 100 dollars into the tens of thousands; the strategy line steps flat through the 2018 and 2022 bear markets while buy-and-hold collapses and recovers."
            series={[
              { name: "buy & hold", y: b.eqLog.buyhold as unknown as number[], color: "graphite", width: 1.3, opacity: 0.75 },
              { name: "SMA strategy", y: b.eqLog.strategy as unknown as number[], color: "teal", width: 2 },
            ]}
            xLabels={b.eqLog.xLabels as unknown as [number, string][]}
            yFmt={{ decimals: 0 }}
          />
        </Figure>
        <DataTable
          head={["", "Ann ret", "Ann vol", "Sharpe", "Max DD", "Trades", "In mkt"]}
          rows={[...statsRows("QQQ", q), ...statsRows("BTC", b)]}
        />
        <P>
          On QQQ the crossover ends at {usd(q.stats.strategy.final)} versus{" "}
          {usd(q.stats.buyhold.final)} for buy-and-hold — it <Term>lost</Term> the return race —
          but it did so at {pc(q.stats.strategy.annVol)} vol instead of{" "}
          {pc(q.stats.buyhold.annVol)} and cut the worst drawdown from{" "}
          {pc(q.stats.buyhold.maxDD)} to {pc(q.stats.strategy.maxDD)}, for a slightly better
          Sharpe ({q.stats.strategy.sharpe.toFixed(2)} vs {q.stats.buyhold.sharpe.toFixed(2)}).
          On BTC it kept pace with one of the great bull markets in modern data
          ({usd(b.stats.strategy.final)} vs {usd(b.stats.buyhold.final)}) while sitting out{" "}
          {pc(1 - b.stats.strategy.timeInMkt, 0)} of all days and trimming the max drawdown from{" "}
          {pc(b.stats.buyhold.maxDD)} to {pc(b.stats.strategy.maxDD)}. Neither run is a money
          machine. Both are drawdown insurance — and the whole 10-year QQQ position changed hands
          just {q.stats.strategy.trades} times. Two conservatisms are baked into every number
          above and worth naming: flat days are credited <Term>nothing</Term> (the QQQ variant
          sits in cash {pc(1 - q.stats.strategy.timeInMkt, 0)} of the time — park that at the
          T-bill rate and the strategy line improves while buy-and-hold&apos;s cannot), and
          Sharpe is quoted on raw rather than excess returns. Both choices shade against the
          strategy, which is the right direction to be wrong in.
        </P>
      </Section>

      <Section id="grid" n={4} title="Discipline 101: the parameter grid">
        <P>
          One backtest is an anecdote. Before believing 50/200, ask whether the{" "}
          <Term>neighbourhood</Term> agrees: we sweep fast ∈ {"{"}
          {d.params.fasts.join(", ")}{"}"} × slow ∈ {"{"}{d.params.slows.join(", ")}{"}"} — {q.gridCells}{" "}
          valid systems per asset, identical execution, identical costs — and heat-map the Sharpe.
          Both grids share one colour scale, so a glance tells you which asset rewarded trend.
        </P>
        <Figure
          caption={`QQQ — Sharpe by fast (rows) × slow (cols), ${d.params.feeBp}bp per side · buy-and-hold = ${q.stats.buyhold.sharpe.toFixed(2)}`}
        >
          <Heatmap
            ariaLabel="Four-by-four Sharpe grid for QQQ ranging from 0.78 to 1.01, all cells close to the buy-and-hold Sharpe of 0.90."
            rows={FAST_LABELS}
            cols={SLOW_LABELS}
            values={q.grid as unknown as number[][]}
            vFmt={{ decimals: 2 }}
            min={d.params.gridLo}
            max={d.params.gridHi}
            height={220}
          />
        </Figure>
        <Figure
          caption={`BTC-USD — Sharpe by fast (rows) × slow (cols), ${d.params.feeBp}bp per side · buy-and-hold = ${b.stats.buyhold.sharpe.toFixed(2)}`}
        >
          <Heatmap
            ariaLabel="Four-by-four Sharpe grid for Bitcoin ranging from 1.18 to 1.43, mostly above the buy-and-hold Sharpe of 1.27."
            rows={FAST_LABELS}
            cols={SLOW_LABELS}
            values={b.grid as unknown as number[][]}
            vFmt={{ decimals: 2 }}
            min={d.params.gridLo}
            max={d.params.gridHi}
            height={220}
          />
        </Figure>
        <P>
          This is the card&apos;s thesis in one picture. <Term>QQQ</Term>: every cell lands between{" "}
          {q.gridWorst.toFixed(2)} and {q.gridBest.toFixed(2)}, straddling buy-and-hold&apos;s{" "}
          {q.stats.buyhold.sharpe.toFixed(2)} — only {q.gridAboveBH} of {q.gridCells} cells beat
          it, none decisively. Picking the best cell after the fact and calling it edge is
          selection bias, not alpha; on this asset the honest claim is &quot;no return edge, a
          consistent drawdown brake&quot;. <Term>BTC</Term>: {b.gridAboveBH} of {b.gridCells} cells
          sit above buy-and-hold&apos;s {b.stats.buyhold.sharpe.toFixed(2)}, the whole grid stays
          in the {b.gridWorst.toFixed(2)}–{b.gridBest.toFixed(2)} band, and every cell slashes the
          max drawdown. The same rule gets two different verdicts because{" "}
          <Term>trend behaves differently per asset</Term> — Bitcoin&apos;s decade delivered
          longer, cleaner trends and far deeper crashes for the filter to sidestep.
        </P>
      </Section>

      <Section id="costs" n={5} title="The costs dial: 0 / 10 / 25 bp">
        <P>
          Costs are the second-biggest backtest killer after lookahead — but they bite in
          proportion to turnover. The 50/200 pair trades a handful of times a decade, so even
          25bp per side barely dents it. Speed the system up to 10/100 and the toll booth opens:
        </P>
        <DataTable
          head={["", "Trades", "Sharpe @ 0bp", "@ 10bp", "@ 25bp", "Final $100 @ 10bp"]}
          rows={[
            ...q.costs.map((c) => [`QQQ · ${c.pair}`, String(c.trades), c.s0.toFixed(2), c.s10.toFixed(2), c.s25.toFixed(2), usd(c.final10)]),
            ...b.costs.map((c) => [`BTC · ${c.pair}`, String(c.trades), c.s0.toFixed(2), c.s10.toFixed(2), c.s25.toFixed(2), usd(c.final10)]),
          ]}
        />
        <P>
          Slow trend is nearly free to run. Fast trend pays a visible tax — QQQ&apos;s 10/100
          variant loses {(q.costs[1].s0 - q.costs[1].s25).toFixed(2)} Sharpe going from free
          execution to 25bp, on {q.costs[1].trades} round-trip entries. Any strategy whose
          backtest only works at 0bp does not work.
        </P>
      </Section>

      <Section id="honesty" n={6} title="One sample, no walk-forward">
        <P>
          Everything above is one ten-year window, evaluated in-sample. There is no walk-forward,
          no out-of-sample holdout, and no multiple-testing haircut for the {q.gridCells} variants
          we just eyeballed per asset. 2015–2024 handed both assets two of the strongest trend
          decades they have ever printed — a regime gift the next decade owes nobody. Before
          promoting any cell of that grid, run the standard honesty checklist: point-in-time
          data, walk-forward splits, pessimistic costs, and a <Term>deflated Sharpe</Term> —
          Bailey &amp; López de Prado&apos;s correction for exactly the selection bias a{" "}
          {q.gridCells}-cell grid search manufactures — on whatever looked best.
        </P>
        <Callout kind="Practitioner take">
          Trend filters are <Term>regime insurance, not alpha machines</Term>. Priced honestly, the
          50/200 bought you a third less drawdown on QQQ at the cost of lagging a bull market, and
          on BTC it kept the upside while skipping two 70%+ crashes — that is an insurance payout,
          not stock-picking genius. And note what actually moved the numbers in this tutorial: one{" "}
          <InlineCode>shift(1)</InlineCode> and a costs assumption. Lookahead and ignored costs
          kill more backtests than bad ideas ever will.
        </Callout>
      </Section>

      <References
        items={[
          "Brock, W., Lakonishok, J. & LeBaron, B. (1992). Simple Technical Trading Rules and the Stochastic Properties of Stock Returns. Journal of Finance 47(5).",
          "Moskowitz, T., Ooi, Y.H. & Pedersen, L.H. (2012). Time Series Momentum. Journal of Financial Economics 104(2).",
          "Bailey, D.H. & López de Prado, M. (2014). The Deflated Sharpe Ratio: Correcting for Selection Bias, Backtest Overfitting and Non-Normality. Journal of Portfolio Management 40(5).",
          <span key="vbt">vectorbt documentation — <InlineCode>Portfolio.from_signals</InlineCode>, the signal-based backtesting API used as the fill cross-check.</span>,
          <span key="nb">Companion notebook: <InlineCode>sma-crossover-backtest.ipynb</InlineCode> — reproduces every figure from raw data (deterministic, no simulation).</span>,
        ]}
      />
    </>
  );
}
