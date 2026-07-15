import { Section, SubSection, Lead, P, Bullets, CodeBlock, Figure, Formula } from "@/components/article/prose";
import { GBM_FUNCS, SPY_CALIB, CONE_CODE, TERMINAL_CODE, MARTINGALE_CODE } from "./gbm-spy-code";

/* eslint-disable @next/next/no-img-element */
export default function GeometricBrownianMotion() {
  return (
    <>
      <Lead>
        Geometric Brownian Motion (GBM) is the canonical continuous-time model for asset prices. It
        powers the Black–Scholes framework, Monte-Carlo risk engines, and most of the intuition
        practitioners carry about &ldquo;what could the price do?&rdquo;.
      </Lead>

      <Section id="summary" n={1} title="Summary">
        <P>
          GBM assumes that <b>percentage returns</b> — not price changes — are random, normally
          distributed, and independent over time. Prices therefore stay positive and their terminal
          distribution is <b>log-normal</b>. Two parameters fully describe the model: the drift{" "}
          <Formula>{String.raw`\mu`}</Formula> (expected annual log-growth plus half-variance) and the
          volatility <Formula>{String.raw`\sigma`}</Formula> (annualised standard deviation of log
          returns) — both estimable directly from historical data.
        </P>
      </Section>

      <Section id="intuition" n={2} title="Intuition">
        <SubSection label="2.1" title="Returns compound, prices don't add">
          <P>
            A $10 move means something very different at SPY = 100 than at SPY = 600. What is
            comparable across price levels is the <b>relative</b> move. GBM makes randomness
            proportional to the current price: <Formula>{String.raw`dS = \mu S\,dt + \sigma S\,dW`}</Formula>.
          </P>
        </SubSection>

        <SubSection label="2.2" title="Why log-normal">
          <P>
            If each day multiplies the price by a small random gross return, the log-price is a{" "}
            <b>sum</b> of many small independent shocks — and sums of independent shocks are
            (approximately) normal. Normal log-price <Formula>{String.raw`\Rightarrow`}</Formula>{" "}
            log-normal price: skewed right, floored at zero.
          </P>
        </SubSection>

        <SubSection label="2.3" title="Drift vs. noise">
          <P>
            Over short horizons the noise term dominates (<Formula>{String.raw`\sigma\sqrt{t}`}</Formula>{" "}
            shrinks slower than <Formula>{String.raw`\mu t`}</Formula> as{" "}
            <Formula>{String.raw`t \to 0`}</Formula>); over long horizons drift wins. This is the same{" "}
            <Formula>{String.raw`\sqrt{t}`}</Formula> rule that governs plain Brownian motion — GBM
            simply wraps it in an exponential.
          </P>
        </SubSection>
      </Section>

      <Section id="mechanics" n={3} title="Theory & Mechanics">
        <SubSection label="3.1" title="The SDE and its solution">
          <Formula block>{String.raw`dS_t = \mu S_t\,dt + \sigma S_t\,dW_t`}</Formula>
          <P>
            Applying Itô&rsquo;s lemma to <Formula>{String.raw`\ln S_t`}</Formula> (the{" "}
            <Formula>{String.raw`-\tfrac{1}{2}\sigma^2`}</Formula> correction comes from{" "}
            <Formula>{String.raw`(dW)^2 = dt`}</Formula>):
          </P>
          <Formula block>{String.raw`S_t = S_0 \exp\!\Big[\big(\mu - \tfrac{1}{2}\sigma^2\big)t + \sigma W_t\Big]`}</Formula>
        </SubSection>

        <SubSection label="3.2" title="Exact discretisation">
          <P>
            Because the solution is closed-form, we can simulate <b>without discretisation error</b> at
            any step size <Formula>{String.raw`\Delta t`}</Formula>:
          </P>
          <Formula block>{String.raw`S_{t+\Delta t} = S_t \cdot \exp\!\Big[\big(\mu - \tfrac{1}{2}\sigma^2\big)\Delta t + \sigma \sqrt{\Delta t}\, Z\Big], \qquad Z \sim \mathcal{N}(0,1)`}</Formula>
          <P>
            Two small functions implement this: one draws per-step <b>gross returns</b>, the other
            compounds them into price paths.
          </P>
          <CodeBlock code={GBM_FUNCS} />
        </SubSection>
      </Section>

      <Section id="example" n={4} title="Applied Example — SPY">
        <SubSection label="4.1" title={<>Calibrate <Formula>{String.raw`\mu`}</Formula> and <Formula>{String.raw`\sigma`}</Formula> from real data</>}>
          <P>
            We pull daily SPY prices, estimate annualised drift and volatility from <b>log returns</b>,
            and let the data — not guesses — drive the simulation.
          </P>
          <CodeBlock code={SPY_CALIB} />
        </SubSection>

        <SubSection label="4.2" title="Simulate 1,000 five-year paths">
          <P>
            Grey lines are individual paths, the dashed line is the mean of the simulated distribution,
            and the band spans the 5th–95th percentile — the &ldquo;cone of plausible futures&rdquo;.
          </P>
          <CodeBlock code={CONE_CODE} />
          <Figure caption="Figure 4.2 · SPY — 1,000 GBM paths over five years">
            <img src="/figures/gbm-cone.png" alt="One thousand simulated SPY price paths fanning out over five years; a shaded band spans the 5th to 95th percentile and a dashed line marks the mean path" className="w-full rounded-sm" />
          </Figure>
        </SubSection>

        <SubSection label="4.3" title="Terminal distribution — is it log-normal?">
          <P>
            Theory says{" "}
            <Formula>{String.raw`\ln S_T \sim \mathcal{N}\big((\mu - \tfrac{1}{2}\sigma^2)T,\; \sigma^2 T\big)`}</Formula>.
            Overlaying the theoretical density on the simulated histogram is a one-line correctness
            check — and shows the characteristic right skew: the <b>mean sits above the median</b>.
          </P>
          <CodeBlock code={TERMINAL_CODE} />
          <Figure caption="Figure 4.3 · SPY — terminal price distribution after five years">
            <img src="/figures/gbm-terminal.png" alt="Histogram of simulated terminal SPY prices with the theoretical log-normal density overlaid; dashed lines mark the mean above the median, showing the right skew" className="w-full rounded-sm" />
          </Figure>
        </SubSection>

        <SubSection label="4.4" title="Sanity check: switch the drift off">
          <P>
            With <Formula>{String.raw`\mu = 0`}</Formula>, GBM is a <b>martingale</b>: the mean terminal
            price must sit at <Formula>{String.raw`S_0`}</Formula>. A quick way to catch implementation
            bugs (a common one: forgetting the <Formula>{String.raw`-\tfrac{1}{2}\sigma^2`}</Formula>{" "}
            correction, which inflates the mean).
          </P>
          <CodeBlock code={MARTINGALE_CODE} />
        </SubSection>
      </Section>

      <Section id="conclusion" n={5} title="Conclusion">
        <SubSection label="5a" title="Strengths">
          <Bullets
            items={[
              <><b>Analytically tractable</b> — closed-form solutions (Black–Scholes) make it the natural baseline</>,
              <><b>Positive prices, log-normal terminal distribution</b> — matches the basic stylised fact that prices can&apos;t go negative</>,
              <><b>Only two parameters</b> — both estimable directly from historical log returns</>,
              <><b>Cheap to simulate</b> — vectorised NumPy generates millions of paths in seconds</>,
            ]}
          />
        </SubSection>

        <SubSection label="5b" title="Weaknesses & Limitations">
          <Bullets
            items={[
              <><b>Constant volatility</b> — real vol clusters and spikes</>,
              <><b>No jumps</b> — crashes like March 2020 are far outside its reach</>,
              <><b>Normal log-returns</b> — real returns have fat tails</>,
              <><b>Independent increments</b> — momentum and mean-reversion exist</>,
            ]}
          />
        </SubSection>

        <SubSection label="5c" title="Applications in Practice">
          <Bullets
            items={[
              "Baseline for option pricing and Monte-Carlo risk engines",
              "Scenario cones for wealth projections",
              "Null model against which fancier models must justify their complexity",
            ]}
          />
        </SubSection>

        <SubSection label="5d" title="Alternatives & Extensions">
          <Bullets
            items={[
              <><b>Stochastic volatility</b> — Heston (see our Quant Insights piece <em>&ldquo;Heston vs Black-Scholes: fitting the volatility smile&rdquo;</em>)</>,
              <><b>Jump-diffusion</b> — Merton</>,
              <><b>GARCH-family models</b> — for clustered volatility</>,
            ]}
          />
        </SubSection>
      </Section>
    </>
  );
}
