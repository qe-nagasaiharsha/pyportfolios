Risk Parity from Scratch - allocating by risk, not capital, in five futures
===========================================================================

This project measures each asset's risk contribution in a five-futures portfolio
(ES, ZN, GC, HG, CL), solves the risk-parity weights from scratch with SciPy,
validates them against Riskfolio-lib, and levers the book to a 10% vol target. You do
NOT need to install anything yourself - the launcher installs Python and the
libraries for you (via uv), the first time you run it. An internet connection is
required (it downloads the price history and, on first run, the libraries).

HOW TO RUN
----------
Just double-click the launcher for your operating system:

  * macOS    ->  run-macos.command
  * Linux    ->  run-linux.sh
  * Windows  ->  run-windows.bat

A window will open, set everything up, run the project, and save the figures
into THIS folder. When it finishes you'll have:

  figure_1_risk_shares.png capital vs risk shares - equal weight vs risk parity

It also prints the equal-weight risk decomposition and the levered weights.

WHAT'S IN THE FOLDER
--------------------
  risk_parity_futures.py the runnable Python script (with its dependencies)
  risk_parity_futures.ipynb the same study as a Jupyter notebook
  run-macos.command      double-click launcher for macOS
  run-linux.sh           launcher for Linux
  run-windows.bat        double-click launcher for Windows
  README.txt             this file

FIRST-TIME PERMISSION NOTES
---------------------------
Because these files were downloaded from the internet, your OS may ask you to
confirm before running them the first time:

  macOS:  if you see "cannot be opened because it is from an unidentified
          developer", right-click run-macos.command -> Open -> Open.
  Linux:  if double-click only opens the file, either mark it executable
          (right-click -> Properties -> Permissions -> Allow executing), or
          open a terminal in this folder and run:  bash run-linux.sh
  Windows: if SmartScreen appears, click "More info" -> "Run anyway".

RUNNING IT MANUALLY (optional)
------------------------------
If you already have Python with numpy, pandas, scipy, matplotlib, yfinance and riskfolio-lib
installed, you can also just run:

  python risk_parity_futures.py

or, with uv installed:

  uv run risk_parity_futures.py
