/* Fortitudo crest — helmet + sword in a shield (deck §02).
   Monoline, single aqua accent (the pommel). Tone adapts to surface. */

interface CrestProps {
  size?: number;
  tone?: "light" | "dark"; // light = pearl stroke (dark bg); dark = anthracite (light bg)
  className?: string;
}

export function Crest({ size = 36, tone = "light", className }: CrestProps) {
  const stroke = tone === "light" ? "#EEEEEE" : "#151515";
  return (
    <svg
      width={size}
      height={(size * 72) / 64}
      viewBox="0 0 64 72"
      fill="none"
      className={className}
      role="img"
      aria-label="pyportfolios crest"
    >
      {/* shield — protection */}
      <path
        d="M32 5 L58 15 L58 36 C58 52 46 64 32 68 C18 64 6 52 6 36 L6 15 Z"
        stroke={stroke}
        strokeOpacity="0.85"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* inner keepline */}
      <path
        d="M32 11 L52 19 L52 35 C52 47 43 56 32 60 C21 56 12 47 12 35 L12 19 Z"
        stroke={stroke}
        strokeOpacity="0.28"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* helmet — a visored dome */}
      <path
        d="M22 30 C22 23 27 19 32 19 C37 19 42 23 42 30"
        stroke={stroke}
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M24 30 L40 30" stroke={stroke} strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
      {/* sword — decisiveness (blade down through the guard) */}
      <path d="M32 34 L32 56" stroke={stroke} strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" />
      <path d="M25 38 L39 38" stroke={stroke} strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" />
      {/* aqua accent — the charged pommel */}
      <circle cx="32" cy="34" r="2.6" fill="#1FFFFF" />
    </svg>
  );
}

/* Full lockup: crest + wordmark + aqua dot */
export function CrestLockup({
  tone = "light",
  size = 30,
  className,
}: {
  tone?: "light" | "dark";
  size?: number;
  className?: string;
}) {
  const word = tone === "light" ? "text-pearl" : "text-anthracite";
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <Crest size={size} tone={tone} />
      <span className="flex items-baseline gap-1">
        <span className={`text-lg tracking-tight ${word}`} style={{ fontWeight: 900 }}>
          pyportfolios
        </span>
        <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-aqua" aria-hidden="true" />
      </span>
    </span>
  );
}
