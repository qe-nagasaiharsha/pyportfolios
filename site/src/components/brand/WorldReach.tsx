"use client";

/* ============================================================================
   World reach — the Geographies section (deck §14): the top-15 economies the
   research draws on, split Developed / Emerging.

   This replaced an 807 KB PNG. The picture could only be enlarged: the browser
   had no idea where any country was, so the fifteen names had to sit in a
   legend underneath and the reader matched shapes to a list by eye. Here each
   country carries its own data and answers on hover (Harsha, 7 Sep):
   category and nominal GDP.

   Boundaries: Natural Earth 1:110m via world-atlas, decoded to GeoJSON once by
   quant/make_world_geojson.py — the same source the old PNG was credited to.
   Fetched at mount rather than imported so the 167 KB never enters the JS
   bundle; the section renders immediately and the map fills in.

   GDP: IMF World Economic Outlook, 2026 estimates. These are projections, not
   outturns — 2026 is not over — which is why the tooltip and the caption both
   say "IMF WEO 2026 est." rather than presenting them as settled fact.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { MapChart } from "echarts/charts";
import { TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";
import { WORLD_REACH_MARKETS as MARKETS } from "@/lib/worldReach";

echarts.use([MapChart, TooltipComponent, CanvasRenderer]);

/* the map sits on the pale sisal card, so it is inked rather than lit: the
   two groups are the deck's solid-vs-hatched pair rendered as two tones of
   anthracite, and everything else is the same near-white the card uses. */
const INK = "#151515";
const DEVELOPED = "#151515";
const EMERGING = "#6f6f6a";
const REST = "#dcd9cb";
const SEA = "#f4f2e8";

const BY_GEO = new Map(MARKETS.map((m) => [m.geo, m]));

export function WorldReach() {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let dead = false;

    (async () => {
      let geo: unknown;
      try {
        const res = await fetch("/geo/world-110m.geojson");
        if (!res.ok) throw new Error(String(res.status));
        geo = await res.json();
      } catch {
        if (!dead) setFailed(true);   // the legend below still names all fifteen
        return;
      }
      if (dead || !host.current) return;

      /* registerMap is global to echarts, so guard against a second mount
         (React strict mode, or the section re-rendering) re-registering it */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(echarts as any).getMap?.("world")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        echarts.registerMap("world", geo as any);
      }

      const option: EChartsOption = {
        animation: false,
        backgroundColor: SEA,
        tooltip: {
          trigger: "item",
          borderColor: INK,
          borderWidth: 1,
          backgroundColor: "#ffffff",
          textStyle: { color: INK, fontSize: 12 },
          formatter: (p) => {
            const one = Array.isArray(p) ? p[0] : p;
            const m = BY_GEO.get(String(one.name));
            if (!m) return "";           // unshaded country: say nothing
            return (
              `<b>${m.label}</b><br/>${m.group} market` +
              `<br/>GDP <b>$${m.gdp.toFixed(2)} tn</b>` +
              `<span style="opacity:.55"> · IMF WEO 2026 est.</span>`
            );
          },
        },
        series: [
          {
            type: "map",
            map: "world",
            roam: false,                 // fixed set of 15, nothing to explore
            silent: false,
            selectedMode: false,
            /* ECharts squashes longitude to 0.75 by default, which is a
               cartographic choice for a globe-ish look but leaves the drawing
               narrower than its box — the land was filling 59% of the width
               with empty bands either side. 1 gives plain equirectangular, the
               projection the original PNG used, and it fills the frame. */
            aspectScale: 1,
            itemStyle: { areaColor: REST, borderColor: SEA, borderWidth: 0.5 },
            emphasis: {
              /* only the fifteen react; the rest keep their resting colour so
                 the eye is not pulled to a country with nothing to say */
              label: { show: false },
              itemStyle: { areaColor: "#b9b5a4" },
            },
            data: MARKETS.map((m) => ({
              name: m.geo,
              value: m.gdp,
              itemStyle: { areaColor: m.group === "Developed" ? DEVELOPED : EMERGING },
              emphasis: { itemStyle: { areaColor: m.group === "Developed" ? "#2e2e2e" : "#8a8a84" } },
            })),
          },
        ],
      };

      /* Never init on a zero-sized box. An ECharts instance born at 0x0 does
         NOT recover — the observer fires, resize() runs, the canvas stays 0.
         Measured on this project in August and fixed the same way in
         charts/echarts/Chart.tsx. It bites here because the container is sized
         by aspect-ratio, which resolves after the effect runs, so the first
         look at it is 0 tall. */
      const target = host.current;
      const start = () => {
        if (chart.current) {
          chart.current.resize();
          return;
        }
        if (target.clientWidth === 0 || target.clientHeight === 0) return;
        chart.current = echarts.init(target, undefined, { renderer: "canvas" });
        chart.current.setOption(option);
      };

      const ro = new ResizeObserver(start);
      ro.observe(target);
      start();
      roRef.current = ro;
    })();

    return () => {
      dead = true;
      roRef.current?.disconnect();
      roRef.current = null;
      chart.current?.dispose();
      chart.current = null;
    };
  }, []);

  return (
    <div>
      <div
        ref={host}
        role="img"
        aria-label="World map of the top 15 economies the research covers, shaded by developed and emerging market, each showing its nominal GDP on hover."
        /* Without Antarctica the drawn world spans 360 x 139 degrees, so the
           box is given the same 2.6:1 shape. A taller box does not make the
           map bigger — ECharts preserves aspect — it just adds empty bands
           above and below it. */
        className="aspect-[26/10] max-h-[420px] w-full"
      />
      {failed ? (
        <p className="mt-3 t-mono text-[0.62rem] uppercase tracking-[0.14em] text-anthracite/50">
          Map unavailable — the fifteen markets are listed below.
        </p>
      ) : null}
    </div>
  );
}
