"""Charts for the Kalman Filter Hedge Ratios note.

All five figures come from the article's own data module,
site/src/content/articles/data/kalman-filter-hedge-ratios.ts — real computed
results for EWA / EWC, 2010-2024, baked by quant/tutorials/t14_kalman.py.

  1  EWA & EWC normalised to 1.0                    (prices)
  2  Hedge ratio three ways                         (beta)
  3  Kalman-spread z-score with +/-2 sigma bands    (zscore)
  4  Sharpe gross vs net of 10bp                    (stats)
  5  Strategy equity net of costs                   (equity)
"""
import os

import numpy as np

import housestyle as hs

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "kalman-filter-hedge-ratios")
d = hs.load_data("kalman-filter-hedge-ratios")
P = d["params"]


def ticks_for(block, n):
    return [(int(round(f * (n - 1))), lab) for f, lab in block["xLabels"]]


# ------------------------------------------- 1 the two normalised series -----
p = d["prices"]
n = len(p["ewa"])
xi = np.arange(n)
tk = ticks_for(p, n)

fig, ax = hs.figure(1.95)
ax.plot(xi, p["ewa"], color=hs.NAVY, lw=1.3, label="EWA (Australia)")
ax.plot(xi, p["ewc"], color=hs.OCHRE, lw=1.3, label="EWC (Canada)")
ax.set_xticks([t[0] for t in tk])
ax.set_xticklabels([t[1] for t in tk])
ax.set_xlabel("Year")
ax.set_ylabel("Normalised to 1.0")
ax.set_xlim(0, n - 1)
ax.legend(loc="upper left", handlelength=1.8, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig1-prices.png")

# ------------------------------------------------ 2 the hedge ratio, 3 ways --
b = d["beta"]
n = len(b["kalman"])
xi = np.arange(n)
tk = ticks_for(b, n)

fig, ax = hs.figure(1.95)
ax.plot(xi, b["rolling"], color=hs.SLATE, lw=1.0, label="Rolling 252d OLS")
ax.plot(xi, b["kalman"], color=hs.NAVY, lw=1.5, label="Kalman filter")
ax.axhline(P["betaStatic"], color=hs.OCHRE, lw=1.2, ls="--",
           label="Full-sample OLS  %.2f" % P["betaStatic"])
ax.set_xticks([t[0] for t in tk])
ax.set_xticklabels([t[1] for t in tk])
ax.set_xlabel("Year")
ax.set_ylabel("Hedge ratio β")
ax.set_xlim(0, n - 1)
ax.legend(loc="upper left", handlelength=1.8, borderpad=0.2, labelspacing=0.3)
hs.style(ax)
hs.finish(fig, OUT, "fig2-beta.png")

# --------------------------------------------------------- 3 the z-score -----
z = d["zscore"]
n = len(z["z"])
xi = np.arange(n)
tk = ticks_for(z, n)

fig, ax = hs.figure(1.9)
ax.plot(xi, z["z"], color=hs.NAVY, lw=0.9, zorder=3)
ax.axhline(0, color=hs.AXIS, lw=0.7, zorder=1)
for s in (P["entryZ"], -P["entryZ"]):
    ax.axhline(s, color=hs.OCHRE, lw=1.0, ls="--", zorder=2)
ax.text(n - 1, P["entryZ"], " +2σ", va="center", fontsize=6.4, color=hs.OCHRE)
ax.text(n - 1, -P["entryZ"], " −2σ", va="center", fontsize=6.4, color=hs.OCHRE)
ax.set_xticks([t[0] for t in tk])
ax.set_xticklabels([t[1] for t in tk])
ax.set_xlabel("Year")
ax.set_ylabel("Spread z-score")
ax.set_xlim(0, n - 1)
hs.style(ax)
hs.finish(fig, OUT, "fig3-zscore.png")

# ------------------------------------------------ 4 Sharpe, gross vs net -----
s = d["stats"]
labels = ["Kalman", "Static OLS"]
gross = [s["gross"]["kalman"]["sharpe"], s["gross"]["static"]["sharpe"]]
net = [s["net"]["kalman"]["sharpe"], s["net"]["static"]["sharpe"]]
xi = np.arange(len(labels))
w = 0.36

fig, ax = hs.figure(1.85)
ax.bar(xi - w / 2, gross, w, color=hs.SLATE, label="Gross", zorder=2)
ax.bar(xi + w / 2, net, w, color=hs.NAVY, label="Net of 10bp", zorder=2)
ax.axhline(0, color=hs.AXIS, lw=0.8, zorder=3)
for i, (g, nn) in enumerate(zip(gross, net)):
    ax.text(i - w / 2, g + (0.03 if g >= 0 else -0.08), "%.2f" % g,
            ha="center", fontsize=6.6, color=hs.MUTED)
    ax.text(i + w / 2, nn + (0.03 if nn >= 0 else -0.08), "%.2f" % nn,
            ha="center", fontsize=6.6, color=hs.NAVY)
ax.set_xticks(xi)
ax.set_xticklabels(labels)
ax.set_ylabel("Sharpe ratio")
ax.legend(loc="upper right", handlelength=1.4, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig4-sharpe.png")

# ------------------------------------------------------ 5 net equity ---------
e = d["equity"]
n = len(e["kalman"])
xi = np.arange(n)
tk = ticks_for(e, n)

fig, ax = hs.figure(1.9)
ax.plot(xi, e["static"], color=hs.OCHRE, lw=1.4, label="Static OLS")
ax.plot(xi, e["kalman"], color=hs.NAVY, lw=1.4, label="Kalman")
ax.axhline(1.0, color=hs.AXIS, lw=0.7, zorder=1)
ax.set_xticks([t[0] for t in tk])
ax.set_xticklabels([t[1] for t in tk])
ax.set_xlabel("Year")
ax.set_ylabel("Growth of 1.0, net")
ax.set_xlim(0, n - 1)
ax.legend(loc="upper left", handlelength=1.8, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig5-equity.png")

print("wrote 5 figures")
print("  beta: static %.4f  Kalman %.4f-%.4f  rolling %.4f-%.4f"
      % (P["betaStatic"], P["betaKfMin"], P["betaKfMax"],
         P["betaRollMin"], P["betaRollMax"]))
print("  Sharpe gross", gross, " net", net)
