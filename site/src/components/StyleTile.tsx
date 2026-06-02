/* ============================================================================
   The dark "Quant Research House" landing page, parametrized by a Variant.
   Real product content only — no design-system meta (no swatches, hex, type
   specimens, §/edition/version/figure-number labels, or colour callouts).
   v1–v5 each layer ONE deck enhancement. Pure Server Component; only the top
   toggle is client-side.
   ========================================================================== */

import Link from "next/link";
import type { Variant } from "@/lib/variants";
import { Crest, CrestLockup } from "@/components/brand/Crest";
import { PhotoPlate } from "@/components/brand/PhotoPlate";
import { StackCards } from "@/components/brand/StackCards";
import { WorldMap, EXCHANGES_BY_REGION } from "@/components/brand/WorldMap";
import { SloganBand } from "@/components/brand/SloganBand";
import { VersionSwitcher } from "@/components/VersionSwitcher";
import { WorldMarkets } from "@/components/WorldMarkets";
import { CountUp } from "@/components/motion/CountUp";
import { TransitionLink } from "@/components/motion/TransitionLink";

const NAV = ["Focus", "Markets", "Course", "Research"] as const;

const PILLARS = [
  { no: "01", title: "Coding", body: "Structured case studies and ready-to-run snippets — investment-banking style — across the modern Python quant stack." },
  { no: "02", title: "Trading", body: "Algorithmic trading, portfolio optimization and risk management in a simple, empirical, practical format." },
  { no: "03", title: "Markets", body: "Academic-level models meet state-of-the-art frameworks, using data from the world's major exchanges." },
] as const;

const MARKETS = [
  { label: "Asset Classes", items: ["Equities", "Fixed Income", "FX", "Commodities", "Rates", "Crypto"] },
  { label: "Instruments", items: ["Options", "Futures", "Swaps", "ETFs", "Bonds", "Forwards"] },
  { label: "Sectors", items: ["Technology", "Financials", "Energy", "Healthcare", "Industrials", "Consumer"] },
] as const;

const STACK = ["NumPy", "pandas", "SciPy", "cvxpy", "scikit-learn", "statsmodels", "PyPortfolioOpt", "vectorbt", "QuantLib"] as const;

const MODELS = [
  { group: "Pricing", items: "Black–Scholes · Binomial · Monte Carlo" },
  { group: "Portfolio", items: "Markowitz · Black–Litterman · Risk Parity · HRP" },
  { group: "Risk", items: "VaR / CVaR · GARCH · Extreme Value · Drawdown" },
  { group: "Machine Learning", items: "Shrinkage · Trees · Clustering" },
  { group: "Signals", items: "Momentum · Mean-reversion · Factor models" },
  { group: "Performance", items: "Sharpe · Sortino · Attribution" },
] as const;

const ARTICLES = [
  { slug: "ledoit-wolf-shrinkage", cat: "Portfolio Optimization", title: "Ledoit-Wolf shrinkage, from scratch", blurb: "Why the sample covariance matrix fails out-of-sample — and how shrinkage repairs it.", meta: ["12 min", "Python", "Notebook ↗"] },
  { slug: "evt-t-copula-var", cat: "Risk Management", title: "Market risk via EVT + t-copula", blurb: "A faithful Python port of the classic tail-risk pipeline, end to end.", meta: ["14 min", "Python", "Notebook ↗"] },
] as const;

function SectionLabel({ title }: { title: string }) {
  return (
    <div className="mb-10 flex items-center gap-4 border-b border-pearl/10 pb-4">
      <span className="h-px w-8 bg-aqua/50" aria-hidden="true" />
      <h2 className="t-mono text-sm uppercase tracking-[0.24em] text-mist">{title}</h2>
    </div>
  );
}

function HeroCurve() {
  return (
    <svg className="float-curve absolute inset-x-0 bottom-0 h-[58%] w-full" viewBox="0 0 1200 320"
      preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1FFFFF" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#1FFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,300 C120,288 190,250 280,256 C380,262 430,205 540,188 C650,171 690,150 790,118 C880,90 940,98 1040,64 C1110,40 1150,42 1200,28 L1200,320 L0,320 Z" fill="url(#curveFill)" />
      <path d="M0,300 C120,288 190,250 280,256 C380,262 430,205 540,188 C650,171 690,150 790,118 C880,90 940,98 1040,64 C1110,40 1150,42 1200,28" fill="none" stroke="#1FFFFF" strokeOpacity="0.32" strokeWidth="1.25" />
    </svg>
  );
}

function Sparkline() {
  return (
    <svg viewBox="0 0 140 40" className="h-9 w-full" aria-hidden="true">
      <polyline points="0,34 16,30 32,32 48,22 64,26 80,15 96,18 112,9 128,12 140,3"
        fill="none" stroke="#1FFFFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FigureCovariance() {
  const gridY = [40, 90, 140, 190];
  const gridX = [120, 240, 360, 480];
  return (
    <figure className="corner-ticks rounded-sm border border-pearl/10 bg-navy-sunken/60 p-7">
      <svg viewBox="0 0 600 240" className="w-full" role="img"
        aria-label="Out-of-sample volatility: sample covariance versus Ledoit-Wolf shrinkage across portfolios.">
        {gridY.map((y) => <line key={`y${y}`} x1="0" y1={y} x2="600" y2={y} stroke="#EEEEEE" strokeOpacity="0.06" strokeWidth="1" />)}
        {gridX.map((x) => <line key={`x${x}`} x1={x} y1="0" x2={x} y2="210" stroke="#EEEEEE" strokeOpacity="0.06" strokeWidth="1" />)}
        <polyline points="0,70 60,96 120,58 180,120 240,78 300,150 360,96 420,170 480,120 540,196 600,150"
          fill="none" stroke="#59617A" strokeWidth="1.5" strokeLinejoin="round" />
        <path className="draw-line" d="M0,110 C90,108 130,118 200,126 C280,135 320,150 400,156 C470,161 520,172 600,178"
          fill="none" stroke="#1FFFFF" strokeWidth="2.25" strokeLinecap="round" />
        <circle cx="600" cy="178" r="3.5" fill="#1FFFFF" />
      </svg>
      <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-pearl/10 pt-3">
        <span className="t-mono text-xs uppercase tracking-[0.18em] text-steel">Out-of-sample volatility</span>
        <span className="flex items-center gap-4 t-mono text-xs">
          <span className="flex items-center gap-1.5 text-mist"><span className="inline-block h-px w-4 bg-steel" /> Sample</span>
          <span className="flex items-center gap-1.5 text-aqua"><span className="inline-block h-px w-4 bg-aqua" /> Shrinkage</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function StyleTile({ variant }: { variant: Variant }) {
  const f = variant.flags;
  const heroEyebrow = f.slogans ? "Get up to speed · Cancel the noise · Find your edge" : "Coding · Trading · Markets";

  return (
    <div className="min-h-screen bg-navy text-pearl">
      {/* ============ STICKY TOP: version toggle row + site nav ========= */}
      <div className="sticky top-0 z-50">
        <VersionSwitcher />
        <header className="border-b border-pearl/10 bg-navy/80 backdrop-blur-md">
          <nav className="nav-condense mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <a href="#top" className="group nav-logo">
              {f.crest ? (
                <CrestLockup tone="light" />
              ) : (
                <span className="flex items-baseline gap-1">
                  <span className="text-lg tracking-tight text-pearl" style={{ fontWeight: 900 }}>pyportfolios</span>
                  <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-aqua" aria-hidden="true" />
                </span>
              )}
            </a>
            <ul className="hidden items-center gap-8 md:flex">
              {NAV.map((item) => (
                <li key={item}>
                  <a href={item === "Research" ? "/research" : `#${item.toLowerCase()}`} className="t-mono text-xs uppercase tracking-[0.18em] text-mist transition-colors duration-200 hover:text-pearl">{item}</a>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 sm:flex">
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-aqua" aria-hidden="true" />
                <span className="t-mono text-[0.65rem] uppercase tracking-[0.18em] text-steel">Markets open</span>
              </span>
              <a href="#course" className="rounded-sm border border-pearl/20 px-4 py-2 t-mono text-xs uppercase tracking-[0.16em] text-pearl transition-colors duration-200 hover:border-aqua hover:text-aqua">Sign in</a>
            </div>
          </nav>
        </header>
      </div>

      <main id="top">
        {/* ================================================== HERO ======= */}
        <section className="relative overflow-hidden border-b border-pearl/10">
          <div className="hero-aura absolute inset-0" aria-hidden="true" />
          <div className="grid-paper absolute inset-0" aria-hidden="true" />
          <HeroCurve />
          <div className="vignette pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-6 py-32 md:py-52">
            {f.crest ? (
              <div className="mb-8"><Crest size={56} tone="light" /></div>
            ) : null}
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-pearl/25" aria-hidden="true" />
              <p className="t-eyebrow text-mist">{heroEyebrow}</p>
            </div>
            <h1 className="t-display mt-8 max-w-4xl text-pearl">
              Where finance theory, coding<br className="hidden sm:block" /> &amp; markets <em>converge</em><span className="text-aqua">.</span>
            </h1>
            <p className="mt-9 max-w-lg text-lg leading-relaxed text-mist">
              The platform for the sophisticated coder. Academic-level models, ready-to-run
              Python, and state-of-the-art frameworks — applied to real data from the world&apos;s major exchanges.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-8">
              <a href="#course" className="group rounded-sm bg-pearl px-8 py-3.5 text-sm font-semibold text-navy transition-colors duration-300 hover:bg-aqua">
                Start the course
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
              <a href="#research" className="link-fine t-mono text-sm uppercase tracking-[0.16em] text-pearl/90 transition-colors duration-300 hover:text-pearl">Explore research</a>
            </div>
          </div>

          {/* world markets ticker — live local time + open/closed status */}
          <WorldMarkets />
        </section>

        {/* v5 — slogan band */}
        {f.slogans ? <SloganBand /> : null}

        {/* ================================================ OUR FOCUS ==== */}
        <section id="focus" className="mx-auto max-w-6xl px-6 py-28 md:py-32">
          <SectionLabel title="Our Focus" />
          <p className="mb-12 max-w-2xl text-lg leading-relaxed text-mist">
            An educational platform that bridges advanced quantitative finance and practical
            Python implementation — blending technical rigor, real-world application and visual clarity.
          </p>
          <div className="grid gap-px overflow-hidden rounded-sm border border-pearl/10 bg-pearl/10 md:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.no} className="bg-navy px-7 py-9">
                <span className="font-serif text-4xl text-pearl/20" style={{ fontWeight: 500 }}>{p.no}</span>
                <h3 className="t-h2 mt-4 text-pearl">{p.title}</h3>
                <span className="mt-4 block h-px w-10 bg-aqua" />
                <p className="mt-4 leading-relaxed text-mist">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================== MARKETS ==== */}
        <section id="markets" className="border-y border-pearl/10 bg-navy-elevated/40">
          <div className="mx-auto max-w-6xl px-6 py-28 md:py-32">
            <SectionLabel title="Markets" />
            <div className="grid gap-10 md:grid-cols-3">
              {MARKETS.map((m) => (
                <div key={m.label}>
                  <p className="t-mono text-xs uppercase tracking-[0.22em] text-aqua/80">{m.label}</p>
                  <ul className="mt-5 space-y-2.5">
                    {m.items.map((it) => (
                      <li key={it} className="flex items-baseline gap-3 border-b border-pearl/10 pb-2.5 text-pearl">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-aqua/60" aria-hidden="true" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {!f.worldMap ? (
              <p className="mt-10 t-mono text-xs uppercase tracking-[0.18em] text-steel">
                Case studies span the top 15 economies — developed &amp; emerging.
              </p>
            ) : null}
          </div>
        </section>

        {/* ================================================ LIBRARIES ==== */}
        <section id="libraries" className="mx-auto max-w-6xl px-6 py-28 md:py-32">
          <SectionLabel title="Libraries" />
          <h3 className="t-h1 max-w-xl text-pearl">The Python quant stack.</h3>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-mist">
            Best-in-class, open-source libraries — composed into clean, reproducible research.
          </p>
          <div className="mt-12">
            {f.stackCards ? (
              <StackCards />
            ) : (
              <div className="flex flex-wrap gap-3">
                {STACK.map((lib) => (
                  <span key={lib} className="rounded-sm border border-pearl/10 bg-navy-elevated/50 px-4 py-2.5 t-mono text-sm text-mist transition-colors duration-300 hover:border-pearl/25 hover:text-pearl">
                    {lib}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ================================================== MODELS ===== */}
        <section className="border-y border-pearl/10 bg-navy-elevated/40">
          <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-28 md:py-32 lg:grid-cols-2">
            <div>
              <SectionLabel title="Models" />
              <h3 className="t-h1 text-pearl">Concepts &amp; models, applied.</h3>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-mist">
                From pricing to portfolio construction to risk — academic models, implemented
                empirically and stress-tested on real data.
              </p>
              <dl className="mt-8 space-y-3">
                {MODELS.map((m) => (
                  <div key={m.group} className="flex flex-col gap-1 border-b border-pearl/10 pb-3 sm:flex-row sm:items-baseline sm:gap-4">
                    <dt className="t-mono text-xs uppercase tracking-[0.18em] text-aqua/80 sm:w-40 sm:shrink-0">{m.group}</dt>
                    <dd className="text-pearl">{m.items}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="lg:pt-16">
              <FigureCovariance />
            </div>
          </div>
        </section>

        {/* v2 — imagery (deck §05) */}
        {f.photography ? (
          <section className="mx-auto max-w-6xl px-6 py-28 md:py-32">
            <SectionLabel title="Imagery" />
            <div className="grid gap-6 md:grid-cols-2">
              <PhotoPlate scene="skyline" caption="Capital markets · NYSE" />
              <PhotoPlate scene="summit" caption="Out-of-sample · risk surface" />
            </div>
          </section>
        ) : null}

        {/* v4 — market reach (deck §13–14) */}
        {f.worldMap ? (
          <section className="border-b border-pearl/10">
            <div className="mx-auto max-w-6xl px-6 py-28 md:py-32">
              <SectionLabel title="Geographies" />
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <h3 className="t-h1 max-w-md text-pearl">The world&apos;s major venues, in one frame.</h3>
                <p className="t-mono text-xs uppercase tracking-[0.2em] text-steel">Top 15 economies</p>
              </div>
              <div className="mt-12"><WorldMap tone="dark" /></div>
              <div className="mt-10 grid gap-6 border-t border-pearl/10 pt-8 sm:grid-cols-3">
                {EXCHANGES_BY_REGION.map((r) => (
                  <div key={r.region}>
                    <p className="t-mono text-[0.7rem] uppercase tracking-[0.22em] text-aqua/80">{r.region}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                      {r.venues.map((v) => <span key={v} className="t-mono text-sm text-mist">{v}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ================================================= RESEARCH ==== */}
        <section id="research" className="mx-auto max-w-6xl px-6 py-28 md:py-32">
          <SectionLabel title="Featured Research" />
          <div className="grid gap-6 lg:grid-cols-3">
            {ARTICLES.map((a) => (
              <TransitionLink key={a.title} href={`/research/${a.slug}`} className="group flex flex-col rounded-sm border border-pearl/10 bg-navy-elevated/50 p-7 transition-all duration-500 hover:-translate-y-0.5 hover:border-pearl/25">
                <span className="t-mono text-xs uppercase tracking-[0.18em] text-aqua/80">{a.cat}</span>
                <h3 className="t-h2 mt-4 text-pearl">{a.title}</h3>
                <p className="mt-3 flex-1 leading-relaxed text-mist">{a.blurb}</p>
                <div className="mt-6 flex items-center gap-3 border-t border-pearl/10 pt-4 t-mono text-xs uppercase tracking-[0.14em] text-steel">
                  {a.meta.map((m, i) => (
                    <span key={m} className="flex items-center gap-3">
                      {i > 0 ? <span className="text-aqua/50" aria-hidden="true">·</span> : null}
                      <span className={i === a.meta.length - 1 ? "text-aqua" : ""}>{m}</span>
                    </span>
                  ))}
                </div>
              </TransitionLink>
            ))}

            {/* live backtest metric card */}
            <div className="corner-ticks flex flex-col justify-between rounded-sm border border-pearl/10 bg-navy-elevated/50 p-6">
              <div className="flex items-start justify-between">
                <span className="t-mono text-xs uppercase tracking-[0.18em] text-mist">Risk-Parity · Backtest</span>
                <span className="live-dot inline-block h-2 w-2 rounded-full bg-aqua" aria-hidden="true" />
              </div>
              <div className="my-6">
                <p className="tnum t-mono text-5xl font-bold text-pearl"><CountUp value={1.87} decimals={2} /></p>
                <p className="mt-1 t-mono text-xs uppercase tracking-[0.16em] text-steel">Sharpe (net) · 2009—2025</p>
              </div>
              <Sparkline />
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-pearl/10 pt-4">
                <Metric label="Max DD" value="−12.4%" />
                <Metric label="Vol" value="8.9%" tone="aqua" />
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Link href="/research" className="link-fine t-mono text-sm uppercase tracking-[0.16em] text-pearl/90 transition-colors duration-300 hover:text-pearl">
              All research &amp; notebooks →
            </Link>
          </div>
        </section>

        {/* ========================================= COURSE (LIGHT) ====== */}
        <section id="course" className="bg-sisal text-anthracite">
          <div className="mx-auto max-w-3xl px-6 py-28">
            <div className="mb-10 flex items-center gap-4 border-b border-anthracite/15 pb-4">
              <span className="h-px w-8 bg-teal/60" aria-hidden="true" />
              <span className="t-mono text-sm uppercase tracking-[0.24em] text-graphite">Course · Quant Finance Basics</span>
            </div>
            <h3 className="t-h1 mt-4 text-anthracite">Mean-variance, and what it forgets</h3>
            <p className="dropcap mt-8 text-lg leading-[1.75] text-anthracite/85">
              Markowitz gave us the efficient frontier in 1952 — a frame so durable it still
              anchors how institutions think about risk. Yet the moment you estimate inputs from
              finite data, the optimizer turns into an <em className="font-serif italic">error-maximizing machine</em>.
              This is the tension every practitioner inherits.
            </p>
            <blockquote className="my-10 border-l-2 border-teal pl-6">
              <p className="font-serif text-2xl italic leading-snug text-anthracite">“The optimizer is exquisitely sensitive to inputs it can never know precisely.”</p>
            </blockquote>
            <p className="text-lg leading-[1.75] text-anthracite/85">
              The fix is rarely a fancier optimizer — it is a humbler estimate. Shrink the
              covariance toward structure, as in <code className="rounded-sm bg-anthracite/[0.06] px-1.5 py-0.5 t-mono text-[0.85em] text-teal">LedoitWolf()</code>,
              and the out-of-sample frontier stops lying to you.
            </p>
            <a href="#" className="mt-10 inline-flex items-center gap-2 t-mono text-xs uppercase tracking-[0.18em] text-teal">
              Begin the course <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </main>

      {/* ==================================================== FOOTER ===== */}
      <footer className="bg-navy-sunken">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-sm">
              {f.crest ? <CrestLockup tone="light" /> : (
                <div className="flex items-baseline gap-1">
                  <span className="text-lg text-pearl" style={{ fontWeight: 900 }}>pyportfolios</span>
                  <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-aqua" aria-hidden="true" />
                </div>
              )}
              <p className="mt-4 font-serif text-lg italic leading-snug text-mist">Where finance theory, coding &amp; markets converge into your path of growth.</p>
              <p className="mt-5 t-mono text-xs italic text-steel">Diligam te, Domine, fortitudo mea.</p>
            </div>
            <div className="grid grid-cols-2 gap-10 t-mono text-xs">
              <div>
                <p className="uppercase tracking-[0.2em] text-steel">Sections</p>
                <ul className="mt-4 space-y-2.5">
                  {NAV.map((n) => <li key={n}><a href={`#${n.toLowerCase()}`} className="text-mist transition-colors hover:text-aqua">{n}</a></li>)}
                </ul>
              </div>
              <div>
                <p className="uppercase tracking-[0.2em] text-steel">Contact</p>
                <ul className="mt-4 space-y-2.5 text-mist">
                  <li>pyportfolios@protonmail.com</li>
                  <li>Albuquerque, NM</li>
                  <li className="text-aqua">pyportfolios.com</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-14 flex flex-col justify-between gap-3 border-t border-pearl/10 pt-6 t-mono text-xs uppercase tracking-[0.16em] text-steel sm:flex-row">
            <span>© 2026 pyportfolios. All rights reserved.</span>
            <span className="text-aqua">pyportfolios.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------------------------------------------------- composite atoms -- */

function Metric({ label, value, tone }: { label: string; value: string; tone?: "aqua" }) {
  return (
    <div>
      <p className="t-mono text-[0.65rem] uppercase tracking-[0.14em] text-steel">{label}</p>
      <p className={`tnum t-mono text-base ${tone === "aqua" ? "text-aqua" : "text-pearl"}`}>{value}</p>
    </div>
  );
}
