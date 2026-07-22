const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 745 } });
  await page.goto("http://localhost:1133/", { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "scripts/hero-check.png", fullPage: false });
  await browser.close();
  console.log("ok");
})().catch((e) => { console.error(String(e)); process.exit(1); });
