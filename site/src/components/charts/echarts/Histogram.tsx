"use client";

/* Histogram with an optional fitted-density overlay and vertical markers.

   Bars are drawn as a bar series over a VALUE x-axis rather than a category
   one, so bin width is true to the data and the overlay curve lands in the right
   place. ECharts needs the bar width in axis units for that, which is what
   `barWidth` computed from the edges does below.

   The markers (mean, median, VaR, CVaR) carry labels: on the static version a
   reader had to match a dashed line to a legend entry by colour. */

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Chart } from "./Chart";
import { C } from "./theme";
import { makeFmt, type NumFmt } from "./format";

export function Histogram({
  binEdges,
  counts,
  overlay,
  vLines = [],
  xName,
  yName,
  height = 260,
  ariaLabel,
  xFmt,
  yFmt,
  barName = "observed",
}: {
  /** length = counts.length + 1 */
  binEdges: readonly number[];
  counts: readonly number[];
  /** fitted density sampled at bin centres, same length as counts */
  overlay?: { name: string; y: readonly number[]; color?: keyof typeof C };
  /* label optional: a marker can be a bare rule, e.g. where two VaR figures
     nearly coincide and only one of them is worth captioning */
  vLines?: readonly { v: number; label?: string; color?: keyof typeof C }[];
  xName?: string;
  yName?: string;
  height?: number;
  ariaLabel: string;
  xFmt?: NumFmt;
  yFmt?: NumFmt;
  barName?: string;
}) {
  const fx = useMemo(() => makeFmt(xFmt), [xFmt]);
  const fy = useMemo(() => makeFmt(yFmt), [yFmt]);

  const option = useMemo<EChartsOption>(() => {
    const centres = counts.map((_, i) => (binEdges[i] + binEdges[i + 1]) / 2);
    const width = binEdges.length > 1 ? binEdges[1] - binEdges[0] : 1;

    return {
      animation: false,
      grid: { left: 60, right: 18, top: overlay ? 30 : 18, bottom: 44 },
      xAxis: {
        type: "value", name: xName, nameLocation: "middle", nameGap: 26,
        min: binEdges[0], max: binEdges[binEdges.length - 1],
        axisLabel: { formatter: (v: number) => fx(v) },
      },
      yAxis: {
        type: "value", name: yName, nameLocation: "middle", nameGap: 44,
        axisLabel: { formatter: (v: number) => fy(v) },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line" },
        formatter: (params) => {
          const arr = Array.isArray(params) ? params : [params];
          const first = arr[0]?.data as [number, number] | undefined;
          const head = first ? fx(first[0]) : "";
          const rows = arr.map((p) => {
            const d = p.data as [number, number];
            return `${p.marker ?? ""} ${p.seriesName} <b>${fy(d[1])}</b>`;
          });
          return [head, ...rows].join("<br/>");
        },
      },
      legend: overlay ? { top: 0, right: 0 } : undefined,
      series: [
        {
          type: "bar" as const,
          name: barName,
          data: centres.map((c, i) => [c, counts[i]]),
          barWidth: width,
          itemStyle: { color: C.teal, opacity: 0.55, borderColor: C.ink, borderWidth: 0.25 },
          markLine: vLines.length ? {
            silent: true, symbol: "none",
            data: vLines.map((l) => ({
              xAxis: l.v,
              lineStyle: { color: C[l.color ?? "rust"], width: 1.6, type: "dashed" as const },
              label: l.label
                ? { show: true, formatter: l.label, fontSize: 9.5, color: C[l.color ?? "rust"], position: "end" as const }
                : { show: false },
            })),
          } : undefined,
        },
        ...(overlay ? [{
          type: "line" as const,
          name: overlay.name,
          data: centres.map((c, i) => [c, overlay.y[i]]),
          showSymbol: false,
          lineStyle: { width: 2, color: C[overlay.color ?? "ink"] },
          itemStyle: { color: C[overlay.color ?? "ink"] },
        }] : []),
      ],
    };
  }, [binEdges, counts, overlay, vLines, xName, yName, fx, fy, barName]);

  return <Chart option={option} height={height} ariaLabel={ariaLabel} />;
}
