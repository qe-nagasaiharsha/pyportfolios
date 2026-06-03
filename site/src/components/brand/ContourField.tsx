/* ============================================================================
   Topographic contour field — faint stacked terrain lines, generated in the
   brand palette. A quiet "quant terrain" texture for section breaks. Pearl at
   very low opacity; edges fade via a radial mask so it never butts the borders.
   Decorative → aria-hidden. Deterministic (no Math.random) for stable SSR.
   ========================================================================== */

const LINES = Array.from({ length: 11 }, (_, j) => {
  const baseY = 26 + j * 34;
  const amp = 13 + (j % 3) * 8;
  const phase = j * 0.85;
  const pts: string[] = [];
  for (let x = 0; x <= 1440; x += 60) {
    const y = baseY + amp * Math.sin(x / 230 + phase) + amp * 0.45 * Math.sin(x / 88 + phase * 1.7);
    pts.push(`${x},${Math.round(y * 10) / 10}`);
  }
  return pts.join(" ");
});

export function ContourField({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_80%_90%_at_50%_50%,#000_55%,transparent)] ${className}`}
      viewBox="0 0 1440 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {LINES.map((p, i) => (
        <polyline key={i} points={p} fill="none" stroke="#EEEEEE" strokeOpacity={0.05 + (i % 3) * 0.012} strokeWidth="1" />
      ))}
    </svg>
  );
}
