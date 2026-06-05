/* The world's major exchanges as uniform logo chips (brand deck, slide 13 —
   "Global Exchanges"). Logos are taken from the brand guidelines so they match
   exactly; each sits on a white chip, never recoloured, given room. Ordered
   Americas → Europe → Asia & Australia, in one clean uniform grid. */

interface Exch {
  name: string;
  slug: string; // → /public/logos/exchanges/<slug>.png
}

const EXCHANGES: Exch[] = [
  // Americas
  { name: "NYSE", slug: "nyse" },
  { name: "Nasdaq", slug: "nasdaq" },
  { name: "B3 (Brasil)", slug: "b3" },
  { name: "Bolsa Mexicana", slug: "bolsa-mexicana" },
  { name: "TSX (Toronto)", slug: "tsx" },
  // Europe
  { name: "Börse Frankfurt", slug: "borse-frankfurt" },
  { name: "Deutsche Börse", slug: "deutsche-borse" },
  { name: "Euronext", slug: "euronext" },
  { name: "Borsa Italiana", slug: "borsa-italiana" },
  { name: "BME (Spain)", slug: "bme" },
  { name: "MOEX (Moscow)", slug: "moex" },
  { name: "SIX (Switzerland)", slug: "six" },
  { name: "London Stock Exchange", slug: "lse" },
  // Asia & Australia
  { name: "JPX (Japan)", slug: "jpx" },
  { name: "HKEX (Hong Kong)", slug: "hkex" },
  { name: "KRX (Korea)", slug: "krx" },
  { name: "ASX (Australia)", slug: "asx" },
  { name: "SSE (Shanghai)", slug: "sse" },
  { name: "Shenzhen Stock Exchange", slug: "szse" },
  { name: "BSE (India)", slug: "bse" },
  { name: "NSE (India)", slug: "nse" },
];

export function ExchangeRow() {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
      {EXCHANGES.map((e) => (
        <div
          key={e.slug}
          className="flex h-16 items-center justify-center rounded-sm border border-pearl/10 bg-white px-3 transition-transform duration-300 hover:-translate-y-0.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/logos/exchanges/${e.slug}.png`}
            alt={`${e.name} logo`}
            className="max-h-9 w-auto max-w-[88%] object-contain"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
