import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References, Pipeline } from "@/components/article/prose";
import { LineChart } from "@/components/charts/DataCharts";
import d from "./data/kalman-filter-hedge-ratios";

/* T14 / topic card 14-16 — all figures below render REAL computed results
   (EWA/EWC Jan 2010 – Dec 2024, fully deterministic) baked in by
   quant/tutorials/t14_kalman.py. */

const pc = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function KalmanFilterHedgeRatios() {
  const net = d.stats.net;
  const gross = d.stats.gross;

  return (
    <>
      <Lead>
        Every pairs trade hides a regression inside it: the hedge ratio that turns two prices into
        one spread. Estimate that ratio once and you have quietly assumed the relationship never
        moves — over fifteen years of EWA and EWC it moves from{" "}
        {d.params.betaKfMin.toFixed(2)} to {d.params.betaKfMax.toFixed(2)}. We build a Kalman
        filter from scratch in NumPy that treats the hedge ratio as a moving target, then run an
        honest experiment: identical trading rules on the Kalman spread and the static spread,
        with costs, and let the data pick the winner.
      </Lead>

      <Pipeline
        steps={[
          "Load EWA & EWC adjusted closes, 2010–2024 (the classic Chan pair)",
          "Fit the two OLS baselines: full-sample beta and rolling 252d beta (statsmodels)",
          "Build the Kalman filter in NumPy — state [β, α], random-walk transition",
          "Compare the three beta paths on one chart",
          "Trade the spread: |z| > 2 entry, z-crosses-0 exit, 10 bp per leg",
          "Read the honest scoreboard: gross vs net, Kalman vs static",
        ]}
      />

      <Section id="drift" n={1} title="Why static hedge ratios die">
        <P>
          EWA (Australia) and EWC (Canada) are the canonical cointegration pair — two
          commodity-heavy developed markets whose daily returns correlate at{" "}
          <InlineCode>{d.params.retCorr.toFixed(2)}</InlineCode>. Regress EWC on EWA over the full
          sample and you get one hedge ratio for fifteen years:{" "}
          <InlineCode>β = {d.params.betaStatic.toFixed(2)}</InlineCode>, with an ADF p-value of{" "}
          <InlineCode>{d.params.adfP.toFixed(3)}</InlineCode> on the residual spread — cointegrated,
          by the book (Engle–Granger: regress one price on the other, then unit-root-test the
          residual). The problem is the word{" "}
          <Term>one</Term>. A hedge ratio is an estimate of an economic relationship — commodity
          mix, currency betas, index composition — and every one of those drifted between 2010 and
          2024. A rolling window is the standard fix, and it limps: every observation inside the
          window carries equal weight, so year-old data moves today&apos;s estimate as much as
          yesterday&apos;s, and each point falling out of the window jerks the estimate — the{" "}
          <Term>window cliff</Term>.
        </P>
        <Figure
          caption={`EWA & EWC, normalized to 1.0 at ${d.params.start} — related, not identical`}
          legend={[
            { label: "EWC", tone: "aqua" },
            { label: "EWA", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Normalized EWA and EWC prices 2010 to 2024: the two series track each other broadly, with EWC roughly doubling while EWA ends near 1.9, diverging and reconverging repeatedly."
            series={[
              { y: d.prices.ewc as unknown as number[], color: "teal", width: 1.8 },
              { y: d.prices.ewa as unknown as number[], color: "graphite", width: 1.4, opacity: 0.8 },
            ]}
            xLabels={d.prices.xLabels as unknown as [number, string][]}
          />
        </Figure>
        <Callout kind="Why practitioners care">
          The hedge ratio is not a nuisance parameter — it <Term>is</Term> the position. Get it
          wrong by 20% and your &ldquo;market-neutral&rdquo; spread carries a 20% directional
          stub of EWA. Static betas fail slowly and invisibly, which is the most expensive way to
          fail.
        </Callout>
      </Section>

      <Section id="state-space" n={2} title="Beta as a state, not a constant">
        <P>
          The Kalman filter starts from a different premise: the regression coefficients are{" "}
          <Term>unobserved states</Term> that evolve through time, and each day&apos;s prices are a
          noisy measurement of them. Two equations define the model. The <Term>state equation</Term>{" "}
          says the hedge ratio and intercept follow a random walk —{" "}
          <InlineCode>[β_t, α_t] = [β_t−1, α_t−1] + ω_t</InlineCode> — tomorrow&apos;s relationship
          is today&apos;s, plus noise. The <Term>observation equation</Term> says{" "}
          <InlineCode>EWC_t = β_t·EWA_t + α_t + ε_t</InlineCode>. Two variances close the model:
          the state noise <InlineCode>Q = δ/(1−δ)·I</InlineCode> with{" "}
          <InlineCode>δ = 1e−5</InlineCode> (the standard parameterization from Chan), and
          observation noise <InlineCode>R = 1e−3</InlineCode>.
        </P>
        <P>
          Delta is the single real knob, and it replaces the window size entirely: it is a{" "}
          <Term>forgetting rate</Term>. Larger δ lets the states wander faster (adaptive but
          noisy); smaller δ pins them down (smooth but laggy); δ = 0 collapses to recursive least
          squares — a static beta refined forever. Both values here are textbook defaults,
          deliberately not tuned on this sample: tune δ to the backtest and you are optimizing the
          strategy through the back door.
        </P>
      </Section>

      <Section id="filter" n={3} title="The filter in five lines of NumPy">
        <P>
          No library, no black box — the whole filter is a predict step and an update step,
          looped over the sample. Predict: with a random-walk transition the state estimate is
          unchanged and its covariance grows by <InlineCode>Q</InlineCode> (uncertainty leaks in).
          Update: compare the observed EWC to the prediction, and shift the states toward the
          error in proportion to the <Term>Kalman gain</Term> — the ratio of state uncertainty to
          total uncertainty.
        </P>
        <CodeBlock
          file="kalman.py"
          code={`def kalman_hedge(x, y, delta=1e-5, r_obs=1e-3):
    q = (delta / (1 - delta)) * np.eye(2)     # trans_cov
    state, p_cov = np.zeros(2), np.eye(2)     # [beta, alpha], diffuse start
    betas, alphas = np.zeros(len(x)), np.zeros(len(x))
    for t in range(len(x)):
        h = np.array([x[t], 1.0])             # observation map
        p_cov = p_cov + q                     # predict   (F = I)
        e = y[t] - h @ state                  # innovation
        s = h @ p_cov @ h + r_obs             # innovation variance
        k = p_cov @ h / s                     # Kalman gain
        state = state + k * e                 # update
        p_cov = p_cov - np.outer(k, h @ p_cov)
        betas[t], alphas[t] = state
    return betas, alphas`}
        />
        <P>
          The gain is the elegance. When the filter is uncertain (large <InlineCode>p_cov</InlineCode>),
          it learns aggressively from each observation; once confident, new data barely moves it —
          unless <InlineCode>Q</InlineCode> keeps injecting doubt, which is exactly what lets β
          keep adapting forever. An exponentially-weighted regression, derived from first
          principles rather than picked from a menu of window sizes.
        </P>
      </Section>

      <Section id="betas" n={4} title="Three betas, one pair">
        <P>
          Slice off the first year (rolling-OLS warm-up, Kalman burn-in) and compare the three
          estimators of the same quantity. The static line says the answer is{" "}
          {d.params.betaStatic.toFixed(2)}, forever. The rolling OLS swings between{" "}
          <InlineCode>{d.params.betaRollMin.toFixed(2)}</InlineCode> and{" "}
          <InlineCode>{d.params.betaRollMax.toFixed(2)}</InlineCode> — whipping around every regime
          change a full window late. The Kalman path covers{" "}
          <InlineCode>{d.params.betaKfMin.toFixed(2)}</InlineCode> to{" "}
          <InlineCode>{d.params.betaKfMax.toFixed(2)}</InlineCode>, moving early and smoothly: no
          cliff, because no window.
        </P>
        <Figure
          caption="The EWC~EWA hedge ratio, three ways — Kalman filter vs rolling 252d OLS vs full-sample OLS"
          legend={[
            { label: "Kalman β", tone: "aqua" },
            { label: "rolling OLS", tone: "muted" },
            { label: "static OLS", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Hedge ratio estimates 2011 to 2024: the Kalman beta drifts smoothly between roughly 0.7 and 1.5, the rolling OLS beta oscillates violently between about 0.2 and 2.7, and the static beta sits flat at 1.57."
            series={[
              { y: d.beta.rolling as unknown as number[], color: "amber", width: 1.2, opacity: 0.85 },
              { y: d.beta.kalman as unknown as number[], color: "teal", width: 2.2 },
            ]}
            hLines={[{ v: d.params.betaStatic, color: "rust", dash: "5 4", label: `static ${d.params.betaStatic.toFixed(2)}` }]}
            xLabels={d.beta.xLabels as unknown as [number, string][]}
            h={250}
          />
        </Figure>
        <P>
          Note what the rolling estimator does around 2020–2021: the COVID shock enters the
          window, distorts the regression for exactly 252 trading days, then falls out and the
          estimate jumps again — two artefacts from one event. The filter digests the same shock
          in weeks and moves on.
        </P>
      </Section>

      <Section id="trading" n={5} title="Trading the spread">
        <P>
          The spread is <InlineCode>EWC_t − β_t·EWA_t − α_t</InlineCode>, z-scored on a trailing{" "}
          {d.params.zWin}-day window. Rules, identical for both variants: enter long the spread
          (long EWC, short β·EWA) when <InlineCode>z &lt; −2</InlineCode>, short when{" "}
          <InlineCode>z &gt; +2</InlineCode>, exit when z crosses zero. Positions are sized to $1
          gross notional at entry, the Kalman variant re-hedges the EWA leg to the current β
          daily, and every unit of traded notional pays 10 bp. Signals use the close and P&amp;L
          starts the next day — no lookahead in the rule. The static beta itself, of course, is one
          giant lookahead: it was fit on all fifteen years, including the future of every trade it
          takes.
        </P>
        <CodeBlock
          file="signal.py"
          code={`spread = ewc - beta * ewa - alpha              # beta_t, alpha_t from the filter
z = (spread - spread.rolling(60).mean()) / spread.rolling(60).std()

# enter |z| > 2, exit when z crosses 0, hold in between
if p == 0:
    p = 1 if z[t] < -2 else (-1 if z[t] > 2 else 0)
elif p == 1 and z[t] >= 0: p = 0               # long leg reverted
elif p == -1 and z[t] <= 0: p = 0              # short leg reverted`}
        />
        <Figure
          caption="The Kalman-spread z-score with ±2σ entry bands — every excursion is a candidate trade"
          legend={[
            { label: "z-score", tone: "aqua" },
            { label: "±2σ entry", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Z-score of the Kalman spread oscillating rapidly around zero between roughly minus four and plus four, crossing the plus and minus two entry bands many times across the sample."
            series={[{ y: d.zscore.z as unknown as number[], color: "teal", width: 1.1 }]}
            hLines={[
              { v: d.params.entryZ, color: "rust", dash: "5 4", label: "+2σ" },
              { v: -d.params.entryZ, color: "rust", dash: "5 4", label: "−2σ" },
              { v: 0, color: "graphite", dash: "2 4" },
            ]}
            xLabels={d.zscore.xLabels as unknown as [number, string][]}
          />
        </Figure>
      </Section>

      <Section id="take" n={6} title="What the numbers actually say">
        <P>
          Here is the honest scoreboard, and it is more interesting than a clean win. Gross of
          costs, the Kalman spread is the better signal on every risk-adjusted axis: Sharpe{" "}
          <InlineCode>{gross.kalman.sharpe.toFixed(2)}</InlineCode> vs{" "}
          <InlineCode>{gross.static.sharpe.toFixed(2)}</InlineCode>, volatility{" "}
          {pc(gross.kalman.annVol)} vs {pc(gross.static.annVol)}, max drawdown{" "}
          {pc(gross.kalman.maxDD)} vs {pc(gross.static.maxDD)} — half the risk, more reward per
          unit of it. But the filtered spread mean-reverts <Term>fast</Term>, so it trades{" "}
          {net.kalman.trades} round trips to the static variant&apos;s {net.static.trades} — and at
          10 bp per unit of traded notional, that turnover consumes the entire edge and then some.
        </P>
        <Figure
          caption="Strategy equity, net of 10 bp costs — the cost drag on 2.7× turnover flips the ranking"
          legend={[
            { label: "Kalman β", tone: "aqua" },
            { label: "static β", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Net equity curves 2011 to 2024: the static-beta strategy grinds up to roughly 1.24 with visible drawdowns, while the Kalman-beta strategy decays slowly to about 0.89 under transaction costs."
            series={[
              { y: d.equity.static as unknown as number[], color: "graphite", width: 1.4 },
              { y: d.equity.kalman as unknown as number[], color: "teal", width: 2 },
            ]}
            xLabels={d.equity.xLabels as unknown as [number, string][]}
          />
        </Figure>
        <DataTable
          head={["Variant", "Ann ret (net)", "Ann vol", "Sharpe (net)", "Sharpe (gross)", "Max DD (net)", "Trades"]}
          rows={[
            [
              "Kalman β (adaptive)",
              pc(net.kalman.annRet),
              pc(net.kalman.annVol),
              net.kalman.sharpe.toFixed(2),
              gross.kalman.sharpe.toFixed(2),
              pc(net.kalman.maxDD),
              net.kalman.trades,
            ],
            [
              "Static β (full-sample)",
              pc(net.static.annRet),
              pc(net.static.annVol),
              net.static.sharpe.toFixed(2),
              gross.static.sharpe.toFixed(2),
              pc(net.static.maxDD),
              net.static.trades,
            ],
          ]}
        />
        <P>
          So did the Kalman beta &ldquo;improve&rdquo; the strategy? As an estimator,
          unambiguously — better gross Sharpe, half the drawdown, and no lookahead, against a
          static baseline that was handed the answer key. As a net P&amp;L line at retail costs,
          no: the same adaptivity that tracks the relationship also generates signals faster than
          10 bp round trips can pay for. Halve the cost and the gap halves; at institutional
          frictions of 1–2 bp the Kalman variant pulls level and ahead. Estimation quality and
          implementability are different axes, and a backtest that reports only one is hiding the
          other.
        </P>
        <Callout kind="Practitioner take">
          Use the filter for what it is provably better at: <Term>knowing your position</Term>.
          Desks run Kalman hedge ratios even when entry signals come from elsewhere, because the
          alternative is discovering your directional stub during a drawdown. And before trading
          the filtered spread, do the arithmetic this table forces: expected edge per trade must
          clear cost per trade — adaptivity raises the trade count, so it raises the bar. δ and R
          were fixed at textbook values here; tuning them to fix the net line is how
          backtest-overfitting starts. One refinement is legitimate, though: the filter already
          computes the spread&apos;s fair value <Term>and its own uncertainty</Term> — Chan&apos;s
          variant trades the innovation e<sub>t</sub> against its predicted standard deviation
          √S<sub>t</sub> instead of a rolling z-score, letting the model set the entry band and
          retiring the arbitrary {d.params.zWin}-day window.
        </Callout>
      </Section>

      <References
        items={[
          "Kalman, R. E. (1960). A New Approach to Linear Filtering and Prediction Problems. Journal of Basic Engineering, 82(1).",
          "Engle, R. F. & Granger, C. W. J. (1987). Co-integration and Error Correction: Representation, Estimation, and Testing. Econometrica, 55(2), 251–276.",
          "Chan, E. (2013). Algorithmic Trading: Winning Strategies and Their Rationale. Wiley — ch. 3, the EWA/EWC Kalman example and the δ/(1−δ) parameterization.",
          "Harvey, A. C. (1989). Forecasting, Structural Time Series Models and the Kalman Filter. Cambridge University Press.",
          <span key="nb">Companion notebook: <InlineCode>kalman-filter-hedge-ratios.ipynb</InlineCode> — reproduces every figure from raw data; fully deterministic, no RNG.</span>,
        ]}
      />
    </>
  );
}
