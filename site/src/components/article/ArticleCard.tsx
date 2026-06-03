/* Research-index card — dark, matching the landing's research tiles. Clicking
   through flips to the light reading surface (the dark→light rhythm). */

import { type Article, CATEGORIES, formatDate } from "@/lib/articles";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Tilt } from "@/components/motion/Tilt";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Tilt className="h-full">
    <TransitionLink
      href={`/research/${article.slug}`}
      className="glow-card group flex h-full flex-col rounded-sm border border-pearl/10 bg-navy-elevated/50 p-7 hover:border-aqua/40"
    >
      <div className="flex items-center justify-between">
        <span className="t-mono text-xs uppercase tracking-[0.18em] text-aqua/80">{CATEGORIES[article.category].name}</span>
        <span className="t-mono text-[0.62rem] uppercase tracking-[0.14em] text-steel">{article.level}</span>
      </div>
      <h3 className="t-h2 mt-4 text-pearl">{article.title}</h3>
      <p className="mt-3 flex-1 leading-relaxed text-mist">{article.excerpt}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-pearl/10 pt-4 t-mono text-xs uppercase tracking-[0.14em] text-steel">
        <span>{formatDate(article.date)}</span>
        <span className="text-aqua/50" aria-hidden="true">·</span>
        <span>{article.readMinutes} min</span>
        <span className="text-aqua/50" aria-hidden="true">·</span>
        <span className="text-aqua transition-transform duration-300 group-hover:translate-x-0.5">Read ↗</span>
      </div>
    </TransitionLink>
    </Tilt>
  );
}
