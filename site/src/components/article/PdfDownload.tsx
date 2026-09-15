"use client";

/* Download-PDF button — the typeset research note for an article.

   Sits directly under the notebook badge, in the sidebar and in both mobile
   header variants, so every viewport gets it.

   GATED (this changed): PDFs used to be served straight from /public/pdfs,
   which made the advertised Pro-only research notes world-readable. They now
   live in the vault behind /api/content/pdfs/{slug}: free for the 4 sample
   tutorials, a Pro (premium) perk for the rest. Resolution happens at CLICK
   time so article pages stay static-fast:
     click → 200        → blob download
             401 signed-out → /account
             402 not-entitled → /checkout with the plan the server names

   PDF_SLUGS still guards rendering: the button only appears for articles whose
   PDF has actually been built and staged in vault/pdfs/. Add a slug here when
   its PDF lands there. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, saveBlob } from "@/lib/api";

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
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!hasPdf(slug)) return null;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const blob = await api.pdf(slug);
          saveBlob(blob, `${slug}.pdf`);
        } catch (ex) {
          if (ex instanceof ApiError && ex.status === 401) router.push("/account");
          else if (ex instanceof ApiError && ex.status === 402)
            router.push(`/checkout?plan=${ex.requiredPlan ?? "premium-monthly"}`);
        } finally {
          setBusy(false);
        }
      }}
      /* min-h-11 is the 44px touch target; the sm: overrides restore the
         original desktop pill exactly, so only phones get the bigger hit area */
      className="group inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-pearl/25 px-3 py-2 t-mono text-[0.66rem] uppercase tracking-[0.12em] text-pearl/80 transition-colors hover:bg-pearl hover:text-anthracite disabled:opacity-60 sm:min-h-0 sm:px-2.5 sm:py-1"
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-pearl/70 group-hover:bg-anthracite"
        aria-hidden="true"
      />
      {busy ? "…" : "PDF"}
      <span aria-hidden="true" className="transition-transform group-hover:translate-y-0.5">
        ↓
      </span>
    </button>
  );
}
