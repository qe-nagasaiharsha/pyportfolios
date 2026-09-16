"use client";

/* Hover readout for the Geographies map.

   Harsha asked for this on 8 Sep 2026: hovering a shaded country should say
   whether it is a developed or an emerging market, and what its GDP is. It
   matters more than it did, because the legend that used to sit under the map
   was removed the same day — hover is now the only thing that names what the
   solid and hatched fills mean.

   WHY THIS IS A WRAPPER RATHER THAN THE MAP ITSELF

   GeographiesMap is generated and holds 131 KB of <path> data. Left as a server
   component that data is rendered to HTML once at build time and never enters
   the JavaScript bundle. Making it a client component so it could own hover
   state would have shipped every coordinate to the browser twice — once as
   markup, once as bundled JSX.

   So the map stays a server component and is passed in as `children`. React
   renders those children on the server and hands this component the finished
   node, which is why the paths do not follow it into the bundle. The listener
   is delegated from the wrapper, and the name and group come off the hovered
   <path>'s own data-market/data-group attributes — set by the generator — so
   there is no market list duplicated on this side either.

   The GDP figure is the one thing that changes on its own: the IMF revises its
   World Economic Outlook every April and October. So it is not baked into the
   paths but read from src/data/gdp.json, keyed by the same display name, which
   scripts/update-gdp.mjs refreshes from the IMF API on a daily schedule (see
   .github/workflows/update-gdp.yml). The path's data-gdp is only a fallback
   for a name the JSON does not know. The footnote names the WEO release the
   numbers came from, so it can never claim a vintage the data is not.

   Unshaded countries carry no data-market and are deliberately silent, exactly
   as the earlier ECharts version was: the map covers fifteen economies and
   should not appear to know anything about the rest. */

import { useCallback, useRef, useState } from "react";
import gdpData from "@/data/gdp.json";

/* "World Economic Outlook (April 2026)" → "IMF WEO April 2026 · 2026 est." */
const GDP_NOTE = `IMF WEO ${gdpData.source.replace(/^World Economic Outlook\s*\((.+)\)$/, "$1")} · ${gdpData.year} est.`;
const GDP: Record<string, number> = gdpData.values;

interface Hovered {
  name: string;
  group: string;
  gdp: string;
  x: number;
  y: number;
}

export function MapHover({ children }: { children: React.ReactNode }) {
  const [hit, setHit] = useState<Hovered | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement | null)?.closest<SVGPathElement>("[data-market]");
    const frame = box.current;
    if (!target || !frame) {
      setHit(null);
      return;
    }
    const r = frame.getBoundingClientRect();
    setHit({
      name: target.getAttribute("data-market") || "",
      group: target.getAttribute("data-group") || "",
      gdp: (() => {
        const name = target.getAttribute("data-market") || "";
        const tn = GDP[name];
        return typeof tn === "number" ? tn.toFixed(2) : target.getAttribute("data-gdp") || "";
      })(),
      x: e.clientX - r.left,
      y: e.clientY - r.top,
    });
  }, []);

  return (
    <div
      ref={box}
      className="relative"
      onMouseMove={onMove}
      onMouseLeave={() => setHit(null)}
    >
      {children}

      {hit ? (
        /* Follows the cursor, nudged up and right of it, and clamped by the
           translate below so it never runs off the left edge or off the top
           when hovering something near the map's border. */
        <div
          className="pointer-events-none absolute z-20 max-w-[15rem] rounded-sm border border-aqua/25 bg-navy/95 px-3 py-2 text-pearl shadow-lg"
          style={{
            left: hit.x,
            top: hit.y,
            transform: `translate(${hit.x > 200 ? "-105%" : "12px"}, ${hit.y > 60 ? "-115%" : "16px"})`,
          }}
          role="status"
        >
          <p className="t-mono text-[0.72rem] font-semibold leading-tight">{hit.name}</p>
          <p className="mt-1 t-mono text-[0.62rem] uppercase tracking-[0.14em] text-aqua">
            {hit.group}
          </p>
          <p className="mt-1.5 t-mono text-[0.66rem] text-pearl/80">
            GDP <span className="font-semibold text-pearl">${hit.gdp} tn</span>
          </p>
          <p className="mt-0.5 t-mono text-[0.56rem] uppercase tracking-[0.12em] text-pearl/40">
            {GDP_NOTE}
          </p>
        </div>
      ) : null}
    </div>
  );
}
