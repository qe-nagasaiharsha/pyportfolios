"""
register_articles.py - wire finished articles into the site registries.

Reads quant/meta/<slug>.json (written by each tutorial pipeline) and inserts,
idempotently and in UTF-8 (never via console paste - Windows codepages mangle
en-dashes):
  1. the Article entry into ARTICLES in site/src/lib/articles.ts
  2. the import + BODIES entry in site/src/app/research/[slug]/page.tsx

Usage: python quant/register_articles.py <slug> [<slug> ...]
       python quant/register_articles.py --all      # every meta json present
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
META = REPO / "quant" / "meta"
ARTICLES_TS = REPO / "site" / "src" / "lib" / "articles.ts"
PAGE_TSX = REPO / "site" / "src" / "app" / "research" / "[slug]" / "page.tsx"


def pascal(slug: str) -> str:
    return "".join(p.capitalize() for p in slug.split("-"))


def ts_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def entry_ts(m: dict) -> str:
    sections = "\n".join(
        f"      {{ id: {ts_str(s['id'])}, title: {ts_str(s['title'])} }},"
        for s in m["sections"]
    )
    stack = ", ".join(ts_str(x) for x in m["stack"])
    return f"""  {{
    slug: {ts_str(m["slug"])},
    category: {ts_str(m["category"])},
    format: {ts_str(m["format"])},
    title: {ts_str(m["title"])},
    dek: {ts_str(m["dek"])},
    date: {ts_str(m["date"])},
    readMinutes: {m["readMinutes"]},
    level: {ts_str(m["level"])},
    notebook: {ts_str(m["notebook"])},
    excerpt:
      {ts_str(m["excerpt"])},
    stack: [{stack}],
    sections: [
{sections}
    ],
  }},
"""


def insert_articles(slugs: list[dict]) -> int:
    src = ARTICLES_TS.read_text(encoding="utf-8")
    start = src.index("export const ARTICLES: Article[] = [")
    end = src.index("\n];", start)  # closing bracket of the ARTICLES literal
    added = 0
    block = ""
    for m in slugs:
        if f'slug: "{m["slug"]}"' in src:
            print(f"  articles.ts: {m['slug']} already present, skip")
            continue
        block += entry_ts(m)
        added += 1
    if block:
        block = "\n  /* ------------------------- Batch 1 topic-card tutorials (quant) -- */\n" + block
        src = src[:end] + block.rstrip("\n") + src[end:]
        ARTICLES_TS.write_text(src, encoding="utf-8")
    return added


def insert_bodies(slugs: list[dict]) -> int:
    src = PAGE_TSX.read_text(encoding="utf-8")
    added = 0
    for m in slugs:
        slug, comp = m["slug"], pascal(m["slug"])
        imp = f'import {comp} from "@/content/articles/{slug}";'
        if imp not in src:
            anchor = 'import GbmSimulatingPricePaths from "@/content/articles/gbm-simulating-price-paths";'
            src = src.replace(anchor, anchor + "\n" + imp)
        key = f'  "{slug}": {comp},'
        if key not in src:
            anchor = '  "gbm-simulating-price-paths": GbmSimulatingPricePaths,'
            src = src.replace(anchor, anchor + "\n" + key)
            added += 1
    PAGE_TSX.write_text(src, encoding="utf-8")
    return added


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    if args == ["--all"]:
        metas = sorted(META.glob("*.json"))
    else:
        metas = [META / f"{s}.json" for s in args]
    loaded = []
    for p in metas:
        if not p.exists():
            print(f"  missing meta: {p.name} - skip")
            continue
        m = json.loads(p.read_text(encoding="utf-8"))
        # only register when the body + data actually exist
        body = REPO / "site" / "src" / "content" / "articles" / f"{m['slug']}.tsx"
        data = REPO / "site" / "src" / "content" / "articles" / "data" / f"{m['slug']}.ts"
        nb = REPO / "vault" / "notebooks" / m["notebook"]
        missing = [x.name for x in (body, data, nb) if not x.exists()]
        if missing:
            print(f"  {m['slug']}: missing {missing} - skip")
            continue
        loaded.append(m)
    a = insert_articles(loaded)
    b = insert_bodies(loaded)
    print(f"registered: {a} article entries, {b} body mappings ({len(loaded)} candidates)")


if __name__ == "__main__":
    main()
