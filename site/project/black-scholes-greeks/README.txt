Black-Scholes & the Greeks — shown through QQQ options
=======================================================

This project prices a 3-month QQQ option with the Black-Scholes model, computes
its Greeks, and saves two figures next to the files. You do NOT need to install
anything yourself — the launcher installs Python and the libraries for you (via
uv), the first time you run it. An internet connection is required (it downloads
QQQ price history and, on first run, the libraries).

HOW TO RUN
----------
Just double-click the launcher for your operating system:

  * macOS    ->  run-macos.command
  * Linux    ->  run-linux.sh
  * Windows  ->  run-windows.bat

A window will open, set everything up, run the project, and save the figures
into THIS folder. When it finishes you'll have:

  figure_1_greeks_across_strikes.png   Delta / Gamma / Vega / Theta vs moneyness
  figure_2_time_decay.png              call value vs time to expiry (Theta at work)

It also prints the option price, the Greeks, and two sanity checks to the
console: put-call parity and a Monte-Carlo re-pricing.

WHAT'S IN THE FOLDER
--------------------
  black_scholes_greeks.py     the runnable Python script (with its dependencies)
  black_scholes_greeks.ipynb  the same study as a Jupyter notebook
  run-macos.command           double-click launcher for macOS
  run-linux.sh                launcher for Linux
  run-windows.bat             double-click launcher for Windows
  README.txt                  this file

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

  python black_scholes_greeks.py

or, with uv installed:

  uv run black_scholes_greeks.py
