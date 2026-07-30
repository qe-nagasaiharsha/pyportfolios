/* ============================================================================
   Single live design — v0 baseline ("Quant Research House").
   The earlier A/B variants (v1–v6, v11) were consolidated away; only v0 ships.
   The flag shape is kept (all false) so StyleTile's conditional sections stay
   valid without further surgery.
   ========================================================================== */

export interface VariantFlags {
  crest: boolean;
  photography: boolean;
  stackCards: boolean;
  worldMap: boolean;
  slogans: boolean;
  globe: boolean;
}

export interface Variant {
  id: string;
  name: string;
  adds: string;
  deckRef: string;
  flags: VariantFlags;
}

const NONE: VariantFlags = {
  crest: false,
  photography: false,
  stackCards: false,
  worldMap: false,
  slogans: false,
  globe: false,
};

export const VARIANTS: Record<string, Variant> = {
  v0: {
    id: "v0",
    name: "Baseline",
    adds: "The live design — the “Quant Research House” theme.",
    deckRef: "Reference point",
    flags: { ...NONE },
  },
};
