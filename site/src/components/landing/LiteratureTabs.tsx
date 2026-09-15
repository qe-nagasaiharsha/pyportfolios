"use client";

/* Literature recommendations — two top-level tabs: Books and Papers.
   Books is the cover shelf; Papers is the curated list with its own category
   filter. The 21-paper landmark timeline that used to sit under the books is
   gone — every one of those papers is in the Papers tab already.
   Client component for the toggle; ships static. */

import { useState } from "react";
import type { BookGroup, Paper } from "@/lib/literature";
import { BookShelf } from "@/components/landing/BookShelf";
import { PaperShelf } from "@/components/landing/PaperShelf";

type Tab = "books" | "papers";

export function LiteratureTabs({ groups, papers }: { groups: BookGroup[]; papers: Paper[] }) {
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
        /* books — the cover shelf */
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20 lg:px-8">
          <BookShelf groups={groups} />
        </div>
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
