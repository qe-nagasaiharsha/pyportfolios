/* ============================================================================
   Literature — Milestone 3. The canon: the books and the landmark papers that
   built quantitative finance over the last ~75 years. Curated, accurately cited.
   Each book carries a short tagline (`note`) and 2–3 "why it matters" bullets
   (`why`) surfaced in the expandable card. Drop a cover image at
   public/covers/<cover> and set `cover` to show real artwork; otherwise the card
   renders a styled typographic cover. Papers that map onto our research articles
   carry an `article` slug so the library cross-links into the case studies.
   ========================================================================== */

export interface Book {
  title: string;
  author: string;
  year: number;
  note: string;       // one-line tagline on the card
  why: string[];      // 2–3 bullets revealed in "Why it matters"
  cover?: string;     // optional /covers/<file>; falls back to a typographic cover
}

export interface BookGroup {
  theme: string;
  blurb: string;
  books: Book[];
}

export interface Paper {
  year: number;
  authors: string;
  title: string;
  journal: string;
  note: string;
  article?: string; // slug in /research/<article>
}

/* --------------------------------------------------------------- books -- */

export const BOOK_GROUPS: BookGroup[] = [
  {
    theme: "Foundations & Classics",
    blurb: "Where the ideas — and the temperament — come from.",
    books: [
      {
        title: "Capital Ideas",
        author: "Peter L. Bernstein",
        year: 1992,
        note: "How modern finance theory was actually built, person by person.",
        why: [
          "Tells how CAPM, efficient markets and Black–Scholes were really invented — the people and the arguments.",
          "Connects abstract academic theory to its messy adoption on Wall Street.",
          "The narrative backbone of modern quantitative finance.",
        ],
      },
      {
        title: "Against the Gods: The Remarkable Story of Risk",
        author: "Peter L. Bernstein",
        year: 1996,
        note: "The long history of how humanity learned to measure risk.",
        why: [
          "Traces the 2,000-year leap from fate to probability to forecasting.",
          "Shows where every risk model you'll build actually comes from.",
          "Essential context before you trust a single number.",
        ],
      },
      {
        title: "A Random Walk Down Wall Street",
        author: "Burton G. Malkiel",
        year: 1973,
        note: "The efficient-markets case for humility and indexing.",
        why: [
          "The canonical argument for efficient markets and index investing.",
          "Dismantles chart-reading and most active management.",
          "The humility baseline every quant should have to argue against.",
        ],
      },
      {
        title: "Fooled by Randomness",
        author: "Nassim Nicholas Taleb",
        year: 2001,
        note: "On luck, noise, and mistaking one for the other.",
        why: [
          "Why track records routinely confuse luck with skill.",
          "Makes survivorship and hindsight bias visceral.",
          "The mindset guard against over-trusting your own backtests.",
        ],
      },
      {
        title: "The (Mis)Behavior of Markets",
        author: "Benoit Mandelbrot & Richard Hudson",
        year: 2004,
        note: "Fat tails and fractals — why returns are wilder than the bell curve.",
        why: [
          "Returns have fat tails and fractal structure, not Gaussian ones.",
          "Volatility clusters; large moves are far likelier than models admit.",
          "Why 'six-sigma' events keep happening every few years.",
        ],
      },
      {
        title: "A Man for All Markets",
        author: "Edward O. Thorp",
        year: 2017,
        note: "The original quant, from blackjack to the first market-neutral fund.",
        why: [
          "The first quant: card-counting → warrant pricing → market-neutral fund.",
          "Edge, Kelly position-sizing and risk control, straight from the source.",
          "Proof that systematic edges exist — and decay.",
        ],
      },
    ],
  },
  {
    theme: "Derivatives & Volatility",
    blurb: "Pricing, hedging, and the surface beneath every option.",
    books: [
      {
        title: "Options, Futures, and Other Derivatives",
        author: "John C. Hull",
        year: 2021,
        note: "The standard reference — the book every desk owns.",
        why: [
          "The desk-standard reference for pricing and hedging.",
          "Spans forwards and futures through exotics and rates.",
          "The shared vocabulary of every derivatives professional.",
        ],
      },
      {
        title: "Stochastic Calculus for Finance I & II",
        author: "Steven E. Shreve",
        year: 2004,
        note: "The mathematics, built carefully from binomial trees to Itô.",
        why: [
          "Builds the math rigorously from binomial trees to Itô calculus.",
          "The bridge between probability theory and pricing PDEs.",
          "The standard graduate text for quant mathematics.",
        ],
      },
      {
        title: "The Concepts and Practice of Mathematical Finance",
        author: "Mark S. Joshi",
        year: 2008,
        note: "Theory wired to implementation, by a practitioner.",
        why: [
          "Explains the why behind the models, not just the formulas.",
          "Wires theory directly to implementation on a real desk.",
          "Bridges the gap between coursework and the trading floor.",
        ],
      },
      {
        title: "The Volatility Surface",
        author: "Jim Gatheral",
        year: 2006,
        note: "How implied vol really behaves — and how to model it.",
        why: [
          "How implied volatility actually behaves across strike and expiry.",
          "Local vol, stochastic vol and the dynamics that matter.",
          "The reference for anyone modeling the smile.",
        ],
      },
      {
        title: "Dynamic Hedging",
        author: "Nassim Nicholas Taleb",
        year: 1997,
        note: "Options as traded, not as taught — Greeks in the wild.",
        why: [
          "Options as actually traded, not as taught in a classroom.",
          "Higher-order Greeks and the risks that quietly blow up books.",
          "Practitioner wisdom on running a real options portfolio.",
        ],
      },
      {
        title: "Arbitrage Theory in Continuous Time",
        author: "Tomas Björk",
        year: 2009,
        note: "The clean, rigorous route through no-arbitrage pricing.",
        why: [
          "The cleanest rigorous route through no-arbitrage pricing.",
          "Martingale methods and term-structure models, clearly built.",
          "The most readable bridge into academic finance math.",
        ],
      },
    ],
  },
  {
    theme: "Portfolio Construction & Asset Allocation",
    blurb: "Turning views and estimates into positions that hold up.",
    books: [
      {
        title: "Active Portfolio Management",
        author: "Richard C. Grinold & Ronald N. Kahn",
        year: 1999,
        note: "The quant-equity bible — information ratio, alpha, breadth.",
        why: [
          "The quant-equity bible: alpha, information ratio, breadth.",
          "The Fundamental Law linking skill, breadth and performance.",
          "The framework behind systematic equity desks.",
        ],
      },
      {
        title: "Expected Returns",
        author: "Antti Ilmanen",
        year: 2011,
        note: "A sweeping, evidence-based map of what actually drives returns.",
        why: [
          "A sweeping, evidence-based map of what drives returns.",
          "Risk premia across assets, factors and strategies.",
          "The empirical reference for allocation decisions.",
        ],
      },
      {
        title: "Asset Management: A Systematic Approach to Factor Investing",
        author: "Andrew Ang",
        year: 2014,
        note: "Factors as the underlying assets of everything you own.",
        why: [
          "Factors are the real drivers under everything you own.",
          "A rigorous, modern treatment of factor investing.",
          "Reframes asset allocation as factor allocation.",
        ],
      },
      {
        title: "Risk and Asset Allocation",
        author: "Attilio Meucci",
        year: 2005,
        note: "A rigorous, estimation-aware treatment of allocation.",
        why: [
          "Estimation-aware allocation that survives real data.",
          "Goes well beyond naive mean–variance optimisation.",
          "For building robust, professional allocation engines.",
        ],
      },
      {
        title: "Quantitative Equity Portfolio Management",
        author: "Chincarini & Kim",
        year: 2006,
        note: "Building and risk-managing a real quant equity book.",
        why: [
          "Building and risk-managing a real quant equity book.",
          "From factor models to transaction costs and attribution.",
          "The practical companion to Grinold & Kahn.",
        ],
      },
    ],
  },
  {
    theme: "Risk Management",
    blurb: "Measuring — and respecting — the tails.",
    books: [
      {
        title: "Quantitative Risk Management: Concepts, Techniques and Tools",
        author: "McNeil, Frey & Embrechts",
        year: 2015,
        note: "The QRM canon — EVT, copulas, coherent risk measures.",
        why: [
          "The QRM canon: EVT, copulas, coherent risk measures.",
          "Rigorous treatment of dependence and tail risk.",
          "The reference for serious risk modeling.",
        ],
      },
      {
        title: "Value at Risk",
        author: "Philippe Jorion",
        year: 2006,
        note: "The benchmark text on VaR and its honest limits.",
        why: [
          "The benchmark text on VaR — and its honest limits.",
          "How the number is built, used and abused.",
          "Foundational for any market-risk role.",
        ],
      },
      {
        title: "Risk Management and Financial Institutions",
        author: "John C. Hull",
        year: 2018,
        note: "Market, credit, and operational risk for the whole institution.",
        why: [
          "Market, credit and operational risk for the whole firm.",
          "Basel rules and regulatory context, explained clearly.",
          "The institutional, top-down view of risk.",
        ],
      },
      {
        title: "The Concentration of Risk (Modelling Extremal Events)",
        author: "Embrechts, Klüppelberg & Mikosch",
        year: 1997,
        note: "The deep reference for extreme-value theory in finance.",
        why: [
          "The deep reference for extreme-value theory in finance.",
          "The mathematics of the tails that matter most.",
          "Where serious tail-risk modeling is grounded.",
        ],
      },
    ],
  },
  {
    theme: "Trading, Microstructure & Execution",
    blurb: "How prices are actually made — and how to trade against them.",
    books: [
      {
        title: "Trading and Exchanges",
        author: "Larry Harris",
        year: 2003,
        note: "Market microstructure for practitioners — the definitive plain-English account.",
        why: [
          "The definitive plain-English account of how markets work.",
          "Order types, market makers and who profits from whom.",
          "Microstructure written for practitioners, not theorists.",
        ],
      },
      {
        title: "Algorithmic and High-Frequency Trading",
        author: "Cartea, Jaimungal & Penalva",
        year: 2015,
        note: "The mathematics of execution, market-making, and optimal trading.",
        why: [
          "The mathematics of optimal execution and market-making.",
          "Inventory models, market impact and stochastic control.",
          "The rigorous text for execution and HFT quants.",
        ],
      },
      {
        title: "Market Microstructure Theory",
        author: "Maureen O'Hara",
        year: 1995,
        note: "The foundational theory of information and price formation.",
        why: [
          "The foundational theory of how information becomes price.",
          "Inventory- and information-based models of the spread.",
          "The academic bedrock of microstructure.",
        ],
      },
      {
        title: "Inside the Black Box",
        author: "Rishi K. Narang",
        year: 2013,
        note: "What a quant trading firm really does, demystified.",
        why: [
          "What a quant trading firm actually does, demystified.",
          "Alpha, risk and execution across the full systematic stack.",
          "The best accessible overview of the industry.",
        ],
      },
      {
        title: "Algorithmic Trading",
        author: "Ernest P. Chan",
        year: 2013,
        note: "Mean-reversion and momentum strategies, built and tested.",
        why: [
          "Mean-reversion and momentum strategies, built and tested.",
          "Practical backtesting with honest caveats about pitfalls.",
          "A hands-on on-ramp to systematic trading.",
        ],
      },
    ],
  },
  {
    theme: "Machine Learning & Time Series",
    blurb: "Statistics and ML, applied without fooling yourself.",
    books: [
      {
        title: "Advances in Financial Machine Learning",
        author: "Marcos López de Prado",
        year: 2018,
        note: "The modern playbook — and a relentless guide to not overfitting.",
        why: [
          "The modern playbook for ML on financial data.",
          "Relentless on not overfitting: purged CV, meta-labeling.",
          "Required reading on the field's specific traps.",
        ],
      },
      {
        title: "Analysis of Financial Time Series",
        author: "Ruey S. Tsay",
        year: 2010,
        note: "GARCH, regime models, and the econometrics of returns.",
        why: [
          "GARCH, regime models and the econometrics of returns.",
          "Volatility, dependence and high-frequency data.",
          "The standard time-series reference for finance.",
        ],
      },
      {
        title: "The Elements of Statistical Learning",
        author: "Hastie, Tibshirani & Friedman",
        year: 2009,
        note: "The reference for the statistical learning underneath it all.",
        why: [
          "The reference for the statistics under all of ML.",
          "Bias–variance, regularization, trees and boosting.",
          "The theory every applied modeler keeps returning to.",
        ],
      },
      {
        title: "Machine Learning for Asset Managers",
        author: "Marcos López de Prado",
        year: 2020,
        note: "A short, sharp course on doing ML in finance correctly.",
        why: [
          "A short, sharp course on doing ML in finance correctly.",
          "Denoising covariance, clustering, feature importance.",
          "Concentrated, practical and rigorous.",
        ],
      },
    ],
  },
  {
    theme: "Python & Practice",
    blurb: "From idea to runnable code — the pyportfolios way.",
    books: [
      {
        title: "Python for Finance",
        author: "Yves Hilpisch",
        year: 2018,
        note: "The end-to-end Python quant stack, by example.",
        why: [
          "The end-to-end Python quant stack, by example.",
          "Data, analytics, derivatives and deployment.",
          "The reference for building finance tooling in Python.",
        ],
      },
      {
        title: "Machine Learning for Algorithmic Trading",
        author: "Stefan Jansen",
        year: 2020,
        note: "A practical, code-first pipeline from data to backtest.",
        why: [
          "A code-first pipeline from raw data to backtest.",
          "Practical ML applied to real market data.",
          "Bridges theory and a working strategy.",
        ],
      },
      {
        title: "Quantitative Trading",
        author: "Ernest P. Chan",
        year: 2008,
        note: "How to build your own algorithmic trading business.",
        why: [
          "How to build your own algorithmic trading business.",
          "Strategy, infrastructure and the common pitfalls.",
          "The starter guide for independent quants.",
        ],
      },
    ],
  },
];

/* -------------------------------------------------------------- papers -- */
/* Chronological — the papers that shaped the field, 1952 → today. */

export const PAPERS: Paper[] = [
  { year: 1952, authors: "Harry Markowitz", title: "Portfolio Selection", journal: "The Journal of Finance", note: "Mean–variance optimisation — the birth of modern portfolio theory." },
  { year: 1958, authors: "James Tobin", title: "Liquidity Preference as Behavior Towards Risk", journal: "Review of Economic Studies", note: "The two-fund separation theorem." },
  { year: 1964, authors: "William F. Sharpe", title: "Capital Asset Prices", journal: "The Journal of Finance", note: "The CAPM — risk priced by a single market beta." },
  { year: 1970, authors: "Eugene F. Fama", title: "Efficient Capital Markets: A Review of Theory and Empirical Work", journal: "The Journal of Finance", note: "The efficient-market hypothesis, formalised." },
  { year: 1973, authors: "Fischer Black & Myron Scholes", title: "The Pricing of Options and Corporate Liabilities", journal: "Journal of Political Economy", note: "The option-pricing formula — replication and no-arbitrage.", article: "black-scholes-from-first-principles" },
  { year: 1973, authors: "Robert C. Merton", title: "Theory of Rational Option Pricing", journal: "Bell Journal of Economics", note: "Extends and generalises Black–Scholes." },
  { year: 1976, authors: "Stephen A. Ross", title: "The Arbitrage Theory of Capital Asset Pricing", journal: "Journal of Economic Theory", note: "APT — multi-factor returns from no-arbitrage." },
  { year: 1979, authors: "Cox, Ross & Rubinstein", title: "Option Pricing: A Simplified Approach", journal: "Journal of Financial Economics", note: "The binomial tree — pricing options by backward induction." },
  { year: 1982, authors: "Robert F. Engle", title: "Autoregressive Conditional Heteroscedasticity", journal: "Econometrica", note: "ARCH — modelling time-varying volatility (a Nobel idea)." },
  { year: 1985, authors: "Albert S. Kyle", title: "Continuous Auctions and Insider Trading", journal: "Econometrica", note: "The foundational model of market microstructure and price impact." },
  { year: 1986, authors: "Tim Bollerslev", title: "Generalized Autoregressive Conditional Heteroscedasticity", journal: "Journal of Econometrics", note: "GARCH — the workhorse volatility model.", article: "evt-t-copula-var" },
  { year: 1992, authors: "Fischer Black & Robert Litterman", title: "Global Portfolio Optimization", journal: "Financial Analysts Journal", note: "Blending market equilibrium with investor views — Black–Litterman." },
  { year: 1993, authors: "Eugene F. Fama & Kenneth R. French", title: "Common Risk Factors in the Returns on Stocks and Bonds", journal: "Journal of Financial Economics", note: "The three-factor model — size and value beyond the market." },
  { year: 1993, authors: "Narasimhan Jegadeesh & Sheridan Titman", title: "Returns to Buying Winners and Selling Losers", journal: "The Journal of Finance", note: "Momentum — the most documented anomaly in finance.", article: "cross-sectional-momentum" },
  { year: 1993, authors: "Steven L. Heston", title: "A Closed-Form Solution for Options with Stochastic Volatility", journal: "Review of Financial Studies", note: "The Heston model — volatility that is itself random." },
  { year: 1997, authors: "Mark M. Carhart", title: "On Persistence in Mutual Fund Performance", journal: "The Journal of Finance", note: "Adds momentum as a fourth pricing factor." },
  { year: 2000, authors: "Alexander J. McNeil & Rüdiger Frey", title: "Estimation of Tail-Related Risk Measures for Heteroscedastic Financial Time Series", journal: "Journal of Empirical Finance", note: "GARCH + Extreme Value Theory — conditional tail risk.", article: "evt-t-copula-var" },
  { year: 2001, authors: "Robert Almgren & Neil Chriss", title: "Optimal Execution of Portfolio Transactions", journal: "Journal of Risk", note: "The cost–risk frontier of trading — foundational for execution." },
  { year: 2004, authors: "Olivier Ledoit & Michael Wolf", title: "Honey, I Shrunk the Sample Covariance Matrix", journal: "Journal of Portfolio Management", note: "Shrinkage — a well-conditioned covariance that survives out-of-sample.", article: "ledoit-wolf-shrinkage" },
  { year: 2015, authors: "Eugene F. Fama & Kenneth R. French", title: "A Five-Factor Asset Pricing Model", journal: "Journal of Financial Economics", note: "Adds profitability and investment to the factor zoo." },
  { year: 2016, authors: "Marcos López de Prado", title: "Building Diversified Portfolios that Outperform Out of Sample", journal: "Journal of Portfolio Management", note: "Hierarchical Risk Parity — allocation without inverting a covariance matrix.", article: "hierarchical-risk-parity" },
];

export const BOOK_COUNT = BOOK_GROUPS.reduce((n, g) => n + g.books.length, 0);
export const PAPER_COUNT = PAPERS.length;
