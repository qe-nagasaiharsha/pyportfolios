/* The Python quant stack as soft, uniform logo chips (brand deck, slide 12 —
   "The Python Quant Stack"). Logos are taken from the brand guidelines so they
   match exactly; each sits on a white chip, never recoloured, given room.
   Grouped: machine learning, backtesting & pricing, portfolio & performance.
   Logo-only (the marks already carry their names). */

interface Lib {
  name: string; // for alt text only
  slug: string; // → /public/logos/libraries/<slug>.png
  imgClass?: string; // optional per-logo size override (default max-h-9 max-w-[88%])
}

const GROUPS: { label: string; blurb: string; libs: Lib[] }[] = [
  {
    label: "Portfolio & Performance",
    blurb: "Seamless access to advanced allocation, risk decomposition and performance attribution tools",
    libs: [
      { name: "PyPortfolioOpt", slug: "pyportfolioopt", imgClass: "max-h-[3.25rem] max-w-[96%]" },
      { name: "Riskfolio-Lib", slug: "riskfolio-lib" },
    ],
  },
  {
    label: "Backtesting & Pricing",
    blurb: "Battle-tested simulation engines for realistic strategy validation and derivatives pricing",
    libs: [
      { name: "Zipline", slug: "zipline" },
      { name: "Alphalens", slug: "alphalens" },
      { name: "Pyfolio", slug: "pyfolio" },
      { name: "vectorbt", slug: "vectorbt" },
      { name: "QuantLib", slug: "quantlib" },
    ],
  },
  {
    label: "Machine Learning & Deep Learning",
    blurb: "Powered by state-of-the-art neural networks for predictive signal generation and forecasting",
    libs: [
      { name: "scikit-learn", slug: "scikit-learn" },
      { name: "PyTorch", slug: "pytorch" },
      { name: "TensorFlow", slug: "tensorflow" },
      { name: "Keras", slug: "keras" },
      { name: "XGBoost", slug: "xgboost" },
    ],
  },
];

/* Supporting libraries — shown as a quiet footnote, grouped by skill level,
   each with its primary use. */
const ADDITIONAL_TIERS: { level: string; libs: { name: string; use: string }[] }[] = [
  {
    level: "Basic",
    libs: [
      { name: "NumPy", use: "Numerical arrays, linear algebra, vectorized computation" },
      { name: "Pandas", use: "Data manipulation and analysis" },
      { name: "Matplotlib", use: "Plotting and visualization" },
      { name: "SciPy", use: "Scientific computing, optimization, statistics, interpolation" },
    ],
  },
  {
    level: "Intermediate",
    libs: [
      { name: "Statsmodels", use: "Statistical modeling, econometrics, hypothesis testing" },
      { name: "Seaborn", use: "Statistical visualization built on Matplotlib" },
    ],
  },
  {
    level: "Advanced",
    libs: [
      { name: "Arch", use: "ARCH/GARCH volatility models for financial time series" },
      { name: "Transformers (HuggingFace)", use: "Large language models (LLMs), NLP, generative AI" },
      { name: "SHAP", use: "Explainable AI (interpreting machine-learning models)" },
    ],
  },
];

export function StackCards() {
  return (
    <div className="space-y-10">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <span className="t-mono text-[0.7rem] uppercase tracking-[0.22em] text-steel">{g.label}</span>
              <span className="h-px flex-1 bg-pearl/10" />
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist">{g.blurb}</p>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
            {g.libs.map((lib) => (
              <div
                key={lib.slug}
                className="flex h-16 items-center justify-center rounded-sm border border-pearl/10 bg-white px-3 transition-transform duration-300 hover:-translate-y-0.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/libraries/${lib.slug}.png`}
                  alt={`${lib.name} logo`}
                  className={`${lib.imgClass ?? "max-h-9 max-w-[88%]"} w-auto cursor-zoom-in object-contain`}
                  loading="lazy"
                  data-zoom
                  role="button"
                  tabIndex={0}
                  aria-label={`Enlarge ${lib.name} logo`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* footnote — supporting libraries with their uses, grouped by skill level */}
      <div className="border-t border-pearl/10 pt-6">
        <p className="text-sm font-semibold text-mist">Additional libraries used on the platform:</p>
        <div className="mt-4 space-y-5">
          {ADDITIONAL_TIERS.map((t) => (
            <div key={t.level}>
              <p className="t-mono text-[0.62rem] uppercase tracking-[0.16em] text-aqua/70">{t.level}</p>
              <ul className="mt-2 space-y-1">
                {t.libs.map((l) => (
                  <li key={l.name} className="text-sm leading-relaxed text-steel">
                    <span className="font-medium text-mist">{l.name}</span> — {l.use}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
