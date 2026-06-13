"use client";

/* On-this-page table of contents — a vertical rail fixed to the left edge,
   anchored near the top of the viewport (by the start of the content). It only
   shows for the body of the page: it slides in once the world-clock ribbon has
   scrolled past, and slides back out once you've scrolled past the FAQ. It
   tracks the section you're reading (a "scroll-spy", via IntersectionObserver),
   growing a tick-mark and lighting the number + label for the active section.
   Clicks fall through to the global Lenis hash handler (see SmoothScroll), so
   jumps ease with the same -80 offset as the rest of the site. Hidden below xl,
   where there isn't side room for a rail. */

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "focus", no: "01", label: "Our Focus" },
  { id: "libraries", no: "02", label: "Libraries" },
  { id: "markets", no: "03", label: "Markets" },
  { id: "geographies", no: "04", label: "Geographies" },
  { id: "concepts", no: "05", label: "Concepts" },
  { id: "pricing", no: "06", label: "Pricing" },
  { id: "faq", no: "07", label: "FAQ" },
] as const;

export function PageTOC() {
  const [active, setActive] = useState<string>("");
  const [reachedFocus, setReachedFocus] = useState(false);
  const [pastFaq, setPastFaq] = useState(false);

  // Gate visibility between the first section and the FAQ:
  //  • appear as "01 Our Focus" comes into view (its top reaches the upper
  //    ~third), staying shown as you read on through the body, and
  //  • disappear as the last FAQ is about to leave the top of the screen.
  // Both flip back as you scroll the other way, so the rail is only ever
  // present for the main body of the page.
  useEffect(() => {
    const focus = document.getElementById("focus");
    // The question list, not the padded <section> — its bottom sits right at the
    // last FAQ, so the rail hides the moment that question slides off the top
    // (rather than waiting out the section's tall bottom padding).
    const faqList = document.getElementById("faq-list");
    const focusIO = focus
      ? new IntersectionObserver(
          // Show once Our Focus enters the upper third (intersecting the band),
          // and keep it shown after its top scrolls above (top < 0).
          ([entry]) => setReachedFocus(entry.isIntersecting || entry.boundingClientRect.top < 0),
          { threshold: 0, rootMargin: "0px 0px -82% 0px" },
        )
      : null;
    const faqIO = faqList
      ? new IntersectionObserver(
          ([entry]) => setPastFaq(!entry.isIntersecting && entry.boundingClientRect.top < 0),
          // -30% top inset puts the trigger line ~a third down the viewport, so
          // the rail hides as the last FAQ slides up toward the top — well before
          // the "Get the first lessons free" CTA reaches the centre.
          { threshold: 0, rootMargin: "-30% 0px 0px 0px" },
        )
      : null;
    if (focus && focusIO) focusIO.observe(focus);
    if (faqList && faqIO) faqIO.observe(faqList);
    return () => {
      focusIO?.disconnect();
      faqIO?.disconnect();
    };
  }, []);

  // Scroll-spy: the section whose top sits highest within a band across the
  // viewport's middle wins, so the active tab flips at a natural reading line.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="On this page"
      // Anchor the rail to the left gutter just outside the centred max-w-6xl
      // (72rem) column so it tracks the content edge. The max(1rem, …) clamp
      // keeps it on-screen at narrower widths, where globals.css reserves a left
      // lane on the body sections so text never overlaps the rail.
      style={{ left: "max(1rem, calc((100vw - 72rem) / 2 - 11rem))" }}
      className={`fixed top-28 z-30 hidden flex-col gap-0.5 transition-opacity duration-300 lg:flex print:hidden ${
        reachedFocus && !pastFaq ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {SECTIONS.map((s) => {
        const on = active === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            data-toc={s.id}
            aria-current={on ? "true" : undefined}
            className="group flex items-center gap-3 py-1.5"
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300 ${
                on
                  ? "bg-aqua"
                  : "bg-steel/60 group-hover:bg-pearl"
              }`}
            />
            <span
              className={`tabular-nums t-mono text-[0.78rem] transition-colors duration-200 ${
                on ? "text-aqua" : "text-steel/70 group-hover:text-pearl"
              }`}
            >
              {s.no}
            </span>
            <span
              className={`t-mono text-[0.78rem] uppercase tracking-[0.16em] transition-colors duration-200 ${
                on
                  ? "text-aqua"
                  : "text-steel group-hover:text-pearl"
              }`}
            >
              {s.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
