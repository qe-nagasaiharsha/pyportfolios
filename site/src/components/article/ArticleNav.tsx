/* Global top nav for article pages — kept visually identical to the landing
   page header (StyleTile) so navigation is consistent across the site.
   Server Component; links only. */

import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";
import { AuthNavButton } from "@/components/AuthNavButton";
import { articlesByCategory, CATEGORIES, type CategorySlug } from "@/lib/articles";

const NAV = [
  { label: "Quant Finance Foundations", href: "/research/quant-finance-foundations" },
  { label: "Portfolio Optimization", href: "/research/portfolio-optimization" },
  { label: "Risk Management", href: "/research/risk-management" },
  { label: "Algorithmic Trading", href: "/research/algorithmic-trading" },
] as const;

const EXTRA = [
  { label: "Course Structure", href: "/course" },
  { label: "Literature Recommendations", href: "/literature" },
] as const;

export function ArticleNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-pearl/10 bg-anthracite/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
        <Link href="/" className="shrink-0">
          <span className="font-sans text-lg tracking-tight text-pearl" style={{ fontWeight: 900 }}>
            pyportfolios<span className="text-aqua">.</span>com
          </span>
        </Link>
        <ul className="hidden flex-1 items-center justify-between gap-4 lg:flex">
          {NAV.map((item) => {
            /* each nav item now points at its own category page
               (/research/<category>), not an anchor on /research */
            const slug = item.href.split("/").pop() as CategorySlug;
            const posts = articlesByCategory(slug);
            return (
              <li key={item.label} className="group relative">
                <Link
                  href={item.href}
                  className="block text-center font-sans font-black text-[0.68rem] leading-[1.05] tracking-[0.1em] text-pearl/85 transition-colors duration-200 hover:text-pearl"
                >
                  {item.label.split(" ").map((word) => (
                    <span key={word} className="block">{word}</span>
                  ))}
                </Link>
                {posts.length > 0 && (
                  <div className="invisible absolute left-0 top-full z-50 w-[27rem] translate-y-1 pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <div className="overflow-hidden rounded-xl border border-pearl/15 bg-coal/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-md">
                      <p className="px-3 pb-2 pt-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.15em] text-pearl/45">{CATEGORIES[slug].name}</p>
                      <ul className="nav-dropdown-scroll max-h-[min(34rem,calc(100vh-9rem))] space-y-0.5 overflow-y-auto overscroll-contain pr-1">
                        {posts.map((a) => (
                          <li key={a.slug}>
                            <Link href={`/research/${a.slug}`} className="group/card flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-pearl/5">
                              <span className="min-w-0 flex-1">
                                <span className="block font-sans text-[0.82rem] font-semibold leading-snug text-pearl/90 transition-colors group-hover/card:text-aqua">{a.title}</span>
                                <span className="mt-1 block line-clamp-2 text-[0.72rem] leading-relaxed text-pearl/55">{a.dek}</span>
                                <span className="mt-1.5 block t-mono text-[0.56rem] uppercase tracking-[0.12em] text-aqua/70">{a.level} · {a.readMinutes} min read</span>
                              </span>
                              <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-pearl/10">
                                {a.hero ? (
                                  <img
                                    src={`/${a.hero}`}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover/card:scale-105"
                                  />
                                ) : (
                                  <span className="absolute inset-0 bg-coal" />
                                )}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
          {EXTRA.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="block text-center font-sans font-black text-[0.68rem] leading-[1.05] tracking-[0.1em] text-pearl/85 transition-colors duration-200 hover:text-pearl"
              >
                {item.label.split(" ").map((word) => (
                  <span key={word} className="block">{word}</span>
                ))}
              </Link>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <AuthNavButton />
          <MobileNav items={[...NAV, ...EXTRA]} />
        </div>
      </nav>
    </header>
  );
}
