import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References, Pipeline } from "@/components/article/prose";
import { LineChart } from "@/components/charts/DataCharts";
import d from "./data/black-scholes-and-the-greeks";

/* T02 / topic card 02-16 — all figures below render REAL computed results
   (QQQ Jan 2018 – Dec 2024, trailing 1y realized vol as σ) baked in by
   quant/tutorials/t02_black_scholes.py. */

const pc = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function BlackScholesAndTheGreeks() {
  const gammaScaled = d.greeksCurve.gamma.map((g) => g * 100);
  const volPct = d.history.vol.map((v) => v * 100);

  return (
    <>
      <Lead>
        Nobody on an options desk believes Black–Scholes. Everybody on an options desk uses it —
        as the pricing engine, as the hedging dashboard, and above all as the coordinate system
        the entire market quotes in. This tutorial builds that machinery from scratch in NumPy
        and SciPy: the price, all five Greeks, and the implied-vol inversion — calibrated to
        seven years of real QQQ data with trailing realized vol as the σ input.
      </Lead>

      <Pipeline
        steps={[
          "Download QQQ adjusted closes, 2017–2024 (yfinance)",
          "Compute trailing 252-day realized vol — the σ input",
          "Implement the BS price + all five Greeks, vectorised",
          "Price the strike ladder; check put–call parity to machine precision",
          "Invert the formula: implied vol via Brent's method",
        ]}
      />

      <Section id="engine" n={1} title="The formula, implemented">
        <P>
          We treat the formula as given machinery here — the replication argument that forces it
          is the subject of the companion piece <Term>Black–Scholes from first principles</Term>.
          Everything funnels through two standardised distances, and the Greeks are the analytic
          partial derivatives, so the whole engine is a dozen vectorised lines:
        </P>
        <CodeBlock
          file="black_scholes.py"
          code={`import numpy as np
from scipy.stats import norm

def d1_d2(s, k, t, rf, sigma):
    d1 = (np.log(s / k) + (rf + 0.5 * sigma**2) * t) / (sigma * np.sqrt(t))
    return d1, d1 - sigma * np.sqrt(t)

def bs_price(s, k, t, rf, sigma, kind="call"):
    d1, d2 = d1_d2(s, k, t, rf, sigma)
    if kind == "call":
        return s * norm.cdf(d1) - k * np.exp(-rf * t) * norm.cdf(d2)
    return k * np.exp(-rf * t) * norm.cdf(-d2) - s * norm.cdf(-d1)

def bs_greeks(s, k, t, rf, sigma):        # call version
    d1, d2 = d1_d2(s, k, t, rf, sigma)
    pdf   = norm.pdf(d1)
    delta = norm.cdf(d1)
    gamma = pdf / (s * sigma * np.sqrt(t))
    vega  = s * pdf * np.sqrt(t)                    # per 1.00 of vol
    theta = (-s * pdf * sigma / (2 * np.sqrt(t))
             - rf * k * np.exp(-rf * t) * norm.cdf(d2))   # per year
    rho   = k * t * np.exp(-rf * t) * norm.cdf(d2)        # per 1.00 of rate
    return delta, gamma, vega, theta, rho`}
        />
        <P>
          Because every function broadcasts over NumPy arrays, pricing a 61-strike ladder or a
          40-point maturity grid is one call, not a loop. No finite differences anywhere — the
          Greeks come from the same <InlineCode>norm.pdf(d1)</InlineCode> the price already
          computed, so they are exact and essentially free.
        </P>
        <Callout kind="Why practitioners care">
          Black–Scholes is market infrastructure, not a belief system. Exchange risk engines
          margin with it, brokers display its Greeks next to every quote, and dealers hedge off
          delta and gamma computed exactly this way. If you trade options at all, this dozen
          lines of NumPy is the dashboard everyone else is looking at.
        </Callout>
      </Section>

      <Section id="vol" n={2} title="Sigma from the tape">
        <P>
          The formula needs one input you cannot observe: σ. With no option chain in hand, the
          classic first estimate is <Term>trailing realized volatility</Term> — here the 252-day
          rolling standard deviation of QQQ log returns, annualised. We download from 2017 so the
          window is full from January 2018; the usable sample runs {d.params.start} to{" "}
          {d.params.end}, {d.params.nObs.toLocaleString()} trading days.
        </P>
        <Figure
          caption={`QQQ adjusted close, ${d.params.start} → ${d.params.end}`}
          legend={[{ label: "QQQ", tone: "aqua" }]}
        >
          <LineChart
            ariaLabel="QQQ price 2018 to 2024, rising from about 150 to 507 with sharp drawdowns in 2020 and 2022."
            series={[{ y: d.history.price as unknown as number[], area: true }]}
            xLabels={d.history.xLabels as unknown as [number, string][]}
          />
        </Figure>
        <Figure
          caption="Trailing 1y realized vol — and what it does to the cost of a 1y ATM call"
          legend={[
            { label: "trailing vol (%)", tone: "aqua" },
            { label: "1y ATM call, % of spot", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Trailing volatility between 10 and 36 percent, spiking after the 2020 crash; the cost of an at-the-money call tracks it closely."
            series={[
              { y: volPct as unknown as number[], color: "teal", width: 2 },
              { y: d.history.callPctSpot as unknown as number[], color: "graphite", width: 1.4, dash: "4 3" },
            ]}
            xLabels={d.history.xLabels as unknown as [number, string][]}
            yFmt={(v) => `${v.toFixed(0)}%`}
          />
        </Figure>
        <P>
          The regime range is enormous: trailing vol bottoms at {pc(d.history.volLo.v)} in early
          2018 and peaks at {pc(d.history.volHi.v)} in February 2021, when the COVID crash still
          sat inside the window. Repricing the same 1y at-the-money call each day — same formula,
          same rate, only σ and spot moving — its cost swings between roughly 6% and 16% of spot.
          Volatility <Term>is</Term> the price of an option; everything else is bookkeeping. The
          latest reading, σ = {pc(d.params.sigma)} on a spot of ${d.params.s0}, is what we feed
          the engine for the rest of the tutorial (with a flat r = {pc(d.params.rf)}).
        </P>
      </Section>

      <Section id="ladder" n={3} title="The strike ladder & put–call parity">
        <P>
          One vectorised call prices 1y calls and puts across moneyness 0.7×–1.3× of spot. The
          shapes are the textbook ones — but drawn with real numbers: the call is worth{" "}
          <InlineCode>${d.atm.call}</InlineCode> at the money and decays toward intrinsic value on
          both wings; the put mirrors it through parity.
        </P>
        <Figure
          caption="1y QQQ option prices across the strike ladder — call and put"
          legend={[
            { label: "call", tone: "aqua" },
            { label: "put", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Call price falling from about 165 to 6 dollars as strike rises across moneyness 0.7 to 1.3; put price rising from about 2 to 105, crossing near the money."
            series={[
              { y: d.ladder.call as unknown as number[], color: "teal", width: 2 },
              { y: d.ladder.put as unknown as number[], color: "graphite", width: 1.6, dash: "5 3" },
            ]}
            xLabels={[[0, "0.7×"], [0.25, "0.85×"], [0.5, "ATM"], [0.75, "1.15×"], [1, "1.3×"]]}
            yFmt={(v) => `$${v.toFixed(0)}`}
          />
        </Figure>
        <P>
          Before trusting any pricer, run the cheapest unit test in quantitative finance:{" "}
          <Term>put–call parity</Term>, <InlineCode>C − P = S − Ke⁻ʳᵀ</InlineCode>, which holds
          model-free by arbitrage. At the money our engine gives{" "}
          <InlineCode>C − P = {d.atm.parityLhs}</InlineCode> against{" "}
          <InlineCode>S − Ke⁻ʳᵀ = {d.atm.parityRhs}</InlineCode> — a gap of ~3 × 10⁻¹⁴, i.e.
          machine precision. If this test fails by more than floating-point noise, the
          implementation is wrong; no further debugging hypotheses are needed.
        </P>
      </Section>

      <Section id="greeks" n={4} title="The Greeks as a hedging dashboard">
        <P>
          A desk does not read an option as a price; it reads it as a row of sensitivities.{" "}
          <Term>Delta</Term> is the hedge ratio — the {d.atm.delta} below says: short{" "}
          {Math.round(d.atm.delta * 100)} shares of QQQ per 100-share call contract to be locally
          flat. <Term>Gamma</Term> is how fast that hedge goes stale per $1 of spot move, and it
          peaks at the money — which is exactly where re-hedging costs concentrate.
        </P>
        <Figure
          caption="Delta and gamma across the strike ladder (1y) — gamma shown ×100"
          legend={[
            { label: "delta", tone: "aqua" },
            { label: "gamma ×100", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Delta falls smoothly from 1 to near 0 as strike rises; gamma is a bell curve peaking just above the money."
            series={[
              { y: d.greeksCurve.delta as unknown as number[], color: "teal", width: 2 },
              { y: gammaScaled as unknown as number[], color: "rust", width: 1.6, dash: "4 3" },
            ]}
            xLabels={[[0, "0.7×"], [0.25, "0.85×"], [0.5, "ATM"], [0.75, "1.15×"], [1, "1.3×"]]}
          />
        </Figure>
        <P>
          The full dashboard for the 1y ATM call (S = K = ${d.params.s0},
          σ = {pc(d.params.sigma)}, r = {pc(d.params.rf)}) — in the per-unit conventions desks
          actually quote:
        </P>
        <DataTable
          head={["Greek", "Value", "Reads as"]}
          rows={[
            ["Price (call / put)", `$${d.atm.call} / $${d.atm.put}`, "9.2% / 5.3% of spot"],
            ["Delta", d.atm.delta, "shares to short per option"],
            ["Gamma", d.atm.gamma, "delta drift per $1 spot move"],
            ["Vega (per vol pt)", `$${d.atm.vegaPt}`, "P&L per +1 vol point"],
            ["Theta (per day)", `$${d.atm.thetaDay}`, "decay per calendar day"],
            ["Rho (per rate pt)", `$${d.atm.rhoPt}`, "P&L per +1% in rates"],
          ]}
        />
        <P>
          Note the units — the single most common source of Greek confusion. Raw vega is{" "}
          <InlineCode>{d.atm.vegaRaw}</InlineCode> per 1.00 of vol; nobody quotes that, so divide
          by 100. Raw theta is <InlineCode>{d.atm.thetaYear}</InlineCode> per year; divide by 365
          for the ${Math.abs(d.atm.thetaDay).toFixed(2)}-a-day rent this option pays for its
          gamma. And delta ≈ 0.62 rather than 0.50: with r &gt; 0 and the lognormal drift, the ATM
          <Term> forward</Term> sits above spot, pulling d₁ positive.
        </P>
      </Section>

      <Section id="term" n={5} title="Vega & theta across maturities">
        <P>
          Fix the strike at the money and sweep maturity instead, and the two time-Greeks tell
          the term-structure story. Vega grows like <InlineCode>√T</InlineCode> — long-dated
          options are volatility instruments, which is why vol traders live in the back months.
          Per-day theta does the opposite: it explodes as expiry approaches, because the same
          time value must burn off over ever fewer days.
        </P>
        <Figure
          caption="ATM vega and theta vs maturity, ~2 weeks to 2 years"
          legend={[
            { label: "vega / vol pt ($)", tone: "aqua" },
            { label: "theta / day ($)", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Vega per vol point rises from near 0.4 to about 2.7 dollars as maturity extends to two years; daily theta is steeply negative for short maturities and flattens toward zero."
            series={[
              { y: d.maturity.vegaPt as unknown as number[], color: "teal", width: 2 },
              { y: d.maturity.thetaDay as unknown as number[], color: "rust", width: 1.6, dash: "4 3" },
            ]}
            xLabels={[[0, "2w"], [0.23, "6m"], [0.49, "1y"], [0.74, "18m"], [1, "2y"]]}
            hLines={[{ v: 0, color: "graphite", dash: "2 3" }]}
          />
        </Figure>
        <P>
          This trade-off <Term>is</Term> the maturity decision every options book makes: buy the
          front and you own gamma but pay brutal daily theta; buy the back and you own vega with
          gentle decay but little gamma. Our 1y ATM call sits in the middle — ${d.atm.vegaPt} of
          vega per vol point against ${Math.abs(d.atm.thetaDay).toFixed(3)} of daily decay.
        </P>
      </Section>

      <Section id="implied" n={6} title="Implied vol: the market's language">
        <P>
          Everything so far ran the formula forwards: σ in, price out. The market runs it
          backwards. Given a traded price, <Term>implied volatility</Term> is the σ that makes
          Black–Scholes reproduce it — a 1-D root-finding problem, and a safe one, because price
          is strictly increasing in σ (vega &gt; 0). Brent's method converges in a handful of
          iterations:
        </P>
        <CodeBlock
          file="implied_vol.py"
          code={`from scipy.optimize import brentq

def implied_vol(price, s, k, t, rf, kind="call"):
    return brentq(lambda sig: bs_price(s, k, t, rf, sig, kind) - price,
                  1e-4, 5.0, xtol=1e-10)

c0 = bs_price(s0, s0, 1.0, 0.04, sigma)   # ${d.atm.call}
implied_vol(c0, s0, s0, 1.0, 0.04)        # ${d.atm.ivRecovered} — input recovered
# vega sanity check: +1 vol pt should move the price by ~vega/100
bs_price(s0, s0, 1.0, 0.04, sigma + 0.01) # ${d.atm.callUp1pt}  ≈ ${d.atm.call} + ${d.atm.vegaPt}`}
        />
        <P>
          The round trip recovers our input σ = {d.atm.ivRecovered} to ten decimal places, and
          the vega check lands: bumping vol by one point moves the price from ${d.atm.call} to
          ${d.atm.callUp1pt}, almost exactly the ${d.atm.vegaPt} the dashboard promised. This
          inversion is not an academic exercise — it is how every listed option on the planet is
          quoted between professionals: not "$46.57" but "18 vol".
        </P>
        <Callout kind="Practitioner take">
          Implied vol is where the model's failure becomes useful. If Black–Scholes were true,
          every strike would imply the same σ; in reality downside QQQ puts imply more vol than
          upside calls — the <Term>skew</Term> — and the whole surface breathes with the market.
          Practitioners therefore use the formula as a <Term>translation layer</Term>: prices
          become vols, vols become comparable across strikes and expiries, and views become
          trades ("selling 2-month 25-delta puts at 24 vol against 18 realized"). The formula
          survives precisely because it stopped being a model and became a language.
        </Callout>
      </Section>

      <References
        items={[
          "Black, F. & Scholes, M. (1973). The Pricing of Options and Corporate Liabilities. Journal of Political Economy 81(3), 637–654.",
          "Merton, R. C. (1973). Theory of Rational Option Pricing. Bell Journal of Economics and Management Science 4(1), 141–183.",
          "Hull, J. Options, Futures, and Other Derivatives — ch. 19, The Greek letters.",
          <span key="nb">Companion notebook: <InlineCode>black-scholes-and-the-greeks.ipynb</InlineCode> — reproduces every figure from raw data (QQQ 2017–2024, trailing 252-day vol).</span>,
        ]}
      />
    </>
  );
}
