"""
assign_heroes.py - give every article a banner photo, reusing the 6 we own.

Bhavya shot/licensed 6 mountain banners for 13 articles. The reconciled site
has 22, so 16 opened with a bare dark header - which is what made the site
look inconsistent next to Bhavya's version.

No new images are sourced. Instead:
  - the 6 original pairings are preserved exactly (they were deliberate),
  - the remaining articles rotate through the same 6, walking the list in
    category order so the same photo never lands on two neighbours.

Each photo ends up used 3-4 times. Re-run any time articles are added.
"""

from __future__ import annotations

import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ARTICLES = REPO / "site" / "src" / "lib" / "articles.ts"
HERO_DIR = REPO / "site" / "public" / "hero"


def main() -> None:
    photos = sorted(f"hero/{p.name}" for p in HERO_DIR.glob("*.jpg"))
    if not photos:
        raise SystemExit("no photos in site/public/hero")

    src = ARTICLES.read_text(encoding="utf-8")

    # every article entry, in file order, with whatever hero it already has
    entries = list(re.finditer(
        r'^\s{4}slug: "([a-z0-9-]+)",\n(?:\s{4}category: "([a-z-]+)",\n)?(\s{4}hero: "([^"]+)",\n)?',
        src, re.M))
    articles = [m for m in entries if m.group(2)]  # category present => real article

    taken = {m.group(4) for m in articles if m.group(4)}
    # start the rotation on a photo that is not already the first one used,
    # so the first heroless article does not echo its neighbour
    rot = [p for p in photos if p not in taken] + [p for p in photos if p in taken]

    additions: list[tuple[int, str]] = []
    i = 0
    prev = None
    for m in articles:
        if m.group(3):                      # already has a hero - leave it
            prev = m.group(4)
            continue
        choice = rot[i % len(rot)]
        if choice == prev and len(rot) > 1:  # never repeat back-to-back
            i += 1
            choice = rot[i % len(rot)]
        additions.append((m.end(1) + 2, choice))   # insert after the slug line
        prev = choice
        i += 1

    # apply back-to-front so earlier offsets stay valid
    for pos, photo in sorted(additions, reverse=True):
        line_end = src.index("\n", pos) + 1
        src = src[:line_end] + f'    hero: "{photo}",\n' + src[line_end:]

    ARTICLES.write_text(src, encoding="utf-8")

    total = len(articles)
    now = len(re.findall(r'hero: "', src))
    print(f"articles: {total}   with a banner photo: {now}   added: {len(additions)}")
    for p in photos:
        print(f"  {p:42s} used {len(re.findall(re.escape(p), src))}x")


if __name__ == "__main__":
    main()
