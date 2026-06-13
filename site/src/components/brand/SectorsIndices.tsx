/* Markets · Sectors & Indices (deck / pyportfolios.com "Sectors & Indices" tab).
   Three groups: the GICS-style sectors, the benchmark country indices of the
   top-15 economies, and the major index providers. Index-provider logos are
   drop-in — place <slug>.svg|png in public/logos/indices/ and they replace the
   text chip automatically (resolved at build time). */

import fs from "node:fs";
import path from "node:path";

const SECTORS = [
  "Energy", "Healthcare", "Industrials", "Utilities", "IT", "Materials",
  "Consumer Discretionary", "Consumer Staples", "Financials", "Telecom", "Real Estate", "Infrastructure",
] as const;

const COUNTRY_INDICES: { name: string; country: string }[] = [
  { name: "S&P 500", country: "United States" },
  { name: "Nasdaq 100", country: "United States" },
  { name: "DAX", country: "Germany" },
  { name: "S&P/ASX 200", country: "Australia" },
  { name: "CAC 40", country: "France" },
  { name: "KOSPI", country: "South Korea" },
  { name: "FTSE 100", country: "United Kingdom" },
  { name: "FTSE MIB", country: "Italy" },
  { name: "Nikkei 225", country: "Japan" },
  { name: "S&P/TSX", country: "Canada" },
  { name: "IBEX 35", country: "Spain" },
  { name: "Bovespa", country: "Brazil" },
  { name: "SSE Composite", country: "China" },
  { name: "BSE Sensex", country: "India" },
  { name: "S&P/BMV IPC", country: "Mexico" },
  { name: "MOEX", country: "Russia" },
];

const INDEX_PROVIDERS: { name: string; slug: string }[] = [
  { name: "MSCI", slug: "msci" },
  { name: "FTSE Russell", slug: "ftse-russell" },
  { name: "S&P Dow Jones Indices", slug: "sp-dji" },
  { name: "STOXX", slug: "stoxx" },
];

const IDX_DIR = path.join(process.cwd(), "public", "logos", "indices");
function providerLogo(slug: string): string | null {
  for (const ext of ["svg", "png"]) {
    try {
      if (fs.existsSync(path.join(IDX_DIR, `${slug}.${ext}`))) return `/logos/indices/${slug}.${ext}`;
    } catch {}
  }
  return null;
}

function GroupLabel({ children }: { children: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="t-mono text-[0.68rem] uppercase tracking-[0.22em] text-aqua/80">{children}</span>
      <span className="h-px flex-1 bg-pearl/10" />
    </div>
  );
}

export function SectorsIndices() {
  return (
    <div className="space-y-10">
      {/* Sectors */}
      <div>
        <GroupLabel>Sectors</GroupLabel>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {SECTORS.map((s) => (
            <div key={s} className="flex items-center justify-center rounded-sm border border-pearl/10 bg-navy-elevated/40 px-3 py-3.5 text-center text-sm text-pearl">
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Country indices */}
      <div>
        <GroupLabel>Country Indices</GroupLabel>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {COUNTRY_INDICES.map((c) => (
            <div key={c.name} className="rounded-sm border border-pearl/10 bg-navy-elevated/40 px-4 py-3">
              <p className="text-sm font-medium text-pearl">{c.name}</p>
              <p className="mt-0.5 t-mono text-[0.62rem] uppercase tracking-[0.14em] text-steel">{c.country}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Index providers */}
      <div>
        <GroupLabel>Index Providers</GroupLabel>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {INDEX_PROVIDERS.map((p) => {
            const logo = providerLogo(p.slug);
            return (
              <div
                key={p.slug}
                className="flex h-16 items-center justify-center rounded-sm border border-pearl/10 bg-white px-4 text-center transition-transform duration-300 hover:-translate-y-0.5"
              >
                {logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logo} alt={`${p.name} logo`} className="max-h-9 w-auto max-w-[88%] cursor-zoom-in object-contain" loading="lazy" data-zoom role="button" tabIndex={0} aria-label={`Enlarge ${p.name} logo`} />
                ) : (
                  <span className="text-sm font-semibold tracking-tight text-anthracite">{p.name}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
