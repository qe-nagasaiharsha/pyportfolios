/* Catalogue entry for black-scholes-from-first-principles, lifted verbatim from site/src/lib/articles.ts.
   Paste back into the ARTICLES array to restore. */

  {
    slug: "black-scholes-from-first-principles",
    hero: "hero/mountains-africa.jpg",
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
