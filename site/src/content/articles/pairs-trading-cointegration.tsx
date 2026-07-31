import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";
import { LineChart } from "@/components/charts/DataCharts";
import d from "./data/pairs-trading-cointegration";

/* Research article — all figures below render REAL computed results
   (EWA/EWC, 2010–2024, static Engle–Granger) baked in by quant/legacy/pairs.py. */

export default function PairsTradingCointegration() {
  return (
    <>
      <Lead>
        Two markets can wander for years yet never drift far <Term>apart</Term>. When a linear
        combination of two non-stationary prices is itself stationary, the pair is{" "}
        <Term>cointegrated</Term>, and the spread between them becomes tradeable: fade the
        deviations, collect the reversions. We run the full Engle–Granger recipe on the classic
        pair — iShares Australia (EWA) against Canada (EWC), {d.params.start} to {d.params.end} —
        and the real numbers turn out to be a better warning than any hypothetical: the backtest is
        a minefield of look-ahead and multiple testing.
      </Lead>

      <Section id="idea" n={1} title="Mean reversion of a spread">
        <P>
          Correlation is about co-movement of returns; <Term>cointegration</Term> is about a stable
          long-run relationship between price <Term>levels</Term>. Two prices can be highly
          correlated yet diverge forever, or barely correlated day-to-day yet tethered by a spread
          that always snaps back. Pairs trading wants the second thing — a spread with a gravitational
          centre. EWA and EWC are the textbook candidate: two commodity-driven developed markets
          pushed around by the same global cycle.
        </P>
      </Section>

      <Section id="cointegration" n={2} title="Testing for cointegration">
        <P>
          The Engle–Granger recipe: regress one log-price on the other to get a hedge ratio, then
          test the regression residual for stationarity with an Augmented Dickey–Fuller test. A small
          p-value is evidence the spread is mean-reverting rather than a random walk.
        </P>
        <CodeBlock
          file="cointegration.py"
          code={`import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller, coint

ly, lx = np.log(px["EWC"]), np.log(px["EWA"])
ols = sm.OLS(ly, sm.add_constant(lx)).fit()
alpha, beta = ols.params.iloc[0], ols.params.iloc[1]
spread = ly - beta * lx - alpha           # the Engle-Granger residual

stat, pval, *_ = adfuller(spread)         # ADF on the residual
eg_stat, eg_p, _ = coint(ly, lx)          # same recipe, CORRECT critical values
print(f"beta {beta:.3f}   ADF p {pval:.4f}   EG p {eg_p:.4f}")`}
        />
        <DataTable
          head={["Series", "ADF stat", "p-value", "Reading"]}
          rows={[
            ["log EWA", d.adf.logEWA.stat.toFixed(2), d.adf.logEWA.p.toFixed(3), "unit root — I(1)"],
            ["log EWC", d.adf.logEWC.stat.toFixed(2), d.adf.logEWC.p.toFixed(3), "unit root — I(1)"],
            ["EG residual (plain ADF)", d.adf.residual.stat.toFixed(2), d.adf.residual.p.toFixed(3), "stationary at 5%"],
            ["EG residual (coint test)", d.params.egStat.toFixed(2), d.params.egP.toFixed(3), "not rejected at 5%"],
          ]}
        />
        <P>
          Read the last two rows carefully — they are the first trap of the article. Plain ADF on
          the residual says stationary (<InlineCode>p = {d.adf.residual.p.toFixed(3)}</InlineCode>);
          the proper Engle–Granger test on the same residual says{" "}
          <InlineCode>p = {d.params.egP.toFixed(3)}</InlineCode>. The difference is not a bug: the
          hedge ratio was <Term>estimated to make the residual look as stationary as possible</Term>,
          so the ADF critical values are too generous. Use <InlineCode>coint</InlineCode>, and accept
          that this celebrated pair is only borderline cointegrated over these fifteen years.
        </P>
      </Section>

      <Section id="spread" n={3} title="The hedge ratio & spread">
        <P>
          The hedge ratio <InlineCode>β = {d.params.beta.toFixed(3)}</InlineCode> says how many units
          of EWA to hold against one unit of EWC, so the combined position is insulated from the
          common move and exposed only to the spread. An OU regression of daily spread changes on
          the lagged level puts the <Term>half-life</Term> of a deviation at{" "}
          <InlineCode>{d.params.halfLifeDays.toFixed(0)} trading days</InlineCode> — this reverts in
          months, not days, which sets both the holding period and the patience required.
          Standardise the spread into a rolling <Term>z-score</Term>{" "}so &ldquo;far from fair&rdquo;
          has a consistent meaning over time.
        </P>
        <CodeBlock
          file="zscore.py"
          code={`window = ${d.params.zWin}
mu = spread.rolling(window).mean()
sd = spread.rolling(window).std()
z = (spread - mu) / sd

# OU half-life: dS = theta * S + eps  ->  HL = -ln(2) / theta
ds, lag = spread.diff().dropna(), spread.shift(1).dropna()
theta = sm.OLS(ds, sm.add_constant(lag.loc[ds.index])).fit().params.iloc[1]
print(f"half-life {-np.log(2) / theta:.0f} days")`}
        />
        <Figure
          caption={`The Engle–Granger residual spread, ${d.params.start} → ${d.params.end}`}
          legend={[{ label: "spread (log units)", tone: "aqua" }, { label: "fair value", tone: "muted" }]}
        >
          <LineChart
            ariaLabel="The EWA EWC residual spread oscillating around zero with multi-month excursions of up to about ten percent."
            series={[{ y: d.spread.y as unknown as number[], color: "teal", width: 1.4 }]}
            xLabels={d.spread.xLabels as unknown as [number, string][]}
            hLines={[{ v: 0, color: "graphite", dash: "3 3" }]}
          />
        </Figure>
      </Section>

      <Section id="signal" n={4} title="Z-score entry & exit">
        <P>
          Trade the band: when the spread is cheap (<InlineCode>z &lt; −2</InlineCode>) go long it —
          long EWC, short <InlineCode>β</InlineCode> EWA; when it is rich
          (<InlineCode>z &gt; +2</InlineCode>) do the reverse; flatten as it reverts through{" "}
          <InlineCode>|z| &lt; 0.5</InlineCode>. The hysteresis between entry and exit keeps you from
          churning on noise around the threshold.
        </P>
        <CodeBlock
          file="signal.py"
          code={`entry, exit_ = ${d.params.entryZ.toFixed(1)}, ${d.params.exitZ}
state = np.where(z < -entry, 1, np.where(z > entry, -1, np.nan))
pos = pd.Series(state, index=z.index)
pos[z.abs() < exit_] = 0
pos = pos.ffill().fillna(0)               # hold the position until it reverts`}
        />
        <Figure
          caption="The real spread z-score with ±2σ entry bands — every crossing is a candidate trade"
          legend={[{ label: "entry band", tone: "aqua" }, { label: "z-score", tone: "muted" }]}
        >
          <LineChart
            ariaLabel="The rolling z-score of the EWA EWC spread oscillating around zero and piercing the plus and minus two bands a handful of times over fifteen years."
            series={[{ y: d.z.y as unknown as number[], color: "graphite", width: 1.2 }]}
            xLabels={d.spread.xLabels as unknown as [number, string][]}
            hLines={[
              { v: 2, color: "teal", label: "+2σ" },
              { v: -2, color: "teal", label: "−2σ" },
            ]}
            h={240}
          />
        </Figure>
      </Section>

      <Section id="backtest" n={5} title="Backtest with costs">
        <P>
          The spread P&amp;L is the position held into the next move, minus a cost on every change in
          position. Pairs trading is cheaper to run than momentum — this book trades only{" "}
          {d.stats.net.tradesYr.toFixed(1)} times a year — but the per-trade edge is thin, so costs
          still decide whether it lives.
        </P>
        <CodeBlock
          file="backtest.py"
          code={`pnl = pos.shift(1) * spread.diff()        # earn the spread move, lagged once
turnover = pos.diff().abs()
net = pnl - turnover.shift(1) * 0.0005     # 5 bps per leg change

sharpe = np.sqrt(252) * net.mean() / net.std()
print(f"net Sharpe {sharpe:.2f}")`}
        />
        <DataTable
          head={["Stage", "Sharpe", "Trades / yr", "Note"]}
          rows={[
            ["Gross", d.stats.gross.sharpe.toFixed(2), d.stats.gross.tradesYr.toFixed(1), "in-sample, full-period β"],
            ["Net of costs", d.stats.net.sharpe.toFixed(2), d.stats.net.tradesYr.toFixed(1), "5 bps per leg change"],
            ["Rolling β, out-of-sample", d.stats.oos.sharpe.toFixed(2), d.stats.oos.tradesYr.toFixed(1), "252d window, lagged one day"],
          ]}
        />
        <Figure
          caption="Cumulative spread P&L — full-period β (gross and net) vs the rolling out-of-sample β"
          legend={[
            { label: "net / gross, full-period β", tone: "aqua" },
            { label: "rolling β OOS", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Three cumulative profit curves drifting upward over fifteen years with long flat stretches; the rolling beta curve ends highest."
            series={[
              { y: d.equity.gross as unknown as number[], color: "teal", width: 1.3, dash: "4 3", opacity: 0.7 },
              { y: d.equity.net as unknown as number[], color: "teal", width: 1.8 },
              { y: d.equity.oos as unknown as number[], color: "amber", width: 1.6 },
            ]}
            xLabels={d.equity.xLabels as unknown as [number, string][]}
            yFmt={(v) => v.toFixed(2)}
          />
        </Figure>
      </Section>

      <Section id="caveats" n={6} title="Caveats & decay">
        <P>
          The net Sharpe of {d.stats.net.sharpe.toFixed(2)} is honest but modest — roughly{" "}
          {d.stats.net.tradesYr.toFixed(0)} trades a year harvesting a spread that takes{" "}
          {d.params.halfLifeDays.toFixed(0)} days to half-revert. Estimating{" "}
          <InlineCode>β</InlineCode> on the <Term>whole</Term> sample peeks at the future and must be
          replaced with a rolling, lagged estimate before you believe anything; here the rolling
          rerun happened to hold up ({d.stats.oos.sharpe.toFixed(2)}{" "}net) because this pair&rsquo;s β
          barely moved — a luxury you cannot assume. The deeper caveat is back in section 2: by the
          proper Engle–Granger test this famous pair is not even cointegrated at the 5% level over
          the full sample. And if you scanned hundreds of pairs and kept the one that backtested
          best, you did not find an edge — you found the luckiest series, and an in-sample Sharpe
          means almost nothing without a multiple-testing correction.
        </P>
        <Callout kind="Before you trade a pair">
          Re-estimate the hedge ratio out-of-sample; test with <InlineCode>coint</InlineCode>, not
          plain ADF on a fitted residual; deflate the Sharpe for how many pairs you searched; check
          the cointegration holds in a hold-out window — relationships break, often right after they
          get crowded. Every number above is computed from the real EWA/EWC series, and the
          companion notebook reproduces the full recipe. (The dynamic, Kalman-filtered hedge ratio
          for this same pair is its own article.)
        </Callout>
      </Section>

      <References
        items={[
          "Engle, R. & Granger, C. (1987). Co-integration and Error Correction. Econometrica, 55(2).",
          "Gatev, E., Goetzmann, W. & Rouwenhorst, K. (2006). Pairs Trading: Performance of a Relative-Value Arbitrage Rule. Review of Financial Studies, 19(3).",
          "Bailey, D. & López de Prado, M. (2014). The Deflated Sharpe Ratio. Journal of Portfolio Management, 40(5).",
        ]}
      />
    </>
  );
}
