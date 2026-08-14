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
    format: "Tutorial",
    title: "Geometric Brownian Motion",
    dek: "Simulating price paths with the continuous-time workhorse behind Black–Scholes and Monte-Carlo risk engines.",
    date: "2026-08-12",
    readMinutes: 9,
    level: "Foundational",
    notebook: "brownian-motion.ipynb",
    project: "brownian-motion.zip",
    hero: "hero/mountain-marc-thunis.jpg",
    excerpt:
      "The canonical continuous-time model for asset prices. Why returns compound rather than add, the SDE and its closed-form solution, an exact simulation scheme — then calibrated to seven years of SPY and run out 1,000 paths over five years, with the terminal distribution checked against the theoretical log-normal.",
    stack: ["NumPy", "pandas", "SciPy", "matplotlib", "yfinance"],
    sections: [
      { id: "introduction", title: "Introduction" },
      { id: "intuition", title: "Intuition" },
      { id: "theory", title: "Theory" },
      { id: "application", title: "Application" },
      { id: "conclusion", title: "Conclusion" },
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
    slug: "heston-vs-black-scholes",
    category: "quant-finance-foundations",
    format: "Quant Insights",
    title: "Heston vs Black–Scholes: Fitting the Volatility Smile",
    dek: "One model prices every strike with the same number. The other doesn't have to.",
    date: "2026-08-10",
    readMinutes: 9,
    level: "Advanced",
    notebook: "heston-vs-black-scholes.ipynb",
    project: "heston-vs-black-scholes.zip",
    hero: "hero/sunlit-peaks.jpg",
    excerpt:
      "Black-Scholes assumes a single, constant volatility — so it predicts the same implied vol at every strike. The market flatly disagrees: implied vol curves into a smile/skew. The Heston model, by letting volatility itself be random, can bend to fit that curve. This piece pits the two against a real SPX-style implied-vol surface and measures who fits, by how much, and at what cost.",
    stack: ["QuantLib", "SciPy", "NumPy"],
    sections: [
      { id: "disagreement", title: "The disagreement" },
      { id: "contenders", title: "The contenders" },
      { id: "test", title: "The test" },
      { id: "scoreboard", title: "The scoreboard" },
      { id: "verdict", title: "Verdict" },
    ],
  },
  {
    slug: "mvo-efficient-frontier",
    category: "portfolio-optimization",
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
    category: "portfolio-optimization",
    title: "The Black-Litterman Model: Blending Market Equilibrium with Your Own Views",
    dek: "Start from the portfolio the market already holds, tilt only where you have a view — the 1990 Goldman fix for MVO's wild weights, run on five country ETFs.",
    date: "2026-07-21",
    readMinutes: 10,
    level: "Intermediate",
    notebook: "black-litterman.ipynb",
    project: "black-litterman.zip",
    hero: "hero/hills-sunset-blue.jpg",
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
    category: "portfolio-optimization",
    title: "Risk Parity from Scratch: Allocating by Risk, Not Capital — A Futures Portfolio",
    dek: "Equal capital is not equal risk — in a five-futures book, crude supplies 87% of the total. We equalize every risk contribution in SciPy, validate with Riskfolio-lib, then lever to a vol target.",
    date: "2026-07-22",
    readMinutes: 9,
    level: "Intermediate",
    notebook: "risk-parity-futures.ipynb",
    project: "risk-parity-futures.zip",
    hero: "hero/golden-grasses-mountains.jpg",
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
    slug: "sixty-forty-correlation-flip",
    category: "portfolio-optimization",
    format: "Case Study",
    title: "60/40 in 2022: When the Stock-Bond Correlation Flipped",
    dek: "During the 2022 inflation shock, the balanced portfolio failed because its diversifier stopped diversifying.",
    date: "2026-08-10",
    readMinutes: 10,
    level: "Intermediate",
    notebook: "sixty-forty-correlation-flip.ipynb",
    project: "sixty-forty-correlation-flip.zip",
    hero: "hero/blue-ridges.jpg",
    excerpt:
      "For two decades the 60/40 portfolio rested on one quiet assumption: when stocks fall, bonds rally. In 2022 that assumption broke — stocks fell ~18%, long Treasuries fell ~31%. We reconstruct what happened from SPY, AGG and TLT, watch the rolling correlation cross zero, and measure the damage against the GFC.",
    stack: ["pandas", "NumPy", "matplotlib", "seaborn"],
    sections: [
      { id: "setting", title: "The setting" },
      { id: "event", title: "The event" },
      { id: "mechanism", title: "The mechanism" },
      { id: "evidence", title: "The evidence" },
      { id: "post-mortem", title: "Post-mortem" },
    ],
  },
  {
    slug: "var-three-ways",
    hero: "hero/iceland-hill.jpg",
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
    hero: "hero/sea-cliff.jpg",
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
    hero: "hero/hazy-blue-ridges.jpg",
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
    slug: "gaussian-vs-t-copula",
    category: "risk-management",
    format: "Quant Insights",
    title: "Gaussian vs t-Copula: Capturing Joint Crashes",
    dek: "Two models of “moving together.” Only one believes in contagion.",
    date: "2026-08-10",
    readMinutes: 11,
    level: "Advanced",
    notebook: "gaussian-vs-t-copula.ipynb",
    project: "gaussian-vs-t-copula.zip",
    hero: "hero/mountain-neil-rosenstech.jpg",
    excerpt:
      "A correlation number tells you how two assets co-move on average — it says nothing about whether they crash together. We fit both a Gaussian and a Student-t copula to 18 years of XLF/XLK returns through the GFC, COVID and 2022, then count who actually predicts the observed joint-tail days.",
    stack: ["SciPy", "NumPy", "pandas", "seaborn"],
    sections: [
      { id: "disagreement", title: "The disagreement" },
      { id: "contenders", title: "The contenders" },
      { id: "test", title: "The test" },
      { id: "scoreboard", title: "The scoreboard" },
      { id: "verdict", title: "Verdict" },
    ],
  },
  {
    slug: "sma-crossover-backtest",
    hero: "hero/snow-peak-teal.jpg",
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
    hero: "hero/alpine-ridge-pines.jpg",
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
    slug: "gamestop-momentum-models",
    category: "algorithmic-trading",
    format: "Case Study",
    title: "The GameStop Squeeze: When Momentum Models Broke",
    dek: "During January 2021, short-momentum strategies failed because the most crowded trade in the market became the most dangerous one.",
    date: "2026-08-11",
    readMinutes: 10,
    level: "Intermediate",
    notebook: "gamestop-momentum-models.ipynb",
    project: "gamestop-momentum-models.zip",
    hero: "hero/mountains-africa.jpg",
    excerpt:
      "In January 2021 a dying mall retailer became, briefly, the most traded stock on Earth. We reconstruct the squeeze from GME, XRT and the VIX — the +1,625% month, the ETF dragged along with it, and the mark-to-market path of a short entered on 4 January that was wiped out inside four weeks.",
    stack: ["pandas", "NumPy", "matplotlib"],
    sections: [
      { id: "setting", title: "The setting" },
      { id: "event", title: "The event" },
      { id: "mechanism", title: "The mechanism" },
      { id: "evidence", title: "The evidence" },
      { id: "post-mortem", title: "Post-mortem" },
    ],
  },
  {
    slug: "alpha-decay-momentum",
    category: "algorithmic-trading",
    format: "Research Note",
    title: "Alpha Decay: Measuring Momentum's Shrinking Half-Life",
    dek: "The data shows that sector momentum's predictive power fades within weeks — and has weakened decade over decade.",
    date: "2026-08-11",
    readMinutes: 9,
    level: "Advanced",
    notebook: "alpha-decay-momentum.ipynb",
    project: "alpha-decay-momentum.zip",
    hero: "hero/layered-blue-ridges.jpg",
    excerpt:
      "How long does a momentum signal keep working? Using 20 years of daily data on the 11 SPDR sector ETFs, this note measures the information coefficient across horizons from 1 to 126 days, fits an exponential decay to find the half-life, and splits the sample into two decades to test for alpha erosion.",
    stack: ["Alphalens", "pandas", "statsmodels"],
    sections: [
      { id: "data", title: "Data & signal" },
      { id: "decay", title: "The IC decay curve" },
      { id: "erosion", title: "Decade-over-decade erosion" },
      { id: "robustness", title: "Robustness" },
      { id: "implications", title: "Implications & limitations" },
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
