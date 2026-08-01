"""
restore_bhavya_notebooks.py - put Bhavya's own notebooks behind Bhavya's articles.

The article bodies were restored, but the vault still held 2.0-generated
notebooks for those 13 slugs. A reader downloading from a Bhavya article would
have got a different piece of work: 2.0's ledoit-wolf notebook is 103K of
executed real-data output, Bhavya's is a 2K synthetic teaching example. The
download has to match the article it sits under.

Written as raw bytes (not PowerShell Set-Content) so encoding and line endings
survive exactly.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
VAULT = REPO / "vault" / "notebooks"

SLUGS = [
    "brownian-motion", "black-scholes-greeks", "time-value-of-money",
    "bond-duration-convexity", "mvo-efficient-frontier", "black-litterman",
    "risk-parity-futures", "ledoit-wolf-shrinkage", "hierarchical-risk-parity",
    "evt-t-copula-var", "var-cvar-three-ways", "cross-sectional-momentum",
    "pairs-trading-cointegration",
]


def main() -> None:
    restored = 0
    for slug in SLUGS:
        raw = subprocess.run(
            ["git", "show", f"origin/Bhavya:site/public/notebooks/{slug}.ipynb"],
            cwd=REPO, capture_output=True, check=True,
        ).stdout
        json.loads(raw.decode("utf-8"))          # prove it parses before writing
        (VAULT / f"{slug}.ipynb").write_bytes(raw)
        restored += 1
        print(f"  {slug:<32} {len(raw) // 1024:>4} KB")

    print(f"\nrestored {restored}/{len(SLUGS)} Bhavya notebooks (byte-exact)")

    # verify against the branch
    bad = []
    for slug in SLUGS:
        orig = subprocess.run(
            ["git", "show", f"origin/Bhavya:site/public/notebooks/{slug}.ipynb"],
            cwd=REPO, capture_output=True, check=True,
        ).stdout
        if (VAULT / f"{slug}.ipynb").read_bytes() != orig:
            bad.append(slug)
    print("byte-identical to Bhavya's branch:" if not bad else "MISMATCH:",
          f"{len(SLUGS) - len(bad)}/{len(SLUGS)}")
    if bad:
        raise SystemExit("mismatch: " + ", ".join(bad))


if __name__ == "__main__":
    main()
