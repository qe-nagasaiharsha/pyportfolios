import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "../screenshots";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:1133";
const PAGES = ["", "v0", "v1", "v2", "v3", "v4", "v5"];

const browser = await chromium.launch();
let totalErrors = 0;

for (const p of PAGES) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));
  const url = p ? `${BASE}/${p}` : `${BASE}/`;
  const name = p || "index";
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/ver-${name}.png`, fullPage: true });
    totalErrors += errs.length;
    console.log(`captured ver-${name} | console errors: ${errs.length ? errs.join("; ") : "none"}`);
  } catch (e) {
    console.log(`FAILED ${name}: ${String(e).split("\n")[0]}`);
  }
  await ctx.close();
}

await browser.close();
console.log(`done | total console errors across all pages: ${totalErrors}`);
