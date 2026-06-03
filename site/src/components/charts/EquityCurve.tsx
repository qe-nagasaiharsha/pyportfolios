/* Strategy equity curve — area + line, drawn deterministically (no Math.random,
   so SSR and client agree). The line draws itself once its [data-reveal] parent
   scrolls into view (.draw-path, globals.css); the area fades in. */

import type { CSSProperties } from "react";

const LINE =
  "0,82 21,79 43,73 64,76 85,67 107,61 128,64 149,54 171,47 192,50 213,40 235,33 256,37 277,26 299,19 320,13";

export function EquityCurve({ className = "h-20 w-full" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 90"
      className={className}
      role="img"
      aria-label="Strategy equity curve, net of costs, 2009 to 2025 — a rising line with two drawdowns."
    >
      <defs>
        <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1FFFFF" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1FFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon className="fade-in" points={`0,90 ${LINE} 320,90`} fill="url(#eqFill)" />
      <polyline
        className="draw-path"
        style={{ "--len": "520" } as CSSProperties}
        points={LINE}
        fill="none"
        stroke="#1FFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle className="fade-in" cx="320" cy="13" r="3" fill="#1FFFFF" />
    </svg>
  );
}
