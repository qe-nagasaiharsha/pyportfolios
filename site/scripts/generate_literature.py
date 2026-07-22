# -*- coding: utf-8 -*-
"""books_clean.json -> the BOOK_GROUPS TypeScript literal, written to scripts/book_groups.ts.txt
so it can be spliced into src/lib/literature.ts."""
import json, os, sys
sys.stdout.reconfigure(encoding="utf-8")
ROOT = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site"
data = json.load(open(os.path.join(ROOT, "scripts", "books_clean.json"), encoding="utf-8"))

BLURBS = {
    "Foundations": "The mathematics, probability and stochastic calculus everything else is built on.",
    "Fixed Income & Interest-Rate Modeling": "Bonds, the yield curve, and the models that price interest-rate risk.",
    "Derivatives, Options & Volatility": "Options, futures and the volatility surface — how derivatives are priced and hedged.",
    "Portfolio Optimization & Asset Allocation": "From the mean–variance frontier to factor investing and robust allocation.",
    "Risk Management": "Measuring, stress-testing and surviving the tails.",
    "Market Microstructure & Execution": "How orders become prices — liquidity, market impact and execution.",
    "Algorithmic Trading & Machine Learning": "Systematic strategies and machine learning applied to live markets.",
}

def s(x):  # JS string literal, unicode preserved
    return json.dumps(x, ensure_ascii=False)

lines = ["export const BOOK_GROUPS: BookGroup[] = ["]
for g in data:
    theme = g["theme"]
    blurb = BLURBS.get(theme, "")
    lines.append("  {")
    lines.append(f"    theme: {s(theme)},")
    lines.append(f"    blurb: {s(blurb)},")
    lines.append("    books: [")
    for b in g["books"]:
        note = b["why"][0] if b["why"] else ""
        lines.append("      {")
        lines.append(f"        title: {s(b['title'])},")
        lines.append(f"        author: {s(b['author'])},")
        lines.append(f"        year: {int(b['year']) if b['year'] else 0},")
        lines.append(f"        note: {s(note)},")
        lines.append(f"        citation: {s(b['citation'])},")
        lines.append("        why: [")
        for w in b["why"]:
            lines.append(f"          {s(w)},")
        lines.append("        ],")
        if b["cover"]:
            lines.append(f"        cover: {s(b['cover'])},")
            if b.get("coverW") and b.get("coverH"):
                lines.append(f"        coverW: {int(b['coverW'])},")
                lines.append(f"        coverH: {int(b['coverH'])},")
        lines.append("      },")
    lines.append("    ],")
    lines.append("  },")
lines.append("];")
out = "\n".join(lines) + "\n"
open(os.path.join(ROOT, "scripts", "book_groups.ts.txt"), "w", encoding="utf-8").write(out)
print(f"wrote book_groups.ts.txt — {sum(len(g['books']) for g in data)} books, {len(data)} groups")
