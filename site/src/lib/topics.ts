/* ============================================================================
   Topic report cards â€” Batch 1 (ROADMAP CW31, Bhavya).
   16 topics across the 4 site categories Ã— 4 content formats, specs per
   TOPIC_CARDS.html / INSTRUMENTS. Each card records exactly what the piece
   covers: libraries, assets, timeframe, and why a practitioner cares.
   `article` links to the live piece once it ships; `upcoming` marks the
   editorial (Louis) pieces still in the writing queue.
   ========================================================================== */

import type { ArticleFormat, CategorySlug } from "@/lib/articles";

export interface TopicCard {
  /** 01â€“16, batch order. */
  no: number;
  format: ArticleFormat;
  title: string;
  category: CategorySlug;
  libraries: string[];
  assets: string;
  timeframe: string;
  /** Why a practitioner cares â€” the card's "Use" line. */
  use: string;
  /** Slug under /research when the piece is live. */
  article?: string;
  /** Still being written (editorial pipeline). */
  upcoming?: boolean;
  /** Writing lane, for the pipeline view. */
  lane: "quant" | "editorial";
}

export const TOPIC_CARDS: TopicCard[] = [
  /* ------------------------------ 01 Â· Quant Foundations & Derivatives -- */
  {
    no: 1,
    format: "Tutorial",
    title: "GBM: Simulating Price Paths",
    category: "quant-finance-foundations",
    libraries: ["NumPy", "Pandas", "Matplotlib", "yfinance", "SciPy"],
    assets: "SPY (S&P 500 ETF, State Street)",
    timeframe: "Jan 2018 â€“ Dec 2024",
    use: "Scenario cones for wealth projections; the engine inside Monte-Carlo pricing & risk systems.",
    article: "brownian-motion",
    lane: "quant",
  },
  {
    no: 2,
    format: "Tutorial",
    title: "Blackâ€“Scholes & the Greeks",
    category: "quant-finance-foundations",
    libraries: ["NumPy", "SciPy", "Matplotlib"],
    assets: "QQQ options (Nasdaq 100 ETF, Invesco)",
    timeframe: "Jan 2018 â€“ Dec 2024 (trailing 1y vol)",
    use: "Pricing & hedging options; implied vol is how the entire options market quotes prices.",
    article: "black-scholes-greeks",
    lane: "quant",
  },
  {
    no: 3,
    format: "Tutorial",
    title: "Bond Pricing, Duration & Convexity",
    category: "quant-finance-foundations",
    libraries: ["NumPy", "Pandas", "Matplotlib", "yfinance"],
    assets: "US Treasuries (2yâ€“30y) + SHY / IEF / TLT (iShares)",
    timeframe: "Static pricing + calendar year 2022",
    use: "Measuring rate risk; duration targeting and the Â±100bp stress tests in every risk report.",
    article: "bond-duration-convexity",
    lane: "quant",
  },
  {
    no: 4,
    format: "Quant Insights",
    title: "Heston vs Blackâ€“Scholes: Fitting the Vol Smile",
    category: "quant-finance-foundations",
    libraries: ["QuantLib", "SciPy", "NumPy"],
    assets: "SPX / SPY options",
    timeframe: "2019 â€“ 2024 + recent option chain",
    use: "Pricing options consistently across strikes â€” the vol desk's answer to the smile BS can't fit.",
    upcoming: true,
    lane: "editorial",
  },

  /* ----------------------------------------- 02 Â· Portfolio Optimization -- */
  {
    no: 5,
    format: "Tutorial",
    title: "MVO & the Efficient Frontier",
    category: "portfolio-optimization",
    libraries: ["PyPortfolioOpt", "Pandas", "Matplotlib"],
    assets: "SPY Â· TLT Â· GLD Â· VNQ Â· VEA Â· VWO",
    timeframe: "Jan 2015 â€“ Dec 2024",
    use: "Core asset allocation: finding the best return per unit of risk across a portfolio.",
    article: "mvo-efficient-frontier",
    lane: "quant",
  },
  {
    no: 6,
    format: "Tutorial",
    title: "Blackâ€“Litterman: Equilibrium + Views",
    category: "portfolio-optimization",
    libraries: ["PyPortfolioOpt (BL)", "NumPy"],
    assets: "EWJ Â· EWG Â· EWU Â· EWA Â· EWC (iShares country ETFs)",
    timeframe: "Jan 2015 â€“ Dec 2024",
    use: "Blending market-implied returns with your own views â€” stable weights without extreme bets.",
    article: "black-litterman",
    lane: "quant",
  },
  {
    no: 7,
    format: "Tutorial",
    title: "Risk Parity from Scratch",
    category: "portfolio-optimization",
    libraries: ["SciPy (build)", "Riskfolio-Lib (validate)"],
    assets: "SPY Â· TLT Â· GLD Â· DBC",
    timeframe: "Jan 2010 â€“ Dec 2024",
    use: "Allocating by risk contribution instead of capital â€” the all-weather portfolio blueprint.",
    article: "risk-parity-futures",
    lane: "quant",
  },
  {
    no: 8,
    format: "Case Study",
    title: "60/40 in 2022: When Correlation Flipped",
    category: "portfolio-optimization",
    libraries: ["Pandas", "statsmodels", "seaborn"],
    assets: "SPY + AGG (+ TLT for the long-duration pain)",
    timeframe: "Jan 2000 â€“ Dec 2023, focus 2022",
    use: "Stress-testing the diversification assumption every balanced portfolio silently relies on.",
    upcoming: true,
    lane: "editorial",
  },

  /* --------------------------------------------- 03 Â· Risk Management -- */
  {
    no: 9,
    format: "Tutorial",
    title: "VaR Three Ways",
    category: "risk-management",
    libraries: ["NumPy", "SciPy", "Pandas", "Polars", "DuckDB"],
    assets: "DAX (^GDAXI)",
    timeframe: "Jan 2010 â€“ Dec 2024",
    use: "Daily loss limits and regulatory capital â€” the industry's standard downside risk number.",
    article: "var-three-ways",
    lane: "quant",
  },
  {
    no: 10,
    format: "Tutorial",
    title: "CVaR / Expected Shortfall",
    category: "risk-management",
    libraries: ["SciPy", "Riskfolio-Lib"],
    assets: "HYG + VWO (fat-tailed assets)",
    timeframe: "Jan 2007 â€“ Dec 2024 (incl. GFC)",
    use: "Sizing tail risk when the losses beyond VaR are what actually hurt â€” Basel's chosen measure.",
    article: "cvar-expected-shortfall",
    lane: "quant",
  },
  {
    no: 11,
    format: "Tutorial",
    title: "Copulas & Tail Dependence",
    category: "risk-management",
    libraries: ["SciPy", "statsmodels", "seaborn"],
    assets: "S&P 500 vs FTSE 100 vs Nikkei 225",
    timeframe: "Jan 2000 â€“ Dec 2024",
    use: "Modelling joint crashes across markets for multi-asset stress scenarios.",
    article: "copulas-tail-dependence",
    lane: "quant",
  },
  {
    no: 12,
    format: "Quant Insights",
    title: "Gaussian vs t-Copula: Joint Crashes",
    category: "risk-management",
    libraries: ["SciPy", "NumPy", "seaborn"],
    assets: "XLF vs XLK (SPDR sectors)",
    timeframe: "Jan 2007 â€“ Dec 2024",
    use: "Choosing a dependence model that doesn't underestimate crash correlation (2008's lesson).",
    upcoming: true,
    lane: "editorial",
  },

  /* ------------------------------------------ 04 Â· Algorithmic Trading -- */
  {
    no: 13,
    format: "Tutorial",
    title: "SMA Crossover Backtest",
    category: "algorithmic-trading",
    libraries: ["vectorbt", "Pandas", "Pyfolio"],
    assets: "QQQ + BTC-USD (trend behaves differently per asset)",
    timeframe: "Jan 2015 â€“ Dec 2024",
    use: "The systematic trend-following workhorse â€” and backtesting discipline 101.",
    article: "sma-crossover-backtest",
    lane: "quant",
  },
  {
    no: 14,
    format: "Tutorial",
    title: "Kalman Filters: Dynamic Hedge Ratios",
    category: "algorithmic-trading",
    libraries: ["NumPy (build the filter)", "statsmodels", "Pandas"],
    assets: "EWA / EWC pair (Australia / Canada)",
    timeframe: "Jan 2010 â€“ Dec 2024",
    use: "Adaptive hedge ratios for pairs trading â€” reacting to relationships that drift over time.",
    article: "kalman-filter-hedge-ratios",
    lane: "quant",
  },
  {
    no: 15,
    format: "Case Study",
    title: "GameStop: When Momentum Models Broke",
    category: "algorithmic-trading",
    libraries: ["Pandas", "Matplotlib", "yfinance"],
    assets: "GME + XRT + ^VIX",
    timeframe: "Oct 2020 â€“ Mar 2021 (event window)",
    use: "Understanding crowding and short-squeeze risk before your systematic strategy meets one.",
    upcoming: true,
    lane: "editorial",
  },
  {
    no: 16,
    format: "Research Note",
    title: "Alpha Decay: Momentum's Half-Life",
    category: "algorithmic-trading",
    libraries: ["Alphalens", "Pandas", "statsmodels"],
    assets: "11 SPDR sector ETFs",
    timeframe: "Jan 2005 â€“ Dec 2024",
    use: "Deciding how fast to trade a signal before its edge evaporates â€” sets turnover & capacity.",
    upcoming: true,
    lane: "editorial",
  },
];
