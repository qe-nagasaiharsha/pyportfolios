"use client";

/* Sticky table of contents with scroll-spy. The reference site only *labelled*
   a TOC; ours is a real one — IntersectionObserver tracks the active section and
   the marker animates to it. Degrades to a plain anchor list without JS/observer. */

import { useEffect, useState } from "react";
import type { ArticleSection } from "@/lib/articles";

export function ArticleToc({ sections }: { sections: ArticleSection[] }) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="t-mono text-[0.62rem] uppercase tracking-[0.24em] text-graphite">On this page</p>
      <ul className="mt-4 space-y-1">
        {sections.map((s, i) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`group flex items-baseline gap-3 py-1 transition-colors ${
                  isActive ? "text-teal" : "text-graphite hover:text-anthracite"
                }`}
              >
                <span
                  className={`mt-2 h-px shrink-0 transition-all duration-300 ${
                    isActive ? "w-6 bg-teal" : "w-3 bg-graphite/40 group-hover:w-4"
                  }`}
                  aria-hidden="true"
                />
                <span className="leading-snug">{s.title}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
