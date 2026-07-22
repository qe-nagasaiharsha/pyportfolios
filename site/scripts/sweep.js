const { chromium } = require("playwright");
// Desktop sizes; these also stand in for common zoom levels (zoom ≈ smaller vp).
const sizes = [
  [1280, 720], [1366, 768], [1440, 900], [1536, 864],
  [1920, 1080], [2560, 1440], [1280, 1024],
];
const routes = ["/", "/literature"];
(async () => {
  const b = await chromium.launch();
  for (const route of routes) {
    for (const [w, h] of sizes) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto(`http://localhost:1133${route}`, { waitUntil: "load" });
      await p.waitForTimeout(700);
      const o = await p.evaluate(() => ({
        hOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      const tag = route === "/" ? "home" : "lit";
      console.log(`${tag} ${w}x${h}  hOverflow=${o.hOverflow}${o.hOverflow > 1 ? "  <-- BREAK" : ""}`);
      await p.screenshot({ path: `scripts/sw-${tag}-${w}x${h}.png`, fullPage: false });
      await p.close();
    }
  }
  await b.close();
  console.log("done");
})().catch((e) => { console.error(String(e)); process.exit(1); });
