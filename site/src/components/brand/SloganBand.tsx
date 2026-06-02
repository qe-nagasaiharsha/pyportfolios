/* Slogan voice system (deck §01.1) as kinetic typography — the brand's family
   of lines, set in Lora italic and carried across the band on a slow marquee. */

const SLOGANS = [
  "Get up to speed.",
  "Cancel the noise.",
  "Find your edge.",
  "Step up the game.",
  "Cut to the chase.",
  "Stay on top.",
] as const;

export function SloganBand() {
  return (
    <section className="overflow-hidden border-y border-pearl/10 bg-navy-sunken/40 py-10">
      <div className="marquee items-center">
        {[0, 1].map((dup) => (
          <span key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
            {SLOGANS.map((s) => (
              <span key={s} className="flex items-center">
                <span className="px-8 font-serif text-3xl italic text-pearl/85 md:text-4xl">{s}</span>
                <span className="text-aqua/70">&middot;</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </section>
  );
}

/* the deck's tagline trio, for use as section eyebrows when slogans are on */
export const SLOGAN_EYEBROWS = [
  "Get up to speed",
  "Cancel the noise",
  "Find your edge",
] as const;
