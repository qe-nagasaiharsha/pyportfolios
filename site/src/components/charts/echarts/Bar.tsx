"use client";

/* Grouped bars over named categories — countries, assets, yield shocks.

   This is the shape Lightweight Charts cannot draw at all: its histogram series
   is indexed by time, so a bar per country has nowhere to sit. */

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Chart } from "./Chart";
import { C } from "./theme";
import { makeFmt, type NumFmt } from "./format";

export type BarSeries = {
  name: string;
  values: readonly number[];
  color?: keyof typeof C;
};

export function Bar({
  labels,
  series,
  xName,
  yName,
  height = 250,
  ariaLabel,
  yFmt,
  /** draw a zero rule when values cross it (drawdowns, error vs baseline) */
  zeroLine = false,
  horizontal = false,
  hLines = [],
}: {
  labels: readonly string[];
  series: BarSeries[];
  xName?: string;
  yName?: string;
  height?: number;
  ariaLabel: string;
  yFmt?: NumFmt;
  zeroLine?: boolean;
  horizontal?: boolean;
  /** dashed reference rules on the value axis, e.g. an expected count */
  hLines?: readonly { v: number; label?: string; color?: keyof typeof C }[];
}) {
  const fy = useMemo(() => makeFmt(yFmt), [yFmt]);

  const option = useMemo<EChartsOption>(() => {
    const cat = {
      type: "category" as const,
      data: labels as string[],
      name: horizontal ? yName : xName,
      nameLocation: "middle" as const,
      nameGap: horizontal ? 46 : 26,
      axisLabel: { interval: 0, hideOverlap: true },
    };
    const val = {
      type: "value" as const,
      name: horizontal ? xName : yName,
      nameLocation: "middle" as const,
      nameGap: horizontal ? 26 : 46,
      axisLabel: { formatter: (v: number) => fy(v) },
    };

    return {
      animation: false,
      grid: { left: horizontal ? 82 : 60, right: 18, top: series.length > 1 ? 30 : 18, bottom: 44 },
      xAxis: horizontal ? val : cat,
      yAxis: horizontal ? cat : val,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const arr = Array.isArray(params) ? params : [params];
          /* axisValue is present on axis-trigger params but absent from the
             shared CallbackDataParams type, so read it off a narrowed shape */
          const head = String((arr[0] as { axisValue?: string | number })?.axisValue ?? "");
          const rows = arr.map((p) => `${p.marker ?? ""} ${p.seriesName} <b>${fy(Number(p.data))}</b>`);
          return [head, ...rows].join("<br/>");
        },
      },
      legend: series.length > 1 ? { top: 0, right: 0, data: series.map((s) => s.name) } : undefined,
      series: series.map((s, i) => ({
        type: "bar" as const,
        name: s.name,
        data: s.values as number[],
        itemStyle: { color: C[s.color ?? "teal"] },
        barMaxWidth: 26,
        markLine: i === 0 && (zeroLine || hLines.length) ? {
          silent: true, symbol: "none",
          data: [
            ...(zeroLine ? [{
              [horizontal ? "xAxis" : "yAxis"]: 0,
              lineStyle: { color: C.ink, width: 1, type: "solid" as const, opacity: 0.5 },
              label: { show: false },
            }] : []),
            ...hLines.map((l) => ({
              [horizontal ? "xAxis" : "yAxis"]: l.v,
              lineStyle: { color: C[l.color ?? "graphite"], width: 1.2, type: "dashed" as const },
              label: l.label
                ? { show: true, formatter: l.label, fontSize: 9.5, color: C[l.color ?? "graphite"], position: "insideEndTop" as const }
                : { show: false },
            })),
          ],
        } : undefined,
      })),
    };
  }, [labels, series, xName, yName, fy, zeroLine, horizontal, hLines]);

  return <Chart option={option} height={height} ariaLabel={ariaLabel} />;
}
