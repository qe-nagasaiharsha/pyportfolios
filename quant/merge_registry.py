"""
merge_registry.py - build the 3.0 article registry.

Base = branch 2.0's catalogue (22 articles, all with computed data and the
`format` dimension). Adapted to the Bhavya presentation layer:
  - CategorySlug  finance-fundamentals -> quant-finance-foundations
  - Article gains  hero?  and  project?   (Bhavya's fields)
  - the 6 Bhavya hero photographs are reassigned to the winning 2.0 slugs

Run once from the repo root on branch 3.0:  python quant/merge_registry.py
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "site" / "src" / "lib" / "articles.ts"

# Bhavya hero -> the 2.0 slug that won that topic
HEROES = {
    "gbm-simulating-price-paths": "hero/mountain-marc-thunis.jpg",
    "black-scholes-and-the-greeks": "hero/matterhorn-calame.jpg",
    "bond-pricing-duration-convexity": "hero/dolomites-krivec.jpg",
    "mvo-efficient-frontier": "hero/mountain-sam-ferrara.jpg",
    "black-litterman-equilibrium-views": "hero/mountain-neil-rosenstech.jpg",
    # futures piece dropped; its photo goes to the surviving risk-parity article
    "risk-parity-from-scratch": "hero/mountain-nathan-anderson.jpg",
}


def main() -> None:
    src = subprocess.run(
        ["git", "show", "2.0:site/src/lib/articles.ts"],
        cwd=REPO, capture_output=True, text=True, encoding="utf-8", check=True,
    ).stdout

    # 1) category slug rename (type union, CATEGORIES keys, per-article values)
    src = src.replace('"finance-fundamentals"', '"quant-finance-foundations"')
    src = src.replace('"finance-fundamentals":', '"quant-finance-foundations":')
    src = src.replace("Finance Fundamentals", "Quant Finance Foundations")

    # 2) Bhavya's optional presentation fields on the Article interface
    src = src.replace(
        "  /** Filename under /public/notebooks. */\n  notebook: string;",
        "  /** Filename under vault/notebooks (served via the gated platform API). */\n"
        "  notebook: string;\n"
        "  /** Optional full-bleed hero background image path under /public. */\n"
        "  hero?: string;\n"
        "  /** Optional standalone project folder name (source + launchers). */\n"
        "  project?: string;",
    )

    # 3) attach heroes to the winning slugs
    for slug, hero in HEROES.items():
        pat = re.compile(
            r'(\{\s*\n\s*slug: "' + re.escape(slug) + r'",\n)', re.M
        )
        src, n = pat.subn(lambda m: m.group(1) + f'    hero: "{hero}",\n', src)
        if n != 1:
            raise SystemExit(f"hero attach failed for {slug} (matched {n})")

    # 4) header note
    src = src.replace(
        "/* ============================================================================\n"
        "   Article catalogue",
        "/* ============================================================================\n"
        "   Article catalogue — reconciled on branch 3.0 (Bhavya presentation base +\n"
        "   the computed-data article set). Notebooks/bundles are gated product and\n"
        "   live in vault/, served through the platform API — never site/public.\n"
        "   Article catalogue",
    )

    OUT.write_text(src, encoding="utf-8")
    slugs = re.findall(r'^\s{4}slug: "([a-z0-9-]+)",', src, re.M)
    heroes = re.findall(r'hero: "', src)
    print(f"articles: {len(slugs)}  heroes attached: {len(heroes)}")
    print("slugs:", ", ".join(slugs))


if __name__ == "__main__":
    main()
