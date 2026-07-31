"""
gen_og_image.py - the site's social-share card (site/public/og.png, 1200x630).

Brand: navy ground, pearl display type, aqua accent, courier eyebrow - matches
the landing hero. Deterministic matplotlib render, no external assets.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "site" / "public" / "og.png"

NAVY = "#0b1020"
PEARL = "#e8ecf4"
AQUA = "#2bd4c4"
MIST = "#8b94a7"

fig = plt.figure(figsize=(12, 6.3), dpi=100)
fig.patch.set_facecolor(NAVY)
ax = fig.add_axes([0, 0, 1, 1])
ax.set_facecolor(NAVY)
ax.set_xlim(0, 12)
ax.set_ylim(0, 6.3)
ax.axis("off")

# faint grid-paper texture
for x in [i * 0.75 for i in range(1, 16)]:
    ax.axvline(x, color=PEARL, alpha=0.03, lw=0.8)
for y in [i * 0.75 for i in range(1, 9)]:
    ax.axhline(y, color=PEARL, alpha=0.03, lw=0.8)

# an equity-curve stroke, drawn from fixed points (brand motif)
xs = [0.9, 1.7, 2.5, 3.2, 4.0, 4.8, 5.5, 6.3, 7.1, 7.8, 8.6, 9.4, 10.2, 11.0]
ys = [1.05, 1.25, 1.15, 1.45, 1.35, 1.7, 1.55, 1.9, 2.1, 1.95, 2.3, 2.55, 2.45, 2.85]
ax.plot(xs, ys, color=AQUA, lw=2.4, solid_capstyle="round", alpha=0.9)
ax.plot(xs[-1], ys[-1], "o", color=AQUA, ms=7)
ax.fill_between(xs, 0.55, ys, color=AQUA, alpha=0.05)

# eyebrow
ax.text(0.9, 5.35, "//  QUANT FINANCE · RUNNABLE PYTHON · REAL DATA",
        color=AQUA, fontsize=15, family="monospace", weight="bold")

# wordmark + slogan (measure the wordmark so ".com" sits flush after it)
word = ax.text(0.86, 4.28, "pyportfolios", color=PEARL, fontsize=64,
               family="sans-serif", weight="heavy")
fig.canvas.draw()
bbox = word.get_window_extent(fig.canvas.get_renderer())
end_x = ax.transData.inverted().transform((bbox.x1, 0))[0]
ax.text(end_x + 0.08, 4.28, ".com", color=AQUA, fontsize=40,
        family="sans-serif", weight="heavy")
ax.text(0.9, 3.55, "Where finance theory, coding & markets converge.",
        color=MIST, fontsize=20, family="serif", style="italic")

fig.savefig(OUT, facecolor=NAVY)
print(f"og image -> {OUT}")
