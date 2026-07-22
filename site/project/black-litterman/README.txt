The Black-Litterman Model - blending market equilibrium with your own views
===========================================================================

This project reverse-optimizes the market's implied returns from five country ETFs
(EWJ, EWG, EWU, EWA, EWC), blends in one view - Germany at 10%, 50% confidence -
and compares the Black-Litterman allocation against the market prior and naive MVO. You do
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

  figure_1_returns.png   implied prior vs Black-Litterman posterior returns
  figure_2_weights.png   allocations - market prior vs Black-Litterman vs naive MVO

It also runs the no-views sanity check (posterior must equal the prior).

WHAT'S IN THE FOLDER
--------------------
  black_litterman.py     the runnable Python script (with its dependencies)
  black_litterman.ipynb  the same study as a Jupyter notebook
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
If you already have Python with numpy, pandas, matplotlib, yfinance and pyportfolioopt
installed, you can also just run:

  python black_litterman.py

or, with uv installed:

  uv run black_litterman.py
