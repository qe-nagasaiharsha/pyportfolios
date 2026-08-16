import { Section, SubSection, Lead, P, Bullets, Callout, CodeBlock, DataTable, Figure, Formula } from "@/components/article/prose";
import { LOAD_CODE, RC_CODE, SOLVE_CODE, VALIDATE_CODE, LEVERAGE_CODE } from "./rp-code";
import { Bar } from "@/components/charts/echarts/Bar";
import d from "./data/risk-parity-from-scratch";

export default function RiskParityFutures() {
  return (
    <>
      <Lead>
        A traditional 60/40 portfolio looks balanced by <em>capital</em> — but not by <em>risk</em>.
        Because equities are ~3× as volatile as bonds, that 60/40 actually derives ~90% of its risk
        from stocks. <b>Risk parity</b> flips the question: instead of asking how much money each
        asset gets, it asks how much <em>risk</em> each contributes — and equalizes it. Futures are
        the natural vehicle, since risk parity leans on leverage to lift low-vol assets to their
        weight.
      </Lead>

      <Section id="summary" n={1} title="Summary">
        <P>
          Every asset in a portfolio contributes some share of the total risk — and those shares are
          rarely equal. Risk parity finds the weights that make each asset&apos;s{" "}
          <b>risk contribution</b> identical, so no single position dominates the portfolio&apos;s
          fate. Because low-volatility assets (bonds) need large weights to pull their risk-weight
          up, risk parity portfolios are typically <b>levered</b> to reach an equity-like return —
          which is exactly why they&apos;re built with futures.
        </P>
      </Section>

      <Section id="intuition" n={2} title="Intuition">
        <SubSection label="2.1" title="Capital weight ≠ risk weight">
          <P>
            Put 60% in stocks (15% vol) and 40% in bonds (5% vol). The stock sleeve&apos;s risk is
            60%×15% = 9 &ldquo;units&rdquo;; the bond sleeve&apos;s is 40%×5% = 2. Stocks supply
            ~80–90% of the total. Your &ldquo;balanced&rdquo; portfolio is a stock portfolio wearing
            a bond costume.
          </P>
        </SubSection>

        <SubSection label="2.2" title="Equalize the risk, not the dollars">
          <P>
            Risk parity down-weights the volatile assets and up-weights the calm ones until each
            contributes the same risk. The equity slice shrinks; bonds, gold and rates grow. The
            portfolio finally becomes diversified in the way that matters — by{" "}
            <em>source of risk</em>.
          </P>
        </SubSection>

        <SubSection label="2.3" title="Leverage is a feature, not a bug">
          <P>
            A risk-balanced portfolio is dominated by low-vol assets, so its raw volatility (and
            return) is low. To reach an equity-like target you scale the whole thing up with leverage
            — cheap and clean in futures. This is the mechanism behind &ldquo;All
            Weather&rdquo;-style funds.
          </P>
        </SubSection>
      </Section>

      <Section id="mechanics" n={3} title="Theory & Mechanics">
        <P>
          For weights <Formula>{String.raw`w`}</Formula> and covariance{" "}
          <Formula>{String.raw`\Sigma`}</Formula>, portfolio volatility is{" "}
          <Formula>{String.raw`\sigma_p = \sqrt{w^\top\Sigma w}`}</Formula>. Each asset&apos;s{" "}
          <b>marginal risk contribution</b> is:
        </P>
        <Formula block>{String.raw`MRC_i = \frac{\partial \sigma_p}{\partial w_i} = \frac{(\Sigma w)_i}{\sigma_p}, \qquad RC_i = w_i \cdot MRC_i`}</Formula>
        <P>
          and the <Formula>{String.raw`RC_i`}</Formula> sum exactly to{" "}
          <Formula>{String.raw`\sigma_p`}</Formula> (Euler&apos;s theorem).{" "}
          <b>Risk parity</b> seeks weights where all <Formula>{String.raw`RC_i`}</Formula> are equal:
        </P>
        <Formula block>{String.raw`RC_i = \frac{\sigma_p}{n} \quad \forall i`}</Formula>
        <P>
          There&apos;s no closed form, so we minimize the dispersion of risk contributions
          numerically — first by hand in SciPy, then cross-checked with <b>Riskfolio-lib</b>.
        </P>
      </Section>

      <Section id="example" n={4} title="Applied Example — Five Futures">
        <SubSection label="4.1" title="A cross-asset futures universe">
          <P>
            Five liquid futures spanning the major risk factors — equities, rates, and three
            commodities:
          </P>
          <DataTable
            variant="prose"
            head={["Ticker", "Contract", "Class"]}
            rows={[
              ["ES=F", "S&P 500 E-mini", "Equity"],
              ["ZN=F", "10y T-Note", "Rates"],
              ["GC=F", "Gold", "Metal (haven)"],
              ["HG=F", "Copper", "Metal (cyclical)"],
              ["CL=F", "WTI Crude", "Energy"],
            ]}
          />
          <CodeBlock code={LOAD_CODE} />
          <DataTable
            head={["Contract", "Ann. volatility"]}
            rows={[
              ["S&P 500", "17.9%"],
              ["10y Note", "5.5%"],
              ["Gold", "14.7%"],
              ["Copper", "22.1%"],
              ["WTI", "114.9%"],
            ]}
          />
          <Callout kind="Data note">
            Continuous <code>=F</code> series include roll gaps — and WTI&apos;s eye-watering 114.9%
            vol is dominated by the April 2020 episode, when the front-month contract briefly traded{" "}
            <em>negative</em> and daily percentage returns exploded. Fine for illustrating
            risk-parity mechanics (it makes the concentration problem vivid); production would use a
            back-adjusted series.
          </Callout>
        </SubSection>

        <SubSection label="4.2" title="The problem with equal weight">
          <P>
            Start naive: put 20% in each future. Watch how unequal the <em>risk</em> contributions
            are — crude alone supplies 87% of the portfolio&apos;s risk, while the 10y note
            contributes essentially nothing:
          </P>
          <CodeBlock code={RC_CODE} />
          <DataTable
            head={["Contract", "Weight", "Risk contrib", "Risk share"]}
            rows={[
              ["S&P 500", "20%", "0.011", "4.4%"],
              ["10y Note", "20%", "−0.000", "−0.0%"],
              ["Gold", "20%", "0.006", "2.4%"],
              ["Copper", "20%", "0.016", "6.3%"],
              ["WTI", "20%", "0.219", "86.9%"],
            ]}
          />
          <P>
            Portfolio vol is 25.2%, and the risk shares range from −0% to 87% — &ldquo;equal
            weight&rdquo; is a crude-oil bet in disguise. (The note&apos;s share is slightly{" "}
            <em>negative</em>: its co-movement with the rest actually subtracts risk.)
          </P>
        </SubSection>

        <SubSection label="4.3" title="Solve risk parity from scratch (SciPy)">
          <P>
            Minimize the squared dispersion of risk contributions. At the optimum, every asset
            supplies exactly 1/n of the total risk.
          </P>
          <CodeBlock code={SOLVE_CODE} />
          <DataTable
            head={["Contract", "RP weight", "Risk share"]}
            rows={[
              ["S&P 500", "15.6%", "20.0%"],
              ["10y Note", "55.2%", "20.0%"],
              ["Gold", "15.7%", "20.0%"],
              ["Copper", "11.1%", "20.0%"],
              ["WTI", "2.4%", "20.0%"],
            ]}
          />
          <P>
            All five risk shares land on exactly 20%. The allocation inverts the vol ranking: the
            calm 10y note gets 55% of the capital, wild WTI just 2.4% — and portfolio vol drops from
            25.2% to 6.9%.
          </P>
          <Figure caption="Figure 4.3 · Capital weight vs risk share — equal weight vs risk parity">
            <Bar
              ariaLabel="Share of portfolio risk per asset under equal weighting and under risk parity; equal weights give every asset the same capital but very different risk shares, while risk parity equalises them"
              height={250}
              labels={[...d.params.assets]}
              series={[
                { name: "equal weight", values: d.naive.riskContrib.map((v) => v * 100), color: "graphite" },
                { name: "risk parity", values: d.erc.riskContrib.map((v) => v * 100), color: "teal" },
              ]}
              yFmt={{ decimals: 0, suffix: "%" }}
              xName="Asset"
              yName="Share of portfolio risk"
            />
          </Figure>
        </SubSection>

        <SubSection label="4.4" title="Validate with Riskfolio-lib">
          <P>
            Our hand-rolled solution should match the library&apos;s dedicated risk-parity optimizer
            to within solver tolerance — and it does, to 7.5 × 10⁻⁶:
          </P>
          <CodeBlock code={VALIDATE_CODE} />
          <DataTable
            head={["Contract", "From scratch (SciPy)", "Riskfolio-lib"]}
            rows={[
              ["S&P 500", "0.1557", "0.1557"],
              ["10y Note", "0.5523", "0.5523"],
              ["Gold", "0.1571", "0.1571"],
              ["Copper", "0.1106", "0.1106"],
              ["WTI", "0.0243", "0.0243"],
            ]}
          />
        </SubSection>

        <SubSection label="4.5" title="Adding leverage to hit a volatility target">
          <P>
            Risk parity&apos;s raw vol is low (bonds dominate). Scale the whole book to a target —
            say 10% annualised — with a single leverage multiplier. In futures this costs only
            margin, not capital.
          </P>
          <CodeBlock code={LEVERAGE_CODE} />
          <DataTable
            head={["Contract", "Unlevered weight", "Levered weight"]}
            rows={[
              ["S&P 500", "15.6%", "22.6%"],
              ["10y Note", "55.2%", "80.3%"],
              ["Gold", "15.7%", "22.8%"],
              ["Copper", "11.1%", "16.1%"],
              ["WTI", "2.4%", "3.5%"],
            ]}
          />
          <P>
            Unlevered vol is 6.9%, so hitting 10% takes <b>1.45×</b> leverage — gross exposure 1.45
            instead of 1.00. The note position alone is now 80% of capital: this is what
            &ldquo;levered bonds&rdquo; means in the risk-parity debate.
          </P>
        </SubSection>
      </Section>

      <Section id="conclusion" n={5} title="Conclusion">
        <SubSection label="5a" title="Strengths">
          <Bullets
            items={[
              <><b>True diversification</b> — balances the <em>sources</em> of risk, not just the dollars</>,
              <><b>No return forecasts needed</b> — depends only on the covariance matrix, sidestepping MVO&apos;s biggest weakness</>,
              <><b>Robust, stable weights</b> — small input changes barely move the allocation</>,
              <><b>Futures-native</b> — leverage to a vol target is cheap and clean in the futures market</>,
            ]}
          />
        </SubSection>

        <SubSection label="5b" title="Weaknesses & Limitations">
          <Bullets
            items={[
              <><b>Leverage brings its own risks</b> — funding cost, margin calls, and forced deleveraging in a crisis (March 2020 hit risk-parity funds hard)</>,
              <><b>Covariance is still estimated</b> — correlations that break down in stress undermine the whole premise</>,
              <><b>Bond-heavy by construction</b> — vulnerable when rates and equities fall <em>together</em> (2022)</>,
              <><b>Ignores expected returns</b> — equalizing risk is agnostic about where return actually comes from</>,
            ]}
          />
        </SubSection>

        <SubSection label="5c" title="Applications in Practice">
          <Bullets
            items={[
              "The engine behind “All Weather” / risk-parity funds (Bridgewater and imitators)",
              "A diversification overlay for multi-asset and CTA portfolios",
              "A return-forecast-free benchmark to test whether your alpha views actually add value",
            ]}
          />
        </SubSection>

        <SubSection label="5d" title="Alternatives & Extensions">
          <Bullets
            items={[
              <><b>Hierarchical Risk Parity (HRP)</b> — clusters assets first, avoiding matrix inversion for stabler weights</>,
              <><b>Risk budgeting</b> — the general case, assigning <em>unequal</em> target risk shares by conviction</>,
              <><b>Mean-variance & Black-Litterman</b> — the return-driven alternatives (here and here)</>,
              <><b>CVaR risk parity</b> — equalize tail-risk contributions instead of variance contributions</>,
            ]}
          />
        </SubSection>
      </Section>
    </>
  );
}
