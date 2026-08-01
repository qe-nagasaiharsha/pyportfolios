import { Section, Lead, P, InlineCode, Formula, Term, Callout, CodeBlock, DataTable, Figure, References, Pipeline } from "@/components/article/prose";
import { LineChart, Histogram } from "@/components/charts/DataCharts";
import d from "./data/gbm-simulating-price-paths";

/* T01 / topic card 01-16 — all figures below render REAL computed results
   (SPY Jan 2018 – Dec 2024, seeded simulation) baked in by quant/tutorials/t01_gbm.py. */

const pc = (v: number) => `${(v * 100).toFixed(1)}%`;
/* same number, LaTeX-safe: a bare % opens a comment and swallows the rest */
const pcTex = (v: number) => `${(v * 100).toFixed(1)}\\%`;

export default function GbmSimulatingPricePaths() {
  const cone = d.cone;
  const coneSeries = [
    ...cone.samples.map((y) => ({ y: y as unknown as number[], color: "graphite" as const, width: 0.7, opacity: 0.3 })),
    { y: cone.p5 as unknown as number[], color: "rust" as const, width: 1.3, dash: "4 3" },
    { y: cone.p25 as unknown as number[], color: "slate" as const, width: 1.2 },
    { y: cone.p50 as unknown as number[], color: "teal" as const, width: 2.2 },
    { y: cone.p75 as unknown as number[], color: "slate" as const, width: 1.2 },
    { y: cone.p95 as unknown as number[], color: "amber" as const, width: 1.3, dash: "4 3" },
  ];

  return (
    <>
      <Lead>
        Geometric Brownian Motion is the stochastic engine underneath most of quantitative
        finance — Black–Scholes assumes it, Monte-Carlo pricers simulate it, and every
        wealth-projection cone a robo-advisor has ever shown you is one. We estimate its two
        parameters from seven years of real SPY data, simulate {d.params.nPaths.toLocaleString()}
        {" "}paths a year forward, and then do the honest thing: test where the model breaks.
      </Lead>

      <Pipeline
        steps={[
          "Download SPY adjusted closes, 2018–2024 (yfinance)",
          "Estimate μ and σ from daily log returns",
          "Simulate 5,000 exact-discretisation GBM paths, 1y forward",
          "Read the scenario cone & terminal distribution",
          "Jarque–Bera the residual assumption — and find the fat tails",
        ]}
      />

      <Section id="model" n={1} title="The model, in one equation">
        <P>
          GBM says the instantaneous return of a price <Formula>S</Formula> is a constant
          drift plus Brownian noise scaled by a constant volatility:
          {" "}<Formula>{String.raw`dS = \mu S\,dt + \sigma S\,dW`}</Formula>. Its defining convenience is that
          {" "}<Term>log returns are i.i.d. normal</Term> — which hands us both the estimator
          (sample mean and standard deviation of log returns) and an exact simulation scheme with
          zero discretisation error, no matter how large the step.
        </P>
        <Callout kind="Why practitioners care">
          GBM is the engine inside Monte-Carlo pricing and risk systems, and the generator of
          every scenario cone in wealth management. Knowing exactly what it assumes — and what
          that costs you in the tails — is table stakes for reading any simulation output.
        </Callout>
      </Section>

      <Section id="data" n={2} title="Seven years of SPY">
        <P>
          The sample runs {d.params.start} to {d.params.end} — {d.params.n_obs.toLocaleString()}
          {" "}trading days containing a melt-up, the COVID crash, the 2022 bear market and two
          recoveries. Rich enough to be interesting; recent enough to be the regime you actually
          trade in.
        </P>
        <Figure
          caption={`SPY adjusted close, ${d.params.start} → ${d.params.end} — the estimation window`}
          legend={[{ label: "SPY", tone: "aqua" }]}
        >
          <LineChart
            ariaLabel="SPY price 2018 to 2024, rising from around 240 to 576 with drawdowns in 2020 and 2022."
            series={[{ y: d.history.y as unknown as number[], area: true }]}
            xLabels={d.history.xLabels as unknown as [number, string][]}
          />
        </Figure>
        <CodeBlock
          file="estimate.py"
          code={`import numpy as np, yfinance as yf

px = yf.download("SPY", start="2018-01-01", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"].squeeze()
logret = np.log(px / px.shift(1)).dropna()

mu    = logret.mean() * 252            # ${pc(d.params.muAnnual)} / year
sigma = logret.std(ddof=1) * np.sqrt(252)   # ${pc(d.params.sigmaAnnual)} / year`}
        />
        <P>
          Two numbers fully specify the model: drift <Formula>{`\\mu = ${pcTex(d.params.muAnnual)}`}</Formula>{" "}
          and volatility <Formula>{`\\sigma = ${pcTex(d.params.sigmaAnnual)}`}</Formula> per year, from the
          last close of <InlineCode>${d.params.s0}</InlineCode>.
        </P>
      </Section>

      <Section id="simulate" n={3} title="Simulating 5,000 futures">
        <P>
          Because the log-price is a Brownian motion with drift, the transition density is known in
          closed form — so we simulate with the <Term>exact</Term> scheme rather than Euler stepping:
        </P>
        <CodeBlock
          file="simulate.py"
          code={`rng = np.random.default_rng(${d.params.seed})
n_paths, horizon, dt = ${d.params.nPaths}, ${d.params.horizonDays}, 1/252

z = rng.standard_normal((n_paths, horizon))
inc = (mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * z
paths = s0 * np.exp(np.cumsum(inc, axis=1))     # (5000, 252)`}
        />
        <P>
          The <Formula>{String.raw`-\sigma^2/2`}</Formula> correction is the single most-forgotten term in
          quantitative finance: it is the gap between the average of log returns and the log of
          average returns. Drop it and every simulated path drifts systematically high.
        </P>
        <Figure
          caption="The scenario cone — percentile bands across 5,000 simulated paths, 1y forward"
          legend={[
            { label: "median", tone: "aqua" },
            { label: "p5 / p95", tone: "muted" },
            { label: "sample paths", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Fan chart of simulated SPY paths over one year: percentile bands widen with time around a gently rising median."
            series={coneSeries}
            xLabels={[[0, "today"], [0.25, "3m"], [0.5, "6m"], [0.75, "9m"], [1, "1y"]]}
            h={250}
          />
        </Figure>
      </Section>

      <Section id="terminal" n={4} title="The terminal distribution">
        <P>
          At the one-year horizon GBM implies a <Term>lognormal</Term> price. The histogram of
          simulated terminal prices against the analytic density is a free correctness check — the
          two should agree to Monte-Carlo error, and they do:
        </P>
        <Figure
          caption="Terminal SPY price after 1y — 5,000 simulations vs the analytic lognormal"
          legend={[
            { label: "analytic lognormal", tone: "aqua" },
            { label: "simulated", tone: "muted" },
          ]}
        >
          <Histogram
            ariaLabel="Right-skewed histogram of terminal prices with a matching lognormal curve overlaid."
            binEdges={d.terminal.edges as unknown as number[]}
            counts={d.terminal.counts as unknown as number[]}
            overlay={{ y: d.terminal.lognormal as unknown as number[] }}
            vLines={[{ v: d.params.s0, label: "S₀", color: "graphite", dash: "3 3" }]}
          />
        </Figure>
        <DataTable
          head={["Percentile", "Price after 1y", "vs today"]}
          rows={([5, 25, 50, 75, 95] as const).map((p) => {
            const v = d.terminal.pctiles[String(p) as keyof typeof d.terminal.pctiles];
            return [`p${p}`, `$${v.toFixed(0)}`, `${v >= d.params.s0 ? "+" : ""}${(((v as number) / d.params.s0 - 1) * 100).toFixed(1)}%`];
          })}
        />
        <P>
          Note what the cone actually says: even with a healthy {pc(d.params.muAnnual)} drift, the
          probability of being <Term>down</Term> after a year is {pc(d.terminal.probLoss)}. Drift is
          slow; volatility is fast.
        </P>
      </Section>

      <Section id="breaks" n={5} title="Where the model breaks">
        <P>
          GBM's normality assumption is testable, so test it. On our {d.params.n_obs.toLocaleString()}
          {" "}real SPY log returns, Jarque–Bera returns a statistic of{" "}
          <InlineCode>{d.reality.jbStat.toLocaleString()}</InlineCode> — normality is rejected at
          any confidence level you can name. The excess kurtosis of{" "}
          <InlineCode>{d.reality.excessKurtosis}</InlineCode> (a normal distribution has 0) says the
          real tails are an order of magnitude fatter than the model's.
        </P>
        <DataTable
          head={["Moment check", "SPY 2018–24", "GBM assumes"]}
          rows={[
            ["Excess kurtosis", d.reality.excessKurtosis, "0"],
            ["Skew", d.reality.skew, "0"],
            ["Jarque–Bera p-value", "< 1e-300", "≥ 0.05"],
          ]}
        />
        <Callout kind="Practitioner take">
          Use GBM for the <Term>shape</Term> of central scenarios — cones, medians, interquartile
          ranges — and never for tail sizing. The COVID drop in this very sample was a ~16σ daily
          event under GBM's calibration; fat-tailed risk measures (VaR with Student-t, CVaR, EVT)
          exist precisely because of this failure, and they get their own tutorials (T09, T10).
        </Callout>
      </Section>

      <References
        items={[
          "Hull, J. Options, Futures, and Other Derivatives — ch. 14, Wiener processes and Itô's lemma.",
          "Glasserman, P. (2003). Monte Carlo Methods in Financial Engineering. Springer.",
          <span key="nb">Companion notebook: <InlineCode>gbm-simulating-price-paths.ipynb</InlineCode> — reproduces every figure from raw data (seed {String(d.params.seed)}).</span>,
        ]}
      />
    </>
  );
}
