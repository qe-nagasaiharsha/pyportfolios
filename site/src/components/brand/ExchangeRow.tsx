/* The world's major exchanges as uniform logo chips (brand deck, slide 13 —
   "Global Exchanges"), grouped by region: Americas → Europe → Asia & Australia.
   Logos are taken from the brand guidelines so they match exactly; each sits on
   a white chip, never recoloured, given room. */

interface Exch {
  name: string;
  slug: string; // → /public/logos/exchanges/<slug>.png
}

const REGIONS: { region: string; venues: Exch[] }[] = [
  {
    region: "Americas",
    venues: [
      { name: "NYSE", slug: "nyse" },
      { name: "Nasdaq", slug: "nasdaq" },
      { name: "B3 (Brasil)", slug: "b3" },
      { name: "Bolsa Mexicana", slug: "bolsa-mexicana" },
      { name: "TSX (Toronto)", slug: "tsx" },
    ],
  },
  {
    region: "Europe",
    venues: [
      { name: "Börse Frankfurt", slug: "borse-frankfurt" },
      { name: "Euronext", slug: "euronext" },
      { name: "Borsa Italiana", slug: "borsa-italiana" },
      { name: "BME (Spain)", slug: "bme" },
      { name: "MOEX (Moscow)", slug: "moex" },
      { name: "SIX (Switzerland)", slug: "six" },
      { name: "London Stock Exchange", slug: "lse" },
    ],
  },
  {
    region: "Asia & Australia",
    venues: [
      { name: "JPX (Japan)", slug: "jpx" },
      { name: "HKEX (Hong Kong)", slug: "hkex" },
      { name: "KRX (Korea)", slug: "krx" },
      { name: "ASX (Australia)", slug: "asx" },
      { name: "SSE (Shanghai)", slug: "sse" },
      { name: "Shenzhen Stock Exchange", slug: "szse" },
      { name: "BSE (India)", slug: "bse" },
      { name: "NSE (India)", slug: "nse" },
    ],
  },
];

export function ExchangeRow() {
  return (
    <div className="space-y-8">
      {REGIONS.map((r) => (
        <div key={r.region}>
          <div className="mb-3 flex items-center gap-3">
            <span className="t-mono text-[0.68rem] uppercase tracking-[0.22em] text-aqua/80">{r.region}</span>
            <span className="h-px flex-1 bg-pearl/10" />
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
            {r.venues.map((e) => (
              <div
                key={e.slug}
                className="flex h-16 items-center justify-center rounded-sm border border-pearl/10 bg-white px-3 transition-transform duration-300 hover:-translate-y-0.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/exchanges/${e.slug}.png`}
                  alt={`${e.name} logo`}
                  className="max-h-9 w-auto max-w-[88%] cursor-zoom-in object-contain"
                  loading="lazy"
                  data-zoom
                  role="button"
                  tabIndex={0}
                  aria-label={`Enlarge ${e.name} logo`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
