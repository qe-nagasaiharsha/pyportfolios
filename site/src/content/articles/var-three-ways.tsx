import { Section, Lead, P, InlineCode, Formula, Term, Callout, CodeBlock, DataTable, Figure, References, Pipeline } from "@/components/article/prose";
import { LineChart, Histogram } from "@/components/charts/DataCharts";
import d from "./data/var-three-ways";

/* T09 / topic card 09-16 — all figures below render REAL computed results
   (DAX Jan 2010 – Dec 2024, seed 42) baked in by quant/tutorials/t09_var.py.
   Includes the roadmap add-on: the same historical VaR via Polars and DuckDB. */

const pc = (v: number, nd = 2) => `${(v * 100).toFixed(nd)}%`;
/* same number, LaTeX-safe: a bare % opens a comment and swallows the rest */
const pcTex = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}\\%`;
const pfmt = (p: number) => (p < 1e-4 ? p.toExponential(1) : p.toFixed(4));

export default function VarThreeWays() {
  const v99 = d.var["99"];
  const v95 = d.var["95"];
  const bt = d.backtest;

  return (
    <>
      <Lead>
        Value-at-Risk is the number desks set daily loss limits with and regulators size capital
        against — and it has three standard recipes that disagree exactly when it matters. We
        compute all three on fifteen years of real DAX data, backtest every one of them out of
        sample, and then recompute the historical quantile with Polars and DuckDB to show what
        the modern data stack changes (answer: the scaling, never the number).
      </Lead>

      <Pipeline
        steps={[
          "Download DAX (^GDAXI) closes, 2010–2024 (yfinance)",
          "Historical simulation: empirical 1% and 5% quantiles",
          "Parametric: normal, then Student-t with fitted df",
          `Monte Carlo: ${d.params.mcDraws.toLocaleString()} seeded draws from the fitted t`,
          "Backtest all four with a rolling 250-day window + Kupiec POF",
          "Re-do the quantile in Polars expressions and DuckDB SQL",
        ]}
      />

      <Section id="definitions" n={1} title="The number, and the data">
        <P>
          <Term>VaR</Term> at level α is the loss you do not expect to exceed with probability α
          over one day — the (1−α)-quantile of returns, negated. <Term>CVaR</Term> (expected
          shortfall) is the average loss <Term>given</Term> a breach, and we report it alongside
          every method because it is the number you actually want for limits. Our laboratory is
          the DAX from {d.params.start} to {d.params.end}: {d.params.nObs.toLocaleString()} daily
          returns spanning the euro crisis, COVID and the 2022 energy shock. The worst day in the
          sample is {d.params.worstDay} at <InlineCode>{pc(d.params.worstRet)}</InlineCode> — keep
          that number in mind while the normal distribution tells you it is impossible.
        </P>
        <Callout kind="Definitions">
          VaRα = −q₁₋α(returns) &nbsp;&nbsp;·&nbsp;&nbsp; CVaRα = −E[ r | r ≤ q₁₋α ] — both quoted
          as positive percentages of portfolio value, one-day horizon throughout.
        </Callout>
      </Section>

      <Section id="historical" n={2} title="Historical simulation">
        <P>
          No model, no parameters: sort fifteen years of returns and read the empirical quantile.
          On the full sample the 99% VaR is <InlineCode>{pc(v99.histVar)}</InlineCode> and the 99%
          CVaR — the average of the worst {Math.round(d.params.nObs * 0.01)} days —{" "}
          is <InlineCode>{pc(v99.histCvar)}</InlineCode>. At 95% the pair
          is {pc(v95.histVar)} / {pc(v95.histCvar)}.
        </P>
        <CodeBlock
          file="historical.py"
          code={`import numpy as np

def hist_var_cvar(x, alpha=0.99):
    q = np.quantile(x, 1 - alpha)       # 1% quantile of returns
    return -q, -x[x <= q].mean()        # VaR, CVaR

hist_var_cvar(ret.values)               # (${v99.histVar.toFixed(6)}, ${v99.histCvar.toFixed(6)})`}
        />
        <P>
          The honesty of the method is also its weakness: it weights a sleepy 2017 day the same as
          March 2020, and it cannot produce a loss larger than anything already in the window.
        </P>
      </Section>

      <Section id="parametric" n={3} title="Parametric: normal, then Student-t">
        <P>
          The variance–covariance shortcut assumes a distribution and reads VaR off its formula.
          With a normal (<Formula>{`\\mu = ${pcTex(d.params.muDaily, 3)}`}</Formula>,{" "}
          <Formula>{`\\sigma = ${pcTex(d.params.sigmaDaily, 3)}`}</Formula> daily) the 99% VaR
          is <InlineCode>{pc(v99.normalVar)}</InlineCode> — roughly 60bp <Term>below</Term> the
          empirical quantile. Refit the same idea with a Student-t and MLE hands you
          df = <InlineCode>{d.params.tDf}</InlineCode>: violently non-Gaussian tails. The t's 99%
          VaR of <InlineCode>{pc(v99.tVar)}</InlineCode> lands almost exactly on the historical
          number, and its CVaR ({pc(v99.tCvar)}) is fatter still. (One desk convention worth
          knowing: at the one-day horizon many shops zero out μ entirely — at{" "}
          {pc(d.params.muDaily, 3)} a day it is noise against σ, and estimating it adds error
          without information. We keep it for completeness.)
        </P>
        <CodeBlock
          file="parametric.py"
          code={`from scipy import stats

mu, sd = ret.mean(), ret.std(ddof=1)
z = stats.norm.ppf(0.01)
var_normal = -(mu + sd * z)                     # ${pc(v99.normalVar)}

df, loc, scale = stats.t.fit(ret.values)        # df = ${d.params.tDf}
var_t = -(loc + scale * stats.t.ppf(0.01, df))  # ${pc(v99.tVar)}`}
        />
        <Figure
          caption={`${d.params.nObs.toLocaleString()} DAX daily returns — fitted Student-t overlay, 99% VaR markers`}
          legend={[
            { label: "fitted t", tone: "aqua" },
            { label: "returns", tone: "muted" },
          ]}
        >
          <Histogram
            ariaLabel="Histogram of DAX daily returns with a fitted Student-t curve; vertical VaR markers show the normal line well inside the historical and t lines, which nearly coincide."
            binEdges={d.histogram.edges as unknown as number[]}
            counts={d.histogram.counts as unknown as number[]}
            overlay={{ y: d.histogram.tOverlay as unknown as number[] }}
            xFmt={(v) => `${(v * 100).toFixed(0)}%`}
            vLines={[
              { v: d.histogram.var99.normal, color: "amber", label: `normal ${pc(v99.normalVar)}` },
              { v: d.histogram.var99.hist, color: "rust", dash: "2 3" },
              { v: d.histogram.var99.t, color: "teal", label: `t ≈ hist ${pc(v99.tVar)}` },
            ]}
          />
        </Figure>
        <P>
          Where the 60bp comes from is clearest in the left tail itself. Below, the three densities
          over the loss region from −7.5% to −1.5%: the normal (amber) runs out of probability
          almost immediately, while the fitted t tracks the kernel estimate of the real data the
          whole way down.
        </P>
        <Figure
          caption="Left-tail densities, −7.5% to −1.5% — normal vs Student-t vs empirical (KDE)"
          legend={[
            { label: "Student-t", tone: "aqua" },
            { label: "normal / empirical", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Left tail zoom: the normal density collapses to zero beyond minus three percent while the Student-t and the empirical kernel density remain close and clearly positive."
            series={[
              { y: d.tail.empirical as unknown as number[], color: "graphite", width: 1.2 },
              { y: d.tail.normal as unknown as number[], color: "amber", width: 1.6, dash: "5 4" },
              { y: d.tail.t as unknown as number[], color: "teal", width: 2 },
            ]}
            xLabels={d.tail.xLabels as unknown as [number, string][]}
            h={210}
          />
        </Figure>
      </Section>

      <Section id="monte-carlo" n={4} title="Monte Carlo">
        <P>
          Simulate {d.params.mcDraws.toLocaleString()} one-day scenarios from the fitted t
          (seed {d.params.seed}) and read the empirical tail of the simulation. On a single linear
          asset this is a correctness check more than a method — it must reproduce the analytic t
          to Monte-Carlo error, and it does: <InlineCode>{pc(v99.mcVar)}</InlineCode> vs the
          analytic {pc(v99.tVar)}. The machinery earns its keep the moment the book contains
          options, path dependence, or anything else with no closed-form quantile.
        </P>
        <CodeBlock
          file="monte_carlo.py"
          code={`rng = np.random.default_rng(${d.params.seed})
draws = loc + scale * rng.standard_t(df, ${d.params.mcDraws.toLocaleString("en-US").replace(/,/g, "_")})

var_mc  = -np.quantile(draws, 0.01)             # ${pc(v99.mcVar)}
cvar_mc = -draws[draws <= np.quantile(draws, 0.01)].mean()   # ${pc(v99.mcCvar)}`}
        />
      </Section>

      <Section id="backtest" n={5} title="The backtest decides">
        <P>
          A VaR is a falsifiable forecast: at 99%, tomorrow's loss should exceed it on about 1% of
          days. We re-estimate each method on a rolling {d.params.window}-day window (t and Monte
          Carlo refit every {d.params.refitEvery} days, desk-style), forecast one day ahead —{" "}
          {bt.n.toLocaleString()} out-of-sample forecasts per method — and test the breach count
          with Kupiec's proportion-of-failures likelihood ratio.
        </P>
        <Figure
          caption={`DAX daily returns vs the rolling 250d historical 99% VaR line, ${d.rolling.start} → ${d.rolling.end}`}
          legend={[
            { label: "−VaR₉₉ (hist, rolling)", tone: "aqua" },
            { label: "daily return", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Fifteen years of DAX daily returns as a thin noisy line with the rolling historical 99 percent VaR threshold beneath it; the threshold plunges after 2011, 2020 and 2022 as crash days enter the estimation window."
            series={[
              { y: d.rolling.ret as unknown as number[], color: "graphite", width: 0.6, opacity: 0.55 },
              { y: d.rolling.negVar as unknown as number[], color: "teal", width: 1.8 },
            ]}
            xLabels={d.rolling.xLabels as unknown as [number, string][]}
            yFmt={(v) => `${(v * 100).toFixed(0)}%`}
            h={240}
          />
        </Figure>
        <P>
          The tell-tale shape: the VaR line jumps <Term>after</Term> each crisis enters the window
          and relaxes as it leaves. That lag is why breaches cluster — the first breach of the
          backtest lands on {bt.histBreachFirst}, deep in the euro crisis, and the worst runs come
          in March 2020 before the window has learned what COVID is.
        </P>
        <DataTable
          head={["Method", "99% VaR", "99% CVaR", `Breaches (exp. ${bt.expected})`, "Kupiec LR", "p-value"]}
          rows={[
            ["Historical", pc(v99.histVar), pc(v99.histCvar), bt.hist.breaches, bt.hist.kupiecLR.toFixed(2), pfmt(bt.hist.kupiecP)],
            ["Parametric normal", pc(v99.normalVar), pc(v99.normalCvar), bt.normal.breaches, bt.normal.kupiecLR.toFixed(2), pfmt(bt.normal.kupiecP)],
            [`Parametric t (df ${d.params.tDf})`, pc(v99.tVar), pc(v99.tCvar), bt.t.breaches, bt.t.kupiecLR.toFixed(2), pfmt(bt.t.kupiecP)],
            ["Monte Carlo (t)", pc(v99.mcVar), pc(v99.mcCvar), bt.mc.breaches, bt.mc.kupiecLR.toFixed(2), pfmt(bt.mc.kupiecP)],
          ]}
        />
        <P>
          Read it honestly: <Term>every</Term> unconditional method breaches too often —{" "}
          {bt.normal.breaches} times for the normal against {bt.expected} expected, and even the
          t-based models manage {bt.t.breaches}. The t roughly halves the normal's excess, but
          Kupiec rejects all four at the 1% level. And Kupiec is the lenient examiner: the POF
          statistic only counts breaches — it is blind to their <Term>timing</Term>. One look at
          the chart shows them arriving in volatility clusters, which is exactly the pattern
          Christoffersen's (1998) independence test is built to punish and the pattern behind
          Basel's traffic-light backtest zones. The diagnosis is structural: a rolling
          unconditional window is late to every regime change by construction. That is not a
          reason to despair; it is the empirical case for conditional risk models — a GARCH
          filter rescales the tail to <Term>today's</Term> volatility, and filtered historical
          simulation is the desk standard for precisely this failure mode.
        </P>
      </Section>

      <Section id="polars-duckdb" n={6} title="The same quantile in Polars and DuckDB">
        <P>
          Historical VaR is, computationally, a quantile over a column — exactly the shape of
          problem the modern data-engineering stack eats. <Term>Polars</Term> evaluates a lazy
          expression pipeline over the CSV; <Term>DuckDB</Term> runs SQL straight against the
          file. Neither needs the data in pandas, and both stream — the identical two lines still
          work when "one index, fifteen years" becomes "every book in the firm, tick by tick".
        </P>
        <CodeBlock
          file="polars_var.py"
          code={`import polars as pl

q = (pl.scan_csv("dax_returns.csv")
       .select(pl.col("ret").quantile(0.01, interpolation="linear"))
       .collect()
       .item())                                  # ${d.engines.polars.toFixed(15)}`}
        />
        <CodeBlock
          file="duckdb_var.sql"
          code={`-- duckdb.sql(...) from Python, or the duckdb CLI directly
SELECT quantile_cont(ret, 0.01) AS q01
FROM read_csv('dax_returns.csv');                -- ${d.engines.duckdb.toFixed(15)}`}
        />
        <DataTable
          head={["Engine", "1% quantile of returns", "|diff| vs pandas"]}
          rows={[
            ["pandas / NumPy", d.engines.pandas.toFixed(15), "—"],
            ["Polars 1.43 (lazy)", d.engines.polars.toFixed(15), Math.abs(d.engines.polars - d.engines.pandas).toExponential(1)],
            ["DuckDB 1.5", d.engines.duckdb.toFixed(15), Math.abs(d.engines.duckdb - d.engines.pandas).toExponential(1)],
          ]}
        />
        <P>
          All three agree to the last printed digit (max absolute difference{" "}
          <InlineCode>{d.engines.maxAbsDiff.toExponential(1)}</InlineCode>, well inside the 1e−12
          tolerance the pipeline asserts). On {d.params.nObs.toLocaleString()} rows the timings are
          dominated by engine start-up — NumPy answers in a fraction of a millisecond, Polars in a
          few, DuckDB in tens — so at this size the engines buy you nothing but ergonomics. The
          crossover comes when the file stops fitting in memory: the pandas version dies, the
          Polars and DuckDB versions do not change by a character.
        </P>
        <Callout kind="Practitioner take">
          A Student-t beats a normal for VaR almost always — here it is the difference between{" "}
          {bt.normal.breaches} and {bt.t.breaches} breaches on the same data. Prefer CVaR over VaR
          for limits: it sees how bad the breach is, and at 99% it runs more than a full point above VaR on
          the DAX ({pc(v99.histVar)} → {pc(v99.histCvar)} historical, {pc(v99.tVar)} → {pc(v99.tCvar)} under the t). And never ship a VaR you have not backtested — every method in this article
          looked respectable until Kupiec counted its breaches.
        </Callout>
      </Section>

      <References
        items={[
          "Jorion, P. Value at Risk: The New Benchmark for Managing Financial Risk. McGraw-Hill.",
          "Kupiec, P. (1995). Techniques for Verifying the Accuracy of Risk Measurement Models. Journal of Derivatives, 3(2).",
          "Christoffersen, P. (1998). Evaluating Interval Forecasts. International Economic Review, 39(4), 841–862.",
          "McNeil, A., Frey, R. & Embrechts, P. Quantitative Risk Management: Concepts, Techniques and Tools. Princeton University Press.",
          <span key="nb">Companion notebook: <InlineCode>var-three-ways.ipynb</InlineCode> — reproduces every number from raw data (seed {String(d.params.seed)}), including the Polars and DuckDB cells.</span>,
        ]}
      />
    </>
  );
}
