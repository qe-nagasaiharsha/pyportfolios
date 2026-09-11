"""Charts for the Geometric Brownian Motion note.

The simulation is the ARTICLE'S OWN, not illustrative data: it runs the article's
gbm_paths() with the parameters the article prints in its calibration output
(s0 = 578.32, mu = 14.75%, sigma = 19.54%) under the article's np.random.seed(42).
Those parameters were themselves estimated from real SPY closes over
Jan 2018 - Dec 2024; no market data is invented here, and nothing is drawn that
the article's model does not produce.

Reproduction is checked against the article's own printed result:
    Mean terminal price (no drift): 588.06   vs   S0 = 578.32

Styling follows the palette measured out of the reference note's figures --
white ground, navy #1a2c5b primary, ochre #c49a2c secondary, #e6e6e6 grid,
#aaaaaa axes, #6b6b6b labels -- and the document's own typeface, so the charts
read as part of the same publication rather than as imported notebook output.
"""
import os

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from matplotlib import font_manager
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "brownian-motion")

# ----------------------------------------------------------------- palette ---
NAVY = "#1a2c5b"    # primary series
OCHRE = "#c49a2c"   # secondary series
GRID = "#e6e6e6"
AXIS = "#aaaaaa"
MUTED = "#6b6b6b"
INK = "#1a1a1a"
PATHGREY = "#c8c8c8"

# The note sets figures at the full 532.8bp measure = 7.4in, so a 7.4in-wide
# figure maps 1:1 onto the page and chart point sizes equal page point sizes.
WIDTH = 7.4
DPI = 200

for name in ("texgyreheros-regular.otf", "texgyreheros-bold.otf",
             "texgyreheros-italic.otf"):
    path = os.path.join(os.environ.get("APPDATA", ""), "MiKTeX", "fonts",
                        "opentype", "public", "tex-gyre", name)
    if os.path.exists(path):
        font_manager.fontManager.addfont(path)

plt.rcParams.update({
    "font.family": "TeX Gyre Heros",
    "font.size": 7,
    "axes.titlesize": 8.5,
    "axes.labelsize": 7.5,
    "xtick.labelsize": 7,
    "ytick.labelsize": 7,
    "legend.fontsize": 7,
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "savefig.facecolor": "white",
    "axes.edgecolor": AXIS,
    "axes.labelcolor": MUTED,
    "xtick.color": AXIS,
    "ytick.color": AXIS,
    "text.color": INK,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.linewidth": 0.6,
    "axes.grid": True,
    "axes.axisbelow": True,
    "grid.color": GRID,
    "grid.linewidth": 0.5,
    "legend.frameon": False,
    "xtick.major.width": 0.6,
    "ytick.major.width": 0.6,
    "xtick.major.size": 2.5,
    "ytick.major.size": 2.5,
})


def style(ax):
    """Tick labels sit in muted grey; the axis rules themselves lighter still."""
    for lbl in ax.get_xticklabels() + ax.get_yticklabels():
        lbl.set_color(MUTED)
    ax.grid(axis="x", visible=False)


# ------------------------------------------------- the article's simulation ---
def gbm_returns(mu, sigma, dt, n_steps, n_paths):
    z = np.random.normal(size=(n_steps, n_paths))
    return np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * z)


def gbm_paths(s0, mu, sigma, dt, n_steps, n_paths):
    rets = gbm_returns(mu, sigma, dt, n_steps, n_paths)
    return s0 * np.vstack([np.ones(rets.shape[1]), rets]).cumprod(axis=0)


S0 = 578.32       # article's printed last close
MU = 0.1475       # article's printed mu_hat  = 14.75%
SIGMA = 0.1954    # article's printed sigma_hat = 19.54%
DT = 1 / 252
HORIZON = 252 * 5
N_PATHS = 1_000

np.random.seed(42)                                     # the article's seed
paths = gbm_paths(S0, MU, SIGMA, DT, HORIZON, N_PATHS)  # first draw, as in the article
paths_nd = gbm_paths(S0, 0.0, SIGMA, DT, HORIZON, N_PATHS)  # second draw

# Reproduction check against the article's own printed output.
print("reproduction check")
print("  mean terminal price (no drift): %.2f   article prints 588.06" % paths_nd[-1].mean())
print("  S0                            : %.2f   article prints 578.32" % S0)

t_ax = np.arange(paths.shape[0]) / 252
p5, p95 = np.percentile(paths, [5, 95], axis=1)

# ------------------------------------------------- Figure 1: simulated cone ---
# Exactly the three series the article's PATHS_CODE plots — band, 200 paths,
# mean. An earlier draft added a median path the article never draws; the
# mean-vs-median point belongs to the terminal distribution in Figure 2.
# Legend and axis wording are the article's own ("5-95% band", "Mean path",
# "Years"); only the unit is added, and SPY is dollar-priced.
fig, ax = plt.subplots(figsize=(WIDTH, 2.1))
ax.plot(t_ax, paths[:, :200], color=PATHGREY, lw=0.2, alpha=0.35, zorder=1)
ax.fill_between(t_ax, p5, p95, color=NAVY, alpha=0.22, lw=0, zorder=2,
                label="5–95% band")
ax.plot(t_ax, paths.mean(axis=1), color=NAVY, lw=1.4, ls="--", zorder=4,
        label="Mean path")
ax.set_xlabel("Years")
ax.set_ylabel("Simulated price (USD)")
ax.set_xlim(0, 5)
ax.legend(loc="upper left", handlelength=1.8, borderpad=0.2, labelspacing=0.4)
style(ax)
fig.tight_layout(pad=0.3)
fig.savefig(os.path.join(OUT, "fig1-paths.png"), dpi=DPI)
plt.close(fig)

# ------------------------------------ Figure 2: terminal price distribution ---
T = HORIZON / 252
s_T = paths[-1]
x = np.linspace(s_T.min(), s_T.max(), 400)
pdf = stats.lognorm.pdf(x, s=SIGMA * np.sqrt(T),
                        scale=S0 * np.exp((MU - 0.5 * SIGMA**2) * T))

fig, ax = plt.subplots(figsize=(WIDTH, 2.0))
ax.hist(s_T, bins=60, density=True, color=NAVY, alpha=0.30,
        edgecolor=NAVY, linewidth=0.3, zorder=2, label="Simulated $S_T$")
ax.plot(x, pdf, color=OCHRE, lw=1.4, zorder=3, label="Theoretical log-normal")
# Mean before median, and dashed/solid, as the article draws them.
ax.axvline(s_T.mean(), color=NAVY, lw=1.0, ls="--", zorder=4,
           label=f"Mean  {s_T.mean():,.0f}")
ax.axvline(np.median(s_T), color=MUTED, lw=1.0, zorder=5,
           label=f"Median  {np.median(s_T):,.0f}")
ax.set_xlabel("Terminal price after 5 years (USD)")
ax.set_ylabel("Probability density")
ax.set_xlim(s_T.min(), s_T.max())
ax.legend(loc="upper right", handlelength=1.8, borderpad=0.2, labelspacing=0.4)
style(ax)
fig.tight_layout(pad=0.3)
fig.savefig(os.path.join(OUT, "fig2-terminal.png"), dpi=DPI)
plt.close(fig)

print("wrote fig1-paths.png and fig2-terminal.png")
