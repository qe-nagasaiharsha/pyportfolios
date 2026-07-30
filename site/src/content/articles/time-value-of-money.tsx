import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";
import { LineChart } from "@/components/charts/DataCharts";
import d from "./data/time-value-of-money";

/* Legacy upgrade — every figure below renders REAL computed results
   (US Treasury yields ^IRX ^FVX ^TNX ^TYX, Dec 2021 – Jan 2023) baked in
   by quant/legacy/tvm.py. */

export default function TimeValueOfMoney() {
  return (
    <>
      <Lead>
        Every valuation in finance — a bond, a swap, a discounted-cash-flow model, an option — is
        the same gesture repeated: take cash you will receive later, and ask what it is worth now.
        Get this one idea precise and most of fixed income stops being mysterious. And there is no
        better sample to make it concrete than calendar 2022, when the US Treasury market repriced
        the value of time faster than at any point in four decades.
      </Lead>

      <Section id="intro" n={1} title="Money has a time stamp">
        <P>
          A dollar today is worth more than a dollar next year, and not because of inflation. It is
          because today’s dollar can be invested and earn the risk-free rate in between. That
          opportunity cost is the <Term>time value of money</Term>, and the exchange rate between
          “now” and “later” is the <Term>discount factor</Term>.
        </P>
        <P>
          For a while the time stamp nearly faded: on {d.params.janDate} the 13-week T-bill yielded
          all of {d.history.irxStart}%. By {d.params.decDate} it paid {d.history.irxEnd}%. Money
          re-acquired its price in a single year — which is exactly why every number in this
          article is read off that tape rather than invented.
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
          dot product: cashflows against discount factors. Concretely: $100 arriving in ten years
          was worth ${d.pv.pvJan.toFixed(2)} at the start of 2022 (10y zero
          at {(d.pv.y10Jan * 100).toFixed(2)}%) and only ${d.pv.pvDec.toFixed(2)} at the end of it
          ({(d.pv.y10Dec * 100).toFixed(2)}%) — the same promise, repriced by ~17 dollars without
          the promisor changing at all.
        </P>
      </Section>

      <Section id="compounding" n={3} title="Compounding conventions">
        <P>
          The same rate means different things depending on how often it compounds. Compound
          <InlineCode>m</InlineCode> times a year and a dollar becomes <InlineCode>(1 + r/m)^(mt)</InlineCode>;
          let <InlineCode>m → ∞</InlineCode> and you reach the clean continuous form
          <InlineCode>eʳᵗ</InlineCode>, which is why quant code almost always discounts with
          <InlineCode>e⁻ʳᵗ</InlineCode> — it composes additively across time and never re-quotes the
          convention. At the real end-2022 10y zero of {d.compounding.ratePct}%, DF(10) works out
          to:
        </P>
        <DataTable
          head={["Convention", "1 grows to", "DF(t)", `DF(10y) @ ${d.compounding.ratePct}%`]}
          rows={[
            ["Annual", "(1 + r)^t", "(1 + r)^−t", d.compounding.annual.toFixed(4)],
            ["Semi-annual", "(1 + r/2)^(2t)", "(1 + r/2)^(−2t)", d.compounding.semi.toFixed(4)],
            ["Monthly", "(1 + r/12)^(12t)", "(1 + r/12)^(−12t)", d.compounding.monthly.toFixed(4)],
            ["Continuous", "e^(rt)", "e^(−rt)", d.compounding.continuous.toFixed(4)],
          ]}
        />
        <P>
          These are not different economics, only different units — but the annual and continuous
          columns already differ by {((d.compounding.annual - d.compounding.continuous) * 100).toFixed(2)}{" "}
          cents on the dollar over ten years. Always know which convention a quoted rate uses
          before you trust a number built from it — mismatched conventions are a classic source of
          silent pricing bugs.
        </P>
      </Section>

      <Section id="curve" n={4} title="From rates to a discount curve">
        <P>
          The real world has not one rate but a whole <Term>term structure</Term>: a different zero
          rate for each maturity. Yahoo’s Treasury yield indices give us four live points on it —
          13 weeks (^IRX), 5y (^FVX), 10y (^TNX) and 30y (^TYX) — and 2022 moved all four
          violently:
        </P>
        <Figure
          caption={`US Treasury yields, ${d.params.start} → ${d.params.end}`}
          legend={[
            { label: "3m", tone: "aqua" },
            { label: "5y / 10y / 30y", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Four Treasury yields rising through 2022: the 3-month bill from near zero to above 4 percent, the 5, 10 and 30 year yields from 1 to 2 percent up to around 4 percent."
            series={[
              { y: d.history.tyx as unknown as number[], color: "amber", width: 1.3 },
              { y: d.history.tnx as unknown as number[], color: "slate", width: 1.3 },
              { y: d.history.fvx as unknown as number[], color: "graphite", width: 1.3 },
              { y: d.history.irx as unknown as number[], color: "teal", width: 2.2 },
            ]}
            xLabels={d.history.xLabels as unknown as [number, string][]}
            yFmt={(v) => `${v.toFixed(0)}%`}
          />
        </Figure>
        <P>
          Collect the discount factors those zeros imply across maturities and you have the
          <Term>discount curve</Term> — the single object every desk values cashflows against.
          Bootstrapping a dense curve from traded instruments is its own topic; here we interpolate
          the four observed zeros and discount continuously, <InlineCode>DF(t) = e^(−y(t)·t)</InlineCode>.
          The repricing is brutal at the long end: a 2052 dollar was worth {d.curves.dfJan30.toFixed(2)} in
          January 2022 and {d.curves.dfDec30.toFixed(2)} by December.
        </P>
        <Figure
          caption="Discount factor by maturity — one dollar gets cheaper the later it arrives"
          legend={[
            { label: `DF(t), ${d.params.decDate}`, tone: "aqua" },
            { label: `DF(t), ${d.params.janDate}`, tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Two discount factor curves decaying from 1: the January 2022 curve ends near 0.55 at 30 years, the December 2022 curve near 0.30."
            series={[
              { y: d.curves.dfJan as unknown as number[], color: "graphite", width: 1.4, dash: "4 3" },
              { y: d.curves.dfDec as unknown as number[], color: "teal", width: 2.2, area: true },
            ]}
            xLabels={[[0, "0"], [1 / 6, "5y"], [1 / 3, "10y"], [2 / 3, "20y"], [1, "30y"]]}
            yMin={0}
          />
        </Figure>
      </Section>

      <Section id="code" n={5} title="Valuing cashflows in pandas">
        <P>
          Here is the entire idea as code: price a 5% annual-coupon bond off the real end-2022 zero
          curve (interpolated from the four observed points above). The valuation is one line —
          <InlineCode>flow · df</InlineCode>, summed.
        </P>
        <CodeBlock
          file="present_value.py"
          code={`import numpy as np
import pandas as pd
import yfinance as yf

ylds = yf.download(["^IRX", "^FVX", "^TNX", "^TYX"],   # 13w, 5y, 10y, 30y (%)
                   start="2021-12-01", end="2023-01-10",
                   auto_adjust=True, progress=False)["Close"]
zeros = ylds.loc["${d.params.decDate}", ["^IRX", "^FVX", "^TNX", "^TYX"]] / 100
curve = lambda t: np.interp(t, [0.25, 5, 10, 30], zeros)   # zero rates y(t)

# a 5% annual coupon bond, par 100, 5 years
cf = pd.DataFrame({"t": [1, 2, 3, 4, 5], "flow": [5, 5, 5, 5, 105]})

cf["rate"] = curve(cf["t"].to_numpy(dtype=float))
cf["df"]   = np.exp(-cf["rate"] * cf["t"])     # continuous compounding
cf["pv"]   = cf["flow"] * cf["df"]

price = cf["pv"].sum()
print(f"Bond price: {price:,.2f}")            # ${d.bond.priceDec.toFixed(2)}`}
        />
        <DataTable
          head={["t (yr)", "Cashflow", "zero y(t)", "DF(t)", "PV"]}
          rows={[
            ...d.bond.times.map((t, i) => [
              t,
              d.bond.flows[i].toFixed(0),
              `${d.bond.zeroPct[i].toFixed(2)}%`,
              d.bond.df[i].toFixed(4),
              d.bond.pv[i].toFixed(2),
            ]),
            ["Σ", "", "", "", d.bond.priceDec.toFixed(2)],
          ]}
        />
        <P>
          Change the curve and the price moves: the identical bond discounted off the
          January 2022 curve is worth {d.bond.priceJan.toFixed(2)} —{" "}
          {(d.bond.priceJan - d.bond.priceDec).toFixed(2)} points of par gone to one year of rate
          moves. That sensitivity is duration, the next idea in the chain. But it is all this same
          dot product underneath — which is exactly why discounting is the first thing to get right
          and the last thing you should ever hand-wave.
        </P>
      </Section>

      <References
        items={[
          "Hull, J. C. Options, Futures, and Other Derivatives — interest rates and the term structure.",
          "Veronesi, P. Fixed Income Securities — discounting, bootstrapping and curve construction.",
          <span key="nb">Companion notebook: <InlineCode>time-value-of-money.ipynb</InlineCode> — reproduces every figure from raw data (Treasury yields via yfinance).</span>,
        ]}
      />
    </>
  );
}
