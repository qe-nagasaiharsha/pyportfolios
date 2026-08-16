/* Global top nav for article pages — kept visually identical to the landing
   page header (StyleTile) so navigation is consistent across the site.
   Server Component; links only. */

import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";
import { CategoryNavItem } from "@/components/nav/CategoryNavItem";

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
  /* No backdrop-blur on this bar. A sticky element with backdrop-filter blurs
     everything scrolling beneath it, and in Chrome it pushes the whole scrolling
     area onto a composited path — text is rasterised into a bitmap and reused
     while moving, so the page reads soft during scroll and snaps sharp when it
     stops. A near-opaque background gives the same separation for free. */
  return (
    <header className="sticky top-0 z-50 border-b border-pearl/10 bg-anthracite/95">
      <nav className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
        <Link href="/" className="shrink-0">
          <span className="font-sans text-lg tracking-tight text-pearl" style={{ fontWeight: 900 }}>
            pyportfolios<span className="text-aqua">.</span>com
          </span>
        </Link>
        <ul className="hidden flex-1 items-center justify-between gap-4 lg:flex">
          {/* each nav item points at its own category page
              (/research/<category>), not an anchor on /research */}
          {NAV.map((item, i) => (
            <CategoryNavItem
              key={item.label}
              label={item.label}
              href={item.href}
              /* last category sits far right; open its panel leftwards */
              align={i === NAV.length - 1 ? "right" : "left"}
            />
          ))}
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
          <Link
            href="/account"
            className="hidden w-[183px] items-center justify-center rounded-sm border border-pearl/30 py-2 t-mono text-xs font-semibold text-pearl transition-colors duration-300 hover:border-aqua hover:text-aqua lg:inline-flex"
          >
            Sign in
          </Link>
          <MobileNav items={[...NAV, ...EXTRA]} signInHref="/account" />
        </div>
      </nav>
    </header>
  );
}
