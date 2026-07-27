"""
qa_notebooks.py - execute every vault notebook headlessly (ROADMAP CW35 QA).

Each notebook is standalone (self-downloads its data), so this is the real
user experience: fresh kernel, top-to-bottom run. Prints PASS/FAIL per
notebook and exits non-zero on any failure.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

import nbformat
from nbclient import NotebookClient

VAULT = Path(__file__).resolve().parent.parent / "vault" / "notebooks"


def run(path: Path) -> tuple[bool, float, str]:
    t0 = time.time()
    try:
        nb = nbformat.read(path, as_version=4)
        NotebookClient(nb, timeout=600, kernel_name="python3").execute()
        errs = [
            o for c in nb.cells if c.cell_type == "code"
            for o in c.get("outputs", []) if o.get("output_type") == "error"
        ]
        if errs:
            return False, time.time() - t0, errs[0].get("ename", "error")
        return True, time.time() - t0, ""
    except Exception as exc:  # noqa: BLE001
        return False, time.time() - t0, f"{type(exc).__name__}: {str(exc)[:200]}"


def main() -> int:
    failures = 0
    books = sorted(VAULT.glob("*.ipynb"))
    for i, p in enumerate(books, 1):
        ok, dt, err = run(p)
        status = "PASS" if ok else "FAIL"
        print(f"[{i:2d}/{len(books)}] {status}  {p.stem:45s} {dt:6.1f}s  {err}", flush=True)
        failures += 0 if ok else 1
    print(f"\n{len(books) - failures}/{len(books)} notebooks pass")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
