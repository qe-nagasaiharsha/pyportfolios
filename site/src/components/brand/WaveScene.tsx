/* ============================================================================
   Generated wave field — flowing layered swells in the brand's blue-hour
   palette (a sea/dune horizon, GENERATED, not a photo). Cohesive with
   MountainScene: identical ridge colours, faint stars overhead, and an aqua
   crest glint on the far swell. Edges fade via a radial mask so it never butts
   the section borders. Deterministic (no Math.random) → stable SSR.
   Decorative → aria-hidden.
   ========================================================================== */

const STARS = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 197.327) % 1440,
  y: 8 + ((i * 41) % 120),
  r: 0.5 + ((i * 5) % 4) * 0.18,
  o: 0.1 + ((i * 13) % 5) * 0.06,
}));

/* sampled crest of one swell — a sum of two sines for an organic, non-repeating
   profile. Returned as raw "x,y" points so we can both stroke the crest and
   close it into a filled body. */
function crest(baseY: number, amp: number, len: number, phase: number): string[] {
  const pts: string[] = [];
  for (let x = 0; x <= 1440; x += 24) {
    const y = baseY + amp * Math.sin(x / len + phase) + amp * 0.32 * Math.sin(x / (len * 0.4) + phase * 1.7);
    pts.push(`${x},${Math.round(y * 10) / 10}`);
  }
  return pts;
}
const line = (pts: string[]) => `M${pts.map((p, i) => (i ? "L" : "") + p).join(" ")}`;
const body = (pts: string[]) => `${line(pts)} L1440,420 L0,420 Z`;

export function WaveScene({ className = "" }: { className?: string }) {
  const far = crest(250, 26, 250, 0.4);
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_92%_82%_at_50%_46%,#000_56%,transparent)]"
        viewBox="0 0 1440 420"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <radialGradient id="wv-glow" cx="62%" cy="58%" r="46%">
            <stop offset="0%" stopColor="#1FFFFF" stopOpacity="0.13" />
            <stop offset="55%" stopColor="#1FFFFF" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#1FFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#EEEEEE" opacity={s.o} />
        ))}
        <rect width="1440" height="420" fill="url(#wv-glow)" />

        {/* far swell + its aqua crest glint */}
        <path d={body(far)} fill="#16203c" opacity="0.85" />
        <path d={line(far)} fill="none" stroke="#1FFFFF" strokeOpacity="0.16" strokeWidth="1.25" />
        {/* mid + front swells dissolve into the page */}
        <path d={body(crest(300, 22, 200, 1.3))} fill="#0e152a" />
        <path d={body(crest(352, 18, 168, 2.2))} fill="#070b16" />
      </svg>
    </div>
  );
}
