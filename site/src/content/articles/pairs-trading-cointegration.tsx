import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";

export default function PairsTradingCointegration() {
  return (
    <>
      <Lead>
        Two stocks can wander for years yet never drift far <Term>apart</Term>. When a linear
        combination of two non-stationary prices is itself stationary, the pair is
        <Term>cointegrated</Term>, and the spread between them becomes tradeable: fade the
        deviations, collect the reversions. The idea is elegant — and the backtest is a minefield of
        look-ahead and multiple testing.
      </Lead>

      <Section id="idea" n={1} title="Mean reversion of a spread">
        <P>
          Correlation is about co-movement of returns; <Term>cointegration</Term> is about a stable
          long-run relationship between price <Term>levels</Term>. Two prices can be highly
          correlated yet diverge forever, or barely correlated day-to-day yet tethered by a spread
          that always snaps back. Pairs trading wants the second thing — a spread with a gravitational
          centre.
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
from statsmodels.tsa.stattools import adfuller

def hedge_ratio(y, x):
    model = sm.OLS(y, sm.add_constant(x)).fit()
    return model.params.iloc[1]           # slope = units of x per unit of y

ly, lx = np.log(A), np.log(B)
beta = hedge_ratio(ly, lx)
spread = ly - beta * lx

pval = adfuller(spread)[1]
print(f"hedge ratio {beta:.2f}   ADF p-value {pval:.3f}")   # p < 0.05 -> cointegrated`}
        />
      </Section>

      <Section id="spread" n={3} title="The hedge ratio & spread">
        <P>
          The hedge ratio <InlineCode>β</InlineCode> says how many units of the second leg to hold
          against one unit of the first, so the combined position is insulated from the common move
          and exposed only to the spread. Standardise the spread into a rolling
          <Term>z-score</Term> so “far from fair” has a consistent meaning over time.
        </P>
        <CodeBlock
          file="zscore.py"
          code={`window = 60
mu = spread.rolling(window).mean()
sd = spread.rolling(window).std()
z = (spread - mu) / sd`}
        />
      </Section>

      <Section id="signal" n={4} title="Z-score entry & exit">
        <P>
          Trade the band: when the spread is cheap (<InlineCode>z &lt; −2</InlineCode>) go long it —
          long the first leg, short <InlineCode>β</InlineCode> of the second; when it is rich
          (<InlineCode>z &gt; +2</InlineCode>) do the reverse; flatten as it reverts through
          <InlineCode>|z| &lt; 0.5</InlineCode>. The hysteresis between entry and exit keeps you from
          churning on noise around the threshold.
        </P>
        <CodeBlock
          file="signal.py"
          code={`entry, exit_ = 2.0, 0.5
state = np.where(z < -entry, 1, np.where(z > entry, -1, np.nan))
pos = pd.Series(state, index=z.index)
pos[z.abs() < exit_] = 0
pos = pos.ffill().fillna(0)               # hold the position until it reverts`}
        />
        <Figure caption="The spread z-score with ±2σ entry bands — every crossing is a candidate trade" legend={[{ label: "Entry band", tone: "aqua" }, { label: "z-score", tone: "muted" }]}>
          <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label="A mean-reverting z-score oscillating around zero, occasionally piercing the plus and minus two sigma bands.">
            <line x1="0" y1="100" x2="600" y2="100" stroke="#4a4a42" strokeOpacity="0.4" strokeWidth="1" />
            <line x1="0" y1="45" x2="600" y2="45" stroke="#0a8a8a" strokeWidth="1.2" strokeDasharray="5 4" />
            <line x1="0" y1="155" x2="600" y2="155" stroke="#0a8a8a" strokeWidth="1.2" strokeDasharray="5 4" />
            <path className="draw-on-view" d="M0,96 C50,60 80,36 120,52 C170,72 200,150 250,158 C300,166 330,96 380,84 C430,72 460,40 500,58 C540,74 570,104 600,98" fill="none" stroke="#4a4a42" strokeWidth="1.8" strokeOpacity="0.75" />
            <text x="6" y="40" className="t-mono" fontSize="11" fill="#0a8a8a">+2σ</text>
            <text x="6" y="170" className="t-mono" fontSize="11" fill="#0a8a8a">−2σ</text>
          </svg>
        </Figure>
      </Section>

      <Section id="backtest" n={5} title="Backtest with costs">
        <P>
          The spread P&L is the position held into the next move, minus a cost on every change in
          position. Pairs trading is cheaper to run than momentum — it only trades on crossings — but
          the per-trade edge is thin, so costs still decide whether it lives.
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
            ["Gross", "1.34", "23", "in-sample, full-period β"],
            ["Net of costs", "1.02", "23", "5 bps per leg"],
            ["Rolling β, out-of-sample", "0.61", "27", "the honest number"],
          ]}
        />
      </Section>

      <Section id="caveats" n={6} title="Caveats & decay">
        <P>
          The honest Sharpe is the bottom row, and it is far below the top — for reasons worth
          internalising. Estimating <InlineCode>β</InlineCode> on the <Term>whole</Term> sample peeks
          at the future; it must be rolling and out-of-sample. Worse, if you scanned hundreds of
          pairs and kept the one that backtested best, you did not find an edge — you found the
          luckiest series, and an in-sample Sharpe means almost nothing without a multiple-testing
          correction.
        </P>
        <Callout kind="Before you trade a pair">
          Re-estimate the hedge ratio out-of-sample; deflate the Sharpe for how many pairs you
          searched; check the cointegration holds in a hold-out window — relationships break, often
          right after they get crowded. The strategy is real; the typical backtest of it is not.
          Numbers above are illustrative and reproduced in the notebook.
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
