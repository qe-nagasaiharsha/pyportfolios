/* Bond Pricing, Duration & Convexity.

   Prose follows the v2 notebook (01-03_T_BondDuration_v2) section for section:
   Introduction / Intuition / Theory / Application / Conclusion. The notebook is
   the source of the words; every figure and table reads the generated data
   module, so the numbers on the page are the numbers the code computed. */

import { Section, SubSection, Lead, P, Bullets, CodeBlock, DataTable, Figure, Formula } from "@/components/article/prose";
import { ProjectCard } from "@/components/article/ProjectCard";
import { BOND_FUNCS, PRICE_YIELD_CODE, LADDER_CODE, ETF_CODE, TAYLOR_CODE } from "./bond-code";
import d from "./data/bond-pricing-duration-convexity";
import { Line } from "@/components/charts/echarts/Line";

export default function BondDurationConvexity() {
  return (
    <>
      <Lead>Measuring interest rate risk with the key fixed income metrics.</Lead>

      <Bullets
        items={[
          <>A bond is a stream of promised cash flows, so its price is a question of <b>discounting</b>.</>,
          <><b>Duration</b> is the bond&apos;s delta: the first-order sensitivity of price to yield.</>,
          <><b>Convexity</b> is its gamma — the curvature correction, and it works, for option-free bonds, in the holder&apos;s favour.</>,
          <>Together they summarize the cash-flow schedule into 2 numbers of the risk report.</>,
          <>2022 turned the theory into a live experiment: the same rate shock hit short and long bonds differently.</>,
        ]}
      />

      <ProjectCard slug="bond-duration-convexity" />

      <Section id="summary" n={1} title="Summary">
        <P>A few simple facts to get up to speed:</P>
        <Bullets
          items={[
            <>A bond&apos;s price is the <b>present value</b> of its coupons and principal, discounted at the yield to maturity.</>,
            <>Price and yield move <b>inversely</b>, and the relationship is <em>curved</em>, not straight.</>,
            <><b>2 numbers</b> summarise that relationship — both computable from the cash-flow schedule alone: <b>duration</b> <Formula key="d">{String.raw`D`}</Formula> (the slope: % price change per 1% yield change) and <b>convexity</b> <Formula key="c">{String.raw`C`}</Formula> (the curvature: how the slope itself changes).</>,
          ]}
        />
      </Section>

      <Section id="intuition" n={2} title="Intuition">
        <P>The logic before diving into equations.</P>

        <SubSection label="2.1" title="Discounting, not sentiment">
          <Bullets
            items={[
              <>When market yields rise from 2% to 4%, a bond still paying 2% coupons is simply a worse deal.</>,
              <>Its price falls until a new buyer earns the <em>current</em> market yield.</>,
              <>Nothing behavioural is involved — it is arithmetic on fixed cash flows.</>,
            ]}
          />
        </SubSection>

        <SubSection label="2.2" title="Macaulay duration is the weighted average waiting time">
          <Bullets
            items={[
              <>Each cash flow is weighted by its share of present value, then averaged by the time you wait for it.</>,
              <>A 30-year bond makes you wait decades, so a small yield change compounds over a long horizon.</>,
              <>Rule of thumb (modified duration): a bond changes roughly <Formula key="r">{String.raw`-D \times \Delta y`}</Formula> per cent when yields rise by <Formula key="dy">{String.raw`\Delta y`}</Formula>.</>,
            ]}
          />
        </SubSection>

        <SubSection label="2.3" title="Convexity is the holder's friend">
          <Bullets
            items={[
              <>The price-yield curve bends upward, so losses from rising yields are <em>smaller</em> than the straight-line estimate.</>,
              <>Gains from falling yields are correspondingly <em>larger</em>.</>,
              <>Long bonds have the most convexity — which is why duration alone increasingly misleads for big moves.</>,
            ]}
          />
        </SubSection>
      </Section>

      <Section id="mechanics" n={3} title="Theory &amp; Mechanics">
        <P>Below the theoretical foundation and respective equations.</P>

        <SubSection label="3.1" title="The pricing formula">
          <P>
            Face <Formula>{String.raw`F`}</Formula>, annual coupon rate <Formula>{String.raw`c`}</Formula>{" "}
            paid <Formula>{String.raw`f`}</Formula> times a year, yield <Formula>{String.raw`y`}</Formula>,
            and <Formula>{String.raw`n = fT`}</Formula> periods.
          </P>
          <Formula block>{String.raw`P = \sum_{i=1}^{n} \frac{cF/f}{(1+y/f)^i} + \frac{F}{(1+y/f)^n}`}</Formula>
        </SubSection>

        <SubSection label="3.2" title="Duration and convexity">
          <P>
            Macaulay duration is the PV-weighted average time to a cash flow; modified duration
            rescales it into a price sensitivity.
          </P>
          <Formula block>{String.raw`D_{mac} = \frac{1}{P}\sum_i t_i\,PV(CF_i), \qquad D = \frac{D_{mac}}{1+y/f}, \qquad C = \frac{1}{P}\frac{\partial^2 P}{\partial y^2}`}</Formula>
        </SubSection>

        <SubSection label="3.3" title="The second-order approximation">
          <P>
            This is the equation risk reports actually use — duration for the slope, convexity for
            the correction.
          </P>
          <Formula block>{String.raw`\frac{\Delta P}{P} \approx -D\,\Delta y + \tfrac{1}{2}C\,(\Delta y)^2`}</Formula>
          <P>
            The two functions below implement this: one returns the <b>price</b>, the other the{" "}
            <b>sensitivities</b> by central difference.
          </P>
          <CodeBlock code={BOND_FUNCS} />
        </SubSection>
      </Section>

      <Section id="example" n={4} title="Applied Example — US Treasuries">
        <SubSection label="4.1" title="The price-yield curve, by maturity">
          <Bullets
            items={[
              <>Same 4% coupon, 3 maturities, plotted across a wide yield range.</>,
              <>Watch the <b>slope</b> (longer = steeper = more duration) and the <b>curvature</b> (longer = more convex).</>,
            ]}
          />
          <CodeBlock code={PRICE_YIELD_CODE} />
          <Figure caption="Figure 4.1 · Price vs yield — 4% coupon, three maturities">
            <Line
              ariaLabel="Price against yield for a 4% coupon bond at three maturities; every curve slopes down and the longest maturity is both the steepest and the most curved"
              height={260}
              series={[{ name: "2y Treasury", y: [...d.curves.p2], color: "graphite", width: 2 },
                       { name: "10y Treasury", y: [...d.curves.p10], color: "teal", width: 2 },
                       { name: "30y Treasury", y: [...d.curves.p30], color: "rust", width: 2 }]}
              xLabels={d.curves.xLabels.map((x) => [x[0], x[1]] as [number, string])}
              yFmt={{ decimals: 0 }}
              xName="Yield"
              yName="Price"
            />
          </Figure>
        </SubSection>

        <SubSection label="4.2" title="The duration ladder — 1 shock, 6 maturities">
          <Bullets
            items={[
              <>A parallel +100bp move applied across the curve, priced exactly rather than approximated.</>,
              <>Duration rises with maturity, and so does the damage — this table <em>is</em> the risk report.</>,
            ]}
          />
          <CodeBlock code={LADDER_CODE} />
          <DataTable
            variant="prose"
            head={["Maturity (y)", "Mod. duration", "Convexity", "Exact dP for +100bp"]}
            rows={d.ladder.rows.map((r) => [
              String(r.maturity),
              r.duration.toFixed(2),
              r.convexity.toFixed(1),
              r.exact100.toFixed(2) + "%",
            ])}
          />
        </SubSection>

        <SubSection label="4.3" title="Reality check: SHY, IEF and TLT in 2022">
          <Bullets
            items={[
              <>2022 was the worst bond year in modern history: the 2y yield rose ~370bp, the 10y ~237bp, the 30y ~207bp.</>,
              <>The three Treasury ETFs carry durations of roughly <b>1.9 / 7.5 / 17.5</b> years, so their losses should rank accordingly.</>,
              <>The gap between predicted <Formula key="p">{String.raw`-D\Delta y`}</Formula> and realised return is itself the lesson: coupon carry, convexity and the fact that ETFs hold <em>rolling</em> portfolios all live in that residual.</>,
            ]}
          />
          <CodeBlock code={ETF_CODE} />
          <DataTable
            variant="prose"
            head={["ETF", "duration", "dY 2022", "predicted -D*dY", "actual 2022"]}
            rows={d.etfPredict.rows.map((r) => [
              r.etf,
              r.duration.toFixed(1),
              (r.dyBp / 100).toFixed(2) + "%",
              r.predicted.toFixed(1) + "%",
              r.actual.toFixed(1) + "%",
            ])}
          />
          <Figure caption="Figure 4.3 · 2022 — the duration ladder in real life (indexed to 100)">
            <Line
              ariaLabel="SHY, IEF and TLT indexed to 100 through 2022; all three fall, and the drawdown deepens with duration"
              height={260}
              series={[{ name: "SHY", y: [...d.etf2022.shy], color: "teal", width: 1.6 },
                       { name: "IEF", y: [...d.etf2022.ief], color: "amber", width: 1.6 },
                       { name: "TLT", y: [...d.etf2022.tlt], color: "rust", width: 1.6 }]}
              xLabels={d.etf2022.xLabels.map((x) => [x[0], x[1]] as [number, string])}
              yFmt={{ decimals: 0 }}
              xName="2022"
              yName="Indexed to 100"
            />
          </Figure>
        </SubSection>

        <SubSection label="4.4" title="Sanity check: how good is the approximation?">
          <Bullets
            items={[
              <>Duration alone is a straight line; adding convexity bends it toward the true price curve.</>,
              <><b>How to read the result:</b> the two approximations are indistinguishable for small shocks and diverge visibly beyond roughly ±100bp.</>,
              <>The duration-only line always sits <em>below</em> the exact curve — it overstates losses and understates gains, which is convexity working for the holder.</>,
            ]}
          />
          <CodeBlock code={TAYLOR_CODE} />
          <Figure caption={`Figure 4.4 · ${d.taylor.maturity}y bond — Taylor approximation quality (D=${d.taylor.duration.toFixed(1)}, C=${d.taylor.convexity.toFixed(0)})`}>
            <Line
              ariaLabel="Exact price change for a 30-year bond against the duration-only and duration-plus-convexity approximations, across yield shocks from minus 300 to plus 300 basis points; the duration-only line sits below the exact curve on both sides"
              height={250}
              series={[
                { name: "exact repricing", y: [...d.taylor.exact], color: "rust", width: 2 },
                { name: "duration + convexity", y: [...d.taylor.quad], color: "teal", width: 2 },
                { name: "duration only", y: [...d.taylor.lin], color: "graphite", width: 2, dash: true },
              ]}
              xLabels={d.taylor.xLabels.map((x) => [x[0], x[1]] as [number, string])}
              yFmt={{ decimals: 0, suffix: "%" }}
              xName="Yield shock"
              yName="Price change"
            />
          </Figure>
          <DataTable
            variant="prose"
            head={["+200bp on a 30y bond", "Price change"]}
            rows={[
              ["Exact repricing", d.taylor.at200.exact.toFixed(2) + "%"],
              ["Duration only", d.taylor.at200.lin.toFixed(2) + "%"],
              ["Duration + convexity", d.taylor.at200.quad.toFixed(2) + "%"],
            ]}
          />
        </SubSection>
      </Section>

      <Section id="conclusion" n={5} title="Strengths, limits &amp; extensions">
        <SubSection label="5a" title="Strengths">
          <Bullets
            items={[
              <><b>Three numbers, any bond</b> — price, duration and convexity summarise an entire cash-flow schedule</>,
              <><b>Excellent first-order accuracy</b> — duration is the industry&apos;s daily risk language for good reason</>,
              <><b>Convexity keeps it honest</b> — the correction holds the approximation together out to large shocks</>,
              <><b>Model-free verification</b> — 2022 ETF returns line up with durations straight from public data</>,
            ]}
          />
        </SubSection>

        <SubSection label="5b" title="Weaknesses &amp; Limitations">
          <Bullets
            items={[
              <><b>Parallel-shift assumption</b> — real curves twist and steepen rather than moving in lockstep</>,
              <><b>Constant reinvestment</b> — yield to maturity assumes coupons are reinvested at the same rate</>,
              <><b>No credit</b> — this is a pure rates framework; spreads and default risk need their own layer</>,
              <><b>An ETF is not a single bond</b> — rolling portfolios carry roll-down and carry effects the formula misses</>,
            ]}
          />
        </SubSection>

        <SubSection label="5c" title="Applications in Practice">
          <Bullets
            items={[
              "Portfolio duration targeting and liability immunisation",
              "The ±100bp rate-shock tables in every institutional risk report",
              "Barbell versus bullet trades, where convexity is the entire argument",
            ]}
          />
        </SubSection>

        <SubSection label="5d" title="Alternatives &amp; Extensions">
          <Bullets
            items={[
              <><b>Key-rate durations</b> — sensitivity to individual points on the curve rather than a parallel shift</>,
              <><b>Yield-curve bootstrapping</b> — building the discount curve instead of assuming a single yield</>,
              <><b>Term-structure models</b> — Vasicek, Hull-White and CIR simulate rates rather than shocking them</>,
              <><b>Credit risk</b> — hazard rates and spread duration for anything that can default</>,
            ]}
          />
        </SubSection>
      </Section>
    </>
  );
}
