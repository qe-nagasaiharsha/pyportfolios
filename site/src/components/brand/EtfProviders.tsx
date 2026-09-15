/* Markets · ETF main providers. Logos are drop-in — place <slug>.svg|png|jpg in
   public/logos/etf/ and they replace the text chip automatically (resolved at
   build time, same pattern as the index-provider and exchange logos). The files
   there are each brand's mark on white, so they sit in the shared LogoChip like
   the exchange logos do. */

import fs from "node:fs";
import path from "node:path";
import { LogoChip } from "./LogoChip";

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
      {/* same chip and grid as the exchange rows above, so all the logo grids match */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        {PROVIDERS.map((p) => (
          <LogoChip key={p.slug} src={providerLogo(p.slug)} name={p.name} />
        ))}
      </div>
    </div>
  );
}
