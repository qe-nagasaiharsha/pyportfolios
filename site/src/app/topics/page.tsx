import type { Metadata } from "next";
import Link from "next/link";
import { ArticleNav } from "@/components/article/ArticleNav";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { CATEGORIES, CATEGORY_ORDER, type ArticleFormat } from "@/lib/articles";
import { TOPIC_CARDS } from "@/lib/topics";

export const metadata: Metadata = {
  title: "Topic report cards — Batch 1 — pyportfolios",
  description:
    "The 16 topics of Batch 1 — per topic: format, libraries, assets, timeframe, and why a practitioner cares. Live pieces link straight to the article.",
};

/* format → chip tone (kept inside the site's restrained palette) */
const FORMAT_TONE: Record<ArticleFormat, string> = {
  Tutorial: "border-aqua/40 text-aqua",
  "Case Study": "border-amber-400/40 text-amber-300/90",
  "Research Note": "border-emerald-400/40 text-emerald-300/90",
  "Research Article": "border-violet-400/40 text-violet-300/90",
  "Quant Insights": "border-violet-400/40 text-violet-300/90",
};

export default function TopicsPage() {
  const live = TOPIC_CARDS.filter((t) => t.article).length;

  return (
    <div className="min-h-screen bg-navy text-pearl">
      <ArticleNav />

      <main>
        {/* hero */}
        <section className="relative overflow-hidden border-b border-pearl/10">
          <div className="grid-paper absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 lg:px-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-pearl/25" aria-hidden="true" />
              <p className="t-eyebrow text-pearl">Content pipeline · Batch 1</p>
            </div>
            <h1 className="t-display mt-8 max-w-3xl text-pearl">
              Topic report cards<span className="text-aqua">.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-mist">
              Sixteen topics across the four categories, each specified before a line of code is
              written: the exact libraries, the exact assets and timeframe, and the one-line answer
              to <em className="text-pearl">why a practitioner cares</em>. Live pieces link straight
              to the article and its runnable notebook.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 t-mono text-xs uppercase tracking-[0.18em] text-steel">
              <span className="text-aqua">{live} live</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span>{TOPIC_CARDS.length - live} in the writing queue</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span>4 categories × 4 formats</span>
            </div>
          </div>
        </section>

        {/* the sixteen cards, grouped by category */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24 lg:px-8">
            {CATEGORY_ORDER.map((catSlug) => {
              const cat = CATEGORIES[catSlug];
              const cards = TOPIC_CARDS.filter((t) => t.category === catSlug);
              return (
                <div key={catSlug} className="mb-16 last:mb-0">
                  <div className="mb-6 flex items-baseline gap-4 border-b border-pearl/10 pb-3">
                    <span className="t-mono text-sm text-aqua/80">{cat.numeral}</span>
                    <h2 className="font-serif text-xl leading-tight text-pearl md:text-2xl">{cat.name}</h2>
                    <span className="ml-auto shrink-0 t-mono text-[0.6rem] uppercase tracking-[0.14em] text-steel">
                      {cards.filter((c) => c.article).length}/{cards.length} live
                    </span>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {cards.map((t) => {
                      const inner = (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <span className="t-mono text-[0.66rem] tracking-[0.16em] text-steel">
                              {String(t.no).padStart(2, "0")} / 16
                            </span>
                            <span className="flex items-center gap-2">
                              <span className={`rounded-sm border px-2 py-0.5 t-mono text-[0.58rem] uppercase tracking-[0.12em] ${FORMAT_TONE[t.format]}`}>
                                {t.format}
                              </span>
                              {t.article ? (
                                <span className="t-mono text-[0.58rem] uppercase tracking-[0.12em] text-emerald-300/90">● live</span>
                              ) : (
                                <span className="t-mono text-[0.58rem] uppercase tracking-[0.12em] text-steel/70">○ upcoming</span>
                              )}
                            </span>
                          </div>

                          <h3 className="mt-3 font-serif text-lg leading-snug text-pearl md:text-xl">{t.title}</h3>

                          <dl className="mt-4 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-y-1.5 text-[0.85rem] leading-relaxed">
                            <dt className="t-mono text-[0.6rem] uppercase tracking-[0.12em] text-steel pt-0.5">Libraries</dt>
                            <dd className="t-mono text-[0.78rem] text-aqua/90">{t.libraries.join(" · ")}</dd>
                            <dt className="t-mono text-[0.6rem] uppercase tracking-[0.12em] text-steel pt-0.5">Assets</dt>
                            <dd className="text-mist">{t.assets}</dd>
                            <dt className="t-mono text-[0.6rem] uppercase tracking-[0.12em] text-steel pt-0.5">Timeframe</dt>
                            <dd className="text-mist">{t.timeframe}</dd>
                            <dt className="t-mono text-[0.6rem] uppercase tracking-[0.12em] text-steel pt-0.5">Use</dt>
                            <dd className="text-mist/90">{t.use}</dd>
                          </dl>

                          {t.article ? (
                            <span className="mt-4 inline-flex items-center gap-1.5 t-mono text-[0.66rem] uppercase tracking-[0.16em] text-aqua transition-transform duration-300 group-hover:translate-x-0.5">
                              Read the article <span aria-hidden="true">↗</span>
                            </span>
                          ) : (
                            <span className="mt-4 inline-flex items-center gap-1.5 t-mono text-[0.66rem] uppercase tracking-[0.16em] text-steel/60">
                              In the writing queue
                            </span>
                          )}
                        </>
                      );

                      const cardClass =
                        "group flex flex-col rounded-lg border border-pearl/10 bg-navy-elevated/50 p-6 transition-[transform,border-color] duration-300";

                      return t.article ? (
                        <TransitionLink
                          key={t.no}
                          href={`/research/${t.article}`}
                          className={`${cardClass} hover:-translate-y-1 hover:border-aqua/30`}
                        >
                          {inner}
                        </TransitionLink>
                      ) : (
                        <article key={t.no} className={`${cardClass} opacity-80`}>
                          {inner}
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
