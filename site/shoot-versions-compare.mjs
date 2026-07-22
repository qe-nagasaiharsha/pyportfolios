import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:1133";
const OUT = "C:/Users/Yonishwari/Desktop/Projects/pyportfolios/version-shots";
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  { id: "v0", url: "/" },
  { id: "v1", url: "/v1" },
  { id: "v2", url: "/v2" },
  { id: "v3", url: "/v3" },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce", // show all content in final state (skip scroll-reveal hiding)
});
const page = await ctx.newPage();

for (const p of PAGES) {
  await page.goto(BASE + p.url, { waitUntil: "networkidle" });
  // nudge scroll to trigger any lazy bits, then back to top
  await page.evaluate(async () => {
    await new Promise((r) => setTimeout(r, 400));
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 400));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
  const full = `${OUT}/${p.id}-full.png`;
  await page.screenshot({ path: full, fullPage: true });
  // also a viewport (hero) shot for quick comparison
  const hero = `${OUT}/${p.id}-hero.png`;
  await page.screenshot({ path: hero, fullPage: false });
  console.log("shot", p.id, "->", full);
}

await browser.close();
console.log("DONE", OUT);
