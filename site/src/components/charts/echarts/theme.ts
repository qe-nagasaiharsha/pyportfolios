/* ============================================================================
   ECharts theme — the site's own palette, so an interactive chart is
   indistinguishable in colour and type from the SVG ones it replaces.

   Charts sit inside <Figure>, which is Pale Sisal (#F4F2E8) — a LIGHT surface
   on an otherwise dark page. Everything here is tuned for that background, not
   for the anthracite page around it.

   Series colours are the same six as CHART_COLORS in DataCharts.tsx, in the
   same order, so a converted chart keeps the colours readers already saw.
   Aqua is deliberately absent from the cycle: the stylesheet calls it "the
   single charged accent — used sparingly", and a six-colour rotation is not
   sparing. Reach for it explicitly when one series must dominate.
   ========================================================================== */

const INK = "#151515";       // anthracite — axis text, primary lines
const GREY = "#4a4a42";      // graphite — muted text on sisal
const HAIRLINE = "#d8d5c7";  // grid on sisal, ~12% ink
const SISAL = "#F4F2E8";

/* Courier for numerals so ticks align with the site's mono figures; Switzer
   for anything prose-like. Both are loaded by the page already. */
const MONO = '"Courier Prime", "Courier New", ui-monospace, monospace';
const SANS = "switzer, ui-sans-serif, system-ui, sans-serif";

export const PYPORTFOLIOS_THEME = {
  color: ["#0a8a8a", "#4a4a42", "#b07d2b", "#7c5cbf", "#b0482b", "#5c7a99"],
  backgroundColor: "transparent",     // <Figure> paints the sisal panel
  textStyle: { fontFamily: MONO, fontSize: 11, color: GREY },

  title: {
    textStyle: { fontFamily: SANS, fontWeight: 700, fontSize: 13, color: INK },
    subtextStyle: { fontFamily: MONO, fontSize: 10, color: GREY },
  },

  /* Tooltip is the whole point of moving to ECharts — this is what "interactive"
     buys over a picture. Dark card on the light chart, mono numerals. */
  tooltip: {
    backgroundColor: "rgba(21,21,21,0.94)",
    borderColor: "rgba(31,255,255,0.35)",
    borderWidth: 1,
    padding: [8, 11],
    textStyle: { fontFamily: MONO, fontSize: 11, color: "#F4F2E8" },
    axisPointer: {
      lineStyle: { color: GREY, width: 1, type: "dashed" },
      crossStyle: { color: GREY, width: 1, type: "dashed" },
      label: { backgroundColor: INK, fontFamily: MONO, fontSize: 10 },
    },
  },

  legend: {
    textStyle: { fontFamily: MONO, fontSize: 10.5, color: GREY },
    itemWidth: 14,
    itemHeight: 2,
    icon: "roundRect",
  },

  grid: { left: 54, right: 16, top: 26, bottom: 34, containLabel: false },

  categoryAxis: {
    axisLine: { lineStyle: { color: HAIRLINE } },
    axisTick: { show: false },
    axisLabel: { fontFamily: MONO, fontSize: 9.5, color: GREY },
    splitLine: { show: false },
    nameTextStyle: { fontFamily: MONO, fontSize: 9.5, color: GREY },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { fontFamily: MONO, fontSize: 9.5, color: GREY },
    splitLine: { lineStyle: { color: HAIRLINE, width: 1 } },
    nameTextStyle: { fontFamily: MONO, fontSize: 9.5, color: GREY },
  },

  line: { symbol: "none", smooth: false, lineStyle: { width: 2 } },
  bar: { itemStyle: { borderRadius: [1, 1, 0, 0] } },
  scatter: { symbolSize: 4, itemStyle: { opacity: 0.45 } },

  /* Heatmaps read low->high as sisal -> teal, so they sit in the same family
     as the line charts rather than importing a rainbow. */
  visualMap: {
    textStyle: { fontFamily: MONO, fontSize: 9.5, color: GREY },
    inRange: { color: [SISAL, "#9ec9c4", "#0a8a8a", "#0b5f5f"] },
  },
} as const;

/** Named colours for callers that need one explicitly, matching DataCharts. */
export const C = {
  teal: "#0a8a8a",
  graphite: "#4a4a42",
  amber: "#b07d2b",
  plum: "#7c5cbf",
  rust: "#b0482b",
  slate: "#5c7a99",
  ink: INK,
  aqua: "#1fffff",
} as const;
