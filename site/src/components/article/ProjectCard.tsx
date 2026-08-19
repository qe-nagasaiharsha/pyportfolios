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

   TWO SOURCES, ONE CARD. The spec for all sixteen pieces already lives in
   TOPIC_CARDS (lib/topics.ts) — that is the batch-1 topic-report data. The
   article catalogue may override any row where the article's own wording
   differs from the card's. So the article wins if it says something, and the
   topic card fills in everything else; nothing has to be typed twice.

   Renders nothing if neither source has data.

   Server Component; no client JS. */

import { getArticle, CATEGORIES } from "@/lib/articles";
import { TOPIC_CARDS, CARD_CATEGORY } from "@/lib/topics";

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

  const topic = TOPIC_CARDS.find((t) => t.article === slug);

  const libraries = a.cardLibraries ?? topic?.libraries.join(" · ") ?? a.stack.join(" · ");
  const assets = a.assets ?? topic?.assets;
  const timeframe = a.timeframe ?? topic?.timeframe;
  /* the topic card ends its "use" line with a full stop; the article's override
     does not. Strip it so every card reads the same way. */
  const use = a.use ?? topic?.use.replace(/\.$/, "");

  /* nothing to show — render nothing rather than a half-empty box */
  if (!assets && !timeframe && !use) return null;

  /* my-8 matches the rhythm Figure and the code cards already use, so the card
     breathes against the paragraph above it wherever it is dropped in. */
  return (
    <aside
      aria-label="Project card"
      className="corner-ticks my-8 rounded-sm border border-aqua/40 bg-coal/70 p-5"
    >
      {/* Same five labelled rows as the topic card, in its order:
          Category · Libraries · Assets · Timeframe · Use. Category is a plain
          grey label like the rest rather than a coloured format badge — the
          format already shows in the article header. */}
      <dl className="space-y-3">
        {/* the card quotes TOPIC_CARDS.html's own group heading, which differs
            from the site's category name for the foundations group */}
        <Row label="Category">
          {a.cardCategory ?? CARD_CATEGORY[a.category] ?? CATEGORIES[a.category].name}
        </Row>
        <Row label="Libraries">{libraries}</Row>
        {assets ? <Row label="Assets">{assets}</Row> : null}
        {timeframe ? <Row label="Timeframe">{timeframe}</Row> : null}
        {use ? <Row label="Use">{use}</Row> : null}
      </dl>
    </aside>
  );
}
