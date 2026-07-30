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

type FlatBook = Book & { theme: string; catNo: string; index: number; mainTitle: string; subTitle: string };

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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookCard({ book }: { book: FlatBook }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-full flex-col">
      {/* the card (box) — centred text */}
      <article className="group flex flex-col rounded-md border border-pearl/10 bg-navy-elevated p-6 text-center transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1.5 hover:border-pearl/25 hover:shadow-[0_24px_55px_-30px_rgba(0,0,0,0.85)]">
        {/* category */}
        <p className="t-mono text-[0.56rem] uppercase tracking-[0.18em] text-aqua/80">{book.catNo} {book.theme}</p>

        {/* cover frame — fixed 4:3 portrait box (aqua frame) so every title starts at the
            same place; the full cover sits contained & centred inside, never stretched/cropped */}
        <div className="mt-3 aspect-[3/4] w-full overflow-hidden rounded-sm border border-aqua/40 bg-navy-sunken/20 transition-colors duration-300 group-hover:border-aqua/70">
          <div className="flex h-full w-full items-center justify-center p-2">
            {book.cover ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`/covers/${book.cover}`}
                alt={book.title}
                width={book.coverW}
                height={book.coverH}
                loading="lazy"
                decoding="async"
                data-zoom
                role="button"
                tabIndex={0}
                aria-label={`Enlarge ${book.title} cover`}
                className="block max-h-full max-w-full cursor-zoom-in rounded-sm object-contain shadow-[0_8px_22px_-12px_rgba(0,0,0,0.85)]"
              />
            ) : (
              <div className="relative h-full w-full overflow-hidden">
                <FallbackCover index={book.index} theme={book.theme} title={book.mainTitle} />
              </div>
            )}
          </div>
        </div>

        {/* title / subtitle / author — centred, identical position on every card */}
        <h4 className="mt-4 line-clamp-2 min-h-[2.75rem] font-sans text-[1rem] leading-snug text-pearl" style={{ fontWeight: 700 }}>{book.mainTitle}</h4>
        <p className="mt-1 line-clamp-2 min-h-[2.2rem] font-sans text-[0.8rem] font-normal leading-snug text-pearl/60">{book.subTitle}</p>
        <p className="mt-1 line-clamp-1 min-h-[1.25rem] font-serif text-[0.85rem] leading-snug text-steel"><span className="font-bold text-pearl/90">{book.author}</span> · {book.year}</p>

        {/* unlabelled, subtle toggle — just a chevron, centred */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Hide details" : "Show details"}
          className="mx-auto mt-3 flex items-center justify-center px-6 pt-1 text-steel/55 transition-colors duration-200 hover:text-aqua"
        >
          <Chevron open={open} />
        </button>

      {/* why-it-matters — below the card, left-aligned bullets */}
      <div className={`grid transition-[grid-template-rows] duration-[400ms] ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <ul className="space-y-2.5 px-1 pt-4 text-left">
            {book.why.map((point) => (
              <li key={point} className="flex gap-1.5 font-serif text-[0.85rem] leading-relaxed text-mist">
                <span className="shrink-0 text-aqua/80" aria-hidden="true">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          {book.citation ? (
            <p className="mt-3 px-1 text-left font-serif text-[0.74rem] leading-snug text-steel/70">{book.citation}</p>
          ) : null}
        </div>
      </div>
      </article>
    </div>
  );
}

type GroupView = { theme: string; blurb: string; catNo: string; books: FlatBook[] };

/* One category bucket: a headline + its grid of covers. Reveals on its own scroll. */
function CategorySection({ group }: { group: GroupView }) {
  const [armed, setArmed] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // stay visible, no motion
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    setArmed(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.03 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id={`cat-${group.catNo}`} className="scroll-mt-24">
      {/* category headline */}
      <div className="mb-5 flex items-baseline gap-4 border-b border-pearl/10 pb-3">
        <span className="t-mono text-sm tabular-nums text-aqua/80">{group.catNo}</span>
        <h3 className="font-serif text-xl leading-tight text-pearl md:text-2xl">{group.theme}</h3>
        <span className="ml-auto shrink-0 t-mono text-[0.6rem] uppercase tracking-[0.14em] text-steel">
          {group.books.length} books
        </span>
      </div>
      {group.blurb ? <p className="mb-7 max-w-2xl text-sm leading-relaxed text-mist">{group.blurb}</p> : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {group.books.map((book, i) => (
          <div
            key={`${book.theme}-${book.title}`}
            className={!armed ? "" : inView ? "book-in" : "opacity-0"}
            style={armed && inView ? { animationDelay: `${Math.min(i, 12) * 50}ms` } : undefined}
          >
            <BookCard book={book} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function BookShelf({ groups }: { groups: BookGroup[] }) {
  // Build per-category views, preserving a global running index for the cover numerals.
  let running = 0;
  const grouped: GroupView[] = groups.map((g, gi) => ({
    theme: g.theme,
    blurb: g.blurb,
    catNo: String(gi + 1).padStart(2, "0"),
    books: g.books.map((b) => {
      running += 1;
      const m = b.title.match(/^(.*?)\s*[:—–]\s*(.+)$/);
      const mainTitle = m ? m[1] : b.title;
      const subTitle = m ? m[2] : "";
      return { ...b, theme: g.theme, catNo: String(gi + 1).padStart(2, "0"), index: running, mainTitle, subTitle };
    }),
  }));
  const total = running;

  const tabs = ["All", ...groups.map((g) => g.theme)];
  const [active, setActive] = useState<string>("All");
  const visibleGroups = active === "All" ? grouped : grouped.filter((g) => g.theme === active);

  return (
    <div>
      {/* category tabs — select a single bucket, or All */}
      <div className="mb-9 flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const on = active === t;
          const count = t === "All" ? total : grouped.find((g) => g.theme === t)?.books.length ?? 0;
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

      {/* sections — re-keyed by active tab so the view re-staggers in */}
      <div key={active} className="space-y-16 md:space-y-20">
        {visibleGroups.map((g) => (
          <CategorySection key={g.theme} group={g} />
        ))}
      </div>
    </div>
  );
}
