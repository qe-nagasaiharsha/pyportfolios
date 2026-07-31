"""
qa_notebooks.py - execute every vault notebook headlessly (ROADMAP CW35 QA).

Each notebook is standalone (self-downloads its data), so this is the real
user experience: fresh kernel, top-to-bottom run. Prints PASS/FAIL per
notebook and exits non-zero on any failure.

With --write, the executed notebook (charts and printed results embedded) is
saved back over the vault copy, so customers open a notebook and SEE the
results before running anything. Re-run after any pipeline change.
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import nbformat
from nbclient import NotebookClient

VAULT = Path(__file__).resolve().parent.parent / "vault" / "notebooks"


def run(path: Path, write: bool) -> tuple[bool, float, str]:
    t0 = time.time()
    try:
        nb = nbformat.read(path, as_version=4)
        # resources.metadata.path -> relative paths inside the notebook resolve
        NotebookClient(
            nb, timeout=600, kernel_name="python3",
            resources={"metadata": {"path": str(path.parent)}},
        ).execute()
        errs = [
            o for c in nb.cells if c.cell_type == "code"
            for o in c.get("outputs", []) if o.get("output_type") == "error"
        ]
        if errs:
            return False, time.time() - t0, errs[0].get("ename", "error")
        if write:
            nbformat.write(nb, path)
        return True, time.time() - t0, ""
    except Exception as exc:  # noqa: BLE001
        return False, time.time() - t0, f"{type(exc).__name__}: {str(exc)[:200]}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true",
                    help="save executed notebooks (with outputs) back to vault/")
    args = ap.parse_args()

    failures = 0
    books = sorted(VAULT.glob("*.ipynb"))
    for i, p in enumerate(books, 1):
        ok, dt, err = run(p, args.write)
        status = "PASS" if ok else "FAIL"
        size = p.stat().st_size / 1024
        print(f"[{i:2d}/{len(books)}] {status}  {p.stem:45s} {dt:6.1f}s  {size:7.0f} KB  {err}", flush=True)
        failures += 0 if ok else 1
    print(f"\n{len(books) - failures}/{len(books)} notebooks pass"
          f"{' (outputs written)' if args.write else ''}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
