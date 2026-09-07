import type { Metadata } from "next";
import Link from "next/link";
import { ArticleNav } from "@/components/article/ArticleNav";

/* Holding page. The real course page — 7 modules, 28 lessons, cross-linked to
   the case studies — was parked on 7 Sep 2026 before go-live and is kept
   verbatim in retired-pages/course/, alongside its data. Restoring it is a
   copy-back, not a rewrite; see the README there.

   The nav still links here, so this has to look deliberate rather than broken:
   same shell as every other page, and a way onward to the research rather than
   a dead end. */

export const metadata: Metadata = {
  title: "Course — pyportfolios",
  description: "The pyportfolios quant-finance course is in preparation.",
};

export default function CoursePage() {
  return (
    <div className="min-h-screen bg-navy text-pearl">
      <ArticleNav />

      <main>
        <section className="relative overflow-hidden">
          <div className="grid-paper absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto flex min-h-[64vh] max-w-6xl flex-col justify-center px-6 py-24 md:py-32 lg:px-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-pearl/25" aria-hidden="true" />
              <p className="t-eyebrow text-pearl">Course Structure</p>
            </div>

            <h1
              className="mt-8 max-w-3xl font-sans text-pearl"
              style={{ fontWeight: 900, fontSize: "clamp(2.2rem, 6vw, 4rem)", lineHeight: 1.02 }}
            >
              Coming soon<span className="text-aqua">.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">
              The structured course is in preparation. In the meantime the full
              research library is live — every piece runnable, with its notebook.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                href="/research"
                className="rounded-sm bg-pearl px-8 py-3.5 text-sm font-semibold text-navy transition-colors duration-300 hover:bg-aqua"
              >
                Browse the research
              </Link>
              <Link
                href="/#early-access"
                className="link-fine t-mono text-sm uppercase tracking-[0.16em] text-pearl/90 transition-colors duration-300 hover:text-pearl"
              >
                Get early access →
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
