Mean-Variance Optimization & the Efficient Frontier - a six-asset portfolio
===========================================================================

This project builds the Markowitz efficient frontier from six asset-class ETFs
(SPY, TLT, GLD, VNQ, VEA, VWO), draws a 20,000-portfolio Monte-Carlo cloud, and
solves for the exact minimum-variance and maximum-Sharpe portfolios. You do
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

  figure_1_correlation.png the correlation matrix - the source of the free lunch
  figure_2_frontier.png  the Monte-Carlo bullet, exact frontier and the two optima

It also prints each asset's return/vol/Sharpe and the two optimal weight vectors.

WHAT'S IN THE FOLDER
--------------------
  mvo_efficient_frontier.py the runnable Python script (with its dependencies)
  mvo_efficient_frontier.ipynb the same study as a Jupyter notebook
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

  python mvo_efficient_frontier.py

or, with uv installed:

  uv run mvo_efficient_frontier.py
