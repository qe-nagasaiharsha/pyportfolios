"""Audit: what happened to Bhavya's 13 articles in branch 3.0."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# Bhavya slug -> the 3.0 slug that carries that topic (None = dropped)
MAP = {
    "brownian-motion": "gbm-simulating-price-paths",
    "black-scholes-greeks": "black-scholes-and-the-greeks",
    "time-value-of-money": "time-value-of-money",
    "bond-duration-convexity": "bond-pricing-duration-convexity",
    "mvo-efficient-frontier": "mvo-efficient-frontier",
    "black-litterman": "black-litterman-equilibrium-views",
    "risk-parity-futures": "risk-parity-from-scratch",
    "ledoit-wolf-shrinkage": "ledoit-wolf-shrinkage",
    "hierarchical-risk-parity": "hierarchical-risk-parity",
    "evt-t-copula-var": "evt-t-copula-var",
    "var-cvar-three-ways": "var-cvar-three-ways",
    "cross-sectional-momentum": "cross-sectional-momentum",
    "pairs-trading-cointegration": "pairs-trading-cointegration",
}


def load(ref: str) -> str:
    return subprocess.run(["git", "show", f"{ref}:site/src/lib/articles.ts"],
                          cwd=REPO, capture_output=True, text=True,
                          encoding="utf-8", check=True).stdout


def block(src: str, slug: str) -> str:
    m = re.search(r'slug: "' + re.escape(slug) + r'",((?:(?!\n\s{4}slug:)[\s\S])*)', src)
    return m.group(1) if m else ""


def title(b: str) -> str:
    m = re.search(r'title: "([^"]+)"', b)
    return m.group(1) if m else "?"


def sections(b: str) -> list[str]:
    return re.findall(r'\{ id: "([a-z0-9-]+)", title: "([^"]+)" \}', b) and \
           [f"{i}:{t}" for i, t in re.findall(r'\{ id: "([a-z0-9-]+)", title: "([^"]+)" \}', b)]


def main() -> None:
    old, new = load("origin/Bhavya"), load("3.0")
    print(f"{'BHAVYA ARTICLE':<30} {'TITLE':<8} {'SECTIONS':<26} BODY")
    print("-" * 96)
    for bslug, nslug in MAP.items():
        ob, nb = block(old, bslug), block(new, nslug)
        ot, nt = title(ob), title(nb)
        os_, ns_ = sections(ob) or [], sections(nb) or []
        same_sec = os_ == ns_
        tstat = "kept" if ot == nt else "changed"
        sstat = "identical" if same_sec else f"{len(os_)}->{len(ns_)}, rewritten"
        body = "REPLACED (2.0 version)" if bslug != nslug or not same_sec else "replaced"
        print(f"{bslug:<30} {tstat:<8} {sstat:<26} {body}")
        if not same_sec:
            print(f"{'':>32}Bhavya : {', '.join(s.split(':')[0] for s in os_)}")
            print(f"{'':>32}3.0    : {', '.join(s.split(':')[0] for s in ns_)}")
    print()
    print("Bhavya article-body files still present in 3.0:")
    d = REPO / "site" / "src" / "content" / "articles"
    for bslug in MAP:
        print(f"  {bslug:<30} {'yes' if (d / f'{bslug}.tsx').exists() else 'no - removed'}")


if __name__ == "__main__":
    main()
