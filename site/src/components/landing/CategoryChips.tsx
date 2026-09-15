"use client";

/* The row of category pills above a shelf — "All" plus one per discipline,
   each with its count. Shared by the Books and Papers tabs on /literature so
   the two filters look and behave identically. Pressing a pill shows only
   that bucket; "All" shows every bucket in order. */

export function CategoryChips({
  tabs,
  active,
  onChange,
}: {
  tabs: { label: string; count: number }[];
  active: string;
  onChange: (label: string) => void;
}) {
  return (
    <div className="mb-9 flex flex-wrap gap-1.5">
      {tabs.map((t) => {
        const on = active === t.label;
        return (
          <button
            key={t.label}
            type="button"
            onClick={() => onChange(t.label)}
            aria-pressed={on}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 t-mono text-[0.62rem] uppercase tracking-[0.14em] transition-colors duration-200 ${
              on
                ? "border-aqua/60 bg-aqua/10 text-aqua"
                : "border-pearl/12 text-steel hover:border-pearl/30 hover:text-pearl"
            }`}
          >
            {t.label}
            <span className={`ml-2 tabular-nums ${on ? "text-aqua/70" : "text-steel/60"}`}>{t.count}</span>
          </button>
        );
      })}
    </div>
  );
}
