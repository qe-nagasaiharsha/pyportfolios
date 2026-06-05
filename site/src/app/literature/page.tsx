import type { Metadata } from "next";
import Link from "next/link";
import { BOOK_GROUPS, PAPERS, BOOK_COUNT, PAPER_COUNT } from "@/lib/literature";
import { ArticleNav } from "@/components/article/ArticleNav";
import { TransitionLink } from "@/components/motion/TransitionLink";

export const metadata: Metadata = {
  title: "Literature — pyportfolios",
  description:
    "The canon of quantitative finance — the essential books and the landmark papers that built the field, from Markowitz (1952) to Hierarchical Risk Parity.",
};

function Label({ title }: { title: string }) {
  return (
    <div className="mb-12 flex items-center gap-4 border-b border-pearl/10 pb-4">
      <span className="h-px w-8 bg-aqua/50" aria-hidden="true" />
      <h2 className="t-mono text-sm uppercase tracking-[0.24em] text-mist">{title}</h2>
    </div>
  );
}

const span = PAPERS.length ? new Date().getFullYear() - PAPERS[0].year : 75;

export default function LiteraturePage() {
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
              <p className="t-eyebrow text-pearl/85">Literature · Books &amp; landmark papers</p>
            </div>
            <h1 className="t-display mt-8 max-w-3xl text-pearl">
              The canon<span className="text-aqua">.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-mist">
              The books worth owning and the papers that built quantitative finance — from Markowitz&apos;s
              1952 mean–variance frontier to the methods behind today&apos;s research. Where a paper has a
              case study on this site, it links straight through.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 t-mono text-xs uppercase tracking-[0.18em] text-steel">
              <span>{BOOK_COUNT} books</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span>{PAPER_COUNT} landmark papers</span>
              <span className="text-aqua/50" aria-hidden="true">·</span>
              <span className="text-aqua">{span} years</span>
            </div>
          </div>
        </section>

        {/* books */}
        <section id="books" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:px-8">
            <Label title="Essential books" />
            <div className="space-y-16">
              {BOOK_GROUPS.map((group, gi) => (
                <div key={group.theme}>
                  <div className="flex items-baseline gap-4">
                    <span className="font-serif text-3xl text-pearl/20">{String(gi + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="t-h2 text-pearl">{group.theme}</h3>
                      <p className="mt-1.5 leading-relaxed text-mist">{group.blurb}</p>
                    </div>
                  </div>
                  <div className="mt-7 grid gap-4 md:grid-cols-2">
                    {group.books.map((book) => (
                      <div
                        key={book.title}
                        className="rounded-sm border border-pearl/10 bg-navy-elevated/40 p-5 transition-colors duration-300 hover:border-pearl/25"
                      >
                        <h4 className="font-serif text-lg leading-snug text-pearl">{book.title}</h4>
                        <p className="mt-1.5 t-mono text-[0.64rem] uppercase tracking-[0.14em] text-aqua/70">
                          {book.author} · {book.year}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-mist">{book.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* papers */}
        <section id="papers" className="scroll-mt-20 border-t border-pearl/10 bg-navy-elevated/30">
          <div className="mx-auto max-w-4xl px-6 py-20 md:py-28 lg:px-8">
            <Label title="Landmark papers" />
            <p className="mb-12 max-w-2xl text-lg leading-relaxed text-mist">
              The papers that shaped the field, in order. The ones with a case study on this site are
              marked — read the idea, then run the code.
            </p>
            <ol className="border-t border-pearl/10">
              {PAPERS.map((p) => (
                <li
                  key={`${p.year}-${p.title}`}
                  className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-5 border-b border-pearl/10 py-7 md:grid-cols-[5rem_minmax(0,1fr)]"
                >
                  <div className="tnum t-mono text-sm text-aqua/80">{p.year}</div>
                  <div>
                    <h4 className="font-serif text-lg leading-snug text-pearl md:text-xl">{p.title}</h4>
                    <p className="mt-2 text-sm text-mist">
                      {p.authors} — <span className="italic">{p.journal}</span>
                    </p>
                    <p className="mt-2.5 leading-relaxed text-mist/90">{p.note}</p>
                    {p.article ? (
                      <TransitionLink
                        href={`/research/${p.article}`}
                        className="mt-3 inline-flex items-center gap-1.5 t-mono text-[0.7rem] uppercase tracking-[0.14em] text-aqua transition-transform duration-300 hover:translate-x-0.5"
                      >
                        Read our case study
                        <span aria-hidden="true">↗</span>
                      </TransitionLink>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
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
