/* ============================================================================
   Number formatting for ECharts axes and tooltips, as DATA rather than a
   function.

   This exists because of a hard boundary: article bodies are Server Components
   and every chart is a Client Component, and functions cannot be passed across
   that line — Next.js serialises props, and a closure has no serialisation.
   The old SVG charts took `xFmt={(v) => v.toFixed(1)}` quite happily because
   they rendered on the server; the ECharts ones cannot.

   So callers describe the format and the client builds the function:

       <Line yFmt={{ percent: true, decimals: 1 }} />     ->  "14.8%"
       <Line yFmt={{ prefix: "$", decimals: 0 }} />       ->  "$1,181"

   No chart component in this folder may take a function prop.
   ========================================================================== */

export type NumFmt = {
  /** decimal places; default 2 */
  decimals?: number;
  /** multiply by 100 and append % */
  percent?: boolean;
  /** e.g. "$" */
  prefix?: string;
  /** e.g. " pts" */
  suffix?: string;
  /** thousands separators; default true */
  group?: boolean;
};

export function makeFmt(f: NumFmt = {}) {
  const { decimals = 2, percent = false, prefix = "", suffix = "", group = true } = f;
  return (v: number): string => {
    const n = percent ? v * 100 : v;
    const s = group
      ? n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : n.toFixed(decimals);
    return `${prefix}${s}${percent ? "%" : ""}${suffix}`;
  };
}
