"use client";

/* Matrix heatmap — correlations, parameter sweeps, tail-dependence grids.

   The other type Lightweight Charts has no series for. Values are printed in
   each cell as well as encoded by colour: colour alone is unreadable for the
   ~8% of men with a colour-vision deficiency, and on a correlation matrix the
   exact number is usually the point. */

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Chart } from "./Chart";
import { C } from "./theme";
import { makeFmt, type NumFmt } from "./format";

/* Minimal stand-in for ECharts' CallbackDataParams: the real type lives
   behind a deep import path and only `data` is needed here. */
type CellParams = { data: [number, number, number] };

export function Heatmap({
  rows,
  cols,
  /** values[r][c] — row-major, matching the rows/cols arrays */
  values,
  height = 300,
  ariaLabel,
  vFmt,
  min,
  max,
  xName,
  yName,
  showCellText = true,
}: {
  rows: readonly string[];
  cols: readonly string[];
  values: readonly (readonly number[])[];
  height?: number;
  ariaLabel: string;
  vFmt?: NumFmt;
  min?: number;
  max?: number;
  xName?: string;
  yName?: string;
  showCellText?: boolean;
}) {
  const fv = useMemo(() => makeFmt(vFmt ?? { decimals: 2 }), [vFmt]);

  const option = useMemo<EChartsOption>(() => {
    const flat = values.flat();
    const lo = min ?? Math.min(...flat);
    const hi = max ?? Math.max(...flat);
    /* ECharts heatmap wants [colIndex, rowIndex, value] */
    const data = values.flatMap((row, r) => row.map((v, c) => [c, r, v]));

    return {
      animation: false,
      grid: { left: 74, right: 20, top: 16, bottom: 62 },
      xAxis: {
        type: "category", data: cols as string[], name: xName,
        nameLocation: "middle", nameGap: 32,
        splitArea: { show: true }, axisLabel: { interval: 0, hideOverlap: true },
      },
      yAxis: {
        type: "category", data: rows as string[], name: yName,
        nameLocation: "middle", nameGap: 58,
        splitArea: { show: true }, axisLabel: { interval: 0 },
      },
      visualMap: {
        min: lo, max: hi, calculable: false, show: true,
        orient: "horizontal", left: "center", bottom: 4,
        itemWidth: 10, itemHeight: 90,
        /* the legend formatter is typed against OptionDataValue, which is
           wider than number — coerce rather than assert the whole option */
        formatter: (v: unknown) => fv(Number(v)),
      },
      tooltip: {
        position: "top",
        formatter: (params) => {
          const p = Array.isArray(params) ? params[0] : params;
          const [c, r, v] = p.data as [number, number, number];
          return `${rows[r]} × ${cols[c]}<br/><b>${fv(v)}</b>`;
        },
      },
      series: [{
        type: "heatmap" as const,
        data,
        /* `show` as a flag, not a ternary over two object shapes: the ternary
           produced a union, and a union kills the contextual typing that gives
           `formatter` its parameter type. Leave the annotation off for the same
           reason — an explicit one never matches CallbackDataParams exactly. */
        label: {
          show: showCellText,
          formatter: ((p: CellParams) => fv(p.data[2])) as unknown as string,
          fontSize: 9.5,
        },
        itemStyle: { borderColor: "#F4F2E8", borderWidth: 1 },
        emphasis: { itemStyle: { borderColor: C.ink, borderWidth: 1.5 } },
      }],
    };
  }, [rows, cols, values, fv, min, max, xName, yName, showCellText]);

  return <Chart option={option} height={height} ariaLabel={ariaLabel} />;
}
