import type { Metadata } from "next";
import Link from "next/link";
import { ArticleNav } from "@/components/article/ArticleNav";

export const metadata: Metadata = {
  title: "Content — How the library is organised — pyportfolios",
  description:
    "Four formats, one method: tutorials that teach a concept, case studies that apply it to real events, research notes on live markets, and deep research articles that link the literature to runnable code.",
};

type Fmt = {
  no: string;
  title: string;
  blurb: string;
  examples: string[];
  icon: React.ReactNode;
};

const FORMATS: Fmt[] = [
  {
    no: "01",
    title: "Tutorials",
    blurb:
      "Learn one concept or model at a time, with a clear worked example on real data. Methodology first — how it works and why — never a claim of new results.",
    examples: ["Pricing options & the Greeks", "The Kelly criterion for position sizing", "Black–Scholes on a discrete example"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    no: "02",
    title: "Case Studies",
    blurb:
      "A model put to work on a real market event or deal — to see how the theory holds up once the data gets messy. The methodology is the point, not the P&L.",
    examples: ["EVT + copulas for market risk (VaR)", "The GameStop short squeeze", "2008 housing crisis · the COVID shock"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="M7 14l3-4 3 3 4-6" />
      </svg>
    ),
  },
  {
    no: "03",
    title: "Research Notes",
    blurb:
      "Short, empirical reads on what markets are doing right now — the insight and its implication, light on the math. The kind of note a desk puts out when something moves.",
    examples: ["Rate-path forecasts & Treasury yields", "Gold through war & inflation", "Commodity & regime shifts"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8M8 17h5" />
      </svg>
    ),
  },
  {
    no: "04",
    title: "Research Articles",
    blurb:
      "Deeper, paper-style write-ups that connect the academic literature to runnable Python — the full argument, end to end. The bridge from a landmark paper to live code.",
    examples: ["From a landmark paper to working code", "Replicating canonical results", "Cross-linked to the literature library"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 4h11l5 5v11a0 0 0 0 1 0 0H4a0 0 0 0 1 0 0z" />
        <path d="M9 9h2M9 13h6M9 17h6" />
      </svg>
    ),
  },
];

export default function ContentPage() {
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
              <p className="t-eyebrow text-pearl">Content · How the library is organised</p>
            </div>
            <h1 className="t-display mt-8 max-w-3xl text-pearl">
              Four formats, one method<span className="text-aqua">.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-mist">
              Every topic is taught the same way — methodology first, on real data, with no claim of new
              results — just in four shapes. From a crisp tutorial on a single idea to a full research
              article that links the literature to runnable code.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 t-mono text-xs uppercase tracking-[0.18em] text-steel">
              <span>Tutorials</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span>Case studies</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span>Research notes</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span className="text-aqua">Articles</span>
            </div>
          </div>
        </section>

        {/* the four formats */}
        <section className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
              {FORMATS.map((f) => (
                <article
                  key={f.no}
                  className="group flex flex-col rounded-lg border border-pearl/10 bg-navy-elevated/50 p-8 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-aqua/30"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-aqua/30 bg-aqua/5 text-aqua">
                      {f.icon}
                    </span>
                    <span className="t-mono text-xs tabular-nums tracking-[0.2em] text-aqua/70">{f.no}</span>
                  </div>

                  <h2 className="mt-6 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.4rem, 3vw, 1.9rem)" }}>
                    {f.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-mist">{f.blurb}</p>

                  <ul className="mt-6 space-y-2 border-t border-pearl/10 pt-5">
                    {f.examples.map((e) => (
                      <li key={e} className="flex gap-2.5 text-sm text-steel">
                        <span className="mt-2 inline-block h-[0.3em] w-[0.3em] shrink-0 rounded-full bg-aqua/70" aria-hidden="true" />
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>

                  <span className="mt-7 inline-flex items-center gap-1.5 t-mono text-[0.66rem] uppercase tracking-[0.18em] text-steel/70">
                    Coming soon
                  </span>
                </article>
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
