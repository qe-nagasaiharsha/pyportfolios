import { Section, SubSection, Lead, P, Bullets, CodeBlock, DataTable, Figure, Formula } from "@/components/article/prose";
import { LOAD_CODE, CORR_CODE, CLOUD_CODE, OPT_CODE } from "./mvo-code";

/* eslint-disable @next/next/no-img-element */
export default function MvoEfficientFrontier() {
  return (
    <>
      <Lead>
        Harry Markowitz&apos;s 1952 insight launched modern portfolio theory: don&apos;t pick assets
        in isolation, pick the <em>combination</em> that gives the most return per unit of risk. We
        build the <b>efficient frontier</b> from real data across six asset classes and find the two
        portfolios everyone quotes — <b>minimum variance</b> and <b>maximum Sharpe</b>.
      </Lead>

      <Section id="summary" n={1} title="Summary">
        <P>
          Mean-variance optimization treats a portfolio&apos;s expected return as the weighted
          average of its assets, and its risk as the <em>portfolio</em> variance — which depends not
          just on each asset&apos;s volatility but on how they <b>co-move</b>. Minimizing variance
          for each level of target return traces out the <b>efficient frontier</b>: the set of
          portfolios you can&apos;t beat. Two points on it get special names — the{" "}
          <b>minimum-variance</b> portfolio (leftmost) and the <b>maximum-Sharpe</b> (tangency)
          portfolio, where the risk-adjusted return peaks.
        </P>
      </Section>

      <Section id="intuition" n={2} title="Intuition">
        <SubSection label="2.1" title="The only free lunch in finance">
          <P>
            Combine two assets that don&apos;t move in lockstep and the portfolio&apos;s risk is{" "}
            <em>less</em> than the weighted average of their risks — because their wiggles partly
            cancel. That cancellation is diversification, and it&apos;s why a stock-bond-gold mix can
            have lower volatility than any single sleeve.
          </P>
        </SubSection>

        <SubSection label="2.2" title="Correlation does the heavy lifting">
          <P>
            Volatility tells you how much one asset moves; <b>correlation</b> tells you whether they
            move together. Two 15%-vol assets with −0.3 correlation build a far smoother portfolio
            than two with +0.9. The whole power of MVO lives in the covariance matrix.
          </P>
        </SubSection>

        <SubSection label="2.3" title="What the frontier shows">
          <P>
            Plot every possible portfolio in risk-return space and they fill a bullet-shaped cloud.
            Only the <b>upper-left edge</b> matters — for any risk level, that&apos;s the highest
            return available. Anything below it is a portfolio you&apos;d never rationally hold.
          </P>
        </SubSection>
      </Section>

      <Section id="mechanics" n={3} title="Theory & Mechanics">
        <P>
          With weights <Formula>{String.raw`w`}</Formula>, expected returns{" "}
          <Formula>{String.raw`\mu`}</Formula> and covariance matrix{" "}
          <Formula>{String.raw`\Sigma`}</Formula>:
        </P>
        <Formula block>{String.raw`\text{portfolio return} = w^\top \mu, \qquad \text{portfolio variance} = w^\top \Sigma\, w`}</Formula>
        <P>
          The efficient frontier solves, for each target return <Formula>{String.raw`\mu^*`}</Formula>:
        </P>
        <Formula block>{String.raw`\min_w\; w^\top \Sigma\, w \quad\text{s.t.}\quad w^\top \mu = \mu^*,\;\; \sum_i w_i = 1`}</Formula>
        <P>
          <b>Maximum Sharpe</b> maximizes{" "}
          <Formula>{String.raw`(w^\top\mu - r_f)/\sqrt{w^\top\Sigma w}`}</Formula>;{" "}
          <b>minimum variance</b> just minimizes <Formula>{String.raw`w^\top\Sigma w`}</Formula>.
          We&apos;ll build the frontier two ways — a transparent NumPy Monte-Carlo cloud, then the
          exact optimum with <b>PyPortfolioOpt</b>.
        </P>
      </Section>

      <Section id="example" n={4} title="Applied Example — Six ETFs">
        <SubSection label="4.1" title="A diversified multi-asset universe">
          <P>
            Six asset classes chosen to <em>not</em> move together — the raw material of a good
            frontier:
          </P>
          <DataTable
            variant="prose"
            head={["Ticker", "Asset class"]}
            rows={[
              ["SPY", "US equities (S&P 500)"],
              ["TLT", "Long US Treasuries"],
              ["GLD", "Gold"],
              ["VNQ", "US real estate (REITs)"],
              ["VEA", "Developed ex-US equities"],
              ["VWO", "Emerging-market equities"],
            ]}
          />
          <CodeBlock code={LOAD_CODE} />
          <P>
            Ten years of daily data (2,515 trading days, 2015–2024). Note how different the
            standalone Sharpe ratios are — and that TLT earned essentially <em>nothing</em> over the
            decade:
          </P>
          <DataTable
            head={["Ticker", "Ann. return", "Ann. vol", "Sharpe"]}
            rows={[
              ["SPY", "13.9%", "17.6%", "0.79"],
              ["TLT", "−0.0%", "15.3%", "−0.00"],
              ["GLD", "8.5%", "14.1%", "0.60"],
              ["VNQ", "6.9%", "20.8%", "0.33"],
              ["VEA", "6.9%", "17.3%", "0.40"],
              ["VWO", "6.0%", "19.8%", "0.30"],
            ]}
          />
        </SubSection>

        <SubSection label="4.2" title="The correlation matrix — the source of the free lunch">
          <P>
            Note where correlations are <em>low</em>: Treasuries (TLT, −0.21 to SPY) and gold (GLD,
            +0.05 to SPY) barely track equities, which is exactly why they smooth the portfolio.
          </P>
          <CodeBlock code={CORR_CODE} />
          <Figure caption="Figure 4.2 · Correlation of daily returns, 2015–2024">
            <img src="/figures/mvo-corr.png" alt="Six-by-six correlation matrix of daily ETF returns; the equity block (SPY, VNQ, VEA, VWO) is highly correlated at 0.55 to 0.86, while TLT is slightly negative against equities and GLD is near zero" className="w-full rounded-sm" />
          </Figure>
        </SubSection>

        <SubSection label="4.3" title="The efficient frontier — Monte-Carlo cloud">
          <P>
            Generate 20,000 random portfolios to <em>see</em> the bullet, then the frontier as its
            upper-left edge. Colour = Sharpe ratio.
          </P>
          <CodeBlock code={CLOUD_CODE} />
        </SubSection>

        <SubSection label="4.4" title="The exact optima with PyPortfolioOpt">
          <P>
            The cloud shows the shape; PyPortfolioOpt solves for the <em>exact</em> minimum-variance
            and maximum-Sharpe portfolios and overlays the true frontier.
          </P>
          <CodeBlock code={OPT_CODE} />
          <DataTable
            head={["Ticker", "Max Sharpe", "Min Variance"]}
            rows={[
              ["SPY", "0.563", "0.268"],
              ["TLT", "0.000", "0.371"],
              ["GLD", "0.437", "0.280"],
              ["VNQ", "0.000", "0.000"],
              ["VEA", "0.000", "0.081"],
              ["VWO", "0.000", "0.000"],
            ]}
          />
          <P>
            <b>Max Sharpe</b>: 10.8% return at 11.9% vol (Sharpe 0.73) — a two-asset SPY + GLD
            barbell. <b>Min variance</b>: 5.7% return at 9.3% vol (Sharpe 0.40) — note it holds 37%
            TLT <em>despite</em> TLT&apos;s zero return, purely for its negative correlation. That is
            the free lunch in action: the optimizer pays for co-movement, not for standalone
            performance.
          </P>
          <Figure caption="Figure 4.4 · 20,000 random portfolios, the exact frontier, and the two special portfolios">
            <img src="/figures/mvo-frontier.png" alt="Scatter of 20,000 random portfolios forming a bullet shape in risk-return space, shaded by Sharpe ratio, with the exact efficient frontier drawn along the upper-left edge; a star marks the maximum-Sharpe portfolio and an open circle the minimum-variance portfolio, with the six individual ETFs plotted as diamonds well inside the cloud" className="w-full rounded-sm" />
          </Figure>
          <P>
            Every single ETF plots <em>inside</em> the cloud, well below the frontier — even SPY, the
            decade&apos;s best performer, sits under the line. No individual asset is efficient;
            only combinations are.
          </P>
        </SubSection>
      </Section>

      <Section id="conclusion" n={5} title="Conclusion">
        <SubSection label="5a" title="Strengths">
          <Bullets
            items={[
              <><b>Quantifies diversification</b> — turns &ldquo;don&apos;t put all your eggs in one basket&rdquo; into an exact weight vector</>,
              <><b>One framework, any universe</b> — stocks, bonds, gold, real estate all go in the same optimizer</>,
              <><b>Closed-form and fast</b> — the frontier is a quadratic program that solves instantly</>,
              <><b>The foundation</b> — every allocation method (risk parity, Black-Litterman, CVaR) is a response to MVO</>,
            ]}
          />
        </SubSection>

        <SubSection label="5b" title="Weaknesses & Limitations">
          <Bullets
            items={[
              <><b>Garbage in, garbage out</b> — expected returns are notoriously hard to estimate, and MVO is hypersensitive to them</>,
              <><b>Concentrated, unstable weights</b> — tiny input changes can swing allocations wildly (the &ldquo;error-maximization&rdquo; critique)</>,
              <><b>Backward-looking</b> — historical covariance assumes the past regime persists</>,
              <><b>Ignores tail risk</b> — variance treats upside and downside symmetrically; crashes aren&apos;t Gaussian</>,
            ]}
          />
        </SubSection>

        <SubSection label="5c" title="Applications in Practice">
          <Bullets
            items={[
              "Strategic asset allocation for pension funds and endowments",
              "Setting the neutral portfolio a discretionary manager tilts away from",
              "The benchmark every alternative allocation method is measured against",
            ]}
          />
        </SubSection>

        <SubSection label="5d" title="Alternatives & Extensions">
          <Bullets
            items={[
              <><b>Black-Litterman</b> — fixes the input-sensitivity problem by blending market equilibrium with views (the <a href="/research/black-litterman">next tutorial</a>)</>,
              <><b>Risk parity</b> — sidesteps return estimation entirely by allocating on risk contribution (our <a href="/research/risk-parity-futures">futures-based piece</a>)</>,
              <><b>Hierarchical Risk Parity</b> — uses <a href="/research/hierarchical-risk-parity">clustering instead of matrix inversion</a> for stabler weights</>,
              <><b>CVaR optimization</b> — replaces variance with a genuine tail-risk measure</>,
            ]}
          />
        </SubSection>
      </Section>
    </>
  );
}
