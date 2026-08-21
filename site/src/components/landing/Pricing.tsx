"use client";

/* Pricing — three subscription tiers (Basic / Pro / Premium), in the
   Bhavya-branch treatment: aqua headings and prices, a sub-label per card.

   MONTHLY / ANNUAL TOGGLE (Louis, 22 Aug). The annual plans were already
   seeded, priced and wired to Stripe on the API side — pro-annual and
   premium-annual — but the cards only advertised "$290 /yr" in grey text while
   both buttons were pinned to the monthly codes. A reader could see the annual
   price and had no way to buy it. The toggle switches the price, the cadence
   line and the checkout code together, so what is shown is what is bought.

   Every figure here mirrors platform/app/models.py PLAN_SEED (2900 / 29000 /
   7900 / 79000 cents). Change one and you must change the other.

   The grid is plan-aware: once we know the signed-in user's tier, a plan they
   already have (or a higher plan includes) shows as owned instead of a buy
   button. */

import { useState, type CSSProperties } from "react";
import { ownedRank, useSession } from "@/lib/session";

type Cadence = "monthly" | "annual";

interface Price {
  /** headline figure, e.g. "$29" */
  amount: string;
  /** the small print beside it */
  note: string;
  /** checkout target — the plan code the API bills against. */
  href: string;
}

interface Tier {
  name: string;
  /** access rank — mirrors the API PLAN_RANK: Basic 0, Pro 1, Premium 2. */
  rank: number;
  sub: string;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
  badge?: string;
  /** Basic has no cadence — one price, shown whichever way the toggle sits. */
  monthly: Price;
  annual?: Price;
}

const TIERS: Tier[] = [
  {
    name: "Basic",
    rank: 0,
    sub: "Sign-up required",
    blurb: "",
    features: ["Sample notebooks", "Weekly newsletter", "Community access"],
    cta: "Start for Free",
    monthly: { amount: "Free", note: "no commitment", href: "/account" },
  },
  {
    name: "Pro",
    rank: 1,
    sub: "Full library · cloud",
    blurb: "",
    features: [
      "Run all case studies in the cloud",
      "Interactive notebooks, code, explanations",
    ],
    cta: "Upgrade to Pro",
    featured: true,
    badge: "Popular",
    monthly: { amount: "$29", note: "/ month", href: "/checkout?plan=pro-monthly" },
    annual: { amount: "$290", note: "/ year · $24.17 a month", href: "/checkout?plan=pro-annual" },
  },
  {
    name: "Premium",
    rank: 2,
    sub: "Research environment",
    blurb: "",
    features: [
      "Datasets & downloads",
      "Deep-dive reports",
      "Priority access",
    ],
    /* was "Contact Sales", which promised a conversation the button never
       started — it has always gone straight to checkout, and Premium has a
       listed price rather than being a quote-only tier (Louis, 22 Aug) */
    cta: "Upgrade to Premium",
    monthly: { amount: "$79", note: "/ month", href: "/checkout?plan=premium-monthly" },
    annual: { amount: "$790", note: "/ year · $65.83 a month", href: "/checkout?plan=premium-annual" },
  },
];

/* Segmented monthly/annual switch. Two real <button>s inside a role="group"
   rather than a checkbox styled as a slider: the labels stay readable, and
   "which one am I on" is carried by aria-pressed instead of by colour alone. */
function CadenceToggle({
  value,
  onChange,
}: {
  value: Cadence;
  onChange: (c: Cadence) => void;
}) {
  const opts: { id: Cadence; label: string }[] = [
    { id: "monthly", label: "Monthly" },
    { id: "annual", label: "Annual" },
  ];

  return (
    <div className="mt-10 flex flex-wrap items-center gap-4">
      <div
        role="group"
        aria-label="Billing period"
        className="inline-flex rounded-full border border-pearl/15 bg-navy-elevated/50 p-1"
      >
        {opts.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.id)}
              className={`rounded-full px-5 py-2 t-mono text-[0.7rem] uppercase tracking-[0.16em] transition-colors duration-200 ${
                on ? "bg-pearl text-navy" : "text-mist hover:text-pearl"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {/* the reason to click Annual, said once */}
      <span className="t-mono text-[0.7rem] uppercase tracking-[0.14em] text-aqua">
        2 months free
      </span>
    </div>
  );
}

export function Pricing() {
  const session = useSession();
  const owned = ownedRank(session);
  const showOwnership = session.status === "ready" && !!session.me;
  const [cadence, setCadence] = useState<Cadence>("monthly");

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

        <CadenceToggle value={cadence} onChange={setCadence} />

        {/* cards */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TIERS.map((t, i) => {
            /* Basic has no annual variant — it falls back to its single price
               rather than disappearing when the toggle moves. */
            const price = (cadence === "annual" ? t.annual : t.monthly) ?? t.monthly;
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
              {/* All three cards carry the same aqua outline and the same
                  hover lift (Louis, 22 Aug) — Pro used to be the only one, with
                  the others on a grey border. Pro still reads as the featured
                  tier through its aqua heading, its "Popular" badge and its
                  solid button, so nothing is lost by levelling the frames.
                  A plan you already own keeps the brighter border. */}
              <div
                className={`relative flex flex-1 flex-col rounded-lg border bg-navy-elevated/50 p-7 transition-all duration-300 hover:-translate-y-0.5 ${
                  ctaState === "current"
                    ? "border-aqua/50"
                    : "border-aqua/25 hover:border-aqua/50"
                }`}
              >
                {/* name + badge */}
                <div className="flex items-center justify-between gap-3">
                  <h4 className={`text-2xl ${t.featured ? "text-aqua" : "text-pearl"}`} style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>{t.name}</h4>
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

                {/* sub-label */}
                <p className="mt-1.5 t-mono text-[0.72rem] tracking-[0.04em] text-steel">{t.sub}</p>

                {/* price */}
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-5xl text-aqua" style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>{price.amount}</span>
                  <span className="t-mono text-xs tracking-[0.12em] text-steel">{price.note}</span>
                </div>

                {/* blurb */}
                <p className="mt-4 min-h-[4.5rem] leading-relaxed text-mist">{t.blurb}</p>

                {/* cta — every tier gets a real button; featured is solid, the
                    rest outlined, owned tiers are a muted non-link. */}
                <div className="mt-1 flex h-12 items-center">
                  {ctaState === "action" ? (
                    <a
                      href={price.href}
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
      </div>
    </section>
  );
}
