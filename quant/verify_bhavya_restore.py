"""Verify Bhavya's registry entries are byte-identical to their branch."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SLUGS = [
    "brownian-motion", "black-scholes-greeks", "time-value-of-money",
    "bond-duration-convexity", "mvo-efficient-frontier", "black-litterman",
    "risk-parity-futures", "ledoit-wolf-shrinkage", "hierarchical-risk-parity",
    "evt-t-copula-var", "var-cvar-three-ways", "cross-sectional-momentum",
    "pairs-trading-cointegration",
]


def entry(src: str, slug: str) -> str | None:
    m = re.search(r'\{\n    slug: "' + re.escape(slug) + r'",(?:(?!\n  \},).)*\n  \},', src, re.S)
    return m.group(0) if m else None


bh = subprocess.run(["git", "show", "origin/Bhavya:site/src/lib/articles.ts"],
                    cwd=REPO, capture_output=True, text=True, encoding="utf-8").stdout
cur = (REPO / "site" / "src" / "lib" / "articles.ts").read_text(encoding="utf-8")

same = 0
for s in SLUGS:
    a, b = entry(bh, s), entry(cur, s)
    if a is not None and a == b:
        same += 1
    else:
        print(f"  DIFFERS: {s}")

print(f"Bhavya registry entries identical: {same}/{len(SLUGS)}")

all_slugs = re.findall(r'^    slug: "([a-z0-9-]+)",', cur, re.M)
print(f"total articles registered: {len(all_slugs)}")
print("  Bhavya's :", ", ".join(s for s in all_slugs if s in SLUGS))
print("  from 2.0 :", ", ".join(s for s in all_slugs if s not in SLUGS))
