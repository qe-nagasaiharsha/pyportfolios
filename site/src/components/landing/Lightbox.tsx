"use client";

/* Click-to-enlarge. One delegated listener (mounted once) opens any element
   tagged with data-zoom in a centred overlay — same pattern as the global
   Lenis anchor handler in SmoothScroll.

   Two kinds of content:
   • images (map, logos) — shown at intrinsic resolution capped to the viewport
     (no forced upscaling, so logos stay crisp), on a WHITE panel so transparent
     brand marks read the same as on their chips.
   • inline figures/SVG charts — cloned and scaled up on a DARK panel (the charts
     are drawn for the dark theme); vector art stays sharp at any size.

   Esc / backdrop / ✕ close it; Enter or Space activates a focused trigger;
   background scroll is locked while open. */

import { useCallback, useEffect, useRef, useState } from "react";

type Item =
  | { kind: "image"; src: string; alt: string }
  | { kind: "node"; html: string; label: string };

export function Lightbox() {
  const [item, setItem] = useState<Item | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const openFrom = useCallback((el: HTMLElement) => {
    const img = (el.tagName === "IMG" ? el : el.querySelector("img")) as HTMLImageElement | null;
    if (img) {
      setItem({
        kind: "image",
        src: img.currentSrc || img.getAttribute("src") || "",
        alt: img.getAttribute("alt") || "",
      });
      return;
    }
    // No image inside → clone the element's markup (e.g. an SVG chart figure).
    setItem({ kind: "node", html: el.outerHTML, label: el.getAttribute("aria-label") || "Figure" });
  }, []);

  // Delegated click + keyboard activation for any [data-zoom] trigger.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-zoom]");
      if (!el) return;
      e.preventDefault();
      openFrom(el);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setItem(null);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        const el = document.activeElement as HTMLElement | null;
        if (el?.matches?.("[data-zoom]")) {
          e.preventDefault();
          openFrom(el);
        }
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openFrom]);

  // Lock background scroll and manage focus while open.
  useEffect(() => {
    if (!item) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      html.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [item]);

  if (!item) return null;

  const label = item.kind === "image" ? item.alt : item.label;
  const caption = item.kind === "image" ? item.alt.replace(/\s*logo$/i, "") : "";
  // logos (exchanges/libraries/indices) enlarge to a fixed card so they're all the same size;
  // the map and other images keep their large intrinsic view.
  const isLogo = item.kind === "image" && item.src.includes("/logos/");

  return (
    <div
      className="lb-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-navy/92 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={label || "Enlarged view"}
      onClick={() => setItem(null)}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={() => setItem(null)}
        aria-label="Close"
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-pearl/25 text-pearl/80 transition-colors duration-200 hover:border-aqua hover:text-aqua"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {item.kind === "image" ? (
        isLogo ? (
          <figure
            className="lb-panel relative flex flex-col items-center justify-center gap-5 rounded-sm bg-white p-8 shadow-2xl"
            style={{ width: "min(460px, 92vw)", height: "min(320px, 80vh)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt={item.alt} className="max-h-[52%] max-w-[74%] object-contain" />
            {caption ? (
              <figcaption className="text-xs leading-relaxed text-navy/55">{caption}</figcaption>
            ) : null}
          </figure>
        ) : (
          <figure
            className="lb-panel relative max-h-[92vh] max-w-[94vw] overflow-auto rounded-sm bg-white p-5 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={item.alt}
              className="mx-auto block h-auto max-h-[80vh] w-auto max-w-full object-contain"
            />
            {caption ? (
              <figcaption className="mx-auto mt-4 max-w-2xl text-center text-xs leading-relaxed text-navy/55">
                {caption}
              </figcaption>
            ) : null}
          </figure>
        )
      ) : (
        <div
          className="lb-panel lb-node max-h-[90vh] w-[min(92vw,1080px)] overflow-auto"
          onClick={(e) => e.stopPropagation()}
          dangerouslySetInnerHTML={{ __html: item.html }}
        />
      )}
    </div>
  );
}
