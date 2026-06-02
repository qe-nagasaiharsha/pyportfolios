import { chromium } from "playwright";
const browser = await chromium.launch();

async function shoot(name, { fullPage }) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://localhost:8081/", { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `../screenshots/${name}.png`, fullPage });
  console.log("captured", name, "| console errors:", errors.length ? errors : "none");
  await ctx.close();
}

await shoot("classy-01-hero", { fullPage: false });
await shoot("classy-02-full", { fullPage: true });
await browser.close();
