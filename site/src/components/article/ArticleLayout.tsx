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
  formatDate,
  articleNeighbours,
} from "@/lib/articles";
import { ArticleNav } from "@/components/article/ArticleNav";
import { ArticleToc } from "@/components/article/ArticleToc";

function NotebookBadge({ href }: { href: string }) {
  return (
    <a
      href={href}
      download
      className="group inline-flex items-center gap-1.5 rounded-sm border border-teal/40 px-2.5 py-1 t-mono text-[0.66rem] uppercase tracking-[0.12em] text-teal transition-colors hover:bg-teal hover:text-paper"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-teal group-hover:bg-paper" aria-hidden="true" />
      Notebook
      <span aria-hidden="true" className="transition-transform group-hover:translate-y-0.5">↓</span>
    </a>
  );
}

export function ArticleLayout({ article, children }: { article: Article; children: ReactNode }) {
  const category = CATEGORIES[article.category];
  const notebookHref = `/notebooks/${article.notebook}`;
  const { prev, next } = articleNeighbours(article.slug);

  return (
    <div className="min-h-screen bg-navy">
      <ArticleNav />

      <article className="bg-sisal text-anthracite">
        <div className="mx-auto max-w-6xl px-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 lg:px-8">
          {/* -------------------------------------------------- TOC rail -- */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 py-16">
              <TransitionLink
                href="/research"
                className="t-mono text-[0.66rem] uppercase tracking-[0.18em] text-graphite transition-colors hover:text-teal"
              >
                ← Research
              </TransitionLink>
              <div className="mt-8">
                <ArticleToc sections={article.sections} />
              </div>
              <div className="mt-10 border-t border-anthracite/12 pt-6">
                <NotebookBadge href={notebookHref} />
              </div>
            </div>
          </aside>

          {/* ------------------------------------------------- article col -- */}
          <div className="min-w-0 py-16 lg:max-w-[46rem] lg:py-20">
            {/* header */}
            <header className="border-b border-anthracite/12 pb-9">
              <div className="flex items-center gap-3">
                <TransitionLink
                  href={`/research#${category.slug}`}
                  className="t-mono text-xs uppercase tracking-[0.2em] text-teal transition-colors hover:text-anthracite"
                >
                  {category.numeral} · {category.name}
                </TransitionLink>
              </div>

              <h1 className="mt-5 font-serif text-[2.1rem] leading-[1.08] tracking-tight text-anthracite md:text-[2.9rem]" style={{ fontWeight: 500 }}>
                {article.title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-graphite">{article.dek}</p>

              <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3 t-mono text-[0.72rem] uppercase tracking-[0.12em] text-graphite">
                <span>{formatDate(article.date)}</span>
                <span className="text-anthracite/20" aria-hidden="true">·</span>
                <span>{article.level}</span>
                <span className="text-anthracite/20" aria-hidden="true">·</span>
                <span>{article.readMinutes} min read</span>
                <span className="text-anthracite/20" aria-hidden="true">·</span>
                <span className="text-teal">Python</span>
                <span className="ml-auto lg:hidden">
                  <NotebookBadge href={notebookHref} />
                </span>
              </div>

              <p className="mt-4 t-mono text-[0.72rem] text-graphite/80">
                <span className="text-graphite">Stack — </span>
                {article.stack.join(" · ")}
              </p>
            </header>

            {/* body */}
            <div className="article-body">{children}</div>

            {/* notebook CTA */}
            <aside className="corner-ticks mt-16 flex flex-col items-start justify-between gap-5 rounded-sm border border-anthracite/12 bg-paper/70 p-7 sm:flex-row sm:items-center">
              <div>
                <p className="t-mono text-[0.66rem] uppercase tracking-[0.2em] text-teal">Run it yourself</p>
                <p className="mt-2 font-serif text-xl text-anthracite">The full, reproducible notebook.</p>
                <p className="mt-1 text-sm text-graphite">Every figure and table in this article is generated by this notebook.</p>
              </div>
              <a
                href={notebookHref}
                download
                className="group inline-flex shrink-0 items-center gap-2 rounded-sm bg-anthracite px-6 py-3 text-sm font-semibold text-sisal transition-colors duration-300 hover:bg-teal"
              >
                Download notebook
                <span className="t-mono text-xs opacity-70">.ipynb</span>
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
              </a>
            </aside>

            {/* prev / next */}
            <nav className="mt-12 grid gap-px overflow-hidden rounded-sm border border-anthracite/12 bg-anthracite/12 sm:grid-cols-2">
              {prev ? (
                <TransitionLink href={`/research/${prev.slug}`} className="group bg-sisal px-6 py-5 transition-colors hover:bg-paper/60">
                  <span className="t-mono text-[0.62rem] uppercase tracking-[0.18em] text-graphite">← Previous</span>
                  <p className="mt-2 font-serif text-lg leading-snug text-anthracite group-hover:text-teal">{prev.title}</p>
                </TransitionLink>
              ) : <span className="bg-sisal" />}
              {next ? (
                <TransitionLink href={`/research/${next.slug}`} className="group bg-sisal px-6 py-5 text-right transition-colors hover:bg-paper/60">
                  <span className="t-mono text-[0.62rem] uppercase tracking-[0.18em] text-graphite">Next →</span>
                  <p className="mt-2 font-serif text-lg leading-snug text-anthracite group-hover:text-teal">{next.title}</p>
                </TransitionLink>
              ) : <span className="bg-sisal" />}
            </nav>
          </div>
        </div>
      </article>

      {/* colophon */}
      <footer className="bg-navy-sunken">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-6 py-10 t-mono text-[0.66rem] uppercase tracking-[0.16em] text-steel sm:flex-row lg:px-8">
          <span>© 2026 pyportfolios. All rights reserved.</span>
          <span>Where finance theory, coding &amp; markets converge · <span className="text-aqua">pyportfolios.com</span></span>
        </div>
      </footer>
    </div>
  );
}
