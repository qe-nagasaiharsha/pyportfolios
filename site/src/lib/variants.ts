/* ============================================================================
   Variant matrix — v0 baseline + one on-brand enhancement each (deck 2026-05-28)
   Each version turns on exactly ONE flag so they compare cleanly.
   ========================================================================== */

export interface VariantFlags {
  crest: boolean; // v1 — deck §02 Logo (helmet + sword Fortitudo mark)
  photography: boolean; // v2 — deck §05 Imagery (editorial photography)
  stackCards: boolean; // v3 — deck §06 Iconography (Python stack logo cards)
  worldMap: boolean; // v4 — deck §13/14 Exchanges + Top-15 economies
  slogans: boolean; // v5 — deck §01.1 Slogan voice system
}

export interface Variant {
  id: string;
  name: string;
  adds: string; // what this version adds vs baseline
  deckRef: string; // which deck section it fulfils
  flags: VariantFlags;
}

const NONE: VariantFlags = {
  crest: false,
  photography: false,
  stackCards: false,
  worldMap: false,
  slogans: false,
};

export const VARIANTS: Record<string, Variant> = {
  v0: {
    id: "v0",
    name: "Baseline",
    adds: "Current design — the agreed “Quant Research House” theme.",
    deckRef: "Reference point",
    flags: { ...NONE },
  },
  v1: {
    id: "v1",
    name: "Crest & Mark",
    adds: "The Fortitudo crest (helmet + sword) in nav, hero, footer & favicon.",
    deckRef: "Deck §02 — Logo",
    flags: { ...NONE, crest: true },
  },
  v2: {
    id: "v2",
    name: "Photography",
    adds: "Editorial, desaturated imagery with muted borders & a single aqua accent.",
    deckRef: "Deck §05 — Imagery",
    flags: { ...NONE, photography: true },
  },
  v3: {
    id: "v3",
    name: "Stack Cards",
    adds: "The Python quant stack as soft, uniform logo cards, grouped by purpose.",
    deckRef: "Deck §06 — Iconography",
    flags: { ...NONE, stackCards: true },
  },
  v4: {
    id: "v4",
    name: "Market Reach",
    adds: "A dotted world map highlighting the top-15 economies & global exchanges.",
    deckRef: "Deck §13–14 — Reach",
    flags: { ...NONE, worldMap: true },
  },
  v5: {
    id: "v5",
    name: "Slogan Voice",
    adds: "The brand slogan family woven through the page as kinetic typography.",
    deckRef: "Deck §01.1 — Slogans",
    flags: { ...NONE, slogans: true },
  },
  v11: {
    id: "v11",
    name: "The Quarterly",
    adds: "A classic editorial revamp on the brand's dark canvas — serif-led journal, crest masthead, dot-leader contents; all five enhancements distilled into one timeless whole.",
    deckRef: "Deck §01 — Classical × Modern",
    // Editorial layout uses its own component; flags all on for completeness.
    flags: { crest: true, photography: true, stackCards: true, worldMap: true, slogans: true },
  },
};

export const VARIANT_IDS = Object.keys(VARIANTS);
export const VARIANT_LIST: Variant[] = VARIANT_IDS.map((id) => VARIANTS[id]);
