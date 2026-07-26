import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References, Pipeline } from "@/components/article/prose";
import { LineChart, BarChart } from "@/components/charts/DataCharts";
import d from "./data/black-litterman-equilibrium-views";

/* T06 / topic card 06-16 — all figures below render REAL computed results
   (EWJ · EWG · EWU · EWA · EWC, Jan 2015 – Dec 2024, deterministic — no RNG)
   baked in by quant/tutorials/t06_black_litterman.py. */

const pc = (v: number, nd = 1) => `${(v * 100).toFixed(nd)}%`;
const pp = (v: number, nd = 1) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(nd)}pp`;

export default function BlackLittermanEquilibriumViews() {
  const t = d.params.tickers as unknown as string[];
  const lineColors = ["teal", "rust", "slate", "amber", "plum"] as const;

  return (
    <>
      <Lead>
        Mean-variance optimization has a dirty secret: it is an error maximiser. Feed it raw
        historical means and it hands back corner portfolios that convulse when an input moves
        by basis points. Black–Litterman fixes the <Term>inputs</Term> rather than the optimizer —
        start from the returns the market itself implies, blend in your views with explicit
        confidence, and the same optimizer suddenly produces weights you could show a client.
        We build the whole machine on five iShares country ETFs.
      </Lead>

      <Pipeline
        steps={[
          "Download EWJ · EWG · EWU · EWA · EWC, 2015–2024 (yfinance)",
          "Ledoit–Wolf covariance + historical means → watch MVO explode",
          "Reverse-optimize equilibrium returns from market-cap weights",
          "Encode two views (one relative, one absolute) with Idzorek confidences",
          "Blend prior and views into posterior returns",
          "Re-optimize: stable weights that tilt only where the views say",
        ]}
      />

      <Section id="data" n={1} title="Five countries, one decade">
        <P>
          The sample runs {d.params.start} to {d.params.end} — {d.params.n_obs.toLocaleString()}
          {" "}trading days of Japan (EWJ), Germany (EWG), the UK (EWU), Australia (EWA) and
          Canada (EWC): five developed markets with different sector mixes but an average
          pairwise correlation of {d.params.avgCorr}. High correlation plus similar volatilities
          is exactly the regime where MVO becomes numerically treacherous — small differences in
          means decide everything.
        </P>
        <Figure
          caption="Growth of $1 — EWJ (teal) · EWG (rust) · EWU (slate) · EWA (amber) · EWC (plum)"
          legend={[
            { label: "Japan", tone: "aqua" },
            { label: "others", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Cumulative growth of one dollar in five country ETFs from 2015 to 2024; all end between roughly 1.4 and 1.8, with Japan and Canada leading."
            series={t.map((k, i) => ({
              y: d.history.series[k as keyof typeof d.history.series] as unknown as number[],
              color: lineColors[i],
              width: i === 0 ? 2 : 1.3,
            }))}
            xLabels={d.history.xLabels as unknown as [number, string][]}
          />
        </Figure>
        <P>
          A decade compounds to annualised means between {pc(Math.min(...(d.inputs.histMu as unknown as number[])))} and{" "}
          {pc(Math.max(...(d.inputs.histMu as unknown as number[])))} — differences that are{" "}
          <Term>statistically indistinguishable</Term> given ~20% volatilities. The covariance
          matrix we can estimate respectably (we shrink it with Ledoit–Wolf, the subject of its
          own tutorial); the mean vector we fundamentally cannot. MVO does not know that.
        </P>
      </Section>

      <Section id="instability" n={2} title="Act one: MVO on raw means">
        <CodeBlock
          file="mvo_unstable.py"
          code={`from pypfopt import EfficientFrontier, expected_returns, risk_models

mu_hist = expected_returns.mean_historical_return(px)   # annual CAGR
S = risk_models.CovarianceShrinkage(px).ledoit_wolf()   # annualised

ef = EfficientFrontier(mu_hist, S)
ef.max_sharpe(risk_free_rate=0.02)
ef.clean_weights()   # {'EWJ': ${pc(d.weights.histLongOnly[0] as number)}, 'EWC': ${pc(d.weights.histLongOnly[4] as number)}, rest: 0}`}
        />
        <P>
          Long-only, the max-Sharpe portfolio holds <Term>two of five assets</Term> —{" "}
          {pc(d.weights.histLongOnly[0] as number)} Japan, {pc(d.weights.histLongOnly[4] as number)} Canada,
          zero in Germany, the UK and Australia. Drop the long-only constraint and use the
          closed-form tangency weights <InlineCode>w = (δΣ)⁻¹(μ − rf)</InlineCode> and it gets
          worse: the optimizer shorts the UK by {pc(Math.abs(d.weights.histUnc[2] as number))}.
          Now nudge a single input — add 100bp to the UK&apos;s mean — and re-optimize:
        </P>
        <DataTable
          head={["Asset", "w (base)", `w (${d.tweak.asset} +100bp)`, "shift"]}
          rows={t.map((k, i) => [
            k,
            pc(d.tweak.histBase[i] as number),
            pc(d.tweak.histTweaked[i] as number),
            pp((d.tweak.histTweaked[i] as number) - (d.tweak.histBase[i] as number)),
          ])}
        />
        <P>
          A 1-percentage-point change to <Term>one</Term> expected return moved{" "}
          <Term>every</Term> weight — the UK short covers by{" "}
          {pp((d.tweak.histTweaked[2] as number) - (d.tweak.histBase[2] as number))}, and the total
          L1 weight shift is {d.tweak.histL1}. That is Michaud&apos;s &ldquo;error
          maximisation&rdquo; in one table: the optimizer treats noise in the means as signal and
          leverages it.
        </P>
      </Section>

      <Section id="equilibrium" n={3} title="Act two: reverse optimization">
        <P>
          Black and Litterman&apos;s move is to stop asking &ldquo;what returns do I
          forecast?&rdquo; and start from &ldquo;what returns would make the portfolio everyone
          already holds optimal?&rdquo;. If the market-cap portfolio is the equilibrium, invert
          the optimality condition: <InlineCode>Π = δ Σ w_mkt + rf</InlineCode>. No return
          forecasting at all — just the covariance matrix, a risk-aversion constant
          (δ = {d.params.delta}, the classic default) and relative market sizes.
        </P>
        <CodeBlock
          file="equilibrium.py"
          code={`from pypfopt.black_litterman import market_implied_prior_returns

# approximate free-float equity market caps, USD, late 2024 — only
# the RELATIVE sizes matter, so rounded public figures are fine
MCAPS = {"EWJ": 6.2e12,   # Japan
         "EWG": 2.1e12,   # Germany
         "EWU": 3.1e12,   # United Kingdom
         "EWA": 1.7e12,   # Australia
         "EWC": 2.6e12}   # Canada

prior = market_implied_prior_returns(MCAPS, 2.5, S, risk_free_rate=0.02)`}
        />
        <DataTable
          head={["Country", "Mkt cap ($T)", "w_mkt", "Equilibrium Π", "Historical mean"]}
          rows={t.map((k, i) => [
            `${d.params.countries[i]} (${k})`,
            (d.params.mcapsT[i] as number).toFixed(1),
            pc(d.weights.market[i] as number),
            pc(d.returns.prior[i] as number),
            pc(d.returns.hist[i] as number),
          ])}
        />
        <P>
          Notice the inversion of logic: Australia gets the <Term>highest</Term> equilibrium
          return ({pc(d.returns.prior[3] as number)}) not because it performed well but because it
          is the most volatile and still gets held — the market must be expecting compensation.
          And the construction is exactly invertible: feeding Π back through{" "}
          <InlineCode>(δΣ)⁻¹(Π − rf)</InlineCode> reproduces the market weights to machine
          precision ({pc(d.weights.priorCheck[0] as number, 2)} Japan, {pc(d.weights.priorCheck[2] as number, 2)} UK, …).
        </P>
        <Callout kind="Why practitioners care">
          The equilibrium prior is the anchor that keeps the optimizer honest. With no views at
          all, Black–Litterman returns the market portfolio — the sensible &ldquo;I know
          nothing&rdquo; default. Every deviation from it must then be <Term>bought</Term> with an
          explicit, confidence-weighted view, which is precisely the discipline raw MVO lacks.
        </Callout>
      </Section>

      <Section id="views" n={4} title="Act three: two views, with confidence">
        <P>
          Views enter through a picking matrix <InlineCode>P</InlineCode> (each row is a
          portfolio) and a target vector <InlineCode>Q</InlineCode>. We take one of each kind:
          a <Term>relative</Term> view — Japan outperforms Germany by 2%/yr, row{" "}
          <InlineCode>[1, −1, 0, 0, 0]</InlineCode> — and an <Term>absolute</Term> view —
          Australia returns 6%/yr, row <InlineCode>[0, 0, 0, 1, 0]</InlineCode>. Both get a 30%
          confidence, which Idzorek&apos;s method converts into the view-uncertainty matrix Ω so
          we never have to guess variance units by hand.
        </P>
        <CodeBlock
          file="views.py"
          code={`from pypfopt.black_litterman import BlackLittermanModel
import numpy as np

P = np.array([[1.0, -1.0, 0.0, 0.0, 0.0],   # Japan beats Germany ...
              [0.0,  0.0, 0.0, 1.0, 0.0]])  # Australia returns ...
Q = np.array([0.02, 0.06])

bl = BlackLittermanModel(S, pi=prior.values.reshape(-1, 1), P=P, Q=Q,
                         omega="idzorek", view_confidences=[0.30, 0.30],
                         risk_aversion=2.5, tau=0.05)
posterior = bl.bl_returns()`}
        />
        <P>
          Note what the views actually say against the prior. The equilibrium has Germany{" "}
          <Term>ahead of</Term> Japan by {pc(Math.abs(d.views.rows[0].prior as number))}, so
          &ldquo;Japan +2%&rdquo; is a genuinely contrarian {pc((d.views.rows[0].target as number) - (d.views.rows[0].prior as number))} disagreement.
          And &ldquo;Australia at 6%&rdquo; sits <Term>below</Term> its{" "}
          {pc(d.views.rows[1].prior as number)} equilibrium — an absolute view can be bearish
          simply by undershooting the prior.
        </P>
      </Section>

      <Section id="posterior" n={5} title="The posterior blend">
        <P>
          The posterior is a precision-weighted average of prior and views — each view pulls the
          returns toward its target by an amount that scales with its confidence, and the
          covariance structure propagates the pull to correlated assets. Three return vectors,
          side by side:
        </P>
        <Figure
          caption="Expected returns: equilibrium prior vs historical mean vs BL posterior"
          legend={[
            { label: "posterior", tone: "aqua" },
            { label: "prior / historical", tone: "muted" },
          ]}
        >
          <BarChart
            ariaLabel="Grouped bar chart of expected returns for five country ETFs: equilibrium priors near 9 to 11 percent, historical means near 3 to 6 percent, posteriors near 8 to 9 percent."
            labels={t}
            groups={[
              { values: d.returns.prior as unknown as number[], color: "graphite" },
              { values: d.returns.hist as unknown as number[], color: "rust" },
              { values: d.returns.posterior as unknown as number[], color: "teal" },
            ]}
            yFmt={(v) => pc(v, 0)}
          />
        </Figure>
        <DataTable
          head={["View", "Confidence", "Prior implies", "View target", "Posterior"]}
          rows={d.views.rows.map((v) => [
            v.view,
            pc(v.conf as number, 0),
            pc(v.prior as number),
            pc(v.target as number),
            pc(v.posterior as number),
          ])}
        />
        <P>
          Neither view is swallowed whole. The Japan–Germany spread moves from{" "}
          {pc(d.views.rows[0].prior as number)} to {pc(d.views.rows[0].posterior as number)} —
          toward the +2% target but only about a third of the way, exactly what 30% confidence
          should buy. Australia&apos;s posterior lands at {pc(d.views.rows[1].posterior as number)},
          between its {pc(d.views.rows[1].prior as number)} prior and the 6% view. The posterior
          is a <Term>negotiation</Term>, not an override.
        </P>
      </Section>

      <Section id="weights" n={6} title="From returns to weights">
        <P>
          Invert the posterior exactly as we inverted the prior and compare the three
          allocations — raw-mean MVO, the market-cap equilibrium, and Black–Litterman:
        </P>
        <Figure
          caption="Weights: historical MVO vs market cap vs BL posterior (unconstrained)"
          legend={[
            { label: "Black–Litterman", tone: "aqua" },
            { label: "hist MVO / market", tone: "muted" },
          ]}
        >
          <BarChart
            ariaLabel="Grouped bar chart of portfolio weights: historical MVO swings from plus 70 percent Japan to minus 67 percent UK; market-cap and Black-Litterman weights stay between roughly minus 4 and plus 57 percent."
            labels={t}
            groups={[
              { values: d.weights.histUnc as unknown as number[], color: "rust" },
              { values: d.weights.market as unknown as number[], color: "graphite" },
              { values: d.weights.blUnc as unknown as number[], color: "teal" },
            ]}
            yFmt={(v) => pc(v, 0)}
          />
        </Figure>
        <P>
          Read the teal bars against the graphite ones. Japan rises from{" "}
          {pc(d.weights.market[0] as number)} to {pc(d.weights.blUnc[0] as number)} and Germany falls
          from {pc(d.weights.market[1] as number)} to {pc(d.weights.blUnc[1] as number)} — the
          relative view, expressed as a long/short tilt. Australia is trimmed to{" "}
          {pc(d.weights.blUnc[3] as number)} by the bearish absolute view. And the UK and Canada —
          named in <Term>no</Term> view — sit at exactly their market weights of{" "}
          {pc(d.weights.market[2] as number)} and {pc(d.weights.market[4] as number)}. Deviations
          from equilibrium are confined to the view portfolios; that is He &amp; Litterman&apos;s
          central result, reproduced here to four decimals.
        </P>
        <P>
          The stability payoff, quantified: hardening the Japan view by the same +100bp we used
          to torture MVO shifts the BL weights by an L1 distance of {d.tweak.blL1} — versus{" "}
          {d.tweak.histL1} for raw-mean MVO. Same shock, roughly a tenth of the reaction.
        </P>
        <Callout kind="Practitioner take">
          Black–Litterman is not a better forecaster — it is a better <Term>interface</Term>{" "}
          between forecasts and the optimizer. The equilibrium anchors you to a portfolio that is
          defensible by construction; views spend a risk budget proportional to your stated
          confidence; and anything you have no opinion on stays at market weight instead of
          becoming an accidental bet. When the weights do something extreme, it is because you
          told them to.
        </Callout>
      </Section>

      <References
        items={[
          "Black, F. & Litterman, R. (1992). Global Portfolio Optimization. Financial Analysts Journal, 48(5), 28–43.",
          "He, G. & Litterman, R. (1999). The Intuition Behind Black-Litterman Model Portfolios. Goldman Sachs Investment Management Research.",
          "Idzorek, T. (2005). A Step-by-Step Guide to the Black-Litterman Model. Zephyr Associates working paper.",
          <span key="nb">Companion notebook: <InlineCode>black-litterman-equilibrium-views.ipynb</InlineCode> — reproduces every figure from raw data (fully deterministic, no seed needed).</span>,
        ]}
      />
    </>
  );
}
