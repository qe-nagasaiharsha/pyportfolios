/* Credibility band — concrete numbers + the one-line differentiator. Counts up
   on scroll (reusing the motion primitive). Proof, not claims. */

import type { CSSProperties } from "react";
import { CountUp } from "@/components/motion/CountUp";

const STATS: { value: number; suffix?: string; label: string }[] = [
  { value: 8, label: "Case studies" },
  { value: 8, label: "Runnable notebooks" },
  { value: 4, label: "Categories" },
  { value: 28, label: "Global exchanges" },
];

export function StatsBand() {
  return (
    <section className="border-y border-pearl/10 bg-navy-elevated/40">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_minmax(0,1fr)] lg:items-center">
          <div data-reveal>
            <h2 className="t-h1 max-w-md text-pearl">Built like research, not a course-mill.</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-mist">
              Academic rigor, reproducible code, and real market data — the difference between
              learning quantitative finance and watching someone else do it.
            </p>
          </div>

          <dl
            data-reveal
            style={{ "--reveal-delay": "120ms" } as CSSProperties}
            className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-pearl/10 bg-pearl/10"
          >
            {STATS.map((s) => (
              <div key={s.label} className="bg-navy px-6 py-7">
                <dd className="tnum font-serif text-4xl text-pearl md:text-5xl" style={{ fontWeight: 500 }}>
                  <CountUp value={s.value} suffix={s.suffix} />
                </dd>
                <dt className="mt-2 t-mono text-[0.64rem] uppercase tracking-[0.18em] text-steel">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
