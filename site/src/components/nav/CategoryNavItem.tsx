/* One top-nav category item: the label, and the hover/focus dropdown listing
   that category's articles with a thumbnail each.

   This exists because the two headers had drifted. The thumbnails were added to
   the article-page header (ArticleNav) and never reached the landing page one
   (StyleTile), so hovering "Quant Finance Foundations" showed pictures on an
   article page and plain text on the home page — along with a different panel
   width, radius, background and max height. Both now render this, so the
   dropdown is identical wherever the header appears.

   Server Component; links only. */

import Link from "next/link";
import { articlesByCategory, CATEGORIES, type CategorySlug } from "@/lib/articles";

export function CategoryNavItem({ label, href }: { label: string; href: string }) {
  const slug = href.split("/").pop() as CategorySlug;
  const posts = articlesByCategory(slug);

  return (
    <li className="group relative">
      <Link
        href={href}
        className="block text-center font-sans font-black text-[0.68rem] leading-[1.05] tracking-[0.1em] text-pearl/85 transition-colors duration-200 hover:text-pearl"
      >
        {label.split(" ").map((word) => (
          <span key={word} className="block">{word}</span>
        ))}
      </Link>
      {posts.length > 0 && (
        <div className="invisible absolute left-0 top-full z-50 w-[27rem] translate-y-1 pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <div className="overflow-hidden rounded-xl border border-pearl/15 bg-coal/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-md">
            <p className="px-3 pb-2 pt-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.15em] text-pearl/45">
              {CATEGORIES[slug].name}
            </p>
            <ul className="nav-dropdown-scroll max-h-[min(34rem,calc(100vh-9rem))] space-y-0.5 overflow-y-auto overscroll-contain pr-1">
              {posts.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/research/${a.slug}`}
                    className="group/card flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-pearl/5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-sans text-[0.82rem] font-semibold leading-snug text-pearl/90 transition-colors group-hover/card:text-aqua">
                        {a.title}
                      </span>
                      <span className="mt-1 block line-clamp-2 text-[0.72rem] leading-relaxed text-pearl/55">
                        {a.dek}
                      </span>
                      <span className="mt-1.5 block t-mono text-[0.56rem] uppercase tracking-[0.12em] text-aqua/70">
                        {a.level} · {a.readMinutes} min read
                      </span>
                    </span>
                    <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-pearl/10">
                      {a.hero ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
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
}
