/* ============================================================================
   The reusable article template (reference §B). Dark global nav → light Pale
   Sisal reading surface. Sticky scroll-spy TOC rail (desktop), Lora title,
   metadata byline, a notebook badge, the body, then a notebook CTA + prev/next.
   ========================================================================== */

import type { ReactNode } from "react";
import { TransitionLink } from "@/components/motion/TransitionLink";
import {
  type Article,
  CATEGORIES,
  articleNeighbours,
} from "@/lib/articles";
import { ArticleNav } from "@/components/article/ArticleNav";
import { ArticleToc } from "@/components/article/ArticleToc";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { ReadingProgress } from "@/components/motion/ReadingProgress";
import { GatedBadge, GatedCta } from "@/components/article/GatedDownload";

export function ArticleLayout({ article, children }: { article: Article; children: ReactNode }) {
  const category = CATEGORIES[article.category];
  /* Notebook + run-anywhere bundle are gated product: they live in vault/ and
     are served through the platform API, never from site/public. The Gated*
     components resolve entitlement at click time so pages stay static-fast. */
  const { prev, next } = articleNeighbours(article.slug);

  return (
    <div className="min-h-screen bg-anthracite">
      <ReadingProgress />
      <ScrollReveal />
      <ArticleNav />

      {/* Full-bleed hero — the section matches the photo's aspect ratio so the
          whole image shows.

          w-full is load-bearing, not decoration. Without an explicit width,
          aspect-ratio resolves the *width* from the height, and min-h-[26rem]
          then forced the section to 416px x 2.2556 = 938px — two and a half
          times a 375px phone, so every article page scrolled sideways. Pinning
          the width makes the aspect ratio drive height instead, and min-h keeps
          the hero tall enough for the title on narrow screens (object-cover
          crops the photo rather than stretching the box). */}
      {article.hero ? (
        <section className="relative isolate w-full overflow-hidden aspect-[2400/1064] min-h-[26rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/${article.hero}`} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center brightness-[1.06]" />
          {/* the photo's own dark foreground merges into the page with a light assist */}
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,#151515_0%,rgba(21,21,21,0.55)_8%,transparent_20%)]" />
          {/* Top scrim — keeps the white title and dek legible over bright skies.
              It used to fade out by 55%, which was fine for the dark mountain
              photos but left the dek at ~1.7:1 contrast over a pale blue sky.
              It now holds through the text block and clears by 78%, before the
              mountains. */}
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(21,21,21,0.66)_0%,rgba(21,21,21,0.52)_30%,rgba(21,21,21,0.34)_52%,transparent_78%)]" />
          <div className="absolute inset-x-0 top-0 mx-auto max-w-7xl px-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
            <div className="hidden lg:block" aria-hidden="true" />
            <div className="py-14 md:py-20">
              <TransitionLink
                href={`/research/${category.slug}`}
                className="t-mono text-xs uppercase tracking-[0.2em] text-aqua transition-colors hover:text-pearl"
              >
                {category.numeral} · {category.name}
              </TransitionLink>
              <h1 className="mt-5 font-sans text-[2.6rem] capitalize leading-[1.02] tracking-tight text-pearl md:text-[3.7rem]" style={{ fontWeight: 900 }}>
                {article.title}
              </h1>
              <p className="mt-6 max-w-2xl font-sans text-[1.05rem] leading-relaxed text-pearl">
                {article.dek}
              </p>
              {/* The stack line used to sit here. The badge stays: the sidebar
                  copy is lg-only, so this is the only one on a phone. */}
              <div className="mt-6 lg:hidden">
                <GatedBadge slug={article.slug} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <article className="editorial-dark bg-anthracite text-pearl">
        <div className="mx-auto max-w-7xl px-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
          {/* -------------------------------------------------- TOC rail -- */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 py-16">
              <TransitionLink
                href="/research"
                className="t-mono text-[0.66rem] uppercase tracking-[0.18em] text-steel transition-colors hover:text-aqua"
              >
                ← Research
              </TransitionLink>
              <div className="mt-8">
                <ArticleToc sections={article.sections} />
              </div>
              <div className="mt-10 border-t border-pearl/10 pt-6">
                <GatedBadge slug={article.slug} />
              </div>
            </div>
          </aside>

          {/* ------------------------------------------------- article col -- */}
          <div className="min-w-0 py-16 lg:py-20">
            {/* header — shown here only when there is no full-bleed hero above */}
            {!article.hero ? (
              <header className="border-b border-pearl/10 pb-9">
                <div className="flex items-center gap-3">
                  <TransitionLink
                    href={`/research/${category.slug}`}
                    className="t-mono text-xs uppercase tracking-[0.2em] text-aqua transition-colors hover:text-pearl"
                  >
                    {category.numeral} · {category.name}
                  </TransitionLink>
                </div>

                <h1 className="mt-5 font-sans text-[2.5rem] capitalize leading-[1.02] tracking-tight text-pearl md:text-[3.5rem]" style={{ fontWeight: 900 }}>
                  {article.title}
                </h1>
                <p className="mt-6 max-w-2xl font-sans text-[1.05rem] leading-relaxed text-pearl">
                  {article.dek}
                </p>

                {/* stack line removed; badge kept for the same reason as above */}
                <div className="mt-7 lg:hidden">
                  <GatedBadge slug={article.slug} />
                </div>
              </header>
            ) : null}

            {/* body */}
            <div className="article-body">{children}</div>

            {/* notebook / bundle CTA — gated, resolves entitlement on click */}
            <aside className="corner-ticks mt-16 flex flex-col items-start justify-between gap-5 rounded-sm border border-pearl/10 bg-coal p-7 sm:flex-row sm:items-center">
              <div>
                <p className="t-mono text-[0.66rem] uppercase tracking-[0.2em] text-aqua">Run it yourself</p>
                <p className="mt-2 font-serif text-xl text-pearl">The full, reproducible project.</p>
                <p className="mt-1 text-sm text-steel">
                  Every figure and table in this article is generated by this notebook. The bundle
                  adds double-click launchers for Windows, macOS and Linux — unzip, click, run.
                </p>
              </div>
              <GatedCta slug={article.slug} />
            </aside>

            {/* prev / next */}
            <nav className="mt-12 grid gap-px overflow-hidden rounded-sm border border-pearl/10 bg-pearl/10 sm:grid-cols-2">
              {prev ? (
                <TransitionLink href={`/research/${prev.slug}`} className="group bg-coal px-6 py-5 transition-colors hover:bg-white/5">
                  <span className="t-mono text-[0.62rem] uppercase tracking-[0.18em] text-steel">← Previous</span>
                  <p className="mt-2 font-serif text-lg leading-snug text-pearl group-hover:text-aqua">{prev.title}</p>
                </TransitionLink>
              ) : <span className="bg-coal" />}
              {next ? (
                <TransitionLink href={`/research/${next.slug}`} className="group bg-coal px-6 py-5 text-right transition-colors hover:bg-white/5">
                  <span className="t-mono text-[0.62rem] uppercase tracking-[0.18em] text-steel">Next →</span>
                  <p className="mt-2 font-serif text-lg leading-snug text-pearl group-hover:text-aqua">{next.title}</p>
                </TransitionLink>
              ) : <span className="bg-coal" />}
            </nav>
          </div>
        </div>
      </article>

      {/* colophon */}
      <footer className="bg-pitch">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-6 py-10 t-mono text-[0.66rem] uppercase tracking-[0.16em] text-steel sm:flex-row lg:px-8">
          <span>© 2026 pyportfolios. All rights reserved.</span>
          <span>Where finance theory, coding &amp; markets converge · <span className="text-aqua">pyportfolios.com</span></span>
        </div>
      </footer>
    </div>
  );
}
