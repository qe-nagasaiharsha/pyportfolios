/* Global top nav for article pages — the brand's dark bar above the light
   reading surface. Server Component; links only. */

import Link from "next/link";
import { CATEGORY_ORDER, CATEGORIES } from "@/lib/articles";

export function ArticleNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-pearl/10 bg-navy/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="shrink-0">
          <span className="font-sans text-base tracking-tight text-pearl" style={{ fontWeight: 900 }}>
            pyportfolios<span className="text-aqua">.com</span>
          </span>
        </Link>
        <ul className="hidden items-center gap-7 lg:flex">
          {CATEGORY_ORDER.map((c) => (
            <li key={c}>
              <Link
                href={`/research#${c}`}
                className="font-sans font-black text-[0.7rem] uppercase tracking-[0.1em] text-pearl/85 transition-colors duration-200 hover:text-pearl"
              >
                {CATEGORIES[c].name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/course"
            className="hidden font-sans font-black text-[0.7rem] uppercase tracking-[0.1em] text-pearl/85 transition-colors duration-200 hover:text-pearl sm:block"
          >
            Course
          </Link>
          <Link
            href="/literature"
            className="hidden font-sans font-black text-[0.7rem] uppercase tracking-[0.1em] text-pearl/85 transition-colors duration-200 hover:text-pearl sm:block"
          >
            Literature
          </Link>
          <Link
            href="/research"
            className="rounded-sm border border-pearl/20 px-4 py-1.5 font-sans font-black text-[0.7rem] uppercase tracking-[0.1em] text-pearl transition-colors duration-200 hover:border-aqua hover:text-aqua"
          >
            All research
          </Link>
        </div>
      </nav>
    </header>
  );
}
