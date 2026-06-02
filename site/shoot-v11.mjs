import { chromium } from "playwright";
const browser = await chromium.launch();

async function shoot(name, opts) {
  const ctx = await browser.newContext({
    viewport: { width: opts.w ?? 1440, height: opts.h ?? 900 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("http://localhost:1133/v11", { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `../screenshots/${name}.png`, fullPage: !!opts.full });
  console.log(`captured ${name} | console errors: ${errs.length ? errs.join("; ") : "none"}`);
  await ctx.close();
}

await shoot("v11-top", { full: false });
await shoot("v11-full", { full: true });
await shoot("v11-mobile", { full: true, w: 390, h: 844 });
await browser.close();
