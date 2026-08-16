"use client";

/* Scatter — the type Lightweight Charts has no answer for, and the reason the
   site is on ECharts. Canvas, so a few thousand points cost one draw call
   rather than a few thousand DOM nodes.

   Hovering a point reads out its coordinates; that readout is the whole gain
   over the static version, where a reader could only estimate position by eye. */

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Chart } from "./Chart";
import { C } from "./theme";
import { makeFmt, type NumFmt } from "./format";

export type ScatterSeries = {
  name: string;
  points: readonly (readonly [number, number])[];
  color?: keyof typeof C;
  size?: number;
  opacity?: number;
};

/* A curve drawn through the cloud rather than a cloud of its own: the efficient
   frontier and the capital market line are both this. Ordered points, no symbols. */
export type ScatterLine = {
  name: string;
  points: readonly (readonly [number, number])[];
  color?: keyof typeof C;
  dash?: boolean;
  width?: number;
};

/** A single called-out point — max Sharpe, minimum variance — with its label
    drawn on the chart, since these are the two the prose keeps referring to. */
export type ScatterMark = {
  x: number;
  y: number;
  label: string;
  color?: keyof typeof C;
};

export function Scatter({
  series,
  lines = [],
  marks = [],
  xName,
  yName,
  height = 300,
  ariaLabel,
  xFmt,
  yFmt,
  /** optional reference lines, e.g. the 5% tail cut-offs */
  xLines = [],
  yLines = [],
}: {
  series: ScatterSeries[];
  lines?: readonly ScatterLine[];
  marks?: readonly ScatterMark[];
  xName?: string;
  yName?: string;
  height?: number;
  ariaLabel: string;
  /* format DESCRIPTORS, not functions — see format.ts for why */
  xFmt?: NumFmt;
  yFmt?: NumFmt;
  xLines?: number[];
  yLines?: number[];
}) {
  const fx = useMemo(() => makeFmt(xFmt), [xFmt]);
  const fy = useMemo(() => makeFmt(yFmt), [yFmt]);

  const option = useMemo<EChartsOption>(() => ({
    animation: false,           // charts sit in prose; motion on scroll is noise
    grid: { left: 58, right: 18, top: 18, bottom: 42 },
    xAxis: {
      type: "value", name: xName, nameLocation: "middle", nameGap: 26,
      scale: true, axisLabel: { formatter: (v: number) => fx(v) },
    },
    yAxis: {
      type: "value", name: yName, nameLocation: "middle", nameGap: 40,
      scale: true, axisLabel: { formatter: (v: number) => fy(v) },
    },
    tooltip: {
      trigger: "item",
      /* ECharts types the callback param as a union covering every trigger
         mode, so it is narrowed here rather than asserted at the signature. */
      formatter: (params) => {
        const p = Array.isArray(params) ? params[0] : params;
        const xy = p.data as [number, number];
        return `${p.seriesName ?? ""}<br/>${xName ?? "x"} ${fx(xy[0])}<br/>${yName ?? "y"} ${fy(xy[1])}`;
      },
    },
    legend: series.length + lines.length + marks.length > 1 ? { top: 0, right: 0 } : undefined,
    series: [
      ...series.map((s, i) => ({
        type: "scatter" as const,
        name: s.name,
        data: s.points as [number, number][],
        symbolSize: s.size ?? 4,
        itemStyle: { color: C[s.color ?? "teal"], opacity: s.opacity ?? 0.45 },
        /* reference lines hang off the first series so they draw once */
        markLine: i === 0 && (xLines.length || yLines.length) ? {
          silent: true, symbol: "none",
          /* `as const` is load-bearing: spreading three series shapes into one
             array makes it a union, which drops the contextual typing that
             would otherwise narrow this string to ZRLineType. */
          lineStyle: { color: C.graphite, type: "dashed" as const, width: 1, opacity: 0.7 },
          label: { show: false },
          data: [...xLines.map((v) => ({ xAxis: v })), ...yLines.map((v) => ({ yAxis: v }))],
        } : undefined,
        large: s.points.length > 2000,   // canvas fast path for dense clouds
        largeThreshold: 2000,
      })),
      ...lines.map((l) => ({
        type: "line" as const,
        name: l.name,
        data: l.points as [number, number][],
        showSymbol: false,
        /* the curve must sit above the cloud it is drawn through */
        z: 3,
        lineStyle: {
          width: l.width ?? 2,
          color: C[l.color ?? "teal"],
          type: l.dash ? ("dashed" as const) : ("solid" as const),
        },
        itemStyle: { color: C[l.color ?? "teal"] },
      })),
      ...marks.map((m) => ({
        type: "scatter" as const,
        name: m.label,
        data: [[m.x, m.y]] as [number, number][],
        symbolSize: 9,
        z: 4,
        itemStyle: { color: C[m.color ?? "rust"], borderColor: "#F4F2E8", borderWidth: 1.2 },
        label: {
          show: true, formatter: m.label, position: "right" as const,
          fontSize: 9.5, color: C[m.color ?? "rust"],
        },
      })),
    ],
  }), [series, lines, marks, xName, yName, fx, fy, xLines, yLines]);

  return <Chart option={option} height={height} ariaLabel={ariaLabel} />;
}
