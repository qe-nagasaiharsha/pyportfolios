import type { Metadata } from "next";
import Link from "next/link";
import { BOOK_GROUPS, PAPERS, PAPER_RECS, BOOK_COUNT, PAPER_REC_COUNT } from "@/lib/literature";
import { LiteratureTabs } from "@/components/landing/LiteratureTabs";
import { ArticleNav } from "@/components/article/ArticleNav";
import { Lightbox } from "@/components/landing/Lightbox";

export const metadata: Metadata = {
  title: "Literature — pyportfolios",
  description:
    "The canon of quantitative finance — the essential books and the landmark papers that built the field, from Markowitz (1952) to Hierarchical Risk Parity.",
};

export default function LiteraturePage() {
  return (
    <div className="min-h-dvh bg-navy text-pearl">
      <ArticleNav />

      <main>
        {/* hero */}
        <section className="relative overflow-hidden border-b border-pearl/10">
          <div className="grid-paper absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 lg:px-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-pearl/25" aria-hidden="true" />
              <p className="t-eyebrow text-pearl">Literature</p>
            </div>
            <h1 className="t-display mt-8 max-w-3xl text-pearl">
              Books &amp; Landmark Papers
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-mist">
              Key quant finance books and academic papers that shaped the discipline — from
              Markowitz&apos;s (1952) to current research.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 t-mono text-xs uppercase tracking-[0.18em] text-steel">
              <span>{BOOK_COUNT} books</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span>{PAPER_REC_COUNT} landmark papers</span>
            </div>
          </div>
        </section>

        {/* books + papers, as tabs (Papers empty for now) */}
        <section id="library" className="scroll-mt-20 py-12 md:py-16">
          <LiteratureTabs groups={BOOK_GROUPS} papers={PAPER_RECS} landmarkPapers={PAPERS} />
        </section>
      </main>

      <footer className="bg-navy-sunken">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-6 py-12 t-mono text-[0.66rem] uppercase tracking-[0.16em] text-steel sm:flex-row lg:px-8">
          <Link href="/" className="transition-colors hover:text-aqua">← pyportfolios.com</Link>
          <span>Where finance theory, coding &amp; markets converge · <span className="text-aqua">pyportfolios.com</span></span>
        </div>
      </footer>

      {/* click-to-enlarge overlay for the book covers */}
      <Lightbox />
    </div>
  );
}
