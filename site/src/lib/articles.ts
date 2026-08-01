/* ============================================================================
   Article catalogue — Milestone 2 (Upwork).
   4 categories × 2 articles = 8 article pages, each with a runnable notebook.
   Metadata + table-of-contents live here; each article's BODY is a component
   under src/content/articles/<slug>.tsx, wired in the [slug] route registry.
   Topics are grounded in Louis's framer nav (Finance Fundamentals · Portfolio
   Optimization · Risk Management · Algorithmic Trading) and are swappable once
   his detailed content outline lands.
   ========================================================================== */

export type CategorySlug =
  | "quant-finance-foundations"
  | "portfolio-optimization"
  | "risk-management"
  | "algorithmic-trading";

export interface Category {
  slug: CategorySlug;
  /** Roman numeral, periodical convention. */
  numeral: string;
  name: string;
  blurb: string;
}

export interface ArticleSection {
  /** Anchor id — must match the `id` rendered in the body for scroll-spy. */
  id: string;
  title: string;
}

/** How a piece is written (see /content and the topic cards). Optional:
    Bhavya's original articles predate this dimension and carry no format. */
export type ArticleFormat =
  | "Tutorial"
  | "Case Study"
  | "Research Note"
  | "Research Article"
  | "Quant Insights";

export interface Article {
  slug: string;
  category: CategorySlug;
  /** Optional — only the newer pieces declare a content format. */
  format?: ArticleFormat;
  title: string;
  /** One-line dek under the title. */
  dek: string;
  /** ISO date — used for sorting + display. */
  date: string;
  readMinutes: number;
  level: "Foundational" | "Intermediate" | "Advanced";
  /** Filename under /public/notebooks. */
  notebook: string;
  /** Optional downloadable project zip filename under /public/downloads. */
  project?: string;
  /** Optional full-bleed hero background image path under /public. */
  hero?: string;
  /** Drives the sticky table of contents + scroll-spy. */
  sections: ArticleSection[];
  /** Card / index summary. */
  excerpt: string;
  /** Libraries the case study leans on — shown as a tech line. */
  stack: string[];
}

export const CATEGORIES: Record<CategorySlug, Category> = {
  "quant-finance-foundations": {
    slug: "quant-finance-foundations",
    numeral: "I",
    name: "Quant Finance Foundations",
    blurb: "The bedrock — valuation, pricing, and the mathematics every model inherits.",
  },
  "portfolio-optimization": {
    slug: "portfolio-optimization",
    numeral: "II",
    name: "Portfolio Optimization",
    blurb: "Turning noisy forecasts into allocations that survive out-of-sample.",
  },
  "risk-management": {
    slug: "risk-management",
    numeral: "III",
    name: "Risk Management",
    blurb: "Measuring — and respecting — the tails.",
  },
  "algorithmic-trading": {
    slug: "algorithmic-trading",
    numeral: "IV",
    name: "Algorithmic Trading",
    blurb: "Signals, backtests, and the discipline that separates edge from artefact.",
  },
};

export const CATEGORY_ORDER: CategorySlug[] = [
  "quant-finance-foundations",
  "portfolio-optimization",
  "risk-management",
  "algorithmic-trading",
];

export const ARTICLES: Article[] = [
  {
    slug: "brownian-motion",
    category: "quant-finance-foundations",
    title: "Geometric Brownian Motion: Simulating Price Paths — Shown Through SPY",
    dek: "The canonical continuous-time model for asset prices — its SDE, closed-form solution, and an exact simulation calibrated to SPY over a thousand five-year paths.",
    date: "2026-07-15",
    readMinutes: 9,
    level: "Foundational",
    notebook: "brownian-motion.ipynb",
    project: "brownian-motion.zip",
    hero: "hero/mountain-marc-thunis.jpg",
    excerpt:
      "The canonical model for asset prices. We move from multiplicative returns to the GBM SDE and its closed-form solution, then calibrate to SPY and simulate a thousand five-year paths — checking the terminal distribution is log-normal and that zero drift makes it a martingale.",
    stack: ["NumPy", "pandas", "SciPy", "matplotlib"],
    sections: [
      { id: "summary", title: "Summary" },
      { id: "intuition", title: "Intuition" },
      { id: "mechanics", title: "Theory & mechanics" },
      { id: "example", title: "Applied example — SPY" },
      { id: "conclusion", title: "Strengths, limits & extensions" },
    ],
  },
  {
    slug: "black-scholes-greeks",
    category: "quant-finance-foundations",
    title: "Black–Scholes & the Greeks",
    dek: "The BSM model turns five observable inputs into a fair option price and a full risk report — shown through QQQ (Nasdaq 100) options.",
    date: "2026-07-15",
    readMinutes: 11,
    level: "Foundational",
    notebook: "black-scholes-greeks.ipynb",
    project: "black-scholes-greeks.zip",
    hero: "hero/matterhorn-calame.jpg",
    excerpt:
      "Five observable inputs in, a fair price and a full risk report out. We replicate the option, derive the Greeks in closed form, then price and risk-map a 3-month QQQ option from real data — and check it two ways: put-call parity and Monte Carlo.",
    stack: ["NumPy", "SciPy", "matplotlib"],
    sections: [
      { id: "summary", title: "Summary" },
      { id: "intuition", title: "Intuition" },
      { id: "mechanics", title: "Theory & mechanics" },
      { id: "example", title: "Applied example — QQQ" },
      { id: "conclusion", title: "Strengths, limits & extensions" },
    ],
  },
  {
    slug: "time-value-of-money",
    category: "quant-finance-foundations",
    title: "The time value of money, in code",
    dek: "Discounting, compounding conventions, and the yield curve — the arithmetic under every valuation.",
    date: "2026-05-05",
    readMinutes: 8,
    level: "Foundational",
    notebook: "time-value-of-money.ipynb",
    excerpt:
      "A dollar today is not a dollar tomorrow. We formalise discounting and compounding, bootstrap a simple discount curve, and price an arbitrary cashflow stream in pandas.",
    stack: ["NumPy", "pandas"],
    sections: [
      { id: "intro", title: "Money has a time stamp" },
      { id: "discounting", title: "Discounting & present value" },
      { id: "compounding", title: "Compounding conventions" },
      { id: "curve", title: "From rates to a discount curve" },
      { id: "code", title: "Valuing cashflows in pandas" },
    ],
  },
  {
    slug: "bond-duration-convexity",
    category: "quant-finance-foundations",
    title: "Bond Pricing, Duration & Convexity: Via US Treasuries — and the ETFs That Lived Through 2022",
    dek: "A bond is a promise of future cash flows — so its price is pure discounting. From that follow the three numbers every rates desk lives by: price, duration and convexity, checked against the Treasury ETFs of 2022.",
    date: "2026-07-16",
    readMinutes: 11,
    level: "Foundational",
    notebook: "bond-duration-convexity.ipynb",
    project: "bond-duration-convexity.zip",
    hero: "hero/dolomites-krivec.jpg",
    excerpt:
      "Price, duration and convexity — the three numbers that summarise a bond's rate risk. We build them in 20 lines, walk the price-yield curve and the duration ladder, then check the theory against SHY/IEF/TLT's real drawdowns in the worst bond year in modern history.",
    stack: ["NumPy", "pandas", "matplotlib"],
    sections: [
      { id: "summary", title: "Summary" },
      { id: "intuition", title: "Intuition" },
      { id: "mechanics", title: "Theory & mechanics" },
      { id: "example", title: "Applied example — US Treasuries" },
      { id: "conclusion", title: "Strengths, limits & extensions" },
    ],
  },
  {
    slug: "mvo-efficient-frontier",
    category: "quant-finance-foundations",
    title: "Mean-Variance Optimization & the Efficient Frontier: A Six-Asset Portfolio in Python",
    dek: "Markowitz's 1952 insight, built from real data — the correlation matrix, a 20,000-portfolio Monte-Carlo bullet, and the exact minimum-variance and maximum-Sharpe portfolios.",
    date: "2026-07-20",
    readMinutes: 10,
    level: "Foundational",
    notebook: "mvo-efficient-frontier.ipynb",
    project: "mvo-efficient-frontier.zip",
    hero: "hero/mountain-sam-ferrara.jpg",
    excerpt:
      "Don't pick assets — pick the combination. We build the efficient frontier across six asset classes (2015–2024), see why every single ETF plots inside the cloud, and solve for the two portfolios everyone quotes: minimum variance and maximum Sharpe.",
    stack: ["NumPy", "pandas", "matplotlib", "PyPortfolioOpt"],
    sections: [
      { id: "summary", title: "Summary" },
      { id: "intuition", title: "Intuition" },
      { id: "mechanics", title: "Theory & mechanics" },
      { id: "example", title: "Applied example — six ETFs" },
      { id: "conclusion", title: "Strengths, limits & extensions" },
    ],
  },
  {
    slug: "black-litterman",
    category: "quant-finance-foundations",
    title: "The Black-Litterman Model: Blending Market Equilibrium with Your Own Views",
    dek: "Start from the portfolio the market already holds, tilt only where you have a view — the 1990 Goldman fix for MVO's wild weights, run on five country ETFs.",
    date: "2026-07-21",
    readMinutes: 10,
    level: "Intermediate",
    notebook: "black-litterman.ipynb",
    project: "black-litterman.zip",
    hero: "hero/mountain-neil-rosenstech.jpg",
    excerpt:
      "Reverse-optimize the market's implied returns, state one view — Germany at 10%, half confidence — and watch the Bayesian blend tilt the whole book sensibly while naive MVO lurches 75% into one country. Includes the no-views-equals-market sanity check.",
    stack: ["NumPy", "pandas", "PyPortfolioOpt"],
    sections: [
      { id: "summary", title: "Summary" },
      { id: "intuition", title: "Intuition" },
      { id: "mechanics", title: "Theory & mechanics" },
      { id: "example", title: "Applied example — country ETFs" },
      { id: "conclusion", title: "Strengths, limits & extensions" },
    ],
  },
  {
    slug: "risk-parity-futures",
    category: "quant-finance-foundations",
    title: "Risk Parity from Scratch: Allocating by Risk, Not Capital — A Futures Portfolio",
    dek: "Equal capital is not equal risk — in a five-futures book, crude supplies 87% of the total. We equalize every risk contribution in SciPy, validate with Riskfolio-lib, then lever to a vol target.",
    date: "2026-07-22",
    readMinutes: 9,
    level: "Intermediate",
    notebook: "risk-parity-futures.ipynb",
    project: "risk-parity-futures.zip",
    hero: "hero/mountain-nathan-anderson.jpg",
    excerpt:
      "The 60/40 secret: capital weight ≠ risk weight. We compute marginal risk contributions across five futures, solve the risk-parity weights from scratch, match Riskfolio-lib to 1e-6, and scale the book to a 10% vol target with 1.45x leverage — the All-Weather mechanism in miniature.",
    stack: ["NumPy", "SciPy", "Riskfolio-Lib"],
    sections: [
      { id: "summary", title: "Summary" },
      { id: "intuition", title: "Intuition" },
      { id: "mechanics", title: "Theory & mechanics" },
      { id: "example", title: "Applied example — five futures" },
      { id: "conclusion", title: "Strengths, limits & extensions" },
    ],
  },
  {
    slug: "ledoit-wolf-shrinkage",
    category: "portfolio-optimization",
    title: "Ledoit–Wolf shrinkage, from scratch",
    dek: "Why the sample covariance matrix fails out-of-sample — and how shrinkage repairs it.",
    date: "2026-05-22",
    readMinutes: 12,
    level: "Intermediate",
    notebook: "ledoit-wolf-shrinkage.ipynb",
    excerpt:
      "The sample covariance matrix is an error-maximiser in disguise. We derive the Ledoit–Wolf shrinkage estimator, implement the optimal intensity from scratch, and show the out-of-sample payoff.",
    stack: ["NumPy", "pandas", "scikit-learn"],
    sections: [
      { id: "problem", title: "Why the sample covariance fails" },
      { id: "shrinkage", title: "The shrinkage idea" },
      { id: "target", title: "Choosing the target" },
      { id: "intensity", title: "The optimal intensity" },
      { id: "code", title: "Implementation from scratch" },
      { id: "backtest", title: "The out-of-sample test" },
      { id: "takeaways", title: "Takeaways" },
    ],
  },
  {
    slug: "hierarchical-risk-parity",
    category: "portfolio-optimization",
    title: "Hierarchical Risk Parity, end to end",
    dek: "López de Prado's HRP — allocation that never inverts a covariance matrix.",
    date: "2026-05-18",
    readMinutes: 10,
    level: "Intermediate",
    notebook: "hierarchical-risk-parity.ipynb",
    excerpt:
      "Mean–variance inverts an ill-conditioned matrix and pays for it out-of-sample. HRP replaces inversion with a tree: cluster, quasi-diagonalise, then split risk recursively. Built in ~40 lines.",
    stack: ["NumPy", "pandas", "SciPy"],
    sections: [
      { id: "motivation", title: "The trouble with inversion" },
      { id: "tree", title: "Step 1 — hierarchical clustering" },
      { id: "quasidiag", title: "Step 2 — quasi-diagonalisation" },
      { id: "bisection", title: "Step 3 — recursive bisection" },
      { id: "code", title: "HRP in ~40 lines" },
      { id: "compare", title: "HRP vs min-variance" },
    ],
  },
  {
    slug: "evt-t-copula-var",
    category: "risk-management",
    title: "Market risk via EVT + t-copula",
    dek: "A faithful Python port of the classic tail-risk pipeline — GARCH margins, Pareto tails, a t-copula, and Monte Carlo VaR.",
    date: "2026-05-28",
    readMinutes: 14,
    level: "Advanced",
    notebook: "evt-t-copula-var.ipynb",
    excerpt:
      "The reference tail-risk pipeline, end to end: filter each asset with a GARCH-t, fit semi-parametric margins with Pareto tails via Extreme Value Theory, bind them with a t-copula, and simulate portfolio VaR and CVaR.",
    stack: ["NumPy", "pandas", "SciPy", "arch"],
    sections: [
      { id: "overview", title: "The pipeline" },
      { id: "data", title: "Data & log returns" },
      { id: "garch", title: "GARCH-t volatility filtering" },
      { id: "margins", title: "Semi-parametric margins with Pareto tails" },
      { id: "copula", title: "Calibrating the t-copula" },
      { id: "simulate", title: "Monte Carlo simulation" },
      { id: "var", title: "Portfolio VaR & CVaR" },
      { id: "interpretation", title: "What the numbers say" },
    ],
  },
  {
    slug: "var-cvar-three-ways",
    category: "risk-management",
    title: "VaR & CVaR, three ways",
    dek: "Historical, parametric, and Monte Carlo tail risk — and where each one quietly lies to you.",
    date: "2026-05-15",
    readMinutes: 9,
    level: "Intermediate",
    notebook: "var-cvar-three-ways.ipynb",
    excerpt:
      "Three estimators of the same number, three sets of assumptions. We compute 1-day 99% VaR and CVaR by historical simulation, the parametric method, and Monte Carlo — then backtest which one you can trust.",
    stack: ["NumPy", "pandas", "SciPy"],
    sections: [
      { id: "definitions", title: "VaR & CVaR, defined" },
      { id: "historical", title: "Historical simulation" },
      { id: "parametric", title: "Parametric (variance–covariance)" },
      { id: "montecarlo", title: "Monte Carlo" },
      { id: "backtest", title: "Backtesting the VaR" },
      { id: "verdict", title: "Which one, when" },
    ],
  },
  {
    slug: "cross-sectional-momentum",
    category: "algorithmic-trading",
    title: "Momentum, honestly backtested",
    dek: "Cross-sectional momentum with the out-of-sample discipline most backtests quietly skip.",
    date: "2026-05-25",
    readMinutes: 11,
    level: "Advanced",
    notebook: "cross-sectional-momentum.ipynb",
    excerpt:
      "Momentum is the most documented anomaly in finance — and the easiest to fake with leakage. We build a 12-1 cross-sectional momentum book, close every look-ahead gap, and only then ask whether it survives costs.",
    stack: ["NumPy", "pandas", "vectorbt"],
    sections: [
      { id: "signal", title: "The momentum signal" },
      { id: "leakage", title: "The look-ahead traps" },
      { id: "portfolio", title: "Forming the portfolio" },
      { id: "backtest", title: "An honest backtest" },
      { id: "costs", title: "After costs & turnover" },
      { id: "verdict", title: "Does it survive?" },
    ],
  },
  {
    slug: "pairs-trading-cointegration",
    category: "algorithmic-trading",
    title: "Pairs trading & cointegration",
    dek: "Engle–Granger, the spread z-score, and a backtest that actually pays the spread.",
    date: "2026-05-08",
    readMinutes: 10,
    level: "Intermediate",
    notebook: "pairs-trading-cointegration.ipynb",
    excerpt:
      "Two drifting prices, one stationary spread. We test a pair for cointegration the right way, estimate the hedge ratio, trade the z-score, and discount the result by realistic transaction costs.",
    stack: ["NumPy", "pandas", "statsmodels"],
    sections: [
      { id: "idea", title: "Mean reversion of a spread" },
      { id: "cointegration", title: "Testing for cointegration" },
      { id: "spread", title: "The hedge ratio & spread" },
      { id: "signal", title: "Z-score entry & exit" },
      { id: "backtest", title: "Backtest with costs" },
      { id: "caveats", title: "Caveats & decay" },
    ],
  },
  {
    slug: "black-scholes-from-first-principles",
    hero: "hero/dolomites-krivec.jpg",
    category: "quant-finance-foundations",
    format: "Tutorial",
    title: "Black–Scholes from First Principles: Deriving the Formula by Replication",
    dek: "Deriving the option-pricing formula from a replicating portfolio — then pricing and hedging it in NumPy.",
    date: "2026-05-12",
    readMinutes: 11,
    level: "Foundational",
    notebook: "black-scholes-from-first-principles.ipynb",
    excerpt:
      "No-arbitrage, a hedged portfolio, and a heat equation in disguise. We build Black–Scholes from the replication argument up, then implement the price and all five Greeks.",
    stack: ["NumPy", "SciPy", "matplotlib"],
    sections: [
      { id: "setup", title: "The setup & assumptions" },
      { id: "replication", title: "The replication argument" },
      { id: "formula", title: "The Black–Scholes formula" },
      { id: "greeks", title: "Pricing & the Greeks in NumPy" },
      { id: "smile", title: "Where the model breaks" },
    ],
  },
  {
    slug: "var-three-ways",
    hero: "hero/mountain-sam-ferrara.jpg",
    category: "risk-management",
    format: "Tutorial",
    title: "Value at Risk Three Ways: Historical, Parametric and Monte Carlo on the DAX",
    dek: "Historical, parametric and Monte Carlo VaR computed on fifteen years of real DAX data, backtested with Kupiec — and recomputed in Polars and DuckDB.",
    date: "2026-07-23",
    readMinutes: 12,
    level: "Intermediate",
    notebook: "var-three-ways.ipynb",
    excerpt:
      "Daily loss limits and regulatory capital hang off one number, and it has three recipes that disagree. We compute 99% and 95% VaR and CVaR on the DAX 2010–2024 by historical simulation, a normal and a fitted Student-t (df 3.22), and 200k seeded Monte-Carlo draws — then let a rolling 250-day Kupiec backtest decide which to believe, and show the same historical quantile falling out of Polars expressions and DuckDB SQL to 1e-15 agreement.",
    stack: ["NumPy", "SciPy", "Pandas", "Polars", "DuckDB"],
    sections: [
      { id: "definitions", title: "The number, and the data" },
      { id: "historical", title: "Historical simulation" },
      { id: "parametric", title: "Parametric: normal, then Student-t" },
      { id: "monte-carlo", title: "Monte Carlo" },
      { id: "backtest", title: "The backtest decides" },
      { id: "polars-duckdb", title: "The same quantile in Polars and DuckDB" },
    ],
  },
  {
    slug: "cvar-expected-shortfall",
    hero: "hero/dolomites-krivec.jpg",
    category: "risk-management",
    format: "Tutorial",
    title: "CVaR / Expected Shortfall: Sizing the Losses That Live Beyond VaR",
    dek: "Two books with identical 99% VaR can differ threefold in the tail. Estimating expected shortfall on HYG and VWO — historical and Student-t — and sizing positions with the measure Basel actually chose.",
    date: "2026-07-24",
    readMinutes: 12,
    level: "Intermediate",
    notebook: "cvar-expected-shortfall.ipynb",
    excerpt:
      "VaR marks where the tail begins; CVaR averages what lives inside it. We estimate both at 97.5% and 99% for HYG, VWO and a 50/50 mix across 2007-2024, show VaR breaking subadditivity in crisis-year samples while CVaR never does, count the GFC blowing through HYG's VaR line at 16x its expected frequency, and spend the same 4% tail budget through rm=\"MV\" vs rm=\"CVaR\" in Riskfolio-Lib - with radically different books as the result.",
    stack: ["SciPy", "Riskfolio-Lib"],
    sections: [
      { id: "blind", title: "What VaR cannot see" },
      { id: "data", title: "Two fat-tailed assets" },
      { id: "estimate", title: "Historical and Student-t estimates" },
      { id: "coherence", title: "Subadditivity — the coherence test" },
      { id: "gfc", title: "The GFC, seen from the tail" },
      { id: "optimize", title: "Spending a tail budget: CVaR vs MV" },
    ],
  },
  {
    slug: "copulas-tail-dependence",
    hero: "hero/matterhorn-calame.jpg",
    category: "risk-management",
    format: "Tutorial",
    title: "Copulas & Tail Dependence: Why Markets Crash Together More Often Than Correlation Says",
    dek: "Separating marginals from dependence for the S&P 500, FTSE 100 and Nikkei 225 — and measuring why the Gaussian copula misses joint crashes.",
    date: "2026-07-24",
    readMinutes: 12,
    level: "Advanced",
    notebook: "copulas-tail-dependence.ipynb",
    excerpt:
      "Correlation is one number; dependence is a whole function. On 25 years of weekly S&P 500, FTSE 100 and Nikkei 225 returns we rank-transform to pseudo-observations, fit Gaussian and Student-t copulas by MLE, and show that empirical tail dependence rises exactly where the Gaussian copula sends it to zero — modelling the joint crashes that multi-asset stress scenarios exist for.",
    stack: ["SciPy", "statsmodels", "seaborn"],
    sections: [
      { id: "dependence", title: "Dependence is not correlation" },
      { id: "sklar", title: "Sklar's theorem & pseudo-observations" },
      { id: "gaussian", title: "The Gaussian copula — elegant, and wrong in the corner" },
      { id: "t-copula", title: "The t copula & tail dependence" },
      { id: "crashes", title: "Conditional crash probabilities" },
      { id: "practitioner", title: "The practitioner take" },
    ],
  },
  {
    slug: "sma-crossover-backtest",
    hero: "hero/mountain-nathan-anderson.jpg",
    category: "algorithmic-trading",
    format: "Tutorial",
    title: "The SMA Crossover, Honestly Backtested: QQQ and Bitcoin, Costs Included",
    dek: "The 50/200 golden cross on QQQ and Bitcoin — next-day execution, real costs, a parameter grid, and the in-sample caveats most crossover backtests skip.",
    date: "2026-07-25",
    readMinutes: 11,
    level: "Foundational",
    notebook: "sma-crossover-backtest.ipynb",
    excerpt:
      "The moving-average crossover is trend following's workhorse — and the perfect vehicle for backtesting discipline 101. We run the same long-or-flat rule on QQQ and BTC-USD over 2015–2024, close the lookahead gap with one shift(1), charge 10bp a side, then sweep a 4×4 parameter grid: QQQ's grid straddles buy-and-hold while BTC's sits above it. Trend behaves differently per asset.",
    stack: ["vectorbt", "Pandas", "Pyfolio"],
    sections: [
      { id: "signal", title: "The rule: two moving averages" },
      { id: "lookahead", title: "Next-day execution — the shift(1) that keeps you honest" },
      { id: "results", title: "Same rule, two verdicts" },
      { id: "grid", title: "Discipline 101: the parameter grid" },
      { id: "costs", title: "The costs dial: 0 / 10 / 25 bp" },
      { id: "honesty", title: "One sample, no walk-forward" },
    ],
  },
  {
    slug: "kalman-filter-hedge-ratios",
    hero: "hero/mountain-marc-thunis.jpg",
    category: "algorithmic-trading",
    format: "Tutorial",
    title: "Kalman Filters for Dynamic Hedge Ratios: Tracking a Beta That Refuses to Sit Still",
    dek: "Building a Kalman filter from scratch in NumPy to track a drifting hedge ratio — and an honest accounting of what adaptivity buys after costs.",
    date: "2026-07-25",
    readMinutes: 12,
    level: "Advanced",
    notebook: "kalman-filter-hedge-ratios.ipynb",
    excerpt:
      "Static hedge ratios assume the relationship never moves; on EWA/EWC 2010–2024 it moves from 0.71 to 1.49. We treat beta as a random-walk state, filter it in five lines of NumPy, and trade the spread both ways — the Kalman beta wins as an estimator (gross Sharpe 0.55 vs 0.47, half the drawdown), while 10 bp costs on 2.7× turnover decide the net line.",
    stack: ["NumPy", "statsmodels", "Pandas"],
    sections: [
      { id: "drift", title: "Why static hedge ratios die" },
      { id: "state-space", title: "Beta as a state, not a constant" },
      { id: "filter", title: "The filter in five lines of NumPy" },
      { id: "betas", title: "Three betas, one pair" },
      { id: "trading", title: "Trading the spread" },
      { id: "take", title: "What the numbers actually say" },
    ],
  },
  {
    slug: "kelly-criterion-position-sizing",
    hero: "hero/mountain-marc-thunis.jpg",
    category: "portfolio-optimization",
    format: "Tutorial",
    title: "The Kelly Criterion for Position Sizing: Optimal Growth, and Why Half Is Safer",
    dek: "How much to bet — the fraction that maximises long-run growth, and why most pros bet half of it.",
    date: "2026-06-02",
    readMinutes: 10,
    level: "Intermediate",
    notebook: "kelly-criterion-position-sizing.ipynb",
    excerpt:
      "Sizing decides whether an edge compounds or ruins you. We derive the Kelly fraction from maximising log-growth, code both the discrete and continuous forms, and show why fractional Kelly is the practitioner's default.",
    stack: ["NumPy", "pandas", "matplotlib"],
    sections: [
      { id: "idea", title: "The question Kelly answers" },
      { id: "derivation", title: "Maximising log-growth" },
      { id: "formula", title: "The Kelly fraction" },
      { id: "code", title: "Kelly in code" },
      { id: "fractional", title: "Why bet fractional Kelly" },
      { id: "takeaways", title: "Takeaways" },
    ],
  },
  {
    slug: "gamestop-short-squeeze",
    hero: "hero/mountain-nathan-anderson.jpg",
    category: "algorithmic-trading",
    format: "Case Study",
    title: "Anatomy of a Short Squeeze: GameStop, January 2021, Reconstructed From the Tape",
    dek: "Short interest above 100% of float, a gamma feedback loop, and what the tape teaches about crowded trades.",
    date: "2026-06-05",
    readMinutes: 12,
    level: "Intermediate",
    notebook: "gamestop-short-squeeze.ipynb",
    excerpt:
      "In January 2021, GameStop ran from $4 to $120. We reconstruct the mechanics in data — short interest, days-to-cover, the options gamma loop — and measure the risk that a short book never priced.",
    stack: ["NumPy", "pandas", "matplotlib"],
    sections: [
      { id: "setup", title: "The setup: a crowded short" },
      { id: "squeeze", title: "How a squeeze ignites" },
      { id: "gamma", title: "The gamma feedback loop" },
      { id: "measure", title: "Measuring it in data" },
      { id: "risk", title: "The risk a short book ignored" },
      { id: "lessons", title: "What it teaches" },
    ],
  },
  {
    slug: "gold-war-and-inflation",
    hero: "hero/mountain-neil-rosenstech.jpg",
    category: "quant-finance-foundations",
    format: "Research Note",
    title: "Gold Through War and Inflation: Twenty Years of GLD Against Real Yields",
    dek: "An empirical read: does gold hedge inflation, or just track real yields — and what war actually adds.",
    date: "2026-06-09",
    readMinutes: 9,
    level: "Intermediate",
    notebook: "gold-war-and-inflation.ipynb",
    excerpt:
      "Gold is sold as an inflation and crisis hedge. We check the tape: its real driver is real yields, its inflation hedge is regime-dependent, and the geopolitical premium around conflict is real but fast-fading.",
    stack: ["NumPy", "pandas", "statsmodels"],
    sections: [
      { id: "question", title: "The question" },
      { id: "realyields", title: "Gold tracks real yields" },
      { id: "inflation", title: "The inflation hedge is conditional" },
      { id: "war", title: "What war adds" },
      { id: "takeaways", title: "What it implies" },
    ],
  },
];

/* ------------------------------------------------------------- helpers -- */

export const ARTICLE_SLUGS = ARTICLES.map((a) => a.slug);

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function articlesByCategory(category: CategorySlug): Article[] {
  return ARTICLES.filter((a) => a.category === category);
}

/** Previous / next within the full catalogue, for in-article navigation. */
export function articleNeighbours(slug: string): { prev?: Article; next?: Article } {
  const i = ARTICLES.findIndex((a) => a.slug === slug);
  if (i === -1) return {};
  return { prev: ARTICLES[i - 1], next: ARTICLES[i + 1] };
}

/** Human-readable date, e.g. "28 May 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}
