"use client";

/* ============================================================================
   BookShelf — the recommended library as a cover-led, hover-reveal shelf.
   • Category tabs (All + the 7 disciplines) filter the grid; switching re-keys
     the grid so cards re-stagger in (Framer-style entrance).
   • Each card shows the real book cover (or a styled typographic fallback) with
     the title/author always legible at the foot. On hover OR keyboard focus a
     scrim rises and the "why it matters" bullets fade up one-by-one, with the
     full citation underneath — the intelligent detail layer.
   • Entrance is scroll-triggered (IntersectionObserver) with a per-card delay;
     reduced-motion / no-JS leaves everything visible.
   Pure CSS motion — no animation library — so it ships in the static export.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import type { BookGroup, Book } from "@/lib/literature";

type FlatBook = Book & { theme: string; catNo: string; index: number; shortTitle: string };

/* Styled typographic cover — used when a book has no real cover image. */
function FallbackCover({ index, theme, title }: { index: number; theme: string; title: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-navy-elevated to-navy-sunken">
      <div className="grid-paper absolute inset-0 opacity-40" aria-hidden="true" />
      <div
        className="absolute -right-10 -bottom-16 h-48 w-48 rounded-full opacity-[0.08] blur-2xl"
        style={{ background: "radial-gradient(circle, var(--color-aqua), transparent 70%)" }}
        aria-hidden="true"
      />
      <span className="absolute inset-y-0 left-0 w-1 bg-aqua/40 transition-colors duration-300 group-hover:bg-aqua/70" aria-hidden="true" />
      <span className="absolute right-3 bottom-0 select-none font-serif text-[5.5rem] leading-none text-pearl/[0.06] transition-transform duration-500 group-hover:-translate-y-1" aria-hidden="true">
        {String(index).padStart(2, "0")}
      </span>
      <span className="absolute left-4 top-4 t-mono text-[0.52rem] uppercase tracking-[0.18em] text-aqua/70">{theme}</span>
      <span className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center font-serif text-base leading-snug text-pearl/85">{title}</span>
    </div>
  );
}

function BookCard({ book }: { book: FlatBook }) {
  return (
    <article
      tabIndex={0}
      aria-label={`${book.title} by ${book.author}, ${book.year}`}
      className="group relative aspect-[3/4] overflow-hidden rounded-md border border-pearl/10 bg-navy-elevated outline-none transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-2 hover:border-aqua/40 hover:shadow-[0_26px_60px_-28px_rgba(0,0,0,0.85)] focus-visible:-translate-y-2 focus-visible:border-aqua/50"
    >
      {/* cover */}
      {book.cover ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`/covers/${book.cover}`}
          alt={`${book.title} — book cover`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.06] group-hover:brightness-[0.45] group-focus-within:scale-[1.06] group-focus-within:brightness-[0.45]"
        />
      ) : (
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.05] group-focus-within:scale-[1.05]">
          <FallbackCover index={book.index} theme={book.theme} title={book.shortTitle} />
        </div>
      )}

      {/* sheen sweep on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 -translate-x-full bg-gradient-to-r from-transparent via-pearl/15 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full"
      />

      {/* corner index — fades out as detail comes in */}
      <span
        aria-hidden="true"
        className="absolute right-3 top-3 z-10 t-mono text-[0.6rem] tabular-nums text-pearl/45 transition-opacity duration-300 group-hover:opacity-0 group-focus-within:opacity-0"
      >
        {String(book.index).padStart(2, "0")}
      </span>

      {/* always-visible base caption */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-navy via-navy/85 to-transparent p-4 pt-12 transition-opacity duration-300 group-hover:opacity-0 group-focus-within:opacity-0">
        <p className="t-mono text-[0.55rem] uppercase tracking-[0.18em] text-aqua/80">{book.catNo} · {book.theme}</p>
        <h4 className="mt-1.5 line-clamp-2 font-serif text-[0.95rem] leading-snug text-pearl">{book.shortTitle}</h4>
        <p className="mt-1 t-mono text-[0.58rem] uppercase tracking-[0.1em] text-steel">{book.author} · {book.year}</p>
      </div>

      {/* hover / focus detail overlay */}
      <div className="absolute inset-0 z-20 flex flex-col bg-navy/85 p-5 opacity-0 backdrop-blur-[3px] transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
        <p className="t-mono text-[0.55rem] uppercase tracking-[0.2em] text-aqua">{book.catNo} · {book.theme}</p>
        <h4 className="mt-3 font-serif text-[1.05rem] leading-snug text-pearl">{book.shortTitle}</h4>
        <p className="mt-1.5 t-mono text-[0.6rem] uppercase tracking-[0.1em] text-steel">{book.author} · {book.year}</p>
        <span className="my-3 h-px w-10 shrink-0 bg-aqua/40" aria-hidden="true" />
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {book.why.map((point, i) => (
            <li
              key={point}
              style={{ transitionDelay: `${130 + i * 70}ms` }}
              className="flex translate-y-2 gap-2 text-[0.8rem] leading-relaxed text-mist opacity-0 transition-[opacity,transform] duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
            >
              <span className="mt-[0.42rem] h-1 w-1 shrink-0 rounded-full bg-aqua/80" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        {book.citation ? (
          <p className="mt-3 line-clamp-3 shrink-0 border-t border-pearl/10 pt-2.5 text-[0.58rem] leading-snug text-steel/70">
            {book.citation}
          </p>
        ) : null}
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
      const shortTitle = b.title.split(/\s*[:—–]\s*/)[0];
      return { ...b, theme: g.theme, catNo: String(gi + 1).padStart(2, "0"), index: running, shortTitle };
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
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={shelfRef}>
      {/* tabs */}
      <div className="toc-scroll -mx-2 mb-4 flex gap-1.5 overflow-x-auto px-2 pb-2">
        {tabs.map((t) => {
          const on = active === t;
          const count = t === "All" ? all.length : all.filter((b) => b.theme === t).length;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setActive(t)}
              aria-pressed={on}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 t-mono text-[0.62rem] uppercase tracking-[0.14em] transition-colors duration-200 ${
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

      <p className="mb-9 flex items-center gap-2 t-mono text-[0.62rem] uppercase tracking-[0.16em] text-steel/70">
        <span className="inline-block h-1 w-1 rounded-full bg-aqua/60" aria-hidden="true" />
        Hover a cover for why it matters
      </p>

      {/* grid — re-keyed by active tab so cards re-stagger in */}
      <div
        key={active}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 2xl:grid-cols-5"
      >
        {visible.map((book, i) => (
          <div
            key={`${book.theme}-${book.title}`}
            className={!armed ? "" : inView ? "book-in" : "opacity-0"}
            style={armed && inView ? { animationDelay: `${Math.min(i, 14) * 50}ms` } : undefined}
          >
            <BookCard book={book} />
          </div>
        ))}
      </div>
    </div>
  );
}
