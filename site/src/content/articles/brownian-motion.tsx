import { Section, SubSection, Lead, P, Term, Bullets, Callout, CodeBlock, DataTable, Figure, Formula } from "@/components/article/prose";
import { WTI_CODE } from "./wti-code";
import { SIGNATURES_CODE } from "./signatures-code";

/* eslint-disable @next/next/no-img-element */
export default function BrownianMotion() {
  return (
    <>
      <Lead>
        Brownian motion is the mathematical model of <b>pure randomness evolving continuously over
        time</b>. In finance it is the building block for virtually every derivatives pricing model.
      </Lead>

      <Section id="summary" n={1} title="Summary">
        <P>
          The Black–Scholes model of a stock price is the canonical example —{" "}
          <Term>Geometric Brownian Motion (GBM)</Term>:
        </P>
        <Formula block>{String.raw`dS = \underbrace{\mu S\,dt}_{\text{drift}} + \underbrace{\sigma S\,dW}_{\text{random shock}}`}</Formula>
        <P>Three facts are worth memorising before going further:</P>
        <Callout kind="Three facts">
          <b>Fact 1 — Variance scales with time.</b>{" "}
          <Formula>{String.raw`\text{Var}(W_t) = t`}</Formula>, so uncertainty grows as{" "}
          <Formula>{String.raw`\sqrt{t}`}</Formula>, not <Formula>{String.raw`t`}</Formula>. A 35%
          annual vol on crude oil implies{" "}
          <Formula>{String.raw`35/\sqrt{252} \approx 2.2\%`}</Formula> daily moves.
          <br /><br />
          <b>Fact 2 — The path has no derivative.</b> <Formula>{String.raw`W_t`}</Formula> is
          continuous but nowhere differentiable — so the ordinary chain rule fails, and we need Itô
          calculus instead.
          <br /><br />
          <b>Fact 3 — <Formula>{String.raw`(dW)^2 = dt`}</Formula>.</b> Squared increments
          don&apos;t vanish. This produces the Itô correction{" "}
          <Formula>{String.raw`\tfrac{1}{2}\sigma^2 S^2 \dfrac{\partial^2 V}{\partial S^2}`}</Formula>{" "}
          in the Black–Scholes PDE — that second derivative is <b>Gamma</b>, and it&apos;s the reason
          option prices depend on volatility at all.
        </Callout>
      </Section>

      <Section id="intuition" n={2} title="Intuition">
        <SubSection label="2.1" title="The Particle Picture">
          <P>
            Picture a pollen grain floating on water, getting bumped by invisible molecules from
            every direction, every instant. Its position traces a jagged, continuous, unpredictable
            path. That&apos;s Brownian motion — named after botanist Robert Brown who observed it in
            1827, formalised by Einstein in 1905, and made mathematically rigorous by Wiener in the
            1920s.
          </P>
          <P>
            In finance, the &ldquo;particle&rdquo; is a price. The &ldquo;molecular bumps&rdquo; are
            the aggregate of thousands of buy and sell orders arriving continuously.
          </P>
        </SubSection>

        <SubSection label="2.2" title="The Random Walk Limit">
          <P>
            Flip a fair coin every second: heads <Formula>{String.raw`+1`}</Formula>, tails{" "}
            <Formula>{String.raw`-1`}</Formula>. After <Formula>{String.raw`n`}</Formula> steps,{" "}
            <Formula>{String.raw`X_n \sim \mathcal{N}(0, n)`}</Formula> by the Central Limit Theorem.
          </P>
          <P>
            Now <b>shrink the step</b> to <Formula>{String.raw`\Delta t`}</Formula> and{" "}
            <b>scale the jump</b> to <Formula>{String.raw`\sqrt{\Delta t}`}</Formula>:
          </P>
          <Formula block>{String.raw`W_t \approx \sum_{i=1}^{t/\Delta t} \sqrt{\Delta t}\;\xi_i, \qquad \xi_i = \pm 1`}</Formula>
          <P>
            As <Formula>{String.raw`\Delta t \to 0`}</Formula> this converges to Brownian motion. The{" "}
            <Formula>{String.raw`\sqrt{\Delta t}`}</Formula> scaling is <b>forced</b> by the variance
            requirement: <Formula>{String.raw`\tfrac{t}{\Delta t}`}</Formula> steps each of variance{" "}
            <Formula>{String.raw`\Delta t`}</Formula> gives total variance{" "}
            <Formula>{String.raw`t`}</Formula> — so the spread grows as{" "}
            <Formula>{String.raw`\sqrt{t}`}</Formula> regardless of how finely you slice time.
          </P>
        </SubSection>

        <SubSection label="2.3" title={<>The <Formula>{String.raw`\sqrt{t}`}</Formula> Rule in Practice</>}>
          <P>
            This single fact — <Formula>{String.raw`\text{Std}(W_t) = \sqrt{t}`}</Formula> —
            underpins most of quantitative risk:
          </P>
          <Bullets
            items={[
              <><b>Implied vol</b> is quoted annualised:{" "}
                <Formula>{String.raw`\sigma_{\text{annual}} = \sigma_{\text{daily}} \times \sqrt{252}`}</Formula></>,
              <><b>VaR scaling</b>: a 1-day VaR becomes a 10-day VaR by multiplying by{" "}
                <Formula>{String.raw`\sqrt{10}`}</Formula>, not <Formula>{String.raw`10`}</Formula></>,
              <><b>Option time value</b> decays as <Formula>{String.raw`\sqrt{T-t}`}</Formula> near
                expiry — time value bleeds faster at the end</>,
            ]}
          />
        </SubSection>
      </Section>

      <Section id="mechanics" n={3} title="Theory & Mechanics">
        <SubSection label="3.1" title="Formal Definition">
          <P>
            A standard Brownian motion <Formula>{String.raw`W_t`}</Formula> is a continuous-time
            stochastic process satisfying:
          </P>
          <DataTable
            variant="prose"
            head={["#", "Property", "Formal", "Plain English"]}
            rows={[
              ["1", "Starts at zero", <Formula key="f1">{String.raw`W_0 = 0`}</Formula>, "Origin"],
              ["2", "Independent increments", <Formula key="f2">{String.raw`W_t - W_s \perp W_s - W_u\;(u<s<t)`}</Formula>, "No memory — the past path is irrelevant"],
              ["3", "Gaussian increments", <Formula key="f3">{String.raw`W_t - W_s \sim \mathcal{N}(0,\, t-s)`}</Formula>, <>Each move is normal; <b>variance = elapsed time</b></>],
              ["4", "Continuous paths", <Formula key="f4">{String.raw`t \mapsto W_t \text{ cont. a.s.}`}</Formula>, "No jumps"],
            ]}
          />
          <P>
            Properties 2 and 3 together make <Formula>{String.raw`W_t`}</Formula> a <b>martingale</b>:{" "}
            <Formula>{String.raw`\mathbb{E}[W_t \mid \mathcal{F}_s] = W_s`}</Formula>. The best
            forecast of tomorrow&apos;s value is today&apos;s value — no drift. This is the
            mathematical expression of <em>no free lunch</em>.
          </P>
        </SubSection>

        <SubSection label="3.2" title="Nowhere Differentiable — and Why It Matters">
          <P>
            For any smooth function, zooming in eventually reveals a straight line. For{" "}
            <Formula>{String.raw`W_t`}</Formula>, zooming in reveals <b>more roughness</b> at every
            scale. The difference quotient blows up:
          </P>
          <Formula block>{String.raw`\frac{W_{t+h} - W_t}{h} \sim \frac{\sqrt{h}}{h} = \frac{1}{\sqrt{h}} \xrightarrow{h \to 0} \infty`}</Formula>
          <P>
            There is no <Formula>{String.raw`dW/dt`}</Formula> — ever, anywhere. This breaks the
            ordinary chain rule. If <Formula>{String.raw`V = f(W_t)`}</Formula>, the Taylor expansion
            is:
          </P>
          <Formula block>{String.raw`dV = f'(W_t)\,dW_t + \underbrace{\tfrac{1}{2}f''(W_t)\,(dW_t)^2}_{\text{normally discarded}}`}</Formula>
          <P>
            In ordinary calculus <Formula>{String.raw`(dW)^2 \to 0`}</Formula> and you throw it away.
            But here <Formula>{String.raw`(dW)^2 = dt`}</Formula>, so this term <b>survives</b>. That
            is Itô&apos;s lemma — the chain rule for stochastic processes — and that surviving term is
            the Itô correction.
          </P>
          <CodeBlock code={SIGNATURES_CODE} />
          <Figure caption="Independent increments · self-similarity · no derivative">
            <img src="/figures/bm-signatures.png" alt="Three panels: a scatter of two non-overlapping Brownian increments with near-zero correlation, a path segment with a zoomed inset showing identical roughness, and a log-log plot of the difference quotient diverging as the step size shrinks" className="w-full rounded-sm" />
          </Figure>
        </SubSection>

        <SubSection label="3.3" title={<>Quadratic Variation: <Formula>{String.raw`(dW)^2 = dt`}</Formula></>}>
          <P>
            The <b>quadratic variation</b> measures how much a path wiggles in the squared sense:
          </P>
          <Formula block>{String.raw`[W, W]_t = \lim_{\|\Pi\| \to 0} \sum_{i} (W_{t_{i+1}} - W_{t_i})^2 = t \quad \text{(almost surely)}`}</Formula>
          <P>
            For a smooth function this would be zero. For Brownian motion it&apos;s exactly{" "}
            <Formula>{String.raw`t`}</Formula>. This is the single algebraic fact that makes Itô
            calculus different:
          </P>
          <Formula block>{String.raw`\boxed{(dW_t)^2 = dt, \qquad dt^2 = 0, \qquad dt\,dW_t = 0}`}</Formula>
          <P>
            Applied to option pricing: if <Formula>{String.raw`V(S,t)`}</Formula> is a derivative on
            a GBM asset, Itô&apos;s lemma gives:
          </P>
          <Formula block>{String.raw`dV = \frac{\partial V}{\partial t}dt + \frac{\partial V}{\partial S}dS + \underbrace{\frac{1}{2}\sigma^2 S^2 \frac{\partial^2 V}{\partial S^2}}_{\text{Gamma term, from }(dW)^2 = dt}\,dt`}</Formula>
          <P>
            The Gamma term <Formula>{String.raw`\tfrac{1}{2}\sigma^2 S^2 V_{SS}`}</Formula> exists{" "}
            <b>only because</b> <Formula>{String.raw`(dW)^2 = dt \neq 0`}</Formula>. Remove it and
            option prices would be independent of volatility — which is obviously wrong.
          </P>
        </SubSection>
      </Section>

      <Section id="example" n={4} title="Applied Example — WTI Crude Oil (CL)">
        <SubSection title="Setup">
          <P>
            WTI crude oil futures (CME ticker: CL, 1,000 bbl/contract) are among the most liquid
            commodity derivatives in the world. We apply the GBM model with parameters calibrated to
            realistic 2024 market conditions:
          </P>
          <DataTable
            variant="prose"
            head={["Parameter", "Value", "Source"]}
            rows={[
              [<>Spot <Formula key="s0">{String.raw`S_0`}</Formula></>, "$80/bbl", "Front-month CL, early 2024"],
              [<>Annual drift <Formula key="mu">{String.raw`\mu`}</Formula></>, "5%", "Approximate carry / expected return"],
              [<>Annual vol <Formula key="sig">{String.raw`\sigma`}</Formula></>, "35%", "Historical realised vol, calm regime"],
              ["Daily move (1σ)", <Formula key="dm">{String.raw`35/\sqrt{252} \approx 2.2\%`}</Formula>, <>From the <Formula key="rt">{String.raw`\sqrt{t}`}</Formula> rule</>],
              ["Horizon", "252 trading days", "1 year"],
            ]}
          />
          <P>
            The three panels test: (1) whether the price fan looks plausible, (2) whether log-returns
            are Gaussian as theory predicts, and (3) where that assumption breaks down.
          </P>
        </SubSection>

        <CodeBlock code={WTI_CODE} />
        <Figure caption="Figure 4.1 · WTI Crude Oil — GBM Simulation">
          <img src="/figures/bm-wti.png" alt="Three panels: 200 simulated WTI price paths widening as a fan, a Gaussian daily log-return histogram, and a Q-Q plot against the normal distribution" className="w-full rounded-sm" />
        </Figure>
      </Section>

      <Section id="conclusion" n={5} title="Conclusion">
        <SubSection label="5a" title="Strengths">
          <Bullets
            items={[
              <><b>Tractability.</b> GBM has a closed-form solution
                (<Formula>{String.raw`S_t = S_0 e^{(\mu-\sigma^2/2)t + \sigma W_t}`}</Formula>) and
                yields closed-form option prices (Black–Scholes). No other price model comes close for
                analytical convenience.</>,
              <><b>Universal baseline.</b> Every more sophisticated model — Heston, SABR, Merton — is a
                modification of GBM. You must understand BM to understand the corrections.</>,
              <><b><Formula>{String.raw`\sqrt{t}`}</Formula> scaling.</b> Variance growing linearly in
                time is empirically reasonable for most assets over short horizons, and it is exact for
                BM. This makes VaR, margin, and vol scaling formulas straightforward.</>,
              <><b>No-arbitrage foundation.</b> The martingale property of BM under the risk-neutral
                measure <Formula>{String.raw`\mathbb{Q}`}</Formula> directly supports the no-arbitrage
                pricing framework. Risk-neutral pricing is BM in disguise.</>,
            ]}
          />
        </SubSection>

        <SubSection label="5b" title="Weaknesses & Limitations">
          <Bullets
            items={[
              <><b>Fat tails.</b> Real returns have kurtosis <Formula>{String.raw`> 3`}</Formula>{" "}
                (leptokurtic). Gaussian BM underestimates the probability of extreme moves — the 2020
                CL negative price event was essentially impossible under GBM, yet it happened.</>,
              <><b>Volatility clustering.</b> Calm periods follow calm periods; turbulent periods
                cluster. BM has constant <Formula>{String.raw`\sigma`}</Formula> — GARCH models capture
                this behaviour; BM does not.</>,
              <><b>No jumps.</b> BM paths are continuous. Real prices gap on earnings, OPEC decisions,
                or geopolitical shocks. Merton&apos;s jump-diffusion adds a Poisson jump process to fix
                this.</>,
              <><b>Flat vol surface.</b> If GBM were exactly correct, implied vol would be flat across
                all strikes and maturities. It never is — the smile/skew is the market&apos;s direct
                refutation of GBM.</>,
              <><b>Positive prices only in GBM.</b> The 2020 crude oil futures briefly went negative —
                GBM assigns zero probability to <Formula>{String.raw`S_t \leq 0`}</Formula>, making it
                structurally wrong for certain commodities.</>,
            ]}
          />
        </SubSection>

        <SubSection label="5c" title="Applications in Practice">
          <DataTable
            variant="prose"
            head={["Area", "How BM is used"]}
            rows={[
              ["Option pricing", <>GBM + Itô → Black–Scholes PDE → closed-form <Formula key="cp">{String.raw`C, P`}</Formula> and Greeks</>],
              ["Monte Carlo", "Simulate thousands of GBM paths; price exotics as discounted average payoff"],
              ["Delta hedging", <>Hedge <Formula key="dl">{String.raw`\Delta = \partial V/\partial S`}</Formula> units daily; P&amp;L = realised vs implied vol</>],
              ["VaR / margin", <>Scale daily vol to any horizon using <Formula key="sv">{String.raw`\sigma\sqrt{T}`}</Formula>; SPAN margin uses scenarios</>],
              ["Yield curves", "OU / Vasicek = BM with mean reversion; models short rates for bond pricing"],
              ["Pairs trading", "Spread of two correlated assets modelled as OU; trade mean reversion"],
            ]}
          />
        </SubSection>

        <SubSection label="5d" title="Alternatives & Extensions">
          <P>Each extension fixes one specific failure of pure GBM:</P>
          <DataTable
            variant="prose"
            head={["Model", "What it fixes", "Key addition"]}
            rows={[
              [<b>Heston</b>, "Flat vol surface", <><Formula key="he">{String.raw`\sigma_t`}</Formula> itself follows a mean-reverting SDE (CIR process)</>],
              [<b>SABR</b>, "Vol smile for rates / FX", "Stochastic vol correlated with the asset"],
              [<b>Merton jump-diffusion</b>, "No jumps in BM", <>Add Poisson-distributed price jumps: <Formula key="me">{String.raw`dS = \mu S\,dt + \sigma S\,dW + J\,dN`}</Formula></>],
              [<b>Rough volatility (rBergomi)</b>, "Short-term vol surface shape", <>Replace BM with fractional BM (<Formula key="ro">{String.raw`H < 0.5`}</Formula>), making paths even rougher</>],
              [<b>Ornstein–Uhlenbeck</b>, "Unrestricted drift", <>Add mean-reversion: <Formula key="ou">{String.raw`dX = \kappa(\theta - X)\,dt + \sigma\,dW`}</Formula></>],
              [<b>GARCH</b>, "Constant vol", "Discrete-time vol that depends on past squared returns"],
            ]}
          />
          <P>
            All of these have <Formula>{String.raw`(dW)^2 = dt`}</Formula> at their core. Brownian
            motion is not a model you replace — it&apos;s the language you use to build every model
            above it.
          </P>
        </SubSection>
      </Section>
    </>
  );
}
