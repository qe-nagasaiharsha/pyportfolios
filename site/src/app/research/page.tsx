import type { Metadata } from "next";
import Link from "next/link";
import {
  ARTICLES,
  CATEGORY_ORDER,
  CATEGORIES,
  articlesByCategory,
} from "@/lib/articles";
import type { CSSProperties } from "react";
import { ArticleNav } from "@/components/article/ArticleNav";
import { ArticleCard } from "@/components/article/ArticleCard";
import { CountUp } from "@/components/motion/CountUp";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export const metadata: Metadata = {
  title: "Research — pyportfolios",
  description:
    "Investment-banking-style case studies across finance fundamentals, portfolio optimization, risk management and algorithmic trading — each with a runnable Python notebook.",
};

export default function ResearchIndex() {
  return (
    <div className="min-h-screen bg-navy text-pearl">
      <ScrollReveal />
      <ArticleNav />

      <main>
        {/* hero */}
        <section className="relative overflow-hidden border-b border-pearl/10">
          <div className="grid-paper absolute inset-0" aria-hidden="true" />
          <div data-reveal className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 lg:px-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-pearl/25" aria-hidden="true" />
              <p className="t-eyebrow text-mist">Research · Case studies &amp; notebooks</p>
            </div>
            <h1 className="t-display mt-8 max-w-3xl text-pearl">
              Models, implemented<span className="text-aqua">.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-mist">
              Academic-level finance, rebuilt as clean, reproducible Python. Every case study ships
              with a runnable notebook — read the argument, then run the code on real data.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 t-mono text-xs uppercase tracking-[0.18em] text-steel">
              <span><CountUp value={ARTICLES.length} /> articles</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span><CountUp value={CATEGORY_ORDER.length} /> categories</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span className="text-aqua"><CountUp value={ARTICLES.length} /> notebooks</span>
            </div>
          </div>
        </section>

        {/* one section per category */}
        {CATEGORY_ORDER.map((slug) => {
          const cat = CATEGORIES[slug];
          const items = articlesByCategory(slug);
          return (
            <section
              key={slug}
              id={slug}
              className="scroll-mt-20 border-b border-pearl/10 [&:nth-child(odd)]:bg-navy-elevated/30"
            >
              <div className="mx-auto max-w-6xl px-6 py-20 md:py-24 lg:px-8">
                <div data-reveal className="flex flex-col justify-between gap-4 border-b border-pearl/10 pb-6 md:flex-row md:items-end">
                  <div className="flex items-baseline gap-4">
                    <span className="font-serif text-3xl text-pearl/20">{cat.numeral}</span>
                    <div>
                      <h2 className="t-h1 text-pearl">{cat.name}</h2>
                      <p className="mt-2 max-w-xl leading-relaxed text-mist">{cat.blurb}</p>
                    </div>
                  </div>
                  <span className="shrink-0 t-mono text-xs uppercase tracking-[0.18em] text-steel">
                    {items.length} articles
                  </span>
                </div>
                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  {items.map((a, i) => (
                    <div key={a.slug} data-reveal style={{ "--reveal-delay": `${i * 80}ms` } as CSSProperties} className="h-full">
                      <ArticleCard article={a} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </main>

      <footer className="bg-navy-sunken">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-6 py-12 t-mono text-[0.66rem] uppercase tracking-[0.16em] text-steel sm:flex-row lg:px-8">
          <Link href="/" className="transition-colors hover:text-aqua">← pyportfolios.com</Link>
          <span>Where finance theory, coding &amp; markets converge · <span className="text-aqua">pyportfolios.com</span></span>
        </div>
      </footer>
    </div>
  );
}
