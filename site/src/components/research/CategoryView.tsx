/* ============================================================================
   A dedicated page per research category.

   The four nav headings used to be anchors into one long /research page
   (/research#risk-management). With 22 articles that page became a scroll,
   and a top-level nav item that drops you mid-page reads like a broken link.
   Each category now has its own page; /research remains the full index.
   ========================================================================== */

import Link from "next/link";
import { ArticleNav } from "@/components/article/ArticleNav";
import { ArticleCard } from "@/components/article/ArticleCard";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { CATEGORIES, CATEGORY_ORDER, articlesByCategory, type CategorySlug } from "@/lib/articles";

export function CategoryView({ category }: { category: CategorySlug }) {
  const cat = CATEGORIES[category];
  const articles = articlesByCategory(category);
  const others = CATEGORY_ORDER.filter((c) => c !== category);

  return (
    <div className="min-h-screen bg-navy text-pearl">
      <ScrollReveal />
      <ArticleNav />

      <main>
        {/* hero */}
        <section className="relative overflow-hidden border-b border-pearl/10">
          <div className="grid-paper absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28 lg:px-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-pearl/25" aria-hidden="true" />
              <TransitionLink href="/research" className="t-eyebrow text-pearl transition-colors hover:text-aqua">
                Research
              </TransitionLink>
              <span className="t-eyebrow text-aqua">{cat.numeral}</span>
            </div>
            <h1 className="t-display mt-8 max-w-3xl text-pearl">
              {cat.name}<span className="text-aqua">.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">{cat.blurb}</p>
            <p className="mt-8 t-mono text-xs uppercase tracking-[0.18em] text-steel">
              {articles.length} article{articles.length === 1 ? "" : "s"} · every one with a runnable notebook
            </p>
          </div>
        </section>

        {/* articles */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20 lg:px-8">
            {articles.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
                {articles.map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            ) : (
              <p className="t-mono text-sm text-steel">Articles for this category are on the way.</p>
            )}
          </div>
        </section>

        {/* the other three categories */}
        <section className="border-t border-pearl/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p className="t-mono text-[0.66rem] uppercase tracking-[0.2em] text-steel">Continue in</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {others.map((c) => (
                <TransitionLink
                  key={c}
                  href={`/research/${c}`}
                  className="group rounded-lg border border-pearl/10 bg-navy-elevated/50 px-5 py-4 transition-colors hover:border-aqua/40"
                >
                  <span className="t-mono text-[0.6rem] uppercase tracking-[0.16em] text-aqua/80">
                    {CATEGORIES[c].numeral}
                  </span>
                  <p className="mt-1.5 font-serif text-lg leading-snug text-pearl group-hover:text-aqua">
                    {CATEGORIES[c].name}
                  </p>
                  <p className="mt-1 t-mono text-[0.62rem] text-steel">
                    {articlesByCategory(c).length} articles
                  </p>
                </TransitionLink>
              ))}
            </div>
          </div>
        </section>
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
