"""Charts for the Bond Pricing, Duration & Convexity note.

All three figures come from the article's own data module,
site/src/content/articles/data/bond-pricing-duration-convexity.ts — the same
computed results the site's <Line> and <Bar> components render.

  4.1  Price vs yield, with the duration tangent   (priceYield)
  4.3  SHY / IEF / TLT through 2022, indexed       (etf2022)
  4.4  Taylor approximation quality, 30y bond      (stress)
"""
import os

import numpy as np

import housestyle as hs

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bond-duration-convexity")
d = hs.load_data("bond-pricing-duration-convexity")

# ------------------------------------------- 4.1 price vs yield --------------
py = d["priceYield"]
y = py["yPct"]

fig, ax = hs.figure(2.1)
ax.plot(y, py["price"], color=hs.NAVY, lw=1.5, label="Price", zorder=3)
ax.plot(y, py["tangent"], color=hs.MUTED, lw=1.1, ls="--",
        label="Duration tangent", zorder=2)
ax.set_xlabel("Yield (%)")
ax.set_ylabel("Price")
ax.set_xlim(min(y), max(y))
ax.legend(loc="upper right", handlelength=1.8, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig1-price-yield.png")

# --------------------------------------- 4.3 the three ETFs through 2022 -----
e = d["etf2022"]
n = len(e["shy"])
x = np.arange(n)
ticks = [(int(round(f * (n - 1))), lab) for f, lab in e["xLabels"]]

fig, ax = hs.figure(2.1)
ax.plot(x, e["shy"], color=hs.NAVY, lw=1.3, label="SHY  (1.9y duration)")
ax.plot(x, e["ief"], color=hs.OCHRE, lw=1.3, label="IEF  (7.5y)")
ax.plot(x, e["tlt"], color=hs.CLAY, lw=1.3, label="TLT  (17.5y)")
ax.axhline(100, color=hs.AXIS, lw=0.7, zorder=1)
ax.set_xticks([t[0] for t in ticks])
ax.set_xticklabels([t[1] for t in ticks])
ax.set_xlabel("2022")
ax.set_ylabel("Indexed to 100")
ax.set_xlim(0, n - 1)
ax.legend(loc="lower left", handlelength=1.8, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig2-etf2022.png")

# ------------------------------------ 4.4 Taylor approximation quality -------
rows = d["stress"]["rows"]
labels = ["%s%dbp" % ("+" if r["bp"] > 0 else "", r["bp"]) for r in rows]
xi = np.arange(len(rows))
w = 0.27

fig, ax = hs.figure(2.05)
ax.bar(xi - w, [r["durOnly"] for r in rows], w, color=hs.SLATE,
       label="Duration only", zorder=2)
ax.bar(xi, [r["durConv"] for r in rows], w, color=hs.NAVY,
       label="Duration + convexity", zorder=2)
ax.bar(xi + w, [r["full"] for r in rows], w, color=hs.OCHRE,
       label="Actual", zorder=2)
ax.axhline(0, color=hs.AXIS, lw=0.7, zorder=3)
ax.set_xticks(xi)
ax.set_xticklabels(labels)
ax.set_xlabel("Yield shock")
ax.set_ylabel("Price change (%)")
ax.legend(loc="lower left", handlelength=1.4, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig3-taylor.png")

print("wrote fig1-price-yield.png, fig2-etf2022.png, fig3-taylor.png")
print("  2022 totals:", {k: round(v * 100, 1) for k, v in d["etf2022"]["totals"].items()})
print("  stress rows:", labels)
