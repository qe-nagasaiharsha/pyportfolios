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
    <nav aria-label="Table of Content">
      <p className="font-sans text-[1.2rem] leading-tight text-pearl">
        <span style={{ fontWeight: 800 }}>Table</span>
        <span className="text-mist" style={{ fontWeight: 400 }}> of Content</span>
      </p>
      <ul className="mt-5 border-l border-pearl/15">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`-ml-px block border-l-2 py-1.5 pl-4 font-sans text-[0.9rem] leading-snug transition-colors ${
                  isActive
                    ? "border-aqua text-pearl"
                    : "border-transparent text-steel hover:border-pearl/30 hover:text-pearl"
                }`}
                style={isActive ? { fontWeight: 600 } : undefined}
              >
                {s.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
