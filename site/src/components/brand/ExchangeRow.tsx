/* The world's major exchanges, as uniform logo chips (deck §06 rule: third-party
   logos given room, never recoloured → shown on a light chip in true colour).
   DROP-IN: each shows its SVG from /public/logos/exchanges/<slug>.svg the moment
   the file exists; a clean text mark stands in until then. Build-time detection. */

import fs from "node:fs";
import path from "node:path";

interface Exch {
  name: string;
  slug: string;
}

/* Americas → Europe → Asia-Pacific */
const EXCHANGES: Exch[] = [
  { name: "NYSE", slug: "nyse" },
  { name: "Nasdaq", slug: "nasdaq" },
  { name: "CME", slug: "cme" },
  { name: "B3", slug: "b3" },
  { name: "LSE", slug: "lse" },
  { name: "Euronext", slug: "euronext" },
  { name: "Deutsche Börse", slug: "deutsche-borse" },
  { name: "SIX", slug: "six" },
  { name: "JPX", slug: "jpx" },
  { name: "HKEX", slug: "hkex" },
  { name: "NSE", slug: "nse" },
  { name: "ASX", slug: "asx" },
];

const DIR = path.join(process.cwd(), "public", "logos", "exchanges");
function hasLogo(slug: string): boolean {
  try {
    return fs.existsSync(path.join(DIR, `${slug}.svg`));
  } catch {
    return false;
  }
}

export function ExchangeRow() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {EXCHANGES.map((e) => (
        <div
          key={e.slug}
          className="flex h-[4.5rem] items-center justify-center rounded-sm border border-pearl/10 bg-pearl px-5 transition-transform duration-300 hover:-translate-y-0.5"
        >
          {hasLogo(e.slug) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/logos/exchanges/${e.slug}.svg`}
              alt={`${e.name} logo`}
              className="max-h-7 w-auto max-w-full object-contain"
              loading="lazy"
            />
          ) : (
            <span className="t-mono text-sm font-semibold tracking-tight text-anthracite">{e.name}</span>
          )}
        </div>
      ))}
    </div>
  );
}
