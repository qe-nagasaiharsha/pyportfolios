import { Section, Lead, P, InlineCode, Term, Callout, PullQuote, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";
import { LineChart, ScatterChart } from "@/components/charts/DataCharts";
import d from "./data/gold-war-and-inflation";

/* RN — every figure below renders REAL computed results (GLD, SPY, TIP, IEF daily,
   Nov 2004 – Dec 2024) baked in by quant/legacy/gold.py from the self-cached CSV. */

const pc = (v: number, dp = 1) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(dp)}%`;

export default function GoldWarAndInflation() {
  return (
    <>
      <Lead>
        Gold is sold on two stories: it hedges inflation, and it protects you in a crisis. Both are
        half-true in ways that matter for allocation. This note is empirical, not theoretical — we read
        the tape. Gold&rsquo;s dominant driver is the <em>real</em> yield; its inflation hedge is
        regime-dependent; and the geopolitical premium around conflict is real but fast-fading.
      </Lead>

      <Section id="question" n={1} title="The question">
        <P>
          A research note is not a methodology lecture — it is an empirical read with a practical
          implication. The claim under test: <Term>&ldquo;gold hedges inflation and war.&rdquo;</Term>
          {" "}We check three things against {d.stats.years} years of daily data ({d.params.start} →{" "}
          {d.params.end}, {d.params.nObs.toLocaleString()} observations) — gold versus real yields,
          gold&rsquo;s behaviour across inflation regimes, and gold&rsquo;s path around the onset of
          crisis and armed conflict — and ask what each implies for a portfolio. Over the full sample
          GLD compounded {pc(d.stats.cagr)} a year (a {d.stats.total}× total multiple) at{" "}
          {(d.stats.vol * 100).toFixed(1)}% annualised volatility.
        </P>
        <Figure
          caption={`GLD close, ${d.params.start} → ${d.params.end} — the full sample`}
          legend={[{ label: "GLD", tone: "aqua" }]}
        >
          <LineChart
            ariaLabel="GLD price from 2004 to 2024: rising through 2011, falling to 2015, flat, then climbing steeply from 2019 to new highs in 2024."
            series={[{ y: d.history.y as unknown as number[], area: true }]}
            xLabels={d.history.xLabels as unknown as [number, string][]}
          />
        </Figure>
      </Section>

      <Section id="realyields" n={2} title="Gold tracks real yields">
        <P>
          Gold pays no coupon, so its opportunity cost is the <Term>real yield</Term> — the return you
          forgo by holding metal instead of an inflation-protected bond. The cleanest tradable proxy is
          the TIP ETF, whose price moves inversely to 10-year real yields. Empirically this is
          gold&rsquo;s strongest relationship: on {d.params.nMonths} monthly observations, gold&rsquo;s
          beta to TIP returns is <InlineCode>{d.proxy.beta}</InlineCode> with a correlation of{" "}
          <InlineCode>{d.proxy.corr}</InlineCode> — real-yield moves alone explain{" "}
          {Math.round(d.proxy.r2 * 100)}% of the variance of monthly gold returns, far more than
          headline CPI does.
        </P>
        <CodeBlock
          file="realyields.py"
          code={`import numpy as np, pandas as pd, yfinance as yf

# daily: GLD, and TIP as the (inverse) 10y real-yield proxy
px = yf.download(["GLD", "TIP"], start="2004-11-18", end="2025-01-01",
                 auto_adjust=True, progress=False)["Close"].dropna()
mret = np.log(px.resample("ME").last()).diff().dropna()

# regress gold returns on TIP returns (TIP up = real yields falling)
beta = np.polyfit(mret["TIP"], mret["GLD"], 1)[0]   # ${d.proxy.beta}
corr = mret["GLD"].corr(mret["TIP"])                # ${d.proxy.corr}
print(f"beta {beta:.2f}   corr {corr:.2f}   R^2 {corr**2:.2f}")`}
        />
        <Figure
          caption={`Monthly returns, GLD vs TIP, ${d.params.start.slice(0, 4)}–${d.params.end.slice(0, 4)} — β = ${d.proxy.beta}, ρ = ${d.proxy.corr}`}
          legend={[
            { label: "fitted line", tone: "aqua" },
            { label: "months", tone: "muted" },
          ]}
        >
          <ScatterChart
            ariaLabel="Scatter of monthly gold returns against monthly TIP returns with a clearly upward-sloping fitted line: months when real yields fall are months when gold rises."
            points={[{ xy: d.proxy.scatter as unknown as [number, number][], r: 2, opacity: 0.35 }]}
            lines={[{ xy: d.proxy.fit as unknown as [number, number][], color: "teal", width: 2 }]}
            xFmt={(v) => `${v.toFixed(0)}%`}
            yFmt={(v) => `${v.toFixed(0)}%`}
            xLabel="TIP monthly return (real yields falling →)"
          />
        </Figure>
      </Section>

      <Section id="inflation" n={3} title="The inflation hedge is conditional">
        <P>
          The clean &ldquo;gold = inflation hedge&rdquo; story is weaker than the marketing. Over very
          long horizons gold roughly preserves purchasing power, but over the horizons investors actually
          hold it, the hedge is <Term>regime-dependent</Term>. Proxy inflation expectations with the
          trailing-12-month TIP-minus-IEF relative return (a tradable breakeven), split the high-inflation
          months by the direction of real yields, and the conditionality is stark: gold pays{" "}
          {pc(d.regimes.hiFall.annRet)} annualised when inflation is high <em>and</em> real yields are
          falling, and loses {pc(d.regimes.hiRise.annRet)} annualised when central banks respond by
          pushing real yields up — exactly the 2022 experience.
        </P>
        <DataTable
          head={["Regime", "Months", "Avg. gold return (ann.)", "Reading"]}
          rows={[
            ["High inflation, falling real yields", d.regimes.hiFall.n, pc(d.regimes.hiFall.annRet), "The classic hedge works"],
            ["High inflation, rising real yields", d.regimes.hiRise.n, pc(d.regimes.hiRise.annRet), "Hedge fails — real yields dominate"],
            ["Low, stable inflation", d.regimes.low.n, pc(d.regimes.low.annRet), "Gold drifts; no premium"],
          ]}
        />
        <PullQuote>
          Gold doesn&rsquo;t hedge inflation so much as it hedges <em>falling real yields</em> — which
          often, but not always, coincide with inflation.
        </PullQuote>
      </Section>

      <Section id="war" n={4} title="What war adds">
        <P>
          Geopolitical shock adds a distinct, <Term>transient</Term> premium. An event study around three
          modern shock onsets — Lehman&rsquo;s filing, the COVID crash, and the invasion of Ukraine —
          shows a fast safe-haven bid in the first days to weeks, which then fades as the shock is priced
          and real-yield dynamics reassert control. Ukraine is the archetype: gold was up{" "}
          {pc(d.events.rows[2].peak20)} at its peak within a month of the invasion, yet{" "}
          {pc(d.events.rows[2].d60)} sixty trading days out.
        </P>
        <CodeBlock
          file="eventstudy.py"
          code={`import numpy as np, pandas as pd

events = {"GFC / Lehman": "2008-09-15", "COVID": "2020-02-19",
          "Ukraine": "2022-02-24"}

def window(px, date, pre=10, post=60):
    i = px.index.searchsorted(pd.Timestamp(date))
    w = px.iloc[i - pre : i + post + 1]
    return 100 * w / px.iloc[i]           # = 100 at the event date

paths = {name: window(gld, d0) for name, d0 in events.items()}
# quick pop, then fade: +5d / +20d / +60d returns per event below`}
        />
        <Figure
          caption="GLD around shock onsets, rebased to 100 at the event date (t = 0)"
          legend={[
            { label: "GFC", tone: "aqua" },
            { label: "COVID / Ukraine", tone: "muted" },
          ]}
        >
          <LineChart
            ariaLabel="Three gold price paths rebased to 100 at each event date: a sharp 15 percent Lehman spike that fades, a COVID dip then recovery, and a Ukraine pop of 8 percent that fully fades within sixty trading days."
            series={[
              { y: d.events.series.gfc as unknown as number[], color: "teal", width: 2 },
              { y: d.events.series.covid as unknown as number[], color: "graphite", width: 1.4, opacity: 0.75 },
              { y: d.events.series.ukraine as unknown as number[], color: "amber", width: 1.6 },
            ]}
            xLabels={d.events.xLabels as unknown as [number, string][]}
            hLines={[{ v: 100, color: "graphite", dash: "3 3" }]}
          />
        </Figure>
        <DataTable
          head={["Event", "t+5d", "t+20d", "t+60d", "Peak ≤ 20d"]}
          rows={d.events.rows.map((e) => [e.label, pc(e.d5), pc(e.d20), pc(e.d60), pc(e.peak20)])}
        />
        <P>
          Note the COVID row: in the first liquidity-panic weeks gold <em>fell</em>{" "}
          {pc(d.events.rows[1].d20)} as everything was sold for cash — the safe haven only reasserted
          itself once real yields collapsed. The war premium is real for tactical risk-off, but it is
          not a durable allocation thesis.
        </P>
      </Section>

      <Section id="takeaways" n={5} title="What it implies">
        <P>
          For allocation: treat gold as a <Term>real-rate trade</Term> first and a tail hedge second.
          Expect it to help when real yields fall, to struggle when central banks force them up, and to
          spike-then-fade around conflict. The durable portfolio property is the correlation: over
          twenty years the 252-day rolling correlation of daily GLD and SPY returns averaged{" "}
          <InlineCode>{d.rollCorr.mean.toFixed(2)}</InlineCode>, ranging {d.rollCorr.min} to{" "}
          {d.rollCorr.max} and rarely staying far from zero. That makes gold a useful diversifier
          against a falling-real-yield regime — not a set-and-forget inflation insurance policy. In
          nominal terms GLD&rsquo;s {pc(d.stats.cagr)} a year trailed SPY&rsquo;s {pc(d.stats.spyCagr)}{" "}
          over the same span; in real terms (CPI averaged roughly 2.5% a year over the sample) gold
          earned a positive but modest premium for its zero-coupon risk.
        </P>
        <Figure
          caption="GLD vs SPY — 252-day rolling correlation of daily returns"
          legend={[{ label: "rolling ρ", tone: "aqua" }]}
        >
          <LineChart
            ariaLabel="Rolling one-year correlation between gold and equities oscillating between minus 0.35 and plus 0.44 around a mean near zero."
            series={[{ y: d.rollCorr.y as unknown as number[], color: "teal", width: 1.6 }]}
            xLabels={d.rollCorr.xLabels as unknown as [number, string][]}
            hLines={[{ v: 0, color: "graphite", dash: "3 3" }]}
          />
        </Figure>
        <Callout kind="How to read a research note like this">
          What is the empirical claim, and over what horizon? What is the true driver once you control
          for it (here: real yields, β = {d.proxy.beta} to TIP)? Is the effect conditional on a regime
          ({pc(d.regimes.hiFall.annRet)} vs {pc(d.regimes.hiRise.annRet)} annualised)? Is it durable or
          transient? The companion notebook pulls GLD, SPY, TIP and IEF and reproduces the regression,
          the regime table, and the event study.
        </Callout>
      </Section>

      <References
        items={[
          "Erb, C. & Harvey, C. (2013). The Golden Dilemma. Financial Analysts Journal, 69(4).",
          "Baur, D. & McDermott, T. (2010). Is Gold a Safe Haven? International Evidence. Journal of Banking & Finance, 34(8).",
          "Barro, R. & Misra, S. (2016). Gold Returns. The Economic Journal, 126(594).",
        ]}
      />
    </>
  );
}
