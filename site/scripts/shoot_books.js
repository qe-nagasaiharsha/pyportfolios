const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto("http://localhost:5500/literature", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  // scroll to books grid
  await page.evaluate(() => document.querySelector("#books")?.scrollIntoView());
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "scripts/books-grid.png" });

  // count broken cover images
  const imgStats = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('#books img')];
    return {
      total: imgs.length,
      broken: imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute("alt")),
    };
  });
  console.log("cover imgs:", imgStats.total, "broken:", imgStats.broken.length, imgStats.broken.slice(0,6));

  // hover the first card to reveal the detail overlay
  const card = page.locator("#books article").first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await page.waitForTimeout(900);
  await page.screenshot({ path: "scripts/books-hover.png" });
  await browser.close();
  console.log("done");
})().catch((e) => { console.error(String(e)); process.exit(1); });
