"use client";

/* Pricing — three tiers, Basic / Plus / Pro (Harsha, 12 Sep, to a supplied
   design).

   ⚠ THE NAMES AND THE BILLING CODES DO NOT MATCH. READ THIS BEFORE EDITING.

   The tiers were Basic / Pro / Premium. This design renames them Basic / Plus /
   Pro while the prices stay $29 and $79, so every tier shifted down a name:

       shown as      price   bills against        rank
       Basic         free    starter              0
       Plus          $29     pro-monthly/annual   1     <- was called "Pro"
       Pro           $79     premium-*            2     <- was called "Premium"

   So the button reading "Upgrade to Pro" charges the PREMIUM plan codes, and
   that is correct. platform/app/models.py PLAN_SEED still calls them pro and
   premium, as do planRank() in lib/session.ts and every subscription already
   sold. Renaming the codes to follow the labels would orphan live subscriptions
   through the plans.code foreign key, so the labels move and the codes stay.

   The practical cost: in Stripe and in the API logs, a customer on the tier the
   site calls "Pro" appears as "Premium". Anyone reconciling revenue needs the
   table above. If that becomes too confusing to live with, the fix is a
   migration on the API side, not a re-point here.

   MONTHLY / ANNUAL (Louis, 22 Aug). Each paid card carries its own switch and
   they are deliberately not linked (Harsha, 7 Sep: "dont link them"). Switching
   moves the price, the period and the checkout code together, so what is shown
   is what is bought. On Annual a card reads "$290 / year" and shows no
   per-month equivalent — two prices on one card is what made the old
   "$29 / mo · $290 /yr" line ambiguous to begin with.

   Every figure mirrors PLAN_SEED (0 / 2900 / 29000 / 7900 / 79000 cents).
   Change one and you must change the other.

   The grid stays plan-aware: once the signed-in user's tier is known, a plan
   they already hold — or that a higher plan includes — shows as owned rather
   than as a buy button. */

import { useState, type CSSProperties } from "react";
import { ownedRank, useSession } from "@/lib/session";

type Cadence = "monthly" | "annual";

interface Price {
  /** headline figure, e.g. "$29" or "Free" */
  amount: string;
  /** the period beside the figure — Basic has none */
  period?: string;
  /** the small line under the price */
  foot: string;
  /** checkout target — see the code/label table above before changing */
  href: string;
}

interface Feature {
  /** the bold run at the start of the line, if any */
  lead?: string;
  text: string;
  /** greyed back — either a limitation or something not shipped yet */
  muted?: boolean;
  /** "dash" marks a limitation rather than an included feature */
  marker?: "check" | "dash";
  /** e.g. "Soon" */
  badge?: string;
}

interface Tier {
  name: string;
  /** access rank — mirrors the API PLAN_RANK: Basic 0, Plus 1, Pro 2 */
  rank: number;
  sub: string;
  /** heading over the feature list */
  featuresLabel: string;
  features: Feature[];
  cta: string;
  /** the aqua "Recommended" flag and the aqua tier name */
  featured?: boolean;
  /** button treatment, which differs on all three cards in this design */
  ctaStyle: "outline" | "solid-pearl" | "solid-aqua";
  /** Basic has no cadence — one price, shown whichever way a toggle sits */
  monthly: Price;
  annual?: Price;
}

const TIERS: Tier[] = [
  {
    name: "Basic",
    rank: 0,
    sub: "Sign-up required",
    featuresLabel: "Features",
    features: [
      { lead: "4 sample tutorials", text: "— one per category, full text and code" },
      { lead: "Notebook and PDF download", text: "for those 4" },
      { text: "New release alerts" },
      { text: "Community access" },
      { text: "Remaining library shown as preview only", muted: true, marker: "dash" },
    ],
    cta: "Start for Free",
    ctaStyle: "outline",
    monthly: { amount: "Free", foot: "no commitment", href: "/account" },
  },
  {
    name: "Plus",
    rank: 1,
    sub: "Full library",
    featuresLabel: "Everything in Basic, plus",
    features: [
      { lead: "All 16 notebooks", text: "— full text, code and explanations" },
      { lead: "12 notebook downloads", text: "(.ipynb)" },
      { text: "New releases included" },
      { text: "Community access" },
    ],
    cta: "Upgrade to Plus",
    featured: true,
    ctaStyle: "solid-pearl",
    // pro-* is the $29 plan; it is this card despite the code saying "pro"
    monthly: { amount: "$29", period: "/ month", foot: "cancel anytime", href: "/checkout?plan=pro-monthly" },
    annual: { amount: "$290", period: "/ year", foot: "cancel anytime", href: "/checkout?plan=pro-annual" },
  },
  {
    name: "Pro",
    rank: 2,
    sub: "Research environment",
    featuresLabel: "Everything in Plus, plus",
    features: [
      { lead: "PDF research notes", text: "— all 16, print and share ready" },
      { lead: "Pro-only notebooks", text: "— the advanced and scholarly set" },
      { lead: "Instrument universe", text: "— the full curated ticker set" },
      { lead: "Priority access", text: "— new releases one week early" },
      { text: "Cloud execution", muted: true, badge: "Soon" },
      { text: "Quant finance course", muted: true, badge: "Soon" },
    ],
    cta: "Upgrade to Pro",
    ctaStyle: "solid-aqua",
    // premium-* is the $79 plan — the card now called "Pro". See the header.
    monthly: { amount: "$79", period: "/ month", foot: "cancel anytime", href: "/checkout?plan=premium-monthly" },
    annual: { amount: "$790", period: "/ year", foot: "cancel anytime", href: "/checkout?plan=premium-annual" },
  },
];

/* Segmented monthly/annual switch. Two real <button>s inside a role="group"
   rather than a checkbox styled as a slider: the labels stay readable, and
   "which one am I on" is carried by aria-pressed rather than by colour alone. */
function CadenceToggle({
  value,
  onChange,
  tier,
}: {
  value: Cadence;
  onChange: (c: Cadence) => void;
  /* each card owns its own switch, so the group needs a name of its own —
     two controls both labelled "Billing period" is ambiguous read aloud */
  tier: string;
}) {
  const opts: { id: Cadence; label: string }[] = [
    { id: "monthly", label: "Monthly" },
    { id: "annual", label: "Annual" },
  ];

  return (
    <div
      role="group"
      aria-label={`${tier} billing period`}
      className="inline-flex shrink-0 rounded-full border border-pearl/15 bg-navy/40 p-0.5"
    >
      {opts.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.id)}
            className={`rounded-full px-2.5 py-1 t-mono text-[0.55rem] uppercase tracking-[0.12em] transition-colors duration-200 ${
              on ? "bg-pearl text-navy" : "text-mist hover:text-pearl"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* The marker is a real glyph, not an icon: U+2713 CHECK MARK for an included
   feature, U+2013 EN DASH for one that is not. The list is already t-mono, so
   both are drawn by Courier Prime at the row's own size and sit on its
   baseline — an SVG had to be nudged to fake that.

   A dimmed row tints its marker to match its text rather than staying aqua,
   so the whole line reads as one muted unit. */
function Marker({ dash, dim }: { dash?: boolean; dim?: boolean }) {
  return (
    <span className={`mt-px shrink-0 ${dim ? "" : "text-aqua"}`} aria-hidden="true">
      {dash ? "–" : "✓"}
    </span>
  );
}

const CTA_CLASS: Record<Tier["ctaStyle"], string> = {
  outline:
    "border border-pearl/30 text-pearl hover:border-aqua hover:text-aqua",
  "solid-pearl": "bg-pearl text-navy hover:bg-aqua",
  "solid-aqua": "bg-aqua text-navy hover:bg-pearl",
};

/* One card. It holds its own monthly/annual state, so Plus and Pro switch
   independently — hence a component rather than one cadence lifted into
   Pricing. */
function TierCard({
  t,
  ctaState,
  ctaLabel,
}: {
  t: Tier;
  ctaState: "action" | "current" | "included";
  ctaLabel: string;
}) {
  const [cadence, setCadence] = useState<Cadence>("monthly");
  /* Basic has no annual variant — it falls back to its single price rather
     than disappearing when a toggle moves. */
  const price = (cadence === "annual" ? t.annual : t.monthly) ?? t.monthly;

  return (
    <div
      className={`relative flex flex-1 flex-col rounded-lg border bg-navy-elevated/50 p-7 transition-all duration-300 hover:-translate-y-0.5 ${
        t.featured
          ? "border-aqua/70"
          : ctaState === "current"
            ? "border-aqua/50"
            : "border-aqua/25 hover:border-aqua/50"
      }`}
    >
      {/* Straddles the top border, so it reads as a flag on the card rather
          than as the first line of its content. */}
      {t.featured ? (
        <span className="absolute -top-2.5 left-6 inline-flex items-center rounded-full bg-aqua px-2.5 py-1 t-mono text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-navy">
          Recommended
        </span>
      ) : null}

      {/* name, then the billing switch in the top-right corner. "Your plan"
          sits beside the name, since a signed-in owner needs to see it. */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h4
            className={`text-2xl ${t.featured ? "text-aqua" : "text-pearl"}`}
            style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}
          >
            {t.name}
          </h4>
          {ctaState === "current" ? (
            <span className="inline-flex items-center rounded-full border border-aqua/50 px-2.5 py-1 t-mono text-[0.55rem] uppercase tracking-[0.16em] text-aqua">
              Your plan
            </span>
          ) : null}
        </div>
        {t.annual ? (
          <CadenceToggle value={cadence} onChange={setCadence} tier={t.name} />
        ) : null}
      </div>

      <p className="mt-1.5 t-mono text-[0.72rem] tracking-[0.04em] text-steel">{t.sub}</p>

      {/* price, then its footnote on a line of its own */}
      <div className="mt-7 flex items-baseline gap-2">
        <span
          className={`text-5xl ${t.rank === 0 ? "text-aqua" : "text-pearl"}`}
          style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}
        >
          {price.amount}
        </span>
        {price.period ? (
          <span className="t-mono text-xs tracking-[0.12em] text-steel">{price.period}</span>
        ) : null}
      </div>
      <p className="mt-2 t-mono text-[0.62rem] tracking-[0.1em] text-steel">{price.foot}</p>

      {/* cta — owned tiers become a muted non-link */}
      <div className="mt-6 flex h-12 items-center">
        {ctaState === "action" ? (
          <a
            href={price.href}
            className={`inline-flex w-full items-center justify-center rounded-full px-7 py-3 text-sm font-semibold transition-colors duration-300 ${CTA_CLASS[t.ctaStyle]}`}
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
        <span className="t-mono whitespace-nowrap text-[0.6rem] uppercase tracking-[0.22em] text-steel">
          {t.featuresLabel}
        </span>
        <span className="h-px flex-1 bg-pearl/10" />
      </div>
      <ul className="mt-5 space-y-3">
        {t.features.map((f) => (
          <li
            key={f.lead ? `${f.lead} ${f.text}` : f.text}
            className={`flex items-start gap-2.5 t-mono text-[0.76rem] leading-relaxed ${
              f.muted ? "text-steel/70" : "text-mist"
            }`}
          >
            <Marker dash={f.marker === "dash"} dim={f.muted} />
            <span>
              {f.lead ? <strong className="font-semibold text-pearl">{f.lead}</strong> : null}
              {f.lead ? " " : null}
              {f.text}
              {f.badge ? (
                <span className="ml-2 inline-flex items-center rounded-sm border border-steel/40 px-1.5 py-px t-mono text-[0.5rem] uppercase tracking-[0.14em] text-steel">
                  {f.badge}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Pricing() {
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

        {/* headline + what each tier is, in one line each */}
        <h3
          data-reveal
          className="t-h1 max-w-3xl text-pearl"
          style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)" }}
        >
          Choose your <span className="text-aqua">access.</span>
        </h3>
        <div data-reveal className="mt-5 max-w-2xl space-y-1 t-mono text-[0.78rem] leading-relaxed text-mist">
          <p>
            <strong className="font-semibold text-pearl">Basic</strong> features 4 tutorials for free — one from each category.
          </p>
          <p>
            <strong className="font-semibold text-pearl">Plus</strong> opens the full library of notebooks.
          </p>
          <p>
            <strong className="font-semibold text-pearl">Pro</strong> adds advanced contents, formatted PDFs, the instrument universe and early access.
          </p>
        </div>

        {/* cards — each paid one carries its own billing switch, top right */}
        <div className="mt-12 grid items-start gap-6 md:grid-cols-3">
          {TIERS.map((t, i) => {
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
                <TierCard t={t} ctaState={ctaState} ctaLabel={ctaLabel} />
              </div>
            );
          })}
        </div>

        {/* closing row */}
        <div
          data-reveal
          className="mt-12 flex flex-col justify-between gap-3 border-t border-pearl/10 pt-8 t-mono text-[0.66rem] tracking-[0.08em] text-steel sm:flex-row"
        >
          <span>All tiers include the 4 free sample tutorials</span>
          <span>Annual billing saves two months</span>
        </div>
      </div>
    </section>
  );
}
