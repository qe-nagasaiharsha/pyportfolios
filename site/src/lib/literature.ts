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
  note: string;       // one-line tagline (teaser / first "why" point)
  why: string[];      // 2–3 bullets revealed in "Why it matters"
  cover?: string;     // optional /covers/<file>; falls back to a typographic cover
  citation?: string;  // full APA citation, shown in the hover detail layer
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
    theme: "Foundations",
    blurb: "The mathematics, probability and stochastic calculus everything else is built on.",
    books: [
      {
        title: "Financial calculus: An introduction to derivative pricing",
        author: "Baxter & Rennie",
        year: 1996,
        note: "A famous textbook and classic guide in quantitative finance.",
        citation: "Baxter, M., & Rennie, A. (1996). Financial calculus: An introduction to derivative pricing. Cambridge University Press.",
        why: [
          "A famous textbook and classic guide in quantitative finance.",
          "Explains the complex math used to find fair prices for financial derivatives.",
          "Bridges high-level mathematical theory and practical use on trading desks.",
        ],
        cover: "baxter-financial-calculus.jpg",
      },
      {
        title: "The concepts and practice of mathematical finance",
        author: "Joshi",
        year: 2008,
        note: "A highly respected guide to quantitative finance.",
        citation: "Joshi, M. S. (2008). The concepts and practice of mathematical finance (2nd ed.). Cambridge University Press.",
        why: [
          "A highly respected guide to quantitative finance.",
          "Bridges the gap between complex mathematical theory and practical trading-floor applications.",
          "Strong emphasis on how models are actually implemented.",
        ],
        cover: "joshi-the-concepts-and-practice-of-mathematical-.jpg",
      },
      {
        title: "Stochastic calculus for finance II: Continuous-time models",
        author: "Shreve",
        year: 2004,
        note: "Highly popular text from Carnegie Mellon’s renowned computational finance master’s program.",
        citation: "Shreve, S. E. (2004). Stochastic calculus for finance II: Continuous-time models. Springer.",
        why: [
          "Highly popular text from Carnegie Mellon’s renowned computational finance master’s program.",
          "A core guide for quants and financial engineers.",
          "Models stock prices, interest rates, and options under randomness over time.",
        ],
        cover: "shreve-stochastic-calculus-for-finance-ii.jpg",
      },
      {
        title: "Arbitrage theory in continuous time",
        author: "Björk",
        year: 2020,
        note: "The standard graduate text on arbitrage pricing in continuous time.",
        citation: "Björk, T. (2020). Arbitrage theory in continuous time (4th ed.). Oxford University Press.",
        why: [
          "The standard graduate text on arbitrage pricing in continuous time.",
          "Develops martingale and measure-change methods rigorously yet readably.",
          "Bridges pure stochastic calculus and derivative pricing.",
        ],
        cover: "bj-rk-arbitrage-theory-in-continuous-time.jpg",
      },
      {
        title: "Brownian motion and stochastic calculus",
        author: "Karatzas & Shreve",
        year: 1991,
        note: "The definitive mathematical reference on Brownian motion and stochastic calculus.",
        citation: "Karatzas, I., & Shreve, S. E. (1991). Brownian motion and stochastic calculus (2nd ed.). Springer.",
        why: [
          "The definitive mathematical reference on Brownian motion and stochastic calculus.",
          "Aimed at advanced readers.",
          "Supplies the rigorous foundations under every continuous-time pricing model.",
        ],
        cover: "karatzas-brownian-motion-and-stochastic-calculus.jpg",
      },
      {
        title: "Statistical inference",
        author: "Casella & Berger",
        year: 2002,
        note: "The standard graduate text on mathematical statistics and inference.",
        citation: "Casella, G., & Berger, R. L. (2002). Statistical inference (2nd ed.). Duxbury.",
        why: [
          "The standard graduate text on mathematical statistics and inference.",
          "Rigorous foundation in estimation, hypothesis testing, and likelihood.",
          "The statistics backbone behind econometrics and model validation.",
        ],
        cover: "casella-statistical-inference.jpg",
      },
      {
        title: "Analysis of financial time series",
        author: "Tsay",
        year: 2010,
        note: "The standard applied text on financial time series.",
        citation: "Tsay, R. S. (2010). Analysis of financial time series (3rd ed.). Wiley.",
        why: [
          "The standard applied text on financial time series.",
          "Covers volatility modeling (GARCH), return dynamics, and multivariate methods.",
          "A staple of empirical quant research.",
        ],
        cover: "tsay-analysis-of-financial-time-series.jpg",
      },
      {
        title: "Time series analysis",
        author: "Hamilton",
        year: 1994,
        note: "The authoritative reference on time-series econometrics.",
        citation: "Hamilton, J. D. (1994). Time series analysis. Princeton University Press.",
        why: [
          "The authoritative reference on time-series econometrics.",
          "Go-to source for ARMA, state-space, VAR, and regime-switching models.",
          "Dense and comprehensive.",
        ],
        cover: "hamilton-time-series-analysis.jpg",
      },
      {
        title: "A first course in probability",
        author: "Ross",
        year: 2019,
        note: "A classic first course in probability used worldwide.",
        citation: "Ross, S. M. (2019). A first course in probability (10th ed.). Pearson.",
        why: [
          "A classic first course in probability used worldwide.",
          "Builds core intuition for randomness, distributions, and expectation.",
          "Foundational for every quantitative discipline.",
        ],
        cover: "ross-a-first-course-in-probability.jpg",
      },
      {
        title: "Introduction to probability",
        author: "Blitzstein & Hwang",
        year: 2019,
        note: "Modern, intuition-first text from Harvard’s popular Stat 110 course.",
        citation: "Blitzstein, J. K., & Hwang, J. (2019). Introduction to probability (2nd ed.). Chapman & Hall/CRC.",
        why: [
          "Modern, intuition-first text from Harvard’s popular Stat 110 course.",
          "Makes conditioning, distributions, and stochastic thinking understandable.",
          "Widely praised for clarity.",
        ],
        cover: "blitzstein-introduction-to-probability.jpg",
      },
      {
        title: "The econometrics of financial markets",
        author: "Campbell & MacKinlay",
        year: 1997,
        note: "The foundational graduate text in financial econometrics.",
        citation: "Campbell, J. Y., Lo, A. W., & MacKinlay, A. C. (1997). The econometrics of financial markets. Princeton University Press.",
        why: [
          "The foundational graduate text in financial econometrics.",
          "Links asset-pricing theory to empirical testing.",
          "Standard reference for factor models and market-efficiency research.",
        ],
        cover: "campbell-the-econometrics-of-financial-markets.jpg",
      },
      {
        title: "Econometric analysis of cross section and panel data",
        author: "Wooldridge",
        year: 2010,
        note: "The leading reference on cross-section and panel econometrics.",
        citation: "Wooldridge, J. M. (2010). Econometric analysis of cross section and panel data (2nd ed.). MIT Press.",
        why: [
          "The leading reference on cross-section and panel econometrics.",
          "Standard for causal inference and fixed/random effects.",
          "Key methods for alpha and factor research.",
        ],
        cover: "wooldridge-econometric-analysis-of-cross-section.jpg",
      },
    ],
  },
  {
    theme: "Fixed Income & Interest-Rate Modeling",
    blurb: "Bonds, the yield curve, and the models that price interest-rate risk.",
    books: [
      {
        title: "Fixed income analysis",
        author: "Fabozzi",
        year: 2022,
        note: "The CFA-series standard on fixed income.",
        citation: "Fabozzi, F. J. (2022). Fixed income analysis (5th ed.). Wiley.",
        why: [
          "The CFA-series standard on fixed income.",
          "Covers bond math, term structure, credit, and securitized products.",
          "Institutional entry point to rates and credit analysis.",
        ],
        cover: "fabozzi-fixed-income-analysis.jpg",
      },
      {
        title: "Fixed income securities: Tools for today’s markets",
        author: "Tuckman & Serrat",
        year: 2022,
        note: "Modern, practitioner-oriented bestseller on fixed income.",
        citation: "Tuckman, B., & Serrat, A. (2022). Fixed income securities: Tools for today’s markets (4th ed.). Wiley.",
        why: [
          "Modern, practitioner-oriented bestseller on fixed income.",
          "Covers arbitrage pricing, duration/convexity, and curve construction.",
          "Reflects the tools used on rates desks today.",
        ],
        cover: "tuckman-fixed-income-securities.jpg",
      },
      {
        title: "Fixed income securities: Valuation, risk, and risk management",
        author: "Veronesi",
        year: 2010,
        note: "Bridges bond fundamentals and quantitative rates modeling.",
        citation: "Veronesi, P. (2010). Fixed income securities: Valuation, risk, and risk management. Wiley.",
        why: [
          "Bridges bond fundamentals and quantitative rates modeling.",
          "Strong on valuation and risk management.",
          "Covers derivatives and structured products.",
        ],
        cover: "veronesi-fixed-income-securities.jpg",
      },
      {
        title: "Bond pricing and yield curve modeling: A structural approach",
        author: "Rebonato",
        year: 2018,
        note: "A modern, authoritative treatment of the yield curve.",
        citation: "Rebonato, R. (2018). Bond pricing and yield curve modeling: A structural approach. Cambridge University Press.",
        why: [
          "A modern, authoritative treatment of the yield curve.",
          "A structural approach from a leading rates quant.",
          "Bridges heavy rates models and how curves are actually built.",
        ],
        cover: "rebonato-bond-pricing-and-yield-curve-modeling.jpg",
      },
      {
        title: "Interest rate models—Theory and practice: With smile, inflation and credit",
        author: "Brigo & Mercurio",
        year: 2006,
        note: "The definitive practitioner reference for interest-rate models.",
        citation: "Brigo, D., & Mercurio, F. (2006). Interest rate models—Theory and practice: With smile, inflation and credit (2nd ed.). Springer.",
        why: [
          "The definitive practitioner reference for interest-rate models.",
          "Covers short-rate and market (LIBOR/HJM) models in depth.",
          "Detailed on calibration and smile-consistent pricing.",
        ],
        cover: "brigo-interest-rate-models.jpg",
      },
      {
        title: "Interest rate modeling",
        author: "Andersen & Piterbarg",
        year: 2010,
        note: "Three-volume magnum opus on modern rates modeling.",
        citation: "Andersen, L. B. G., & Piterbarg, V. V. (2010). Interest rate modeling (Vols. 1–3). Atlantic Financial Press.",
        why: [
          "Three-volume magnum opus on modern rates modeling.",
          "Written by leading quants.",
          "The most comprehensive advanced treatment of term structure, volatility, and numerics.",
        ],
      },
    ],
  },
  {
    theme: "Derivatives, Options & Volatility",
    blurb: "Options, futures and the volatility surface — how derivatives are priced and hedged.",
    books: [
      {
        title: "Options, futures, and other derivatives",
        author: "Hull",
        year: 2021,
        note: "The most widely used derivatives textbook in the world.",
        citation: "Hull, J. C. (2021). Options, futures, and other derivatives (11th ed.). Pearson.",
        why: [
          "The most widely used derivatives textbook in the world.",
          "The common language of options, futures, swaps, and risk-neutral pricing.",
          "Standard for students and practitioners alike.",
        ],
        cover: "hull-options-futures-and-other-derivatives.jpg",
      },
      {
        title: "Option volatility and pricing: Advanced trading strategies and techniques",
        author: "Natenberg",
        year: 2015,
        note: "The classic on options from a trader’s perspective.",
        citation: "Natenberg, S. (2015). Option volatility and pricing: Advanced trading strategies and techniques (2nd ed.). McGraw-Hill.",
        why: [
          "The classic on options from a trader’s perspective.",
          "Builds intuition for the Greeks, volatility, and spreads.",
          "Light on heavy math; a perennial desk favorite.",
        ],
        cover: "natenberg-option-volatility-and-pricing.jpg",
      },
      {
        title: "Paul Wilmott on quantitative finance",
        author: "Wilmott",
        year: 2006,
        note: "An intuition-rich tour of quantitative finance.",
        citation: "Wilmott, P. (2006). Paul Wilmott on quantitative finance (2nd ed.). Wiley.",
        why: [
          "An intuition-rich tour of quantitative finance.",
          "From a renowned practitioner-educator.",
          "Connects derivatives math to real market behavior.",
        ],
        cover: "wilmott-paul-wilmott-on-quantitative-finance.jpg",
      },
      {
        title: "The volatility surface: A practitioner’s guide",
        author: "Gatheral",
        year: 2006,
        note: "The definitive text on the implied-volatility surface.",
        citation: "Gatheral, J. (2006). The volatility surface: A practitioner’s guide. Wiley.",
        why: [
          "The definitive text on the implied-volatility surface.",
          "Standard reference for local and stochastic volatility models.",
          "Used to price and hedge exotic options.",
        ],
        cover: "gatheral-the-volatility-surface.jpg",
      },
      {
        title: "Monte Carlo methods in financial engineering",
        author: "Glasserman",
        year: 2003,
        note: "The authoritative reference on Monte Carlo methods in finance.",
        citation: "Glasserman, P. (2003). Monte Carlo methods in financial engineering. Springer.",
        why: [
          "The authoritative reference on Monte Carlo methods in finance.",
          "Covers simulation, variance reduction, and Greeks estimation.",
          "Underpins pricing of path-dependent, high-dimensional derivatives.",
        ],
        cover: "glasserman-monte-carlo-methods-in-financial-engi.jpg",
      },
    ],
  },
  {
    theme: "Portfolio Optimization & Asset Allocation",
    blurb: "From the mean–variance frontier to factor investing and robust allocation.",
    books: [
      {
        title: "Investments",
        author: "Bodie & Marcus",
        year: 2024,
        note: "The leading university textbook on investments.",
        citation: "Bodie, Z., Kane, A., & Marcus, A. J. (2024). Investments (13th ed.). McGraw-Hill.",
        why: [
          "The leading university textbook on investments.",
          "Covers risk-return, the CAPM, market efficiency, and asset classes.",
          "Foundational framework for all portfolio work.",
        ],
        cover: "bodie-investments.jpg",
      },
      {
        title: "Investment science",
        author: "Luenberger",
        year: 2013,
        note: "A clear, elegant introduction to investment mathematics.",
        citation: "Luenberger, D. G. (2013). Investment science (2nd ed.). Oxford University Press.",
        why: [
          "A clear, elegant introduction to investment mathematics.",
          "Spans cash flows, mean-variance theory, and derivatives.",
          "Ideal foundational bridge into quant portfolio work.",
        ],
        cover: "luenberger-investment-science.jpg",
      },
      {
        title: "Active portfolio management: A quantitative approach for producing superior returns and controlling risk",
        author: "Grinold & Kahn",
        year: 1999,
        note: "The definitive institutional text on quantitative active management.",
        citation: "Grinold, R. C., & Kahn, R. N. (1999). Active portfolio management: A quantitative approach for producing superior returns and controlling risk (2nd ed.). McGraw-Hill.",
        why: [
          "The definitive institutional text on quantitative active management.",
          "Introduced the information ratio and the Fundamental Law of Active Management.",
          "Foundational for factor investing and alpha research.",
        ],
        cover: "grinold-active-portfolio-management.jpg",
      },
      {
        title: "Modern investment management: An equilibrium approach",
        author: "Litterman",
        year: 2003,
        note: "The Goldman Sachs guide to institutional portfolio management.",
        citation: "Litterman, B., & the Quantitative Resources Group, Goldman Sachs. (2003). Modern investment management: An equilibrium approach. Wiley.",
        why: [
          "The Goldman Sachs guide to institutional portfolio management.",
          "Best known for the Black–Litterman model.",
          "Equilibrium approach to combining views with market priors.",
        ],
        cover: "litterman-modern-investment-management.jpg",
      },
      {
        title: "Risk and asset allocation",
        author: "Meucci",
        year: 2005,
        note: "Advanced, unifying treatment of risk and asset allocation.",
        citation: "Meucci, A. (2005). Risk and asset allocation. Springer.",
        why: [
          "Advanced, unifying treatment of risk and asset allocation.",
          "Covers estimation, Bayesian methods, and robust optimization.",
          "Reflects how professionals build portfolios.",
        ],
        cover: "meucci-risk-and-asset-allocation.jpg",
      },
      {
        title: "Robust portfolio optimization and management",
        author: "Fabozzi & Focardi",
        year: 2007,
        note: "A focused treatment of robust portfolio construction.",
        citation: "Fabozzi, F. J., Kolm, P. N., Pachamanova, D. A., & Focardi, S. M. (2007). Robust portfolio optimization and management. Wiley.",
        why: [
          "A focused treatment of robust portfolio construction.",
          "Tackles estimation error and unstable covariance matrices.",
          "Moves beyond classical Markowitz toward real-world optimization.",
        ],
        cover: "fabozzi-robust-portfolio-optimization-and-manage.jpg",
      },
    ],
  },
  {
    theme: "Risk Management",
    blurb: "Measuring, stress-testing and surviving the tails.",
    books: [
      {
        title: "Risk management and financial institutions",
        author: "Hull",
        year: 2023,
        note: "A broad, accessible survey of financial risk management.",
        citation: "Hull, J. C. (2023). Risk management and financial institutions (6th ed.). Wiley.",
        why: [
          "A broad, accessible survey of financial risk management.",
          "Connects market, credit, and operational risk with regulation.",
          "Standard for risk professionals and the FRM exam.",
        ],
        cover: "hull-risk-management-and-financial-institutions.jpg",
      },
      {
        title: "The essentials of risk management",
        author: "Crouhy & Mark",
        year: 2014,
        note: "A practitioner overview of enterprise risk management.",
        citation: "Crouhy, M., Galai, D., & Mark, R. (2014). The essentials of risk management (2nd ed.). McGraw-Hill.",
        why: [
          "A practitioner overview of enterprise risk management.",
          "Explains VaR, credit and operational risk, and governance.",
          "An ideal foundational read.",
        ],
        cover: "crouhy-the-essentials-of-risk-management.jpg",
      },
      {
        title: "Value at risk: The new benchmark for managing financial risk",
        author: "Jorion",
        year: 2007,
        note: "The classic reference on Value at Risk.",
        citation: "Jorion, P. (2007). Value at risk: The new benchmark for managing financial risk (3rd ed.). McGraw-Hill.",
        why: [
          "The classic reference on Value at Risk.",
          "Defined the modern language of market-risk measurement.",
          "Standard introduction to VaR methodology and its pitfalls.",
        ],
        cover: "jorion-value-at-risk.jpg",
      },
      {
        title: "Quantitative risk management: Concepts, techniques and tools",
        author: "McNeil & Embrechts",
        year: 2015,
        note: "The rigorous graduate text on quantitative risk management.",
        citation: "McNeil, A. J., Frey, R., & Embrechts, P. (2015). Quantitative risk management: Concepts, techniques and tools (Rev. ed.). Princeton University Press.",
        why: [
          "The rigorous graduate text on quantitative risk management.",
          "Authoritative on extreme-value theory and copulas.",
          "Underpins modern tail-risk systems.",
        ],
        cover: "mcneil-quantitative-risk-management.jpg",
      },
    ],
  },
  {
    theme: "Market Microstructure & Execution",
    blurb: "How orders become prices — liquidity, market impact and execution.",
    books: [
      {
        title: "Trading and exchanges: Market microstructure for practitioners",
        author: "Harris",
        year: 2003,
        note: "The most accessible guide to how markets actually work.",
        citation: "Harris, L. (2003). Trading and exchanges: Market microstructure for practitioners. Oxford University Press.",
        why: [
          "The most accessible guide to how markets actually work.",
          "Explains order types, liquidity, and trading mechanics.",
          "The ideal first book on microstructure.",
        ],
        cover: "harris-trading-and-exchanges.jpg",
      },
      {
        title: "Market microstructure theory",
        author: "O’Hara",
        year: 1995,
        note: "The classic theoretical foundation of market microstructure.",
        citation: "O’Hara, M. (1995). Market microstructure theory. Blackwell.",
        why: [
          "The classic theoretical foundation of market microstructure.",
          "Formalizes how information and inventory shape prices and spreads.",
          "A standard academic reference.",
        ],
        cover: "o-hara-market-microstructure-theory.jpg",
      },
      {
        title: "Market liquidity: Theory, evidence, and policy",
        author: "Foucault & Röell",
        year: 2024,
        note: "A modern graduate synthesis of market-liquidity research.",
        citation: "Foucault, T., Pagano, M., & Röell, A. (2024). Market liquidity: Theory, evidence, and policy (2nd ed.). Oxford University Press.",
        why: [
          "A modern graduate synthesis of market-liquidity research.",
          "Surveys the theory, evidence, and policy of liquidity.",
          "Rigorous treatment of how markets price liquidity.",
        ],
        cover: "foucault-market-liquidity.jpg",
      },
      {
        title: "Algorithmic trading methods: Applications using advanced statistics, optimization, and machine learning techniques",
        author: "Kissell",
        year: 2021,
        note: "The leading applied reference on trading costs and execution.",
        citation: "Kissell, R. (2021). Algorithmic trading methods: Applications using advanced statistics, optimization, and machine learning techniques (2nd ed.). Academic Press.",
        why: [
          "The leading applied reference on trading costs and execution.",
          "Covers market-impact modeling and TWAP/VWAP algorithms.",
          "2nd edition adds advanced statistics, optimization, and machine learning.",
        ],
      },
      {
        title: "Algorithmic and high-frequency trading",
        author: "Cartea & Penalva",
        year: 2015,
        note: "The leading quantitative text on algorithmic and high-frequency trading.",
        citation: "Cartea, Á., Jaimungal, S., & Penalva, J. (2015). Algorithmic and high-frequency trading. Cambridge University Press.",
        why: [
          "The leading quantitative text on algorithmic and high-frequency trading.",
          "Develops optimal execution and market-making.",
          "Built on stochastic control.",
        ],
      },
    ],
  },
  {
    theme: "Algorithmic Trading & Machine Learning",
    blurb: "Systematic strategies and machine learning applied to live markets.",
    books: [
      {
        title: "Quantitative trading: How to build your own algorithmic trading business",
        author: "Chan",
        year: 2021,
        note: "An accessible, hands-on intro to building a retail quant trading business.",
        citation: "Chan, E. P. (2021). Quantitative trading: How to build your own algorithmic trading business (2nd ed.). Wiley.",
        why: [
          "An accessible, hands-on intro to building a retail quant trading business.",
          "Demystifies backtesting and strategy evaluation.",
          "Covers the practical realities of going live.",
        ],
        cover: "chan-quantitative-trading.jpg",
      },
      {
        title: "Inside the black box: A simple guide to quantitative and high-frequency trading",
        author: "Narang",
        year: 2013,
        note: "A clear, non-technical overview of quant and HFT firms.",
        citation: "Narang, R. K. (2013). Inside the black box: A simple guide to quantitative and high-frequency trading (2nd ed.). Wiley.",
        why: [
          "A clear, non-technical overview of quant and HFT firms.",
          "Maps how systematic trading actually works.",
          "The best big-picture view of the “black box.”",
        ],
        cover: "narang-inside-the-black-box.jpg",
      },
      {
        title: "Algorithmic trading: Winning strategies and their rationale",
        author: "Chan",
        year: 2013,
        note: "A more advanced sequel with concrete strategies.",
        citation: "Chan, E. P. (2013). Algorithmic trading: Winning strategies and their rationale. Wiley.",
        why: [
          "A more advanced sequel with concrete strategies.",
          "Covers mean-reversion and momentum.",
          "Includes the statistical tests to validate them.",
        ],
      },
      {
        title: "Systematic trading: A unique new method for designing trading and investing systems",
        author: "Carver",
        year: 2015,
        note: "A framework for designing systematic trading systems.",
        citation: "Carver, R. (2015). Systematic trading: A unique new method for designing trading and investing systems. Harriman House.",
        why: [
          "A framework for designing systematic trading systems.",
          "Strong on position sizing and diversification.",
          "Focused on avoiding overfitting.",
        ],
        cover: "carver-systematic-trading.jpg",
      },
      {
        title: "Machine learning for algorithmic trading",
        author: "Jansen",
        year: 2020,
        note: "A comprehensive, code-rich guide to ML for trading.",
        citation: "Jansen, S. (2020). Machine learning for algorithmic trading (2nd ed.). Packt Publishing.",
        why: [
          "A comprehensive, code-rich guide to ML for trading.",
          "800+ pages spanning data sourcing to deployment.",
          "Full ML workflow in Python.",
        ],
        cover: "jansen-machine-learning-for-algorithmic-trading.jpg",
      },
      {
        title: "Advances in financial machine learning",
        author: "López de Prado",
        year: 2018,
        note: "A landmark text on rigorous ML in finance.",
        citation: "López de Prado, M. (2018). Advances in financial machine learning. Wiley.",
        why: [
          "A landmark text on rigorous ML in finance.",
          "Exposes common backtesting pitfalls.",
          "Introduces meta-labeling and purged cross-validation.",
        ],
        cover: "l-pez-de-prado-advances-in-financial-machine-lea.jpg",
      },
      {
        title: "Python for data analysis: Data wrangling with pandas, NumPy, and Jupyter",
        author: "McKinney",
        year: 2022,
        note: "The definitive guide to data analysis in Python.",
        citation: "McKinney, W. (2022). Python for data analysis: Data wrangling with pandas, NumPy, and Jupyter (3rd ed.). O’Reilly Media.",
        why: [
          "The definitive guide to data analysis in Python.",
          "Written by the creator of pandas.",
          "Foundational toolkit for quant work in Python.",
        ],
        cover: "mckinney-python-for-data-analysis.jpg",
      },
      {
        title: "Python for finance: Mastering data-driven finance",
        author: "Hilpisch",
        year: 2018,
        note: "The standard reference for doing finance with Python.",
        citation: "Hilpisch, Y. J. (2018). Python for finance: Mastering data-driven finance (2nd ed.). O’Reilly Media.",
        why: [
          "The standard reference for doing finance with Python.",
          "Covers data handling and derivatives analytics.",
          "Includes Monte Carlo simulation.",
        ],
        cover: "hilpisch-python-for-finance.jpg",
      },
      {
        title: "Python for finance cookbook",
        author: "Lewinson",
        year: 2022,
        note: "A recipe-based cookbook for financial analysis in Python.",
        citation: "Lewinson, E. (2022). Python for finance cookbook (2nd ed.). Packt Publishing.",
        why: [
          "A recipe-based cookbook for financial analysis in Python.",
          "A fast, hands-on reference.",
          "Covers time-series, risk, and portfolio tasks.",
        ],
        cover: "lewinson-python-for-finance-cookbook.jpg",
      },
      {
        title: "Python for algorithmic trading: From idea to cloud deployment",
        author: "Hilpisch",
        year: 2020,
        note: "An end-to-end guide to automated trading in Python.",
        citation: "Hilpisch, Y. J. (2020). Python for algorithmic trading: From idea to cloud deployment. O’Reilly Media.",
        why: [
          "An end-to-end guide to automated trading in Python.",
          "Covers backtesting and broker APIs.",
          "Includes cloud deployment of live strategies.",
        ],
      },
      {
        title: "Python for algorithmic trading cookbook",
        author: "Strimpel",
        year: 2024,
        note: "A modern cookbook for the algo-trading workflow in Python.",
        citation: "Strimpel, J. (2024). Python for algorithmic trading cookbook. Packt Publishing.",
        why: [
          "A modern cookbook for the algo-trading workflow in Python.",
          "Up-to-date recipes for data, signals, and backtesting.",
          "Covers execution.",
        ],
      },
    ],
  },
];

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
