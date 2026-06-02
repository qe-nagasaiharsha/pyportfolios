import { Section, Lead, P, InlineCode, Term, Pipeline, Callout, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";

export default function EvtTCopulaVar() {
  return (
    <>
      <Lead>
        This is the reference tail-risk pipeline — the one risk desks actually run — rebuilt
        faithfully in Python. It refuses the two comforting lies of basic VaR: that volatility is
        constant, and that joint losses are Gaussian. Instead it filters volatility with a GARCH,
        models each tail with Extreme Value Theory, and binds the assets with a t-copula that keeps
        its grip precisely when markets crash together.
      </Lead>

      <Section id="overview" n={1} title="The pipeline">
        <P>
          Eight stages take raw prices to a portfolio loss distribution. Each one repairs a specific
          flaw in the naive approach.
        </P>
        <Pipeline
          steps={[
            "Source prices and compute daily log returns",
            "Filter each asset with a GARCH-t (remove volatility clustering)",
            "Fit semi-parametric margins — empirical centre, Pareto tails (EVT)",
            "Map residuals to uniforms (the probability-integral transform)",
            "Calibrate a Student-t copula on the pseudo-observations",
            "Monte-Carlo simulate joint residuals from the copula",
            "Invert margins and re-inflate by forecast volatility",
            "Aggregate to portfolio P&L → VaR and CVaR",
          ]}
        />
      </Section>

      <Section id="data" n={2} title="Data & log returns">
        <P>
          Start with log returns — they sum across time and behave better in the tails than simple
          returns. We will carry a small basket through the whole pipeline.
        </P>
        <CodeBlock
          file="01_returns.py"
          code={`import numpy as np
import pandas as pd

prices = pd.read_csv("prices.csv", index_col=0, parse_dates=True)
rets = np.log(prices / prices.shift(1)).dropna()      # daily log returns
weights = np.array([0.4, 0.35, 0.25])                 # portfolio weights`}
        />
      </Section>

      <Section id="garch" n={3} title="GARCH-t volatility filtering">
        <P>
          Returns are not identically distributed — volatility clusters. If you skip this step, your
          tail model fits a mixture of calm and stormy days and gets both wrong. Fit an
          AR(0)–GARCH(1,1) with Student-t innovations per asset and extract the
          <Term>standardised residuals</Term> <InlineCode>z = ε / σ̂</InlineCode>, which are much
          closer to i.i.d.
        </P>
        <CodeBlock
          file="02_garch.py"
          code={`from arch import arch_model

resid, sigma_fcast = {}, {}
for col in rets:
    am = arch_model(100 * rets[col], mean="Constant",
                    vol="GARCH", p=1, q=1, dist="t")
    res = am.fit(disp="off")
    resid[col] = res.std_resid                        # standardised residuals z
    sigma_fcast[col] = np.sqrt(
        res.forecast(horizon=1).variance.iloc[-1, 0]) # 1-day-ahead vol

Z = pd.DataFrame(resid).dropna()`}
        />
        <Callout kind="Why this comes first">
          Filtering then re-inflating (McNeil and Frey, 2000) is what makes the VaR
          <Term>conditional</Term> — it reacts to today’s volatility regime instead of averaging
          over years of unlike days.
        </Callout>
      </Section>

      <Section id="margins" n={4} title="Semi-parametric margins with Pareto tails">
        <P>
          Now model the distribution of each asset’s residuals. The body is well described by its
          own data, so use the empirical CDF there. The tails are where data is scarce and risk
          lives, so fit a <Term>Generalised Pareto Distribution</Term> to the exceedances beyond a
          high threshold — the Peaks-Over-Threshold theorem says that is the correct limiting tail.
        </P>
        <CodeBlock
          file="03_margins.py"
          code={`from scipy.stats import genpareto

def fit_pot(z, q=0.95):
    """Fit a GPD to the upper tail beyond the q-quantile threshold u."""
    u = np.quantile(z, q)
    excess = z[z > u] - u
    xi, _, beta = genpareto.fit(excess, floc=0)       # shape xi, scale beta
    return u, xi, beta

# fit both tails (lower tail = fit on -z), keep the empirical interior
tails = {c: {"upper": fit_pot(Z[c].values),
             "lower": fit_pot(-Z[c].values)} for c in Z}`}
        />
        <P>
          A positive shape <InlineCode>ξ</InlineCode> means a genuinely heavy, power-law tail — the
          signature of financial returns, and the thing a normal distribution flatly denies.
        </P>
      </Section>

      <Section id="copula" n={5} title="Calibrating the t-copula">
        <P>
          Margins describe each asset alone; the <Term>copula</Term> describes how they move
          together. A Gaussian copula has zero tail dependence — it assumes that in the worst
          moments, assets decouple. They do the opposite. The Student-t copula adds a
          degrees-of-freedom parameter <InlineCode>ν</InlineCode> that controls
          <Term>tail dependence</Term>: low <InlineCode>ν</InlineCode>, more joint crashes.
        </P>
        <CodeBlock
          file="04_copula.py"
          code={`from scipy.stats import t as student_t, rankdata

# pseudo-observations: rank-transform residuals to (0,1) uniforms
U = Z.apply(lambda s: rankdata(s) / (len(s) + 1)).values
nu = 6                                                 # dof (calibrate via MLE)
tq = student_t.ppf(U, df=nu)                           # to t-space
corr = np.corrcoef(tq, rowvar=False)                   # copula correlation`}
        />
      </Section>

      <Section id="simulate" n={6} title="Monte Carlo simulation">
        <P>
          Draw many joint scenarios from the calibrated copula, then push each draw back through the
          inverse margins to recover residuals with the right tails <Term>and</Term> the right
          co-movement. Finally re-inflate by the GARCH one-day volatility forecast to return to
          return space.
        </P>
        <CodeBlock
          file="05_simulate.py"
          code={`from scipy.stats import chi2

def t_copula_sample(corr, nu, n):
    L = np.linalg.cholesky(corr)
    g = (L @ np.random.standard_normal((corr.shape[0], n))).T
    w = np.sqrt(nu / chi2.rvs(nu, size=(n, 1)))
    return student_t.cdf(g * w, df=nu)                 # uniforms in (0,1)

def inv_margin(u, z, tail):                            # empirical body + GPD tails
    out = np.quantile(z, u)                            # interior
    up = u > 0.95
    out[up] = tail["upper"][0] + genpareto.ppf(
        (u[up] - 0.95) / 0.05, tail["upper"][1], scale=tail["upper"][2])
    return out

n = 100_000
U_sim = t_copula_sample(corr, nu, n)
sim = np.column_stack([inv_margin(U_sim[:, k], Z[c].values, tails[c])
                       for k, c in enumerate(Z)])
sim_rets = sim * np.array(list(sigma_fcast.values())) / 100   # re-inflate`}
        />
      </Section>

      <Section id="var" n={7} title="Portfolio VaR & CVaR">
        <P>
          Aggregate to the portfolio and read the tail. <Term>VaR</Term> is the quantile of the loss;
          <Term>CVaR</Term> (expected shortfall) is the average loss beyond it — coherent, and what
          regulators now prefer.
        </P>
        <CodeBlock
          file="06_var.py"
          code={`pnl = sim_rets @ weights                # simulated 1-day portfolio returns
loss = -pnl

for a in (0.95, 0.99):
    var = np.quantile(loss, a)
    cvar = loss[loss >= var].mean()
    print(f"{a:.0%}  VaR {var:.2%}   CVaR {cvar:.2%}")`}
        />
        <DataTable
          head={["Level", "Gaussian VaR", "EVT + t-copula VaR", "EVT CVaR"]}
          rows={[
            ["95%", "1.92%", "2.14%", "3.05%"],
            ["99%", "2.71%", "3.63%", "4.88%"],
          ]}
        />
        <Figure
          caption="Simulated 1-day loss distribution — the tail the Gaussian misses (illustrative)"
          legend={[{ label: "99% VaR", tone: "aqua" }, { label: "Gaussian", tone: "muted" }]}
        >
          <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label="A fat-tailed loss histogram sits above the thin Gaussian tail, with the 99% VaR marked deeper in the tail.">
            <path d="M0,185 C120,180 180,150 260,96 C300,70 320,64 340,70 C400,96 460,150 540,180 L600,185" fill="#4a4a42" fillOpacity="0.10" stroke="#4a4a42" strokeOpacity="0.55" strokeWidth="1.3" />
            <path className="draw-on-view" d="M30,185 C150,182 200,150 270,96 C300,72 322,66 344,74 C420,108 470,156 600,178" fill="none" stroke="#0a8a8a" strokeWidth="2.2" />
            <line x1="500" y1="40" x2="500" y2="185" stroke="#0a8a8a" strokeWidth="1.4" strokeDasharray="4 4" />
            <text x="494" y="36" textAnchor="end" className="t-mono" fontSize="12" fill="#0a8a8a">99% VaR</text>
          </svg>
        </Figure>
      </Section>

      <Section id="interpretation" n={8} title="What the numbers say">
        <P>
          The Gaussian model understates 99% VaR by roughly a quarter and has no concept of
          expected shortfall worth trusting. The EVT + t-copula pipeline pushes the tail out to
          where it belongs and, crucially, captures that the assets sink together. That gap is not
          academic — it is the difference between a risk limit that holds in a crisis and one that is
          breached on the first bad day.
        </P>
        <Callout kind="Caveats">
          The pipeline has moving parts: the POT threshold, the copula dof, and the GARCH spec all
          carry model risk. Backtest the resulting VaR (next article) and stress the threshold — a
          tail model you have not backtested is a guess with extra steps.
        </Callout>
      </Section>

      <References
        items={[
          "McNeil, A. J. & Frey, R. (2000). Estimation of Tail-Related Risk Measures for Heteroscedastic Financial Time Series: an Extreme Value Approach. Journal of Empirical Finance, 7.",
          "McNeil, Frey & Embrechts (2015). Quantitative Risk Management: Concepts, Techniques and Tools. Princeton.",
          "Embrechts, P., Klüppelberg, C. & Mikosch, T. (1997). Modelling Extremal Events for Insurance and Finance.",
        ]}
      />
    </>
  );
}
