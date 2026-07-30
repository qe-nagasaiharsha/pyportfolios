/* Concepts & Models — the applied-science capability grid (six cards, each an
   icon + title + a dash-listed set of models/techniques). Replaces the old
   two-chart "Concepts & models, applied." panel (archived in
   components/archive/ConceptsModelsLegacy.tsx). */

import type { CSSProperties, ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const CARDS: { title: string; icon: ReactNode; items: string[] }[] = [
  {
    title: "Foundations & Data Layer",
    icon: <Icon><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></Icon>,
    items: [
      "Bond & Derivatives Pricing",
      "Black-Scholes-Merton & Heston Models",
      "SABR & Dupire Local Volatility Surfaces",
      "Time Series / GARCH Models",
      "Monte Carlo Simulations",
      "Credit Derivatives & CDO Tranching",
    ],
  },
  {
    title: "Portfolio Construction Engine",
    icon: <Icon><path d="M21.2 15.9A10 10 0 1 1 8 2.8" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></Icon>,
    items: [
      "Modern Portfolio Theory",
      "Black-Litterman Model",
      "Risk Parity Optimization",
      "Mean-CVaR Optimization",
      "Ledoit-Wolf Shrinkage Estimator",
      "Hierarchical Risk Parity (HRP)",
    ],
  },
  {
    title: "Machine Learning & LLM/AI Models",
    icon: <Icon><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" /></Icon>,
    items: [
      "Supervised Learning Strategies",
      "Reinforcement Learning",
      "Deep Learning (LSTM & Transformers)",
      "NLP & Sentiment Analysis (FinBERT)",
      "Alternative Data Signal Extraction",
      "Generative AI Research Copilots",
    ],
  },
  {
    title: "Alpha & Signal Generation",
    icon: <Icon><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></Icon>,
    items: [
      "Kalman Filter & State-Space Models",
      "Mean-Reversion Models",
      "Trend-Following Strategies",
      "Statistical Arbitrage",
      "Factor IC Analysis",
      "Algorithmic Execution (Almgren-Chriss)",
    ],
  },
  {
    title: "Pre-Trade & Real Time Risk Engine",
    icon: <Icon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>,
    items: [
      "Value-at-Risk (VaR)",
      "Conditional Value-at-Risk (CVaR)",
      "Principal Component Analysis",
      "Copula Functions & Tail Dependence",
      "Counterparty Risk (CVA / xVA)",
      "DeFi & On-Chain Risk (AMM, Impermanent Loss)",
    ],
  },
  {
    title: "Analytics & Feedback Loop",
    icon: <Icon><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Icon>,
    items: [
      "Backtesting",
      "Walk-Forward Analysis",
      "Robustness Tests",
      "Performance Tearsheets",
      "Performance Metrics",
      "Regime Detection & Strategy Switching",
    ],
  },
];

export function CapabilityCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((c, i) => (
        <div
          key={c.title}
          data-reveal
          style={{ "--reveal-delay": `${i * 70}ms` } as CSSProperties}
          className="rounded-lg border border-pearl/10 bg-navy-sunken/40 p-7 transition-colors duration-300 hover:border-aqua/30"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-aqua/40 text-aqua">
            {c.icon}
          </span>
          <h4 className="mt-6 font-sans text-lg leading-snug text-pearl" style={{ fontWeight: 700 }}>{c.title}</h4>
          <ul className="mt-4 space-y-2">
            {c.items.map((it) => (
              <li key={it} className="flex gap-2 t-mono text-[0.72rem] leading-relaxed text-mist">
                <span className="shrink-0 text-aqua/70">—</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
