"""Chart for the Risk Parity from Scratch note.

Drawn from the article's own data module,
site/src/content/articles/data/risk-parity-from-scratch.ts — the same numbers
the site's <Bar> renders. Nothing recomputed.

NOTE ON THE ARTICLE'S OWN INCONSISTENCY: the data module carries a four-ETF
universe (SPY, TLT, GLD, DBC) while the surrounding prose and DataTables
describe five futures (S&P 500, 10y Note, Gold, Copper, WTI). The site's chart
shows the four ETFs; this reproduces that faithfully rather than silently
reconciling the two. Flagged to the author.
"""
import os

import numpy as np

import housestyle as hs

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "risk-parity-futures")
d = hs.load_data("risk-parity-from-scratch")

assets = list(d["params"]["assets"])
naive = [v * 100 for v in d["naive"]["riskContrib"]]
erc = [v * 100 for v in d["erc"]["riskContrib"]]

x = np.arange(len(assets))
w = 0.38

fig, ax = hs.figure(2.1)
ax.bar(x - w / 2, naive, w, color=hs.SLATE, label="Equal weight", zorder=2)
ax.bar(x + w / 2, erc, w, color=hs.NAVY, label="Risk parity", zorder=2)
ax.set_xticks(x)
ax.set_xticklabels(assets)
ax.set_xlabel("Asset")
ax.set_ylabel("Share of portfolio risk (%)")
ax.legend(loc="upper left", handlelength=1.4, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig1-risk-share.png")

print("wrote fig1-risk-share.png")
print("  assets      :", assets)
print("  equal weight:", [round(v, 1) for v in naive])
print("  risk parity :", [round(v, 1) for v in erc])
