import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:560}, deviceScaleFactor:2, reducedMotion:"reduce" });
const p = await ctx.newPage();
const errs=[]; p.on("console",m=>{if(m.type()==="error")errs.push(m.text())}); p.on("pageerror",e=>errs.push(String(e)));
await p.goto("http://localhost:1133/v0",{waitUntil:"networkidle",timeout:60000});
await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(1200); // let flags + first clock tick paint
// crop tight to the ticker band so flags are clearly visible
const band = await p.$('[aria-label="World markets — live local time and trading status"]');
if (band) { await band.screenshot({ path:"../screenshots/ticker-flags.png" }); }
await p.screenshot({ path:"../screenshots/ticker-hero.png" });
const imgs = await p.evaluate(() => {
  const f = Array.from(document.querySelectorAll('img[src^="/flags/"]'));
  return { count: f.length, firstLoaded: f[0]?.complete && f[0]?.naturalWidth > 0, sample: f.slice(0,3).map(i=>i.getAttribute('src')) };
});
console.log("flag imgs:", JSON.stringify(imgs), "| console errors:", errs.length?errs.join("; "):"none");
await b.close();
