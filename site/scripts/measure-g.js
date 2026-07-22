const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2560, height: 1440 } });
  await page.goto("http://localhost:1133/", { waitUntil: "load" });
  await page.waitForTimeout(900);
  const m = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const range = document.createRange();
    range.selectNodeContents(h1);
    const r = range.getBoundingClientRect();
    return {
      gLeftPct: +(r.left / window.innerWidth * 100).toFixed(1),
      textWidthPct: +(r.width / window.innerWidth * 100).toFixed(1),
      fontPx: Math.round(parseFloat(getComputedStyle(h1).fontSize)),
    };
  });
  console.log(JSON.stringify(m));
  await browser.close();
})().catch((e) => { console.error(String(e)); process.exit(1); });
