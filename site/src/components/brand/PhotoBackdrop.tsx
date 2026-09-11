/* ============================================================================
   Photo backdrop — a real photograph as a TRUE full-bleed section background.

   The photo fills the entire section edge-to-edge with `object-cover` (spans
   the whole screen width, never boxed into the middle). Image is decorative →
   aria-hidden. Static-export friendly (plain <img> from /public — no
   next/image config needed).

   THREE OVERLAY MODES.

     "left"   the original: a left-weighted navy gradient behind a left-aligned
              headline, right side left clear and vivid.
     "center" a soft ellipse behind a CENTRED headline. The landing hero needs
              this: its headline moved to the middle, where "left" has already
              faded to 5% and does nothing. Measured there, white type sat at
              2.7:1 against the bright sky — under the 3.0 large-text floor.
     false    no wash at all, photo in its true colour.

   Why an ellipse rather than a stronger flat wash: turning "left" back on for
   the landing hero read as grey across the whole picture (Harsha, 7 Sep). The
   ellipse is dark where the words are and gone by the edges, so the mountains
   keep their colour.
   ========================================================================== */

const NAVY = "10, 12, 20"; // --color-navy #0a0c14, as rgb channels for overlays

export type Wash = boolean | "left" | "center";

export function PhotoBackdrop({
  src,
  className = "",
  position = "center",
  overlay = true,
  /** vertical centre of the "center" ellipse, matching where the text sits */
  focusY = "63%",
}: {
  src: string;
  className?: string;
  position?: string;
  overlay?: Wash;
  focusY?: string;
}) {
  const mode: "left" | "center" | null =
    overlay === false ? null : overlay === "center" ? "center" : "left";

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

      {mode === "left" ? (
        /* readability wash — weighted to the left (behind the headline); right stays clear */
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(90deg, rgba(${NAVY},0.74) 0%, rgba(${NAVY},0.34) 32%, rgba(${NAVY},0.05) 60%)` }}
        />
      ) : null}

      {mode === "center" ? (
        /* Wide, shallow ellipse over the text block. Wider than it is tall so it
           follows a line of type rather than pooling in the middle, and it is
           fully transparent by the frame edge so the photograph is untouched
           where nothing is written over it. */
        <div
          className="absolute inset-0"
          style={{
            background:
              `radial-gradient(ellipse 78% 42% at 50% ${focusY}, ` +
              `rgba(${NAVY},0.62) 0%, rgba(${NAVY},0.45) 38%, ` +
              `rgba(${NAVY},0.16) 68%, rgba(${NAVY},0) 100%)`,
          }}
        />
      ) : null}

      {mode ? (
        /* dissolve into the section below */
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: `linear-gradient(to bottom, transparent, rgba(${NAVY},1))` }}
        />
      ) : null}
    </div>
  );
}
