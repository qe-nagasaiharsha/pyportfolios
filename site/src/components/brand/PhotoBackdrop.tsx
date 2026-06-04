/* ============================================================================
   Photo backdrop — a real photograph as a full-bleed section background.

   The whole image stays visible: a sharp `object-contain` layer shows the
   ENTIRE photo (never cropped), and a blurred `object-cover` layer fills the
   letterbox margins so it still reads full-bleed (no empty bars). A light,
   left-weighted navy gradient keeps the headline legible while leaving the
   photo clear and vivid; the base dissolves into the page below.

   Image is decorative → aria-hidden. Static-export friendly (plain <img> from
   /public — no next/image config needed).
   ========================================================================== */

const NAVY = "10, 15, 30"; // --color-navy #0a0f1e, as rgb channels for overlays

export function PhotoBackdrop({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden bg-navy ${className}`} aria-hidden="true">
      {/* blurred cover fill — removes the letterbox bars so the photo reads full-bleed */}
      <img src={src} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
      {/* the photograph in full — object-contain keeps the ENTIRE scene visible */}
      <img src={src} alt="" decoding="async" className="absolute inset-0 h-full w-full object-contain" />
      {/* readability wash — weighted to the left (behind the headline); right stays clear */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(90deg, rgba(${NAVY},0.66) 0%, rgba(${NAVY},0.26) 30%, rgba(${NAVY},0) 55%)` }}
      />
      {/* dissolve into the section below */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/4"
        style={{ background: `linear-gradient(to bottom, transparent, rgba(${NAVY},1))` }}
      />
    </div>
  );
}
