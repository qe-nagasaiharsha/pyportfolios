"use client";

/* Pricing — three tiers with a monthly/yearly billing toggle. Plans are still
   aspirational while subscription mechanics are a later milestone, so every CTA
   routes to the early-access capture. */

import { useState } from "react";
import type { CSSProperties } from "react";

interface Tier {
  name: string;
  monthly: { price: string; cadence: string };
  yearly: { price: string; cadence: string };
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    monthly: { price: "$0", cadence: "/ month" },
    yearly: { price: "$0", cadence: "/ year" },
    blurb: "Perfect for exploring the curriculum with foundational lessons and starter notebooks.",
    features: ["Foundations & Data Layer module", "5 backtests per month", "Community forum access"],
    cta: "Start for Free",
  },
  {
    name: "Pro",
    monthly: { price: "$20", cadence: "/ month" },
    yearly: { price: "$199", cadence: "/ year" },
    blurb: "Full curriculum access with unlimited backtests, live model libraries, and priority support.",
    features: [
      "All 6 model modules unlocked",
      "Unlimited backtests & simulations",
      "Full library & tooling access",
      "Priority support & live Q&A",
    ],
    cta: "Upgrade to Pro",
    featured: true,
    badge: "Popular",
  },
  {
    name: "Lifetime",
    monthly: { price: "$950", cadence: "one-time" },
    yearly: { price: "$790", cadence: "one-time" },
    blurb: "A single payment for lifetime access to every module, plus all future updates and mentorship.",
    features: [
      "Lifetime access & all future updates",
      "1:1 mentorship sessions",
      "Dedicated support & private community",
      "Certificate of completion",
    ],
    cta: "Contact Sales",
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section id="pricing" className="relative scroll-mt-20 overflow-hidden border-b border-pearl/10">
      <div className="relative mx-auto max-w-6xl px-6 py-28 md:py-32">
        {/* label */}
        <div data-reveal className="mb-8 flex items-center gap-4">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
          <span className="t-mono text-sm font-bold tabular-nums text-aqua">06</span>
          <h2 className="t-mono text-sm uppercase tracking-[0.24em] text-mist">Pricing</h2>
          <span className="h-px flex-1 bg-pearl/10" />
        </div>

        {/* headline + subtext */}
        <h3 data-reveal className="t-h1 max-w-3xl text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)" }}>
          Choose the plan <span className="text-pearl/35">that matches</span> your ambition
        </h3>
        <p data-reveal className="mt-5 max-w-2xl text-lg leading-relaxed text-mist">
          Flexible pricing for every stage of your quant journey — from your first model to a lifetime of research.
        </p>

        {/* billing toggle */}
        <div data-reveal className="mt-8 flex items-center gap-3">
          <span className={`t-mono text-xs uppercase tracking-[0.16em] transition-colors ${yearly ? "text-steel" : "text-pearl"}`}>
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={yearly}
            aria-label="Toggle yearly billing"
            onClick={() => setYearly((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300 ${
              yearly ? "border-aqua/60 bg-aqua/20" : "border-pearl/20 bg-navy-elevated"
            }`}
          >
            <span
              className={`absolute left-0.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-pearl transition-transform duration-300 ${
                yearly ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`t-mono text-xs uppercase tracking-[0.16em] transition-colors ${yearly ? "text-pearl" : "text-steel"}`}>
            Yearly
          </span>
          <span className="ml-1 inline-flex items-center rounded-full border border-aqua/40 px-2.5 py-1 t-mono text-[0.58rem] uppercase tracking-[0.14em] text-aqua">
            17% off
          </span>
        </div>

        {/* cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TIERS.map((t, i) => {
            const p = yearly ? t.yearly : t.monthly;
            return (
              <div
                key={t.name}
                data-reveal
                style={{ "--reveal-delay": `${i * 90}ms` } as CSSProperties}
                className="flex"
              >
              <div
                role="button"
                tabIndex={0}
                aria-pressed={selected === t.name}
                onClick={() => setSelected(t.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(t.name);
                  }
                }}
                className={`relative flex flex-1 cursor-pointer flex-col rounded-lg border bg-navy-elevated/50 p-7 outline-none transition-all duration-300 hover:-translate-y-0.5 focus-visible:border-aqua/40 ${
                  selected === t.name
                    ? "border-aqua/60 shadow-[0_0_44px_-20px_rgba(43,212,196,0.6)]"
                    : "border-pearl/10 hover:border-pearl/25"
                }`}
              >
                {/* name + badge */}
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-2xl text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>{t.name}</h4>
                  {t.badge ? (
                    <span className="inline-flex items-center rounded-full border border-pearl/40 px-2.5 py-1 t-mono text-[0.55rem] uppercase tracking-[0.16em] text-pearl">
                      {t.badge}
                    </span>
                  ) : null}
                </div>

                {/* price */}
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-5xl text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>{p.price}</span>
                  <span className="t-mono text-xs uppercase tracking-[0.14em] text-steel">{p.cadence}</span>
                </div>

                {/* blurb */}
                <p className="mt-4 min-h-[4.5rem] leading-relaxed text-mist">{t.blurb}</p>

                {/* cta */}
                <div className="mt-1 flex h-12 items-center">
                  <a
                    href="#early-access"
                    onClick={() => setSelected(t.name)}
                    className={`transition-colors duration-300 ${
                      t.featured
                        ? "inline-flex items-center justify-center rounded-full bg-pearl px-7 py-3 text-sm font-semibold text-navy hover:bg-aqua"
                        : "text-sm font-semibold text-pearl hover:text-aqua"
                    }`}
                  >
                    {t.cta}
                  </a>
                </div>

                {/* features */}
                <div className="mt-7 flex items-center gap-3">
                  <span className="h-px flex-1 bg-pearl/10" />
                  <span className="t-mono text-[0.6rem] uppercase tracking-[0.22em] text-steel">Features</span>
                  <span className="h-px flex-1 bg-pearl/10" />
                </div>
                <ul className="mt-5 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 t-mono text-[0.76rem] leading-relaxed text-mist">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-px shrink-0 text-steel" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M8.5 12.4l2.4 2.4 4.6-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 t-mono text-xs text-steel">
          Plans are indicative while the platform is in build — join early access and you&apos;ll be first to know when they go live.
        </p>
      </div>
    </section>
  );
}
