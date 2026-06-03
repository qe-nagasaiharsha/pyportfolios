/* Daily-returns distribution with the loss tail (VaR region) shaded aqua and a
   dashed VaR threshold line. Bars grow from the baseline once the [data-reveal]
   parent is in view (.grow-bar, globals.css), staggered left→right. Deterministic. */

import type { CSSProperties } from "react";

const HEIGHTS = [
  0.05, 0.08, 0.12, 0.18, 0.27, 0.38, 0.5, 0.63, 0.76, 0.88, 0.96, 1.0, 0.95, 0.85, 0.72, 0.58, 0.45, 0.33,
  0.23, 0.15, 0.1, 0.06, 0.04,
];
const TAIL = 4; // leftmost bars = the VaR loss tail
const BASE = 96;
const MAXH = 80;
const SLOT = 320 / HEIGHTS.length;
const BARW = SLOT - 3.4;
const VAR_X = TAIL * SLOT - 1.7;

export function ReturnsHistogram({ className = "h-28 w-full" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 104"
      className={className}
      role="img"
      aria-label="Distribution of daily returns with the value-at-risk loss tail shaded."
    >
      <line x1="0" y1={BASE} x2="320" y2={BASE} stroke="#EEEEEE" strokeOpacity="0.1" strokeWidth="1" />
      {HEIGHTS.map((h, i) => {
        const x = i * SLOT + 1.7;
        const barH = h * MAXH;
        const isTail = i < TAIL;
        return (
          <rect
            key={i}
            className="grow-bar"
            style={{ "--bar-delay": `${i * 26}ms` } as CSSProperties}
            x={x}
            y={BASE - barH}
            width={BARW}
            height={barH}
            rx="0.6"
            fill={isTail ? "#1FFFFF" : "#5C647C"}
            fillOpacity={isTail ? 0.85 : 0.55}
          />
        );
      })}
      {/* VaR threshold */}
      <line x1={VAR_X} y1="4" x2={VAR_X} y2={BASE} stroke="#1FFFFF" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.8" />
      <text x={VAR_X + 4} y="12" fill="#1FFFFF" fillOpacity="0.85" fontSize="8" fontFamily="monospace">
        VaR 99%
      </text>
    </svg>
  );
}
