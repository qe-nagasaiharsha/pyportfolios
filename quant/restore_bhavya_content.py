"""
restore_bhavya_content.py - put Bhavya's 13 articles back exactly as written.

The reconciliation replaced all 13 of Bhavya's article bodies with the 2.0
versions. Instruction now: Bhavya's content stands, unchanged.

So:
  - Bhavya's 13 article bodies + their -code.ts modules are restored verbatim
    from origin/Bhavya (git checkout, so byte-identical).
  - Their registry entries (title, dek, sections, date, level, stack, hero,
    project) are taken verbatim from Bhavya's articles.ts.
  - The 5 competing 2.0 bodies for the same topics are removed, along with
    their generated data modules, so no topic appears twice.
  - The 9 articles that only ever existed on 2.0 are kept - they conflict with
    nothing - and are appended after Bhavya's block.

Result: 13 Bhavya (exact) + 9 from 2.0 = 22 articles.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ART_DIR = REPO / "site" / "src" / "content" / "articles"
ARTICLES_TS = REPO / "site" / "src" / "lib" / "articles.ts"
ROUTE = REPO / "site" / "src" / "app" / "research" / "[slug]" / "page.tsx"

BHAVYA_FILES = [
    "brownian-motion.tsx", "gbm-spy-code.ts",
    "black-scholes-greeks.tsx", "black-scholes-greeks-code.ts",
    "time-value-of-money.tsx",
    "bond-duration-convexity.tsx", "bond-code.ts",
    "mvo-efficient-frontier.tsx", "mvo-code.ts",
    "black-litterman.tsx", "bl-code.ts",
    "risk-parity-futures.tsx", "rp-code.ts",
    "ledoit-wolf-shrinkage.tsx", "hierarchical-risk-parity.tsx",
    "evt-t-copula-var.tsx", "var-cvar-three-ways.tsx",
    "cross-sectional-momentum.tsx", "pairs-trading-cointegration.tsx",
]

BHAVYA_SLUGS = [
    "brownian-motion", "black-scholes-greeks", "time-value-of-money",
    "bond-duration-convexity", "mvo-efficient-frontier", "black-litterman",
    "risk-parity-futures", "ledoit-wolf-shrinkage", "hierarchical-risk-parity",
    "evt-t-copula-var", "var-cvar-three-ways", "cross-sectional-momentum",
    "pairs-trading-cointegration",
]

# 2.0 bodies that duplicate a Bhavya topic under a different slug -> remove
DROP_20 = [
    "gbm-simulating-price-paths", "black-scholes-and-the-greeks",
    "bond-pricing-duration-convexity", "black-litterman-equilibrium-views",
    "risk-parity-from-scratch",
]

# 2.0-only articles, no Bhavya counterpart -> keep
KEEP_20 = [
    "black-scholes-from-first-principles", "var-three-ways",
    "cvar-expected-shortfall", "copulas-tail-dependence",
    "sma-crossover-backtest", "kalman-filter-hedge-ratios",
    "kelly-criterion-position-sizing", "gamestop-short-squeeze",
    "gold-war-and-inflation",
]

PASCAL = {
    "brownian-motion": "BrownianMotion", "black-scholes-greeks": "BlackScholesGreeks",
    "time-value-of-money": "TimeValueOfMoney", "bond-duration-convexity": "BondDurationConvexity",
    "mvo-efficient-frontier": "MvoEfficientFrontier", "black-litterman": "BlackLitterman",
    "risk-parity-futures": "RiskParityFutures", "ledoit-wolf-shrinkage": "LedoitWolf",
    "hierarchical-risk-parity": "HierarchicalRiskParity", "evt-t-copula-var": "EvtTCopulaVar",
    "var-cvar-three-ways": "VarCvarThreeWays", "cross-sectional-momentum": "CrossSectionalMomentum",
    "pairs-trading-cointegration": "PairsTrading",
    "black-scholes-from-first-principles": "BlackScholes", "var-three-ways": "VarThreeWays",
    "cvar-expected-shortfall": "CvarExpectedShortfall", "copulas-tail-dependence": "CopulasTailDependence",
    "sma-crossover-backtest": "SmaCrossoverBacktest", "kalman-filter-hedge-ratios": "KalmanFilterHedgeRatios",
    "kelly-criterion-position-sizing": "KellyCriterion", "gamestop-short-squeeze": "GamestopShortSqueeze",
    "gold-war-and-inflation": "GoldWarAndInflation",
}


def git_show(ref: str, path: str) -> str:
    return subprocess.run(["git", "show", f"{ref}:{path}"], cwd=REPO,
                          capture_output=True, text=True, encoding="utf-8", check=True).stdout


def entry(src: str, slug: str) -> str:
    """The full `{ ... },` registry object for one slug, verbatim."""
    m = re.search(r'\n(  \{\n    slug: "' + re.escape(slug) + r'",(?:(?!\n  \},).)*\n  \},)', src, re.S)
    if not m:
        raise SystemExit(f"registry entry not found: {slug}")
    return m.group(1)


def main() -> None:
    # 1 - restore Bhavya's article bodies byte-for-byte
    paths = [f"site/src/content/articles/{f}" for f in BHAVYA_FILES]
    subprocess.run(["git", "checkout", "origin/Bhavya", "--", *paths], cwd=REPO, check=True)
    print(f"restored {len(BHAVYA_FILES)} Bhavya files verbatim")

    # 2 - drop the competing 2.0 bodies + their generated data modules
    removed = 0
    for slug in DROP_20:
        for p in (ART_DIR / f"{slug}.tsx", ART_DIR / "data" / f"{slug}.ts"):
            if p.exists():
                p.unlink()
                removed += 1
    print(f"removed {removed} duplicate 2.0 files")

    # 3 - rebuild the registry: Bhavya's entries verbatim, then the 2.0-only ones
    bh = git_show("origin/Bhavya", "site/src/lib/articles.ts")
    cur = ARTICLES_TS.read_text(encoding="utf-8")

    blocks = [entry(bh, s) for s in BHAVYA_SLUGS]
    blocks += [entry(cur, s) for s in KEEP_20]

    head = bh[: bh.index("export const ARTICLES: Article[] = [")]
    tail = bh[bh.index("\n];", bh.index("export const ARTICLES")) :]
    body = "export const ARTICLES: Article[] = [\n" + "\n".join(blocks)
    ARTICLES_TS.write_text(head + body + tail, encoding="utf-8")
    print(f"registry rebuilt: {len(BHAVYA_SLUGS)} Bhavya + {len(KEEP_20)} from 2.0 = {len(blocks)}")

    # 4 - route registry
    slugs = BHAVYA_SLUGS + KEEP_20
    imports = "\n".join(f'import {PASCAL[s]} from "@/content/articles/{s}";' for s in slugs)
    bodies = "\n".join(f'  "{s}": {PASCAL[s]},' for s in slugs)
    r = ROUTE.read_text(encoding="utf-8")
    r = re.sub(r'import \w+ from "@/content/articles/[^"]+";\n', "", r)
    r = r.replace('import { ArticleLayout } from "@/components/article/ArticleLayout";',
                  'import { ArticleLayout } from "@/components/article/ArticleLayout";\n\n' + imports, 1)
    r = re.sub(r'const BODIES: Record<string, \(\) => ReactElement> = \{[\s\S]*?\n\};',
               "const BODIES: Record<string, () => ReactElement> = {\n" + bodies + "\n};", r)
    ROUTE.write_text(r, encoding="utf-8")
    print(f"route registry rebuilt: {len(slugs)} slugs")


if __name__ == "__main__":
    main()
