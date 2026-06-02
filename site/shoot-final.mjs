import { chromium } from "playwright";
const browser = await chromium.launch();
async function shoot(name, path) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(`http://localhost:1133${path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `../screenshots/${name}.png`, fullPage: true });
  console.log(`${name} | console errors: ${errs.length ? errs.join("; ") : "none"}`);
  await ctx.close();
}
await shoot("final-v0", "/v0");
await shoot("final-v4", "/v4");
await browser.close();
