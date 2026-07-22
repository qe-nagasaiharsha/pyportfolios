const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await p.goto("http://localhost:5500/", { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  // horizontal overflow check
  const of = await p.evaluate(() => ({ docW: document.documentElement.scrollWidth, winW: window.innerWidth, overflow: document.documentElement.scrollWidth > window.innerWidth+2 }));
  console.log("overflow:", JSON.stringify(of));
  await p.screenshot({ path: "scripts/mob-hero.png", clip:{x:0,y:0,width:390,height:520} });
  // scroll to a few sections
  await p.evaluate(()=>{const h=[...document.querySelectorAll('span,h3')].find(e=>/Exchanges, Instruments/.test(e.textContent)); h?.scrollIntoView();});
  await p.waitForTimeout(500);
  await p.screenshot({ path: "scripts/mob-markets.png", clip:{x:0,y:0,width:390,height:700} });
  await p.evaluate(()=>{const h=[...document.querySelectorAll('h3')].find(e=>/Choose the plan/.test(e.textContent)); h?.scrollIntoView();});
  await p.waitForTimeout(500);
  await p.screenshot({ path: "scripts/mob-pricing.png", clip:{x:0,y:0,width:390,height:700} });
  await b.close();
})().catch(e=>{console.error(String(e));process.exit(1);});
