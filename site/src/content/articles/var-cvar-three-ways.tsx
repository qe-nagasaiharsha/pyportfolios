import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";

export default function VarCvarThreeWays() {
  return (
    <>
      <Lead>
        Value-at-Risk is one number with three popular recipes, and the recipes disagree most
        exactly when it matters. This is a practitioner’s tour of all three — historical, parametric,
        and Monte Carlo — ending where every VaR project should: a backtest that tells you which one
        you are allowed to believe.
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
          same as a violent 2020 one.
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
          systematically understates extreme risk. Swapping the normal for a Student-t with fitted
          degrees of freedom is a cheap, large improvement.
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
          randomness. Garbage model in, confident garbage out.
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
          and breaches should be independent — not clustered in a single bad week. Count exceedances
          and test the rate with Kupiec’s proportion-of-failures test. A model that breaches far too
          often is dangerous; one that never breaches is leaving capital on the table.
        </P>
        <Figure caption="One year of P&L against the 99% VaR line — breaches should be rare and scattered" legend={[{ label: "99% VaR", tone: "aqua" }, { label: "Daily P&L", tone: "muted" }]}>
          <svg viewBox="0 0 600 180" className="w-full" role="img" aria-label="Daily losses mostly sit above the VaR line with a few scattered exceedances.">
            <line x1="0" y1="130" x2="600" y2="130" stroke="#0a8a8a" strokeWidth="1.6" strokeDasharray="5 4" />
            {[18, 60, 95, 140, 175, 210, 250, 300, 330, 365, 400, 440, 470, 510, 545, 580].map((x, i) => {
              const h = [40, 55, 30, 70, 45, 60, 38, 52, 66, 33, 58, 44, 62, 36, 50, 48][i];
              const breach = h > 60;
              return <line key={x} x1={x} y1={130} x2={x} y2={130 - h} stroke={breach ? "#0a8a8a" : "#4a4a42"} strokeOpacity={breach ? 1 : 0.5} strokeWidth="3" />;
            })}
          </svg>
        </Figure>
      </Section>

      <Section id="verdict" n={6} title="Which one, when">
        <P>
          They are tools, not rivals. On the same book the three will not agree — and the gaps are
          the point.
        </P>
        <DataTable
          head={["Method", "99% VaR", "Strength", "Failure mode"]}
          rows={[
            ["Historical", "2.6%", "no assumptions", "blind to unseen crashes"],
            ["Parametric (normal)", "2.1%", "instant, analytic", "understates fat tails"],
            ["Parametric (t)", "2.9%", "cheap tail fix", "still one regime"],
            ["Monte Carlo", "3.1%", "any model", "only as good as the model"],
          ]}
        />
        <Callout kind="Practitioner take">
          Report at least two methods and watch the spread between them — a widening gap is itself a
          risk signal. Prefer CVaR over VaR for limits, use a Student-t over a normal almost always,
          and never ship a VaR you have not backtested. Numbers above are illustrative; the notebook
          computes and backtests all four on real data.
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
