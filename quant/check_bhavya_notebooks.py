"""Are the notebooks behind Bhavya's 13 articles actually Bhavya's?"""
from __future__ import annotations

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

print(f"{'ARTICLE':<32} {'BHAVYA nb':>10} {'IN VAULT':>10}   MATCH?")
print("-" * 72)
mismatch = []
for s in SLUGS:
    try:
        orig = subprocess.run(
            ["git", "show", f"origin/Bhavya:site/public/notebooks/{s}.ipynb"],
            cwd=REPO, capture_output=True, check=True).stdout
    except subprocess.CalledProcessError:
        print(f"{s:<32} {'(none)':>10}")
        continue
    cur_p = REPO / "vault" / "notebooks" / f"{s}.ipynb"
    cur = cur_p.read_bytes() if cur_p.exists() else b""
    same = orig.strip() == cur.strip()
    if not same:
        mismatch.append(s)
    print(f"{s:<32} {len(orig)//1024:>9}K {len(cur)//1024:>9}K   {'yes' if same else 'NO - 2.0 version'}")

print()
print(f"Bhavya notebooks in place: {len(SLUGS) - len(mismatch)}/{len(SLUGS)}")
if mismatch:
    print("Still carrying the 2.0 notebook:", ", ".join(mismatch))
