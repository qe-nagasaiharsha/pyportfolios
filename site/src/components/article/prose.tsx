/* ============================================================================
   Article reading primitives — the light "working paper" surface.
   Body = Switzer; section headings = Lora; code/captions/labels = Courier.
   Pure Server Components: Python is highlighted at build time (zero client JS).
   ========================================================================== */

import type { ReactNode } from "react";

/* ------------------------------------------------------ Python highlight -- */
/* A small, defensive single-pass tokenizer. It only ever *wraps* spans — it
   never reorders or drops characters — so worst case is under-colouring, never
   broken code. Runs server-side; the output is static HTML. */

const PY_KEYWORDS = new Set([
  "import", "from", "as", "def", "return", "for", "in", "if", "elif", "else",
  "while", "with", "class", "lambda", "None", "True", "False", "and", "or",
  "not", "is", "try", "except", "finally", "raise", "yield", "assert", "pass",
  "break", "continue", "global", "nonlocal", "del", "async", "await",
]);

interface Tok {
  text: string;
  cls?: string;
}

function tokenizePython(src: string): Tok[] {
  const out: Tok[] = [];
  const n = src.length;
  let i = 0;
  const push = (text: string, cls?: string) => {
    if (text) out.push({ text, cls });
  };
  const isId = (ch: string) => /[A-Za-z0-9_]/.test(ch);

  while (i < n) {
    const c = src[i];

    // comment → end of line
    if (c === "#") {
      let j = i;
      while (j < n && src[j] !== "\n") j++;
      push(src.slice(i, j), "tok-com");
      i = j;
      continue;
    }

    // string literal (triple or single, with escapes)
    if (c === '"' || c === "'") {
      const triple = src.slice(i, i + 3);
      const isTriple = triple === '"""' || triple === "'''";
      const quote = isTriple ? triple : c;
      let j = i + quote.length;
      while (j < n) {
        if (src[j] === "\\") {
          j += 2;
          continue;
        }
        if (src.slice(j, j + quote.length) === quote) {
          j += quote.length;
          break;
        }
        j++;
      }
      push(src.slice(i, Math.min(j, n)), "tok-str");
      i = Math.min(j, n);
      continue;
    }

    // number
    if (/[0-9]/.test(c) && (i === 0 || !isId(src[i - 1]))) {
      let j = i;
      while (j < n && /[0-9_.]/.test(src[j])) j++;
      if (src[j] === "e" || src[j] === "E") {
        j++;
        if (src[j] === "+" || src[j] === "-") j++;
        while (j < n && /[0-9]/.test(src[j])) j++;
      }
      push(src.slice(i, j), "tok-num");
      i = j;
      continue;
    }

    // identifier / keyword
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < n && isId(src[j])) j++;
      const word = src.slice(i, j);
      push(word, PY_KEYWORDS.has(word) ? "tok-kw" : undefined);
      i = j;
      continue;
    }

    push(c);
    i++;
  }
  return out;
}

export function CodeBlock({ code, file = "python" }: { code: string; file?: string }) {
  const toks = tokenizePython(code.replace(/\n$/, ""));
  return (
    <div className="code-card my-8">
      <div className="flex items-center justify-between border-b border-pearl/10 px-4 py-2">
        <span className="t-mono text-[0.66rem] uppercase tracking-[0.18em] text-steel">{file}</span>
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-pearl/15" />
          <span className="h-2 w-2 rounded-full bg-pearl/15" />
          <span className="h-2 w-2 rounded-full bg-aqua/40" />
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-[0.82rem] leading-[1.7]">
        <code className="t-mono text-pearl">
          {toks.map((t, k) => (t.cls ? <span key={k} className={t.cls}>{t.text}</span> : <span key={k}>{t.text}</span>))}
        </code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------ structure -- */

export function Section({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  const num = String(n).padStart(2, "0");
  return (
    <section id={id} className="article-section scroll-mt-28">
      <h2 className="mt-16 flex items-baseline gap-4 font-serif text-2xl text-anthracite md:text-3xl" style={{ fontWeight: 500 }}>
        <span className="t-mono text-sm text-teal" style={{ fontWeight: 400 }}>{num}</span>
        <span>{title}</span>
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="dropcap mt-8 font-sans text-xl leading-[1.7] text-anthracite/90">{children}</p>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-[1.05rem] leading-[1.75] text-anthracite/85">{children}</p>;
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-sm bg-anthracite/[0.06] px-1.5 py-0.5 t-mono text-[0.86em] text-teal">{children}</code>
  );
}

export function Term({ children }: { children: ReactNode }) {
  return <em className="font-serif italic text-anthracite">{children}</em>;
}

/* numbered "here's the whole flow" overview box */
export function Pipeline({ steps }: { steps: string[] }) {
  return (
    <ol className="my-8 grid gap-px overflow-hidden rounded-sm border border-anthracite/12 bg-anthracite/12 sm:grid-cols-2">
      {steps.map((s, i) => (
        <li key={s} className="flex items-baseline gap-3 bg-sisal px-5 py-4">
          <span className="t-mono text-xs text-teal">{String(i + 1).padStart(2, "0")}</span>
          <span className="text-[0.98rem] leading-snug text-anthracite/85">{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function Callout({ kind = "Note", children }: { kind?: string; children: ReactNode }) {
  return (
    <aside className="my-8 border-l-2 border-teal bg-anthracite/[0.035] px-6 py-5">
      <p className="t-mono text-[0.66rem] uppercase tracking-[0.2em] text-teal">{kind}</p>
      <div className="mt-2 text-[1.02rem] leading-[1.7] text-anthracite/85">{children}</div>
    </aside>
  );
}

export function PullQuote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="my-12 border-l-2 border-teal pl-7">
      <p className="font-serif text-2xl italic leading-snug text-anthracite md:text-[1.7rem]">{children}</p>
    </blockquote>
  );
}

/* muted-border figure with a single aqua "insight" line (brand imagery rule) */
export function Figure({
  children,
  caption,
  legend,
}: {
  children: ReactNode;
  caption: string;
  legend?: { label: string; tone: "muted" | "aqua" }[];
}) {
  return (
    <figure className="corner-ticks my-9 rounded-sm border border-anthracite/12 bg-paper/60 p-6">
      <div className="w-full">{children}</div>
      <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-anthracite/12 pt-3">
        <span className="t-mono text-xs uppercase tracking-[0.16em] text-graphite">{caption}</span>
        {legend ? (
          <span className="flex items-center gap-4 t-mono text-xs">
            {legend.map((l) => (
              <span key={l.label} className={`flex items-center gap-1.5 ${l.tone === "aqua" ? "text-teal" : "text-graphite"}`}>
                <span className={`inline-block h-px w-4 ${l.tone === "aqua" ? "bg-teal" : "bg-graphite/60"}`} />
                {l.label}
              </span>
            ))}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="my-8 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[0.95rem]">
        <thead>
          <tr className="border-b border-anthracite/25">
            {head.map((h, i) => (
              <th
                key={h}
                className={`pb-2 t-mono text-[0.68rem] uppercase tracking-[0.14em] text-graphite ${i === 0 ? "" : "text-right"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-anthracite/10">
              {r.map((cell, ci) => (
                <td
                  key={ci}
                  className={`py-2.5 text-anthracite/85 ${ci === 0 ? "font-medium" : "tnum t-mono text-right text-anthracite"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function References({ items }: { items: ReactNode[] }) {
  return (
    <section className="mt-16 border-t border-anthracite/12 pt-8">
      <p className="t-mono text-[0.66rem] uppercase tracking-[0.24em] text-graphite">References</p>
      <ol className="mt-5 space-y-3 text-[0.9rem] leading-relaxed text-anthracite/75">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span className="t-mono text-xs text-teal">[{i + 1}]</span>
            <span>{it}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
