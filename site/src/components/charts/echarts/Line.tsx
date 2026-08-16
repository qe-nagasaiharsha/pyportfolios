"use client";

/* Line / area. The workhorse — 9 of the site's charts are this shape.

   Two x-axis modes, because the articles need both:
     · `x` given      -> value axis (moneyness, yield, degrees of freedom)
     · `x` omitted    -> category axis over the index, with sparse labels from
                         `xLabels` as [fraction 0..1, text], matching the shape
                         the old SVG LineChart took so call sites port cleanly.

   The tooltip is the reason this exists: axis-triggered, so one hover reads
   every series at that x. On a chart comparing three VaR methods that answers
   "what were all three on this day" in one movement — the static version could
   not answer it at all. */

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Chart } from "./Chart";
import { C } from "./theme";
import { makeFmt, type NumFmt } from "./format";

export type LineSeries = {
  name: string;
  y: readonly number[];
  color?: keyof typeof C;
  /** dashed stroke, e.g. a fitted curve against the empirical one */
  dash?: boolean;
  /** fill to the axis — use for one series only, it gets busy fast */
  area?: boolean;
  width?: number;
  /** stroke opacity — used to push a noisy raw series behind a fitted one */
  opacity?: number;
};

export function Line({
  series,
  x,
  xLabels = [],
  xName,
  yName,
  height = 260,
  ariaLabel,
  xFmt,
  yFmt,
  /** horizontal reference lines, e.g. a VaR threshold or zero */
  hLines = [],
  yMin,
  yMax,
}: {
  series: LineSeries[];
  x?: readonly number[];
  xLabels?: readonly (readonly [number, string])[];
  xName?: string;
  yName?: string;
  height?: number;
  ariaLabel: string;
  xFmt?: NumFmt;
  yFmt?: NumFmt;
  hLines?: readonly { v: number; label?: string; color?: keyof typeof C }[];
  yMin?: number;
  yMax?: number;
}) {
  const fx = useMemo(() => makeFmt(xFmt), [xFmt]);
  const fy = useMemo(() => makeFmt(yFmt), [yFmt]);
  const n = series[0]?.y.length ?? 0;

  const option = useMemo<EChartsOption>(() => {
    /* sparse labels arrive as fractions of the axis; map them onto indices so a
       category axis can show exactly those and nothing else */
    const labelAt = new Map<number, string>();
    for (const [f, text] of xLabels) labelAt.set(Math.round(f * (n - 1)), text);

    return {
      animation: false,
      grid: { left: 58, right: 18, top: series.length > 1 ? 30 : 18, bottom: 42 },
      xAxis: x
        ? {
            type: "value" as const, name: xName, nameLocation: "middle" as const, nameGap: 26,
            scale: true, axisLabel: { formatter: (v: number) => fx(v) },
          }
        : {
            type: "category" as const, name: xName, nameLocation: "middle" as const, nameGap: 26,
            data: Array.from({ length: n }, (_, i) => String(i)),
            boundaryGap: false,
            axisLabel: {
              interval: (i: number) => labelAt.has(i),
              formatter: (_: string, i: number) => labelAt.get(i) ?? "",
            },
          },
      yAxis: {
        type: "value", name: yName, nameLocation: "middle", nameGap: 42,
        min: yMin, max: yMax, scale: yMin === undefined && yMax === undefined,
        axisLabel: { formatter: (v: number) => fy(v) },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line" },
        formatter: (params) => {
          const arr = Array.isArray(params) ? params : [params];
          /* axisValue exists on axis-trigger params but not on the shared
             CallbackDataParams type, so read it off a narrowed shape */
          const first = arr[0] as { axisValue?: string | number; dataIndex?: number } | undefined;
          const head = x ? fx(Number(first?.axisValue)) : (labelAt.get(Number(first?.dataIndex)) ?? "");
          const rows = arr.map((p) => {
            const v = Array.isArray(p.data) ? (p.data as number[])[1] : (p.data as number);
            return `${p.marker ?? ""} ${p.seriesName} <b>${fy(v)}</b>`;
          });
          return [head, ...rows].filter(Boolean).join("<br/>");
        },
      },
      legend: series.length > 1 ? { top: 0, right: 0, data: series.map((s) => s.name) } : undefined,
      series: series.map((s, i) => ({
        type: "line" as const,
        name: s.name,
        showSymbol: false,
        data: x ? s.y.map((v, j) => [x[j], v]) : (s.y as number[]),
        lineStyle: {
          width: s.width ?? 1.8,
          color: C[s.color ?? "teal"],
          type: s.dash ? ("dashed" as const) : ("solid" as const),
          opacity: s.opacity ?? 1,
        },
        itemStyle: { color: C[s.color ?? "teal"] },
        areaStyle: s.area ? { opacity: 0.16 } : undefined,
        markLine: i === 0 && hLines.length ? {
          silent: true, symbol: "none",
          data: hLines.map((l) => ({
            yAxis: l.v,
            lineStyle: { color: C[l.color ?? "graphite"], type: "dashed" as const, width: 1 },
            label: l.label ? { show: true, formatter: l.label, fontSize: 9, color: C.graphite } : { show: false },
          })),
        } : undefined,
      })),
    };
  }, [series, x, xLabels, xName, yName, fx, fy, hLines, yMin, yMax, n]);

  return <Chart option={option} height={height} ariaLabel={ariaLabel} />;
}
