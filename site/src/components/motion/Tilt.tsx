"use client";

/* ============================================================================
   Pointer-driven 3-D tilt for free-standing cards. Writes --rx / --ry custom
   properties the .tilt rule (globals.css) turns into a perspective rotation;
   springs back to flat on leave. Disabled under prefers-reduced-motion. Keep it
   subtle (max ~7°) — tactility, not a fairground ride.
   ========================================================================== */

import { useEffect, useRef, type ReactNode } from "react";

export function Tilt({
  children,
  className = "",
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || reduced.current) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${px * max}deg`);
    el.style.setProperty("--ry", `${-py * max}deg`);
  }

  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div ref={ref} className={`tilt ${className}`} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </div>
  );
}
