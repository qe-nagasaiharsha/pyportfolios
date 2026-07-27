import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";
import { LineChart } from "@/components/charts/DataCharts";
import d from "./data/black-scholes-from-first-principles";

/* Legacy upgrade — every figure below renders REAL computed results
   (QQQ 2017–2024 + ^IRX, seeded mixture calibration) baked in by
   quant/legacy/bs_first_principles.py. */

const pc = (v: number, nd = 1) => `${(v * 100).toFixed(nd)}%`;

export default function BlackScholesFromFirstPrinciples() {
  return (
    <>
      <Lead>
        Black–Scholes is usually handed down as a formula to memorise. It is more honest — and far
        more useful — as the answer to a single question: what must an option cost if you could
        hedge it perfectly? Pin that down and the formula is forced on you. We then feed it a real
        contract — an at-the-money one-year call on QQQ, with every input observed rather than
        invented — and finish by testing the assumption the market itself rejects.
      </Lead>

      <Section id="setup" n={1} title="The setup & assumptions">
        <P>
          We price a European call on a non-dividend stock. The model rests on a short list of
          assumptions, and every one of them is a place the real world will later disagree: the
          stock follows a geometric Brownian motion with constant volatility <InlineCode>σ</InlineCode>,
          the risk-free rate <InlineCode>r</InlineCode> is constant, trading is continuous and
          frictionless, and — the load-bearing one — no arbitrage is allowed.
        </P>
        <P>
          Under those rules the stock’s dynamics are <InlineCode>dS = μS·dt + σS·dW</InlineCode>.
          Notice what is <Term>not</Term> there: the drift <InlineCode>μ</InlineCode>. The
          replication argument is about to delete it, and that deletion is the whole magic trick.
        </P>
        <P>
          Before believing “constant σ”, ask the data. QQQ’s trailing one-year realised volatility
          over {d.params.start} → {d.params.end} ranged from {pc(d.vol.min)} to {pc(d.vol.max)} —
          the “constant” more than tripled inside one sample (the trailing one-<Term>month</Term>{" "}
          vol peaked far higher still around {d.vol.max21Date}). Keep that crack in mind; the smile
          in section 5 grows out of it.
        </P>
        <Figure
          caption={`QQQ trailing 1y realised volatility, ${d.params.start} → ${d.params.end}`}
          legend={[{ label: "realised σ (1y)", tone: "aqua" }]}
        >
          <LineChart
            ariaLabel="Rolling one-year realised volatility of QQQ, ranging from about 10 percent to above 36 percent, spiking after the 2020 crash and in 2022."
            series={[{ y: d.vol.roll252 as unknown as number[], area: true }]}
            xLabels={d.vol.xLabels as unknown as [number, string][]}
            yFmt={(v) => `${(v * 100).toFixed(0)}%`}
          />
        </Figure>
      </Section>

      <Section id="replication" n={2} title="The replication argument">
        <P>
          Hold one option worth <InlineCode>V(S, t)</InlineCode> and short <InlineCode>Δ</InlineCode> shares.
          Apply Itô’s lemma to <InlineCode>V</InlineCode>, then choose <InlineCode>Δ = ∂V/∂S</InlineCode> so
          that the random <InlineCode>dW</InlineCode> term cancels exactly. The portfolio is now
          instantaneously riskless — and a riskless portfolio, by no-arbitrage, must earn precisely
          the risk-free rate. Equate the two and the drift falls out, leaving a deterministic
          equation in <InlineCode>V</InlineCode>.
        </P>
        <Callout kind="The Black–Scholes PDE">
          ∂V/∂t + ½·σ²S²·∂²V/∂S² + rS·∂V/∂S − rV = 0
          <br />
          A backward parabolic PDE — the heat equation wearing a financial costume. The option’s
          payoff at expiry is its terminal boundary condition.
        </Callout>
        <P>
          The economic content is the cancellation: because we can hedge the risk away, the option’s
          fair value cannot depend on how bullish or bearish anyone feels about the stock. Only
          volatility and the rate survive.
        </P>
      </Section>

      <Section id="formula" n={3} title="The Black–Scholes formula">
        <P>
          Solving the PDE with the call payoff <InlineCode>max(S − K, 0)</InlineCode> gives the closed
          form. Everything funnels through two standardised distances, <InlineCode>d₁</InlineCode> and
          <InlineCode>d₂</InlineCode>:
        </P>
        <Callout kind="Closed form — European call">
          d₁ = [ ln(S/K) + (r + ½σ²)·T ] ⁄ (σ·√T) &nbsp;&nbsp; d₂ = d₁ − σ·√T
          <br />
          C = S·N(d₁) − K·e⁻ʳᵀ·N(d₂)
          <br />
          where N(·) is the standard normal CDF. The put follows from put–call parity.
        </Callout>
        <P>
          Read it as a probability-weighted payoff: <InlineCode>N(d₂)</InlineCode> is (roughly) the
          chance the option finishes in the money, and <InlineCode>S·N(d₁)</InlineCode> is the
          expected stock you receive, both under the risk-neutral measure. Plotted across spot for
          our real contract (K = {d.params.K}, T = 1y, σ = {pc(d.params.sigma)},
          r = {pc(d.params.r, 2)}), the formula smooths the hockey-stick payoff — the vertical gap
          between the curves is time value, and the slope of the smooth one is delta:
        </P>
        <Figure
          caption={`1y call on QQQ, K = ${d.params.K} — model price vs intrinsic value`}
          legend={[
            { label: "BS call C(S)", tone: "aqua" },
            { label: "intrinsic", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Smooth Black-Scholes call price curve lying above the hockey-stick intrinsic payoff, converging to it deep in and out of the money."
            series={[
              { y: d.curve.call as unknown as number[], color: "teal", width: 2.2 },
              { y: d.curve.intrinsic as unknown as number[], color: "graphite", width: 1.4, dash: "4 3" },
            ]}
            xLabels={[[0, "0.6·K"], [0.25, "0.8·K"], [0.5, "K"], [0.75, "1.2·K"], [1, "1.4·K"]]}
            yFmt={(v) => `$${v.toFixed(0)}`}
          />
        </Figure>
      </Section>

      <Section id="greeks" n={4} title="Pricing & the Greeks in NumPy">
        <P>
          The implementation is a direct transcription, and this time every input is observed: spot
          is QQQ’s last close of <InlineCode>${d.params.s0}</InlineCode>, the strike is the nearest
          listed <InlineCode>{d.params.K}</InlineCode>, σ is the trailing one-year realised vol
          of {pc(d.params.sigma, 2)}, and r is the 13-week T-bill yield
          of {pc(d.params.r, 2)} ({d.params.rDate}, ^IRX). The Greeks — the sensitivities that tell
          a desk how its book moves — are just the analytic derivatives of{" "}
          <InlineCode>C</InlineCode>, so they come almost for free.
        </P>
        <CodeBlock
          file="black_scholes.py"
          code={`import numpy as np
from scipy.stats import norm

def bs_price(S, K, T, r, sigma, kind="call"):
    """European Black-Scholes price. S spot, K strike, T years, r rate, sigma vol."""
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if kind == "call":
        return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

def bs_greeks(S, K, T, r, sigma):
    """Delta, Gamma, Vega (per 1% vol), Theta (per day), Rho (per 1% rate)."""
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    pdf = norm.pdf(d1)
    return {
        "delta": norm.cdf(d1),
        "gamma": pdf / (S * sigma * np.sqrt(T)),
        "vega":  S * pdf * np.sqrt(T) / 100,
        "theta": (-(S * pdf * sigma) / (2 * np.sqrt(T))
                  - r * K * np.exp(-r * T) * norm.cdf(d2)) / 365,
        "rho":   K * T * np.exp(-r * T) * norm.cdf(d2) / 100,
    }

S0, K, T = ${d.params.s0}, ${d.params.K}, 1.0     # QQQ close + nearest strike
r, sigma = ${d.params.r}, ${d.params.sigma}       # ^IRX and 1y realised vol
print(bs_price(S0, K, T, r, sigma))   # ${d.contract.call}`}
        />
        <P>
          For this contract the desk sees (put–call parity holds to{" "}
          <InlineCode>{"<"} 1e-8</InlineCode>, the free correctness check):
        </P>
        <DataTable
          head={["Greek", "Value", "Reads as"]}
          rows={[
            ["Call price", d.contract.call.toFixed(2), "fair premium"],
            ["Put price", d.contract.put.toFixed(2), "via parity: C − P = S − K·e⁻ʳᵀ"],
            ["Delta", d.contract.delta.toFixed(3), "shares to hold per option"],
            ["Gamma", d.contract.gamma.toFixed(4), "how fast delta moves"],
            ["Vega", d.contract.vega.toFixed(2), "P&L per +1% vol"],
            ["Theta", d.contract.theta.toFixed(3), "P&L per day of decay"],
            ["Rho", d.contract.rho.toFixed(2), "P&L per +1% rate"],
          ]}
        />
      </Section>

      <Section id="smile" n={5} title="Where the model breaks">
        <P>
          One assumption is a known fiction: constant volatility. If it were true, every strike on a
          name would imply the same <InlineCode>σ</InlineCode>. To see why it fails, look at the
          returns themselves: QQQ’s daily log returns carry an excess kurtosis
          of {d.reality.excessKurtosis} (a normal distribution has 0), and the worst day in the
          sample — {pc(d.reality.worstDay)} on {d.reality.worstDate} — was
          a {d.reality.worstSigmas}σ event under the model’s own calibration. A two-state Gaussian
          mixture fits those returns far better than one lognormal: a calm regime
          ({pc(d.smile.w[0], 0)} of days, σ ≈ {pc(d.smile.sigA[0])}) and a stress regime
          ({pc(d.smile.w[1], 0)} of days, σ ≈ {pc(d.smile.sigA[1])}). Price options under that
          mixture and invert each price back through Black–Scholes, and the implied σ is no longer
          flat:
        </P>
        <Figure
          caption="Implied volatility by strike — the smile a QQQ-calibrated mixture produces"
          legend={[{ label: "mixture-implied σ", tone: "aqua" }, { label: "flat BS σ", tone: "muted" }]}
        >
          <LineChart
            ariaLabel={`Implied volatility curve rising away from the money in both directions, from about ${d.smile.iv100} percent at the money toward the wings, against a flat Black-Scholes line at ${d.smile.flatPct} percent.`}
            series={[{ y: d.smile.ivPct as unknown as number[], color: "teal", width: 2.4 }]}
            hLines={[{ v: d.smile.flatPct, color: "graphite", dash: "4 4", label: `flat σ ${d.smile.flatPct}%` }]}
            xLabels={[[0, "0.70"], [0.25, "0.85"], [0.5, "ATM"], [0.75, "1.15"], [1, "1.30"]]}
            yFmt={(v) => `${v.toFixed(0)}%`}
          />
        </Figure>
        <P>
          The numbers off that curve: {d.smile.iv100}% at the money, {d.smile.iv85}% at 85%
          moneyness, {d.smile.iv115}% at 115% — a genuine smile generated by nothing more exotic
          than two volatility regimes. Real equity smiles are steeper still and asymmetric — OTM
          puts trade extra rich because crashes are fatter and faster than any symmetric mixture
          allows — but the mechanism is exactly this one: fat tails force the wings up.
        </P>
        <P>
          So is the model useless? No — it is the <Term>language</Term>. Traders quote in implied
          vol rather than price precisely because Black–Scholes gives an invertible, one-number
          translation. You stop believing the assumptions and start using the formula as a
          coordinate system. That shift — from belief to convention — is the real lesson, and the
          gateway to local-vol, stochastic-vol, and everything that repairs the smile.
        </P>
      </Section>

      <References
        items={[
          "Black, F. & Scholes, M. (1973). The Pricing of Options and Corporate Liabilities. Journal of Political Economy, 81(3).",
          "Merton, R. C. (1973). Theory of Rational Option Pricing. Bell Journal of Economics and Management Science, 4(1).",
          "Hull, J. C. Options, Futures, and Other Derivatives — chapters on the BS–Merton model and the Greeks.",
          <span key="nb">Companion notebook: <InlineCode>black-scholes-from-first-principles.ipynb</InlineCode> — reproduces every figure from raw data (QQQ + ^IRX via yfinance, seed {String(d.params.seed)}).</span>,
        ]}
      />
    </>
  );
}
