/* FAQ — native <details> accordion: progressive disclosure, near-zero JS, fully
   keyboard-accessible. Answers the objections that stop a visitor signing up. */

import type { CSSProperties } from "react";

const FAQS = [
  {
    q: "What is this platform designed for?",
    a: "It helps you start, hone, and elevate your quant finance and AI skillset — get ready for the Future of Finance.",
  },
  {
    q: "Do I need technical knowledge or coding expertise to use the Python notebooks?",
    a: "Not at all. The platform is built for everyone — from beginners exploring quant finance and coding to professionals building complex models. Every notebook runs out-of-the-box.",
  },
  {
    q: "Which concepts and models are used, and how are the contents presented?",
    a: "We introduce you to a wide range of concepts and models from the world of quantitative finance — from fundamentals such as option pricing, to portfolio optimization, risk management and algorithmic trading. Case studies include the explanation, the intuition, the relevance, and the strengths and shortcomings, and are tightly connected to the executable code.",
  },
  {
    q: "Is there a free plan available?",
    a: "Yes. You can start for free with introductory notebooks and limited previews, and upgrade later if you want to learn more.",
  },
  {
    q: "Can I use the content for professional and private purposes?",
    a: "Absolutely. Our case studies and notebooks are designed for both finance professionals and private individuals — such as retail investors and traders, scholars, or students upgrading or polishing their repertoire.",
  },
  {
    q: "How can I get support if I have issues?",
    a: "You will have access to community help on the free plan, and Pro/Lifetime users receive priority or dedicated support.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 border-b border-pearl/10 bg-navy-elevated/40">
      <div className="mx-auto max-w-3xl px-6 py-28 md:py-32">
        <div data-reveal className="mb-12 flex items-center gap-4 border-b border-pearl/10 pb-4">
          <span className="h-px w-8 bg-aqua/50" aria-hidden="true" />
          <span className="t-mono text-sm font-bold tabular-nums text-aqua">07</span>
          <h2 className="t-mono text-sm uppercase tracking-[0.24em] text-mist">Frequently asked</h2>
        </div>

        <div data-reveal className="divide-y divide-pearl/10 border-y border-pearl/10">
          {FAQS.map((f, i) => (
            <details key={f.q} className="faq-item group" style={{ "--reveal-delay": `${i * 40}ms` } as CSSProperties}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left">
                <span className="font-serif text-lg text-pearl transition-colors group-open:text-aqua md:text-xl">{f.q}</span>
                <span className="faq-mark relative h-4 w-4 shrink-0 text-mist" aria-hidden="true" />
              </summary>
              <p className="pb-6 pr-10 leading-relaxed text-mist">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
