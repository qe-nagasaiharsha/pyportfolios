"""Pytest bootstrap: make the `app` package importable regardless of the
directory pytest is invoked from (repo root or platform/)."""

import sys
from pathlib import Path

PLATFORM_DIR = Path(__file__).resolve().parent
if str(PLATFORM_DIR) not in sys.path:
    sys.path.insert(0, str(PLATFORM_DIR))
