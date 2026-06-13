"use client";

/* ============================================================================
   BookShelf — the canon as a cover-led, filterable shelf.
   • Category tabs (All + the 7 themes) filter the grid; switching re-keys the
     grid so cards re-stagger in (Framer-style).
   • Each book is a card: a cover (real image if provided, else a styled
     typographic cover), title / author, and a "Why it matters" accordion that
     expands its 2–3 bullets via a grid-rows height transition.
   • Entrance is scroll-triggered (IntersectionObserver) with a per-card delay;
     reduced-motion shows everything immediately.
   Pure CSS motion — no animation library — so it ships in the static export.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import type { BookGroup, Book } from "@/lib/literature";

type FlatBook = Book & { theme: string; catNo: string; index: number };

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Styled typographic cover — used when a book has no real cover image. */
function FallbackCover({ index, theme }: { index: number; theme: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-navy-elevated to-navy-sunken">
      <div className="grid-paper absolute inset-0 opacity-40" aria-hidden="true" />
      <div
        className="absolute -right-10 -bottom-16 h-48 w-48 rounded-full opacity-[0.07] blur-2xl"
        style={{ background: "radial-gradient(circle, var(--color-aqua), transparent 70%)" }}
        aria-hidden="true"
      />
      {/* spine */}
      <span className="absolute inset-y-0 left-0 w-1 bg-aqua/40 transition-colors duration-300 group-hover:bg-aqua/70" aria-hidden="true" />
      {/* big faint index — drifts up a touch on hover */}
      <span className="absolute right-4 bottom-1 select-none font-serif text-[5.5rem] leading-none text-pearl/[0.06] transition-transform duration-500 group-hover:-translate-y-1" aria-hidden="true">
        {String(index).padStart(2, "0")}
      </span>
      <span className="absolute left-5 top-5 t-mono text-[0.56rem] uppercase tracking-[0.18em] text-aqua/70">{theme}</span>
    </div>
  );
}

function BookCard({ book }: { book: FlatBook }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="group flex flex-col overflow-hidden rounded-sm border border-pearl/10 bg-navy-elevated/40 transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1.5 hover:border-aqua/40 hover:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.8)]">
      {/* cover */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {book.cover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/covers/${book.cover}`}
            alt={`${book.title} cover`}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]">
            <FallbackCover index={book.index} theme={book.theme} />
          </div>
        )}
        {/* sheen sweep on hover */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-pearl/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" aria-hidden="true" />
      </div>

      {/* meta */}
      <div className="flex flex-1 flex-col p-5">
        <p className="t-mono text-[0.6rem] uppercase tracking-[0.16em] text-aqua/70">
          {book.catNo} · {book.theme}
        </p>
        <h4 className="mt-2 font-serif text-lg leading-snug text-pearl">{book.title}</h4>
        <p className="mt-1.5 t-mono text-[0.64rem] uppercase tracking-[0.12em] text-steel">
          {book.author} · {book.year}
        </p>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-full items-center justify-between border-t border-pearl/10 pt-3 text-left t-mono text-[0.66rem] uppercase tracking-[0.16em] text-pearl/80 transition-colors duration-200 hover:text-aqua"
          >
            <span>Why it matters</span>
            <Chevron open={open} />
          </button>

          {/* grid-rows accordion — animates height smoothly */}
          <div
            className={`grid transition-[grid-template-rows] duration-500 ease-out ${
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <ul className="mt-3 space-y-2.5">
                {book.why.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-mist">
                    <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-aqua/70" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function BookShelf({ groups }: { groups: BookGroup[] }) {
  // Flatten with category number + a global running index (for cover numerals).
  let running = 0;
  const all: FlatBook[] = groups.flatMap((g, gi) =>
    g.books.map((b) => {
      running += 1;
      return { ...b, theme: g.theme, catNo: String(gi + 1).padStart(2, "0"), index: running };
    }),
  );

  const tabs = ["All", ...groups.map((g) => g.theme)];
  const [active, setActive] = useState<string>("All");
  const visible = active === "All" ? all : all.filter((b) => b.theme === active);

  // Scroll-triggered entrance. `armed` is only set once JS confirms motion is on,
  // so the server / no-JS render leaves every card visible (no hidden content).
  const [armed, setArmed] = useState(false);
  const [inView, setInView] = useState(false);
  const shelfRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // stay visible, no motion
    const el = shelfRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    setArmed(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={shelfRef}>
      {/* tabs */}
      <div className="toc-scroll -mx-2 mb-10 flex gap-1 overflow-x-auto px-2 pb-2">
        {tabs.map((t) => {
          const on = active === t;
          const count = t === "All" ? all.length : all.filter((b) => b.theme === t).length;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setActive(t)}
              aria-pressed={on}
              className={`group/tab shrink-0 whitespace-nowrap rounded-full border px-4 py-2 t-mono text-[0.64rem] uppercase tracking-[0.14em] transition-colors duration-200 ${
                on
                  ? "border-aqua/60 bg-aqua/10 text-aqua"
                  : "border-pearl/12 text-steel hover:border-pearl/30 hover:text-pearl"
              }`}
            >
              {t}
              <span className={`ml-2 tabular-nums ${on ? "text-aqua/70" : "text-steel/60"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* grid — re-keyed by active tab so cards re-stagger in */}
      <div key={active} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((book, i) => (
          <div
            key={`${book.theme}-${book.title}`}
            className={!armed ? "" : inView ? "book-in" : "opacity-0"}
            style={armed && inView ? { animationDelay: `${Math.min(i, 12) * 55}ms` } : undefined}
          >
            <BookCard book={book} />
          </div>
        ))}
      </div>
    </div>
  );
}
