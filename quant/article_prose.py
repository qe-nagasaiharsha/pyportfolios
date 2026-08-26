"""article_prose.py — lift an article's prose out of the built page.

The notebooks must read exactly like the website (Louis/Harsha, 26 Aug). The
article source is TSX full of interpolations — {pc(v99.histVar)} and friends —
so the reliable source is not the .tsx but site/out/research/<slug>.html, where
Next has already resolved every number into final text.

Returns the article as ordered blocks:

    [{"heading": "2 · Historical simulation", "md": "...markdown..."}, ...]

with the lead as the first block (no heading). Charts, tables, code and the
project card are skipped — the notebook supplies its own code and figures, and
a DataTable rendered as markdown would drift from the notebook's own printout.

Usage:  from quant.article_prose import article_blocks
"""

from __future__ import annotations

import html
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "site" / "out" / "research"


def _katex_to_tex(fragment: str, tex_pool: list) -> str:
    """Swap each rendered KaTeX span for $LaTeX$, taken from the .tsx source.

    The site renders KaTeX in HTML-only mode, so the page carries no MathML
    annotation to recover the original from — flattening the rendered spans
    turns \\frac{rank(x)}{n+1} into the nonsense "u = n + 1 rank ( x )". The
    LaTeX still exists in the article source, in the same order, so it is
    matched positionally and spliced back in.

    Where the source interpolated a live number — `\\nu = ${d.params.dfHat}` —
    the number is lifted out of the rendered text and put into the template.
    """

    def take(m):
        rendered = re.sub(r"<[^>]+>", "", m.group(0))
        rendered = re.sub(r"\s+", "", html.unescape(rendered))
        tex = tex_pool.pop(0) if tex_pool else rendered
        if "${" in tex:
            nums = re.findall(r"-?\d+(?:\.\d+)?", rendered)
            val = nums[-1] if nums else ""
            if "%" in rendered:
                val += r"\%"
            tex = re.sub(r"\$\{[^}]*\}", val, tex)
        return " $" + tex.strip() + "$ "

    return re.sub(r'<span class="katex">.*?</span></span>', take, fragment, flags=re.S)


def _tex_sources(slug: str) -> list:
    """Every <Formula> body in the article source, in document order."""
    src = (REPO / "site" / "src" / "content" / "articles" / (slug + ".tsx")).read_text(encoding="utf-8")
    out = []
    for m in re.finditer(r"<Formula>\{(String\.raw)?`([\s\S]*?)`\}</Formula>", src):
        tex = m.group(2)
        if not m.group(1):        # a plain template literal escapes its backslashes
            tex = tex.replace("\\\\", "\\")
        out.append(tex)
    return out


def _text(fragment: str, tex_pool=None) -> str:
    """Inline HTML -> markdown text, preserving bold/italic/code/maths."""
    s = fragment
    if tex_pool is not None:
        s = _katex_to_tex(s, tex_pool)
    s = re.sub(r"<(b|strong)\b[^>]*>(.*?)</\1>", r"**\2**", s, flags=re.S)
    s = re.sub(r"<(i|em)\b[^>]*>(.*?)</\1>", r"*\2*", s, flags=re.S)
    s = re.sub(r"<code\b[^>]*>(.*?)</code>", r"`\1`", s, flags=re.S)
    # KaTeX renders both MathML and HTML; drop the MathML twin so maths is not doubled
    s = re.sub(r'<span class="katex-mathml">.*?</span>\s*', " ", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    s = s.replace(" ", " ")
    return re.sub(r"[ \t]+", " ", s).strip()


def _list_items(block: str, tex_pool=None) -> list:
    items = []
    for li in re.findall(r"<li\b[^>]*>(.*?)</li>", block, re.S):
        t = _text(li, tex_pool)
        # References render their own "1 ." counter into the text; strip it so
        # the markdown bullet does not read "- 1 . Sklar, A. (1959)."
        t = re.sub(r"^\d+\s*\.\s*", "", t)
        items.append(t)
    return items


def article_blocks(slug: str) -> list[dict[str, str]]:
    path = OUT / f"{slug}.html"
    raw = path.read_text(encoding="utf-8")
    tex_pool = _tex_sources(slug)   # consumed in document order by _text

    # the article body only — everything outside it is nav, cards and footer
    body = re.search(r'<div class="article-body">(.*?)</div>\s*<aside', raw, re.S)
    if not body:
        body = re.search(r"<article\b[^>]*>(.*?)</article>", raw, re.S)
    inner = body.group(1)

    title = _text(re.search(r"<h1\b[^>]*>(.*?)</h1>", raw, re.S).group(1))

    blocks: list[dict[str, str]] = []

    # ---- lead: the paragraphs before the first section heading
    head = inner.split("<section", 1)[0]
    lead_parts = [_text(p) for p in re.findall(r"<p\b[^>]*>(.*?)</p>", head, re.S)]
    lead_parts = [p for p in lead_parts if len(p) > 40]
    if lead_parts:
        blocks.append({"heading": "", "md": f"# {title}\n\n" + "\n\n".join(lead_parts)})
    else:
        blocks.append({"heading": "", "md": f"# {title}"})

    # ---- one block per <section>
    for sec in re.findall(r"<section\b[^>]*>(.*?)</section>", inner, re.S):
        h2 = re.search(r"<h2\b[^>]*>(.*?)</h2>", sec, re.S)
        heading = _text(h2.group(1)) if h2 else ""
        parts: list[str] = []

        # walk paragraphs and lists in document order, skipping figures/tables/code
        stripped = re.sub(r"<figure\b.*?</figure>", " ", sec, flags=re.S)
        stripped = re.sub(r"<table\b.*?</table>", " ", stripped, flags=re.S)
        stripped = re.sub(r"<pre\b.*?</pre>", " ", stripped, flags=re.S)

        for m in re.finditer(r"<(p|ul|ol)\b[^>]*>(.*?)</\1>", stripped, re.S):
            tag, content = m.group(1), m.group(2)
            if tag == "p":
                t = _text(content, tex_pool)
                if len(t) > 30:
                    parts.append(t)
            else:
                items = [i for i in _list_items(content, tex_pool) if i]
                if items:
                    parts.append("\n".join(f"- {i}" for i in items))

        if heading or parts:
            md = (f"## {heading}\n\n" if heading else "") + "\n\n".join(parts)
            blocks.append({"heading": heading, "md": md.strip()})

    return blocks


if __name__ == "__main__":
    import sys

    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    for slug in sys.argv[1:]:
        bs = article_blocks(slug)
        print(f"\n=== {slug}: {len(bs)} blocks ===")
        for b in bs:
            first = b["md"].split("\n")[0]
            print(f"  [{len(b['md']):>5} chars] {first[:76]}")
