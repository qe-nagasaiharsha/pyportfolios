import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "../screenshots";
mkdirSync(OUT, { recursive: true });
const URL = "http://localhost:3000/";

const browser = await chromium.launch();

async function shoot(name, { width, height, fullPage }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    reducedMotion: "reduce", // render infinite animations as clean static frames
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log("captured", name);
  await ctx.close();
}

await shoot("01-hero-desktop", { width: 1440, height: 900, fullPage: false });
await shoot("02-full-desktop", { width: 1440, height: 900, fullPage: true });
await shoot("03-mobile", { width: 390, height: 844, fullPage: true });

await browser.close();
console.log("done");
