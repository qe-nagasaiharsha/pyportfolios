"use client";

/* Pricing — three subscription tiers. Plans are still aspirational while
   subscription mechanics are a later milestone, so every CTA routes to the
   early-access capture. */

import { useState } from "react";
import type { CSSProperties } from "react";

interface Tier {
  name: string;
  sub: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    name: "Basic",
    sub: "Sign-up required",
    price: "Free",
    cadence: "no commitment",
    blurb: "",
    features: ["Sample notebooks", "Weekly newsletter", "Community access"],
    cta: "Start for Free",
  },
  {
    name: "Pro",
    sub: "Full library · cloud",
    price: "$29",
    cadence: "/ mo · $290 /yr",
    blurb: "",
    features: [
      "Run all case studies in the cloud",
      "Interactive notebooks, code, explanations",
    ],
    cta: "Upgrade to Pro",
    featured: true,
    badge: "Popular",
  },
  {
    name: "Premium",
    sub: "Research environment",
    price: "$79",
    cadence: "/ mo · $790 /yr",
    blurb: "",
    features: [
      "Datasets & downloads",
      "Deep-dive reports",
      "Priority access",
    ],
    cta: "Contact Sales",
  },
];

export function Pricing() {
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

        {/* cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TIERS.map((t, i) => (
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
                    : "border-pearl/10 hover:border-aqua/50"
                }`}
              >
                {/* name + badge */}
                <div className="flex items-center justify-between gap-3">
                  <h4 className={`text-2xl ${t.featured ? "text-aqua" : "text-pearl"}`} style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>{t.name}</h4>
                  {t.badge ? (
                    <span className="inline-flex items-center rounded-full border border-pearl/40 px-2.5 py-1 t-mono text-[0.55rem] uppercase tracking-[0.16em] text-pearl">
                      {t.badge}
                    </span>
                  ) : null}
                </div>

                {/* sub-label */}
                <p className="mt-1.5 t-mono text-[0.72rem] tracking-[0.04em] text-steel">{t.sub}</p>

                {/* price */}
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-5xl text-aqua" style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>{t.price}</span>
                  <span className="t-mono text-xs tracking-[0.12em] text-steel">{t.cadence}</span>
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
          ))}
        </div>
      </div>
    </section>
  );
}
