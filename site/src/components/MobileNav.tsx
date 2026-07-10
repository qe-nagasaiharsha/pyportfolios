"use client";

/* MobileNav — the hamburger menu for phones/tablets. Shown only below `lg`
   (desktop keeps its full horizontal nav). Tapping the button opens a
   slide-down panel with the same links + Sign in; tapping a link, the ✕, the
   backdrop, or Escape closes it. Locks background scroll while open. */

import { useEffect, useState } from "react";

type Item = { label: string; href: string };

export function MobileNav({ items, signInHref }: { items: Item[]; signInHref: string }) {
  const [open, setOpen] = useState(false);

  // lock background scroll while the menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      {/* hamburger */}
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center text-pearl transition-colors duration-200 hover:text-aqua"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Menu">
          {/* backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-navy/85 backdrop-blur-sm"
          />
          {/* panel */}
          <div className="mobile-menu-panel absolute inset-x-0 top-0 border-b border-pearl/10 bg-navy px-6 pb-8 pt-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between">
              <span className="font-sans text-lg tracking-tight text-pearl" style={{ fontWeight: 900 }}>
                pyportfolios<span className="text-aqua">.</span>com
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center text-steel transition-colors duration-200 hover:text-aqua"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <ul className="mt-5 space-y-0.5">
              {items.map((it) => (
                <li key={it.label}>
                  <a
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3.5 font-sans text-base font-semibold text-pearl/90 transition-colors duration-200 hover:bg-pearl/5 hover:text-aqua"
                  >
                    {it.label}
                  </a>
                </li>
              ))}
            </ul>

            <a
              href={signInHref}
              onClick={() => setOpen(false)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-sm border border-pearl/30 py-3 t-mono text-sm font-semibold text-pearl transition-colors duration-300 hover:border-aqua hover:text-aqua"
            >
              Sign in
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
