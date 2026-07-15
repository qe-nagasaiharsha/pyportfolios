Geometric Brownian Motion — simulating price paths through SPY
==============================================================

This project calibrates a Geometric Brownian Motion model to SPY, simulates a
thousand five-year price paths, and saves two figures next to the files. You do
NOT need to install anything yourself — the launcher installs Python and the
libraries for you (via uv), the first time you run it. An internet connection is
required (it downloads SPY price history and, on first run, the libraries).

HOW TO RUN
----------
Just double-click the launcher for your operating system:

  * macOS    ->  run-macos.command
  * Linux    ->  run-linux.sh
  * Windows  ->  run-windows.bat

A window will open, set everything up, run the project, and save the figures
into THIS folder. When it finishes you'll have:

  figure_1_paths.png     1,000 GBM price paths — the cone of plausible futures
  figure_2_terminal.png  terminal price distribution vs the theoretical log-normal

It also prints the calibrated drift and volatility, and a martingale sanity
check (with zero drift, the mean terminal price should sit back at today's spot).

WHAT'S IN THE FOLDER
--------------------
  brownian_motion.py     the runnable Python script (with its dependencies)
  brownian_motion.ipynb  the same study as a Jupyter notebook
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
If you already have Python with numpy, scipy, matplotlib, pandas and yfinance
installed, you can also just run:

  python brownian_motion.py

or, with uv installed:

  uv run brownian_motion.py
