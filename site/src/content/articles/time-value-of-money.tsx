import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";

export default function TimeValueOfMoney() {
  return (
    <>
      <Lead>
        Every valuation in finance — a bond, a swap, a discounted-cash-flow model, an option — is
        the same gesture repeated: take cash you will receive later, and ask what it is worth now.
        Get this one idea precise and most of fixed income stops being mysterious.
      </Lead>

      <Section id="intro" n={1} title="Money has a time stamp">
        <P>
          A dollar today is worth more than a dollar next year, and not because of inflation. It is
          because today’s dollar can be invested and earn the risk-free rate in between. That
          opportunity cost is the <Term>time value of money</Term>, and the exchange rate between
          “now” and “later” is the <Term>discount factor</Term>.
        </P>
      </Section>

      <Section id="discounting" n={2} title="Discounting & present value">
        <P>
          If a safe rate <InlineCode>r</InlineCode> compounds annually, then <InlineCode>1</InlineCode>
          today grows to <InlineCode>(1 + r)ᵗ</InlineCode> in <InlineCode>t</InlineCode> years. Run
          that backwards and a cashflow <InlineCode>Cₜ</InlineCode> arriving at time
          <InlineCode>t</InlineCode> is worth, today:
        </P>
        <Callout kind="Present value">
          PV = Cₜ ⁄ (1 + r)ᵗ = Cₜ · DF(t) &nbsp;&nbsp; where DF(t) = (1 + r)⁻ᵗ
          <br />
          The discount factor DF(t) is the price, today, of one dollar delivered at time t.
        </Callout>
        <P>
          The present value of a whole stream is just the sum of its discounted parts. Price is a
          dot product: cashflows against discount factors.
        </P>
      </Section>

      <Section id="compounding" n={3} title="Compounding conventions">
        <P>
          The same rate means different things depending on how often it compounds. Compound
          <InlineCode>m</InlineCode> times a year and a dollar becomes <InlineCode>(1 + r/m)^(mt)</InlineCode>;
          let <InlineCode>m → ∞</InlineCode> and you reach the clean continuous form
          <InlineCode>eʳᵗ</InlineCode>, which is why quant code almost always discounts with
          <InlineCode>e⁻ʳᵗ</InlineCode> — it composes additively across time and never re-quotes the
          convention.
        </P>
        <DataTable
          head={["Convention", "1 grows to", "DF(t)"]}
          rows={[
            ["Annual", "(1 + r)^t", "(1 + r)^−t"],
            ["m / year", "(1 + r/m)^(mt)", "(1 + r/m)^(−mt)"],
            ["Continuous", "e^(rt)", "e^(−rt)"],
          ]}
        />
        <P>
          These are not different economics, only different units. Always know which one a quoted
          rate uses before you trust a number built from it — mismatched conventions are a classic
          source of silent pricing bugs.
        </P>
      </Section>

      <Section id="curve" n={4} title="From rates to a discount curve">
        <P>
          The real world has not one rate but a whole <Term>term structure</Term>: a different zero
          rate for each maturity. Collect the discount factors across maturities and you have the
          <Term>discount curve</Term> — the single object every desk values cashflows against.
          Bootstrapping that curve from traded instruments is its own topic; here we take the zero
          rates as given and build the curve directly.
        </P>
        <Figure caption="Discount factor by maturity — one dollar gets cheaper the later it arrives" legend={[{ label: "DF(t)", tone: "aqua" }]}>
          <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label="Discount factor decays smoothly from 1 toward 0 as maturity increases.">
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" y1={180 - f * 160} x2="600" y2={180 - f * 160} stroke="#4a4a42" strokeOpacity="0.12" strokeWidth="1" />
            ))}
            <path className="draw-on-view" d="M0,20 C150,55 320,110 600,150" fill="none" stroke="#0a8a8a" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="0" cy="20" r="3.5" fill="#0a8a8a" />
            <text x="10" y="16" className="t-mono" fontSize="12" fill="#4a4a42">1.00</text>
            <text x="566" y="170" textAnchor="end" className="t-mono" fontSize="12" fill="#4a4a42">30y</text>
          </svg>
        </Figure>
      </Section>

      <Section id="code" n={5} title="Valuing cashflows in pandas">
        <P>
          Here is the entire idea as code: price a 5% annual-coupon bond off a continuously
          compounded zero curve. The valuation is one line — <InlineCode>flow · df</InlineCode>,
          summed.
        </P>
        <CodeBlock
          file="present_value.py"
          code={`import numpy as np
import pandas as pd

def discount_factors(times, zero_rates):       # continuous compounding
    return np.exp(-np.asarray(zero_rates) * np.asarray(times))

# a 5% annual coupon bond, par 100, 5 years
cf = pd.DataFrame({"t": [1, 2, 3, 4, 5], "flow": [5, 5, 5, 5, 105]})

curve = {1: 0.030, 2: 0.033, 3: 0.035, 4: 0.036, 5: 0.037}   # zero rates
cf["rate"] = cf["t"].map(curve)
cf["df"]   = discount_factors(cf["t"], cf["rate"])
cf["pv"]   = cf["flow"] * cf["df"]

price = cf["pv"].sum()
print(f"Bond price: {price:,.2f}")            # 105.63`}
        />
        <DataTable
          head={["t (yr)", "Cashflow", "DF(t)", "PV"]}
          rows={[
            [1, "5", "0.9704", "4.85"],
            [2, "5", "0.9361", "4.68"],
            [3, "5", "0.9003", "4.50"],
            [4, "5", "0.8659", "4.33"],
            [5, "105", "0.8311", "87.26"],
            ["Σ", "", "", "105.63"],
          ]}
        />
        <P>
          Change the curve and the price moves; that sensitivity is duration, the next idea in the
          chain. But it is all this same dot product underneath — which is exactly why discounting
          is the first thing to get right and the last thing you should ever hand-wave.
        </P>
      </Section>

      <References
        items={[
          "Hull, J. C. Options, Futures, and Other Derivatives — interest rates and the term structure.",
          "Veronesi, P. Fixed Income Securities — discounting, bootstrapping and curve construction.",
        ]}
      />
    </>
  );
}
