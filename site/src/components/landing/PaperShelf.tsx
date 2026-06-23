"use client";

/* PaperShelf — the landmark papers as horizontal bars, grouped under the same
   categories as the books. Each bar carries an optional journal/publisher logo
   slot and an optional dropdown (chevron) that reveals the "why it matters"
   bullets and a few facts on the author. The dropdown only appears once a paper
   has `why` or `authorNote` content. Pure-CSS accordion; ships static. */

import { useState } from "react";
import type { Paper } from "@/lib/literature";
import { TransitionLink } from "@/components/motion/TransitionLink";

/* canonical category order — mirrors BOOK_GROUPS (used to group papers) */
const CATEGORY_ORDER = [
  "Foundations",
  "Fixed Income & Interest-Rate Modeling",
  "Derivatives, Options & Volatility",
  "Portfolio Optimization & Asset Allocation",
  "Risk Management",
  "Market Microstructure & Execution",
  "Algorithmic Trading & Machine Learning",
];

/* display labels for the paper section headers (full doc titles where longer) */
const CATEGORY_LABELS: Record<string, string> = {
  Foundations: "Foundations: Stochastic Calculus, Statistics, Probability & Econometrics",
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaperBar({ paper }: { paper: Paper }) {
  const [open, setOpen] = useState(false);
  const hasDetail = (paper.why && paper.why.length > 0) || Boolean(paper.authorNote);

  return (
    <li className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-5 border-b border-pearl/10 py-6 md:grid-cols-[5rem_minmax(0,1fr)]">
      <div className="tnum t-mono text-sm text-aqua/80">{paper.year}</div>
      <div>
        <div className="flex items-start gap-4">
          {/* logo slot — shows the real logo when supplied, else a placeholder
              box so the planned position is visible */}
          {paper.logo ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-pearl/10 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/papers/${paper.logo}`} alt={`${paper.journal} logo`} className="max-h-9 max-w-[86%] object-contain" loading="lazy" />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-sm border border-dashed border-aqua/40 bg-navy-sunken/30 text-aqua/60" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span className="t-mono text-[0.42rem] uppercase tracking-[0.12em]">logo</span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h4 className="font-serif text-lg leading-snug text-pearl md:text-xl">{paper.title}</h4>
            <p className="mt-2 text-sm text-mist">
              {paper.authors} — <span className="italic">{paper.journal}</span>
              {paper.ref ? <span className="text-steel">, {paper.ref}</span> : null}
            </p>
            {paper.note ? <p className="mt-2.5 leading-relaxed text-mist/90">{paper.note}</p> : null}
            {paper.article ? (
              <TransitionLink
                href={`/research/${paper.article}`}
                className="mt-3 inline-flex items-center gap-1.5 t-mono text-[0.7rem] uppercase tracking-[0.14em] text-aqua transition-transform duration-300 hover:translate-x-0.5"
              >
                Read our case study
                <span aria-hidden="true">↗</span>
              </TransitionLink>
            ) : null}
          </div>

          {/* dropdown toggle — only when there is detail to show */}
          {hasDetail ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Hide details" : "Show details"}
              className="mt-1 shrink-0 text-steel/60 transition-colors duration-200 hover:text-aqua"
            >
              <Chevron open={open} />
            </button>
          ) : null}
        </div>

        {/* why-it-matters + author facts */}
        {hasDetail ? (
          <div className={`grid transition-[grid-template-rows] duration-[400ms] ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              {paper.why && paper.why.length > 0 ? (
                <ul className="space-y-2 pt-4">
                  {paper.why.map((point) => (
                    <li key={point} className="flex gap-2 font-serif text-[0.9rem] leading-relaxed text-mist">
                      <span className="shrink-0 text-aqua/80" aria-hidden="true">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {paper.authorNote ? (
                <p className="mt-3 border-l border-aqua/30 pl-3 text-[0.85rem] leading-relaxed text-steel">{paper.authorNote}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function PaperShelf({ papers }: { papers: Paper[] }) {
  // Show every category as a header (the template), even when it has no papers
  // yet — papers drop into the matching bucket once added.
  const groups = CATEGORY_ORDER.map((cat) => ({ cat, items: papers.filter((p) => p.category === cat) }));
  const uncategorized = papers.filter((p) => !p.category || !CATEGORY_ORDER.includes(p.category));

  return (
    <div className="space-y-16 md:space-y-20">
      {groups.map((g, i) => (
        <section key={g.cat} className="scroll-mt-24">
          <div className="mb-5 flex items-baseline gap-4 border-b border-pearl/10 pb-3">
            <span className="t-mono text-sm tabular-nums text-aqua/80">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="font-serif text-xl leading-tight text-pearl md:text-2xl">{CATEGORY_LABELS[g.cat] ?? g.cat}</h3>
            {g.items.length > 0 ? (
              <span className="ml-auto shrink-0 t-mono text-[0.6rem] uppercase tracking-[0.14em] text-steel">{g.items.length} paper{g.items.length === 1 ? "" : "s"}</span>
            ) : null}
          </div>
          {g.items.length > 0 ? (
            <ol className="border-t border-pearl/10">
              {g.items.map((p) => (
                <PaperBar key={`${p.year}-${p.title}`} paper={p} />
              ))}
            </ol>
          ) : null}
        </section>
      ))}

      {uncategorized.length > 0 ? (
        <section>
          <div className="mb-5 flex items-baseline gap-4 border-b border-pearl/10 pb-3">
            <h3 className="font-serif text-xl leading-tight text-pearl md:text-2xl">Other</h3>
            <span className="ml-auto shrink-0 t-mono text-[0.6rem] uppercase tracking-[0.14em] text-steel">{uncategorized.length} papers</span>
          </div>
          <ol className="border-t border-pearl/10">
            {uncategorized.map((p) => (
              <PaperBar key={`${p.year}-${p.title}`} paper={p} />
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
