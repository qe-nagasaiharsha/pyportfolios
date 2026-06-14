/* ============================================================================
   The dark "Quant Research House" landing page, parametrized by a Variant.
   Real product content only — no design-system meta (no swatches, hex, type
   specimens, §/edition/version/figure-number labels, or colour callouts).
   v1–v5 each layer ONE deck enhancement. Pure Server Component; only the top
   toggle is client-side.
   ========================================================================== */

import fs from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";
import type { Variant } from "@/lib/variants";

/* Our-Focus images are drop-in: place coding/trading/markets.<ext> in
   public/focus/ (jpg, jpeg, png, webp or avif) and they appear automatically,
   no code change. Resolved once at build time. */
const FOCUS_DIR = path.join(process.cwd(), "public", "focus");
function focusSrc(slug: string): string | null {
  for (const ext of ["jpg", "jpeg", "png", "webp", "avif"]) {
    try {
      if (fs.existsSync(path.join(FOCUS_DIR, `${slug}.${ext}`))) return `/focus/${slug}.${ext}`;
    } catch {}
  }
  return null;
}
import { Crest, CrestLockup } from "@/components/brand/Crest";
import { PhotoPlate } from "@/components/brand/PhotoPlate";
import { StackCards } from "@/components/brand/StackCards";
import { EXCHANGES_BY_REGION } from "@/components/brand/WorldMap";
import { ExchangeRow } from "@/components/brand/ExchangeRow";
import { SectorsIndices } from "@/components/brand/SectorsIndices";
import { WorldClockBand } from "@/components/brand/WorldClockBand";
import { WorldSphere } from "@/components/WorldSphere";
import { PhotoBackdrop } from "@/components/brand/PhotoBackdrop";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { EarlyAccess } from "@/components/landing/EarlyAccess";
import { PageTOC } from "@/components/landing/PageTOC";
import { Lightbox } from "@/components/landing/Lightbox";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { ReturnsHistogram } from "@/components/charts/ReturnsHistogram";

const NAV = [
  { label: "Finance Fundamentals", href: "/research#finance-fundamentals" },
  { label: "Portfolio Optimization", href: "/research#portfolio-optimization" },
  { label: "Risk Management", href: "/research#risk-management" },
  { label: "Algorithmic Trading", href: "/research#algorithmic-trading" },
] as const;

const PILLARS = [
  { no: "01", title: "Coding", img: "coding", body: "Structured case studies and ready-to-run snippets — investment-banking style — across the modern Python quant stack." },
  { no: "02", title: "Trading", img: "trading", body: "Algorithmic trading, portfolio optimization and risk management in a simple, empirical, practical format." },
  { no: "03", title: "Markets", img: "markets", body: "Academic-level models meet state-of-the-art frameworks, using data from the world's major exchanges." },
] as const;

const MARKETS = [
  { label: "Asset Classes", items: ["Equities", "Fixed Income", "FX", "Commodities", "Derivatives", "Real Estate", "Crypto"] },
  { label: "Instruments", items: ["Options", "Futures", "Swaps", "ETFs", "Bonds", "Forwards"] },
] as const;


const MODELS = [
  { group: "Pricing", items: "Black–Scholes · Binomial · Monte Carlo" },
  { group: "Portfolio", items: "Markowitz · Black–Litterman · Risk Parity · HRP" },
  { group: "Risk", items: "VaR / CVaR · GARCH · Extreme Value · Drawdown" },
  { group: "Machine Learning", items: "Shrinkage · Trees · Clustering" },
  { group: "Signals", items: "Momentum · Mean-reversion · Factor models" },
  { group: "Performance", items: "Sharpe · Sortino · Attribution" },
] as const;


function SectionLabel({ title, no }: { title: string; no?: string }) {
  return (
    <div className="mb-10 flex items-center gap-4 border-b border-pearl/10 pb-4">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
      <div className="flex items-baseline gap-2.5">
        {no ? <span className="t-mono text-sm font-bold tabular-nums text-aqua">{no}</span> : null}
        <h2 className="t-mono text-sm uppercase tracking-[0.24em] text-mist">{title}</h2>
      </div>
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
      <path className="draw-line" d="M0,300 C120,288 190,250 280,256 C380,262 430,205 540,188 C650,171 690,150 790,118 C880,90 940,98 1040,64 C1110,40 1150,42 1200,28" fill="none" stroke="#1FFFFF" strokeOpacity="0.32" strokeWidth="1.25" />
    </svg>
  );
}

function FigureCovariance() {
  const gridY = [40, 90, 140, 190];
  const gridX = [120, 240, 360, 480];
  return (
    <figure
      className="corner-ticks cursor-zoom-in rounded-sm border border-pearl/10 bg-navy-sunken/60 p-7 transition-colors duration-200 hover:border-aqua/40"
      data-zoom
      role="button"
      tabIndex={0}
      aria-label="Enlarge chart: out-of-sample volatility"
    >
      <svg viewBox="0 0 600 240" className="w-full" role="img"
        aria-label="Out-of-sample volatility: sample covariance versus Ledoit-Wolf shrinkage across portfolios.">
        {gridY.map((y) => <line key={`y${y}`} x1="0" y1={y} x2="600" y2={y} stroke="#EEEEEE" strokeOpacity="0.06" strokeWidth="1" />)}
        {gridX.map((x) => <line key={`x${x}`} x1={x} y1="0" x2={x} y2="210" stroke="#EEEEEE" strokeOpacity="0.06" strokeWidth="1" />)}
        <polyline points="0,70 60,96 120,58 180,120 240,78 300,150 360,96 420,170 480,120 540,196 600,150"
          fill="none" stroke="#59617A" strokeWidth="1.5" strokeLinejoin="round" />
        <path className="draw-path" style={{ "--len": "760" } as CSSProperties} d="M0,110 C90,108 130,118 200,126 C280,135 320,150 400,156 C470,161 520,172 600,178"
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

export default function StyleTile({
  variant,
  heroAlign = "left",
}: {
  variant: Variant;
  heroAlign?: "left" | "center" | "right";
}) {
  const f = variant.flags;
  // Hero text alignment — three versions: left (default), centre, right.
  const heroWrap =
    heroAlign === "center"
      ? "mx-auto text-center"
      : heroAlign === "right"
        ? "ml-auto max-w-xl text-right"
        : "max-w-xl";
  const heroSub = heroAlign === "center" ? "mx-auto" : heroAlign === "right" ? "ml-auto" : "";

  return (
    <div className="min-h-screen bg-navy text-pearl">
      <ScrollReveal />
      <Lightbox />
      {/* ============ STICKY TOP: version toggle row + site nav ========= */}
      <div className="sticky top-0 z-50">
        <header className="border-b border-pearl/10 bg-navy/80 backdrop-blur-md">
          <nav className="nav-condense mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
            <a href="#top" className="group nav-logo shrink-0">
              {f.crest ? (
                <CrestLockup tone="light" />
              ) : (
                <span className="font-sans text-lg tracking-tight text-pearl" style={{ fontWeight: 900 }}>
                  pyportfolios<span className="text-aqua">.</span>com
                </span>
              )}
            </a>
            <ul className="hidden flex-1 items-center justify-between gap-4 lg:flex">
              {NAV.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="block text-center font-sans font-black text-[0.68rem] leading-[1.05] tracking-[0.1em] text-pearl/85 transition-colors duration-200 hover:text-pearl">
                    {item.label.split(" ").map((word) => (
                      <span key={word} className="block">{word}</span>
                    ))}
                  </a>
                </li>
              ))}
              <li>
                <a href="/course" className="block text-center font-sans font-black text-[0.68rem] leading-[1.05] tracking-[0.1em] text-pearl/85 transition-colors duration-200 hover:text-pearl"><span className="block">Course</span><span className="block">Structure</span></a>
              </li>
              <li>
                <a href="/literature" className="block text-center font-sans font-black text-[0.68rem] leading-[1.05] tracking-[0.1em] text-pearl/85 transition-colors duration-200 hover:text-pearl"><span className="block">Literature</span><span className="block">Recommendations</span></a>
              </li>
            </ul>
            <div className="flex shrink-0 items-center gap-3">
              <a href="#course" className="inline-flex w-[183px] items-center justify-center rounded-sm border border-pearl/30 py-2 t-mono text-xs font-semibold text-pearl transition-colors duration-300 hover:border-aqua hover:text-aqua">Sign in</a>
            </div>
          </nav>
        </header>
      </div>

      {/* on-this-page table of contents — vertical rail, fixed at the left edge,
          centred in the viewport. Hidden until the first section is active, so it
          only appears once you've scrolled past the hero + world-clock ribbon. */}
      <PageTOC />

      <main id="top">
        {/* ================================================== HERO ======= */}
        {/* Hero sized to fill the viewport below the nav (nav ≈ 67px) so the
            ribbon always lands at the bottom of the fold — CONSISTENT on every
            screen, no leftover space. Full photo with object-cover, so the crop
            flexes top/bottom with screen height; object-position keeps the peaks
            + valley in view. Content is bottom-anchored so the button stays above
            the ticker. min-h floor for very short screens. */}
        <section className="relative h-[calc(100svh-67px)] min-h-[440px] w-full overflow-hidden border-b border-pearl/10">
          <PhotoBackdrop src="/hero-framed.png" overlay={false} position="center top" />
          {f.globe ? <HeroCurve /> : null}
          <div className="absolute inset-x-0 top-[63%] z-10 mx-auto w-full max-w-6xl -translate-y-1/2 px-6">
            <div className={f.globe ? "grid items-center gap-x-12 gap-y-14 lg:grid-cols-[1.04fr_minmax(0,0.96fr)]" : ""}>
              {/* message — kept spare per brief: image · headline · subtitle · one button */}
              <div className={heroWrap}>
                {f.crest ? (
                  <div className="hero-in mb-8" style={{ "--hero-delay": "0ms" } as CSSProperties}><Crest size={56} tone="light" /></div>
                ) : null}
                <h1 className="hero-in t-display text-pearl" style={{ "--hero-delay": "80ms", lineHeight: 1.08 } as CSSProperties}>
                  Get up to speed<span className="text-aqua">.</span>
                </h1>
                <p className={`hero-in mt-7 max-w-xl ${heroSub} text-lg leading-relaxed text-pearl/70`} style={{ "--hero-delay": "200ms" } as CSSProperties}>
                  Coding the markets.<br />
                  Technical depth, real-world context, intellectual clarity<br />
                  — without the noise.
                </p>
                <div className="hero-in mt-10" style={{ "--hero-delay": "320ms" } as CSSProperties}>
                  <a href="#early-access" className="group inline-flex items-center rounded-sm bg-pearl px-8 py-3.5 t-mono text-sm font-semibold text-navy transition-colors duration-300 hover:bg-aqua">
                    Get started
                    <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </a>
                </div>
              </div>

              {/* globe lives only on the dedicated "Globe" version (v6) — off the main hero */}
              {f.globe ? (
                <div className="hero-in relative" style={{ "--hero-delay": "300ms" } as CSSProperties}>
                  <WorldSphere />
                </div>
              ) : null}
            </div>
          </div>
          {/* markets-open indicator — bottom-right, just above the ticker */}
          <div className="absolute bottom-[3.5rem] right-6 z-20 hidden items-center gap-2 sm:flex">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-aqua" aria-hidden="true" />
            <span className="t-mono text-[0.65rem] uppercase tracking-[0.18em] text-pearl/80">Markets open</span>
          </div>
          {/* world-markets ticker — overlaid on the bottom edge of the hero photo */}
          <div className="absolute inset-x-0 bottom-0 z-20">
            <WorldClockBand />
          </div>
        </section>

        {/* ================================================ OUR FOCUS ==== */}
        <section id="focus" className="relative scroll-mt-24 overflow-hidden py-28 md:py-32">
          <div className="relative mx-auto max-w-6xl px-6">
          <div data-reveal>
            <SectionLabel no="01" title="Our Focus" />
            <p className="mb-12 max-w-5xl text-lg leading-relaxed text-mist">
              An educational platform that bridges advanced quantitative finance and practical Python implementation
              <br />— blending technical rigor, real-world application and visual clarity.
            </p>
          </div>
          <div data-reveal style={{ "--reveal-delay": "120ms" } as CSSProperties} className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {PILLARS.map((p) => {
              const src = focusSrc(p.img);
              return (
              <div key={p.no} className="group flex flex-col overflow-hidden rounded-sm border border-pearl/10 bg-navy transition-colors duration-300 hover:border-pearl/25">
                <div className="aspect-[4/3] w-full overflow-hidden bg-navy-elevated/60">
                  {src ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center t-mono text-[0.62rem] uppercase tracking-[0.18em] text-steel">
                      {p.title} image
                    </div>
                  )}
                </div>
                <div className="px-7 py-9">
                  <span className="font-serif text-4xl text-pearl/20" style={{ fontWeight: 500 }}>{p.no}</span>
                  <h3 className="t-h2 mt-4 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>{p.title}</h3>
                  <span className="mt-4 block h-px w-10 bg-aqua" />
                  <p className="mt-4 leading-relaxed text-mist">{p.body}</p>
                </div>
              </div>
              );
            })}
          </div>
          </div>
        </section>

        {/* ================================================ LIBRARIES ==== */}
        <section id="libraries" className="relative scroll-mt-24 overflow-hidden py-28 md:py-32">
          <div data-reveal className="relative mx-auto max-w-6xl px-6">
          <SectionLabel no="02" title="Libraries" />
          <h3 className="t-h1 max-w-3xl text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>The Python quant stack.</h3>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-mist">
            Best-in-class, open-source libraries — composed into clean, reproducible research.
          </p>
          <div className="mt-12">
            <StackCards />
          </div>
          </div>
        </section>

        {/* ================================================== MARKETS ==== */}
        <section id="markets" className="relative scroll-mt-24 overflow-hidden border-y border-pearl/10 bg-navy-elevated/40">
          <div data-reveal className="relative mx-auto max-w-6xl px-6 py-28 md:py-32">
            <SectionLabel no="03" title="Markets" />
            <div className="grid gap-10 md:grid-cols-2">
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

            {/* sectors · country indices · index providers */}
            <div className="mt-14 border-t border-pearl/10 pt-10">
              <SectorsIndices />
            </div>

            {/* the world's major venues — real exchange logos */}
            <div className="mt-14 border-t border-pearl/10 pt-10">
              <p className="mb-6 t-mono text-xs uppercase tracking-[0.22em] text-aqua/80">Major venues</p>
              <ExchangeRow />
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

        {/* 04 — market reach (deck §14): top-15 economies, developed & emerging */}
        <section id="geographies" className="scroll-mt-24 border-b border-pearl/10">
          <div data-reveal className="mx-auto max-w-6xl px-6 py-28 md:py-32">
            <SectionLabel no="04" title="Geographies" />
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <h3 className="t-h1 whitespace-nowrap text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(0.95rem, 3vw, 2.5rem)" }}>The top 15 economies, in one frame.</h3>
              <p className="t-mono text-xs uppercase tracking-[0.2em] text-steel">Developed &amp; emerging markets</p>
            </div>
            {/* the brand map (slide 14) on a soft light card — matches the iconography rule */}
            <figure className="mt-12 overflow-hidden rounded-sm border border-pearl/10 bg-sisal p-4 sm:p-8">
              <img
                src="/world-reach.png"
                alt="World map highlighting the top fifteen economies — developed and emerging — that pyportfolios case studies draw from."
                className="mx-auto w-full max-w-4xl cursor-zoom-in transition-opacity duration-200 hover:opacity-90"
                decoding="async"
                data-zoom
                role="button"
                tabIndex={0}
                aria-label="Enlarge map"
              />
            </figure>
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

        {/* ============================================ CONCEPTS / MODELS == */}
        <section id="concepts" className="relative scroll-mt-24 overflow-hidden border-y border-pearl/10 bg-navy-elevated/40">
          <div className="relative mx-auto grid max-w-6xl items-start gap-12 px-6 py-28 md:py-32 lg:grid-cols-2">
            <div data-reveal>
              <SectionLabel no="05" title="Concepts" />
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
            <div data-reveal style={{ "--reveal-delay": "120ms" } as CSSProperties} className="space-y-6 lg:pt-16">
              <FigureCovariance />
              <figure
                className="corner-ticks cursor-zoom-in rounded-sm border border-pearl/10 bg-navy-sunken/60 p-7 transition-colors duration-200 hover:border-aqua/40"
                data-zoom
                role="button"
                tabIndex={0}
                aria-label="Enlarge chart: daily returns and VaR tail"
              >
                <ReturnsHistogram />
                <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-pearl/10 pt-3">
                  <span className="t-mono text-xs uppercase tracking-[0.18em] text-steel">Daily returns · VaR tail</span>
                  <span className="flex items-center gap-4 t-mono text-xs">
                    <span className="flex items-center gap-1.5 text-aqua"><span className="inline-block h-2 w-2 bg-aqua/80" aria-hidden="true" /> Loss tail</span>
                    <span className="flex items-center gap-1.5 text-mist"><span className="inline-block h-2 w-2 bg-steel/70" aria-hidden="true" /> Returns</span>
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* pricing · faq · early-access capture */}
        <Pricing />
        <FAQ />
        <EarlyAccess />
      </main>

      {/* ==================================================== FOOTER ===== */}
      <footer className="bg-navy-sunken">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-12 sm:flex-row sm:items-center">
          {/* company logo — horizontal Fortitudo lockup, sized to roughly match
              the top-nav wordmark */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/fortitudo-horizontal.png"
            alt="Fortitudo Research LLC"
            className="h-12 w-auto select-none"
            loading="lazy"
            decoding="async"
          />
          <span className="t-mono text-xs text-steel">
            Copyright © 2026, Fortitudo Research LLC, All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
