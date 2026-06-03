/* ============================================================================
   Cinematic blue-hour mountain backdrop — GENERATED in the brand palette, not a
   photo. Why generated: it blends exactly (no foreign palette to fight), adds
   ~zero weight, and needs no licensing. Layered ridges give atmospheric
   perspective (lighter = farther), faint stars, and an aqua horizon glow; the
   front ridge is navy-sunken so it dissolves into the page below.

   Parallax: two layers share a `--ms-p` (scroll progress, -1..1, set by the
   parent — see EarlyAccess). The full scene drifts gently; a duplicate FRONT
   ridge drifts faster and opposite, so the ridges separate on scroll. The
   duplicate sits over the scene's own front ridge, so motion never opens a gap.
   Layers are oversized (-inset-y-8) to keep the drift covered. Default --ms-p=0
   → perfectly static (the reduced-motion / no-JS fallback). aria-hidden.
   ========================================================================== */

import type { CSSProperties } from "react";

const STARS = Array.from({ length: 44 }, (_, i) => ({
  x: (i * 137.508) % 1440,
  y: 12 + ((i * 53) % 232),
  r: 0.5 + ((i * 7) % 5) * 0.18,
  o: 0.16 + ((i * 11) % 6) * 0.07,
}));

const FRONT_RIDGE =
  "M0,500 L130,470 L250,492 L380,430 L520,486 L650,418 L780,478 L920,440 L1060,488 L1200,446 L1330,486 L1440,452 L1440,600 L0,600 Z";

const backStyle: CSSProperties = { transform: "translate3d(0, calc(var(--ms-p, 0) * 9px), 0)", willChange: "transform" };
const frontStyle: CSSProperties = { transform: "translate3d(0, calc(var(--ms-p, 0) * -26px), 0)", willChange: "transform" };

export function MountainScene() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* back layer — the full scene, gentle drift */}
      <svg className="absolute inset-x-0 -inset-y-8" style={backStyle} viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="ms-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#070b16" />
            <stop offset="55%" stopColor="#0a1020" />
            <stop offset="100%" stopColor="#0d1836" />
          </linearGradient>
          <radialGradient id="ms-glow" cx="58%" cy="66%" r="48%">
            <stop offset="0%" stopColor="#1FFFFF" stopOpacity="0.15" />
            <stop offset="55%" stopColor="#1FFFFF" stopOpacity="0.035" />
            <stop offset="100%" stopColor="#1FFFFF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ms-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1FFFFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#1FFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="1440" height="600" fill="url(#ms-sky)" />
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#EEEEEE" opacity={s.o} />
        ))}
        <rect width="1440" height="600" fill="url(#ms-glow)" />

        <path
          d="M0,380 L90,360 L180,372 L300,318 L420,352 L540,300 L660,344 L780,312 L900,356 L1020,326 L1140,360 L1260,330 L1380,366 L1440,348 L1440,600 L0,600 Z"
          fill="#16203c"
          opacity="0.9"
        />
        <rect y="300" width="1440" height="130" fill="url(#ms-haze)" />
        <path
          d="M0,440 L110,410 L220,430 L340,372 L470,418 L600,360 L730,412 L860,376 L990,420 L1120,384 L1250,424 L1370,392 L1440,420 L1440,600 L0,600 Z"
          fill="#0e152a"
        />
        <path d={FRONT_RIDGE} fill="#070b16" />
      </svg>

      {/* front layer — duplicate front ridge, faster + opposite drift */}
      <svg className="absolute inset-x-0 -inset-y-8" style={frontStyle} viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice">
        <path d={FRONT_RIDGE} fill="#070b16" />
      </svg>
    </div>
  );
}
