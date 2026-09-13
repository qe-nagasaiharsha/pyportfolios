/* FAQ — native <details> accordion: progressive disclosure, near-zero JS, fully
   keyboard-accessible. Answers the objections that stop a visitor signing up. */

import type { CSSProperties } from "react";

/* An answer is paragraphs, each a run of segments. Bold is `{ b: "..." }`
   rather than inline JSX so the copy stays plain data — no JSX text nodes to
   escape, and the plan names can be restyled in one place below. */
type Segment = string | { b: string };

const FAQS: { q: string; a: Segment[][] }[] = [
  {
    q: "What is pyportfolios for?",
    a: [
      [
        "It's a working library of quantitative finance, taught in code. Each notebook pairs the theory behind a model with a runnable Python implementation you can read, change, and build on — so you learn the method and walk away with the tool. It's for anyone who wants to understand how modern finance is actually built, not just described.",
      ],
    ],
  },
  {
    q: "Do I need to know how to code?",
    a: [
      [
        "No — but you'll be running real code from the first notebook, and that's the point. Beginners get fully worked examples with every step explained; experienced quants and developers can skip the scaffolding and go straight to the models. Nothing is a black box — everything on the page is code you can open and edit.",
      ],
    ],
  },
  {
    q: "Which concepts and models are covered, and how?",
    a: [
      [
        "The library spans the core of quantitative finance — option pricing, portfolio construction and optimization, risk management, and algorithmic trading — from first principles through to research-grade methods. Every case study covers what the model does, the intuition behind it, where it's genuinely useful, and, just as importantly, where it breaks down. The explanation sits right next to the executable code, so you can move between theory and implementation without leaving the notebook.",
      ],
    ],
  },
  {
    q: "Is there a free plan?",
    a: [
      [
        "Yes. ",
        { b: "Basic" },
        " gives you four complete tutorials — one from each category — free to read, run and download, as both notebook and PDF. Nothing is cut short: they're the full pieces, not teasers, and the rest of the library is previewed so you can see exactly what's there.",
      ],
      [
        "That's enough to learn the fundamentals and decide whether this is for you. If you want to go further — to actually work at the intersection of finance and code — ",
        { b: "Plus" },
        " opens the full library and ",
        { b: "Pro" },
        " adds the research notes, the advanced material and the data.",
      ],
    ],
  },
  {
    q: "What's the difference between Plus and Pro?",
    a: [
      [
        { b: "Plus" },
        " opens the full library: every notebook, in full, with the code and the explanation, and the notebook files to download.",
      ],
      [
        { b: "Pro" },
        " adds the formatted PDF research notes for the whole library, the advanced Pro-only notebooks, the curated instrument universe, and new releases a week before everyone else. Plus is built for learning; Pro is built for working.",
      ],
    ],
  },
  {
    q: "Can I use this professionally and privately?",
    a: [
      [
        "Yes — the notebooks are built for both. Whether you're a practitioner sharpening a specific technique, a researcher or student learning the field properly, or a private investor who wants to understand the models behind your own decisions, the material is yours to study and apply.",
      ],
    ],
  },
  {
    q: "How do I get help?",
    a: [
      [
        "Every member can ask questions through the community. ",
        { b: "Pro" },
        " members get priority support. On any plan, questions about the finance and the code are both fair game — this is a place to learn, not just download.",
      ],
    ],
  },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 border-b border-pearl/10 bg-navy-elevated/40">
      <div className="mx-auto max-w-3xl px-6 py-28 md:py-32">
        <div data-reveal className="mb-12">
          <div className="flex items-center gap-4">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
            <span className="t-mono text-sm font-bold tabular-nums text-aqua">07</span>
            <h2 className="t-mono text-sm uppercase tracking-[0.24em] text-mist">Frequently asked</h2>
          </div>
          <h3 className="mt-7 t-h1 text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)" }}>
            Your questions, our answers
          </h3>
        </div>

        <div id="faq-list" data-reveal className="divide-y divide-pearl/10 border-y border-pearl/10">
          {FAQS.map((f, i) => (
            <details key={f.q} className="faq-item group" style={{ "--reveal-delay": `${i * 40}ms` } as CSSProperties}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left">
                <span className="font-serif text-lg text-pearl md:text-xl">{f.q}</span>
                <span className="faq-mark relative h-4 w-4 shrink-0 text-aqua" aria-hidden="true" />
              </summary>
              {f.a.map((para, p) => (
                <p
                  key={p}
                  className={`pr-10 leading-relaxed text-mist ${p === f.a.length - 1 ? "pb-6" : "pb-4"}`}
                >
                  {para.map((seg, s) =>
                    typeof seg === "string" ? (
                      seg
                    ) : (
                      <strong key={s} className="font-semibold text-pearl">
                        {seg.b}
                      </strong>
                    ),
                  )}
                </p>
              ))}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
