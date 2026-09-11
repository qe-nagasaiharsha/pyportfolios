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
import { CategoryNavItem } from "@/components/nav/CategoryNavItem";

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
import { GeographiesMap } from "@/components/brand/GeographiesMap";
import { PhotoPlate } from "@/components/brand/PhotoPlate";
import { StackCards } from "@/components/brand/StackCards";
import { ExchangeRow } from "@/components/brand/ExchangeRow";
import { DerivativesRow } from "@/components/brand/DerivativesRow";
import { MobileNav } from "@/components/MobileNav";
import { AuthNavButton } from "@/components/AuthNavButton";
import { SectorsIndices } from "@/components/brand/SectorsIndices";
import { EtfProviders } from "@/components/brand/EtfProviders";
import { WorldClockBand } from "@/components/brand/WorldClockBand";
import { WorldSphere } from "@/components/WorldSphere";
import { PhotoBackdrop } from "@/components/brand/PhotoBackdrop";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { EarlyAccess } from "@/components/landing/EarlyAccess";
import { PageTOC } from "@/components/landing/PageTOC";
import { Lightbox } from "@/components/landing/Lightbox";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { CapabilityCards } from "@/components/brand/CapabilityCards";

const NAV = [
  { label: "Quant Finance Foundations", href: "/research/quant-finance-foundations" },
  { label: "Portfolio Optimization", href: "/research/portfolio-optimization" },
  { label: "Risk Management", href: "/research/risk-management" },
  { label: "Algorithmic Trading", href: "/research/algorithmic-trading" },
] as const;

const PILLARS = [
  { no: "01", title: "Coding", img: "coding", bullets: ["High-level concepts & academic rigor", "Top-notch Python codes", "Latest ML and LLM AI engines"] },
  { no: "02", title: "Trading", img: "trading", bullets: ["Portfolio diversification & rebalancing", "Linking quant finance & markets", "Algorithmic execution & backtesting"] },
  { no: "03", title: "Markets", img: "markets", bullets: ["Real world market data across assets", "Proven trading ideas & strategies", "Advanced portfolio optimizations"] },
] as const;

const ASSET_CLASSES = [
  { name: "Equities", desc: "Stocks & ETFs" },
  { name: "Fixed Income", desc: "Bonds & Treasuries" },
  { name: "FX", desc: "Currency Pairs" },
  { name: "Commodities", desc: "Metals, Energy" },
  { name: "Derivatives", desc: "Futures & Options" },
  { name: "Real Estate", desc: "REITs & Infrastructure" },
  { name: "Crypto", desc: "Digital Assets" },
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
        <header className="border-b border-pearl/10 bg-navy/95">
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
              {NAV.map((item, i) => (
                <CategoryNavItem
                  key={item.label}
                  label={item.label}
                  href={item.href}
                  /* last category sits far right; open its panel leftwards */
                  align={i === NAV.length - 1 ? "right" : "left"}
                />
              ))}
              <li>
                <a href="/course" className="block text-center font-sans font-black text-[0.68rem] leading-[1.05] tracking-[0.1em] text-pearl/85 transition-colors duration-200 hover:text-pearl"><span className="block">Course</span><span className="block">Structure</span></a>
              </li>
              <li>
                <a href="/literature" className="block text-center font-sans font-black text-[0.68rem] leading-[1.05] tracking-[0.1em] text-pearl/85 transition-colors duration-200 hover:text-pearl"><span className="block">Literature</span><span className="block">Recommendations</span></a>
              </li>
            </ul>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <AuthNavButton />
              <MobileNav
                items={[...NAV, { label: "Course Structure", href: "/course" }, { label: "Literature Recommendations", href: "/literature" }]}
              />
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
          <PhotoBackdrop src="/hero-framed.png" overlay="center" position="center top" />
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
                <p className={`hero-in mt-7 max-w-xl ${heroSub} text-lg font-semibold leading-relaxed text-pearl/70`} style={{ "--hero-delay": "200ms" } as CSSProperties}>
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
            <h3 className="t-h1 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)" }}>
              Quant Theory<span aria-hidden="true" className="mx-3 inline-block h-[0.2em] w-[0.2em] rounded-full bg-pearl/80 align-middle" />Python Practice<span aria-hidden="true" className="mx-3 inline-block h-[0.2em] w-[0.2em] rounded-full bg-pearl/80 align-middle" />Trading Implementation<br />
              <span className="text-pearl/35">Harness coding<span aria-hidden="true" className="mx-3 inline-block h-[0.2em] w-[0.2em] rounded-full bg-pearl/35 align-middle" />implement strategies<span aria-hidden="true" className="mx-3 inline-block h-[0.2em] w-[0.2em] rounded-full bg-pearl/35 align-middle" />stay on top.</span>
            </h3>
            <p className="mt-5 mb-12 max-w-5xl text-lg leading-relaxed text-mist">
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
                  <h3 className="t-h2 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>{p.title}<span className="text-aqua">.</span></h3>
                  <ul className="mt-4 space-y-1.5">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex gap-2 text-sm leading-relaxed text-mist">
                        <span className="shrink-0" aria-hidden="true">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
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
          <h3 className="t-h1 max-w-3xl text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)" }}>
            Best in Class Libraries<br />
            <span className="text-pearl/35">The Python Quant Stack.</span>
          </h3>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-mist">
            Open-source libraries composed into clean, reproducible research.
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
            <div className="mb-12 max-w-4xl">
              <h3 className="t-h1 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)" }}>
                Exchanges, Instruments, Asset Classes &amp; Sectors<br />
                <span className="text-pearl/35">Global Capital Markets and unlimited Data.</span>
              </h3>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-mist">Equities, indices, and sectors from the largest and most liquid stock exchanges worldwide.</p>
            </div>
            {/* 1 — stock exchanges */}
            <div>
              <p className="t-mono text-sm uppercase tracking-[0.22em] text-aqua/80">A) Global Stock Exchanges</p>
              <h3 className="mt-4 t-h1 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.25rem, 2.6vw, 1.75rem)" }}>
                Stock Exchanges<br />
                <span className="text-pearl/35">Global coverage across major listing venues</span>
              </h3>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-mist">
                Our case studies draw on equities, indices, and sectors from the largest and most liquid stock exchanges worldwide.
              </p>
              <div className="mt-10">
                <ExchangeRow />
              </div>
            </div>

            {/* 2 — derivatives exchanges */}
            <div className="mt-14 border-t border-pearl/10 pt-10">
              <div className="flex items-center gap-3">
                <span className="t-mono text-sm uppercase tracking-[0.22em] text-aqua/80">B) Derivatives Exchange</span>
                <span className="h-px flex-1 bg-pearl/10" />
              </div>
              <h3 className="mt-4 t-h1 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.25rem, 2.6vw, 1.75rem)" }}>
                Derivatives Exchanges<br />
                <span className="text-pearl/35">Futures, options and derivatives venues</span>
              </h3>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-mist">
                Explore global derivatives markets through practical case studies featuring futures and options from the world&rsquo;s leading exchanges.
              </p>
              <div className="mt-10">
                <DerivativesRow />
              </div>
            </div>

            {/* 3 — asset classes & ETF providers */}
            <div className="mt-14 border-t border-pearl/10 pt-10">
              <p className="t-mono text-sm uppercase tracking-[0.22em] text-aqua/80">C) Diverse Asset Classes &amp; ETFs</p>
              <h3 className="mt-4 t-h1 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.25rem, 2.6vw, 1.75rem)" }}>
                Asset Classes &amp; ETF Providers<br />
                <span className="text-pearl/35">Comprehensive Multi-Asset Coverage Through Leading ETF Providers</span>
              </h3>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-mist">
                Analyze traditional and alternative asset classes, including real assets and digital assets, with institutional-grade ETF market data.
              </p>

              {/* asset class cards */}
              <div className="mt-10">
                <div className="mb-4 flex items-center gap-3">
                  <span className="t-mono text-[0.68rem] uppercase tracking-[0.22em] text-aqua/80">Asset Classes</span>
                  <span className="h-px flex-1 bg-pearl/10" />
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
                  {ASSET_CLASSES.map((a) => (
                    <div key={a.name} className="rounded-sm border border-pearl/10 bg-navy-elevated/40 px-3 py-5 text-center transition-colors duration-300 hover:border-pearl/25">
                      <p className="font-sans text-[0.92rem] leading-tight text-pearl" style={{ fontWeight: 700 }}>{a.name}</p>
                      <p className="mt-1.5 text-[0.7rem] leading-snug text-steel">{a.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* etf main providers */}
              <div className="mt-10">
                <EtfProviders />
              </div>
            </div>

            {/* 4 — indices and sectors */}
            <div className="mt-14 border-t border-pearl/10 pt-10">
              <p className="t-mono text-sm uppercase tracking-[0.22em] text-aqua/80">D) Sector and Country Focus</p>
              <h3 className="mt-4 t-h1 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.25rem, 2.6vw, 1.75rem)" }}>
                Index Providers, Sectors &amp; Country Indices<br />
                <span className="text-pearl/35">Coverage Across Major Benchmarks, GICS Sectors, and Global Indices</span>
              </h3>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-mist">
                Comprehensive coverage across industries, sectors, and country indices for the world&apos;s top 15 economies — powered by leading global index providers.
              </p>
              <div className="mt-10">
                <SectorsIndices />
              </div>
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
            <h3 className="t-h1 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)" }}>
              Top 15 Economies<br />
              <span className="text-pearl/35">Assets &amp; securities from key developed<br />and emerging markets</span>
            </h3>
            <GeographiesMap />
          </div>
        </section>

        {/* ============================================ CONCEPTS / MODELS == */}
        <section id="concepts" className="relative scroll-mt-24 overflow-hidden border-y border-pearl/10 bg-navy-elevated/40">
          <div data-reveal className="relative mx-auto max-w-6xl px-6 py-28 md:py-32">
            <SectionLabel no="05" title="Concepts" />
            <h3 className="t-h1 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)" }}>
              Applied Science<span aria-hidden="true" className="mx-3 inline-block h-[0.2em] w-[0.2em] rounded-full bg-pearl/80 align-middle" />Empirical Studies.<br />
              <span className="text-pearl/35">Coding, Analysis, and Results.</span>
            </h3>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-mist">
              From asset pricing to portfolio construction to risk management — academic models, implemented empirically and stress-tested on real data.
            </p>
            <div className="mt-12">
              <CapabilityCards />
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
