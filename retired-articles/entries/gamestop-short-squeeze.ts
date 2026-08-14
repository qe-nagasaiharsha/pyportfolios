/* Catalogue entry for gamestop-short-squeeze, lifted verbatim from site/src/lib/articles.ts.
   Paste back into the ARTICLES array to restore. */

  {
    slug: "gamestop-short-squeeze",
    hero: "hero/layered-blue-ridges.jpg",
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
