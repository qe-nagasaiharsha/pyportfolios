/* Catalogue entry for kelly-criterion-position-sizing, lifted verbatim from site/src/lib/articles.ts.
   Paste back into the ARTICLES array to restore. */

  {
    slug: "kelly-criterion-position-sizing",
    hero: "hero/sunlit-peaks.jpg",
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
