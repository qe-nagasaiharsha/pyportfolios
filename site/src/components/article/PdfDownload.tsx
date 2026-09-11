/* Download-PDF button — the typeset research note for an article.

   Sits directly under the notebook badge, in the sidebar and in both mobile
   header variants, so every viewport gets it.

   NOT gated, unlike the notebook and bundle next to it: the PDFs are served
   straight from /public/pdfs. That was a deliberate call — see PDF_SLUGS below
   before adding an article whose tier is meant to be paid.

   PDF_SLUGS is the guard: the button only renders for articles whose PDF has
   actually been built and staged, so a missing note is an absent button rather
   than a 404. Add a slug here when its PDF lands in public/pdfs/. */

const PDF_SLUGS = new Set([
  "brownian-motion",
  "alpha-decay-momentum",
  "gaussian-vs-t-copula",
  "heston-vs-black-scholes",
  "sixty-forty-correlation-flip",
  "gamestop-momentum-models",
  "black-scholes-greeks",
  "risk-parity-futures",
  "mvo-efficient-frontier",
  "black-litterman",
  "bond-duration-convexity",
  "var-three-ways",
  "cvar-expected-shortfall",
  "copulas-tail-dependence",
  "sma-crossover-backtest",
  "kalman-filter-hedge-ratios",
]);

export function hasPdf(slug: string) {
  return PDF_SLUGS.has(slug);
}

export function PdfDownload({ slug }: { slug: string }) {
  if (!hasPdf(slug)) return null;
  return (
    <a
      href={`/pdfs/${slug}.pdf`}
      download
      /* min-h-11 is the 44px touch target; the sm: overrides restore the
         original desktop pill exactly, so only phones get the bigger hit area */
      className="group inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-pearl/25 px-3 py-2 t-mono text-[0.66rem] uppercase tracking-[0.12em] text-pearl/80 transition-colors hover:bg-pearl hover:text-anthracite sm:min-h-0 sm:px-2.5 sm:py-1"
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-pearl/70 group-hover:bg-anthracite"
        aria-hidden="true"
      />
      PDF
      <span aria-hidden="true" className="transition-transform group-hover:translate-y-0.5">
        ↓
      </span>
    </a>
  );
}
