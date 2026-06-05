/* The Python quant stack as soft, uniform cards grouped by purpose (brand deck,
   slide 12 — "The Python Quant Stack"). Logos are taken from the brand
   guidelines so they match exactly; each sits on a white chip, never recoloured,
   always given room. Grouped: machine learning, backtesting & pricing, portfolio
   & performance. */

interface Lib {
  name: string;
  slug: string; // → /public/logos/libraries/<slug>.png
  note: string;
}

const GROUPS: { label: string; libs: Lib[] }[] = [
  {
    label: "Machine Learning & Deep Learning",
    libs: [
      { name: "scikit-learn", slug: "scikit-learn", note: "Classical ML" },
      { name: "PyTorch", slug: "pytorch", note: "Deep learning" },
      { name: "TensorFlow", slug: "tensorflow", note: "Neural networks" },
      { name: "Keras", slug: "keras", note: "High-level DL API" },
    ],
  },
  {
    label: "Backtesting & Pricing",
    libs: [
      { name: "Zipline", slug: "zipline", note: "Event-driven backtests" },
      { name: "vectorbt", slug: "vectorbt", note: "Vectorized backtests" },
      { name: "QuantLib", slug: "quantlib", note: "Derivatives pricing" },
    ],
  },
  {
    label: "Portfolio & Performance",
    libs: [
      { name: "Riskfolio-Lib", slug: "riskfolio-lib", note: "Portfolio optimization" },
      { name: "Pyfolio", slug: "pyfolio", note: "Tear sheets & metrics" },
      { name: "Alphalens", slug: "alphalens", note: "Factor analysis" },
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
                className="group flex flex-col rounded-sm border border-pearl/10 bg-navy-elevated/50 p-3 transition-colors duration-300 hover:border-pearl/25"
              >
                <span className="flex h-24 items-center justify-center rounded-sm bg-white px-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/logos/libraries/${lib.slug}.png`}
                    alt={`${lib.name} logo`}
                    className="max-h-14 w-auto max-w-[90%] object-contain"
                    loading="lazy"
                  />
                </span>
                <span className="mt-3 px-1 text-sm font-semibold text-pearl">{lib.name}</span>
                <span className="px-1 t-mono text-[0.62rem] uppercase tracking-[0.12em] text-steel">{lib.note}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
