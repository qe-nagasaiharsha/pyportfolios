"""Charts for the SMA Crossover Backtest note.

All five figures come from the article's own data module,
site/src/content/articles/data/sma-crossover-backtest.ts — real computed
results for QQQ and BTC-USD, 2015-2024, baked by quant/tutorials/t13_sma.py.

  3a/3b  Growth of $100, log scale, per asset      (eqLog)
  4a/4b  Sharpe grid, fast x slow, shared scale    (grid)
  5      Sharpe vs per-side cost                   (costs)

The grids carry a sentinel (-9.99) where fast >= slow, i.e. the pair is not a
valid system. Those cells are masked out rather than plotted as a huge negative.
"""
import os

import numpy as np

import housestyle as hs

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sma-crossover-backtest")
d = hs.load_data("sma-crossover-backtest")
P = d["params"]
SENT = P["sentinel"]


def equity(block, name, fname):
    n = len(block["eqLog"]["strategy"])
    xi = np.arange(n)
    ticks = [(int(round(f * (n - 1))), lab) for f, lab in block["eqLog"]["xLabels"]]
    fig, ax = hs.figure(2.0)
    ax.plot(xi, block["eqLog"]["buyhold"], color=hs.SLATE, lw=1.1,
            label="Buy & hold")
    ax.plot(xi, block["eqLog"]["strategy"], color=hs.NAVY, lw=1.5,
            label="50/200 crossover")
    ax.set_yscale("log")
    ax.set_xticks([t[0] for t in ticks])
    ax.set_xticklabels([t[1] for t in ticks])
    ax.set_xlabel("Year")
    ax.set_ylabel("Growth of \\$100 (log)")
    ax.set_xlim(0, n - 1)
    ax.legend(loc="upper left", handlelength=1.8, borderpad=0.2)
    hs.style(ax)
    hs.finish(fig, OUT, fname)


equity(d["qqq"], "QQQ", "fig1-qqq-equity.png")
equity(d["btc"], "BTC", "fig2-btc-equity.png")


def grid(block, fname, bh):
    g = np.array(block["grid"], dtype=float)
    masked = np.ma.masked_where(np.isclose(g, SENT), g)
    fig, ax = hs.figure(1.95)
    cmap = hs.sequential()
    cmap.set_bad("#f4f4f4")          # invalid pairs (fast >= slow)
    # origin="lower" to match the site's ECharts y-axis, which starts at
    # fasts[0] on the bottom. See make_mvo_efficient_frontier.py.
    im = ax.imshow(masked, cmap=cmap, vmin=P["gridLo"], vmax=P["gridHi"],
                   aspect="auto", origin="lower")
    ax.set_xticks(range(len(P["slows"])))
    ax.set_yticks(range(len(P["fasts"])))
    ax.set_xticklabels([str(s) for s in P["slows"]])
    ax.set_yticklabels([str(f) for f in P["fasts"]])
    ax.set_xlabel("Slow SMA")
    ax.set_ylabel("Fast SMA")
    lo, hi = P["gridLo"], P["gridHi"]
    for i in range(g.shape[0]):
        for j in range(g.shape[1]):
            if np.isclose(g[i, j], SENT):
                ax.text(j, i, "—", ha="center", va="center", fontsize=6.4,
                        color=hs.AXIS)
            else:
                norm = (g[i, j] - lo) / (hi - lo)
                ax.text(j, i, "%.2f" % g[i, j], ha="center", va="center",
                        fontsize=6.4,
                        color="white" if norm > 0.78 else hs.INK)
    ax.grid(False)
    for s in ax.spines.values():
        s.set_visible(False)
    ax.tick_params(length=0)
    cb = fig.colorbar(im, ax=ax, fraction=0.022, pad=0.015)
    cb.outline.set_visible(False)
    cb.ax.tick_params(length=2, labelsize=6.5, colors=hs.MUTED)
    cb.ax.axhline(bh, color=hs.OCHRE, lw=1.1)
    hs.style(ax, xgrid=False, ygrid=False)
    hs.finish(fig, OUT, fname)


grid(d["qqq"], "fig3-qqq-grid.png", d["qqq"]["stats"]["buyhold"]["sharpe"])
grid(d["btc"], "fig4-btc-grid.png", d["btc"]["stats"]["buyhold"]["sharpe"])

# -------------------------------------------------- 5 Sharpe vs cost --------
x = [0, 10, 25]
qc, bc = d["qqq"]["costs"], d["btc"]["costs"]

fig, ax = hs.figure(1.95)
ax.plot(x, [qc[0]["s0"], qc[0]["s10"], qc[0]["s25"]], color=hs.NAVY, lw=1.6,
        marker="o", ms=3, label="QQQ %s" % qc[0]["pair"])
ax.plot(x, [qc[1]["s0"], qc[1]["s10"], qc[1]["s25"]], color=hs.NAVY, lw=1.2,
        ls="--", marker="o", ms=3, label="QQQ %s" % qc[1]["pair"])
ax.plot(x, [bc[0]["s0"], bc[0]["s10"], bc[0]["s25"]], color=hs.OCHRE, lw=1.6,
        marker="s", ms=3, label="BTC %s" % bc[0]["pair"])
ax.plot(x, [bc[1]["s0"], bc[1]["s10"], bc[1]["s25"]], color=hs.OCHRE, lw=1.2,
        ls="--", marker="s", ms=3, label="BTC %s" % bc[1]["pair"])
ax.set_xlabel("Cost per side (bp)")
ax.set_ylabel("Sharpe")
ax.set_xticks(x)
ax.legend(loc="center right", handlelength=1.8, borderpad=0.2, labelspacing=0.3)
hs.style(ax)
hs.finish(fig, OUT, "fig5-costs.png")

print("wrote 5 figures")
print("  QQQ grid  %.2f-%.2f, %d/%d above buy-and-hold %.2f"
      % (d["qqq"]["gridWorst"], d["qqq"]["gridBest"], d["qqq"]["gridAboveBH"],
         d["qqq"]["gridCells"], d["qqq"]["stats"]["buyhold"]["sharpe"]))
print("  BTC grid  %.2f-%.2f, %d/%d above buy-and-hold %.2f"
      % (d["btc"]["gridWorst"], d["btc"]["gridBest"], d["btc"]["gridAboveBH"],
         d["btc"]["gridCells"], d["btc"]["stats"]["buyhold"]["sharpe"]))
