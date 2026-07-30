"use client";

/* Literature recommendations — two top-level tabs: Books and Papers.
   Books holds the current content (the cover shelf + the existing landmark-paper
   list, kept exactly where it was). Papers is an empty placeholder for now —
   content to be added later. Client component for the toggle; ships static. */

import { useState } from "react";
import type { BookGroup, Paper } from "@/lib/literature";
import { BookShelf } from "@/components/landing/BookShelf";
import { PaperShelf } from "@/components/landing/PaperShelf";
import { TransitionLink } from "@/components/motion/TransitionLink";

type Tab = "books" | "papers";

export function LiteratureTabs({
  groups,
  papers,
  landmarkPapers,
}: {
  groups: BookGroup[];
  papers: Paper[];
  landmarkPapers: Paper[];
}) {
  const [tab, setTab] = useState<Tab>("books");
  const TABS: { id: Tab; label: string }[] = [
    { id: "books", label: "Books" },
    { id: "papers", label: "Papers" },
  ];

  return (
    <div>
      {/* top-level tab bar */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex gap-2 border-b border-pearl/10" role="tablist" aria-label="Literature">
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                className={`relative -mb-px px-5 py-4 t-mono text-sm uppercase tracking-[0.2em] transition-colors duration-200 ${
                  on ? "text-aqua" : "text-steel hover:text-pearl"
                }`}
              >
                {t.label}
                {on ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-aqua" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "books" ? (
        <>
          {/* books — the cover shelf */}
          <div className="mx-auto max-w-7xl px-6 py-16 md:py-20 lg:px-8">
            <BookShelf groups={groups} />
          </div>

          {/* landmark papers — restored at the end of the books section */}
          <div className="border-t border-pearl/10 bg-navy-elevated/30">
            <div className="mx-auto max-w-4xl px-6 py-20 md:py-28 lg:px-8">
              <div className="mb-12 flex items-center gap-4 border-b border-pearl/10 pb-4">
                <span className="h-px w-8 bg-aqua/50" aria-hidden="true" />
                <h2 className="t-mono text-sm uppercase tracking-[0.24em] text-mist">Landmark papers</h2>
              </div>
              <p className="mb-12 max-w-2xl text-lg leading-relaxed text-mist">
                The papers that shaped the field, in order. The ones with a case study on this site are
                marked — read the idea, then run the code.
              </p>
              <ol className="border-t border-pearl/10">
                {landmarkPapers.map((p) => (
                  <li
                    key={`${p.year}-${p.title}`}
                    className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-5 border-b border-pearl/10 py-7 md:grid-cols-[5rem_minmax(0,1fr)]"
                  >
                    <div className="tnum t-mono text-sm text-aqua/80">{p.year}</div>
                    <div>
                      <h4 className="font-serif text-lg leading-snug text-pearl md:text-xl">{p.title}</h4>
                      <p className="mt-2 text-sm text-mist">
                        {p.authors} — <span className="italic">{p.journal}</span>
                      </p>
                      <p className="mt-2.5 leading-relaxed text-mist/90">{p.note}</p>
                      {p.article ? (
                        <TransitionLink
                          href={`/research/${p.article}`}
                          className="mt-3 inline-flex items-center gap-1.5 t-mono text-[0.7rem] uppercase tracking-[0.14em] text-aqua transition-transform duration-300 hover:translate-x-0.5"
                        >
                          Read our case study
                          <span aria-hidden="true">↗</span>
                        </TransitionLink>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </>
      ) : (
        /* papers — curated recommendations, grouped by category, with the
           bar/logo/dropdown structure. Empty categories show as the template. */
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20 lg:px-8">
          <PaperShelf papers={papers} />
        </div>
      )}
    </div>
  );
}
