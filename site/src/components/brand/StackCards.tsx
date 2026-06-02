/* The Python quant stack as soft, uniform cards grouped by purpose (deck §06).
   Cards are uniform and "given room"; the glyph is a neutral monogram standing
   in for the real third-party logos (deck rule: never recolored) which drop in
   later. */

interface Lib {
  name: string;
  mark: string; // short monogram
}

const GROUPS: { label: string; libs: Lib[] }[] = [
  {
    label: "Data & Compute",
    libs: [
      { name: "NumPy", mark: "np" },
      { name: "pandas", mark: "pd" },
      { name: "SciPy", mark: "sp" },
    ],
  },
  {
    label: "Machine Learning",
    libs: [
      { name: "scikit-learn", mark: "skl" },
      { name: "statsmodels", mark: "sm" },
      { name: "PyMC", mark: "pm" },
    ],
  },
  {
    label: "Backtesting",
    libs: [
      { name: "vectorbt", mark: "vbt" },
      { name: "backtrader", mark: "bt" },
      { name: "Zipline", mark: "zp" },
    ],
  },
  {
    label: "Portfolio & Performance",
    libs: [
      { name: "PyPortfolioOpt", mark: "ppo" },
      { name: "cvxpy", mark: "cvx" },
      { name: "QuantLib", mark: "ql" },
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {g.libs.map((lib) => (
              <div
                key={lib.name}
                className="group flex items-center gap-3.5 rounded-sm border border-pearl/10 bg-navy-elevated/50 px-4 py-3.5 transition-colors duration-300 hover:border-pearl/25"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-pearl/15 bg-navy-sunken/60 t-mono text-xs lowercase text-mist transition-colors duration-300 group-hover:text-aqua">
                  {lib.mark}
                </span>
                <span className="truncate text-sm font-medium text-pearl">{lib.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
