"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VARIANT_LIST } from "@/lib/variants";

/* Sticky one-row version toggle — the comparison harness for v0–v5 + v11.
   Tooling chrome only; carries no design-system / deck meta. */
export function VersionSwitcher() {
  const pathname = usePathname();
  const seg = pathname.replace(/\/$/, "").split("/").pop() || "";
  const current = seg === "" ? "v0" : seg; // "/" renders the baseline (v0)

  return (
    <div className="border-b border-pearl/10 bg-navy-sunken/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-6 py-2">
        <span className="hidden shrink-0 t-mono text-[0.6rem] uppercase tracking-[0.24em] text-steel sm:block">
          Versions
        </span>
        <span className="hidden h-3 w-px shrink-0 bg-pearl/15 sm:block" aria-hidden="true" />
        <div className="flex items-center gap-1.5">
          {VARIANT_LIST.map((v) => {
            const active = current === v.id;
            return (
              <Link
                key={v.id}
                href={`/${v.id}`}
                aria-current={active ? "page" : undefined}
                title={v.name}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 t-mono text-[0.65rem] uppercase tracking-[0.14em] transition-colors ${
                  active ? "bg-aqua text-navy" : "text-mist hover:bg-pearl/5 hover:text-pearl"
                }`}
              >
                <span className="font-semibold">{v.id}</span>
                <span className={active ? "text-navy/75" : "text-steel"}>{v.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
