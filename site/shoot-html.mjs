import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

const OUT = "../screenshots";
mkdirSync(OUT, { recursive: true });
const fileUrl = pathToFileURL("../pyportfolios.html").href;

const browser = await chromium.launch();

async function shoot(name, { width, height, fullPage }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900); // let Tailwind browser build inject + fonts settle
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log("captured", name, "| console errors:", errors.length ? errors : "none");
  await ctx.close();
}

await shoot("html-01-hero", { width: 1440, height: 900, fullPage: false });
await shoot("html-02-full", { width: 1440, height: 900, fullPage: true });

await browser.close();
console.log("done");
