/* "How it works" — the learning loop in three beats (reference §B: Idea →
   Code → Test). Gives a first-time visitor a mental model before the catalogue. */

import type { CSSProperties } from "react";
import { Aurora } from "@/components/brand/Aurora";

const STEPS = [
  {
    no: "01",
    title: "Frame the problem",
    body: "Every lesson starts from a real question — price an option, build a portfolio, measure tail risk — never a toy example.",
  },
  {
    no: "02",
    title: "Code & implement",
    body: "Translate the model into clean, idiomatic Python across the modern quant stack — NumPy, pandas, SciPy and friends.",
  },
  {
    no: "03",
    title: "Test & visualise",
    body: "Run it on real market data, stress it out-of-sample, and read the result in one honest chart.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden border-b border-pearl/10">
      <Aurora />
      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-28">
        <div data-reveal className="mb-12 flex items-center gap-4 border-b border-pearl/10 pb-4">
          <span className="h-px w-8 bg-aqua/50" aria-hidden="true" />
          <h2 className="t-mono text-sm uppercase tracking-[0.24em] text-mist">How it works</h2>
        </div>

        <ol className="grid gap-px overflow-hidden rounded-sm border border-pearl/10 bg-pearl/10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.no}
              data-reveal
              style={{ "--reveal-delay": `${i * 110}ms` } as CSSProperties}
              className="group relative bg-navy px-7 py-9"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-4xl text-pearl/20" style={{ fontWeight: 500 }}>{s.no}</span>
                <span className="t-mono text-[0.6rem] uppercase tracking-[0.2em] text-steel" aria-hidden="true">
                  {i < STEPS.length - 1 ? "Step" : "Result"}
                </span>
              </div>
              <h3 className="t-h2 mt-5 text-pearl">{s.title}</h3>
              <span className="mt-4 block h-px w-10 bg-aqua transition-all duration-500 group-hover:w-16" />
              <p className="mt-4 leading-relaxed text-mist">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
