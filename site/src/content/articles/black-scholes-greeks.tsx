/* Black–Scholes & the Greeks.

   Prose follows the v2 notebook (01-02_T_BlackScholes_v2) section for section:
   Introduction / Intuition / Theory / Application / Conclusion. The notebook is
   the source of the words; the figures and the quoted numbers come from the
   generated data module so they cannot drift from what the code computes. */

import { Section, SubSection, Lead, P, Bullets, CodeBlock, DataTable, Figure, Formula } from "@/components/article/prose";
import { ProjectCard } from "@/components/article/ProjectCard";
import { BSM_CODE, QQQ_CODE, GREEKS_STRIKES_CODE, THETA_CODE, SANITY_CODE } from "./black-scholes-greeks-code";
import { Line } from "@/components/charts/echarts/Line";
import d from "./data/black-scholes-and-the-greeks";

export default function BlackScholesGreeks() {
  return (
    <>
      <Lead>
        Pricing options and reading their risk with the framework that gave the market its common
        language.
      </Lead>

      <Bullets
        items={[
          <><b>Black–Scholes–Merton (BSM)</b> turns five inputs into one fair price and valuable risk sensitivities.</>,
          <>Its central idea is <b>replication</b>: synthesizing an option from stock and cash ties its price directly to replication cost.</>,
          <>Hence, the stock&apos;s <b>expected return drops out</b> of the equation — two investors who disagree on direction must still agree on the price.</>,
          <>The <b>Greeks</b> (Delta <Formula key="d">{String.raw`\Delta`}</Formula>, Gamma <Formula key="g">{String.raw`\Gamma`}</Formula>, Vega <Formula key="v">{String.raw`\nu`}</Formula>, Theta <Formula key="t">{String.raw`\Theta`}</Formula>, Rho <Formula key="r">{String.raw`\rho`}</Formula>) measure sensitivity to underlying price, convexity, volatility, time decay, and interest rates, respectively.</>,
          <>Options are still <em>quoted</em> in Black–Scholes implied volatility, even where the model&apos;s assumptions fail.</>,
        ]}
      />

      {/* topic-report card — the spec for the piece, in the same place
          on every article */}
      <ProjectCard slug="black-scholes-greeks" />

      <Section id="summary" n={1} title="Summary">
        <P>A few simple facts to get up to speed:</P>
        <Bullets
          items={[
            <>Black–Scholes maps <b>five inputs</b> — spot, strike, time to expiration, interest rate, volatility — onto a single arbitrage-free price.</>,
            <>The option is <b>replicable</b>: hold <Formula key="d">{String.raw`\Delta`}</Formula> shares against it and rebalance continuously, and you manufacture its payoff from stock and cash.</>,
            <>Because replication pins the price, the stock&apos;s <b>expected return <Formula key="m">{String.raw`\mu`}</Formula> never appears</b> (drift independence) — only volatility matters.</>,
            <><b>4 of the 5 inputs are observable</b> — volatility is not. That single unknown is what the option premium is really quoting, and inverting the formula on a market price gives the <b>implied volatility</b>.</>,
          ]}
        />
      </Section>

      <Section id="intuition" n={2} title="Intuition">
        <P>The logic before diving into equations.</P>

        <SubSection label="2.1" title="Replication, not prediction">
          <Bullets
            items={[
              <>Selling a call and holding <Formula key="d">{String.raw`\Delta`}</Formula> shares against it creates a delta-neutral position that momentarily eliminates directional risk.</>,
              <>Continuous rebalancing reproduces the option&apos;s payoff strictly from stock and cash alone.</>,
              <>No-arbitrage conditions are the basis for the price (fair value) irrespective of bias: bulls and bears quote the same number.</>,
            ]}
          />
        </SubSection>

        <SubSection label="2.2" title="Volatility is the price of uncertainty">
          <Bullets
            items={[
              <>Options feature non-linear, asymmetric payoffs (convexity): a wider distribution (higher <Formula key="s">{String.raw`\sigma`}</Formula>) means a higher probability of in-the-money outcomes.</>,
              <>Higher <Formula key="s2">{String.raw`\sigma`}</Formula> therefore lifts <b>both</b> calls and puts.</>,
              <>Future volatility is unobservable, hence market pricing reflects differing expectations of <Formula key="s3">{String.raw`\sigma`}</Formula>.</>,
            ]}
          />
        </SubSection>

        <SubSection label="2.3" title="The Greeks are a risk dashboard">
          <Bullets
            items={[
              <>Traders rarely ask &ldquo;what is the price?&rdquo; — they ask &ldquo;what happens to my book if spot drops 1%, vol jumps 2 points, and a day passes?&rdquo;</>,
              <>Each Greek answers one of those questions, one partial derivative at a time.</>,
              <><Formula key="d">{String.raw`\Delta`}</Formula> is the hedge ratio, <Formula key="g">{String.raw`\Gamma`}</Formula> the cost of keeping it, <Formula key="v">{String.raw`\nu`}</Formula> the vol exposure, <Formula key="t">{String.raw`\Theta`}</Formula> the rent you pay for time.</>,
            ]}
          />
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

      <Section id="mechanics" n={3} title="Theory &amp; Mechanics">
        <P>Below the theoretical foundation and respective equations.</P>

        <SubSection label="3.1" title="The pricing formula">
          <P>
            <Formula>{String.raw`N(d_2)`}</Formula> reads as the risk-neutral probability of finishing
            in the money; <Formula>{String.raw`N(d_1)`}</Formula> is the call&apos;s delta.
          </P>
          <Formula block>{String.raw`d_1 = \frac{\ln(S/K) + (r + \tfrac{1}{2}\sigma^2)T}{\sigma\sqrt{T}}, \qquad d_2 = d_1 - \sigma\sqrt{T}`}</Formula>
          <Formula block>{String.raw`C = S\,N(d_1) - K e^{-rT} N(d_2), \qquad P = K e^{-rT} N(-d_2) - S\,N(-d_1)`}</Formula>
        </SubSection>

        <SubSection label="3.2" title="The Greeks in closed form">
          <P>Each is a partial derivative of the price with respect to one input.</P>
          <Formula block>{String.raw`\Delta_C = N(d_1), \qquad \Gamma = \frac{N'(d_1)}{S\sigma\sqrt{T}}, \qquad \nu = S\,N'(d_1)\sqrt{T}`}</Formula>
          <Formula block>{String.raw`\Theta_C = -\frac{S N'(d_1)\sigma}{2\sqrt{T}} - rKe^{-rT}N(d_2), \qquad \rho_C = K T e^{-rT} N(d_2)`}</Formula>
        </SubSection>

        <SubSection label="3.3" title="Put–call parity — the free sanity check">
          <P>
            Holds by arbitrage alone, independent of any model: if your implementation violates it,
            the bug is yours.
          </P>
          <Formula block>{String.raw`C - P = S - K e^{-rT}`}</Formula>
          <P>
            The two functions below implement this: one returns the <b>price</b>, the other the full{" "}
            <b>Greek</b> set.
          </P>
          <CodeBlock code={BSM_CODE} />
        </SubSection>
      </Section>

      <Section id="example" n={4} title="Applied Example — QQQ">
        <SubSection label="4.1" title="Set the inputs from real data">
          <Bullets
            items={[
              <>We pull daily QQQ prices and use trailing 1-year realised volatility of log returns as the <Formula key="s">{String.raw`\sigma`}</Formula> input.</>,
              <>In practice a trader would use the <em>implied</em> vol quoted in the market.</>,
            ]}
          />
          <CodeBlock code={QQQ_CODE} />
          <DataTable
            variant="prose"
            head={["Input", "Value", "Source"]}
            rows={[
              ["Spot", `$${d.params.s0.toFixed(2)}`, "latest QQQ close"],
              ["Strike", `$${d.atm.k.toFixed(0)}`, "at the money, rounded"],
              ["Volatility", `${(d.params.sigma * 100).toFixed(2)}%`, `trailing ${d.params.window}-day realised`],
              ["Rate", `${(d.params.rf * 100).toFixed(1)}%`, "short-term risk-free"],
              ["Maturity", `${(d.params.T * 12).toFixed(0)} months`, "3-month option"],
            ]}
          />
        </SubSection>

        <SubSection label="4.2" title="The Greeks across strikes — where the risk actually sits">
          <Bullets
            items={[
              <><b>Delta</b> rolls from 0 to 1 like a smoothed step: deep out-of-the-money behaves like nothing, deep in-the-money like the stock itself.</>,
              <><b>Gamma and Vega peak at the money</b> — that is where hedges churn fastest and vol exposure is largest.</>,
              <><b>Theta is most negative at the money too</b>: the option with the most optionality has the most to lose from a day passing.</>,
            ]}
          />
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
          <Bullets
            items={[
              <>Repricing the same option as expiry approaches isolates <Formula key="t">{String.raw`\Theta`}</Formula>: value bleeds away slowly at first, then <b>accelerates sharply in the final weeks</b>.</>,
              <>At the money the decay is roughly proportional to <Formula key="sq">{String.raw`\sqrt{T}`}</Formula>, so the last month costs far more than the first.</>,
              <>This asymmetry is the entire economics of short-dated option selling — and of 0DTE trading.</>,
            ]}
          />
          <CodeBlock code={THETA_CODE} />
          <Figure caption="Figure 4.3 · QQQ call value vs time to expiry — Theta accelerates near zero">
            <Line
              ariaLabel="Call value against time to expiry for a 5% in-the-money, an at-the-money and a 5% out-of-the-money QQQ call; all three decay toward zero and steepen in the final weeks"
              height={230}
              series={[{ name: "5% in the money", y: [...d.maturity.callItm5], color: "graphite", width: 2, dash: true },
                       { name: "at the money", y: [...d.maturity.callAtm], color: "teal", width: 2 },
                       { name: "5% out of the money", y: [...d.maturity.callOtm5], color: "rust", width: 2 }]}
              xLabels={[0, 0.25, 0.5, 0.75, 1].map((f) => [f, `${(d.maturity.t[Math.round(f * (d.maturity.t.length - 1))] * 12).toFixed(0)}m`] as [number, string])}
              yFmt={{ decimals: 0, prefix: "$" }}
              xName="Months to expiry"
              yName="Call value"
            />
          </Figure>
        </SubSection>

        <SubSection label="4.4" title="Sanity checks: parity and Monte Carlo">
          <Bullets
            items={[
              <><b>Put–call parity</b> is model-free, so it must hold to machine precision: any visible error is an implementation bug, not a modelling choice.</>,
              <><b>Monte Carlo under risk-neutral GBM</b> must converge to the closed form — Black–Scholes <em>is</em> the discounted expected payoff of the GBM from the previous tutorial, with the drift set to <Formula key="r">{String.raw`r`}</Formula>.</>,
              <><b>How to read the result:</b> the simulated price carries standard error <Formula key="se">{String.raw`\approx \text{sd}(\text{payoff})/\sqrt{N}`}</Formula>; landing within ~2 SE is agreement, a gap that persists as <Formula key="n">{String.raw`N`}</Formula> grows is a bug.</>,
            ]}
          />
          <CodeBlock code={SANITY_CODE} />
          <DataTable
            variant="prose"
            head={["Check", "Result", "Reading"]}
            rows={[
              [
                <>Put&ndash;call parity</>,
                <>gap {d.atm.parityGap < 1e-8 ? "< 1e-8" : d.atm.parityGap.toExponential(1)}</>,
                "machine precision — the implementation is clean",
              ],
              [
                <>Monte Carlo ({(d.atm.mcN / 1000).toFixed(0)}k paths)</>,
                <>${d.atm.mcCall.toFixed(2)} vs ${d.atm.call.toFixed(2)}</>,
                `${d.atm.mcSigmas.toFixed(2)} standard errors apart — agreement`,
              ],
            ]}
          />
        </SubSection>
      </Section>

      <Section id="conclusion" n={5} title="Strengths, limits &amp; extensions">
        <SubSection label="5a" title="Strengths">
          <Bullets
            items={[
              <><b>Closed form</b> — instant prices and Greeks, no simulation required</>,
              <><b>Preference-free</b> — the stock&apos;s expected return drops out; only volatility matters</>,
              <><b>The market&apos;s common language</b> — options are quoted in BS implied vol even where its assumptions fail</>,
              <><b>Analytic Greeks</b> — the entire hedging and risk-reporting industry runs on them</>,
            ]}
          />
        </SubSection>

        <SubSection label="5b" title="Weaknesses &amp; Limitations">
          <Bullets
            items={[
              <><b>Constant volatility</b> — the market trades a smile/skew; one number cannot price every strike</>,
              <><b>GBM underlying</b> — no jumps and thin tails, so deep out-of-the-money puts are systematically underpriced</>,
              <><b>European exercise only</b> — American early exercise needs trees or numerical methods</>,
              <><b>Frictionless continuous hedging</b> — real rebalancing is discrete and costs money</>,
            ]}
          />
        </SubSection>

        <SubSection label="5c" title="Applications in Practice">
          <Bullets
            items={[
              "Pricing and hedging European options and warrants",
              "Extracting implied volatility — the quoting convention of the entire options market",
              "Real-time Greek dashboards for market-making and portfolio risk",
            ]}
          />
        </SubSection>

        <SubSection label="5d" title="Alternatives &amp; Extensions">
          <Bullets
            items={[
              <><b>Stochastic volatility</b> — Heston, which bends to fit the smile</>,
              <><b>Jump-diffusion</b> — Merton, for crash risk and steep short-dated skew</>,
              <><b>Local volatility</b> — Dupire, fitting the entire observed surface</>,
              <><b>Binomial trees</b> — American exercise, discrete dividends, path dependence</>,
            ]}
          />
        </SubSection>
      </Section>
    </>
  );
}
