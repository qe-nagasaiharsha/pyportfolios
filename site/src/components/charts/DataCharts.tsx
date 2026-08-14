/* ============================================================================
   Data-driven article charts — the "embed graphs live" upgrade (ROADMAP CW29).
   Unlike the illustrative SVGs in earlier articles, these render REAL numbers
   computed by the quant pipeline (quant/build_charts.py) and baked into
   src/content/articles/data/<slug>.ts at authoring time.

   All components are pure Server Components: deterministic coordinate math,
   no Math.random, no client JS. Lines self-draw via .draw-path once their
   [data-reveal] parent (usually <Figure>) scrolls into view; fills .fade-in.

   Palette follows the article (light "working paper") surface:
   teal #0a8a8a accent · graphite #4a4a42 muted · amber #b07d2b secondary.
   ========================================================================== */

import type { CSSProperties } from "react";

export const CHART_COLORS = {
  teal: "#0a8a8a",
  graphite: "#4a4a42",
  amber: "#b07d2b",
  plum: "#7c5cbf",
  rust: "#b0482b",
  slate: "#5c7a99",
} as const;

export type ChartColor = keyof typeof CHART_COLORS;

/* ----------------------------------------------------------- scale utils -- */

function niceTicks(min: number, max: number, count = 4): number[] {
  if (!isFinite(min) || !isFinite(max) || min === max) return [min];
  const span = max - min;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const norm = step0 / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + 1e-9; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

const fmt = (v: number): string => {
  const a = Math.abs(v);
  if (a >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (a >= 1e4) return `${(v / 1e3).toFixed(0)}k`;
  if (a >= 100) return v.toFixed(0);
  if (a >= 1) return Number(v.toFixed(2)).toString();
  return Number(v.toFixed(3)).toString();
};

/* Shared frame: plot area with y gridlines + mono tick labels. */
const M = { l: 46, r: 10, t: 8, b: 22 };

function Frame({
  w, h, yTicks, xLabels, yFmt = fmt, children,
}: {
  w: number; h: number;
  yTicks: { v: number; y: number }[];
  xLabels: { text: string; x: number }[];
  yFmt?: (v: number) => string;
  children: React.ReactNode;
}) {
  return (
    <>
      {yTicks.map(({ v, y }) => (
        <g key={`y${v}`}>
          <line x1={M.l} y1={y} x2={w - M.r} y2={y} stroke="#4a4a42" strokeOpacity="0.14" strokeWidth="1" />
          <text x={M.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#4a4a42" fillOpacity="0.75" className="t-mono">
            {yFmt(v)}
          </text>
        </g>
      ))}
      {xLabels.map(({ text, x }) => (
        <text key={`x${x}`} x={x} y={h - 6} textAnchor="middle" fontSize="9" fill="#4a4a42" fillOpacity="0.75" className="t-mono">
          {text}
        </text>
      ))}
      {children}
    </>
  );
}

/* Axis titles. The x title sits BELOW the tick row (which Frame draws at h-6),
   so callers extend the viewBox by AXIS_PAD when they pass one. */
const AXIS_PAD = 14;

function AxisTitles({ w, h, xLabel, yLabel }: { w: number; h: number; xLabel?: string; yLabel?: string }) {
  const midY = (M.t + h - M.b) / 2;
  return (
    <>
      {xLabel ? (
        <text x={(M.l + w - M.r) / 2} y={h + AXIS_PAD - 4} textAnchor="middle" fontSize="9" fill="#4a4a42" fillOpacity="0.9" className="t-mono">
          {xLabel}
        </text>
      ) : null}
      {yLabel ? (
        <text x={11} y={midY} textAnchor="middle" fontSize="9" fill="#4a4a42" fillOpacity="0.9" className="t-mono" transform={`rotate(-90 11 ${midY})`}>
          {yLabel}
        </text>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------- LineChart -- */

export interface LineSeries {
  /** y values, evenly spaced along x. */
  y: number[];
  color?: ChartColor;
  width?: number;
  dash?: string;
  /** fill area under this series down to yMin */
  area?: boolean;
  opacity?: number;
}

export function LineChart({
  series,
  xLabels = [],
  w = 600,
  h = 220,
  yMin,
  yMax,
  yFmt,
  hLines = [],
  xLabel,
  yLabel,
  className = "w-full",
  ariaLabel,
}: {
  series: LineSeries[];
  /** sparse x labels: [fraction 0..1, label] pairs */
  xLabels?: [number, string][];
  w?: number;
  h?: number;
  yMin?: number;
  yMax?: number;
  yFmt?: (v: number) => string;
  /** horizontal reference lines, e.g. a VaR threshold */
  hLines?: { v: number; color?: ChartColor; dash?: string; label?: string }[];
  /** axis titles, drawn outside the plot area */
  xLabel?: string;
  yLabel?: string;
  className?: string;
  ariaLabel: string;
}) {
  const all = series.flatMap((s) => s.y).concat(hLines.map((l) => l.v));
  const lo = yMin ?? Math.min(...all);
  const hi = yMax ?? Math.max(...all);
  const pad = (hi - lo) * 0.06 || 1;
  const y0 = lo - pad, y1 = hi + pad;
  const sy = (v: number) => M.t + (h - M.t - M.b) * (1 - (v - y0) / (y1 - y0));
  const sx = (i: number, n: number) => M.l + ((w - M.l - M.r) * i) / Math.max(n - 1, 1);
  const ticks = niceTicks(lo, hi).map((v) => ({ v, y: sy(v) }));
  const labels = xLabels.map(([f, text]) => ({ text, x: M.l + (w - M.l - M.r) * f }));
  const gid = `lc${Math.round(sy(lo) * 7 + w + series.length * 13)}`; // deterministic id

  return (
    <svg viewBox={`0 0 ${w} ${h + (xLabel ? AXIS_PAD : 0)}`} className={className} role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a8a8a" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0a8a8a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <AxisTitles w={w} h={h} xLabel={xLabel} yLabel={yLabel} />
      <Frame w={w} h={h} yTicks={ticks} xLabels={labels} yFmt={yFmt}>
        {series.map((s, si) => {
          const n = s.y.length;
          const pts = s.y.map((v, i) => `${sx(i, n).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
          const color = CHART_COLORS[s.color ?? "teal"];
          const len = Math.round(w * 1.6);
          return (
            <g key={si}>
              {s.area ? (
                <polygon
                  className="fade-in"
                  points={`${M.l},${sy(y0).toFixed(1)} ${pts} ${(w - M.r).toFixed(1)},${sy(y0).toFixed(1)}`}
                  fill={`url(#${gid})`}
                />
              ) : null}
              <polyline
                className="draw-path"
                style={{ "--len": `${len}` } as CSSProperties}
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth={s.width ?? 1.8}
                strokeDasharray={s.dash}
                strokeOpacity={s.opacity ?? 1}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          );
        })}
        {hLines.map((l, i) => (
          <g key={`h${i}`}>
            <line
              x1={M.l} y1={sy(l.v)} x2={w - M.r} y2={sy(l.v)}
              stroke={CHART_COLORS[l.color ?? "rust"]}
              strokeWidth="1.4"
              strokeDasharray={l.dash ?? "5 4"}
            />
            {l.label ? (
              <text x={w - M.r - 4} y={sy(l.v) - 5} textAnchor="end" fontSize="9" fill={CHART_COLORS[l.color ?? "rust"]} className="t-mono">
                {l.label}
              </text>
            ) : null}
          </g>
        ))}
      </Frame>
    </svg>
  );
}

/* --------------------------------------------------------------- BarChart -- */

export function BarChart({
  labels,
  groups,
  w = 600,
  h = 220,
  yFmt,
  xLabel,
  yLabel,
  className = "w-full",
  ariaLabel,
}: {
  labels: string[];
  /** one or more value sets rendered side-by-side per label */
  groups: { values: number[]; color?: ChartColor }[];
  w?: number;
  h?: number;
  yFmt?: (v: number) => string;
  /** axis titles, drawn outside the plot area */
  xLabel?: string;
  yLabel?: string;
  className?: string;
  ariaLabel: string;
}) {
  const all = groups.flatMap((g) => g.values);
  const lo = Math.min(0, ...all);
  const hi = Math.max(0, ...all);
  const pad = (hi - lo) * 0.08 || 1;
  const y0 = lo - (lo < 0 ? pad : 0), y1 = hi + pad;
  const sy = (v: number) => M.t + (h - M.t - M.b) * (1 - (v - y0) / (y1 - y0));
  const ticks = niceTicks(lo, hi).map((v) => ({ v, y: sy(v) }));
  const n = labels.length;
  const slot = (w - M.l - M.r) / n;
  const bw = Math.min(26, (slot * 0.66) / groups.length);
  const xLabels = labels.map((text, i) => ({ text, x: M.l + slot * i + slot / 2 }));

  return (
    <svg viewBox={`0 0 ${w} ${h + (xLabel ? AXIS_PAD : 0)}`} className={className} role="img" aria-label={ariaLabel}>
      <AxisTitles w={w} h={h} xLabel={xLabel} yLabel={yLabel} />
      <Frame w={w} h={h} yTicks={ticks} xLabels={xLabels} yFmt={yFmt}>
        {groups.map((g, gi) =>
          g.values.map((v, i) => {
            const cx = M.l + slot * i + slot / 2;
            const x = cx - (bw * groups.length) / 2 + gi * bw;
            const zero = sy(0);
            const y = Math.min(sy(v), zero);
            const hh = Math.abs(sy(v) - zero);
            return (
              <rect
                key={`${gi}-${i}`}
                className="fade-in"
                x={x.toFixed(1)}
                y={y.toFixed(1)}
                width={(bw - 2).toFixed(1)}
                height={Math.max(hh, 0.5).toFixed(1)}
                fill={CHART_COLORS[g.color ?? (gi === 0 ? "teal" : "graphite")]}
                fillOpacity={gi === 0 ? 0.85 : 0.55}
              />
            );
          }),
        )}
        <line x1={M.l} y1={sy(0)} x2={w - M.r} y2={sy(0)} stroke="#4a4a42" strokeOpacity="0.5" strokeWidth="1" />
      </Frame>
    </svg>
  );
}

/* ------------------------------------------------------------ ScatterChart -- */

export function ScatterChart({
  points,
  lines = [],
  marks = [],
  w = 600,
  h = 260,
  xFmt = fmt,
  yFmt = fmt,
  xLabel,
  yLabel,
  className = "w-full",
  ariaLabel,
}: {
  /** clouds of [x,y] points */
  points: { xy: [number, number][]; color?: ChartColor; r?: number; opacity?: number }[];
  /** overlay polylines in data space, e.g. an efficient frontier or CML */
  lines?: { xy: [number, number][]; color?: ChartColor; dash?: string; width?: number }[];
  /** labelled highlight markers, e.g. max-Sharpe portfolio */
  marks?: { x: number; y: number; label: string; color?: ChartColor }[];
  w?: number;
  h?: number;
  xFmt?: (v: number) => string;
  yFmt?: (v: number) => string;
  xLabel?: string;
  yLabel?: string;
  className?: string;
  ariaLabel: string;
}) {
  const xs = points.flatMap((p) => p.xy.map((d) => d[0])).concat(lines.flatMap((l) => l.xy.map((d) => d[0]))).concat(marks.map((m) => m.x));
  const ys = points.flatMap((p) => p.xy.map((d) => d[1])).concat(lines.flatMap((l) => l.xy.map((d) => d[1]))).concat(marks.map((m) => m.y));
  const [xlo, xhi] = [Math.min(...xs), Math.max(...xs)];
  const [ylo, yhi] = [Math.min(...ys), Math.max(...ys)];
  const xpad = (xhi - xlo) * 0.07 || 1, ypad = (yhi - ylo) * 0.09 || 1;
  const sx = (v: number) => M.l + ((w - M.l - M.r) * (v - xlo + xpad)) / (xhi - xlo + 2 * xpad);
  const sy = (v: number) => M.t + (h - M.t - M.b) * (1 - (v - ylo + ypad) / (yhi - ylo + 2 * ypad));
  const yTicks = niceTicks(ylo, yhi).map((v) => ({ v, y: sy(v) }));
  const xTicks = niceTicks(xlo, xhi).map((v) => ({ text: xFmt(v), x: sx(v) }));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} role="img" aria-label={ariaLabel}>
      <Frame w={w} h={h} yTicks={yTicks} xLabels={xTicks} yFmt={yFmt}>
        {points.map((p, pi) => (
          <g key={`p${pi}`} className="fade-in">
            {p.xy.map(([x, y], i) => (
              <circle
                key={i}
                cx={sx(x).toFixed(1)}
                cy={sy(y).toFixed(1)}
                r={p.r ?? 2}
                fill={CHART_COLORS[p.color ?? "graphite"]}
                fillOpacity={p.opacity ?? 0.35}
              />
            ))}
          </g>
        ))}
        {lines.map((l, li) => (
          <polyline
            key={`l${li}`}
            className="draw-path"
            style={{ "--len": `${Math.round(w * 1.6)}` } as CSSProperties}
            points={l.xy.map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(" ")}
            fill="none"
            stroke={CHART_COLORS[l.color ?? "teal"]}
            strokeWidth={l.width ?? 2}
            strokeDasharray={l.dash}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {marks.map((m, mi) => (
          <g key={`m${mi}`} className="fade-in">
            <circle cx={sx(m.x)} cy={sy(m.y)} r="4.5" fill={CHART_COLORS[m.color ?? "amber"]} />
            <circle cx={sx(m.x)} cy={sy(m.y)} r="7.5" fill="none" stroke={CHART_COLORS[m.color ?? "amber"]} strokeOpacity="0.5" />
            <text x={sx(m.x) + 11} y={sy(m.y) + 3.5} fontSize="9.5" fill={CHART_COLORS[m.color ?? "amber"]} className="t-mono">
              {m.label}
            </text>
          </g>
        ))}
        {xLabel ? (
          <text x={(M.l + w - M.r) / 2} y={h - 6} textAnchor="middle" fontSize="9" fill="#4a4a42" className="t-mono" fillOpacity="0.9">
            {xLabel}
          </text>
        ) : null}
        {yLabel ? (
          <text x={12} y={(M.t + h - M.b) / 2} fontSize="9" fill="#4a4a42" className="t-mono" fillOpacity="0.9" transform={`rotate(-90 12 ${(M.t + h - M.b) / 2})`} textAnchor="middle">
            {yLabel}
          </text>
        ) : null}
      </Frame>
    </svg>
  );
}

/* -------------------------------------------------------------- Histogram -- */

export function Histogram({
  binEdges,
  counts,
  overlay,
  vLines = [],
  w = 600,
  h = 220,
  xFmt = fmt,
  className = "w-full",
  ariaLabel,
}: {
  binEdges: number[]; // length = counts.length + 1
  counts: number[];
  /** optional fitted density curve sampled at bin centres (same length as counts, in count units) */
  overlay?: { y: number[]; color?: ChartColor };
  /** vertical markers, e.g. VaR / CVaR */
  vLines?: { v: number; color?: ChartColor; label?: string; dash?: string }[];
  w?: number;
  h?: number;
  xFmt?: (v: number) => string;
  className?: string;
  ariaLabel: string;
}) {
  const xlo = binEdges[0], xhi = binEdges[binEdges.length - 1];
  const hi = Math.max(...counts, ...(overlay?.y ?? [0]));
  const sx = (v: number) => M.l + ((w - M.l - M.r) * (v - xlo)) / (xhi - xlo);
  const sy = (v: number) => M.t + (h - M.t - M.b) * (1 - v / (hi * 1.06));
  const yTicks = niceTicks(0, hi, 3).map((v) => ({ v, y: sy(v) }));
  const xTicks = niceTicks(xlo, xhi, 5).map((v) => ({ text: xFmt(v), x: sx(v) }));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} role="img" aria-label={ariaLabel}>
      <Frame w={w} h={h} yTicks={yTicks} xLabels={xTicks}>
        {counts.map((c, i) => (
          <rect
            key={i}
            className="fade-in"
            x={sx(binEdges[i]).toFixed(1)}
            y={sy(c).toFixed(1)}
            width={Math.max(sx(binEdges[i + 1]) - sx(binEdges[i]) - 1, 0.5).toFixed(1)}
            height={Math.max(sy(0) - sy(c), 0).toFixed(1)}
            fill="#4a4a42"
            fillOpacity="0.4"
          />
        ))}
        {overlay ? (
          <polyline
            className="draw-path"
            style={{ "--len": `${Math.round(w * 1.6)}` } as CSSProperties}
            points={overlay.y
              .map((v, i) => `${sx((binEdges[i] + binEdges[i + 1]) / 2).toFixed(1)},${sy(v).toFixed(1)}`)
              .join(" ")}
            fill="none"
            stroke={CHART_COLORS[overlay.color ?? "teal"]}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ) : null}
        {vLines.map((l, i) => (
          <g key={`v${i}`}>
            <line x1={sx(l.v)} y1={M.t} x2={sx(l.v)} y2={h - M.b} stroke={CHART_COLORS[l.color ?? "rust"]} strokeWidth="1.5" strokeDasharray={l.dash ?? "5 4"} />
            {l.label ? (
              <text x={sx(l.v)} y={M.t + 10} textAnchor={l.v > (xlo + xhi) / 2 ? "end" : "start"} dx={l.v > (xlo + xhi) / 2 ? -4 : 4} fontSize="9" fill={CHART_COLORS[l.color ?? "rust"]} className="t-mono">
                {l.label}
              </text>
            ) : null}
          </g>
        ))}
      </Frame>
    </svg>
  );
}

/* ---------------------------------------------------------------- Heatmap -- */

export function Heatmap({
  rows,
  cols,
  values,
  w = 600,
  h = 260,
  vFmt = (v: number) => v.toFixed(2),
  lo,
  hi,
  className = "w-full",
  ariaLabel,
}: {
  rows: string[];
  cols: string[];
  /** values[r][c] */
  values: number[][];
  w?: number;
  h?: number;
  vFmt?: (v: number) => string;
  lo?: number;
  hi?: number;
  className?: string;
  ariaLabel: string;
}) {
  const flat = values.flat();
  const vlo = lo ?? Math.min(...flat);
  const vhi = hi ?? Math.max(...flat);
  const L = 64, T = 20;
  const cw = (w - L - 8) / cols.length;
  const ch = (h - T - 8) / rows.length;
  /* teal ramp on paper: low = near-transparent, high = saturated */
  const alpha = (v: number) => 0.06 + 0.78 * ((v - vlo) / (vhi - vlo || 1));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} role="img" aria-label={ariaLabel}>
      {cols.map((c, ci) => (
        <text key={`c${ci}`} x={L + cw * ci + cw / 2} y={T - 7} textAnchor="middle" fontSize="9" fill="#4a4a42" className="t-mono">
          {c}
        </text>
      ))}
      {rows.map((r, ri) => (
        <g key={`r${ri}`}>
          <text x={L - 7} y={T + ch * ri + ch / 2 + 3} textAnchor="end" fontSize="9" fill="#4a4a42" className="t-mono">
            {r}
          </text>
          {cols.map((_, ci) => (
            <g key={ci} className="fade-in">
              <rect x={L + cw * ci + 1} y={T + ch * ri + 1} width={cw - 2} height={ch - 2} fill="#0a8a8a" fillOpacity={alpha(values[ri][ci]).toFixed(3)} rx="2" />
              <text
                x={L + cw * ci + cw / 2}
                y={T + ch * ri + ch / 2 + 3}
                textAnchor="middle"
                fontSize={Math.min(10, ch * 0.34)}
                fill={alpha(values[ri][ci]) > 0.5 ? "#f5f2ea" : "#4a4a42"}
                className="t-mono"
              >
                {vFmt(values[ri][ci])}
              </text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
