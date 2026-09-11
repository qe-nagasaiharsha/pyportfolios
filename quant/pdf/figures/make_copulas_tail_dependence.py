"""Charts for the Copulas & Tail Dependence note.

All four figures come from the article's own data module,
site/src/content/articles/data/copulas-tail-dependence.ts — real computed
results for ^GSPC / ^FTSE / ^N225 weekly returns, 2000-2024, baked by
quant/tutorials/t11_copulas.py.

  1  Kendall's tau matrix                             (corr.kendall)
  2  Pseudo-observations, SPX vs FTSE                  (pseudo.pts)
  4  Joint-crash ratio at 5%: data vs models           (tail)
  5  P(both in worst decile | one is), per pair        (pairs)
"""
import os

import numpy as np

import housestyle as hs

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "copulas-tail-dependence")
d = hs.load_data("copulas-tail-dependence")

# --------------------------------------------------- 1 Kendall's tau ---------
labels = list(d["corr"]["labels"])
tau = np.array(d["corr"]["kendall"], dtype=float)

fig, ax = hs.figure(1.9)
# origin="lower" to match the site's ECharts y-axis, which starts at rows[0]
# on the bottom. See make_mvo_efficient_frontier.py.
im = ax.imshow(tau, cmap=hs.sequential(), vmin=0, vmax=1, aspect="auto",
               origin="lower")
ax.set_xticks(range(len(labels)))
ax.set_yticks(range(len(labels)))
ax.set_xticklabels(labels)
ax.set_yticklabels(labels)
hs.annotate_cells(ax, tau)
ax.grid(False)
for s in ax.spines.values():
    s.set_visible(False)
ax.tick_params(length=0)
cb = fig.colorbar(im, ax=ax, fraction=0.022, pad=0.015)
cb.outline.set_visible(False)
cb.ax.tick_params(length=2, labelsize=6.5, colors=hs.MUTED)
hs.style(ax, xgrid=False, ygrid=False)
hs.finish(fig, OUT, "fig1-kendall.png")

# ------------------------------------- 2 pseudo-observations on the square ---
pts = np.array(d["pseudo"]["pts"], dtype=float)

fig, ax = hs.figure(2.35)
ax.scatter(pts[:, 0], pts[:, 1], s=6, color=hs.NAVY, alpha=0.45, lw=0, zorder=2)
for v in (0.05,):
    ax.axvline(v, color=hs.OCHRE, lw=0.9, ls="--", zorder=3)
    ax.axhline(v, color=hs.OCHRE, lw=0.9, ls="--", zorder=3)
ax.set_xlabel("u = F(SPX weekly return)")
ax.set_ylabel("v = F(FTSE)")
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.set_aspect("equal", adjustable="box")
hs.style(ax, xgrid=True)
hs.finish(fig, OUT, "fig2-pseudo.png")

# ------------------------------------- 4 joint-crash ratio, data vs models ---
pairs = [p.replace("–", "–") for p in d["tail"]["pairs"]]
emp = [v * 100 for v in d["tail"]["empirical"]["q05"]]
gau = [v * 100 for v in d["tail"]["gauss"]["q05"]]
tl = [v * 100 for v in d["tail"]["tLambda"]]
xi = np.arange(len(pairs))
w = 0.27

fig, ax = hs.figure(1.95)
ax.bar(xi - w, emp, w, color=hs.NAVY, label="Empirical", zorder=2)
ax.bar(xi, tl, w, color=hs.OCHRE, label="t-copula λ", zorder=2)
ax.bar(xi + w, gau, w, color=hs.SLATE, label="Gaussian copula", zorder=2)
ax.set_xticks(xi)
ax.set_xticklabels(pairs)
ax.set_ylabel("Joint-crash ratio at 5% (%)")
ax.legend(loc="upper right", handlelength=1.4, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig3-jointcrash.png")

# ------------------------------ 5 conditional worst-decile crash probability -
pr = d["pairs"]
names = [p["pair"].replace("–", "–") for p in pr]
cond = [p["condCrash"] * 100 for p in pr]
xi = np.arange(len(names))

fig, ax = hs.figure(1.85)
ax.bar(xi, cond, 0.46, color=hs.NAVY, zorder=2, label="P(both | one)")
ax.axhline(10, color=hs.OCHRE, lw=1.2, ls="--", zorder=3,
           label="Independence 10%")
for i, (v, p) in enumerate(zip(cond, pr)):
    ax.text(i, v + 1.2, "%.0f%%  (%d/%d)" % (v, p["nBoth"], p["nCond"]),
            ha="center", fontsize=6.4, color=hs.INK)
ax.set_xticks(xi)
ax.set_xticklabels(names)
ax.set_ylabel("P(both in worst decile | one is)  %")
ax.set_ylim(0, max(cond) * 1.28)
ax.legend(loc="upper right", handlelength=1.4, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig4-condcrash.png")

print("wrote 4 figures")
print("  pairs      :", names)
print("  empirical  :", [round(v, 1) for v in emp])
print("  t lambda   :", [round(v, 1) for v in tl])
print("  gaussian   :", [round(v, 1) for v in gau])
print("  cond crash :", [round(v, 1) for v in cond])
