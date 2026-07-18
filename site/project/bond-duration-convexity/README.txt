Bond Pricing, Duration & Convexity — via US Treasuries and the ETFs of 2022
============================================================================

This project prices fixed-coupon bonds, computes duration and convexity, prints
the duration ladder, checks the theory against the SHY/IEF/TLT ETF drawdowns of
2022, and saves three figures next to the files. You do NOT need to install
anything yourself — the launcher installs Python and the libraries for you (via
uv), the first time you run it. An internet connection is required (it downloads
ETF price history and, on first run, the libraries).

HOW TO RUN
----------
Just double-click the launcher for your operating system:

  * macOS    ->  run-macos.command
  * Linux    ->  run-linux.sh
  * Windows  ->  run-windows.bat

A window will open, set everything up, run the project, and save the figures
into THIS folder. When it finishes you'll have:

  figure_1_price_yield.png   price vs yield for 2y / 10y / 30y Treasuries
  figure_2_etf_2022.png      SHY / IEF / TLT through 2022 (indexed to 100)
  figure_3_taylor.png        30y bond: duration vs duration+convexity vs exact

It also prints a quick bond check, the duration ladder, the 2022 ETF
predicted-vs-actual comparison, and a Taylor-approximation sanity check.

WHAT'S IN THE FOLDER
--------------------
  bond_duration_convexity.py     the runnable Python script (with its dependencies)
  bond_duration_convexity.ipynb  the same study as a Jupyter notebook
  run-macos.command              double-click launcher for macOS
  run-linux.sh                   launcher for Linux
  run-windows.bat                double-click launcher for Windows
  README.txt                     this file

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

  python bond_duration_convexity.py

or, with uv installed:

  uv run bond_duration_convexity.py
