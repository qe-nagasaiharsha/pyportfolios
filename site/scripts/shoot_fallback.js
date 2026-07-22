const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
  await p.goto("http://localhost:8099/literature.html", { waitUntil: "networkidle" });
  await p.evaluate(() => document.querySelector("#books")?.scrollIntoView());
  await p.waitForTimeout(700);
  await p.getByRole("button", { name: /Machine Learning/ }).click();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: "scripts/books-ml.png" });
  await b.close(); console.log("done");
})().catch(e => { console.error(String(e)); process.exit(1); });
