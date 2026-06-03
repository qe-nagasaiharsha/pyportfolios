"use client";

/* "See a lesson" — the single strongest proof on the page: show, don't list.
   Real Python on the left, its actual output on the right, switchable across a
   few representative lessons. Tabs are client-side; the code card reuses the
   article highlighter so the styling is identical to the real lessons. */

import { useState, type CSSProperties, type ReactNode } from "react";
import { CodeBlock } from "@/components/article/prose";

/* ---- tiny on-brand output charts (navy panel, single aqua accent) ---- */

function PayoffChart() {
  return (
    <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label="Call option value rising with the spot price.">
      <line x1="0" y1="120" x2="320" y2="120" stroke="#5c647c" strokeOpacity="0.4" strokeWidth="1" />
      <line x1="160" y1="0" x2="160" y2="130" stroke="#5c647c" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 4" />
      <path d="M10,118 C90,114 140,104 180,80 C220,56 270,30 312,14" fill="none" stroke="#1FFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="312" cy="14" r="3" fill="#1FFFFF" />
      <text x="160" y="142" textAnchor="middle" className="t-mono" fontSize="9" fill="#5c647c">strike</text>
    </svg>
  );
}

function VolBars() {
  return (
    <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label="Out-of-sample volatility: sample covariance versus Ledoit-Wolf shrinkage.">
      <line x1="0" y1="125" x2="320" y2="125" stroke="#5c647c" strokeOpacity="0.4" strokeWidth="1" />
      <rect x="64" y="35" width="64" height="90" fill="#5c647c" fillOpacity="0.55" />
      <rect x="192" y="57" width="64" height="68" fill="#1FFFFF" fillOpacity="0.85" />
      <text x="96" y="142" textAnchor="middle" className="t-mono" fontSize="9" fill="#5c647c">sample</text>
      <text x="224" y="142" textAnchor="middle" className="t-mono" fontSize="9" fill="#1FFFFF">shrinkage</text>
      <text x="96" y="28" textAnchor="middle" className="t-mono" fontSize="9" fill="#98a1b4">14.8%</text>
      <text x="224" y="50" textAnchor="middle" className="t-mono" fontSize="9" fill="#1FFFFF">11.2%</text>
    </svg>
  );
}

function LossChart() {
  return (
    <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label="Simulated loss distribution with the 99% Value-at-Risk marked in the tail.">
      <path d="M8,128 C90,124 120,96 150,58 C166,38 178,34 192,42 C232,66 262,108 312,124 L312,130 L8,130 Z" fill="#1FFFFF" fillOpacity="0.08" stroke="#1FFFFF" strokeOpacity="0.6" strokeWidth="1.6" />
      <line x1="268" y1="20" x2="268" y2="130" stroke="#1FFFFF" strokeWidth="1.4" strokeDasharray="4 4" />
      <text x="262" y="16" textAnchor="end" className="t-mono" fontSize="9" fill="#1FFFFF">99% VaR</text>
    </svg>
  );
}

interface Lesson {
  key: string;
  file: string;
  code: string;
  chart: ReactNode;
  caption: string;
  result: string;
  label: string;
}

const LESSONS: Lesson[] = [
  {
    key: "Option pricing",
    file: "black_scholes.py",
    caption: "Call value vs spot",
    result: "8.92",
    label: "Fair call price",
    chart: <PayoffChart />,
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, T, r, s):
    d1 = (np.log(S/K) + (r + s*s/2)*T) / (s*np.sqrt(T))
    d2 = d1 - s*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

bs_call(100, 100, 1.0, 0.02, 0.20)   # -> 8.92`,
  },
  {
    key: "Portfolio",
    file: "min_variance.py",
    caption: "OOS volatility — shrinkage vs sample",
    result: "11.2%",
    label: "Out-of-sample volatility",
    chart: <VolBars />,
    code: `import numpy as np
from sklearn.covariance import LedoitWolf

cov = LedoitWolf().fit(returns).covariance_   # shrink the noise
w = np.linalg.pinv(cov) @ np.ones(len(cov))
w = w / w.sum()                               # min-variance weights

(returns_oos @ w).std() * np.sqrt(252)        # -> 0.112`,
  },
  {
    key: "Tail risk",
    file: "value_at_risk.py",
    caption: "Simulated 1-day loss distribution",
    result: "3.63%",
    label: "99% · 1-day VaR",
    chart: <LossChart />,
    code: `import numpy as np

pnl = simulate(n=100_000)         # EVT margins + t-copula
loss = -pnl

var = np.quantile(loss, 0.99)
cvar = loss[loss >= var].mean()
f"VaR {var:.2%}  CVaR {cvar:.2%}"  # -> VaR 3.63%  CVaR 4.88%`,
  },
];

export function LessonDemo() {
  const [active, setActive] = useState(0);
  const L = LESSONS[active];

  return (
    <section className="border-b border-pearl/10 bg-navy-elevated/40">
      <div className="mx-auto max-w-6xl px-6 py-28 md:py-32">
        <div data-reveal>
          <div className="mb-10 flex items-center gap-4 border-b border-pearl/10 pb-4">
            <span className="h-px w-8 bg-aqua/50" aria-hidden="true" />
            <h2 className="t-mono text-sm uppercase tracking-[0.24em] text-mist">See a lesson</h2>
          </div>
          <h3 className="t-h1 max-w-xl text-pearl">Read the argument. Run the code. Read the result.</h3>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-mist">
            Every case study is a short, honest pipeline from idea to output — this is exactly what one looks like.
          </p>
        </div>

        {/* tabs */}
        <div data-reveal style={{ "--reveal-delay": "120ms" } as CSSProperties} className="mt-10">
          <div role="tablist" aria-label="Example lessons" className="flex flex-wrap gap-2">
            {LESSONS.map((l, i) => (
              <button
                key={l.key}
                role="tab"
                aria-selected={active === i}
                onClick={() => setActive(i)}
                className={`rounded-full px-4 py-1.5 t-mono text-[0.7rem] uppercase tracking-[0.14em] transition-colors ${
                  active === i ? "bg-aqua text-navy" : "border border-pearl/15 text-mist hover:border-pearl/30 hover:text-pearl"
                }`}
              >
                {l.key}
              </button>
            ))}
          </div>

          {/* code | output */}
          <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-[1.15fr_minmax(0,1fr)]">
            <div className="min-w-0">
              <CodeBlock key={L.file} code={L.code} file={L.file} />
            </div>

            <figure className="corner-ticks flex flex-col rounded-sm border border-pearl/10 bg-navy-sunken/60 p-7">
              <span className="t-mono text-[0.62rem] uppercase tracking-[0.18em] text-steel">{L.caption}</span>
              <div className="mt-4 flex-1">{L.chart}</div>
              <figcaption className="mt-5 flex items-baseline justify-between gap-4 border-t border-pearl/10 pt-4">
                <span className="t-mono text-[0.64rem] uppercase tracking-[0.16em] text-mist">{L.label}</span>
                <span className="tnum font-serif text-3xl text-aqua" style={{ fontWeight: 500 }}>{L.result}</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
