import { chromium } from "playwright";
const browser = await chromium.launch();

async function shoot(name, path) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 720 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(`http://localhost:1133${path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `../screenshots/${name}.png` }); // viewport only → shows sticky top
  console.log(`captured ${name} | console errors: ${errs.length ? errs.join("; ") : "none"}`);
  await ctx.close();
}

await shoot("toggle-home", "/");   // v0 active
await shoot("toggle-v4", "/v4");   // v4 active → map version
await browser.close();
