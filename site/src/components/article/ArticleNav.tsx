/* Global top nav for article pages — the brand's dark bar above the light
   reading surface. Server Component; links only. */

import Link from "next/link";
import { CATEGORY_ORDER, CATEGORIES } from "@/lib/articles";

export function ArticleNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-pearl/10 bg-navy/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="flex shrink-0 items-baseline gap-1">
          <span className="text-base tracking-tight text-pearl" style={{ fontWeight: 900 }}>pyportfolios</span>
          <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-aqua" aria-hidden="true" />
        </Link>
        <ul className="hidden items-center gap-7 lg:flex">
          {CATEGORY_ORDER.map((c) => (
            <li key={c}>
              <Link
                href={`/research#${c}`}
                className="t-mono text-[0.7rem] uppercase tracking-[0.16em] text-mist transition-colors duration-200 hover:text-pearl"
              >
                {CATEGORIES[c].name}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/research"
          className="shrink-0 rounded-sm border border-pearl/20 px-4 py-1.5 t-mono text-[0.7rem] uppercase tracking-[0.16em] text-pearl transition-colors duration-200 hover:border-aqua hover:text-aqua"
        >
          All research
        </Link>
      </nav>
    </header>
  );
}
