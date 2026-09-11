"""Charts for the Black-Litterman note.

Both figures come from the article's own data module,
site/src/content/articles/data/black-litterman-equilibrium-views.ts — the same
computed results the site's <Bar> components render. Nothing recomputed.

  4.3  Implied prior vs posterior expected returns   (returns)
  4.4  Market prior vs Black-Litterman vs naive MVO  (weights)

NOTE: the data module and the article's DataTables disagree in places (the
module's market weights are 39.5/13.4/19.8/10.8/16.6%, the tables print
37.7/15.7/18.9/10.1/17.6%). The site's charts render the module, so these do
too; the tables in the PDF stay as the article prints them. Flagged to the
author — one of the two is stale.
"""
import os

import numpy as np

import housestyle as hs

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "black-litterman")
d = hs.load_data("black-litterman-equilibrium-views")

countries = list(d["params"]["countries"])
x = np.arange(len(countries))

# ------------------------------ 4.3 prior vs posterior expected returns ------
prior = [v * 100 for v in d["returns"]["prior"]]
post = [v * 100 for v in d["returns"]["posterior"]]

w = 0.38
fig, ax = hs.figure(2.05)
ax.bar(x - w / 2, prior, w, color=hs.SLATE, label="Implied prior", zorder=2)
ax.bar(x + w / 2, post, w, color=hs.NAVY, label="Posterior", zorder=2)
ax.set_xticks(x)
ax.set_xticklabels(countries)
ax.set_xlabel("Market")
ax.set_ylabel("Expected return (%)")
ax.legend(loc="upper left", handlelength=1.4, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig1-returns.png")

# ---------------------------------------------- 4.4 the three allocations ----
mkt = [v * 100 for v in d["weights"]["market"]]
bl = [v * 100 for v in d["weights"]["blUnc"]]
mvo = [v * 100 for v in d["weights"]["histUnc"]]

w = 0.27
fig, ax = hs.figure(2.15)
ax.bar(x - w, mkt, w, color=hs.SLATE, label="Market prior", zorder=2)
ax.bar(x, bl, w, color=hs.NAVY, label="Black-Litterman", zorder=2)
ax.bar(x + w, mvo, w, color=hs.OCHRE, label="Naive MVO", zorder=2)
ax.axhline(0, color=hs.AXIS, lw=0.7, zorder=3)
ax.set_xticks(x)
ax.set_xticklabels(countries)
ax.set_xlabel("Market")
ax.set_ylabel("Portfolio weight (%)")
ax.legend(loc="lower left", handlelength=1.4, borderpad=0.2)
hs.style(ax)
hs.finish(fig, OUT, "fig2-weights.png")

print("wrote fig1-returns.png, fig2-weights.png")
print("  countries:", countries)
print("  prior    :", [round(v, 1) for v in prior])
print("  posterior:", [round(v, 1) for v in post])
print("  naive MVO:", [round(v, 1) for v in mvo], " (note the shorts)")
