"""Charts for the CVaR / Expected Shortfall note.

All four figures come from the article's own data module,
site/src/content/articles/data/cvar-expected-shortfall.ts — real computed
results for HYG and VWO, 2007-2024, baked by quant/tutorials/t10_cvar.py.

  2   HYG returns with fitted Student-t, VaR and CVaR marks   (hist)
  3   99% VaR vs 99% CVaR per book                            (risk)
  5   HYG cumulative return through the GFC                   (gfc)
  6   The same 4% tail budget, two allocations                (rf)
"""
import os

import numpy as np

import housestyle as hs

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cvar-expected-shortfall")
d = hs.load_data("cvar-expected-shortfall")

# ------------------- 2 HYG returns, fitted t, and the two thresholds ---------
h = d["hist"]
edges = np.array(h["edges"], dtype=float)
counts = np.array(h["counts"], dtype=float)
centres = (edges[:-1] + edges[1:]) / 2
widths = np.diff(edges)

fig, ax = hs.figure(2.1)
ax.bar(centres * 100, counts, width=widths * 100, color=hs.NAVY, alpha=0.30,
       edgecolor=hs.NAVY, lw=0.25, zorder=2, label="HYG daily returns")
ax.plot(centres * 100, h["tOverlay"], color=hs.OCHRE, lw=1.4, zorder=3,
        label="Fitted Student-t (ν = 1.98)")
ax.axvline(h["var99"] * 100, color=hs.CLAY, lw=1.1, ls="--", zorder=4,
           label="99% VaR  2.09%")
ax.axvline(h["cvar99"] * 100, color=hs.MUTED, lw=1.1, ls=":", zorder=4,
           label="99% CVaR  3.37%")
ax.set_xlabel("Daily return (%)")
ax.set_ylabel("Number of days")
ax.set_xlim(edges[0] * 100, edges[-1] * 100)
ax.legend(loc="upper left", handlelength=1.8, borderpad=0.2, labelspacing=0.3)
hs.style(ax)
hs.finish(fig, OUT, "fig1-hyg-hist.png")

# ------------------------------------------ 3 VaR vs CVaR for the three books
r = d["risk"]
books = ["HYG", "VWO", "50/50"]
keys = ["HYG", "VWO", "PORT"]
var99 = [r[k]["var99"] * 100 for k in keys]
cvar99 = [r[k]["cvar99"] * 100 for k in keys]
xi = np.arange(len(books))
w = 0.36

fig, ax = hs.figure(1.9)
ax.bar(xi - w / 2, var99, w, color=hs.SLATE, label="99% VaR", zorder=2)
ax.bar(xi + w / 2, cvar99, w, color=hs.NAVY, label="99% CVaR", zorder=2)
for i, (a, b) in enumerate(zip(var99, cvar99)):
    ax.text(i - w / 2, a + 0.12, "%.1f" % a, ha="center", fontsize=6.4, color=hs.MUTED)
    ax.text(i + w / 2, b + 0.12, "%.1f" % b, ha="center", fontsize=6.4, color=hs.NAVY)
ax.set_xticks(xi)
ax.set_xticklabels(books)
ax.set_ylabel("Loss (% of value)")
ax.set_ylim(0, max(cvar99) * 1.2)
ax.legend(loc="upper left", handlelength=1.4, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig2-var-cvar.png")

# --------------------------------------- 5 HYG cumulative return, GFC --------
g = d["gfc"]
n = len(g["y"])
xi = np.arange(n)
ticks = [(int(round(f * (n - 1))), lab) for f, lab in g["xLabels"]]

fig, ax = hs.figure(1.95)
ax.fill_between(xi, g["y"], 1.0, where=[v < 1 for v in g["y"]],
                color=hs.NAVY, alpha=0.14, lw=0, zorder=1)
ax.plot(xi, g["y"], color=hs.NAVY, lw=1.4, zorder=3, label="HYG growth of \\$1")
ax.axhline(1.0, color=hs.MUTED, lw=0.9, ls="--", zorder=2, label="Start")
ax.set_xticks([p[0] for p in ticks])
ax.set_xticklabels([p[1] for p in ticks])
ax.set_xlabel("Year")
ax.set_ylabel("Growth of \\$1")
ax.set_xlim(0, n - 1)
ax.legend(loc="lower left", handlelength=1.8, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig3-gfc.png")

# ------------------------------------------ 6 the same budget, two desks -----
rf = d["rf"]
assets = ["HYG", "VWO"]
mv = [rf["mv"]["HYG"] * 100, rf["mv"]["VWO"] * 100]
cv = [rf["cvar"]["HYG"] * 100, rf["cvar"]["VWO"] * 100]
xi = np.arange(len(assets))
w = 0.36

fig, ax = hs.figure(1.85)
ax.bar(xi - w / 2, mv, w, color=hs.SLATE, label="MV desk", zorder=2)
ax.bar(xi + w / 2, cv, w, color=hs.NAVY, label="CVaR desk", zorder=2)
for i, (a, b) in enumerate(zip(mv, cv)):
    ax.text(i - w / 2, a + 1.5, "%.0f%%" % a, ha="center", fontsize=6.6, color=hs.MUTED)
    ax.text(i + w / 2, b + 1.5, "%.0f%%" % b, ha="center", fontsize=6.6, color=hs.NAVY)
ax.set_xticks(xi)
ax.set_xticklabels(assets)
ax.set_ylabel("Portfolio weight (%)")
ax.set_ylim(0, 100)
ax.legend(loc="upper center", handlelength=1.4, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig4-budget.png")

print("wrote 4 figures")
print("  VaR99 :", [round(v, 2) for v in var99])
print("  CVaR99:", [round(v, 2) for v in cvar99])
print("  MV desk %s / CVaR desk %s" % (mv, cv))
