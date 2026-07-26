import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References, Pipeline } from "@/components/article/prose";
import { LineChart, BarChart } from "@/components/charts/DataCharts";
import d from "./data/risk-parity-from-scratch";

/* T07 / topic card 07-16 — all figures below render REAL computed results
   (SPY · TLT · GLD · DBC, Jan 2010 – Dec 2024) baked in by
   quant/tutorials/t07_risk_parity.py. */

const pc = (v: number, nd = 1) => `${(v * 100).toFixed(nd)}%`;

export default function RiskParityFromScratch() {
  const assets = d.params.assets as unknown as string[];

  return (
    <>
      <Lead>
        A portfolio that puts 25% of its capital in each of four assets looks diversified — until
        you measure it in risk instead of dollars. Risk parity flips the question: instead of
        asking how much <Term>money</Term> each asset gets, it asks how much <Term>risk</Term> each
        asset contributes, and equalises that. We build the equal-risk-contribution portfolio from
        scratch with SciPy, validate it against Riskfolio-Lib&apos;s industrial solver, and backtest
        the all-weather blueprint over fifteen years.
      </Lead>

      <Pipeline
        steps={[
          "Download SPY · TLT · GLD · DBC adjusted closes, 2010–2024 (yfinance)",
          "Decompose portfolio variance into per-asset risk contributions",
          "Solve equal-risk-contribution weights with scipy.optimize (SLSQP)",
          "Validate the weights against Riskfolio-Lib's risk-parity optimizer",
          "Backtest monthly-rebalanced risk parity vs 60/40 vs equal weight",
          "Price the punchline: the leverage needed to match 60/40's volatility",
        ]}
      />

      <Section id="idea" n={1} title="Allocate risk, not dollars">
        <P>
          The classic 60/40 stock–bond portfolio devotes 40% of its <Term>capital</Term> to bonds —
          but on our 2010–2024 sample, SPY accounts for <InlineCode>{pc(d.naive.spyShareIn6040)}</InlineCode>{" "}
          of its <Term>risk</Term>. The bonds are ballast in name only: when equities sell off,
          60/40 behaves like an equity portfolio, because in risk terms that is what it is. Risk
          parity — the idea behind Bridgewater&apos;s All Weather and a family of institutional
          products managing hundreds of billions — allocates so that every asset contributes the
          same share of portfolio risk.
        </P>
        <Callout kind="Why practitioners care">
          Risk contributions are the lingua franca of institutional portfolio construction: risk
          budgeting, factor allocation, and drawdown attribution all start from the same
          decomposition. Even if you never run a risk-parity fund, you should know exactly where
          your portfolio&apos;s variance comes from — and be suspicious of any allocation whose
          risk you have not decomposed.
        </Callout>
      </Section>

      <Section id="contributions" n={2} title="Risk contributions, defined">
        <P>
          Portfolio variance decomposes exactly across assets. With weights{" "}
          <InlineCode>w</InlineCode> and covariance <InlineCode>Σ</InlineCode>, asset{" "}
          <InlineCode>i</InlineCode>&apos;s <Term>risk contribution share</Term> is{" "}
          <InlineCode>RC_i = w_i (Σw)_i / (wᵀΣw)</InlineCode> — and the shares sum to one, by
          construction. It is three lines of NumPy:
        </P>
        <CodeBlock
          file="risk_contrib.py"
          code={`def risk_contrib(w, cov):
    """RC_i = w_i (Sigma w)_i / (w' Sigma w) — shares sum to 1."""
    return w * (cov @ w) / (w @ cov @ w)

w_eq = np.full(4, 0.25)                 # naive: 25% capital each
rc_eq = risk_contrib(w_eq, cov)         # ...but risk is NOT 25% each`}
        />
        <P>
          Applied to the naive 25%-each portfolio of SPY, TLT, GLD and DBC, the decomposition is
          the whole motivation for this tutorial. Treasuries — the asset you bought as the
          diversifier — contribute just <InlineCode>{pc(d.naive.riskContrib[1])}</InlineCode> of
          the risk, while the three growth- and inflation-sensitive assets carry the other{" "}
          <InlineCode>{pc(1 - d.naive.riskContrib[1])}</InlineCode> between them:
        </P>
        <Figure
          caption="Equal capital ≠ equal risk — the 25%-each portfolio, decomposed"
          legend={[
            { label: "capital weight", tone: "aqua" },
            { label: "risk contribution", tone: "muted" },
          ]}
        >
          <BarChart
            ariaLabel="Bar chart comparing capital weights and risk contributions for four assets: all capital weights are 25 percent, but risk contributions range from 11 percent for TLT to 33 percent for DBC."
            labels={assets}
            groups={[
              { values: d.naive.weights as unknown as number[], color: "teal" },
              { values: d.naive.riskContrib as unknown as number[], color: "rust" },
            ]}
            yFmt={(v) => pc(v, 0)}
          />
        </Figure>
        <P>
          Note that no single asset&apos;s volatility explains this — the annualised vols sit in a
          narrow band ({pc(d.params.annVols.TLT)} to {pc(d.params.annVols.DBC)}). Correlations do
          the damage: SPY and DBC move together, so each amplifies the other&apos;s contribution,
          while TLT&apos;s negative-to-flat correlation with equities cancels most of its own.
        </P>
      </Section>

      <Section id="solve" n={3} title="Solving for equal risk (SciPy)">
        <P>
          The <Term>equal-risk-contribution</Term> (ERC) portfolio sets every{" "}
          <InlineCode>RC_i = 1/n</InlineCode>. For a general covariance matrix there is no closed
          form, but the problem is small and smooth: minimise the sum of squared deviations of the
          risk contributions from <InlineCode>1/n</InlineCode>, subject to long-only and
          fully-invested constraints. SLSQP dispatches it in milliseconds:
        </P>
        <CodeBlock
          file="solve_erc.py"
          code={`from scipy.optimize import minimize

def solve_erc(cov):
    n = cov.shape[0]
    objective = lambda w: np.sum((risk_contrib(w, cov) - 1/n) ** 2)
    res = minimize(objective, np.full(n, 1/n), method="SLSQP",
                   bounds=[(0, 1)] * n,
                   constraints=[{"type": "eq", "fun": lambda w: w.sum() - 1}],
                   options={"maxiter": 1000, "ftol": 1e-16})
    assert res.success, res.message
    return res.x`}
        />
        <P>
          The solution overweights the low-risk, low-correlation asset (TLT at{" "}
          <InlineCode>{pc(d.erc.weights[1])}</InlineCode>) and trims the two commodity legs to
          about {pc(d.erc.weights[3], 0)} each. Re-running the decomposition on the solved weights
          confirms the definition: four flat bars at 25%.
        </P>
        <Figure
          caption="The ERC portfolio — weights chosen so every asset contributes 25% of the risk"
          legend={[
            { label: "ERC weight", tone: "aqua" },
            { label: "risk contribution", tone: "muted" },
          ]}
        >
          <BarChart
            ariaLabel="Bar chart of ERC weights and their risk contributions: weights vary from 21 to 33 percent while all four risk contributions are exactly 25 percent."
            labels={assets}
            groups={[
              { values: d.erc.weights as unknown as number[], color: "teal" },
              { values: d.erc.riskContrib as unknown as number[], color: "rust" },
            ]}
            yFmt={(v) => pc(v, 0)}
          />
        </Figure>
        <Callout kind="Note">
          This is <Term>classic</Term> risk parity: one covariance matrix, one optimisation. Its
          machine-learning cousin — hierarchical risk parity — replaces the optimiser with
          correlation clustering and recursive bisection, trading exactness for robustness to
          covariance estimation error. Different tool, same underlying creed: allocate risk, not
          dollars.
        </Callout>
      </Section>

      <Section id="validate" n={4} title="Validation: Riskfolio-Lib agrees">
        <P>
          Never ship a hand-rolled optimizer without a second opinion. Riskfolio-Lib solves the
          same ERC problem via a convex reformulation with a conic solver — a completely different
          algorithm, so agreement is strong evidence both are right:
        </P>
        <CodeBlock
          file="validate.py"
          code={`import riskfolio as rp

port = rp.Portfolio(returns=rets)
port.assets_stats(method_mu="hist", method_cov="hist")
w_rf = port.rp_optimization(model="Classic", rm="MV",
                            rf=0, b=None, hist=True)   # b=None -> equal budgets`}
        />
        <DataTable
          head={["Asset", "SciPy SLSQP", "Riskfolio-Lib", "|diff|"]}
          rows={assets.map((a, i) => [
            a,
            d.erc.scipyWeights[i].toFixed(6),
            d.erc.riskfolioWeights[i].toFixed(6),
            Math.abs(d.erc.scipyWeights[i] - d.erc.riskfolioWeights[i]).toExponential(1),
          ])}
        />
        <P>
          Maximum absolute weight difference: <InlineCode>{d.erc.maxDiff.toExponential(2)}</InlineCode> —
          agreement to the sixth decimal, far inside the 1e-3 tolerance we demanded. The two
          solvers share nothing but the covariance matrix.
        </P>
      </Section>

      <Section id="backtest" n={5} title="Fifteen years, three portfolios">
        <P>
          Now the test that matters: three constant-mix portfolios — ERC risk parity, 60/40
          (SPY/TLT), and 25%-each equal weight — rebalanced back to target at every month-end,
          {" "}{d.params.start.slice(0, 4)}–{d.params.end.slice(0, 4)}. The sample spans the
          post-GFC equity bull, the 2013 taper tantrum, COVID, and the 2022 twin crash in stocks
          and bonds.
        </P>
        <Figure
          caption="Growth of $100, monthly rebalanced, 2010–2024"
          legend={[
            { label: "risk parity", tone: "aqua" },
            { label: "60/40 · equal weight", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Growth of 100 dollars from 2010 to 2024: 60/40 ends near 408, risk parity near 252 and equal weight near 252, with risk parity showing visibly shallower drawdowns."
            series={[
              { y: d.growth.ew as unknown as number[], color: "amber", width: 1.4, opacity: 0.8 },
              { y: d.growth.b6040 as unknown as number[], color: "graphite", width: 1.6 },
              { y: d.growth.rp as unknown as number[], color: "teal", width: 2.2 },
            ]}
            xLabels={d.growth.xLabels as unknown as [number, string][]}
            h={250}
            yFmt={(v) => `$${v.toFixed(0)}`}
          />
        </Figure>
        <DataTable
          head={["Metric", "Risk parity", "60/40", "Equal weight"]}
          rows={[
            ["Ann. return", pc(d.stats.rp.annRet), pc(d.stats.b6040.annRet), pc(d.stats.ew.annRet)],
            ["Ann. volatility", pc(d.stats.rp.annVol), pc(d.stats.b6040.annVol), pc(d.stats.ew.annVol)],
            ["Sharpe (rf = 0)", d.stats.rp.sharpe.toFixed(2), d.stats.b6040.sharpe.toFixed(2), d.stats.ew.sharpe.toFixed(2)],
            ["Max drawdown", pc(d.stats.rp.maxDD), pc(d.stats.b6040.maxDD), pc(d.stats.ew.maxDD)],
            ["Leverage to 60/40 vol", `${d.stats.leverage.factor.toFixed(2)}×`, "1.00×", "—"],
          ]}
        />
        <P>
          Read the table honestly. Against its fair benchmark — equal weight, the same four assets
          with no optimisation — risk parity wins on every line: higher Sharpe
          ({d.stats.rp.sharpe.toFixed(2)} vs {d.stats.ew.sharpe.toFixed(2)}) from the same
          building blocks. Against 60/40 it delivers what it promises, a materially smoother ride:
          volatility of {pc(d.stats.rp.annVol)} vs {pc(d.stats.b6040.annVol)} and a maximum
          drawdown of {pc(d.stats.rp.maxDD)} vs {pc(d.stats.b6040.maxDD)}. But this particular
          sample was a golden era for US 60/40, and unlevered risk parity returned{" "}
          {pc(d.stats.rp.annRet)} against 60/40&apos;s {pc(d.stats.b6040.annRet)} — which brings us
          to the debate.
        </P>
        <Callout kind="Honest caveat">
          The ERC weights above use the full-sample covariance — fine for demonstrating the risk
          profile, but a live strategy re-estimates Σ on a rolling window and inherits estimation
          noise. Risk-parity weights are unusually stable to that noise (they depend only on
          covariances, never on expected returns), which is a large part of their practical appeal.
        </Callout>
      </Section>

      <Section id="leverage" n={6} title="The leverage debate">
        <P>
          Equalising risk means owning a lot of the quiet asset: our ERC portfolio holds{" "}
          {pc(d.erc.weights[1])} bonds and runs at just {pc(d.stats.rp.annVol)} volatility. That
          is the source of both risk parity&apos;s smoothness and its return gap. The institutional
          answer — Bridgewater&apos;s All Weather, AQR&apos;s risk-parity funds — is to{" "}
          <Term>lever</Term> the high-Sharpe, low-vol portfolio up to an equity-like risk level. On
          our numbers, matching 60/40&apos;s {pc(d.stats.b6040.annVol)} volatility takes{" "}
          {d.stats.leverage.factor.toFixed(2)}× leverage, lifting the (rf = 0, financing-free)
          return to roughly {pc(d.stats.leverage.leveredRet)}.
        </P>
        <P>
          That arithmetic is the entire debate in miniature. Levered risk parity is a bet that
          borrowing stays cheap and that bonds keep diversifying equities — both held for most of
          2010–2021, and both broke at once in 2022, when rates spiked and the levered bond-heavy
          book drew down alongside stocks. Risk parity does not abolish risk; it converts
          concentration risk into leverage-and-correlation risk. Whether that trade is a good one
          is a view, not a theorem — but now you can compute exactly what is being traded.
        </P>
      </Section>

      <References
        items={[
          "Qian, E. (2005). Risk Parity Portfolios: Efficient Portfolios Through True Diversification. PanAgora Asset Management.",
          "Maillard, S., Roncalli, T., & Teïletche, J. (2010). The Properties of Equally Weighted Risk Contribution Portfolios. Journal of Portfolio Management, 36(4), 60–70.",
          "Roncalli, T. (2013). Introduction to Risk Parity and Budgeting. Chapman & Hall/CRC.",
          <span key="nb">Companion notebook: <InlineCode>risk-parity-from-scratch.ipynb</InlineCode> — builds the ERC weights with SciPy, validates against Riskfolio-Lib, and reproduces every figure from raw data.</span>,
        ]}
      />
    </>
  );
}
