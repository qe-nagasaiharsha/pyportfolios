/* ============================================================================
   ARCHIVED — the previous "Concepts & models, applied." section of the landing
   page, kept so nothing is lost. Replaced on the live page by CapabilityCards
   (the six-card capability grid).

   The two graphs from that section are preserved here:
     • FigureCovariance  — the out-of-sample volatility (sample vs Ledoit-Wolf
       shrinkage) line chart, defined below.
     • ReturnsHistogram  — daily returns / VaR-tail histogram, still living at
       src/components/charts/ReturnsHistogram.tsx and imported below.

   This file is NOT imported anywhere. To restore the old section, render
   <ConceptsModelsLegacy /> back in StyleTile.
   ========================================================================== */

import type { CSSProperties } from "react";
import { ReturnsHistogram } from "@/components/charts/ReturnsHistogram";

const MODELS = [
  { group: "Pricing", items: "Black–Scholes · Binomial · Monte Carlo" },
  { group: "Portfolio", items: "Markowitz · Black–Litterman · Risk Parity · HRP" },
  { group: "Risk", items: "VaR / CVaR · GARCH · Extreme Value · Drawdown" },
  { group: "Machine Learning", items: "Shrinkage · Trees · Clustering" },
  { group: "Signals", items: "Momentum · Mean-reversion · Factor models" },
  { group: "Performance", items: "Sharpe · Sortino · Attribution" },
] as const;

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

export function ConceptsModelsLegacy() {
  return (
    <section id="concepts" className="relative scroll-mt-24 overflow-hidden border-y border-pearl/10 bg-navy-elevated/40">
      <div className="relative mx-auto grid max-w-6xl items-start gap-12 px-6 py-28 md:py-32 lg:grid-cols-2">
        <div data-reveal>
          <p className="t-mono text-sm uppercase tracking-[0.24em] text-aqua/80">05 · Concepts</p>
          <h3 className="mt-6 t-h1 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>Concepts &amp; models, applied.</h3>
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
  );
}
