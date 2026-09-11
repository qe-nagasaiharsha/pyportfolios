import type { Metadata } from "next";
import Link from "next/link";
import { ArticleNav } from "@/components/article/ArticleNav";
import { TOPIC_CARDS } from "@/lib/topics";

export const metadata: Metadata = {
  title: "Technical requirements — running the notebooks — pyportfolios",
  description:
    "Python version, libraries per tutorial, and Windows / Linux setup so every companion notebook runs identically on any machine.",
};

/* The environment every notebook is authored and QA'd against. */
const CORE = [
  ["Python", "3.11+", "3.10 works; 3.11 is what we QA against"],
  ["NumPy", "≥ 1.26", "array engine used by everything below"],
  ["Pandas", "≥ 2.1", "time-series handling, CSV/parquet IO"],
  ["SciPy", "≥ 1.11", "optimisers, distributions, stats tests"],
  ["Matplotlib", "≥ 3.8", "every notebook figure"],
  ["yfinance", "≥ 0.2", "market data download (Yahoo Finance)"],
  ["statsmodels", "≥ 0.14", "regressions & econometrics"],
  ["Jupyter", "lab or notebook", "or VS Code's built-in notebook UI"],
] as const;

const SPECIALIST = [
  ["PyPortfolioOpt", "1.6+", "MVO, Black–Litterman (T05, T06)"],
  ["Riskfolio-Lib", "7+", "risk-parity & CVaR validation (T07, T10)"],
  ["Polars", "1.x", "the modern DataFrame example in T09"],
  ["DuckDB", "1.x", "the SQL VaR example in T09"],
  ["vectorbt", "1.x", "backtest engine (T13)"],
  ["seaborn", "0.13+", "statistical plots (T11)"],
] as const;

export default function RequirementsPage() {
  const tutorials = TOPIC_CARDS.filter((t) => t.article);

  return (
    <div className="min-h-dvh bg-navy text-pearl">
      <ArticleNav />

      <main>
        <section className="relative overflow-hidden border-b border-pearl/10">
          <div className="grid-paper absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 lg:px-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-pearl/25" aria-hidden="true" />
              <p className="t-eyebrow text-pearl">Notebooks · Technical requirements</p>
            </div>
            <h1 className="t-display mt-8 max-w-3xl text-pearl">
              Run every notebook, anywhere<span className="text-aqua">.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-mist">
              Every article ships a runnable companion notebook. They are written against one
              pinned environment, download their own data, and seed every random draw — so the
              numbers you get match the numbers in the article, on Windows, Linux, or macOS.
            </p>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
            {/* quick setup */}
            <div className="mb-14">
              <h2 className="font-serif text-xl text-pearl md:text-2xl">01 · Setup in two commands</h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-mist">
                Create an isolated environment, then install the full stack. The same commands work
                in PowerShell (Windows) and any POSIX shell (Linux / macOS) — only the activation
                line differs.
              </p>
              <div className="code-card mt-6 max-w-3xl">
                <div className="flex items-center justify-between border-b border-pearl/10 px-4 py-2">
                  <span className="t-mono text-[0.66rem] uppercase tracking-[0.18em] text-steel">terminal</span>
                </div>
                <pre className="overflow-x-auto px-4 py-4 text-[0.82rem] leading-[1.8]"><code className="t-mono text-pearl">{`python -m venv .venv
# Windows:            .venv\\Scripts\\activate
# Linux / macOS:      source .venv/bin/activate

pip install numpy pandas scipy matplotlib yfinance statsmodels \\
    PyPortfolioOpt Riskfolio-Lib polars duckdb vectorbt seaborn jupyterlab`}</code></pre>
              </div>
            </div>

            {/* core environment */}
            <div className="mb-14">
              <h2 className="font-serif text-xl text-pearl md:text-2xl">02 · The core environment</h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-mist">Needed by every notebook.</p>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full max-w-3xl border-collapse text-left text-[0.92rem]">
                  <thead>
                    <tr className="border-b border-pearl/20">
                      <th className="pb-2 t-mono text-[0.64rem] uppercase tracking-[0.14em] text-steel">Package</th>
                      <th className="pb-2 t-mono text-[0.64rem] uppercase tracking-[0.14em] text-steel">Version</th>
                      <th className="pb-2 t-mono text-[0.64rem] uppercase tracking-[0.14em] text-steel">Used for</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CORE.map(([p, v, u]) => (
                      <tr key={p} className="border-b border-pearl/10">
                        <td className="py-2.5 t-mono text-[0.82rem] text-aqua">{p}</td>
                        <td className="py-2.5 t-mono text-[0.82rem] text-mist">{v}</td>
                        <td className="py-2.5 text-mist/90">{u}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* specialist libs */}
            <div className="mb-14">
              <h2 className="font-serif text-xl text-pearl md:text-2xl">03 · Specialist libraries</h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-mist">
                Only needed for the tutorials that use them — each article's header lists its exact stack.
              </p>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full max-w-3xl border-collapse text-left text-[0.92rem]">
                  <thead>
                    <tr className="border-b border-pearl/20">
                      <th className="pb-2 t-mono text-[0.64rem] uppercase tracking-[0.14em] text-steel">Package</th>
                      <th className="pb-2 t-mono text-[0.64rem] uppercase tracking-[0.14em] text-steel">Version</th>
                      <th className="pb-2 t-mono text-[0.64rem] uppercase tracking-[0.14em] text-steel">Used in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SPECIALIST.map(([p, v, u]) => (
                      <tr key={p} className="border-b border-pearl/10">
                        <td className="py-2.5 t-mono text-[0.82rem] text-aqua">{p}</td>
                        <td className="py-2.5 t-mono text-[0.82rem] text-mist">{v}</td>
                        <td className="py-2.5 text-mist/90">{u}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* per-tutorial matrix */}
            <div className="mb-14">
              <h2 className="font-serif text-xl text-pearl md:text-2xl">04 · Per-tutorial stack</h2>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full border-collapse text-left text-[0.9rem]">
                  <thead>
                    <tr className="border-b border-pearl/20">
                      <th className="pb-2 t-mono text-[0.64rem] uppercase tracking-[0.14em] text-steel">#</th>
                      <th className="pb-2 t-mono text-[0.64rem] uppercase tracking-[0.14em] text-steel">Tutorial</th>
                      <th className="pb-2 t-mono text-[0.64rem] uppercase tracking-[0.14em] text-steel">Libraries</th>
                      <th className="pb-2 t-mono text-[0.64rem] uppercase tracking-[0.14em] text-steel">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tutorials.map((t) => (
                      <tr key={t.no} className="border-b border-pearl/10">
                        <td className="py-2.5 t-mono text-[0.78rem] text-steel">{String(t.no).padStart(2, "0")}</td>
                        <td className="py-2.5">
                          <Link href={`/research/${t.article}`} className="text-pearl transition-colors hover:text-aqua">
                            {t.title}
                          </Link>
                        </td>
                        <td className="py-2.5 t-mono text-[0.78rem] text-aqua/90">{t.libraries.join(" · ")}</td>
                        <td className="py-2.5 text-mist/90">{t.assets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* reproducibility notes */}
            <div>
              <h2 className="font-serif text-xl text-pearl md:text-2xl">05 · Reproducibility notes</h2>
              <ul className="mt-5 max-w-3xl space-y-3 leading-relaxed text-mist">
                <li className="flex gap-2.5">
                  <span className="mt-2 inline-block h-[0.3em] w-[0.3em] shrink-0 rounded-full bg-aqua/70" aria-hidden="true" />
                  <span><strong className="text-pearl">Data downloads itself.</strong> Every notebook pulls its own data from Yahoo Finance via <span className="t-mono text-[0.85em] text-aqua">yfinance</span> — no files to place, no paths to edit. An internet connection is required on first run.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 inline-block h-[0.3em] w-[0.3em] shrink-0 rounded-full bg-aqua/70" aria-hidden="true" />
                  <span><strong className="text-pearl">Randomness is seeded.</strong> Simulations use <span className="t-mono text-[0.85em] text-aqua">np.random.default_rng(42)</span>, so Monte-Carlo numbers match the article to the digit on any OS.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 inline-block h-[0.3em] w-[0.3em] shrink-0 rounded-full bg-aqua/70" aria-hidden="true" />
                  <span><strong className="text-pearl">Data revisions happen.</strong> Yahoo occasionally restates adjusted closes (dividends, splits). If a third decimal differs from the article, that is the data vendor, not your environment.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 inline-block h-[0.3em] w-[0.3em] shrink-0 rounded-full bg-aqua/70" aria-hidden="true" />
                  <span><strong className="text-pearl">Windows note.</strong> <span className="t-mono text-[0.85em] text-aqua">vectorbt</span> compiles via numba on first import — the first run takes a minute; subsequent runs are instant.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 inline-block h-[0.3em] w-[0.3em] shrink-0 rounded-full bg-aqua/70" aria-hidden="true" />
                  <span><strong className="text-pearl">No paid data anywhere.</strong> Every tutorial runs end-to-end on free data. Nothing to license, nothing to subscribe to.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-navy-sunken">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-6 py-12 t-mono text-[0.66rem] uppercase tracking-[0.16em] text-steel sm:flex-row lg:px-8">
          <Link href="/" className="transition-colors hover:text-aqua">← pyportfolios.com</Link>
          <span>Where finance theory, coding &amp; markets converge · <span className="text-aqua">pyportfolios.com</span></span>
        </div>
      </footer>
    </div>
  );
}
