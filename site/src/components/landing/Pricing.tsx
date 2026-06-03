/* Pricing — present and aspirational, but honestly marked "coming soon"
   (subscription mechanics are a later milestone). CTAs route to the early-access
   capture so intent is collected before payments exist. */

import type { CSSProperties } from "react";
import { Aurora } from "@/components/brand/Aurora";

interface Tier {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "Free",
    cadence: "",
    blurb: "The fundamentals and every notebook — yours to run, from day one.",
    features: ["Finance-fundamentals lessons", "Selected case studies", "All notebooks, fully runnable", "Community access"],
    cta: "Start free",
  },
  {
    name: "Pro",
    price: "$20",
    cadence: "/ month",
    blurb: "The full research library — every category, kept current.",
    features: ["Everything in Starter", "All four categories, in depth", "New case studies monthly", "Quant-finance-basics course", "Priority support"],
    cta: "Go Pro",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "$950",
    cadence: "lifetime",
    blurb: "Lifetime access for serious practitioners and small teams.",
    features: ["Everything in Pro", "Lifetime updates", "Team licences", "A direct line to the author"],
    cta: "Talk to us",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-20 overflow-hidden border-b border-pearl/10">
      <Aurora />
      <div className="relative mx-auto max-w-6xl px-6 py-28 md:py-32">
        <div data-reveal className="mb-12 flex flex-col gap-4 border-b border-pearl/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="h-px w-8 bg-aqua/50" aria-hidden="true" />
            <h2 className="t-mono text-sm uppercase tracking-[0.24em] text-mist">Pricing</h2>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-aqua/40 px-3 py-1 t-mono text-[0.6rem] uppercase tracking-[0.18em] text-aqua">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-aqua" aria-hidden="true" />
            Coming soon
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((t, i) => (
            <div
              key={t.name}
              data-reveal
              style={{ "--reveal-delay": `${i * 90}ms` } as CSSProperties}
              className={`relative flex flex-col rounded-sm border bg-navy-elevated/50 p-7 transition-all duration-500 hover:-translate-y-0.5 ${
                t.featured ? "border-aqua/40" : "border-pearl/10 hover:border-pearl/25"
              }`}
            >
              {t.featured ? (
                <span className="absolute -top-3 left-7 rounded-full bg-aqua px-3 py-1 t-mono text-[0.58rem] uppercase tracking-[0.16em] text-navy" style={{ fontWeight: 700 }}>
                  Most popular
                </span>
              ) : null}
              <h3 className="t-mono text-sm uppercase tracking-[0.2em] text-pearl">{t.name}</h3>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-serif text-5xl text-pearl" style={{ fontWeight: 500 }}>{t.price}</span>
                {t.cadence ? <span className="t-mono text-xs uppercase tracking-[0.14em] text-steel">{t.cadence}</span> : null}
              </div>
              <p className="mt-4 min-h-[3rem] leading-relaxed text-mist">{t.blurb}</p>
              <ul className="mt-6 flex-1 space-y-3 border-t border-pearl/10 pt-6">
                {t.features.map((f) => (
                  <li key={f} className="flex items-baseline gap-3 text-sm text-pearl">
                    <span className="mt-0.5 text-aqua" aria-hidden="true">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#early-access"
                className={`mt-8 inline-flex items-center justify-center rounded-sm px-6 py-3 text-sm font-semibold transition-colors duration-300 ${
                  t.featured
                    ? "bg-pearl text-navy hover:bg-aqua"
                    : "border border-pearl/20 text-pearl hover:border-aqua hover:text-aqua"
                }`}
              >
                {t.cta}
              </a>
            </div>
          ))}
        </div>
        <p className="mt-8 t-mono text-xs text-steel">
          Plans are indicative while the platform is in build — join early access and you&apos;ll be first to know when they go live.
        </p>
      </div>
    </section>
  );
}
