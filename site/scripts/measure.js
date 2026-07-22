const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[1880, 900], [1440, 768], [1280, 1024]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto("http://localhost:1133/", { waitUntil: "load" });
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => {
      const header = document.querySelector("header");
      const hero = document.querySelector("main > section");
      const tick = document.querySelector("#world-clock");
      const hh = (e) => (e ? Math.round(e.getBoundingClientRect().height) : null);
      const bottom = (e) => (e ? Math.round(e.getBoundingClientRect().bottom) : null);
      return { nav: hh(header), hero: hh(hero), tick: hh(tick), tickBottom: bottom(tick), vh: window.innerHeight };
    });
    console.log(`${w}x${h}  nav=${m.nav}  hero=${m.hero}  ticker=${m.tick}  tickerBottom=${m.tickBottom}  vh=${m.vh}  spaceAfter=${m.vh - m.tickBottom}`);
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error(String(e)); process.exit(1); });
