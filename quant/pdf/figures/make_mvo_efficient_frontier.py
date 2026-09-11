"""Charts for the Mean-Variance Optimization note.

Both figures come from the article's own data module,
site/src/content/articles/data/mvo-efficient-frontier.ts — the same computed
results the site's <Heatmap> and <Scatter> render. Nothing recomputed.

  4.2  Correlation of daily returns, 2015-2024      (corr)
  4.4  Random portfolios, frontier, and the optima  (frontier)
"""
import os

import numpy as np

import housestyle as hs

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mvo-efficient-frontier")
d = hs.load_data("mvo-efficient-frontier")

# ----------------------------------------- 4.2 correlation matrix ------------
labels = list(d["corr"]["labels"])
vals = np.array(d["corr"]["values"], dtype=float)

fig, ax = hs.figure(2.45)
# origin="lower": the site draws this matrix with an ECharts category y-axis,
# which puts rows[0] at the bottom. imshow defaults to rows[0] at the top, which
# renders the published figure upside down. Same data either way — but the note
# has to look like the article.
im = ax.imshow(vals, cmap=hs.diverging(), vmin=-0.3, vmax=1.0, aspect="auto",
               origin="lower")
ax.set_xticks(range(len(labels)))
ax.set_yticks(range(len(labels)))
ax.set_xticklabels(labels)
ax.set_yticklabels(labels)
hs.annotate_cells(ax, vals)
ax.grid(False)
for s in ax.spines.values():
    s.set_visible(False)
ax.tick_params(length=0)
cb = fig.colorbar(im, ax=ax, fraction=0.022, pad=0.015)
cb.outline.set_visible(False)
cb.ax.tick_params(length=2, labelsize=6.5, colors=hs.MUTED)
hs.style(ax, xgrid=False, ygrid=False)
hs.finish(fig, OUT, "fig1-corr.png")

# ------------------------------------------- 4.4 the efficient frontier ------
cloud = np.array(d["frontier"]["cloud"], dtype=float)
line = np.array(d["frontier"]["line"], dtype=float)
cml = np.array(d["frontier"]["cml"], dtype=float)
assets = d["frontier"]["assets"]
ms, mv = d["frontier"]["maxSharpe"], d["frontier"]["minVol"]

fig, ax = hs.figure(2.6)
ax.scatter(cloud[:, 0] * 100, cloud[:, 1] * 100, s=3, color=hs.SLATE,
           alpha=0.30, lw=0, zorder=1, label="Random portfolios")
ax.plot(cml[:, 0] * 100, cml[:, 1] * 100, color=hs.MUTED, lw=1.0, ls="--",
        zorder=2, label="Capital market line")
ax.plot(line[:, 0] * 100, line[:, 1] * 100, color=hs.NAVY, lw=1.6,
        zorder=3, label="Efficient frontier")
ax.scatter([a["vol"] * 100 for a in assets], [a["ret"] * 100 for a in assets],
           s=22, color=hs.OCHRE, zorder=4, label="Individual ETFs")
for a in assets:
    ax.annotate(a["t"], (a["vol"] * 100, a["ret"] * 100),
                textcoords="offset points", xytext=(5, -1),
                fontsize=6.2, color=hs.MUTED)

for pt, lab, col in ((ms, "max Sharpe", hs.NAVY), (mv, "min variance", hs.CLAY)):
    ax.scatter([pt["vol"] * 100], [pt["ret"] * 100], s=42, marker="D",
               facecolor="white", edgecolor=col, lw=1.3, zorder=5)
    ax.annotate(lab, (pt["vol"] * 100, pt["ret"] * 100),
                textcoords="offset points", xytext=(7, 5),
                fontsize=6.6, color=col, fontweight="bold")

ax.set_xlabel("Annualised volatility (%)")
ax.set_ylabel("Annualised return (%)")
ax.legend(loc="lower right", handlelength=1.6, borderpad=0.25, labelspacing=0.35)
hs.style(ax)
hs.finish(fig, OUT, "fig2-frontier.png")

print("wrote fig1-corr.png, fig2-frontier.png")
print("  assets     :", labels)
print("  cloud pts  :", len(cloud), " frontier pts:", len(line))
print("  max Sharpe : vol %.1f%% ret %.1f%%" % (ms["vol"] * 100, ms["ret"] * 100))
print("  min variance: vol %.1f%% ret %.1f%%" % (mv["vol"] * 100, mv["ret"] * 100))
