/* Editorial imagery treatment (deck §05): contemporary, high-resolution feel,
   muted borders, a single fresh aqua accent. These are tasteful *duotone
   placeholders* (pure SVG/CSS) standing in for licensed photography — real
   photos drop into the same frame later. Kept deliberately simple & flat so it
   serializes cleanly under static export. */

type Scene = "skyline" | "summit";

interface PhotoPlateProps {
  scene?: Scene;
  caption?: string;
  className?: string;
}

// flat, keyed building list: [x, y, w, h]
const BUILDINGS: ReadonlyArray<readonly [number, number, number, number]> = [
  [40, 230, 46, 170], [92, 190, 38, 210], [136, 250, 30, 150],
  [172, 150, 52, 250], [230, 210, 40, 190], [276, 120, 44, 280],
  [326, 200, 34, 200], [366, 170, 48, 230], [420, 240, 36, 160],
  [462, 140, 50, 260], [518, 200, 40, 200], [564, 180, 44, 220],
];

// lit windows on the hero tower — flat list, one aqua accent
const WINDOWS: ReadonlyArray<readonly [number, number, boolean]> = [
  [288, 150, false], [288, 176, false], [288, 202, false],
  [296, 150, false], [296, 176, true], [296, 202, false],
  [304, 150, false], [304, 176, false], [304, 202, false],
];

export function PhotoPlate({ scene = "skyline", caption, className }: PhotoPlateProps) {
  const gid = `pp-${scene}`;
  return (
    <figure
      className={`corner-ticks group relative overflow-hidden rounded-sm border border-pearl/12 ${className ?? ""}`}
    >
      <div className="photo-duotone aspect-[16/10] w-full">
        <svg viewBox="0 0 640 400" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e152a" />
              <stop offset="100%" stopColor="#070b16" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="640" height="400" fill={`url(#${gid})`} />

          {scene === "skyline" ? (
            <g>
              {BUILDINGS.map(([x, y, w, h], i) => (
                <rect key={`b${i}`} x={x} y={y} width={w} height={h} fill="#0b1226"
                  stroke="#1FFFFF" strokeOpacity={i === 5 ? 0.4 : 0.08} strokeWidth="1" />
              ))}
              {WINDOWS.map(([x, y, accent], i) => (
                <rect key={`w${i}`} x={x} y={y} width="4" height="6" fill="#1FFFFF"
                  opacity={accent ? 0.9 : 0.18} />
              ))}
            </g>
          ) : (
            <g>
              <path d="M0 380 L120 250 L210 300 L330 170 L430 240 L540 130 L640 200 L640 400 L0 400 Z" fill="#0b1226" />
              <path d="M0 380 L120 250 L210 300 L330 170 L430 240 L540 130 L640 200" fill="none" stroke="#1FFFFF" strokeOpacity="0.5" strokeWidth="1.5" />
              <circle cx="540" cy="130" r="3.5" fill="#1FFFFF" />
            </g>
          )}
        </svg>
      </div>
      {caption ? (
        <figcaption className="absolute inset-x-0 bottom-0 border-t border-pearl/10 bg-navy/60 px-4 py-2.5 backdrop-blur-sm">
          <span className="t-mono text-[0.65rem] uppercase tracking-[0.2em] text-mist">{caption}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
