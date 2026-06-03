"use client";

/* ============================================================================
   Hero deep-field backdrop — the landing-hero background (replaces the old
   graph-paper grid). Aesthetic: "observatory".

   An azimuthal map graticule (concentric parallels + meridian spokes from a
   focal point off the left edge) is the coordinate field the world-globe sits
   in; over it sits a soft studio light and a pointer-reactive luminance that
   give the dark navy real depth.

   Every layer is decorative (aria-hidden, pointer-events:none) and GPU-cheap
   (gradients + transform/opacity). Under reduced-motion or a coarse pointer the
   cursor glow simply rests centered — a calm static fallback, no JS required.
   ========================================================================== */

import { useEffect, useRef } from "react";

/* Focal point off the left edge → only sweeping arcs enter the frame; the
   container mask fades them out before the globe. Colours are the brand
   constants (pearl / aqua), matching the other inline SVGs in this codebase. */
function Graticule() {
  const cx = -140;
  const cy = 380;
  const reach = 1360;
  const parallels = [360, 500, 640, 780, 920, 1060, 1200];
  const spokes = Array.from({ length: 7 }, (_, i) => -33 + i * 11);
  const ray = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return { x2: cx + reach * Math.cos(a), y2: cy + reach * Math.sin(a) };
  };

  return (
    <div className="hero-backdrop__grat">
      <svg viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g fill="none" stroke="#EEEEEE" strokeOpacity="0.05" strokeWidth="1" vectorEffect="non-scaling-stroke">
          {parallels.map((r) => (
            <circle key={`p${r}`} cx={cx} cy={cy} r={r} />
          ))}
          {spokes.map((d) => {
            const { x2, y2 } = ray(d);
            return <line key={`s${d}`} x1={cx} y1={cy} x2={x2} y2={y2} />;
          })}
        </g>
        {/* surgical aqua — a single charged parallel + meridian (the "horizon") */}
        <g fill="none" stroke="#1FFFFF" strokeOpacity="0.13" strokeWidth="1" vectorEffect="non-scaling-stroke">
          <circle cx={cx} cy={cy} r={780} />
          {(() => {
            const { x2, y2 } = ray(-9.5);
            return <line x1={cx} y1={cy} x2={x2} y2={y2} />;
          })()}
        </g>
      </svg>
    </div>
  );
}

export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only the alive layer is conditional — the static glow is the CSS default.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const host = el.parentElement ?? el;
    let raf = 0;
    let tx = 50;
    let ty = 34;
    let mx = 50;
    let my = 34; // percentages — target (t*) eased toward by current (m*)

    const tick = () => {
      mx += (tx - mx) * 0.09;
      my += (ty - my) * 0.09;
      el.style.setProperty("--mx", `${mx.toFixed(2)}%`);
      el.style.setProperty("--my", `${my.toFixed(2)}%`);
      raf = Math.hypot(tx - mx, ty - my) > 0.15 ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    host.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      host.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="hero-backdrop" aria-hidden="true">
      <div className="hero-backdrop__light" />
      <Graticule />
      <div className="hero-backdrop__beam" />
    </div>
  );
}
