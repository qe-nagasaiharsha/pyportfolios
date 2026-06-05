/* The Python quant stack as soft, uniform logo chips (brand deck, slide 12 —
   "The Python Quant Stack"). Logos are taken from the brand guidelines so they
   match exactly; each sits on a white chip, never recoloured, given room.
   Grouped: machine learning, backtesting & pricing, portfolio & performance.
   Logo-only (the marks already carry their names). */

interface Lib {
  name: string; // for alt text only
  slug: string; // → /public/logos/libraries/<slug>.png
}

const GROUPS: { label: string; libs: Lib[] }[] = [
  {
    label: "Machine Learning & Deep Learning",
    libs: [
      { name: "scikit-learn", slug: "scikit-learn" },
      { name: "PyTorch", slug: "pytorch" },
      { name: "TensorFlow", slug: "tensorflow" },
      { name: "Keras", slug: "keras" },
    ],
  },
  {
    label: "Backtesting & Pricing",
    libs: [
      { name: "Zipline", slug: "zipline" },
      { name: "vectorbt", slug: "vectorbt" },
      { name: "QuantLib", slug: "quantlib" },
    ],
  },
  {
    label: "Portfolio & Performance",
    libs: [
      { name: "Riskfolio-Lib", slug: "riskfolio-lib" },
      { name: "Pyfolio", slug: "pyfolio" },
      { name: "Alphalens", slug: "alphalens" },
    ],
  },
];

export function StackCards() {
  return (
    <div className="space-y-10">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <div className="mb-4 flex items-center gap-3">
            <span className="t-mono text-[0.7rem] uppercase tracking-[0.22em] text-mist">{g.label}</span>
            <span className="h-px flex-1 bg-pearl/10" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {g.libs.map((lib) => (
              <div
                key={lib.slug}
                className="flex h-28 items-center justify-center rounded-sm border border-pearl/10 bg-white px-3 transition-transform duration-300 hover:-translate-y-0.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/libraries/${lib.slug}.png`}
                  alt={`${lib.name} logo`}
                  className="max-h-20 w-auto max-w-[94%] object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
