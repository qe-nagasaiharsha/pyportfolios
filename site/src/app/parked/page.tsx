import type { Metadata } from "next";
import Link from "next/link";
import { ArticleNav } from "@/components/article/ArticleNav";
import { ParkedSections } from "@/components/landing/ParkedSections";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export const metadata: Metadata = {
  title: "Parked sections — pyportfolios",
  description: "Landing sections parked for later — not currently shown on the live landing page.",
  robots: { index: false, follow: false },
};

export default function ParkedPage() {
  return (
    <div className="min-h-screen bg-navy text-pearl">
      <ScrollReveal />
      <ArticleNav />

      <header className="border-b border-pearl/10">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-aqua/40" aria-hidden="true" />
            <p className="t-eyebrow text-pearl">Parked · staging</p>
          </div>
          <h1 className="t-h1 mt-6 max-w-2xl text-pearl">Sections parked for later.</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-mist">
            These were removed from the live landing page to keep it lean, but kept here so they
            can be reviewed and re-included later — nothing is deleted.
          </p>
          <Link href="/" className="mt-8 inline-flex t-mono text-xs uppercase tracking-[0.16em] text-pearl/90 transition-colors hover:text-aqua">
            ← Back to the landing page
          </Link>
        </div>
      </header>

      <main>
        <ParkedSections />
      </main>

      <footer className="bg-navy-sunken">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-6 py-12 t-mono text-[0.66rem] uppercase tracking-[0.16em] text-steel sm:flex-row lg:px-8">
          <Link href="/" className="transition-colors hover:text-aqua">← pyportfolios.com</Link>
          <span>Parked sections · <span className="text-aqua">pyportfolios.com</span></span>
        </div>
      </footer>
    </div>
  );
}
