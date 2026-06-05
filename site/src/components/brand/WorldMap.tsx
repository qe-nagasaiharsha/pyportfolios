/* Market Reach (deck §13–14): a dotted world map highlighting the top-15
   economies, with the global exchanges by region. Pure SVG, lightweight,
   deterministic (no randomness → stable SSR/CSR hydration). Tone-aware so it
   reads on both the dark canvas (v4) and the light editorial canvas (v11). */

const W = 1000;
const H = 460;
const LAT_TOP = 80;
const LAT_BOT = -56;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * W;
  const y = ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * H;
  return [x, y];
}

/* rough land bounding boxes [latMin, latMax, lonMin, lonMax] — stylized, not survey-grade */
const LAND: [number, number, number, number][] = [
  [30, 70, -140, -60], // N. America
  [55, 72, -168, -130], // Alaska
  [8, 30, -118, -77], // C. America
  [60, 83, -55, -15], // Greenland
  [-55, 12, -82, -34], // S. America
  [36, 71, -10, 40], // Europe
  [-35, 37, -18, 52], // Africa
  [12, 45, 35, 60], // Middle East
  [5, 78, 60, 150], // Asia
  [-10, 20, 95, 141], // SE Asia
  [-39, -11, 113, 154], // Australia
];

function isLand(lon: number, lat: number): boolean {
  for (const [la0, la1, lo0, lo1] of LAND) {
    if (lat >= la0 && lat <= la1 && lon >= lo0 && lon <= lo1) return true;
  }
  return false;
}

// deterministic dot grid
const DOTS: [number, number][] = [];
for (let lat = LAT_BOT; lat <= LAT_TOP; lat += 3.6) {
  for (let lon = -180; lon <= 180; lon += 3.6) {
    if (isLand(lon, lat)) DOTS.push(project(lon, lat));
  }
}

const ECONOMIES: { n: string; lon: number; lat: number; label?: boolean }[] = [
  { n: "United States", lon: -98, lat: 39, label: true },
  { n: "China", lon: 104, lat: 35, label: true },
  { n: "Germany", lon: 10, lat: 51 },
  { n: "Japan", lon: 138, lat: 36, label: true },
  { n: "India", lon: 79, lat: 22, label: true },
  { n: "United Kingdom", lon: -1.5, lat: 53 },
  { n: "France", lon: 2.3, lat: 47 },
  { n: "Italy", lon: 12.5, lat: 42 },
  { n: "Brazil", lon: -51, lat: -10, label: true },
  { n: "Canada", lon: -106, lat: 56 },
  { n: "Russia", lon: 64, lat: 61 },
  { n: "Mexico", lon: -102, lat: 23 },
  { n: "Australia", lon: 134, lat: -25, label: true },
  { n: "South Korea", lon: 127.5, lat: 36.5 },
  { n: "Spain", lon: -3.7, lat: 40 },
];

export function WorldMap({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const light = tone === "light";
  const dotFill = light ? "#151515" : "#EEEEEE";
  const dotOpacity = light ? 0.2 : 0.16;
  const marker = light ? "#0A8A8A" : "#1FFFFF";
  const haloOpacity = light ? 0.15 : 0.14;
  const labelFill = light ? "#4A4A42" : "#98a1b4";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label="World map highlighting the top fifteen economies pyportfolios case studies draw from.">
      {DOTS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.7" fill={dotFill} opacity={dotOpacity} />
      ))}
      {ECONOMIES.map((e) => {
        const [x, y] = project(e.lon, e.lat);
        return (
          <g key={e.n}>
            <circle cx={x} cy={y} r="6.5" fill={marker} opacity={haloOpacity} />
            <circle cx={x} cy={y} r="2.6" fill={marker} />
            {e.label ? (
              <text x={x + 9} y={y + 3.5} fill={labelFill} className="t-mono"
                style={{ fontSize: 11, letterSpacing: "0.04em" }}>
                {e.n}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export const EXCHANGES_BY_REGION: { region: string; venues: string[] }[] = [
  { region: "Americas", venues: ["NYSE", "Nasdaq", "B3", "Bolsa Mexicana", "TSX"] },
  { region: "Europe", venues: ["Börse Frankfurt", "Deutsche Börse", "Euronext", "Borsa Italiana", "BME", "MOEX", "SIX", "LSE"] },
  { region: "Asia & Australia", venues: ["JPX", "HKEX", "KRX", "ASX", "SSE", "Shenzhen", "BSE", "NSE"] },
];
