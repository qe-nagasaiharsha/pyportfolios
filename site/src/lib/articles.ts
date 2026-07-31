/* ============================================================================
   Article catalogue — reconciled on branch 3.0 (Bhavya presentation base +
   the computed-data article set). Notebooks/bundles are gated product and
   live in vault/, served through the platform API — never site/public.
   Article catalogue — Milestone 2 (Upwork).
   4 categories × 2 articles = 8 article pages, each with a runnable notebook.
   Metadata + table-of-contents live here; each article's BODY is a component
   under src/content/articles/<slug>.tsx, wired in the [slug] route registry.
   Topics are grounded in Louis's framer nav (Quant Finance Foundations · Portfolio
   Optimization · Risk Management · Algorithmic Trading) and are swappable once
   his detailed content outline lands.
   ========================================================================== */

export type CategorySlug =
  | "quant-finance-foundations"
  | "portfolio-optimization"
  | "risk-management"
  | "algorithmic-trading";

/** The content formats (see /content): how each piece is written.
    Tutorial — teach one concept/method. Case Study — apply a model to a real
    event. Research Note — empirical read on live markets. Research Article —
    a landmark result, replicated as runnable code. Quant Insights — a model
    face-off / deep quantitative comparison (topic-card taxonomy). */
export type ArticleFormat = "Tutorial" | "Case Study" | "Research Note" | "Research Article" | "Quant Insights";

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

export interface Article {
  slug: string;
  category: CategorySlug;
  /** Which of the four content formats this piece is written as. */
  format: ArticleFormat;
  title: string;
  /** One-line dek under the title. */
  dek: string;
  /** ISO date — used for sorting + display. */
  date: string;
  readMinutes: number;
  level: "Foundational" | "Intermediate" | "Advanced";
  /** Filename under vault/notebooks (served via the gated platform API). */
  notebook: string;
  /** Optional full-bleed hero background image path under /public. */
  hero?: string;
  /** Optional standalone project folder name (source + launchers). */
  project?: string;
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
  /* ---------------------------------------------- Quant Finance Foundations -- */
  {
    slug: "gbm-simulating-price-paths",
    hero: "hero/mountain-marc-thunis.jpg",
    category: "quant-finance-foundations",
    format: "Tutorial",
    title: "GBM: simulating price paths",
    dek: "Estimating drift and volatility from real SPY data, simulating 5,000 futures, and testing where the workhorse model breaks.",
    date: "2026-07-20",
    readMinutes: 9,
    level: "Foundational",
    notebook: "gbm-simulating-price-paths.ipynb",
    excerpt:
      "Geometric Brownian Motion powers Black–Scholes, Monte-Carlo pricing, and every wealth-projection cone. We calibrate it to SPY 2018–2024, simulate the cone, and quantify exactly how badly its thin tails miss reality.",
    stack: ["NumPy", "Pandas", "SciPy", "yfinance", "matplotlib"],
    sections: [
      { id: "model", title: "The model, in one equation" },
      { id: "data", title: "Seven years of SPY" },
      { id: "simulate", title: "Simulating 5,000 futures" },
      { id: "terminal", title: "The terminal distribution" },
      { id: "breaks", title: "Where the model breaks" },
    ],
  },
  {
    slug: "black-scholes-from-first-principles",
    category: "quant-finance-foundations",
    format: "Tutorial",
    title: "Black–Scholes from first principles",
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
    slug: "time-value-of-money",
    category: "quant-finance-foundations",
    format: "Tutorial",
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

  /* --------------------------------------------- Portfolio Optimization -- */
  {
    slug: "ledoit-wolf-shrinkage",
    category: "portfolio-optimization",
    format: "Research Article",
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
    format: "Research Article",
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

  /* ----------------------------------------------------- Risk Management -- */
  {
    slug: "evt-t-copula-var",
    category: "risk-management",
    format: "Case Study",
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
    format: "Tutorial",
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

  /* --------------------------------------------------- Algorithmic Trading -- */
  {
    slug: "cross-sectional-momentum",
    category: "algorithmic-trading",
    format: "Research Article",
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
    format: "Research Article",
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

  /* ===================== exemplar content — one per format (from the brief) === */
  {
    slug: "kelly-criterion-position-sizing",
    category: "portfolio-optimization",
    format: "Tutorial",
    title: "The Kelly criterion for position sizing",
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
    category: "algorithmic-trading",
    format: "Case Study",
    title: "Anatomy of a short squeeze: GameStop, 2021",
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
    category: "quant-finance-foundations",
    format: "Research Note",
    title: "Gold through war and inflation",
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
  /* ------------------------- Batch 1 topic-card tutorials (quant) -- */
  {
    slug: "black-scholes-and-the-greeks",
    hero: "hero/matterhorn-calame.jpg",
    category: "quant-finance-foundations",
    format: "Tutorial",
    title: "Black–Scholes & the Greeks",
    dek: "Implementing the options-pricing engine and all five Greeks in NumPy on real QQQ data — then inverting it, because implied vol is how the market actually quotes.",
    date: "2026-07-21",
    readMinutes: 10,
    level: "Foundational",
    notebook: "black-scholes-and-the-greeks.ipynb",
    excerpt:
      "Black–Scholes survives not as a model anyone believes but as the options market's pricing engine and quoting convention. We build the price and all five Greeks from scratch, calibrate σ to QQQ's trailing 1y realized vol across 2018–2024, and read the Greeks as the hedging dashboard a desk actually uses — closing with the implied-vol inversion that turns prices into the market's language.",
    stack: ["NumPy", "SciPy", "matplotlib"],
    sections: [
      { id: "engine", title: "The formula, implemented" },
      { id: "vol", title: "Sigma from the tape" },
      { id: "ladder", title: "The strike ladder & put–call parity" },
      { id: "greeks", title: "The Greeks as a hedging dashboard" },
      { id: "term", title: "Vega & theta across maturities" },
      { id: "implied", title: "Implied vol: the market's language" },
    ],
  },
  {
    slug: "bond-pricing-duration-convexity",
    hero: "hero/dolomites-krivec.jpg",
    category: "quant-finance-foundations",
    format: "Tutorial",
    title: "Bond pricing, duration & convexity",
    dek: "A bond pricer from scratch, the risk measures in every fixed-income report, and the 2022 tape that proved duration is THE risk factor.",
    date: "2026-07-21",
    readMinutes: 11,
    level: "Foundational",
    notebook: "bond-pricing-duration-convexity.ipynb",
    excerpt:
      "We build a semi-annual bond pricer in ~10 lines, derive duration and convexity analytically and by finite difference, run the ±100bp/±200bp stress table three ways, then replay 2022: the curve shifted ~230–420bp and SHY, IEF, and TLT lost almost exactly duration × shift — about 4% at the short end, 31% at the long end.",
    stack: ["NumPy", "Pandas", "yfinance", "matplotlib"],
    sections: [
      { id: "pricer", title: "A bond pricer from scratch" },
      { id: "duration", title: "Duration & convexity, two ways" },
      { id: "curve", title: "The price/yield curve is not a line" },
      { id: "stress", title: "The ±100bp stress table, three ways" },
      { id: "rates-2022", title: "2022 — the year the tangent moved" },
      { id: "empirical", title: "Empirical duration, read off the tape" },
    ],
  },
  {
    slug: "mvo-efficient-frontier",
    hero: "hero/mountain-sam-ferrara.jpg",
    category: "portfolio-optimization",
    format: "Tutorial",
    title: "MVO & the efficient frontier",
    dek: "Tracing the risk–return frontier across six asset-class ETFs with PyPortfolioOpt — and meeting mean–variance's famous concentration problem.",
    date: "2026-07-22",
    readMinutes: 10,
    level: "Foundational",
    notebook: "mvo-efficient-frontier.ipynb",
    excerpt:
      "Markowitz's insight — score portfolios, not assets — still runs core asset allocation. We estimate μ and Σ from ten years of SPY, TLT, GLD, VNQ, VEA and VWO, trace the long-only efficient frontier, solve the max-Sharpe and min-vol portfolios, and show why the optimiser piles into two assets: estimation error in μ, the problem Black–Litterman exists to fix.",
    stack: ["PyPortfolioOpt", "Pandas", "matplotlib"],
    sections: [
      { id: "idea", title: "The Markowitz insight" },
      { id: "inputs", title: "Two inputs: μ and Σ" },
      { id: "frontier", title: "Tracing the frontier" },
      { id: "portfolios", title: "Max-Sharpe & min-vol, solved" },
      { id: "performance", title: "Growth of $100 — with the fine print" },
      { id: "fragility", title: "The concentration problem" },
    ],
  },
  {
    slug: "black-litterman-equilibrium-views",
    hero: "hero/mountain-neil-rosenstech.jpg",
    category: "portfolio-optimization",
    format: "Tutorial",
    title: "Black–Litterman: equilibrium + views",
    dek: "Blending market-implied returns with your own views — stable weights without extreme bets.",
    date: "2026-07-22",
    readMinutes: 11,
    level: "Intermediate",
    notebook: "black-litterman-equilibrium-views.ipynb",
    excerpt:
      "Raw historical means turn mean-variance optimization into an error maximiser — a 1pp input tweak convulses every weight. We reverse-optimize equilibrium returns from market caps on five country ETFs, blend in two Idzorek-weighted views, and show the posterior tilting smoothly, only where the views say.",
    stack: ["PyPortfolioOpt", "NumPy"],
    sections: [
      { id: "data", title: "Five countries, one decade" },
      { id: "instability", title: "Act one: MVO on raw means" },
      { id: "equilibrium", title: "Act two: reverse optimization" },
      { id: "views", title: "Act three: two views, with confidence" },
      { id: "posterior", title: "The posterior blend" },
      { id: "weights", title: "From returns to weights" },
    ],
  },
  {
    slug: "risk-parity-from-scratch",
    hero: "hero/mountain-nathan-anderson.jpg",
    category: "portfolio-optimization",
    format: "Tutorial",
    title: "Risk parity from scratch",
    dek: "Allocating by risk contribution instead of capital — building, validating, and backtesting the all-weather portfolio blueprint.",
    date: "2026-07-23",
    readMinutes: 11,
    level: "Intermediate",
    notebook: "risk-parity-from-scratch.ipynb",
    excerpt:
      "A 25%-each portfolio is only diversified in dollars — in risk terms, three of the four assets carry almost everything. We solve the equal-risk-contribution weights with SciPy, validate them against Riskfolio-Lib to 1e-6, and backtest risk parity against 60/40 and equal weight over 2010–2024 — ending at the leverage debate the results force.",
    stack: ["SciPy", "Riskfolio-Lib"],
    sections: [
      { id: "idea", title: "Allocate risk, not dollars" },
      { id: "contributions", title: "Risk contributions, defined" },
      { id: "solve", title: "Solving for equal risk (SciPy)" },
      { id: "validate", title: "Validation: Riskfolio-Lib agrees" },
      { id: "backtest", title: "Fifteen years, three portfolios" },
      { id: "leverage", title: "The leverage debate" },
    ],
  },
  {
    slug: "var-three-ways",
    category: "risk-management",
    format: "Tutorial",
    title: "VaR three ways, on the DAX",
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
    category: "risk-management",
    format: "Tutorial",
    title: "CVaR / expected shortfall",
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
    category: "risk-management",
    format: "Tutorial",
    title: "Copulas & tail dependence",
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
  /* ------------------------- Batch 1 topic-card tutorials (quant) -- */
  {
    slug: "kalman-filter-hedge-ratios",
    category: "algorithmic-trading",
    format: "Tutorial",
    title: "Kalman filters: dynamic hedge ratios",
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
  /* ------------------------- Batch 1 topic-card tutorials (quant) -- */
  {
    slug: "sma-crossover-backtest",
    category: "algorithmic-trading",
    format: "Tutorial",
    title: "SMA crossover, honestly backtested",
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
