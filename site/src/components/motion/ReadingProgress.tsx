"use client";

/* A slim aqua reading-progress bar pinned to the very top of article pages.
   Tracks document scroll; sits above the sticky nav. Purely informational, so
   it stays useful under reduced-motion (no easing, just the fill width). */

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5" aria-hidden="true">
      <div className="h-full origin-left bg-aqua/90" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}
