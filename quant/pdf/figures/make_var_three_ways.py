"""Charts for the VaR Three Ways note.

All four figures come from the article's own data module,
site/src/content/articles/data/var-three-ways.ts — real computed results from
DAX daily returns, Jan 2010 to Dec 2024, seed 42, baked by
quant/tutorials/t09_var.py. Nothing recomputed here.

  3a  Return histogram with fitted t and the three 99% VaR markers  (histogram)
  3b  Left-tail densities: normal vs t vs empirical KDE             (tail)
  5a  Returns against the rolling 250d historical 99% VaR           (rolling)
  5b  Out-of-sample breaches per method vs expected                 (backtest)
"""
import os

import numpy as np

import housestyle as hs

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "var-three-ways")
d = hs.load_data("var-three-ways")

# ------------------------- 3a histogram of returns with the t overlay --------
h = d["histogram"]
edges = np.array(h["edges"], dtype=float)
counts = np.array(h["counts"], dtype=float)
centres = (edges[:-1] + edges[1:]) / 2
widths = np.diff(edges)

fig, ax = hs.figure(2.15)
ax.bar(centres * 100, counts, width=widths * 100, color=hs.NAVY, alpha=0.30,
       edgecolor=hs.NAVY, lw=0.25, zorder=2, label="DAX daily returns")
# the overlay is supplied on the same bin grid, scaled to the counts
ax.plot(centres * 100, h["tOverlay"], color=hs.OCHRE, lw=1.4, zorder=3,
        label="Fitted Student-t")
for key, col, style, lab in (
        ("normal", hs.CLAY, "--", "normal 2.82%"),
        ("hist", hs.MUTED, ":", "historical 3.42%"),
        ("t", hs.NAVY, "-", "t 3.40%")):
    ax.axvline(h["var99"][key] * 100, color=col, lw=1.0, ls=style, zorder=4,
               label="99% VaR — " + lab)
ax.set_xlabel("Daily return (%)")
ax.set_ylabel("Number of days")
ax.set_xlim(edges[0] * 100, edges[-1] * 100)
ax.legend(loc="upper left", handlelength=1.8, borderpad=0.2, labelspacing=0.3)
hs.style(ax)
hs.finish(fig, OUT, "fig1-histogram.png")

# --------------------------------------------- 3b the left-tail densities ----
t = d["tail"]
n = len(t["normal"])
x = np.linspace(t["x0"], t["x1"], n) * 100

fig, ax = hs.figure(1.95)
ax.plot(x, t["empirical"], color=hs.MUTED, lw=1.1, label="Empirical (KDE)")
ax.plot(x, t["normal"], color=hs.CLAY, lw=1.4, ls="--", label="Normal")
ax.plot(x, t["t"], color=hs.NAVY, lw=1.6, label="Student-t")
ax.set_xlabel("Daily return (%)")
ax.set_ylabel("Density")
ax.set_xlim(x[0], x[-1])
ax.legend(loc="upper left", handlelength=1.8, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig2-tail.png")

# ------------------------- 5a returns against the rolling 99% VaR line -------
r = d["rolling"]
m = len(r["ret"])
xi = np.arange(m)
ticks = [(int(round(f * (m - 1))), lab) for f, lab in r["xLabels"]]

fig, ax = hs.figure(2.05)
ax.plot(xi, [v * 100 for v in r["ret"]], color=hs.PATHGREY, lw=0.5,
        zorder=1, label="Daily return")
ax.plot(xi, [v * 100 for v in r["negVar"]], color=hs.NAVY, lw=1.3,
        zorder=2, label="Rolling 250d 99% VaR")
ax.axhline(0, color=hs.AXIS, lw=0.6, zorder=1)
ax.set_xticks([p[0] for p in ticks])
ax.set_xticklabels([p[1] for p in ticks])
ax.set_xlabel("Year")
ax.set_ylabel("Daily return (%)")
ax.set_xlim(0, m - 1)
ax.legend(loc="lower left", handlelength=1.8, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig3-rolling.png")

# ------------------------------------------- 5b breach counts per method -----
b = d["backtest"]
methods = ["Historical", "Normal", "Student-t", "Monte Carlo"]
breaches = [b["hist"]["breaches"], b["normal"]["breaches"],
            b["t"]["breaches"], b["mc"]["breaches"]]
xi = np.arange(len(methods))

fig, ax = hs.figure(1.95)
ax.bar(xi, breaches, 0.5, color=hs.NAVY, zorder=2, label="99% VaR breaches")
ax.axhline(b["expected"], color=hs.OCHRE, lw=1.2, ls="--", zorder=3,
           label="Expected %.1f" % b["expected"])
for i, v in enumerate(breaches):
    ax.text(i, v + 1.5, str(v), ha="center", fontsize=6.8, color=hs.INK)
ax.set_xticks(xi)
ax.set_xticklabels(methods)
ax.set_ylabel("99% VaR breaches")
ax.set_ylim(0, max(breaches) * 1.22)
ax.legend(loc="upper right", handlelength=1.6, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig4-breaches.png")

print("wrote 4 figures")
print("  breaches:", dict(zip(methods, breaches)), "expected", b["expected"])
print("  99%% VaR: hist %.4f  normal %.4f  t %.4f" %
      (d["var"]["99"]["histVar"], d["var"]["99"]["normalVar"], d["var"]["99"]["tVar"]))
