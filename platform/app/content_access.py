"""Per-slug content access tiers — the single source of truth for who may
download what. Mirrors the pricing copy on the marketing site:

  Basic  (free / starter): the 4 sample tutorials (one per category) —
      notebook, bundle AND PDF for those 4 only. The rest is preview-only.
  Plus   (pro, $29):       all standard notebooks/bundles (the 12 that are not
      Pro-only). PDFs are NOT included at this tier (only the 4 sample PDFs,
      which everyone gets).
  Pro    (premium, $79):   everything — all 16 notebooks/bundles including the
      advanced/scholarly Pro-only set, plus all 16 PDFs.

Enforcement is in routes/content.py; this module only classifies. Editing the
two sets below is the whole knob — no other file needs to change to re-tier a
piece of content.
"""

# One tutorial per category — free to download for any signed-in user.
FREE_SAMPLE_SLUGS = frozenset(
    {
        "brownian-motion",  # quant-finance-foundations
        "mvo-efficient-frontier",  # portfolio-optimization
        "var-three-ways",  # risk-management
        "sma-crossover-backtest",  # algorithmic-trading
    }
)

# The advanced / scholarly set — notebooks and bundles here require Pro
# (premium). This is what makes Plus "12 downloads" and Pro "all 16".
PRO_ONLY_SLUGS = frozenset(
    {
        "heston-vs-black-scholes",
        "black-litterman",
        "gaussian-vs-t-copula",
        "kalman-filter-hedge-ratios",
    }
)

# Where to send a blocked user, by the tier they need.
_UPSELL_PLAN = {"pro": "pro-monthly", "premium": "premium-monthly"}
_RANK = {"starter": 0, "pro": 1, "premium": 2}


def download_decision(tier: str, slug: str, *, kind: str) -> tuple[bool, str | None]:
    """Return (allowed, required_plan) for a signed-in user of `tier` requesting
    `slug`. `kind` is "pdf" for research notes, anything else (notebook/bundle)
    is treated the same. `required_plan` is None when allowed, otherwise the
    plan_code to upsell (e.g. "premium-monthly").

    `tier` is "starter" | "pro" | "premium" (see services.user_tier).
    """
    rank = _RANK.get(tier, 0)

    # Sample tutorials: free for every signed-in user, in every format.
    if slug in FREE_SAMPLE_SLUGS:
        return True, None

    # Research-note PDFs (non-sample): a Pro (premium) perk.
    if kind == "pdf":
        if rank >= 2:
            return True, None
        return False, _UPSELL_PLAN["premium"]

    # Notebooks / bundles.
    if slug in PRO_ONLY_SLUGS:
        if rank >= 2:
            return True, None
        return False, _UPSELL_PLAN["premium"]

    # Standard library: Plus or Pro.
    if rank >= 1:
        return True, None
    return False, _UPSELL_PLAN["pro"]
