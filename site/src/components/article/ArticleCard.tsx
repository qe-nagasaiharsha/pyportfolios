/* Research-index card — dark, matching the landing's research tiles. Clicking
   through flips to the light reading surface (the dark→light rhythm). */

import { type Article, CATEGORIES, formatDate } from "@/lib/articles";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Tilt } from "@/components/motion/Tilt";

export function ArticleCard({ article }: { article: Article }) {
  /* Every article with a banner photo carries a thumbnail (Kyma-style); the
     rare one without keeps a blank coal plate so the grid stays uniform.
     Previously this was hardcoded to the Foundations category, which left the
     other three sections with no thumbnails at all once they filled up. */
  const showThumb = Boolean(article.hero);
  return (
    <Tilt className="h-full">
    <TransitionLink
      href={`/research/${article.slug}`}
      className="glow-card group flex h-full flex-col overflow-hidden rounded-2xl border border-pearl/10 bg-navy-elevated/50 hover:border-aqua/40"
    >
      {showThumb ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-pearl/10">
          {article.hero ? (
            <img
              src={`/${article.hero}`}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center brightness-[1.02] transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 bg-coal" />
          )}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-7">
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
      </div>
    </TransitionLink>
    </Tilt>
  );
}
