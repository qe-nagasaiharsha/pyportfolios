/* The Python quant stack as soft, uniform cards grouped by purpose (deck §06).
   DROP-IN LOGOS: each card shows the real third-party logo as soon as its SVG is
   present at /public/logos/libraries/<slug>.svg — rendered as-is on a light chip
   (deck rule: "never recolored, always given room"). Until the file drops in, a
   neutral monogram stands in. Detection happens at build time. */

import fs from "node:fs";
import path from "node:path";

interface Lib {
  name: string;
  slug: string; // → /public/logos/libraries/<slug>.svg
  mark: string; // monogram fallback
}

const GROUPS: { label: string; libs: Lib[] }[] = [
  {
    label: "Data & Compute",
    libs: [
      { name: "NumPy", slug: "numpy", mark: "np" },
      { name: "pandas", slug: "pandas", mark: "pd" },
      { name: "SciPy", slug: "scipy", mark: "sp" },
    ],
  },
  {
    label: "Machine Learning",
    libs: [
      { name: "scikit-learn", slug: "scikit-learn", mark: "skl" },
      { name: "statsmodels", slug: "statsmodels", mark: "sm" },
      { name: "PyMC", slug: "pymc", mark: "pm" },
    ],
  },
  {
    label: "Backtesting",
    libs: [
      { name: "vectorbt", slug: "vectorbt", mark: "vbt" },
      { name: "backtrader", slug: "backtrader", mark: "bt" },
      { name: "Zipline", slug: "zipline", mark: "zp" },
    ],
  },
  {
    label: "Portfolio & Performance",
    libs: [
      { name: "PyPortfolioOpt", slug: "pyportfolioopt", mark: "ppo" },
      { name: "cvxpy", slug: "cvxpy", mark: "cvx" },
      { name: "QuantLib", slug: "quantlib", mark: "ql" },
    ],
  },
];

/* Which logos have an SVG dropped in yet — resolved once, at build time. */
const LOGO_DIR = path.join(process.cwd(), "public", "logos", "libraries");
function hasLogo(slug: string): boolean {
  try {
    return fs.existsSync(path.join(LOGO_DIR, `${slug}.svg`));
  } catch {
    return false;
  }
}

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
                {hasLogo(lib.slug) ? (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-pearl p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/logos/libraries/${lib.slug}.svg`}
                      alt={`${lib.name} logo`}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </span>
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-pearl/15 bg-navy-sunken/60 t-mono text-xs lowercase text-mist transition-colors duration-300 group-hover:text-aqua">
                    {lib.mark}
                  </span>
                )}
                <span className="truncate text-sm font-medium text-pearl">{lib.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
