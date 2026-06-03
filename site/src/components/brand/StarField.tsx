/* ============================================================================
   Generated night sky — a faint starfield over a soft nebula haze with a quiet
   aqua glow, in the brand palette (GENERATED, not a photo). A few hairline
   constellation links add structure without noise. Cohesive with MountainScene's
   stars. Edges fade via a radial mask. Deterministic → stable SSR.
   Decorative → aria-hidden.
   ========================================================================== */

const STARS = Array.from({ length: 72 }, (_, i) => ({
  x: (i * 137.508) % 1440,
  y: (i * 89.13) % 480,
  r: 0.4 + ((i * 7) % 6) * 0.16,
  o: 0.08 + ((i * 11) % 7) * 0.05,
}));

// faint links between a handful of stars — abstract constellations, not literal
const LINKS = [[3, 7], [7, 12], [21, 27], [27, 33], [45, 51], [51, 58]] as const;

export function StarField({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_88%_92%_at_50%_42%,#000_50%,transparent)]"
        viewBox="0 0 1440 480"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="sf-neb" cx="30%" cy="24%" r="62%">
            <stop offset="0%" stopColor="#1FFFFF" stopOpacity="0.07" />
            <stop offset="60%" stopColor="#2a3c78" stopOpacity="0.045" />
            <stop offset="100%" stopColor="#2a3c78" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sf-neb2" cx="80%" cy="78%" r="54%">
            <stop offset="0%" stopColor="#4060aa" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#4060aa" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1440" height="480" fill="url(#sf-neb)" />
        <rect width="1440" height="480" fill="url(#sf-neb2)" />

        <g stroke="#1FFFFF" strokeOpacity="0.07" strokeWidth="1">
          {LINKS.map(([a, b], i) => (
            <line key={i} x1={STARS[a].x} y1={STARS[a].y} x2={STARS[b].x} y2={STARS[b].y} />
          ))}
        </g>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#EEEEEE" opacity={s.o} />
        ))}
      </svg>
    </div>
  );
}
