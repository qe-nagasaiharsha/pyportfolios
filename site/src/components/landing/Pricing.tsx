"use client";

/* Pricing — three tiers with a monthly/yearly billing toggle. Subscription
   mechanics are live (platform API + /checkout); CTAs route to checkout with
   the right plan code, Starter to the free account page. */

import { useState } from "react";
import type { CSSProperties } from "react";
import { ownedRank, useSession } from "@/lib/session";

interface Tier {
  name: string;
  /** access rank — mirrors the API PLAN_RANK: Starter 0, Pro 1, Lifetime 2. */
  rank: number;
  monthly: { price: string; cadence: string };
  yearly: { price: string; cadence: string };
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
  badge?: string;
  /** checkout href per billing period (subscription mechanics are live). */
  href: { monthly: string; yearly: string };
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    rank: 0,
    monthly: { price: "$0", cadence: "/ month" },
    yearly: { price: "$0", cadence: "/ year" },
    blurb: "Read everything, free — all 22 research articles with live computed charts.",
    features: ["All articles, free to read", "Topic pipeline & literature library", "Early-access updates by email"],
    cta: "Start for Free",
    href: { monthly: "/account", yearly: "/account" },
  },
  {
    name: "Pro",
    rank: 1,
    monthly: { price: "$20", cadence: "/ month" },
    yearly: { price: "$199", cadence: "/ year" },
    blurb: "Every runnable notebook and one-click bundle, for every article — today's 22 and all future releases.",
    features: [
      "All 22 companion notebooks",
      "Run-anywhere ZIP bundles (Win / macOS / Linux)",
      "Every future article & notebook",
      "Cancel anytime — access to period end",
    ],
    cta: "Upgrade to Pro",
    featured: true,
    badge: "Popular",
    href: { monthly: "/checkout?plan=pro-monthly", yearly: "/checkout?plan=pro-annual" },
  },
  {
    name: "Lifetime",
    rank: 2,
    monthly: { price: "$950", cadence: "one-time" },
    yearly: { price: "$950", cadence: "one-time" },
    blurb: "A single payment for everything in Pro, forever — every current and future release.",
    features: [
      "Everything in Pro, forever",
      "All future articles, notebooks & bundles",
      "No renewals, ever",
      "Locked-in launch price",
    ],
    cta: "Get Lifetime",
    href: { monthly: "/checkout?plan=lifetime", yearly: "/checkout?plan=lifetime" },
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  const session = useSession();
  const owned = ownedRank(session);
  const showOwnership = session.status === "ready" && !!session.me;

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
            const href = yearly ? t.href.yearly : t.href.monthly;

            // Plan-awareness: once we know the signed-in user's tier, a plan
            // they already have (or that a higher plan includes) is shown as
            // owned instead of a buy button — no downgrades, no duplicate buys.
            const ctaState: "action" | "current" | "included" =
              showOwnership && t.rank < owned ? "included"
              : showOwnership && t.rank === owned ? "current"
              : "action";
            const ctaLabel =
              ctaState === "current" ? "Current plan"
              : ctaState === "included" ? "Included in your plan"
              : t.cta;

            return (
              <div
                key={t.name}
                data-reveal
                style={{ "--reveal-delay": `${i * 90}ms` } as CSSProperties}
                className="flex"
              >
              <div
                className={`relative flex flex-1 flex-col rounded-lg border bg-navy-elevated/50 p-7 transition-all duration-300 hover:-translate-y-0.5 ${
                  ctaState === "current"
                    ? "border-aqua/50"
                    : t.featured
                      ? "border-aqua/25 hover:border-aqua/40"
                      : "border-pearl/10 hover:border-pearl/25"
                }`}
              >
                {/* name + badge */}
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-2xl text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>{t.name}</h4>
                  {ctaState === "current" ? (
                    <span className="inline-flex items-center rounded-full border border-aqua/50 px-2.5 py-1 t-mono text-[0.55rem] uppercase tracking-[0.16em] text-aqua">
                      Your plan
                    </span>
                  ) : t.badge ? (
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

                {/* cta — every tier gets a real button; featured is solid,
                    the rest outlined, owned tiers are a muted non-link. */}
                <div className="mt-1 flex h-12 items-center">
                  {ctaState === "action" ? (
                    <a
                      href={href}
                      className={
                        t.featured
                          ? "inline-flex w-full items-center justify-center rounded-full bg-pearl px-7 py-3 text-sm font-semibold text-navy transition-colors duration-300 hover:bg-aqua"
                          : "inline-flex w-full items-center justify-center rounded-full border border-pearl/30 px-7 py-3 text-sm font-semibold text-pearl transition-colors duration-300 hover:border-aqua hover:text-aqua"
                      }
                    >
                      {ctaLabel}
                    </a>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-pearl/15 px-7 py-3 text-sm font-semibold text-steel"
                    >
                      {ctaState === "current" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-aqua" aria-hidden="true">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                      {ctaLabel}
                    </span>
                  )}
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
          Pre-launch test mode — checkout runs against the payment simulator and no card is charged until launch.
        </p>
      </div>
    </section>
  );
}
