/* The project card — the topic-report card from TOPIC_CARDS.html, rendered on
   the article page.

   Louis asked for these ("project cards for each tutorial ... makes the
   navigation and overview for each article neat and a bit more attractive") and
   marked the spot himself in the GBM notebook, on the line carrying the format
   and category: "=====================> insert project card". He then suggested
   placing it "next to the intro text" rather than under it, which is why the
   article sets this beside its opening block rather than stacking it.

   Four facts a reader wants before committing to the piece: what it is built
   with, on what instruments, over what period, and what it is FOR. The first
   three exist elsewhere on the page in scattered form; "use" appears nowhere
   else and is the one that earns the card its space.

   Reads straight from the catalogue, so a card cannot drift from the article.
   Renders nothing at all if the article has no topic-card fields — the ten
   pre-batch articles predate TOPIC_CARDS.html and have none.

   Server Component; no client JS. */

import { getArticle, CATEGORIES } from "@/lib/articles";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-pearl/10 pt-3 first:border-t-0 first:pt-0">
      <dt className="t-mono text-[0.58rem] uppercase tracking-[0.16em] text-steel">{label}</dt>
      <dd className="mt-1 font-sans text-[0.82rem] leading-snug text-pearl/85">{children}</dd>
    </div>
  );
}

export function ProjectCard({ slug }: { slug: string }) {
  const a = getArticle(slug);
  if (!a) return null;
  /* no topic card for this piece — render nothing rather than a half-empty box */
  if (!a.assets && !a.timeframe && !a.use) return null;

  return (
    <aside
      aria-label="Project card"
      className="corner-ticks rounded-sm border border-aqua/40 bg-coal/70 p-5"
    >
      {/* Same five labelled rows as the topic card, in its order:
          Category · Libraries · Assets · Timeframe · Use. Category is a plain
          grey label like the rest rather than a coloured format badge — the
          format already shows in the article header. */}
      <dl className="space-y-3">
        <Row label="Category">{a.cardCategory ?? CATEGORIES[a.category].name}</Row>
        <Row label="Libraries">{a.cardLibraries ?? a.stack.join(" · ")}</Row>
        {a.assets ? <Row label="Assets">{a.assets}</Row> : null}
        {a.timeframe ? <Row label="Timeframe">{a.timeframe}</Row> : null}
        {a.use ? <Row label="Use">{a.use}</Row> : null}
      </dl>
    </aside>
  );
}
