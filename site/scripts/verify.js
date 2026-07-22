const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  // 2560x1440 = native 27"; the others = 150% and 200% zoom on that screen.
  for (const [w, h, label] of [[2560, 1440, "27in-100%"], [1707, 960, "27in-150%"], [1280, 720, "27in-200%"]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto("http://localhost:1133/", { waitUntil: "load" });
    await page.waitForTimeout(900);
    const m = await page.evaluate(() => {
      const hero = document.querySelector("main > section").getBoundingClientRect();
      const h1 = document.querySelector("h1").getBoundingClientRect();
      const btn = document.querySelector('a[href="#early-access"]').getBoundingClientRect();
      const tick = document.querySelector("#world-clock").getBoundingClientRect();
      return {
        headingMidPct: Math.round(((h1.top + h1.bottom) / 2 - hero.top) / hero.height * 100),
        btnClearsTicker: Math.round(tick.top - btn.bottom), // >0 = gap above ticker
      };
    });
    console.log(`${label} (${w}x${h})  headingMid=${m.headingMidPct}%  btn→ticker gap=${m.btnClearsTicker}px${m.btnClearsTicker < 0 ? "  OVERLAP!" : ""}`);
    if (label === "27in-100%") await page.screenshot({ path: "scripts/hero-27.png", fullPage: false });
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error(String(e)); process.exit(1); });
