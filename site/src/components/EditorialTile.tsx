/* ============================================================================
   v11 — the classic editorial layout, on the brand's PRIMARY dark canvas.
   pyportfolios as a distinguished research house's journal: Deep Navy canvas,
   Lora serif leading, crest masthead, dot-leader contents, engraved plates,
   aqua as the single charged accent. Real content only — no design-system or
   edition/version meta. Pure Server Component; only the top toggle is client.
   ========================================================================== */

import { Crest } from "@/components/brand/Crest";
import { WorldMap, EXCHANGES_BY_REGION } from "@/components/brand/WorldMap";
import { VersionSwitcher } from "@/components/VersionSwitcher";

const VALUES = ["Scientific", "Practical", "Driven"] as const;

const PILLARS = [
  { no: "01", title: "Coding", body: "Structured case studies and ready-to-run snippets — investment-banking style — across the modern Python quant stack." },
  { no: "02", title: "Trading", body: "Algorithmic trading, portfolio optimization and risk management in a simple, empirical, practical format." },
  { no: "03", title: "Markets", body: "Academic-level models meet state-of-the-art frameworks, using data from the world's major exchanges." },
];

const CONTENTS = [
  { ref: "I", title: "Our Focus — Coding, Trading, Markets" },
  { ref: "II", title: "Markets — Asset Classes & Instruments" },
  { ref: "III", title: "Libraries — The Python Quant Stack" },
  { ref: "IV", title: "Models — Pricing, Risk & Signals" },
  { ref: "V", title: "Geographies — The Top Fifteen Economies" },
  { ref: "VI", title: "Literature — Books & Landmark Papers" },
  { ref: "VII", title: "Course — Quant Finance Basics" },
];

const APPARATUS = [
  { label: "Data & Compute", items: ["NumPy", "pandas", "SciPy"] },
  { label: "Machine Learning", items: ["scikit-learn", "statsmodels", "PyMC"] },
  { label: "Backtesting", items: ["vectorbt", "backtrader", "Zipline"] },
  { label: "Portfolio & Risk", items: ["PyPortfolioOpt", "cvxpy", "QuantLib"] },
];

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="t-mono text-[0.7rem] uppercase tracking-[0.28em] text-aqua/80">{children}</span>
  );
}

/* Engraved covariance plate (dark) — the single insight in aqua */
function FigurePlate() {
  const gridY = [40, 95, 150];
  const gridX = [150, 300, 450];
  return (
    <figure className="plate-frame bg-navy-sunken/60 p-7">
      <svg viewBox="0 0 600 210" className="w-full" role="img"
        aria-label="Out-of-sample volatility: sample covariance versus Ledoit-Wolf shrinkage.">
        {gridY.map((y) => <line key={`y${y}`} x1="0" y1={y} x2="600" y2={y} stroke="#EEEEEE" strokeOpacity="0.07" strokeWidth="1" />)}
        {gridX.map((x) => <line key={`x${x}`} x1={x} y1="0" x2={x} y2="185" stroke="#EEEEEE" strokeOpacity="0.07" strokeWidth="1" />)}
        <polyline points="0,60 60,86 120,48 180,110 240,68 300,140 360,86 420,160 480,110 540,182 600,140"
          fill="none" stroke="#5c647c" strokeWidth="1.4" strokeLinejoin="round" />
        <path className="draw-line" d="M0,100 C90,98 130,108 200,116 C280,125 320,138 400,144 C470,149 520,158 600,164"
          fill="none" stroke="#1FFFFF" strokeWidth="2.25" strokeLinecap="round" />
        <circle cx="600" cy="164" r="3.5" fill="#1FFFFF" />
      </svg>
      <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-pearl/12 pt-3">
        <span className="t-mono text-[0.7rem] uppercase tracking-[0.2em] text-steel">
          Sample vs shrinkage covariance
        </span>
        <span className="flex items-center gap-4 t-mono text-[0.7rem]">
          <span className="flex items-center gap-1.5 text-mist"><span className="inline-block h-px w-4 bg-steel" /> Sample</span>
          <span className="flex items-center gap-1.5 text-aqua"><span className="inline-block h-px w-4 bg-aqua" /> Shrinkage</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function EditorialTile() {
  return (
    <div className="editorial-dark min-h-screen bg-navy text-pearl">
      <VersionSwitcher />

      {/* ===================================================== MASTHEAD === */}
      <header className="mx-auto max-w-4xl px-6 pt-16">
        <div className="flex items-center justify-between t-mono text-[0.65rem] uppercase tracking-[0.24em] text-steel">
          <span>pyportfolios.com</span>
          <span className="hidden sm:block">Coding · Trading · Markets</span>
          <span>Albuquerque, NM</span>
        </div>

        <div className="mt-10 flex flex-col items-center text-center">
          <Crest size={62} tone="light" />
          <h1 className="mt-6 font-serif text-5xl tracking-tight text-pearl md:text-7xl" style={{ fontWeight: 600 }}>
            pyportfolios
          </h1>
          <p className="mt-4 font-serif text-xl italic text-mist md:text-2xl">
            Where finance theory, coding &amp; markets converge.
          </p>
        </div>

        <div className="rule-double mt-10" />
        <div className="flex items-center justify-center gap-6 py-3 t-mono text-[0.62rem] uppercase tracking-[0.3em] text-steel">
          {VALUES.map((v, i) => (
            <span key={v} className="flex items-center gap-6">
              {i > 0 ? <span className="text-aqua" aria-hidden="true">◆</span> : null}
              <span>{v}</span>
            </span>
          ))}
        </div>
        <div className="rule-double" />
      </header>

      <main>
        {/* ====================================================== LEDE ==== */}
        <section className="mx-auto max-w-3xl px-6 py-20">
          <Kicker>Abstract</Kicker>
          <p className="dropcap-xl onum mt-6 font-serif text-xl leading-[1.7] text-pearl/90">
            The platform for the sophisticated coder. pyportfolios bridges advanced quantitative
            finance and practical Python — academic-level models, ready-to-run code, and
            state-of-the-art frameworks, applied to real data from the world&apos;s major exchanges.
            Technical rigor, real-world application, and visual clarity, in equal measure.
          </p>
          <p className="mt-8 t-mono text-xs uppercase tracking-[0.2em] text-steel">
            An educational platform — Albuquerque, New Mexico
          </p>
        </section>

        {/* ================================================== CONTENTS ==== */}
        <section className="border-y border-pearl/10 bg-navy-elevated/40">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <Kicker>Contents</Kicker>
            <ul className="mt-8 space-y-4">
              {CONTENTS.map((c) => (
                <li key={c.ref} className="leader">
                  <span className="font-serif text-base italic text-mist" style={{ width: "2.5rem" }}>{c.ref}.</span>
                  <span className="font-serif text-lg text-pearl">{c.title}</span>
                  <span className="leader-fill" aria-hidden="true" />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* =================================================== PILLARS ==== */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <Kicker>Our Focus</Kicker>
          <div className="mt-10 grid gap-px overflow-hidden border border-pearl/10 bg-pearl/10 md:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.no} className="bg-navy px-7 py-9">
                <span className="font-serif text-4xl text-pearl/20" style={{ fontWeight: 500 }}>{p.no}</span>
                <h3 className="mt-4 font-serif text-2xl text-pearl">{p.title}</h3>
                <span className="mt-4 block h-px w-10 bg-aqua" />
                <p className="mt-4 leading-relaxed text-mist">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ==================================================== FIGURE ==== */}
        <section className="border-y border-pearl/10 bg-navy-elevated/40">
          <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
            <div>
              <Kicker>Models</Kicker>
              <h2 className="mt-6 font-serif text-3xl leading-tight text-pearl md:text-4xl">
                Information-rich, never overwhelming.
              </h2>
              <p className="mt-5 max-w-md leading-[1.7] text-mist">
                From pricing to portfolio construction to risk — every result reproducible,
                stress-tested on real data, and presented with the clarity of a working paper.
              </p>
            </div>
            <FigurePlate />
          </div>
        </section>

        {/* ================================================ APPARATUS ===== */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <Kicker>The Python Quant Stack</Kicker>
          <div className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {APPARATUS.map((g) => (
              <div key={g.label} className="leader items-baseline">
                <span className="t-mono text-[0.7rem] uppercase tracking-[0.2em] text-aqua/80" style={{ minWidth: "9.5rem" }}>{g.label}</span>
                <span className="leader-fill" aria-hidden="true" />
                <span className="font-serif text-lg text-pearl">{g.items.join(" · ")}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ===================================================== ATLAS ==== */}
        <section className="border-y border-pearl/10 bg-navy-elevated/40">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <Kicker>Geographies</Kicker>
                <h2 className="mt-6 font-serif text-3xl leading-tight text-pearl md:text-4xl">
                  The world&apos;s major venues, in one frame.
                </h2>
              </div>
              <p className="t-mono text-[0.7rem] uppercase tracking-[0.2em] text-steel">
                Top 15 economies
              </p>
            </div>
            <div className="mt-10"><WorldMap tone="dark" /></div>
            <div className="mt-10 grid gap-6 border-t border-pearl/10 pt-8 sm:grid-cols-3">
              {EXCHANGES_BY_REGION.map((r) => (
                <div key={r.region}>
                  <p className="t-mono text-[0.7rem] uppercase tracking-[0.22em] text-aqua/80">{r.region}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                    {r.venues.map((v) => <span key={v} className="t-mono text-sm text-mist">{v}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================ PULL-QUOTE ==== */}
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="font-serif text-3xl italic leading-snug text-pearl md:text-4xl">
            Get up to speed. Cancel the noise.
            <br className="hidden sm:block" /> Find your edge.
          </p>
          <div className="mx-auto mt-10 h-px w-16 bg-aqua" />
          <p className="mt-10 font-serif text-lg italic text-mist">
            &ldquo;Diligam te, Domine, fortitudo mea.&rdquo;
          </p>
          <p className="mt-2 t-mono text-[0.65rem] uppercase tracking-[0.24em] text-steel">
            I love you, Lord, my strength — Psalm 17:2
          </p>
        </section>
      </main>

      {/* =================================================== COLOPHON ==== */}
      <footer className="border-t border-pearl/10 bg-navy-sunken">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <div className="flex flex-col items-center gap-6 text-center">
            <Crest size={34} tone="light" />
            <p className="max-w-xl font-serif text-lg italic leading-snug text-mist">
              Where finance theory, coding &amp; markets converge into your path of growth.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 t-mono text-[0.65rem] uppercase tracking-[0.2em] text-steel">
              <span>pyportfolios@protonmail.com</span><span className="text-aqua">◆</span>
              <span>Albuquerque, New Mexico</span><span className="text-aqua">◆</span>
              <span className="text-aqua">pyportfolios.com</span>
            </div>
          </div>
          <div className="rule-double mt-12" />
          <div className="flex flex-col justify-between gap-2 pt-4 t-mono text-[0.62rem] uppercase tracking-[0.2em] text-steel sm:flex-row">
            <span>© 2026 pyportfolios. All rights reserved.</span>
            <span className="text-aqua">pyportfolios.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
