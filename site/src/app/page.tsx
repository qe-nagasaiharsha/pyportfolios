/* Home renders the baseline (v0) directly — no separate landing page.
   The sticky toggle row at the top switches between v0–v5. */

import StyleTile from "@/components/StyleTile";
import { VARIANTS } from "@/lib/variants";

export default function Home() {
  return <StyleTile variant={VARIANTS.v0} heroAlign="center" />;
}
