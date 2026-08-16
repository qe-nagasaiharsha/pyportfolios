import { Section, SubSection, Lead, P, Bullets, CodeBlock, DataTable, Figure, Formula } from "@/components/article/prose";
import { BOND_FUNCS, PRICE_YIELD_CODE, LADDER_CODE, ETF_CODE, TAYLOR_CODE } from "./bond-code";
import d from "./data/bond-pricing-duration-convexity";
import { BarChart, LineChart } from "@/components/charts/DataCharts";

export default function BondDurationConvexity() {
  return (
    <>
      <Lead>
        A bond is just a promise of future cash flows — so its price is entirely a question of{" "}
        <em>discounting</em>. From that single idea follow the three numbers every fixed-income desk
        lives by: <b>price</b>, <b>duration</b> (first-order rate sensitivity, the bond&apos;s Delta)
        and <b>convexity</b> (second-order, the bond&apos;s Gamma).
      </Lead>

      <Section id="summary" n={1} title="Summary">
        <P>
          A bond&apos;s price is the present value of its coupons and principal, discounted at the{" "}
          <b>yield to maturity</b>. Price and yield move inversely, and the relationship is{" "}
          <em>curved</em>, not linear. <b>Duration</b> measures the percentage price change for a
          small yield change; <b>convexity</b> corrects that estimate for the curvature — and the
          correction always works in the bondholder&apos;s favour.
        </P>
      </Section>

      <Section id="intuition" n={2} title="Intuition">
        <SubSection label="2.1" title="Discounting, not magic">
          <P>
            When market yields rise from 2% to 4%, an old bond paying 2% coupons is suddenly a bad
            deal — nobody pays face value for below-market cash flows. Its price falls until a buyer
            earns the <em>new</em> market yield. No sentiment involved: pure arithmetic.
          </P>
        </SubSection>

        <SubSection label="2.2" title="Duration = weighted waiting time">
          <P>
            Macaulay duration is the average time you wait for your money, weighting each cash flow by
            its share of present value. A 30y bond makes you wait decades → huge sensitivity. A 2y
            note returns your money quickly → barely reacts. <b>Rule of thumb: a bond loses ~duration
            × Δy percent</b> when yields rise by Δy.
          </P>
        </SubSection>

        <SubSection label="2.3" title="Convexity: the curvature that helps you">
          <P>
            The price-yield curve is convex: losses from rising yields are <em>smaller</em> than the
            linear estimate, gains from falling yields are <em>larger</em>. Long bonds have the most
            convexity — which is why duration alone increasingly misleads for big yield moves.
          </P>
        </SubSection>
      </Section>

      <Section id="mechanics" n={3} title="Theory & Mechanics">
        <P>
          With face <Formula>{String.raw`F`}</Formula>, coupon rate <Formula>{String.raw`c`}</Formula>{" "}
          (paid <Formula>{String.raw`f`}</Formula> times a year), yield <Formula>{String.raw`y`}</Formula>{" "}
          and <Formula>{String.raw`n = fT`}</Formula> periods:
        </P>
        <Formula block>{String.raw`P = \sum_{i=1}^{n} \frac{cF/f}{(1+y/f)^i} + \frac{F}{(1+y/f)^n}`}</Formula>
        <P>
          <b>Macaulay duration</b> (years):{" "}
          <Formula>{String.raw`D_{mac} = \frac{1}{P}\sum_i t_i \cdot PV(CF_i)`}</Formula>, and{" "}
          <b>modified duration</b> <Formula>{String.raw`D = D_{mac}/(1+y/f)`}</Formula>.
        </P>
        <P>
          <b>Convexity</b> <Formula>{String.raw`C`}</Formula> is the second derivative of price w.r.t.
          yield, scaled by price. Both derivatives can also be computed numerically — which is how
          we&apos;ll verify the analytic formulas:
        </P>
        <Formula block>{String.raw`\frac{\Delta P}{P} \approx -D\,\Delta y + \tfrac{1}{2} C (\Delta y)^2`}</Formula>
        <CodeBlock code={BOND_FUNCS} />
      </Section>

      <Section id="example" n={4} title="Applied Example — US Treasuries">
        <SubSection label="4.1" title="The price-yield curve, by maturity">
          <P>
            Same 4% coupon, three maturities. Watch two things: the <b>slope</b> (longer = steeper =
            more duration) and the <b>curvature</b> (longer = more convex).
          </P>
          <CodeBlock code={PRICE_YIELD_CODE} />
          <Figure caption="Figure 4.1 · Price vs yield — 4% coupon, three maturities">
            <LineChart
              ariaLabel="Price against yield for a 4% coupon bond at three maturities; every curve slopes down and the longest maturity is both the steepest and the most curved"
              h={260}
              series={[{ y: [...d.priceYield.price], color: "teal", width: 2 },
                       { y: [...d.priceYield.tangent], color: "graphite", dash: "5 4" }]}
              xLabels={d.priceYield.xLabels.map((x) => [x[0], x[1]] as [number, string])}
              yFmt={(v) => v.toFixed(0)}
              xLabel="Yield"
              yLabel="Price"
            />
          </Figure>
        </SubSection>

        <SubSection label="4.2" title="The duration ladder: a +100bp shock">
          <P>
            The whole risk story in one table — duration grows with maturity, and so does the damage
            from the same yield move.
          </P>
          <CodeBlock code={LADDER_CODE} />
          <DataTable
            variant="prose"
            head={["Maturity (y)", "Mod. duration", "Convexity", "Exact dP for +100bp"]}
            rows={[
              ["1", "0.97", "1.4", "-0.96%"],
              ["2", "1.90", "4.6", "-1.88%"],
              ["5", "4.49", "23.5", "-4.38%"],
              ["10", "8.18", "78.9", "-7.79%"],
              ["20", "13.68", "239.9", "-12.55%"],
              ["30", "17.38", "420.8", "-15.45%"],
            ]}
          />
        </SubSection>

        <SubSection label="4.3" title="Reality check: SHY, IEF, TLT in 2022">
          <P>
            2022 was the worst bond year in modern history: the 2y yield rose ~370bp, the 10y ~237bp,
            the 30y ~207bp. If duration analytics mean anything, the three Treasury ETFs&apos; losses
            should line up with their durations (~1.9 / ~7.5 / ~17.5). Let&apos;s check against real
            prices.
          </P>
          <CodeBlock code={ETF_CODE} />
          <DataTable
            variant="prose"
            head={["ETF", "duration", "dY 2022", "predicted -D*dY", "actual 2022"]}
            rows={[
              ["SHY", "1.9", "3.70%", "-7.0%", "-3.9%"],
              ["IEF", "7.5", "2.37%", "-17.8%", "-15.2%"],
              ["TLT", "17.5", "2.07%", "-36.2%", "-31.2%"],
            ]}
          />
          <Figure caption="Figure 4.3 · 2022 — the duration ladder in real life (indexed to 100)">
            <LineChart
              ariaLabel="SHY, IEF and TLT indexed to 100 through 2022; all three fall, and the drawdown deepens with duration"
              h={260}
              series={[{ y: [...d.etf2022.shy], color: "teal", width: 1.6 },
                       { y: [...d.etf2022.ief], color: "amber", width: 1.6 },
                       { y: [...d.etf2022.tlt], color: "rust", width: 1.6 }]}
              xLabels={d.etf2022.xLabels.map((x) => [x[0], x[1]] as [number, string])}
              yFmt={(v) => v.toFixed(0)}
              xLabel="2022"
              yLabel="Indexed to 100"
            />
          </Figure>
          <P>
            The ranking is exactly as duration predicts — and the gaps between predicted and actual
            returns are the tutorial&apos;s best teaching moment: coupon carry, convexity (helping
            TLT), and the fact that ETFs hold rolling portfolios rather than a single bond all show up
            in the residual.
          </P>
        </SubSection>

        <SubSection label="4.4" title="Sanity check: how good is the Taylor approximation?">
          <P>
            Duration-only vs duration+convexity vs exact repricing, for the 30y bond across shocks up
            to ±300bp.
          </P>
          <CodeBlock code={TAYLOR_CODE} />
          <Figure caption="Figure 4.4 · 30y bond — Taylor approximation quality">
            <BarChart
              ariaLabel="Actual price change against the duration-only and duration-plus-convexity approximations across yield shocks from minus 200 to plus 200 basis points"
              h={250}
              labels={d.stress.rows.map((r) => `${r.bp > 0 ? "+" : ""}${r.bp}bp`)}
              groups={[
                { values: d.stress.rows.map((r) => r.durOnly), color: "graphite" },
                { values: d.stress.rows.map((r) => r.durConv), color: "teal" },
                { values: d.stress.rows.map((r) => r.full), color: "rust" },
              ]}
              yFmt={(v) => `${v.toFixed(0)}%`}
              xLabel="Yield shock"
              yLabel="Price change"
            />
          </Figure>
        </SubSection>
      </Section>

      <Section id="conclusion" n={5} title="Conclusion">
        <SubSection label="5a" title="Strengths">
          <Bullets
            items={[
              <><b>One framework, any bond</b> — price, duration and convexity summarise rate risk in three numbers</>,
              <><b>First-order accuracy is excellent</b> for small yield moves — the industry&apos;s daily risk language</>,
              <><b>Convexity correction</b> keeps the approximation honest even for ±200bp shocks</>,
              <><b>Model-free verification</b> — ETF drawdowns in 2022 line up with durations, straight from public data</>,
            ]}
          />
        </SubSection>

        <SubSection label="5b" title="Weaknesses & Limitations">
          <Bullets
            items={[
              <><b>Parallel-shift assumption</b> — duration assumes the whole curve moves together; real curves twist and steepen (key-rate durations fix this)</>,
              <><b>Constant yield reinvestment</b> — YTM assumes coupons reinvest at the same rate</>,
              <><b>Credit ignored</b> — this is a rates framework; spreads and default risk need their own layer</>,
              <><b>ETF ≠ single bond</b> — rolling portfolios have carry and roll-down effects the single-bond math misses</>,
            ]}
          />
        </SubSection>

        <SubSection label="5c" title="Applications in Practice">
          <Bullets
            items={[
              "Portfolio duration targeting and immunisation",
              "Rate-shock stress tests (the ±100bp tables in every risk report)",
              "Barbell vs bullet trades — convexity is the whole game",
            ]}
          />
        </SubSection>

        <SubSection label="5d" title="Alternatives & Extensions">
          <Bullets
            items={[
              <><b>Key-rate durations</b> — sensitivity to individual curve points</>,
              <><b>Yield curve bootstrapping with QuantLib</b> — the natural companion piece (curriculum M2)</>,
              <><b>Term-structure models</b> — Vasicek, Hull-White, CIR for simulating rates rather than shocking them</>,
              <><b>The SVB collapse</b> — our future case study on what happens when duration risk meets deposit flight</>,
            ]}
          />
        </SubSection>
      </Section>
    </>
  );
}
