#!/usr/bin/env bash
# Risk Parity — one-click runner for macOS.
# Double-click this file.
# It installs uv (which installs Python + the libraries) and runs the project.
# Figures are saved into this same folder.

set -e
cd "$(dirname "$0")"   # work from THIS folder, wherever it is (path-independent)

echo "=================================================="
echo "  Risk Parity project"
echo "=================================================="

# 1) Install uv (Astral) if it isn't already present. uv manages Python + deps.
if ! command -v uv >/dev/null 2>&1 && [ ! -x "$HOME/.local/bin/uv" ]; then
  echo "Installing uv (one-time, needs internet)..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

# 2) Run the script. uv reads its inline dependencies, installs the right Python
#    version if needed, sets up an isolated environment, and runs it.
echo "Setting up Python + libraries and running the project..."
uv run risk_parity_futures.py

echo ""
echo "Finished. The figures are in this folder:"
echo "  $(pwd)"
read -p "Press Enter to close this window..."
