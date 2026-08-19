import { Section, SubSection, Lead, P, Bullets, CodeBlock, DataTable, Figure, Formula } from "@/components/article/prose";
import { ProjectCard } from "@/components/article/ProjectCard";
import { BSM_CODE, QQQ_CODE, GREEKS_STRIKES_CODE, THETA_CODE, SANITY_CODE } from "./black-scholes-greeks-code";
import { Line } from "@/components/charts/echarts/Line";
import d from "./data/black-scholes-and-the-greeks";

export default function BlackScholesGreeks() {
  return (
    <>
      <Lead>
        The Black–Scholes–Merton (BSM) model turns five observable inputs — spot, strike, time, rate,
        volatility — into a fair option price <em>and</em> a full risk report (the Greeks). Fifty years
        on, it remains the language in which options are quoted, hedged, and risk-managed.
      </Lead>

      {/* topic-report card — the spec for the piece, in the same place
          on every article */}
      <ProjectCard slug="black-scholes-greeks" />

      <Section id="summary" n={1} title="Summary">
        <P>
          BSM assumes the underlying follows <b>Geometric Brownian Motion</b> (see the{" "}
          previous tutorial) and shows that an option&apos;s
          payoff can be <b>replicated</b> by continuously trading the stock and a bond — so the
          option&apos;s price is the cost of that replication, independent of anyone&apos;s market
          view. The result is a closed-form price for European calls and puts, and analytic{" "}
          <b>Greeks</b>: the sensitivities of that price to spot (<Formula>{String.raw`\Delta`}</Formula>,{" "}
          <Formula>{String.raw`\Gamma`}</Formula>), volatility (<Formula>{String.raw`\nu`}</Formula>,
          &ldquo;vega&rdquo;), time (<Formula>{String.raw`\Theta`}</Formula>) and rates{" "}
          (<Formula>{String.raw`\rho`}</Formula>).
        </P>
      </Section>

      <Section id="intuition" n={2} title="Intuition">
        <SubSection label="2.1" title="Replication, not prediction">
          <P>
            Hold <Formula>{String.raw`\Delta`}</Formula> shares against a short call and the portfolio
            is (momentarily) immune to small price moves. Rebalance continuously and the option is
            manufactured from stock and cash. No-arbitrage then pins the price — the expected return of
            the stock <Formula>{String.raw`\mu`}</Formula> <b>drops out entirely</b>. That is the
            magic: two people who disagree wildly about where the Nasdaq is going must still agree on
            the option&apos;s fair price.
          </P>
        </SubSection>

        <SubSection label="2.2" title="Volatility is the price of uncertainty">
          <P>
            Of the five inputs, four are observable. Volatility is not — and the option premium is, in
            essence, the market&apos;s bid on future uncertainty. Higher{" "}
            <Formula>{String.raw`\sigma`}</Formula> → wider terminal distribution → both calls and puts
            gain value (optionality only benefits from dispersion).
          </P>
        </SubSection>

        <SubSection label="2.3" title="Greeks: the risk dashboard">
          <P>
            A trader rarely asks &ldquo;what is the price?&rdquo; — they ask &ldquo;what happens to my
            book if spot drops 1%, vol jumps 2 points, and a day passes?&rdquo; Delta, Gamma, Vega and
            Theta answer exactly that, one partial derivative at a time.
          </P>
          <DataTable
            variant="prose"
            head={["Greek", "Sensitivity to", "Typical use"]}
            rows={[
              [<>Delta <Formula key="d">{String.raw`\Delta`}</Formula></>, "Spot", "Hedge ratio"],
              [<>Gamma <Formula key="g">{String.raw`\Gamma`}</Formula></>, "Spot (2nd order)", "Hedge stability / convexity"],
              [<>Vega <Formula key="v">{String.raw`\nu`}</Formula></>, "Volatility", "Vol exposure"],
              [<>Theta <Formula key="t">{String.raw`\Theta`}</Formula></>, "Time", "Daily carry / decay"],
              [<>Rho <Formula key="r">{String.raw`\rho`}</Formula></>, "Interest rate", "Rate exposure"],
            ]}
          />
        </SubSection>
      </Section>

      <Section id="mechanics" n={3} title="Theory & Mechanics">
        <SubSection label="3.1" title="The pricing formula">
          <P>
            With spot <Formula>{String.raw`S`}</Formula>, strike <Formula>{String.raw`K`}</Formula>,
            maturity <Formula>{String.raw`T`}</Formula>, rate <Formula>{String.raw`r`}</Formula> and
            volatility <Formula>{String.raw`\sigma`}</Formula>:
          </P>
          <Formula block>{String.raw`d_1 = \frac{\ln(S/K) + (r + \tfrac{1}{2}\sigma^2)T}{\sigma\sqrt{T}}, \qquad d_2 = d_1 - \sigma\sqrt{T}`}</Formula>
          <Formula block>{String.raw`C = S\,N(d_1) - K e^{-rT} N(d_2), \qquad P = K e^{-rT} N(-d_2) - S\,N(-d_1)`}</Formula>
          <P>
            Read <Formula>{String.raw`N(d_2)`}</Formula> as the (risk-neutral) probability the option
            finishes in the money; <Formula>{String.raw`N(d_1)`}</Formula> is the delta of the call.
          </P>
        </SubSection>

        <SubSection label="3.2" title="The Greeks in closed form">
          <Formula block>{String.raw`\Delta_C = N(d_1), \quad \Gamma = \frac{N'(d_1)}{S\sigma\sqrt{T}}, \quad \nu = S\,N'(d_1)\sqrt{T}, \quad \Theta_C = -\frac{S N'(d_1)\sigma}{2\sqrt{T}} - rKe^{-rT}N(d_2)`}</Formula>
          <CodeBlock code={BSM_CODE} />
        </SubSection>

        <SubSection label="3.3" title="Put-call parity — the free sanity check">
          <P>
            Independent of any model: <Formula>{String.raw`C - P = S - Ke^{-rT}`}</Formula>. If your
            implementation violates it, something is wrong.
          </P>
        </SubSection>
      </Section>

      <Section id="example" n={4} title="Applied Example — QQQ">
        <SubSection label="4.1" title="Inputs from real data">
          <P>
            Spot from the latest QQQ close; volatility proxied by the trailing 1-year realised vol of
            log returns (in practice you would use the implied vol quoted in the market — that
            distinction is exactly what the <em>Heston vs Black-Scholes</em> piece explores).
          </P>
          <CodeBlock code={QQQ_CODE} />
        </SubSection>

        <SubSection label="4.2" title="The Greeks across strikes">
          <P>
            The same option book looks completely different in-, at- and out-of-the-money. Gamma and
            Vega <b>peak at the money</b> — that is where hedges churn fastest and vol exposure is
            largest; Delta rolls from 0 to 1 like a smoothed step function.
          </P>
          <CodeBlock code={GREEKS_STRIKES_CODE} />
          <Figure caption="Figure 4.2 · QQQ 3-month call — the Greeks across strikes">
            <Line
              ariaLabel="Delta and Gamma of a 3-month QQQ call against moneyness; Delta falls smoothly from 1 to 0 while Gamma peaks at the money"
              height={230}
              series={[{ name: "Delta", y: [...d.greeksCurve.delta], color: "teal", width: 2 },
                       { name: "Gamma (×100)", y: d.greeksCurve.gamma.map((g) => g * 100), color: "amber", width: 2 }]}
              xLabels={[0, 0.25, 0.5, 0.75, 1].map((f) => [f, d.greeksCurve.m[Math.round(f * (d.greeksCurve.m.length - 1))].toFixed(2)] as [number, string])}
              yFmt={{ decimals: 1 }}
              xName="Moneyness  K / S"
              yName="Delta · Gamma (×100)"
            />
          </Figure>
        </SubSection>

        <SubSection label="4.3" title="Time decay — the option's ticking clock">
          <P>
            Repricing the ATM call as maturity shrinks shows Theta at work: decay is slow far from
            expiry and <b>accelerates sharply in the final weeks</b> — the reason short-dated option
            selling and 0DTE trading are games of Theta and Gamma.
          </P>
          <CodeBlock code={THETA_CODE} />
          <Figure caption="Figure 4.3 · QQQ call value vs time to expiry — Theta accelerates near zero">
            <Line
              ariaLabel="Call value against time to expiry for an at-the-money and a 5% out-of-the-money QQQ call; both decay toward zero and steepen in the final weeks"
              height={230}
              series={[{ name: "at the money", y: [...d.maturity.callAtm], color: "teal", width: 2 },
                       { name: "5% out of the money", y: [...d.maturity.callOtm5], color: "rust", width: 2, dash: true }]}
              xLabels={[0, 0.25, 0.5, 0.75, 1].map((f) => [f, `${d.maturity.t[Math.round(f * (d.maturity.t.length - 1))].toFixed(1)}y`] as [number, string])}
              yFmt={{ decimals: 0, prefix: "$" }}
              xName="Time to expiry"
              yName="Call value"
            />
          </Figure>
        </SubSection>

        <SubSection label="4.4" title="Sanity checks: parity and Monte Carlo">
          <P>Two independent tests of the implementation:</P>
          <Bullets
            items={[
              <><b>Put-call parity</b> must hold to machine precision.</>,
              <><b>Monte Carlo under GBM</b> (the simulator from the previous tutorial, with drift <Formula key="r">{String.raw`r`}</Formula>) must converge to the closed-form price — Black-Scholes <em>is</em> the GBM expectation in disguise.</>,
            ]}
          />
          <CodeBlock code={SANITY_CODE} />
        </SubSection>
      </Section>

      <Section id="conclusion" n={5} title="Conclusion">
        <SubSection label="5a" title="Strengths">
          <Bullets
            items={[
              <><b>Closed form</b> — instant prices and Greeks, no simulation needed</>,
              <><b>Preference-free</b> — the stock&apos;s expected return drops out; only volatility matters</>,
              <><b>The market&apos;s lingua franca</b> — options are <em>quoted</em> in BSM implied vol even where the model&apos;s assumptions fail</>,
              <><b>Analytic Greeks</b> — the entire hedging industry runs on them</>,
            ]}
          />
        </SubSection>

        <SubSection label="5b" title="Weaknesses & Limitations">
          <Bullets
            items={[
              <><b>Constant volatility</b> — markets trade a <em>smile/skew</em>, not a flat vol (one number cannot price all strikes)</>,
              <><b>GBM underlying</b> — no jumps, no fat tails; deep OTM puts are systematically underpriced</>,
              <><b>European exercise only</b> — American-style early exercise needs trees or numerical methods</>,
              <><b>Continuous frictionless hedging</b> — real rebalancing is discrete and costs money</>,
            ]}
          />
        </SubSection>

        <SubSection label="5c" title="Applications in Practice">
          <Bullets
            items={[
              "Pricing and hedging European options and warrants",
              "Implied volatility extraction — the quoting convention for the entire options market",
              "Real-time Greek dashboards for market-making and portfolio risk",
            ]}
          />
        </SubSection>

        <SubSection label="5d" title="Alternatives & Extensions">
          <Bullets
            items={[
              <><b>Stochastic volatility</b> — Heston (see our Quant Insights piece <em>&ldquo;Heston vs Black-Scholes: fitting the volatility smile&rdquo;</em>)</>,
              <><b>Jump-diffusion</b> — Merton, for crash risk and short-dated skew</>,
              <><b>Binomial trees</b> — American exercise, dividends, path-dependence</>,
              <><b>Local volatility</b> — Dupire, fitting the entire observed surface</>,
            ]}
          />
        </SubSection>
      </Section>
    </>
  );
}
