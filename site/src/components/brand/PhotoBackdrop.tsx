/* ============================================================================
   Photo backdrop — a full-bleed photograph under a navy wash. Replaces the
   generated hero backdrop with real imagery (Framer-style) while keeping the
   brand's dark canvas: a flat navy tint unifies the tone, a left-weighted
   gradient keeps the headline legible, and the base dissolves into the page
   below. Image is decorative → aria-hidden. Static-export friendly (plain
   <img> from /public — no next/image config needed).
   ========================================================================== */

const NAVY = "10, 15, 30"; // --color-navy #0a0f1e, as rgb channels for overlays

export function PhotoBackdrop({
  src,
  position = "center",
  className = "",
}: {
  src: string;
  /** object-position for the photo (e.g. "center", "50% 35%") */
  position?: string;
  className?: string;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <img
        src={src}
        alt=""
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: position }}
      />
      {/* tone wash — pull the photo toward the brand navy */}
      <div className="absolute inset-0" style={{ background: `rgba(${NAVY}, 0.34)` }} />
      {/* readability — darker behind the (left) headline, clearing toward the right */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(90deg, rgba(${NAVY},0.92) 0%, rgba(${NAVY},0.6) 40%, rgba(${NAVY},0.2) 100%)` }}
      />
      {/* dissolve into the section below */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{ background: `linear-gradient(to bottom, transparent, rgba(${NAVY},1))` }}
      />
    </div>
  );
}
