import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References, Pipeline } from "@/components/article/prose";
import { ScatterChart, BarChart, LineChart } from "@/components/charts/DataCharts";
import d from "./data/mvo-efficient-frontier";

/* T05 / topic card 05-16 — all figures below render REAL computed results
   (SPY·TLT·GLD·VNQ·VEA·VWO, Jan 2015 – Dec 2024, seeded random cloud)
   baked in by quant/tutorials/t05_mvo.py. */

const pc = (v: number, nd = 1) => `${(v * 100).toFixed(nd)}%`;

export default function MvoEfficientFrontier() {
  const f = d.frontier;
  const assetMarks = f.assets.map((a) => ({
    x: a.vol as number, y: a.ret as number, label: a.t, color: "graphite" as const,
  }));

  return (
    <>
      <Lead>
        Every allocation decision is a trade between return you want and risk you can stomach.
        Markowitz&rsquo;s 1952 answer — score portfolios, not assets, and keep only the ones no other
        portfolio dominates — earned a Nobel and still runs the world&rsquo;s asset allocation. We
        build it on six real ETFs with PyPortfolioOpt: trace the efficient frontier, solve the
        max-Sharpe and minimum-volatility portfolios, and then look honestly at the optimiser&rsquo;s
        oldest vice — it concentrates into whatever the sample flattered.
      </Lead>

      <Pipeline
        steps={[
          "Download 6 asset-class ETFs, 2015–2024 (yfinance)",
          "Estimate μ (historical CAGR) and Σ (sample + Ledoit–Wolf)",
          `Scatter ${d.params.nRandom.toLocaleString()} random long-only portfolios`,
          "Trace the frontier: minimise vol for each target return",
          "Solve max-Sharpe & min-vol; draw the capital market line",
          "Diagnose the concentration problem — the road to T06",
        ]}
      />

      <Section id="idea" n={1} title="The Markowitz insight">
        <P>
          Before 1952, security analysis judged each asset on its own merits. Markowitz&rsquo;s move was
          to make the <Term>portfolio</Term> the unit of analysis: an asset&rsquo;s worth is what it does
          to portfolio expected return <InlineCode>w&apos;μ</InlineCode> and portfolio variance{" "}
          <InlineCode>w&apos;Σw</InlineCode>. Because variance prices in <Term>covariance</Term>, an
          asset with a mediocre return can still earn its place by zigging when the rest of the book
          zags — diversification is the one free lunch the math actually delivers. A portfolio is{" "}
          <Term>efficient</Term> if no other portfolio offers more return at the same risk; the set
          of all such portfolios is the efficient frontier.
        </P>
        <Callout kind="Why practitioners care">
          Mean–variance optimisation is the default engine of institutional asset allocation —
          target-date glidepaths, robo-advisors, and policy-portfolio reviews all run some flavour
          of it. Knowing what the optimiser does with noisy inputs (and why every serious shop
          constrains, shrinks, or Bayesianises it) is the difference between using MVO and being
          used by it.
        </Callout>
      </Section>

      <Section id="inputs" n={2} title="Two inputs: μ and Σ">
        <P>
          The sample is {d.params.start} to {d.params.end} — {d.params.n_obs.toLocaleString()}{" "}
          trading days across six asset-class ETFs: US equities (SPY), long Treasuries (TLT), gold
          (GLD), REITs (VNQ), developed international (VEA), and emerging markets (VWO). From it we
          estimate the two objects MVO consumes: an expected-return vector and a covariance matrix.
        </P>
        <CodeBlock
          file="inputs.py"
          code={`from pypfopt import expected_returns, risk_models
from pypfopt.risk_models import CovarianceShrinkage

mu = expected_returns.mean_historical_return(px)   # annualised CAGR
S  = risk_models.sample_cov(px)                    # annualised covariance

S_lw = CovarianceShrinkage(px).ledoit_wolf()       # shrunk Σ, for later`}
        />
        <P>
          Historical means put SPY at <InlineCode>{pc(f.assets[0].ret)}</InlineCode> a year and TLT
          at <InlineCode>{pc(f.assets[1].ret)}</InlineCode> — a decade of rising rates left long
          Treasuries with a negative CAGR. Hold that thought: the optimiser will read these noisy
          point estimates as truth. The Ledoit–Wolf shrinkage intensity comes out at just{" "}
          <InlineCode>δ = {pc(d.weights.lwDelta)}</InlineCode> here — with ten years of daily data
          on only six assets, Σ is already well estimated. The fragile input is μ.
        </P>
      </Section>

      <Section id="frontier" n={3} title="Tracing the frontier">
        <P>
          First, the terrain: {d.params.nRandom.toLocaleString()} random long-only portfolios
          (Dirichlet-distributed weights, seed {d.params.seed}) show everything attainable. The
          frontier is that cloud&rsquo;s upper-left edge, traced by solving a convex program per target
          return — minimise <InlineCode>w&apos;Σw</InlineCode> subject to{" "}
          <InlineCode>w&apos;μ = target</InlineCode>, weights non-negative and summing to one. Add a
          risk-free asset at {pc(d.params.rf, 0)} and the whole curve collapses to one straight
          line — the <Term>capital market line</Term> — tangent at a single portfolio.
        </P>
        <CodeBlock
          file="frontier.py"
          code={`from pypfopt import EfficientFrontier

targets = np.linspace(ret_minvol, mu.max() * 0.9999, 40)
frontier = []
for t in targets:
    ef = EfficientFrontier(mu, S)          # fresh solver per target
    ef.efficient_return(target_return=t)
    ret, vol, _ = ef.portfolio_performance(risk_free_rate=0.03)
    frontier.append((vol, ret))`}
        />
        <Figure
          caption="Risk–return plane: 2,000 random portfolios, the efficient frontier, and the CML"
          legend={[
            { label: "frontier", tone: "aqua" },
            { label: "CML", tone: "muted" },
            { label: "random portfolios", tone: "muted" },
          ]}
        >
          <ScatterChart
            ariaLabel="Scatter plot of random portfolios with the efficient frontier along the upper-left edge, a straight capital market line tangent at the max-Sharpe portfolio, and the six individual ETFs marked below the frontier."
            points={[{ xy: f.cloud as unknown as [number, number][], opacity: 0.3, r: 1.8 }]}
            lines={[
              { xy: f.line as unknown as [number, number][], color: "teal", width: 2.4 },
              { xy: f.cml as unknown as [number, number][], color: "graphite", dash: "5 4", width: 1.4 },
            ]}
            marks={[
              { x: f.maxSharpe.vol, y: f.maxSharpe.ret, label: "max Sharpe", color: "amber" },
              { x: f.minVol.vol, y: f.minVol.ret, label: "min vol", color: "rust" },
              ...assetMarks,
            ]}
            h={300}
            xFmt={(v) => pc(v, 0)}
            yFmt={(v) => pc(v, 0)}
          />
        </Figure>
        <P>
          Read the geometry: every single ETF plots <Term>below</Term> the frontier — even SPY, the
          best performer of the decade, is dominated by mixtures. And the min-vol portfolio, at{" "}
          <InlineCode>{pc(f.minVol.vol)}</InlineCode> volatility, is calmer than any individual
          asset (the calmest, GLD, runs {pc(f.assets[2].vol)}). That gap is diversification doing
          exactly what Markowitz promised.
        </P>
      </Section>

      <Section id="portfolios" n={4} title="Max-Sharpe & min-vol, solved">
        <P>
          Two portfolios on the frontier matter most in practice. The <Term>tangency</Term>{" "}
          (max-Sharpe) portfolio maximises excess return per unit of risk — with a risk-free asset,
          theory says it is the only risky portfolio anyone needs. The <Term>minimum-volatility</Term>{" "}
          portfolio anchors the frontier&rsquo;s left end and needs no return forecast at all to locate.
        </P>
        <CodeBlock
          file="optimal.py"
          code={`ef = EfficientFrontier(mu, S)
ef.max_sharpe(risk_free_rate=0.03)
w_ms = ef.clean_weights()
ef.portfolio_performance(risk_free_rate=0.03)
# ret ${pc(f.maxSharpe.ret)} · vol ${pc(f.maxSharpe.vol)} · Sharpe ${f.maxSharpe.sharpe.toFixed(2)}

ef = EfficientFrontier(mu, S)
ef.min_volatility()
w_mv = ef.clean_weights()
# ret ${pc(f.minVol.ret)} · vol ${pc(f.minVol.vol)} · Sharpe ${f.minVol.sharpe.toFixed(2)}`}
        />
        <Figure
          caption="Optimal weights — max-Sharpe (teal) vs min-vol (graphite)"
          legend={[
            { label: "max Sharpe", tone: "aqua" },
            { label: "min vol", tone: "muted" },
          ]}
        >
          <BarChart
            ariaLabel="Grouped bar chart of portfolio weights: max-Sharpe holds only SPY at 58 percent and GLD at 42 percent, while min-vol spreads across SPY, TLT, GLD and VEA."
            labels={d.weights.labels as unknown as string[]}
            groups={[
              { values: d.weights.maxSharpe as unknown as number[], color: "teal" },
              { values: d.weights.minVol as unknown as number[], color: "graphite" },
            ]}
            yFmt={(v) => pc(v, 0)}
          />
        </Figure>
        <DataTable
          head={["Asset / portfolio", "Ann. return", "Ann. vol", "Sharpe (rf 3%)"]}
          rows={[
            ...d.assetsTable.map((a) => [a.t, pc(a.ret), pc(a.vol), a.sharpe.toFixed(2)]),
            ["Max-Sharpe portfolio", pc(f.maxSharpe.ret), pc(f.maxSharpe.vol), f.maxSharpe.sharpe.toFixed(2)],
            ["Min-vol portfolio", pc(f.minVol.ret), pc(f.minVol.vol), f.minVol.sharpe.toFixed(2)],
          ]}
        />
        <P>
          The Sharpe arithmetic works: {f.maxSharpe.sharpe.toFixed(2)} for the tangency portfolio
          against {d.assetsTable[0].sharpe.toFixed(2)} for SPY alone. But look at <Term>how</Term> it
          got there — the optimiser holds exactly {d.weights.nHeldMS} of the six assets
          ({pc(d.weights.maxSharpe[0])} SPY, {pc(d.weights.maxSharpe[2])} GLD) and zeroes out
          everything else. An effective position count of {d.weights.nEffMS} is not what most people
          picture when they hear &ldquo;diversified optimal portfolio&rdquo;.
        </P>
      </Section>

      <Section id="performance" n={5} title="Growth of $100 — with the fine print">
        <P>
          Feeding the max-Sharpe weights back through the same decade produces the equity curve
          below. Be clear about what this is: an <Term>in-sample</Term> exercise. The weights were
          fitted on exactly this data, so the comparison flatters the optimiser by construction — a
          proper evaluation would fit on one window and trade the next. We plot it because the
          fine print is still instructive.
        </P>
        <Figure
          caption="Growth of $100, 2015–2024 — max-Sharpe weights are fitted on this same sample"
          legend={[
            { label: "max Sharpe (in-sample)", tone: "aqua" },
            { label: "SPY / equal weight", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Line chart of cumulative growth: SPY finishes highest near 340, the in-sample max-Sharpe portfolio near 296 with visibly shallower drawdowns, equal weight lowest near 188."
            series={[
              { y: d.growth.spy as unknown as number[], color: "graphite", width: 1.4 },
              { y: d.growth.equalWeight as unknown as number[], color: "amber", width: 1.4, dash: "4 3" },
              { y: d.growth.maxSharpe as unknown as number[], color: "teal", width: 2.2 },
            ]}
            xLabels={d.growth.xLabels as unknown as [number, string][]}
            h={240}
          />
        </Figure>
        <P>
          Even graded on its own homework, max-Sharpe (${d.growth.final.maxSharpe}) does not out-grow
          SPY (${d.growth.final.spy}) — it wasn&rsquo;t asked to. It maximised <Term>risk-adjusted</Term>{" "}
          return, riding a {pc(f.maxSharpe.vol)}-vol book against SPY&rsquo;s {pc(f.assets[0].vol)}, with
          visibly shallower drawdowns in 2020 and 2022. Both beat equal weight
          (${d.growth.final.equalWeight}), which spent the decade dragging TLT and VWO along.
        </P>
      </Section>

      <Section id="fragility" n={6} title="The concentration problem">
        <P>
          Why did the optimiser collapse six assets into two? Because it treats μ̂ as exact.
          Expected-return estimates carry standard errors of several percent a year — often wider
          than the spread between the assets being ranked — and mean–variance responds to any edge,
          real or noise, by leveraging into it. Michaud&rsquo;s name for this stuck:{" "}
          <Term>error maximisation</Term>. The portfolios that look best in-sample are precisely the
          ones that loaded hardest on estimation error.
        </P>
        <CodeBlock
          file="fragility.py"
          code={`# swap the sample covariance for Ledoit-Wolf: weights barely move
ef = EfficientFrontier(mu, S_lw)
ef.max_sharpe(risk_free_rate=0.03)
# SPY ${pc(d.weights.maxSharpeLW[0])} · GLD ${pc(d.weights.maxSharpeLW[2])}  (was ${pc(d.weights.maxSharpe[0])} / ${pc(d.weights.maxSharpe[2])})
# -> the concentration is coming from mu, not Sigma`}
        />
        <Callout kind="Practitioner take">
          Diagnose before you medicate. Swapping in the Ledoit–Wolf covariance moved the max-Sharpe
          weights by a fraction of a percent — with this much daily data on six assets, Σ was never
          the problem. The instability lives in μ, which is why nobody runs unconstrained MVO on raw
          historical means: desks bound weights, shrink or resample inputs, or drop μ entirely
          (min-vol and risk-parity books). The canonical repair is Black–Litterman — start from
          equilibrium returns, then blend in views with explicit uncertainty — which is exactly
          where the next tutorial (T06) picks up.
        </Callout>
      </Section>

      <References
        items={[
          "Markowitz, H. (1952). Portfolio Selection. The Journal of Finance, 7(1), 77–91.",
          "Merton, R. C. (1972). An Analytic Derivation of the Efficient Portfolio Frontier. Journal of Financial and Quantitative Analysis, 7(4), 1851–1872.",
          "Martin, R. A. (2021). PyPortfolioOpt: portfolio optimization in Python. Journal of Open Source Software, 6(61), 3066 — docs at pyportfolioopt.readthedocs.io.",
          <span key="nb">Companion notebook: <InlineCode>mvo-efficient-frontier.ipynb</InlineCode> — reproduces every figure from raw data (seed {String(d.params.seed)}).</span>,
        ]}
      />
    </>
  );
}
