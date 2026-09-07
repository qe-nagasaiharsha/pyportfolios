/* ============================================================================
   The top-15 economies behind the Geographies section (deck §14).

   This lives in its own module, with no "use client", because BOTH sides need
   it: the map is a client component (canvas, hover) while the legend beneath it
   is rendered on the server. Exporting the array from the client component
   instead looked fine and typechecked, but the server page then received a
   client-reference proxy rather than an array and the build died on
   "WORLD_REACH_MARKETS.filter is not a function". Data shared across the
   boundary has to sit outside both.

   GDP: IMF World Economic Outlook, 2026 estimates — projections, not outturns,
   which is why every surface that shows them says "IMF WEO 2026 est.".
   Cross-checked against two independent renderings of the same WEO release.

   `geo` must match the `name` in public/geo/world-110m.geojson (Natural Earth
   1:110m), which is not always the display name — "United States of America".
   ========================================================================== */

export type MarketGroup = "Developed" | "Emerging";

export interface ReachMarket {
  /** must match the GeoJSON feature name, not the label */
  geo: string;
  label: string;
  group: MarketGroup;
  /** nominal GDP, USD trillions */
  gdp: number;
}

export const WORLD_REACH_MARKETS: ReachMarket[] = [
  { geo: "United States of America", label: "United States", group: "Developed", gdp: 32.38 },
  { geo: "Germany", label: "Germany", group: "Developed", gdp: 5.45 },
  { geo: "Japan", label: "Japan", group: "Developed", gdp: 4.38 },
  { geo: "United Kingdom", label: "United Kingdom", group: "Developed", gdp: 4.26 },
  { geo: "France", label: "France", group: "Developed", gdp: 3.6 },
  { geo: "Italy", label: "Italy", group: "Developed", gdp: 2.74 },
  { geo: "Canada", label: "Canada", group: "Developed", gdp: 2.51 },
  { geo: "Australia", label: "Australia", group: "Developed", gdp: 2.12 },
  { geo: "Spain", label: "Spain", group: "Developed", gdp: 2.09 },
  { geo: "South Korea", label: "South Korea", group: "Developed", gdp: 1.93 },
  { geo: "China", label: "China", group: "Emerging", gdp: 20.85 },
  { geo: "India", label: "India", group: "Emerging", gdp: 4.15 },
  { geo: "Russia", label: "Russia", group: "Emerging", gdp: 2.66 },
  { geo: "Brazil", label: "Brazil", group: "Emerging", gdp: 2.64 },
  { geo: "Mexico", label: "Mexico", group: "Emerging", gdp: 2.12 },
];
