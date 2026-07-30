"""
gen_journal_logos.py - journal logo marks for the Papers tab (ROADMAP CW30 due item).

Generates clean typographic SVG monograms (classic journal-masthead style:
thin rules + serif abbreviation + teal accent) into site/public/logos/papers/,
then wires `logo: "<file>.svg"` onto every paper in site/src/lib/literature.ts
that has a matching journal and no logo yet.

Design rationale: consistent original marks instead of scraped third-party
logo files - uniform sizing in the 48px white slot, no trademark assets.
"""

from __future__ import annotations

import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "site" / "public" / "logos" / "papers"
LIT = REPO / "site" / "src" / "lib" / "literature.ts"

# canonical journal name -> (slug, abbreviation)
JOURNALS: dict[str, tuple[str, str]] = {
    "The Journal of Finance": ("journal-of-finance", "JF"),
    "Review of Economic Studies": ("review-of-economic-studies", "RES"),
    "The Review of Economic Studies": ("review-of-economic-studies", "RES"),
    "Journal of Political Economy": ("journal-of-political-economy", "JPE"),
    "Bell Journal of Economics": ("bell-journal-of-economics", "BJE"),
    "The Bell Journal of Economics and Management Science": ("bell-journal-of-economics", "BJE"),
    "Journal of Economic Theory": ("journal-of-economic-theory", "JET"),
    "Journal of Financial Economics": ("journal-of-financial-economics", "JFE"),
    "Econometrica": ("econometrica", "ECTA"),
    "Journal of Econometrics": ("journal-of-econometrics", "JoE"),
    "Financial Analysts Journal": ("financial-analysts-journal", "FAJ"),
    "The Journal of Business": ("journal-of-business", "JB"),
    "Quantitative Finance": ("quantitative-finance", "QF"),
    "equities market. Quantitative Finance": ("quantitative-finance", "QF"),  # data quirk upstream
    "The Review of Financial Studies": ("review-of-financial-studies", "RFS"),
    "Review of Financial Studies": ("review-of-financial-studies", "RFS"),
    "Mathematical Finance": ("mathematical-finance", "MF"),
    "The Quarterly Journal of Economics": ("quarterly-journal-of-economics", "QJE"),
    "The Review of Economics and Statistics": ("review-of-economics-and-statistics", "REStat"),
    "The Journal of Portfolio Management": ("journal-of-portfolio-management", "JPM"),
    "Journal of Portfolio Management": ("journal-of-portfolio-management", "JPM"),
    "The Journal of Risk": ("journal-of-risk", "JoR"),
    "Journal of Risk": ("journal-of-risk", "JoR"),
    "Journal of Empirical Finance": ("journal-of-empirical-finance", "JEF"),
    "Notices of the American Mathematical Society": ("notices-of-the-ams", "AMS"),
    "Journal of Computational Finance": ("journal-of-computational-finance", "JCF"),
    "IEEE Transactions on Signal Processing": ("ieee-transactions-signal-processing", "IEEE"),
    "The Journal of Financial Data Science": ("journal-of-financial-data-science", "JFDS"),
}

FONT_BY_LEN = {1: 46, 2: 44, 3: 36, 4: 28, 5: 24, 6: 21}


def svg(abbr: str, full: str) -> str:
    size = FONT_BY_LEN.get(len(abbr), 20)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="{full}">
  <!-- generated mark - quant/gen_journal_logos.py -->
  <rect width="120" height="120" fill="#ffffff"/>
  <line x1="18" y1="26" x2="102" y2="26" stroke="#12181f" stroke-width="2"/>
  <line x1="18" y1="30.5" x2="102" y2="30.5" stroke="#12181f" stroke-width="0.75"/>
  <rect x="55" y="20" width="10" height="3.5" fill="#0a8a8a"/>
  <text x="60" y="76" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="{size}" font-weight="700" letter-spacing="0.5" fill="#12181f">{abbr}</text>
  <line x1="18" y1="94" x2="102" y2="94" stroke="#12181f" stroke-width="0.75"/>
  <line x1="18" y1="98.5" x2="102" y2="98.5" stroke="#12181f" stroke-width="2"/>
</svg>
"""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    written = set()
    for full, (slug, abbr) in JOURNALS.items():
        if slug in written:
            continue
        (OUT / f"{slug}.svg").write_text(svg(abbr, full), encoding="utf-8")
        written.add(slug)
    print(f"svg marks written: {len(written)}")

    src = LIT.read_text(encoding="utf-8")

    # 1) single-line paper objects: { year: ..., journal: "X", ... } -> add logo after journal
    def add_inline(m: re.Match[str]) -> str:
        journal = m.group(2)
        if journal not in JOURNALS:
            return m.group(0)
        slug = JOURNALS[journal][0]
        return f'{m.group(1)}journal: "{journal}", logo: "{slug}.svg",'

    src = re.sub(r'(\{[^\n{}]*?)journal: "([^"]+)",(?![^\n{}]*logo:)', add_inline, src)

    # 2) multi-line objects: journal on its own line -> insert logo line after (skip interface def)
    lines = src.split("\n")
    out_lines: list[str] = []
    for i, line in enumerate(lines):
        out_lines.append(line)
        m = re.match(r'^(\s+)journal: "([^"]+)",\s*$', line)
        if not m:
            continue
        indent, journal = m.group(1), m.group(2)
        if journal not in JOURNALS:
            continue
        # skip if the object already carries a logo (look a few lines around)
        window = "\n".join(lines[max(0, i - 6): i + 7])
        if re.search(r"\blogo:", window):
            continue
        out_lines.append(f'{indent}logo: "{JOURNALS[journal][0]}.svg",')
    src = "\n".join(out_lines)

    LIT.write_text(src, encoding="utf-8")
    n = len(re.findall(r'logo: "[a-z-]+\.svg"', src))
    print(f"logo fields now in literature.ts: {n}")


if __name__ == "__main__":
    main()
