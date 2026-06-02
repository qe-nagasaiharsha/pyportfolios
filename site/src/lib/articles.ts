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
  | "finance-fundamentals"
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

export interface Article {
  slug: string;
  category: CategorySlug;
  title: string;
  /** One-line dek under the title. */
  dek: string;
  /** ISO date — used for sorting + display. */
  date: string;
  readMinutes: number;
  level: "Foundational" | "Intermediate" | "Advanced";
  /** Filename under /public/notebooks. */
  notebook: string;
  /** Drives the sticky table of contents + scroll-spy. */
  sections: ArticleSection[];
  /** Card / index summary. */
  excerpt: string;
  /** Libraries the case study leans on — shown as a tech line. */
  stack: string[];
}

export const CATEGORIES: Record<CategorySlug, Category> = {
  "finance-fundamentals": {
    slug: "finance-fundamentals",
    numeral: "I",
    name: "Finance Fundamentals",
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
  "finance-fundamentals",
  "portfolio-optimization",
  "risk-management",
  "algorithmic-trading",
];

export const ARTICLES: Article[] = [
  /* ---------------------------------------------- Finance Fundamentals -- */
  {
    slug: "black-scholes-from-first-principles",
    category: "finance-fundamentals",
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
    category: "finance-fundamentals",
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

  /* ----------------------------------------------------- Risk Management -- */
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

  /* --------------------------------------------------- Algorithmic Trading -- */
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
