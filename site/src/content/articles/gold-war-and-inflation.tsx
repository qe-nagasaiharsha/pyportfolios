import { Section, Lead, P, InlineCode, Term, Callout, PullQuote, CodeBlock, DataTable, Figure, References } from "@/components/article/prose";

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
          {" "}We check three things against the data — gold versus real yields, gold&rsquo;s behaviour
          across inflation regimes, and gold&rsquo;s path around the onset of armed conflict — and ask
          what each implies for a portfolio.
        </P>
      </Section>

      <Section id="realyields" n={2} title="Gold tracks real yields">
        <P>
          Gold pays no coupon, so its opportunity cost is the <Term>real yield</Term> — the return you
          forgo by holding metal instead of an inflation-protected bond. Empirically this is gold&rsquo;s
          strongest relationship: when real yields fall, gold rises, and vice versa. It explains far more
          of gold&rsquo;s variation than headline CPI does.
        </P>
        <CodeBlock
          file="realyields.py"
          code={`import numpy as np, pandas as pd

# monthly: gold spot, and the 10y TIPS (real) yield
df = pd.concat([gold, real_yield], axis=1).dropna()
df["gold_ret"]   = np.log(df["gold"]).diff()
df["dreal"]      = df["real_yield"].diff()      # change in real yield

# regress gold returns on changes in the real yield
beta = np.polyfit(df["dreal"].dropna(), df["gold_ret"].dropna(), 1)[0]
corr = df[["gold_ret", "dreal"]].dropna().corr().iloc[0, 1]
print(f"beta to d(real yield) {beta:.2f}   corr {corr:.2f}")  # negative`}
        />
        <Figure caption="Gold vs the inverted real yield — they move together (illustrative)" legend={[{ label: "Gold", tone: "aqua" }, { label: "Real yield (inv.)", tone: "muted" }]}>
          <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label="Gold and the inverted real yield trace similar paths over time.">
            <line x1="30" y1="170" x2="580" y2="170" stroke="#4a4a42" strokeOpacity="0.4" strokeWidth="1" />
            <path d="M30,140 C120,120 180,90 240,80 C320,66 380,110 440,70 C500,40 540,60 580,48" fill="none" stroke="#0a8a8a" strokeWidth="2" />
            <path d="M30,150 C120,128 180,96 240,92 C320,78 380,118 440,80 C500,52 540,72 580,60" fill="none" stroke="#4a4a42" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
        </Figure>
      </Section>

      <Section id="inflation" n={3} title="The inflation hedge is conditional">
        <P>
          The clean &ldquo;gold = inflation hedge&rdquo; story is weaker than the marketing. Over very
          long horizons gold roughly preserves purchasing power, but over the horizons investors actually
          hold it, the hedge is <Term>regime-dependent</Term>: gold tends to work when inflation is high{" "}
          <em>and</em> real yields are falling (the 1970s, 2020&ndash;2021), and disappoints when central
          banks respond by pushing real yields up (much of 2022). Sort the months by inflation regime and
          the conditionality is obvious.
        </P>
        <DataTable
          head={["Regime", "Avg. real gold return", "Reading"]}
          rows={[
            ["High inflation, falling real yields", "Strong +", "The classic hedge works"],
            ["High inflation, rising real yields", "Flat / −", "Hedge fails — real yields dominate"],
            ["Low, stable inflation", "≈ 0", "Gold drifts; no premium"],
          ]}
        />
        <PullQuote>
          Gold doesn&rsquo;t hedge inflation so much as it hedges <em>falling real yields</em> — which
          often, but not always, coincide with inflation.
        </PullQuote>
      </Section>

      <Section id="war" n={4} title="What war adds">
        <P>
          Geopolitical shock adds a distinct, <Term>transient</Term> premium. An event study around the
          onset of major conflicts shows a fast safe-haven bid in the first days to weeks, which then
          fades as the shock is priced and real-yield dynamics reassert control. The war premium is real
          for tactical risk-off, but it is not a durable allocation thesis.
        </P>
        <CodeBlock
          file="eventstudy.py"
          code={`import numpy as np, pandas as pd

# event_dates: onset of major geopolitical shocks
def car(prices, date, pre=5, post=20):
    r = np.log(prices).diff()
    window = r.loc[date:].iloc[:post]
    return window.cumsum()                 # cumulative abnormal-ish return

paths = pd.concat({d: car(gold, d) for d in event_dates}, axis=1)
print(paths.mean(axis=1).round(3))         # average path: quick pop, then fade`}
        />
      </Section>

      <Section id="takeaways" n={5} title="What it implies">
        <P>
          For allocation: treat gold as a <Term>real-rate trade</Term> first and a tail hedge second.
          Expect it to help when real yields fall, to struggle when central banks force them up, and to
          spike-then-fade around conflict. That makes it a useful diversifier against a falling-real-yield
          regime — not a set-and-forget inflation insurance policy.
        </P>
        <Callout kind="How to read a research note like this">
          What is the empirical claim, and over what horizon? What is the true driver once you control for
          it (here: real yields)? Is the effect conditional on a regime? Is it durable or transient?
          Figures are illustrative; the notebook pulls gold, CPI and the TIPS real yield and reproduces
          the regression, the regime table, and the event study.
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
