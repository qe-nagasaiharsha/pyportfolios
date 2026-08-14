"""
build_bundles.py - downloadable run-anywhere ZIP per article.

For every notebook in site/public/notebooks/, produce
site/public/bundles/<slug>.zip containing:

  <slug>/
    <slug>.ipynb          the runnable companion notebook
    requirements.txt      per-article dependency set
    run-windows.bat       double-click on Windows  (CRLF line endings)
    run-mac.command       double-click on macOS    (LF, executable bit set)
    run-linux.sh          double-click / bash on Linux (LF, executable bit)
    README.txt            what to do on each OS

Each launcher: checks Python, creates a local .venv next to the files,
installs requirements into it, and opens the notebook in Jupyter Lab.
Idempotent - the second double-click skips straight to Jupyter.

Line endings and the Unix executable bit are set explicitly inside the zip
(external_attr), because bat needs CRLF and sh/command need LF + 0755.

Usage: python quant/build_bundles.py
"""

from __future__ import annotations

import json
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
# vault/ = the paid product, served only through the gated platform API
NB_DIR = REPO / "vault" / "notebooks"
OUT = REPO / "vault" / "bundles"
META = REPO / "quant" / "meta"

CORE = ["numpy", "pandas", "scipy", "matplotlib", "yfinance", "jupyterlab"]

# meta stack name -> pip package name
PIP_NAME = {
    "NumPy": "numpy", "Pandas": "pandas", "SciPy": "scipy",
    "matplotlib": "matplotlib", "Matplotlib": "matplotlib",
    "yfinance": "yfinance", "statsmodels": "statsmodels",
    "PyPortfolioOpt": "PyPortfolioOpt", "Riskfolio-Lib": "Riskfolio-Lib",
    "Polars": "polars", "DuckDB": "duckdb",
    "vectorbt": "vectorbt", "Pyfolio": "pyfolio-reloaded",
    "seaborn": "seaborn", "QuantLib": "QuantLib", "Alphalens": "alphalens-reloaded",
}

# legacy articles (pre-Batch-1) get a safe superset
LEGACY_REQS = CORE + ["statsmodels", "scikit-learn", "seaborn"]


def requirements_for(slug: str) -> list[str]:
    meta = META / f"{slug}.json"
    if not meta.exists():
        return LEGACY_REQS
    stack = json.loads(meta.read_text(encoding="utf-8"))["stack"]
    extras = [PIP_NAME[s] for s in stack if s in PIP_NAME]
    seen: dict[str, None] = {}
    for pkg in CORE + extras:
        seen.setdefault(pkg, None)
    return list(seen)


def bat(slug: str) -> str:
    """Windows launcher - CRLF applied at write time."""
    return f"""@echo off
rem pyportfolios.com - double-click launcher for {slug}
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
    echo Python 3.10+ is required but was not found on PATH.
    echo Install it from https://www.python.org/downloads/ ^(tick "Add python.exe to PATH"^).
    pause
    exit /b 1
)
if not exist ".venv" (
    echo First run - creating an isolated environment ^(one-time, a few minutes^)...
    python -m venv .venv || (echo venv creation failed & pause & exit /b 1)
)
call ".venv\\Scripts\\activate.bat"
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r requirements.txt || (echo dependency install failed & pause & exit /b 1)
echo Opening the notebook in Jupyter Lab - keep this window open while you work.
python -m jupyter lab "{slug}.ipynb"
pause
"""


def sh(slug: str, mac: bool) -> str:
    """POSIX launcher - LF only. Same script serves .sh and .command."""
    os_name = "macOS" if mac else "Linux"
    return f"""#!/usr/bin/env bash
# pyportfolios.com - double-click launcher for {slug} ({os_name})
set -e
cd "$(dirname "$0")"

PY="$(command -v python3 || command -v python || true)"
if [ -z "$PY" ]; then
  echo "Python 3.10+ is required but was not found."
  echo "macOS: brew install python   |   Debian/Ubuntu: sudo apt install python3 python3-venv"
  read -r -p "Press Enter to close..." _
  exit 1
fi

if [ ! -d .venv ]; then
  echo "First run - creating an isolated environment (one-time, a few minutes)..."
  "$PY" -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r requirements.txt
echo "Opening the notebook in Jupyter Lab - keep this terminal open while you work."
python -m jupyter lab "{slug}.ipynb"
"""


def readme(slug: str, reqs: list[str]) -> str:
    return f"""pyportfolios.com - runnable notebook bundle
============================================

Notebook : {slug}.ipynb
Requires : Python 3.10+ and an internet connection on first run
           (dependencies install into a local .venv; market data downloads
           itself via yfinance). Nothing is installed system-wide.

How to run
----------
Windows : double-click  run-windows.bat
macOS   : double-click  run-mac.command
          (first time: right-click -> Open, to pass Gatekeeper; if it will
          not run:  chmod +x run-mac.command  in Terminal once)
Linux   : double-click  run-linux.sh  (or:  bash run-linux.sh)

Any OS, manually:
    python -m venv .venv
    .venv\\Scripts\\activate      (Windows)   |   source .venv/bin/activate (POSIX)
    pip install -r requirements.txt
    jupyter lab {slug}.ipynb

What it installs
----------------
{chr(10).join("  - " + r for r in reqs)}

Troubleshooting
---------------
Windows: if the first run says "venv creation failed", the folder is nested
too deep (Windows path-length limit). Move this folder somewhere short,
e.g. C:\notebooks\, and double-click again.

Reproducibility
---------------
Random draws are seeded (default_rng(42)) so results match the article.
Yahoo occasionally restates adjusted closes; tiny third-decimal drifts are
the data vendor, not your machine.

(c) pyportfolios.com - where finance theory, coding & markets converge
"""


def build(slug: str) -> None:
    reqs = requirements_for(slug)
    OUT.mkdir(parents=True, exist_ok=True)
    zpath = OUT / f"{slug}.zip"

    def add(zf: zipfile.ZipFile, name: str, text: str, crlf: bool, exe: bool) -> None:
        data = text.replace("\r\n", "\n")
        if crlf:
            data = data.replace("\n", "\r\n")
        info = zipfile.ZipInfo(f"{slug}/{name}", date_time=(2026, 7, 27, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o755 if exe else 0o644) << 16
        zf.writestr(info, data.encode("utf-8"))

    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as zf:
        nb_info = zipfile.ZipInfo(f"{slug}/{slug}.ipynb", date_time=(2026, 7, 27, 0, 0, 0))
        nb_info.compress_type = zipfile.ZIP_DEFLATED
        nb_info.external_attr = 0o644 << 16
        zf.writestr(nb_info, (NB_DIR / f"{slug}.ipynb").read_bytes())
        add(zf, "requirements.txt", "\n".join(reqs) + "\n", crlf=False, exe=False)
        add(zf, "run-windows.bat", bat(slug), crlf=True, exe=False)
        add(zf, "run-mac.command", sh(slug, mac=True), crlf=False, exe=True)
        add(zf, "run-linux.sh", sh(slug, mac=False), crlf=False, exe=True)
        add(zf, "README.txt", readme(slug, reqs), crlf=False, exe=False)
    print(f"ok  {zpath.name}  ({zpath.stat().st_size / 1024:.0f} KB, {len(reqs)} reqs)")


def main() -> None:
    slugs = sorted(p.stem for p in NB_DIR.glob("*.ipynb"))
    for slug in slugs:
        build(slug)
    print(f"bundles: {len(slugs)}")


if __name__ == "__main__":
    main()
