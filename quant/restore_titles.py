"""
restore_titles.py - descriptive article titles in Bhavya's house style.

Bhavya wrote long, descriptive, search-friendly titles ("Bond Pricing,
Duration & Convexity: Via US Treasuries - and the ETFs That Lived Through
2022"). The 2.0 catalogue used short ones ("Bond pricing, duration &
convexity"). Reconciling took 2.0's content, which dragged the short titles
along with it.

This restores Bhavya's titles verbatim where they exist AND still describe
the article that survived, and extends the same style to the rest so the
catalogue reads consistently rather than 5 long / 17 short.

Every subtitle below is grounded in what the article actually computes -
assets, window, method - not invented.
"""

from __future__ import annotations

import re
from pathlib import Path

ARTICLES = Path(__file__).resolve().parent.parent / "site" / "src" / "lib" / "articles.ts"

# slug -> title.  Marked (B) where the wording is Bhavya's, kept verbatim.
TITLES = {
    # --- Quant Finance Foundations -------------------------------------
    "gbm-simulating-price-paths":
        "Geometric Brownian Motion: Simulating Price Paths — Shown Through SPY",  # (B)
    "black-scholes-and-the-greeks":
        "Black–Scholes & the Greeks: Pricing and Hedging QQQ Options in NumPy",
    "black-scholes-from-first-principles":
        "Black–Scholes from First Principles: Deriving the Formula by Replication",
    "bond-pricing-duration-convexity":
        "Bond Pricing, Duration & Convexity: Via US Treasuries — and the ETFs That Lived Through 2022",  # (B)
    "time-value-of-money":
        "The Time Value of Money, in Code: Discounting Off the 2022 Treasury Curve",
    "gold-war-and-inflation":
        "Gold Through War and Inflation: Twenty Years of GLD Against Real Yields",

    # --- Portfolio Optimization ----------------------------------------
    "mvo-efficient-frontier":
        "Mean-Variance Optimization & the Efficient Frontier: A Six-Asset Portfolio in Python",  # (B)
    "black-litterman-equilibrium-views":
        "The Black-Litterman Model: Blending Market Equilibrium with Your Own Views",  # (B)
    # Bhavya's read "...— A Futures Portfolio"; the surviving article is the
    # ETF version with a 15-year backtest, so the suffix is corrected.
    "risk-parity-from-scratch":
        "Risk Parity from Scratch: Allocating by Risk, Not Capital — Across Four Asset Classes",
    "ledoit-wolf-shrinkage":
        "Ledoit–Wolf Shrinkage, from Scratch: Repairing a Covariance Matrix That Cannot Be Trusted",
    "hierarchical-risk-parity":
        "Hierarchical Risk Parity, End to End: Allocation Without Inverting a Covariance Matrix",
    "kelly-criterion-position-sizing":
        "The Kelly Criterion for Position Sizing: Optimal Growth, and Why Half Is Safer",

    # --- Risk Management -----------------------------------------------
    "var-three-ways":
        "Value at Risk Three Ways: Historical, Parametric and Monte Carlo on the DAX",
    "cvar-expected-shortfall":
        "CVaR / Expected Shortfall: Sizing the Losses That Live Beyond VaR",
    "var-cvar-three-ways":
        "VaR & CVaR, Three Ways: One Number, Three Recipes, and a Backtest",
    "evt-t-copula-var":
        "Market Risk via EVT + t-Copula: Fat Tails and Joint Crashes, Modelled Properly",
    "copulas-tail-dependence":
        "Copulas & Tail Dependence: Why Markets Crash Together More Often Than Correlation Says",

    # --- Algorithmic Trading -------------------------------------------
    "sma-crossover-backtest":
        "The SMA Crossover, Honestly Backtested: QQQ and Bitcoin, Costs Included",
    "cross-sectional-momentum":
        "Momentum, Honestly Backtested: Cross-Sectional Sector Rotation After Costs",
    "pairs-trading-cointegration":
        "Pairs Trading & Cointegration: Engle–Granger, the Spread, and What the Test Really Says",
    "kalman-filter-hedge-ratios":
        "Kalman Filters for Dynamic Hedge Ratios: Tracking a Beta That Refuses to Sit Still",
    "gamestop-short-squeeze":
        "Anatomy of a Short Squeeze: GameStop, January 2021, Reconstructed From the Tape",
}


def main() -> None:
    src = ARTICLES.read_text(encoding="utf-8")
    changed = unchanged = 0

    for slug, title in TITLES.items():
        # title line belongs to the block that starts with this slug
        pat = re.compile(
            r'(slug: "' + re.escape(slug) + r'",(?:(?!\n\s{4}slug:)[\s\S])*?title: ")([^"]*)(")'
        )
        m = pat.search(src)
        if not m:
            raise SystemExit(f"could not locate title for {slug}")
        if m.group(2) == title:
            unchanged += 1
            continue
        src = src[:m.start(2)] + title + src[m.end(2):]
        changed += 1

    ARTICLES.write_text(src, encoding="utf-8")
    print(f"titles updated: {changed}   already correct: {unchanged}   total: {len(TITLES)}")


if __name__ == "__main__":
    main()
