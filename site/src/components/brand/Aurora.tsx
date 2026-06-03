/* ============================================================================
   Aurora — slow-drifting cool glow blobs, generated, very subtle. A quiet
   ambient texture for section breaks (pure CSS, GPU-cheap). Two aqua glows + one
   deep-blue glow on the navy; under reduced-motion they simply hold still.
   Decorative → aria-hidden.
   ========================================================================== */

import type { CSSProperties } from "react";

const BLOBS: { cls: string; style: CSSProperties }[] = [
  { cls: "aurora-1", style: { top: "-12%", left: "5%", width: "44%", height: "64%", background: "radial-gradient(circle, rgba(31,255,255,0.10), transparent 64%)" } },
  { cls: "aurora-2", style: { top: "14%", right: "-2%", width: "40%", height: "68%", background: "radial-gradient(circle, rgba(31,255,255,0.06), transparent 64%)" } },
  { cls: "aurora-3", style: { bottom: "-20%", left: "28%", width: "52%", height: "62%", background: "radial-gradient(circle, rgba(64,96,170,0.16), transparent 70%)" } },
];

export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {BLOBS.map((b) => (
        <span key={b.cls} className={`aurora-blob ${b.cls}`} style={b.style} />
      ))}
    </div>
  );
}
