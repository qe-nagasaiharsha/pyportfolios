import type { Metadata } from "next";
import Link from "next/link";
import { MODULES, MODULE_COUNT, LESSON_COUNT, TOTAL_MINUTES } from "@/lib/course";
import { ArticleNav } from "@/components/article/ArticleNav";
import { TransitionLink } from "@/components/motion/TransitionLink";

export const metadata: Metadata = {
  title: "Course — Quant Finance Basics — pyportfolios",
  description:
    "A structured quant-finance course from first principles to a working backtest — 7 modules, 28 lessons, cross-linked to runnable case studies. Module 1 is free.",
};

const hours = Math.round(TOTAL_MINUTES / 60);

export default function CoursePage() {
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
              <p className="t-eyebrow text-pearl">Course · Quant Finance Basics</p>
            </div>
            <h1 className="t-display mt-8 max-w-3xl text-pearl">
              Quant finance, from the ground up<span className="text-aqua">.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-mist">
              A structured path from the time value of money to a working backtest — the same rigour as
              the research library, taught step by step. Every lesson with a case study links to runnable
              code, so you read it, then run it.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 t-mono text-xs uppercase tracking-[0.18em] text-steel">
              <span>{MODULE_COUNT} modules</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span>{LESSON_COUNT} lessons</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span>~{hours} hours</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span className="text-aqua">Module 1 free</span>
            </div>
            <div className="mt-10">
              <a
                href="#module-01"
                className="group inline-flex items-center rounded-sm bg-pearl px-8 py-3.5 text-sm font-semibold text-navy transition-colors duration-300 hover:bg-aqua"
              >
                Start free
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>
        </section>

        {/* modules */}
        {MODULES.map((m, mi) => (
          <section
            key={m.no}
            id={`module-${m.no}`}
            className={`scroll-mt-20 border-b border-pearl/10 ${mi % 2 === 1 ? "bg-navy-elevated/30" : ""}`}
          >
            <div className="mx-auto max-w-5xl px-6 py-16 md:py-20 lg:px-8">
              <div className="flex flex-col gap-4 border-b border-pearl/10 pb-6 md:flex-row md:items-end md:justify-between">
                <div className="flex items-baseline gap-5">
                  <span className="font-serif text-4xl text-pearl/20 md:text-5xl">{m.no}</span>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="t-h2 text-pearl">{m.title}</h2>
                      {m.free ? (
                        <span className="rounded-full border border-aqua/40 px-2.5 py-0.5 t-mono text-[0.56rem] uppercase tracking-[0.16em] text-aqua">Free</span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 leading-relaxed text-mist">{m.blurb}</p>
                  </div>
                </div>
                <span className="shrink-0 t-mono text-xs uppercase tracking-[0.12em] text-mist">{m.lessons.length} lessons</span>
              </div>

              <ol className="mt-2 divide-y divide-pearl/10">
                {m.lessons.map((lesson, li) => (
                  <li key={lesson.title} className="grid grid-cols-[2rem_minmax(0,1fr)] items-baseline gap-x-4 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
                    <span className="tnum t-mono text-sm text-aqua/70">{m.no}.{li + 1}</span>
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3 className="font-serif text-lg text-pearl">{lesson.title}</h3>
                        <span className="t-mono text-xs uppercase tracking-[0.1em] text-mist">{lesson.minutes} min</span>
                      </div>
                      <p className="mt-1.5 leading-relaxed text-mist">{lesson.summary}</p>
                      {lesson.article ? (
                        <TransitionLink
                          href={`/research/${lesson.article}`}
                          className="mt-2.5 inline-flex items-center gap-1.5 t-mono text-[0.68rem] uppercase tracking-[0.14em] text-aqua transition-transform duration-300 hover:translate-x-0.5"
                        >
                          Case study + notebook
                          <span aria-hidden="true">↗</span>
                        </TransitionLink>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ))}

        {/* close */}
        <section className="border-b border-pearl/10">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
            <h2 className="t-h1 text-pearl">Start with Module 1 — it&apos;s free.</h2>
            <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-mist">
              The full course unlocks with Pro. Join early access and you&apos;ll be first in when it goes live.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-5">
              <Link href="/#early-access" className="rounded-sm bg-pearl px-8 py-3.5 text-sm font-semibold text-navy transition-colors duration-300 hover:bg-aqua">
                Get early access
              </Link>
              <Link href="/research" className="link-fine t-mono text-sm uppercase tracking-[0.16em] text-pearl/90 transition-colors duration-300 hover:text-pearl">
                Browse the research →
              </Link>
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
