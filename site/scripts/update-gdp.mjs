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
   numbers rather than blank ones. No dependencies — Node's built-in fetch.

   FAILURE POLICY. A blip (timeout, 5xx, connection reset) is retried twice
   with a pause, because the IMF's CDN does have bad minutes and one of those
   should not cost a whole day. A refusal (403) or a missing endpoint (404) is
   NOT retried: those are policy or a moved service, hammering them changes
   nothing, and the error message says which it was so the fix is obvious. */

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

/* The IMF ignores the version segment — /api/v1, /api/v2 and /api/anything
   all answer identically (checked 18 Sep 2026). So a version bump on their
   side will not break this; only a move of the whole service would. */
const API = "https://www.imf.org/external/datamapper/api/v1";
const INDICATOR = "NGDPD"; // GDP, current prices, billions of USD

/* A named user-agent: the IMF sits behind a CDN that refuses the bare "node"
   default with a 403 (it did, 16 Sep 2026), and it tells them who is asking. */
const HEADERS = {
  accept: "application/json",
  "user-agent": "pyportfolios-gdp-refresh/1.0 (+https://pyportfolios.com; GitHub Actions)",
};

const ATTEMPTS = 3;
const RETRY_AFTER_MS = [5_000, 15_000]; // pause before attempt 2, then 3
/* Statuses worth a second try. Anything else in 4xx is a decision, not a blip. */
const TRANSIENT = new Set([408, 425, 429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* What went wrong, in words that point at the fix. */
function explain(status) {
  if (status === 403) return "the IMF refused the request — its CDN no longer accepts our user-agent (HEADERS above)";
  if (status === 404) return "the endpoint was not found — the IMF may have moved the API (API constant above)";
  return null;
}

async function getJson(url) {
  let last;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30_000) });
      if (res.ok) return res.json();

      const body = (await res.text().catch(() => "")).slice(0, 200).replace(/\s+/g, " ");
      const why = explain(res.status);
      const err = new Error(
        `${url} → HTTP ${res.status}${why ? ` — ${why}` : ""}${body && !why ? ` (${body})` : ""}`,
      );
      err.transient = TRANSIENT.has(res.status);
      throw err;
    } catch (err) {
      last = err;
      /* Network-level failures (DNS, reset, timeout) carry no status: transient. */
      const transient = err.transient ?? true;
      if (!transient || attempt === ATTEMPTS) break;
      const wait = RETRY_AFTER_MS[attempt - 1];
      console.log(`attempt ${attempt} failed (${err.message.split(" — ")[0]}); retrying in ${wait / 1000}s`);
      await sleep(wait);
    }
  }
  throw last;
}

async function main() {
  const year = String(new Date().getUTCFullYear());

  const [data, meta] = await Promise.all([
    getJson(`${API}/${INDICATOR}/${Object.keys(COUNTRIES).join("/")}?periods=${year}`),
    getJson(`${API}/indicators`),
  ]);

  const series = data?.values?.[INDICATOR];
  if (!series) throw new Error("response has no NGDPD values — the IMF may have changed the response shape");

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
  const msg = `update-gdp failed, file left unchanged: ${err.message}`;
  console.error(msg);
  /* On GitHub Actions this line becomes an annotation on the run, which is
     visible on a public repo without signing in — the step log itself is not.
     The workflow also turns it into a GitHub Issue, so a failure that repeats
     every morning is one open issue, not thirty unread emails. */
  if (process.env.GITHUB_ACTIONS) console.log(`::error::${msg}`);
  process.exit(1);
});
