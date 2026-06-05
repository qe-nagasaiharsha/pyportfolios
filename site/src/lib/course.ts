/* ============================================================================
   Course — Milestone 4. "Quant Finance Basics" as its own category: a structured
   curriculum from first principles to a working backtest. Lessons that have a
   case study / notebook on this site link straight through. Module 1 is free.
   ========================================================================== */

export interface Lesson {
  title: string;
  summary: string;
  minutes: number;
  article?: string; // slug in /research/<article>
}

export interface Module {
  no: string;
  title: string;
  blurb: string;
  free?: boolean;
  lessons: Lesson[];
}

export const MODULES: Module[] = [
  {
    no: "01",
    title: "Foundations",
    blurb: "The arithmetic and intuition every model inherits.",
    free: true,
    lessons: [
      { title: "The time value of money", summary: "Discounting, compounding, and the yield curve — priced in pandas.", minutes: 12, article: "time-value-of-money" },
      { title: "Risk, return, and the trade-off", summary: "Why you can't talk about one without the other.", minutes: 10 },
      { title: "Probability & distributions for finance", summary: "Normal, Student-t, and why the tails matter.", minutes: 14 },
      { title: "Returns, log-returns, and the pitfalls", summary: "The data hygiene that decides whether anything later is true.", minutes: 11 },
    ],
  },
  {
    no: "02",
    title: "Markets & Instruments",
    blurb: "What actually trades, and how.",
    lessons: [
      { title: "Asset classes and how they trade", summary: "Equities, rates, FX, commodities, crypto — the lay of the land.", minutes: 12 },
      { title: "Bonds and the yield curve", summary: "Discount factors, duration, and what the curve is telling you.", minutes: 15 },
      { title: "Options: payoffs and the basics", summary: "Calls, puts, and the shape of optionality.", minutes: 13 },
      { title: "Futures, forwards, and the cost of carry", summary: "Linear derivatives and the no-arbitrage link to spot.", minutes: 12 },
    ],
  },
  {
    no: "03",
    title: "Pricing & the Greeks",
    blurb: "From replication to a hedged book.",
    lessons: [
      { title: "No-arbitrage and replication", summary: "The single idea that prices everything.", minutes: 12 },
      { title: "Black–Scholes from first principles", summary: "Derive the formula from a hedged portfolio, then code it.", minutes: 18, article: "black-scholes-from-first-principles" },
      { title: "The Greeks: delta to theta", summary: "How a desk measures and manages its risk.", minutes: 14 },
      { title: "Where the model breaks: the volatility smile", summary: "Why constant vol is a fiction — and what to do about it.", minutes: 12 },
    ],
  },
  {
    no: "04",
    title: "Portfolio Construction",
    blurb: "Turning noisy estimates into allocations that hold up.",
    lessons: [
      { title: "Mean–variance and the efficient frontier", summary: "Markowitz, and the error-maximiser hiding inside it.", minutes: 16 },
      { title: "The CAPM and factor models", summary: "Beta, then the factor zoo — size, value, momentum.", minutes: 15 },
      { title: "Covariance estimation & Ledoit–Wolf shrinkage", summary: "Why the sample matrix fails, and how shrinkage repairs it.", minutes: 14, article: "ledoit-wolf-shrinkage" },
      { title: "Risk parity & Hierarchical Risk Parity", summary: "Allocation without inverting a covariance matrix.", minutes: 13, article: "hierarchical-risk-parity" },
    ],
  },
  {
    no: "05",
    title: "Risk Management",
    blurb: "Measuring, and respecting, the tails.",
    lessons: [
      { title: "Volatility clustering and GARCH", summary: "Modelling the fact that volatility comes in waves.", minutes: 15 },
      { title: "Value at Risk & CVaR, three ways", summary: "Historical, parametric, Monte Carlo — and a backtest.", minutes: 13, article: "var-cvar-three-ways" },
      { title: "Tail risk with Extreme Value Theory", summary: "GARCH margins, Pareto tails, and a t-copula.", minutes: 16, article: "evt-t-copula-var" },
      { title: "Stress testing and drawdown", summary: "What breaks the book, and how deep it goes.", minutes: 12 },
    ],
  },
  {
    no: "06",
    title: "Signals & Backtesting",
    blurb: "Edge, honestly measured.",
    lessons: [
      { title: "How to backtest without fooling yourself", summary: "Look-ahead, survivorship, and the costs people skip.", minutes: 15 },
      { title: "Cross-sectional momentum", summary: "The most documented anomaly — backtested honestly.", minutes: 14, article: "cross-sectional-momentum" },
      { title: "Pairs trading and cointegration", summary: "Engle–Granger, the spread z-score, and realistic costs.", minutes: 13, article: "pairs-trading-cointegration" },
      { title: "Execution, costs, and turnover", summary: "Why a great backtest can still lose money.", minutes: 11 },
    ],
  },
  {
    no: "07",
    title: "The Python Toolkit",
    blurb: "From idea to a runnable, reproducible backtest.",
    lessons: [
      { title: "NumPy and pandas for finance", summary: "Vectorised returns, rolling windows, and tidy data.", minutes: 14 },
      { title: "SciPy, statsmodels, and the stack", summary: "Optimisation, distributions, and econometrics in practice.", minutes: 13 },
      { title: "Reproducible research with notebooks", summary: "Code that anyone can re-run and trust.", minutes: 10 },
      { title: "From idea to backtest: the full loop", summary: "Putting the whole course together, end to end.", minutes: 18 },
    ],
  },
];

export const MODULE_COUNT = MODULES.length;
export const LESSON_COUNT = MODULES.reduce((n, m) => n + m.lessons.length, 0);
export const TOTAL_MINUTES = MODULES.reduce((n, m) => n + m.lessons.reduce((s, l) => s + l.minutes, 0), 0);
