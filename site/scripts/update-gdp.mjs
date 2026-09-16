/* Refresh src/data/gdp.json from the IMF World Economic Outlook.

   The Geographies map tooltip shows nominal GDP for the fifteen shaded
   countries. Those numbers used to be typed into the map generator by hand and
   went stale every time the IMF revised its outlook (April and October). This
   script asks the IMF DataMapper API for the current-year estimate of each
   country, in USD trillions to two decimals, and rewrites gdp.json only when a
   figure or the WEO release name has changed.

   Run by .github/workflows/update-gdp.yml once a day, and by hand with
   `npm run update-gdp`. Exits non-zero on any fetch or shape problem WITHOUT
   touching the file, so a bad day at the IMF leaves the site on the last good
   numbers rather than blank ones. No dependencies — Node's built-in fetch. */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../src/data/gdp.json");

/* ISO3 → the display name the map's data-market attribute carries. */
const COUNTRIES = {
  USA: "United States",
  CAN: "Canada",
  MEX: "Mexico",
  BRA: "Brazil",
  GBR: "United Kingdom",
  FRA: "France",
  DEU: "Germany",
  ITA: "Italy",
  ESP: "Spain",
  RUS: "Russia",
  IND: "India",
  CHN: "China",
  JPN: "Japan",
  KOR: "South Korea",
  AUS: "Australia",
};

const API = "https://www.imf.org/external/datamapper/api/v1";
const INDICATOR = "NGDPD"; // GDP, current prices, billions of USD

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const year = String(new Date().getUTCFullYear());

  const [data, meta] = await Promise.all([
    getJson(`${API}/${INDICATOR}/${Object.keys(COUNTRIES).join("/")}?periods=${year}`),
    getJson(`${API}/indicators`),
  ]);

  const series = data?.values?.[INDICATOR];
  if (!series) throw new Error("response has no NGDPD values");

  const values = {};
  const missing = [];
  for (const [iso, name] of Object.entries(COUNTRIES)) {
    const billions = series[iso]?.[year];
    if (typeof billions !== "number" || !Number.isFinite(billions)) {
      missing.push(iso);
      continue;
    }
    values[name] = Math.round(billions / 10) / 100; // billions → trillions, 2 dp
  }
  if (missing.length) throw new Error(`no ${year} figure for: ${missing.join(", ")}`);

  const source = meta?.indicators?.[INDICATOR]?.source;
  if (typeof source !== "string" || !source) throw new Error("indicator metadata has no source");

  const next = {
    source, // e.g. "World Economic Outlook (April 2026)"
    unit: "USD trillions, current prices",
    year: Number(year),
    values,
  };

  let prev = null;
  try {
    prev = JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    /* first run — no file yet */
  }
  const same =
    prev &&
    prev.source === next.source &&
    prev.year === next.year &&
    JSON.stringify(prev.values) === JSON.stringify(next.values);

  if (same) {
    console.log(`gdp.json already current (${next.source}, ${year}).`);
    return;
  }
  await writeFile(OUT, JSON.stringify(next, null, 2) + "\n");
  console.log(`gdp.json updated → ${next.source}, ${year} estimates.`);
  for (const [name, tn] of Object.entries(values)) console.log(`  ${name.padEnd(16)} ${tn.toFixed(2)} tn`);
}

main().catch((err) => {
  console.error(`update-gdp failed, file left unchanged: ${err.message}`);
  process.exit(1);
});
