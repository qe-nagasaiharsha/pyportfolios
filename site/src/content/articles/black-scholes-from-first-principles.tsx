import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";

export default function BlackScholesFromFirstPrinciples() {
  return (
    <>
      <Lead>
        Black–Scholes is usually handed down as a formula to memorise. It is more honest — and far
        more useful — as the answer to a single question: what must an option cost if you could
        hedge it perfectly? Pin that down and the formula is forced on you.
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
          expected stock you receive, both under the risk-neutral measure.
        </P>
      </Section>

      <Section id="greeks" n={4} title="Pricing & the Greeks in NumPy">
        <P>
          The implementation is a direct transcription. The Greeks — the sensitivities that tell a
          desk how its book moves — are just the analytic derivatives of <InlineCode>C</InlineCode>,
          so they come almost for free.
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

print(bs_price(100, 100, 1.0, 0.02, 0.20))   # 8.92`}
        />
        <P>
          For an at-the-money one-year call (<InlineCode>S = K = 100</InlineCode>,
          <InlineCode>r = 2%</InlineCode>, <InlineCode>σ = 20%</InlineCode>) the desk sees:
        </P>
        <DataTable
          head={["Greek", "Value", "Reads as"]}
          rows={[
            ["Price", "8.92", "fair premium"],
            ["Delta", "0.579", "shares to hold per option"],
            ["Gamma", "0.0196", "how fast delta moves"],
            ["Vega", "0.391", "P&L per +1% vol"],
            ["Theta", "−0.0134", "P&L per day of decay"],
            ["Rho", "0.490", "P&L per +1% rate"],
          ]}
        />
      </Section>

      <Section id="smile" n={5} title="Where the model breaks">
        <P>
          One assumption is a known fiction: constant volatility. If it were true, every strike on a
          name would imply the same <InlineCode>σ</InlineCode>. Invert real option prices and you get
          the opposite — a <Term>smile</Term> (or, in equities, a downward skew). Out-of-the-money
          puts trade rich because crashes are fatter and faster than a lognormal allows.
        </P>
        <Figure
          caption="Implied volatility by strike — the smile BS cannot produce"
          legend={[{ label: "Implied σ", tone: "aqua" }, { label: "BS (flat)", tone: "muted" }]}
        >
          <svg viewBox="0 0 600 220" className="w-full" role="img" aria-label="Implied volatility rises away from the money, against the flat Black-Scholes line.">
            <line x1="0" y1="150" x2="600" y2="150" stroke="#4a4a42" strokeOpacity="0.5" strokeWidth="1.4" strokeDasharray="4 4" />
            <path className="draw-on-view" d="M20,70 C120,140 240,176 300,178 C360,176 480,128 580,52" fill="none" stroke="#0a8a8a" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="300" cy="178" r="3.5" fill="#0a8a8a" />
            <text x="300" y="205" textAnchor="middle" className="t-mono" fontSize="13" fill="#4a4a42">at the money</text>
            <text x="34" y="52" className="t-mono" fontSize="13" fill="#0a8a8a">OTM puts</text>
            <text x="566" y="40" textAnchor="end" className="t-mono" fontSize="13" fill="#0a8a8a">OTM calls</text>
          </svg>
        </Figure>
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
        ]}
      />
    </>
  );
}
