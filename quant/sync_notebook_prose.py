"""sync_notebook_prose.py — make a notebook read exactly like its article.

Harsha, 26 Aug: "the articles in the folder must be same as the articles in the
website". The two had drifted completely — barely a sentence in common — because
the article prose was rewritten in place while the notebooks kept the wording
their generator was written with.

WHAT THIS DOES (option A, agreed): replaces every markdown cell with the
article's own prose, lifted from the built page so the numbers are the ones the
site shows. It does NOT touch the code cells. The article prints only teaching
excerpts — six lines of SMA's ninety-seven — and six of the eleven snippets on
the site reference data they never load, so a notebook built from the article's
code would not run. The notebook keeps the working program.

CODE ORDER IS THE HARD CONSTRAINT. A notebook executes top to bottom, so the
code cells must keep their relative order no matter how the article is arranged.
Where the two documents disagree — CVaR loads its data before "What VaR cannot
see" while the article does the reverse — the code stays put and rides under
whichever section keeps the order legal. Hence the hand-written maps below:
each entry says which article block a code cell follows, and each list must be
non-decreasing. That is asserted, not assumed.

Usage:  python quant/sync_notebook_prose.py [--check]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from article_prose import article_blocks  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
NB = REPO / "vault" / "notebooks"

# code-cell index -> article block index it should follow. Non-decreasing.
# Block 0 is the title + lead; the last block is the references.
PLACEMENT = {
    # setup, data, hist, parametric, MC, backtest x2, engines
    "var-three-ways": [0, 1, 2, 3, 4, 5, 5, 6],
    # setup, data, blind-spot, t-fit, estimates, subadditivity, GFC, riskfolio
    # (data loads early in the notebook, so it rides under article section 1)
    "cvar-expected-shortfall": [0, 1, 1, 3, 3, 4, 5, 6],
    # setup, data, correlations, pseudo-obs, gaussian, t-mle, tail, crash
    "copulas-tail-dependence": [0, 1, 1, 2, 3, 4, 4, 5],
    # setup, data, rule, equity, vectorbt, pyfolio, grid, costs
    "sma-crossover-backtest": [0, 1, 2, 3, 3, 3, 4, 5],
    # setup, data, OLS, filter, three betas, trading, scoreboard
    "kalman-filter-hedge-ratios": [0, 1, 2, 3, 4, 5, 6],
}


def md_cell(text: str) -> dict:
    """nbformat stores source as a list of lines that each KEEP their newline.
    Splitting on "\\n" without keepends drops them, and Jupyter then renders
    "# Title" welded onto the first paragraph — caught only by reading the
    written file back, not by any cell count."""
    return {"cell_type": "markdown", "metadata": {}, "source": text.splitlines(keepends=True)}


def rebuild(slug: str) -> tuple[list, list]:
    nb = json.loads((NB / f"{slug}.ipynb").read_text(encoding="utf-8"))
    code = [c for c in nb["cells"] if c["cell_type"] == "code"]
    blocks = article_blocks(slug)
    place = PLACEMENT[slug]

    if len(place) != len(code):
        raise SystemExit(f"{slug}: placement has {len(place)} entries, notebook has {len(code)} code cells")
    if any(b >= len(blocks) for b in place):
        raise SystemExit(f"{slug}: placement points past the last article block ({len(blocks) - 1})")
    if place != sorted(place):
        raise SystemExit(f"{slug}: placement is not non-decreasing — code order would break")

    cells: list = []
    for i, b in enumerate(blocks):
        cells.append(md_cell(b["md"]))
        for ci, target in enumerate(place):
            if target == i:
                cells.append(code[ci])

    nb["cells"] = cells
    return nb, code


def main() -> None:
    check = "--check" in sys.argv
    for slug in PLACEMENT:
        nb, code = rebuild(slug)
        kept = [c for c in nb["cells"] if c["cell_type"] == "code"]
        assert kept == code, f"{slug}: code cells changed — they must not"
        if not check:
            (NB / f"{slug}.ipynb").write_text(
                json.dumps(nb, indent=1, ensure_ascii=False), encoding="utf-8"
            )
        n_md = sum(1 for c in nb["cells"] if c["cell_type"] == "markdown")
        print(f"  {slug:<32} {n_md} markdown + {len(kept)} code cells"
              f"{'  (check only)' if check else ''}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main()
