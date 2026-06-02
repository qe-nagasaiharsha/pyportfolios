import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "../reference";
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: "framer-home", url: "https://expensive-sparrow-736232.framer.app/home" },
  { name: "framer-article", url: "https://expensive-sparrow-736232.framer.app/article-page" },
];

const browser = await chromium.launch();

for (const p of PAGES) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  try {
    await page.goto(p.url, { waitUntil: "networkidle", timeout: 60000 });
    // trigger lazy-loaded Framer sections by scrolling through the page
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0;
        const step = () => {
          window.scrollBy(0, 600);
          y += 600;
          if (y < document.body.scrollHeight) setTimeout(step, 120);
          else { window.scrollTo(0, 0); setTimeout(resolve, 400); }
        };
        step();
      });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${p.name}.png`, fullPage: true });
    console.log("captured", p.name);
  } catch (e) {
    console.log("FAILED", p.name, String(e).split("\n")[0]);
  }
  await ctx.close();
}

await browser.close();
console.log("done");
