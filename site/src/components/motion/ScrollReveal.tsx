"use client";

/* ============================================================================
   Site-wide scroll reveal (cross-browser). Adds `reveal-js` to <html> so the
   hide-styles in globals.css apply ONLY when JS is present — no-JS keeps every
   element visible (good for crawlers / fallback). Each [data-reveal] then
   reveals as it enters the viewport; any chart inside it (.draw-path / .grow-bar)
   animates at the same moment. Honors prefers-reduced-motion by doing nothing
   (so nothing is ever hidden). Mount once per page.
   ========================================================================== */

import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // leave everything visible, no motion

    const root = document.documentElement;
    root.classList.add("reveal-js");

    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window) || els.length === 0) {
      els.forEach((el) => el.classList.add("in-view"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
