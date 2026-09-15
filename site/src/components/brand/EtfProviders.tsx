/* Markets · ETF main providers. Logos are drop-in — place <slug>.svg|png|jpg in
   public/logos/etf/ and they replace the text chip automatically (resolved at
   build time, same pattern as the index-provider and exchange logos). */

import fs from "node:fs";
import path from "node:path";

const PROVIDERS: { name: string; slug: string }[] = [
  { name: "iShares", slug: "ishares" },
  { name: "Vanguard", slug: "vanguard" },
  { name: "State Street", slug: "state-street" },
  { name: "Invesco", slug: "invesco" },
];

const ETF_DIR = path.join(process.cwd(), "public", "logos", "etf");
function providerLogo(slug: string): string | null {
  for (const ext of ["svg", "png", "jpg", "jpeg", "webp"]) {
    try {
      if (fs.existsSync(path.join(ETF_DIR, `${slug}.${ext}`))) return `/logos/etf/${slug}.${ext}`;
    } catch {}
  }
  return null;
}

export function EtfProviders() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="t-mono text-[0.68rem] uppercase tracking-[0.22em] text-aqua/80">ETFs — Main Providers</span>
        <span className="h-px flex-1 bg-pearl/10" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {PROVIDERS.map((p) => {
          const logo = providerLogo(p.slug);
          return (
            <div
              key={p.slug}
              className="flex h-28 flex-col items-center justify-center gap-3 rounded-sm border border-pearl/10 bg-navy-elevated/40 px-4 text-center transition-colors duration-300 hover:border-aqua/30"
            >
              {logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logo}
                  alt={`${p.name} logo`}
                  className="h-14 w-14 cursor-zoom-in rounded-lg object-cover"
                  loading="lazy"
                  data-zoom
                  role="button"
                  tabIndex={0}
                  aria-label={`Enlarge ${p.name} logo`}
                />
              ) : null}
              <span className="text-sm font-semibold tracking-tight text-pearl">{p.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
