import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";
import { LineChart } from "@/components/charts/DataCharts";
import d from "./data/var-cvar-three-ways";

/* Legacy upgrade — all numbers below are REAL computed results
   (60/40 SPY + AGG, 2003–2023, seeded MC) baked in by quant/legacy/var_cvar.py. */

const pc = (v: number, nd = 1) => `${(v * 100).toFixed(nd)}%`;

export default function VarCvarThreeWays() {
  return (
    <>
      <Lead>
        Value-at-Risk is one number with three popular recipes, and the recipes disagree most
        exactly when it matters. This is a practitioner’s tour of all three — historical, parametric,
        and Monte Carlo — run on a real book: a daily-rebalanced 60/40 SPY + AGG portfolio over{" "}
        {d.params.nObs.toLocaleString()} trading days ({d.params.start} to {d.params.end}), ending
        where every VaR project should: a backtest that tells you which one you are allowed to
        believe.
      </Lead>

      <Section id="definitions" n={1} title="VaR & CVaR, defined">
        <P>
          <Term>VaR</Term> at level <InlineCode>α</InlineCode> is the loss you do not expect to
          exceed with probability <InlineCode>α</InlineCode> over a horizon — the
          <InlineCode>α</InlineCode>-quantile of the loss distribution. Its well-known flaw is that
          it says nothing about <Term>how bad</Term> the breach is. <Term>CVaR</Term> (expected
          shortfall) fixes that: it is the average loss <Term>given</Term> you are past VaR, and
          unlike VaR it is <Term>coherent</Term> — it rewards diversification instead of
          occasionally punishing it.
        </P>
        <Callout kind="Definitions">
          VaRα = the α-quantile of the loss L &nbsp;&nbsp;·&nbsp;&nbsp; CVaRα = E[ L | L ≥ VaRα ]
        </Callout>
      </Section>

      <Section id="historical" n={2} title="Historical simulation">
        <P>
          The simplest and most honest about what it does not know: re-price the portfolio over its
          own history and read the empirical quantile. No distributional assumption — but it can
          only show you crashes that have already happened, and it weights a sleepy 2017 day the
          same as a violent 2020 one. On our 60/40 book the empirical 99% VaR is{" "}
          <InlineCode>{pc(d.var["99"].hist, 2)}</InlineCode> and the CVaR behind it{" "}
          <InlineCode>{pc(d.var["99"].histCvar, 2)}</InlineCode> — the average bad day past VaR is
          half again worse than VaR itself.
        </P>
        <CodeBlock
          file="historical.py"
          code={`import numpy as np

def hist_var_cvar(pnl, alpha=0.99):
    loss = -np.asarray(pnl)
    var = np.quantile(loss, alpha)
    cvar = loss[loss >= var].mean()
    return var, cvar`}
        />
      </Section>

      <Section id="parametric" n={3} title="Parametric (variance–covariance)">
        <P>
          Assume the P&L is normal and VaR collapses to a formula:
          <InlineCode>VaR = −(μ + σ·zα)</InlineCode>. Fast, analytic, and the standard desk
          shorthand — but it is exactly the Gaussian assumption the tails violate, so it
          systematically understates extreme risk: <InlineCode>{pc(d.var["99"].normal, 2)}</InlineCode>{" "}
          here, well under the historical {pc(d.var["99"].hist, 2)}. Swapping the normal for a
          Student-t with fitted degrees of freedom is a cheap, large improvement — the MLE fit on
          this book returns <InlineCode>ν = {d.params.tDf}</InlineCode> (a shockingly fat tail for a
          “safe” 60/40) and a 99% VaR of <InlineCode>{pc(d.var["99"].t, 2)}</InlineCode>.
        </P>
        <CodeBlock
          file="parametric.py"
          code={`from scipy.stats import norm, t as student_t

def normal_var(pnl, alpha=0.99):
    mu, sigma = np.mean(pnl), np.std(pnl, ddof=1)
    return -(mu + sigma * norm.ppf(1 - alpha))

def t_var(pnl, alpha=0.99):
    nu, mu, sigma = student_t.fit(pnl)               # heavier tails
    return -(mu + sigma * student_t.ppf(1 - alpha, nu))`}
        />
      </Section>

      <Section id="montecarlo" n={4} title="Monte Carlo">
        <P>
          Fit a model to the risk factors, simulate many scenarios, re-price, and read the tail. The
          most flexible — you can plug in fat tails, copulas, optionality, path dependence — and the
          most dangerous, because it launders your assumptions through impressive-looking
          randomness. {d.params.mcDraws.toLocaleString()} seeded draws from our fitted Student-t
          give <InlineCode>{pc(d.var["99"].mc, 2)}</InlineCode> at 99% — agreeing with the analytic
          t to Monte-Carlo error, exactly as they must on a linear book. Garbage model in, confident
          garbage out.
        </P>
        <CodeBlock
          file="monte_carlo.py"
          code={`def mc_var_cvar(mu, cov, weights, alpha=0.99, n=200_000):
    draws = np.random.multivariate_normal(mu, cov, size=n)
    pnl = draws @ weights
    loss = -pnl
    var = np.quantile(loss, alpha)
    return var, loss[loss >= var].mean()`}
        />
      </Section>

      <Section id="backtest" n={5} title="Backtesting the VaR">
        <P>
          A VaR estimate is a falsifiable forecast: at 99%, losses should breach it about 1% of days,
          and breaches should be independent — not clustered in a single bad week. Rolling a{" "}
          {d.params.window}-day historical VaR across our {d.backtest.n.toLocaleString()}{" "}
          out-of-sample days produces {d.backtest.hist.breaches} breaches where{" "}
          {d.backtest.expected} were expected — a {pc(d.backtest.hist.rate, 2)} rate that Kupiec’s
          proportion-of-failures test rejects outright (LR = {d.backtest.hist.kupiecLR}, p ={" "}
          {d.backtest.hist.kupiecP}). The rolling normal is worse still: {d.backtest.normal.breaches}{" "}
          breaches. A model that breaches far too often is dangerous; one that never breaches is
          leaving capital on the table.
        </P>
        <Figure
          caption={`60/40 daily returns vs the rolling 250d 99% VaR, ${d.chart.year} — ${d.chart.nBreach} breaches in ${d.chart.nDays} days, clustered in March`}
          legend={[{ label: "rolling 99% VaR", tone: "aqua" }, { label: "daily P&L", tone: "muted" }]}
        >
          <LineChart
            ariaLabel="Daily 60/40 portfolio returns through 2020 oscillate around zero and mostly stay above the rolling 99 percent VaR line, which drops sharply after the March COVID crash; the nine breaches cluster in late February and March."
            series={[
              { y: d.chart.ret as unknown as number[], color: "graphite", width: 0.8, opacity: 0.75 },
              { y: d.chart.negVar as unknown as number[], color: "teal", width: 2 },
            ]}
            xLabels={d.chart.xLabels as unknown as [number, string][]}
            yFmt={(v) => `${v.toFixed(0)}%`}
            h={220}
          />
        </Figure>
      </Section>

      <Section id="verdict" n={6} title="Which one, when">
        <P>
          They are tools, not rivals. On the same book the three do not agree — and the gaps are
          the point. The worst day in the sample ({d.params.worstDay}, {pc(d.params.worstRet, 1)})
          dwarfs every 99% VaR below; that is what CVaR is for.
        </P>
        <DataTable
          head={["Method", "99% VaR", "Strength", "Failure mode"]}
          rows={[
            ["Historical", pc(d.var["99"].hist), "no assumptions", "blind to unseen crashes"],
            ["Parametric (normal)", pc(d.var["99"].normal), "instant, analytic", "understates fat tails"],
            [`Parametric (t, ν = ${d.params.tDf})`, pc(d.var["99"].t), "cheap tail fix", "still one regime"],
            ["Monte Carlo", pc(d.var["99"].mc), "any model", "only as good as the model"],
          ]}
        />
        <Callout kind="Practitioner take">
          Report at least two methods and watch the spread between them — a widening gap is itself a
          risk signal. Prefer CVaR over VaR for limits, use a Student-t over a normal almost always,
          and never ship a VaR you have not backtested. The companion notebook computes and
          backtests all four on the same data, seed {d.params.seed}.
        </Callout>
      </Section>

      <References
        items={[
          "Jorion, P. Value at Risk: The New Benchmark for Managing Financial Risk.",
          "Kupiec, P. (1995). Techniques for Verifying the Accuracy of Risk Measurement Models. Journal of Derivatives, 3(2).",
          "Acerbi, C. & Tasche, D. (2002). On the Coherence of Expected Shortfall. Journal of Banking & Finance, 26(7).",
        ]}
      />
    </>
  );
}
