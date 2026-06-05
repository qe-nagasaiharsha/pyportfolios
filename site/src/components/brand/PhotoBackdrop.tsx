/* ============================================================================
   Photo backdrop — a real photograph as a TRUE full-bleed section background.

   The photo fills the entire section edge-to-edge with `object-cover` (spans
   the whole screen width, never boxed into the middle). A left-weighted navy
   gradient keeps the headline legible while the right stays clear and vivid;
   the base dissolves into the page below.

   Image is decorative → aria-hidden. Static-export friendly (plain <img> from
   /public — no next/image config needed).
   ========================================================================== */

const NAVY = "10, 12, 20"; // --color-navy #0a0c14, as rgb channels for overlays

export function PhotoBackdrop({
  src,
  className = "",
  position = "center",
}: {
  src: string;
  className?: string;
  position?: string;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden bg-navy ${className}`} aria-hidden="true">
      {/* the photograph, full-bleed — object-cover spans the whole width edge-to-edge */}
      <img
        src={src}
        alt=""
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: position }}
      />
      {/* readability wash — weighted to the left (behind the headline); right stays clear */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(90deg, rgba(${NAVY},0.74) 0%, rgba(${NAVY},0.34) 32%, rgba(${NAVY},0.05) 60%)` }}
      />
      {/* dissolve into the section below */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: `linear-gradient(to bottom, transparent, rgba(${NAVY},1))` }}
      />
    </div>
  );
}
