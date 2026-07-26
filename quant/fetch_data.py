"""
fetch_data.py - one-shot data pipeline for the 16-topic tutorial batch.

Downloads every dataset specified in TOPIC_CARDS.html (assets x timeframe per
card) via yfinance and caches them as CSV under quant/data/. Notebooks and the
article chart-baking scripts both read from this cache so results are
deterministic and reproducible across machines (cross-machine UX requirement,
ROADMAP CW29).

Usage:  python quant/fetch_data.py            # fetch everything missing
        python quant/fetch_data.py --force    # re-download all
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import pandas as pd
import yfinance as yf

DATA_DIR = Path(__file__).resolve().parent / "data"

# name -> (tickers, start, end)  -- end is exclusive per yfinance convention,
# so "through Dec 2024" means end="2025-01-01".
DATASETS: dict[str, tuple[list[str], str, str]] = {
    # T01 GBM - SPY, Jan 2018 - Dec 2024
    "t01_gbm": (["SPY"], "2018-01-01", "2025-01-01"),
    # T02 Black-Scholes - QQQ daily closes (trailing 1y realised vol), 2018-2024
    "t02_black_scholes": (["QQQ"], "2017-01-01", "2025-01-01"),  # extra year for trailing vol
    # T03 Bonds - Treasury yields (Fred-style tickers on Yahoo) + ETFs, calendar 2022
    "t03_bonds_etf": (["SHY", "IEF", "TLT"], "2021-12-01", "2023-01-10"),
    "t03_bonds_yields": (["^IRX", "^FVX", "^TNX", "^TYX"], "2021-12-01", "2023-01-10"),
    # T05 MVO - 6 ETFs, Jan 2015 - Dec 2024
    "t05_mvo": (["SPY", "TLT", "GLD", "VNQ", "VEA", "VWO"], "2015-01-01", "2025-01-01"),
    # T06 Black-Litterman - 5 iShares country ETFs, Jan 2015 - Dec 2024
    "t06_black_litterman": (["EWJ", "EWG", "EWU", "EWA", "EWC"], "2015-01-01", "2025-01-01"),
    # T07 Risk Parity - SPY TLT GLD DBC, Jan 2010 - Dec 2024
    "t07_risk_parity": (["SPY", "TLT", "GLD", "DBC"], "2010-01-01", "2025-01-01"),
    # T09 VaR - DAX, Jan 2010 - Dec 2024
    "t09_var_dax": (["^GDAXI"], "2010-01-01", "2025-01-01"),
    # T10 CVaR - HYG + VWO, Jan 2007 - Dec 2024 (incl. GFC)
    "t10_cvar": (["HYG", "VWO"], "2007-01-01", "2025-01-01"),
    # T11 Copulas - S&P 500 vs FTSE 100 vs Nikkei 225, Jan 2000 - Dec 2024
    "t11_copulas": (["^GSPC", "^FTSE", "^N225"], "2000-01-01", "2025-01-01"),
    # T13 SMA Crossover - QQQ + BTC-USD, Jan 2015 - Dec 2024
    "t13_sma": (["QQQ", "BTC-USD"], "2015-01-01", "2025-01-01"),
    # T14 Kalman - EWA / EWC pair, Jan 2010 - Dec 2024
    "t14_kalman": (["EWA", "EWC"], "2010-01-01", "2025-01-01"),
    # --- Louis batch (deferred articles, fetched now so data is pinned) ---
    # QI04 Heston - SPX/SPY options underlying, 2019-2024
    "qi04_heston": (["SPY", "^SPX"], "2019-01-01", "2025-01-01"),
    # CS08 60/40 - SPY + AGG + TLT, Jan 2000 - Dec 2023
    "cs08_6040": (["SPY", "AGG", "TLT"], "2000-01-01", "2024-01-01"),
    # QI12 Gaussian vs t-Copula - XLF vs XLK, Jan 2007 - Dec 2024
    "qi12_tcopula": (["XLF", "XLK"], "2007-01-01", "2025-01-01"),
    # CS15 GameStop - GME + XRT + ^VIX, Oct 2020 - Mar 2021
    "cs15_gamestop": (["GME", "XRT", "^VIX"], "2020-10-01", "2021-04-01"),
    # RN16 Alpha Decay - 11 SPDR sector ETFs, Jan 2005 - Dec 2024
    "rn16_sectors": (
        ["XLB", "XLE", "XLF", "XLI", "XLK", "XLP", "XLU", "XLV", "XLY", "XLRE", "XLC"],
        "2005-01-01", "2025-01-01",
    ),
}


def fetch(name: str, tickers: list[str], start: str, end: str, force: bool) -> str:
    out = DATA_DIR / f"{name}.csv"
    if out.exists() and not force:
        return f"skip   {name} (cached)"
    df = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)
    if df is None or df.empty:
        return f"EMPTY  {name}  <- check tickers {tickers}"
    # keep adjusted close only; one column per ticker
    close = df["Close"] if isinstance(df.columns, pd.MultiIndex) else df[["Close"]].rename(columns={"Close": tickers[0]})
    close = close.dropna(how="all")
    close.to_csv(out)
    missing = [t for t in tickers if t not in close.columns] if isinstance(df.columns, pd.MultiIndex) else []
    note = f"  MISSING COLS: {missing}" if missing else ""
    return f"ok     {name}  rows={len(close)} cols={close.shape[1] if close.ndim > 1 else 1}{note}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", nargs="*", help="dataset names to fetch")
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    names = args.only if args.only else list(DATASETS)
    failures = 0
    for name in names:
        tickers, start, end = DATASETS[name]
        try:
            msg = fetch(name, tickers, start, end, args.force)
        except Exception as exc:  # noqa: BLE001 - report and continue
            msg = f"FAIL   {name}  {type(exc).__name__}: {exc}"
        if msg.startswith(("FAIL", "EMPTY")):
            failures += 1
        print(msg, flush=True)
        time.sleep(0.5)  # be polite to Yahoo
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
