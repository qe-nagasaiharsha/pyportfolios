"use client";

/* ============================================================================
   The one ECharts mount point. Every interactive chart on the site goes through
   this; nothing else imports echarts directly.

   Why a single wrapper:
     · tree-shaking — we register only the series and components we actually
       use (see the import block below). Importing `echarts` whole pulls ~1 MB;
       this build is a fraction of that.
     · one theme — colours, fonts and axis styling live in theme.ts, so a chart
       cannot drift from the site's look.
     · one resize observer, one dispose path. ECharts leaks its canvas if you
       forget either.

   Canvas, not SVG: that is the reason we are on ECharts rather than Plotly.
   A 4,500-point scatter is ~4,500 DOM nodes in SVG and one draw call here.

   Server Components cannot use it (it needs the DOM), so this is a client
   island. The page around it stays server-rendered.
   ========================================================================== */

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import type { ECharts } from "echarts/core";
import { LineChart, BarChart, ScatterChart, HeatmapChart, CustomChart } from "echarts/charts";
import {
  GridComponent, TooltipComponent, LegendComponent, MarkLineComponent,
  MarkPointComponent, VisualMapComponent, DataZoomComponent, TitleComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";
import { PYPORTFOLIOS_THEME } from "./theme";

echarts.use([
  LineChart, BarChart, ScatterChart, HeatmapChart, CustomChart,
  GridComponent, TooltipComponent, LegendComponent, MarkLineComponent,
  MarkPointComponent, VisualMapComponent, DataZoomComponent, TitleComponent,
  CanvasRenderer,
]);

let themeRegistered = false;

export function Chart({
  option,
  height = 280,
  ariaLabel,
  className = "",
}: {
  option: EChartsOption;
  /** css height in px; width always fills the figure */
  height?: number;
  /** describes the chart for screen readers — canvas has no readable content */
  ariaLabel: string;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<ECharts | null>(null);
  /* the effect below must not re-run when the option object changes, so it
     reads the current one through a ref instead of closing over it */
  const latest = useRef(option);
  latest.current = option;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (!themeRegistered) {
      echarts.registerTheme("pyportfolios", PYPORTFOLIOS_THEME);
      themeRegistered = true;
    }

    /* Never init on a zero-width container. ECharts fixes its canvas size at
       init, and an instance born at zero width does NOT recover: the observer
       fires, resize() runs, and the canvas stays 0 — measured, not assumed.
       So defer creation until the box actually has a width. This happens for
       real whenever layout settles after mount. */
    const sync = () => {
      if (chart.current) {
        chart.current.resize();
        return;
      }
      if (el.clientWidth === 0) return;
      chart.current = echarts.init(el, "pyportfolios", { renderer: "canvas" });
      chart.current.setOption(latest.current);
    };

    /* ResizeObserver rather than a window listener: the figure can change width
       without the window doing so (sidebar TOC, print, container queries). */
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    sync();

    return () => {
      ro.disconnect();
      chart.current?.dispose();
      chart.current = null;
    };
  }, []);

  /* option is rebuilt by each chart component's useMemo; push it through
     without tearing the instance down */
  useEffect(() => {
    chart.current?.setOption(option, true);
  }, [option]);

  return (
    <div
      ref={host}
      role="img"
      aria-label={ariaLabel}
      style={{ height }}
      className={`w-full ${className}`}
    />
  );
}
