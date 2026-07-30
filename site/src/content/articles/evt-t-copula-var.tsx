import { Section, Lead, P, InlineCode, Term, Pipeline, Callout, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";
import { ScatterChart, Histogram } from "@/components/charts/DataCharts";
import d from "./data/evt-t-copula-var";

/* Legacy upgrade — all figures below render REAL computed results
   (^GSPC + ^FTSE 2000–2024, GARCH-t → GPD tails → t-copula, seeded MC)
   baked in by quant/legacy/evt_tcopula.py. */

const pc = (v: number, nd = 2) => `${(v * 100).toFixed(nd)}%`;

export default function EvtTCopulaVar() {
  const gspc = d.garch["^GSPC"];
  const ftse = d.garch["^FTSE"];
  return (
    <>
      <Lead>
        This is the reference tail-risk pipeline — the one risk desks actually run — rebuilt
        faithfully in Python and pointed at real data: a 60/40 book of the S&P 500 and the FTSE 100
        over {d.params.nObs.toLocaleString()} joint trading days, {d.params.start} to {d.params.end}.
        It refuses the two comforting lies of basic VaR: that volatility is constant, and that joint
        losses are Gaussian. Instead it filters volatility with a GARCH, models each tail with
        Extreme Value Theory, and binds the assets with a t-copula that keeps its grip precisely
        when markets crash together.
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
          returns. We carry a two-asset basket through the whole pipeline: {pc(d.params.weights[0], 0)}{" "}
          S&P 500, {pc(d.params.weights[1], 0)} FTSE 100, on the days both markets traded — a
          quarter century containing dot-com, 2008, the euro crisis, COVID and 2022.
        </P>
        <CodeBlock
          file="01_returns.py"
          code={`import numpy as np
import pandas as pd
import yfinance as yf

prices = yf.download(["^GSPC", "^FTSE"], start="2000-01-01",
                     end="2025-01-01", auto_adjust=True,
                     progress=False)["Close"].dropna()
rets = np.log(prices / prices.shift(1)).dropna()   # ${d.params.nObs.toLocaleString()} joint days
weights = np.array([0.6, 0.4])                     # portfolio weights`}
        />
      </Section>

      <Section id="garch" n={3} title="GARCH-t volatility filtering">
        <P>
          Returns are not identically distributed — volatility clusters. If you skip this step, your
          tail model fits a mixture of calm and stormy days and gets both wrong. Fit an
          AR(0)–GARCH(1,1) with Student-t innovations per asset and extract the
          <Term>standardised residuals</Term> <InlineCode>z = ε / σ̂</InlineCode>, which are much
          closer to i.i.d. On our data both fits are textbook: persistence{" "}
          <InlineCode>α + β = {(gspc.alpha + gspc.beta).toFixed(3)}</InlineCode> for the S&P and{" "}
          <InlineCode>{(ftse.alpha + ftse.beta).toFixed(3)}</InlineCode> for the FTSE, with
          innovation tails of <InlineCode>ν ≈ {gspc.nu}</InlineCode> and{" "}
          <InlineCode>ν ≈ {ftse.nu}</InlineCode>. The one-day-ahead volatility forecasts —{" "}
          {pc(gspc.sigmaFcast)} and {pc(ftse.sigmaFcast)} — are what will re-inflate the simulation
          at the end.
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
          signature of financial returns, and the thing a normal distribution flatly denies. Both
          loss tails come back positive here: <InlineCode>ξ = {d.tails["^GSPC"].lossXi}</InlineCode>{" "}
          for the S&P and <InlineCode>ξ = {d.tails["^FTSE"].lossXi}</InlineCode> for the FTSE, each
          fitted on {d.tails["^GSPC"].nExceed} exceedances — while both <Term>gain</Term> tails fit
          negative ξ. Losses are structurally heavier than gains. The QQ plot is the honesty check:
        </P>
        <Figure
          caption={`^GSPC loss-tail exceedances vs the fitted GPD (ξ = ${d.tails["^GSPC"].lossXi}, β = ${d.tails["^GSPC"].lossBeta}) — points on the diagonal mean the tail model fits`}
          legend={[{ label: "45° line", tone: "aqua" }, { label: "quantile pairs", tone: "muted" }]}
        >
          <ScatterChart
            ariaLabel="QQ plot of empirical excess quantiles against fitted GPD quantiles for the S&P 500 loss tail: the points hug the 45-degree line across the whole range, deviating only slightly at the most extreme values."
            points={[{ xy: d.qq.points as unknown as [number, number][], color: "graphite", r: 2.4, opacity: 0.6 }]}
            lines={[{ xy: [[0, 0], [d.qq.lim, d.qq.lim]] as [number, number][], color: "teal", dash: "5 4", width: 1.6 }]}
            xLabel="GPD quantile"
            yLabel="empirical quantile"
            h={260}
          />
        </Figure>
      </Section>

      <Section id="copula" n={5} title="Calibrating the t-copula">
        <P>
          Margins describe each asset alone; the <Term>copula</Term> describes how they move
          together. A Gaussian copula has zero tail dependence — it assumes that in the worst
          moments, assets decouple. They do the opposite. The Student-t copula adds a
          degrees-of-freedom parameter <InlineCode>ν</InlineCode> that controls
          <Term>tail dependence</Term>: low <InlineCode>ν</InlineCode>, more joint crashes. Pin the
          correlation robustly through Kendall’s τ, then profile the likelihood over ν: our
          pseudo-observations give <InlineCode>τ = {d.copula.tau}</InlineCode> →{" "}
          <InlineCode>ρ = {d.copula.rho}</InlineCode> and <InlineCode>ν̂ = {d.copula.nu}</InlineCode>,
          and the t-copula beats the Gaussian limit by {Math.round(d.copula.llT - d.copula.llGauss)}{" "}
          log-likelihood points — decisive evidence of tail dependence.
        </P>
        <CodeBlock
          file="04_copula.py"
          code={`from scipy.stats import t as student_t, rankdata

# pseudo-observations: rank-transform residuals to (0,1) uniforms
U = Z.apply(lambda s: rankdata(s) / (len(s) + 1)).values

tau = Z.iloc[:, 0].corr(Z.iloc[:, 1], method="kendall")
rho = np.sin(np.pi * tau / 2)                          # Kendall inversion

# profile the copula log-likelihood over nu -> nu_hat = ${d.copula.nu}
nus = np.arange(2.5, 30.5, 0.5)
nu = nus[np.argmax([tcopula_loglik(student_t.ppf(U, v), rho, v)
                    for v in nus])]`}
        />
      </Section>

      <Section id="simulate" n={6} title="Monte Carlo simulation">
        <P>
          Draw many joint scenarios from the calibrated copula, then push each draw back through the
          inverse margins to recover residuals with the right tails <Term>and</Term> the right
          co-movement. Finally re-inflate by the GARCH one-day volatility forecast to return to
          return space. Everything is seeded ({d.params.seed}), so the {d.params.nSim.toLocaleString()}{" "}
          scenarios below are exactly reproducible.
        </P>
        <CodeBlock
          file="05_simulate.py"
          code={`from scipy.stats import chi2

rng = np.random.default_rng(${d.params.seed})

def t_copula_sample(rho, nu, n):
    L = np.linalg.cholesky(np.array([[1, rho], [rho, 1]]))
    g = (L @ rng.standard_normal((2, n))).T
    w = np.sqrt(nu / chi2.rvs(nu, size=(n, 1), random_state=rng))
    return student_t.cdf(g * w, df=nu)                 # uniforms in (0,1)

def inv_margin(u, z, lo, hi, q=0.95):                  # body + both GPD tails
    out = np.quantile(z, u)                            # empirical interior
    up = u > q
    out[up] = hi[0] + genpareto.ppf((u[up] - q) / (1 - q), hi[1], scale=hi[2])
    dn = u < 1 - q
    out[dn] = -(lo[0] + genpareto.ppf((1 - q - u[dn]) / (1 - q),
                                      lo[1], scale=lo[2]))
    return out

U_sim = t_copula_sample(rho, nu, ${d.params.nSim})
sim = np.column_stack([inv_margin(U_sim[:, k], Z[c].values,
                                  tails[c]["lower"], tails[c]["upper"])
                       for k, c in enumerate(Z)])
sim_rets = sim * np.array(list(sigma_fcast.values())) / 100   # re-inflate`}
        />
      </Section>

      <Section id="var" n={7} title="Portfolio VaR & CVaR">
        <P>
          Aggregate to the portfolio and read the tail. <Term>VaR</Term> is the quantile of the loss;
          <Term>CVaR</Term> (expected shortfall) is the average loss beyond it — coherent, and what
          regulators now prefer. Three answers to the same question: unconditional historical
          simulation, the conditional Gaussian (variance–covariance on the same volatility
          forecasts), and the full EVT + t-copula simulation.
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
          head={["Level", "Historical VaR", "Gaussian VaR", "EVT + t-copula VaR", "EVT CVaR"]}
          rows={[
            ["95%", pc(d.var["95"].hist), pc(d.var["95"].gauss), pc(d.var["95"].tcop), pc(d.var["95"].tcopCvar)],
            ["99%", pc(d.var["99"].hist), pc(d.var["99"].gauss), pc(d.var["99"].tcop), pc(d.var["99"].tcopCvar)],
          ]}
        />
        <Figure
          caption={`Simulated 1-day loss distribution, ${d.params.nSim.toLocaleString()} scenarios — the tail the Gaussian misses`}
          legend={[{ label: "Gaussian density", tone: "aqua" }, { label: "simulated", tone: "muted" }]}
        >
          <Histogram
            ariaLabel="Histogram of simulated one-day portfolio losses with a Gaussian curve overlaid: the simulated distribution is more peaked and carries visibly more mass in the far loss tail, where the 99 percent VaR markers sit — the t-copula VaR clearly beyond the Gaussian one."
            binEdges={d.histogram.edges as unknown as number[]}
            counts={d.histogram.counts as unknown as number[]}
            overlay={{ y: d.histogram.gauss as unknown as number[] }}
            vLines={[
              { v: d.histogram.var99gauss, label: "Gauss 99%", color: "graphite", dash: "3 3" },
              { v: d.histogram.var99tcop, label: "t-cop 99%", color: "rust" },
            ]}
            xFmt={(v) => `${v.toFixed(0)}%`}
          />
        </Figure>
      </Section>

      <Section id="interpretation" n={8} title="What the numbers say">
        <P>
          The Gaussian model understates 99% VaR by {pc(d.gap99, 1)} on the very same volatility
          forecasts ({pc(d.var["99"].gauss)} vs {pc(d.var["99"].tcop)}) and has no concept of
          expected shortfall worth trusting — the EVT CVaR sits at {pc(d.var["99"].tcopCvar)}. The
          unconditional historical number ({pc(d.var["99"].hist)}) looks bigger still, but it is
          answering a different question: it averages 2008 and COVID into today regardless of the
          current regime, which is precisely what the conditional pipeline is built to avoid. The
          EVT + t-copula pipeline pushes the tail out to where it belongs and, crucially, captures
          that the assets sink together (ν̂ = {d.copula.nu}). That gap is not academic — it is the
          difference between a risk limit that holds in a crisis and one that is breached on the
          first bad day.
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
