/* Markets · Derivatives exchanges (futures, options & derivatives venues).
   Same drop-in pattern as the stock-exchange / ETF / index-provider logos:
   place <slug>.svg|png|jpg in public/logos/derivatives/ and it replaces the
   text chip automatically (resolved at build time). Each logo sits on a white
   chip with the venue name below — matching the page's logo treatment. */

import fs from "node:fs";
import path from "node:path";

const VENUES: { name: string; slug: string }[] = [
  { name: "CME", slug: "cme" },
  { name: "NYMEX", slug: "nymex" },
  { name: "CBOT", slug: "cbot" },
  { name: "Cboe", slug: "cboe" },
  { name: "ICE", slug: "ice" },
  { name: "London Metal Exchange", slug: "lme" },
  { name: "Eurex", slug: "eurex" },
  { name: "SGX Group", slug: "sgx" },
];

const DRV_DIR = path.join(process.cwd(), "public", "logos", "derivatives");
function venueLogo(slug: string): string | null {
  for (const ext of ["svg", "png", "jpg", "jpeg", "webp"]) {
    try {
      if (fs.existsSync(path.join(DRV_DIR, `${slug}.${ext}`))) return `/logos/derivatives/${slug}.${ext}`;
    } catch {}
  }
  return null;
}

export function DerivativesRow() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="t-mono text-[0.68rem] uppercase tracking-[0.22em] text-aqua/80">Futures, Options &amp; Derivatives</span>
        <span className="h-px flex-1 bg-pearl/10" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
        {VENUES.map((v) => {
          const logo = venueLogo(v.slug);
          return (
            <div
              key={v.slug}
              className="flex h-20 w-full items-center justify-center rounded-sm border border-pearl/10 bg-white px-4 transition-transform duration-300 hover:-translate-y-0.5"
            >
              {logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logo}
                  alt={`${v.name} logo`}
                  className="max-h-10 w-auto max-w-[86%] cursor-zoom-in object-contain"
                  loading="lazy"
                  data-zoom
                  role="button"
                  tabIndex={0}
                  aria-label={`Enlarge ${v.name} logo`}
                />
              ) : (
                <span className="text-sm font-semibold tracking-tight text-anthracite">{v.name}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
