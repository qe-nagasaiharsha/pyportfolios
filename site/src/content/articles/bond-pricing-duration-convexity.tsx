import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References, Pipeline } from "@/components/article/prose";
import { LineChart, ScatterChart } from "@/components/charts/DataCharts";
import d from "./data/bond-pricing-duration-convexity";

/* T03 / topic card 03-16 — all figures below render REAL computed results
   (10y 4% semi-annual pricer + US Treasury yields and SHY/IEF/TLT through
   calendar 2022) baked in by quant/tutorials/t03_bonds.py. */

const pc = (v: number) => `${(v * 100).toFixed(1)}%`;
const signed = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

export default function BondPricingDurationConvexity() {
  const b = d.bond;
  const curveXY = (ys: readonly number[]) =>
    d.curve2022.maturities.map((m, i) => [m, ys[i]] as [number, number]);

  return (
    <>
      <Lead>
        Every bond risk report on earth contains the same two numbers: a duration and the
        result of a ±100bp shock. In 2022 those numbers stopped being paperwork — the Treasury
        curve rose roughly 230 to 420 basis points and portfolios lost, almost mechanically,
        duration times the shift. We build the pricer from scratch, derive duration and
        convexity two independent ways, run the stress table, and then replay 2022 on three
        ETFs whose only meaningful difference is duration.
      </Lead>

      <Pipeline
        steps={[
          "Price a bond from its yield — semi-annual coupons, ~10 lines of NumPy",
          "Macaulay/modified duration + convexity, analytic and finite-difference",
          "Draw the price/yield curve and the duration tangent for a 10y 4% bond",
          "Run the ±100bp / ±200bp stress table three ways",
          "Replay 2022: the curve shift, and SHY vs IEF vs TLT (yfinance)",
        ]}
      />

      <Section id="pricer" n={1} title="A bond pricer from scratch">
        <P>
          A fixed-coupon bond is nothing but a schedule of cashflows: {2 * b.maturity} semi-annual
          coupons of <InlineCode>coupon × face / 2 = {((b.coupon * b.face) / b.freq).toFixed(2)}</InlineCode>{" "}
          per 100 of face, plus the face value back at maturity. The price is the present value of
          that schedule, discounted at the semi-annually compounded <Term>yield to maturity</Term>.
          That single sentence is the whole pricer:
        </P>
        <CodeBlock
          file="pricer.py"
          code={`def bond_price(ytm, coupon=0.04, maturity=10, freq=2, face=100.0):
    n = int(round(maturity * freq))
    i = ytm / freq
    c = coupon * face / freq
    t = np.arange(1, n + 1)
    cf = np.full(n, c)
    cf[-1] += face                      # coupon + principal at maturity
    return float(np.sum(cf / (1 + i) ** t))

bond_price(0.04)   # ${b.price.toFixed(2)} — a 4% bond at a 4% yield prices at par`}
        />
        <P>
          The first sanity check is free: when the coupon equals the yield the bond must price
          at exactly par, and ours returns <InlineCode>{b.price.toFixed(4)}</InlineCode>. Everything
          in the rest of this tutorial — duration, convexity, the stress table — is a derivative
          (literally) of this one function.
        </P>
      </Section>

      <Section id="duration" n={2} title="Duration & convexity, two ways">
        <P>
          <Term>Macaulay duration</Term> is the PV-weighted average time to cashflow, in years.
          Divide by <InlineCode>(1 + y/2)</InlineCode> and you get <Term>modified duration</Term>,
          the first-order price sensitivity: <InlineCode>dP/P ≈ −D·Δy</InlineCode>.{" "}
          <Term>Convexity</Term> is the second-order term — the curvature the linear estimate
          misses. All three come from closed-form sums over the same cashflow schedule:
        </P>
        <CodeBlock
          file="risk.py"
          code={`pv   = cf / (1 + i) ** t                 # PV of each cashflow
mac  = np.sum((t / freq) * pv) / price   # ${b.macaulay.toFixed(4)} years
mod  = mac / (1 + i)                     # ${b.modified.toFixed(4)}
conv = np.sum(t * (t + 1) * pv) / (price * (1 + i)**2 * freq**2)   # ${b.convexity.toFixed(2)}

# cross-check with a 1bp finite-difference bump of the pricer
h = 1e-4
fd_dur  = -(bond_price(y0 + h) - bond_price(y0 - h)) / (2 * h * p0)   # ${b.fdDuration.toFixed(4)}
fd_conv = (bond_price(y0 + h) - 2*p0 + bond_price(y0 - h)) / (h**2 * p0)  # ${b.fdConvexity.toFixed(2)}`}
        />
        <P>
          For the 10y 4% bond at a 4% yield: Macaulay duration{" "}
          <InlineCode>{b.macaulay.toFixed(2)} years</InlineCode>, modified duration{" "}
          <InlineCode>{b.modified.toFixed(2)}</InlineCode>, convexity{" "}
          <InlineCode>{b.convexity.toFixed(1)}</InlineCode>. The finite-difference bump reproduces
          both to four decimals — the analytic formulas and the pricer agree, which is the
          cross-check that catches most implementation bugs in fixed income.
        </P>
        <Callout kind="Why practitioners care">
          Desks quote risk in duration, hedge in DV01 (duration × price × 1bp), and regulators
          ask for the ±100bp table. When the analytic Greeks and a bump-and-reprice disagree,
          production systems trust the bump — full repricing is the ground truth, and duration
          and convexity are its Taylor expansion.
        </Callout>
      </Section>

      <Section id="curve" n={3} title="The price/yield curve is not a line">
        <P>
          Plot price against yield and duration acquires a geometric meaning: it is the{" "}
          <Term>slope of the tangent</Term> at the current yield. The actual curve bows above
          that tangent on both sides — that bow is convexity, and it always works in the
          holder's favour: the bond loses less than the tangent predicts when yields rise,
          and gains more when they fall.
        </P>
        <Figure
          caption="10y 4% coupon bond — full repricing vs the duration tangent at 4%"
          legend={[
            { label: "P(y), full repricing", tone: "aqua" },
            { label: "duration tangent", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Convex downward-sloping price versus yield curve for a 10-year bond, with a straight dashed tangent line touching it at the 4 percent par point and falling below the curve on both sides."
            series={[
              { y: d.priceYield.tangent as unknown as number[], color: "graphite", width: 1.4, dash: "5 4" },
              { y: d.priceYield.price as unknown as number[], color: "teal", width: 2.2 },
            ]}
            xLabels={d.priceYield.xLabels as unknown as [number, string][]}
            h={240}
          />
        </Figure>
        <P>
          Between 3% and 5% the tangent is nearly indistinguishable from the curve — which is
          why duration-only risk numbers are perfectly serviceable for small moves. By 8% the
          full price is <InlineCode>{d.priceYield.price[d.priceYield.price.length - 2]}</InlineCode>{" "}
          while the tangent claims <InlineCode>{d.priceYield.tangent[d.priceYield.tangent.length - 2]}</InlineCode>:
          a gap of several points, all of it convexity. 2022 was a 4%-wide move — keep that in mind.
        </P>
      </Section>

      <Section id="stress" n={4} title="The ±100bp stress table, three ways">
        <P>
          The table below is the one in every risk report, computed three ways: duration only
          (<InlineCode>−D·Δy</InlineCode>), duration plus convexity
          (<InlineCode>−D·Δy + ½·C·Δy²</InlineCode>), and full repricing — the truth.
        </P>
        <DataTable
          head={["Shock", "Duration only", "+ Convexity", "Full repricing", "Convexity gain"]}
          rows={d.stress.rows.map((row) => [
            `${row.bp > 0 ? "+" : ""}${row.bp}bp`,
            signed(row.durOnly),
            signed(row.durConv),
            signed(row.full),
            signed(row.convexityGain),
          ])}
        />
        <P>
          Read the asymmetry: duration alone predicts a symmetric ±{Math.abs(d.stress.rows[1].durOnly).toFixed(2)}%
          for ±100bp, but the true answer is {signed(d.stress.rows[2].full)} on the way up and{" "}
          {signed(d.stress.rows[1].full)} on the way down. At ±200bp the duration-only estimate is
          off by about {Math.abs(d.stress.rows[3].convexityGain).toFixed(1)} points — and adding
          the convexity term closes nearly all of that gap. Second-order Taylor is enough for any
          shock a risk committee will ask about.
        </P>
        <Callout kind="Note">
          Convexity <Term>gain</Term> is not free money — it is priced. Bonds with more convexity
          (longer maturity, lower coupon) trade at lower yields, other things equal. What the
          table does say: never quote a ±200bp scenario off duration alone, because the error is
          larger than most credit spreads.
        </Callout>
      </Section>

      <Section id="rates-2022" n={5} title="2022 — the year the tangent moved">
        <P>
          Theory over; tape in. Yahoo's Treasury yield indices (^IRX 13-week, ^FVX 5y, ^TNX 10y,
          ^TYX 30y) record the curve on the first and last trading days of 2022. The 13-week
          bill went from {d.curve2022.jan[0].toFixed(2)}% to {d.curve2022.dec[0].toFixed(2)}%,
          the 10y from {d.curve2022.jan[2].toFixed(2)}% to {d.curve2022.dec[2].toFixed(2)}% —
          the fastest tightening cycle in four decades, and an inverted curve by December.
        </P>
        <Figure
          caption={`US Treasury yield curve — ${d.curve2022.janDate} vs ${d.curve2022.decDate}`}
          legend={[
            { label: "3 Jan 2022", tone: "muted" },
            { label: "30 Dec 2022", tone: "aqua" },
          ]}
        >
          <ScatterChart
            ariaLabel="Two yield curves by maturity: January 2022 rising from near zero to about 2 percent, December 2022 shifted up to around 4 percent and inverted at the short end."
            points={[
              { xy: curveXY(d.curve2022.jan), color: "graphite", r: 3, opacity: 0.9 },
              { xy: curveXY(d.curve2022.dec), color: "teal", r: 3, opacity: 0.9 },
            ]}
            lines={[
              { xy: curveXY(d.curve2022.jan), color: "graphite", width: 1.6, dash: "5 4" },
              { xy: curveXY(d.curve2022.dec), color: "teal", width: 2 },
            ]}
            h={240}
            xLabel="maturity (years)"
            yFmt={(v) => `${v.toFixed(0)}%`}
          />
        </Figure>
        <P>
          What does a ~{Math.round((d.curve2022.dec[2] - d.curve2022.jan[2]) * 100)}bp rise in the
          10y do to bond portfolios? Exactly what Section 4 says it does. Three iShares Treasury
          ETFs — SHY (1–3y, duration ≈ 1.9y), IEF (7–10y, ≈ 7.5y), TLT (20y+, ≈ 17.5y) — share an
          issuer, a credit (the US government), and a year. Their only meaningful difference is
          duration, and the total-return paths separate on nothing else:
        </P>
        <Figure
          caption="2022 total return, normalised to 100 at end-2021 (adjusted closes)"
          legend={[
            { label: "SHY", tone: "muted" },
            { label: "IEF", tone: "aqua" },
            { label: "TLT", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Three lines through 2022 starting at 100: SHY drifting down to about 96, IEF to about 85, and TLT falling to about 69."
            series={[
              { y: d.etf2022.shy as unknown as number[], color: "slate", width: 1.6 },
              { y: d.etf2022.ief as unknown as number[], color: "teal", width: 1.8 },
              { y: d.etf2022.tlt as unknown as number[], color: "rust", width: 1.8 },
            ]}
            xLabels={d.etf2022.xLabels as unknown as [number, string][]}
            hLines={[{ v: 100, color: "graphite", dash: "3 3" }]}
            h={250}
          />
        </Figure>
        <P>
          Full-year 2022 total returns: SHY <InlineCode>{pc(d.etf2022.totals.SHY)}</InlineCode>,
          IEF <InlineCode>{pc(d.etf2022.totals.IEF)}</InlineCode>, TLT{" "}
          <InlineCode>{pc(d.etf2022.totals.TLT)}</InlineCode>. Short duration lost about 4%; long
          duration lost about 31% — in the safest credit on the planet. Duration, not default
          risk, was <Term>the</Term> risk factor of 2022.
        </P>
      </Section>

      <Section id="empirical" n={6} title="Empirical duration, read off the tape">
        <P>
          You do not have to take the fund factsheet's word for any of this. Regress each ETF's
          daily return on the daily change in the 10y yield across 2022; the negative of the
          slope is the <Term>empirical duration</Term> with respect to the 10y point:
        </P>
        <CodeBlock
          file="empirical.py"
          code={`rets = px.pct_change().dropna()          # SHY / IEF / TLT daily returns
dy10 = (ylds["^TNX"] / 100).diff()       # 10y yield change, decimal

for c in ["SHY", "IEF", "TLT"]:
    beta, alpha = np.polyfit(dy10.loc[idx22], rets.loc[idx22, c], 1)
    print(c, -beta)                      # empirical duration vs the 10y`}
        />
        <DataTable
          head={["ETF", "Empirical duration (vs 10y)", "R²", "2022 total return"]}
          rows={d.empirical.rows.map((row) => [
            row.etf,
            `${row.empiricalDuration.toFixed(2)}y`,
            row.r2.toFixed(2),
            pc(row.total2022),
          ])}
        />
        <P>
          IEF's regression duration of {d.empirical.rows[1].empiricalDuration.toFixed(1)}y with an
          R² of {d.empirical.rows[1].r2.toFixed(2)} matches its stated ~7.5y almost exactly — its
          holdings live at the 10y point we regressed on. SHY and TLT print{" "}
          {d.empirical.rows[0].empiricalDuration.toFixed(1)}y and{" "}
          {d.empirical.rows[2].empiricalDuration.toFixed(1)}y against the 10y because their own
          curve points moved by different amounts than the 10y did in 2022 — a first taste of{" "}
          <Term>key-rate</Term> duration: one number per bond is an approximation, one number per
          curve point is the real risk model.
        </P>
        <Callout kind="Practitioner take">
          This regression is the ±100bp stress test run in reverse: instead of shocking a model,
          you let the market shock the portfolio and read the duration back out. If a fund's
          empirical duration drifts away from its stated duration, something in the portfolio —
          optionality, credit, leverage — is not what the label says. That check takes five lines
          of pandas and belongs in every fixed-income monitoring stack.
        </Callout>
      </Section>

      <References
        items={[
          "Fabozzi, F. J. Bond Markets, Analysis, and Strategies — chs. 2–4, pricing, yield measures, and price volatility.",
          "Tuckman, B. & Serrat, A. Fixed Income Securities: Tools for Today's Markets — chs. 4–5, one-factor risk metrics and hedging.",
          <span key="nb">Companion notebook: <InlineCode>bond-pricing-duration-convexity.ipynb</InlineCode> — reproduces every figure from raw data (yfinance: SHY, IEF, TLT, ^IRX, ^FVX, ^TNX, ^TYX).</span>,
        ]}
      />
    </>
  );
}
