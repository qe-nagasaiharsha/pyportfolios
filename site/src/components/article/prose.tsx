/* ============================================================================
   Article reading primitives — the light "working paper" surface.
   Body = Switzer; section headings = Lora; code/captions/labels = Courier.
   Pure Server Components: Python is highlighted at build time (zero client JS).
   ========================================================================== */

import { isValidElement, Fragment, type ReactNode } from "react";
import katex from "katex";

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

    // identifier / keyword / function call
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < n && isId(src[j])) j++;
      const word = src.slice(i, j);
      let cls: string | undefined;
      if (PY_KEYWORDS.has(word)) {
        cls = "tok-kw";
      } else {
        // a call if the next non-space char is "(" → highlight as a function
        let k = j;
        while (k < n && src[k] === " ") k++;
        if (src[k] === "(") cls = "tok-fn";
      }
      push(word, cls);
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
      <div className="flex items-center border-b border-pearl/10 px-4 py-2">
        <span className="t-mono text-[0.66rem] uppercase tracking-[0.18em] text-steel">{file}</span>
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
  const num = `${n}.`;
  return (
    <section id={id} className="article-section scroll-mt-28">
      <h2 data-reveal className="mt-16 flex items-baseline gap-3 font-sans text-[1.7rem] leading-tight tracking-tight text-pearl md:text-[2rem]" style={{ fontWeight: 500 }}>
        <span className="text-pearl">{num}</span>
        <span>{title}</span>
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* sub-heading within a section (e.g. "2.1 The Particle Picture") */
export function SubSection({ label, title, children }: { label?: string; title: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-10">
      <h3 data-reveal className="flex items-baseline gap-3 font-sans text-[1.25rem] tracking-tight text-pearl md:text-[1.4rem]" style={{ fontWeight: 700 }}>
        {label ? <span className="text-pearl">{label}</span> : null}
        <span>{title}</span>
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/* Does a list item lead with a bold term? If so its bullet is white to match
   that lead-in; otherwise the item is plain grey body text and the bullet is
   grey to match. Recurses through the leading fragment/array node. */
function leadsBold(node: ReactNode): boolean {
  if (Array.isArray(node)) return leadsBold(node[0]);
  if (isValidElement(node)) {
    if (node.type === "b" || node.type === "strong") return true;
    if (node.type === Fragment) {
      const children = (node.props as { children?: ReactNode }).children;
      return leadsBold(Array.isArray(children) ? children[0] : children);
    }
  }
  return false;
}

/* a plain bulleted list on the reading surface — the bullet colour matches the
   colour of the text beside it (white next to a bold lead-in, grey otherwise) */
/* `ordered` swaps the dot marker for "1." — same grey as the body text, no
   brackets, matching the reference markers. */
export function Bullets({ items, ordered = false }: { items: ReactNode[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";
  return (
    <List className="mt-5 space-y-2.5 text-[1.05rem] leading-[1.7] text-pearl/65">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          {ordered ? (
            <span className="shrink-0 tnum">{i + 1}.</span>
          ) : (
            <span
              className={`mt-[0.55rem] h-1 w-1 shrink-0 rounded-full ${leadsBold(it) ? "bg-pearl" : "bg-pearl/65"}`}
              aria-hidden="true"
            />
          )}
          {/* a div, not a span: bullets carry block content (display formulas,
              which render as <div>), and a <div> inside a <span> is invalid */}
          <div className="min-w-0 flex-1">{it}</div>
        </li>
      ))}
    </List>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="mt-8 font-sans text-xl leading-[1.7] text-pearl/65 text-justify">{children}</p>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-[1.05rem] leading-[1.75] text-pearl/65 text-justify">{children}</p>;
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-sm bg-white/[0.06] px-1.5 py-0.5 t-mono text-[0.86em] text-aqua">{children}</code>
  );
}

/* A defined term or an emphasised phrase in the reading text. Bold rather than
   italic: italic prose sat too close to the italic that KaTeX gives maths
   variables, so a stressed word and a symbol looked like the same thing. Bold
   separates them and stays legible in the body's muted grey. */
export function Term({ children }: { children: ReactNode }) {
  return <strong className="font-serif font-bold text-pearl">{children}</strong>;
}

/* -------------------------------------------------------------- Math (KaTeX) --
   Proper typeset mathematics, rendered to static HTML at build time (the "web
   formula editor"). Write LaTeX; get real fractions, radicals and sub/scripts.
   <Math>x^2</Math> inline · <Math block>...</Math> as a centred display block. */
export function Formula({
  children,
  block = false,
  bold = true,
}: {
  children: string;
  block?: boolean;
  bold?: boolean;
}) {
  /* Bold is applied in LaTeX, not CSS. KaTeX pins its glyph spans to weight 400
     and computes spacing from normal-weight metrics at build time, so a CSS
     override both fails and drifts the layout; \boldsymbol makes KaTeX lay the
     formula out in bold from the start — letters bold-italic, operators and
     digits bold upright. */
  const html = katex.renderToString(bold ? `\\boldsymbol{${children}}` : children, {
    displayMode: block,
    throwOnError: false,
    output: "html",
  });
  if (block) {
    return (
      <div
        className="my-6 overflow-x-auto text-pearl"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <span className="text-pearl" dangerouslySetInnerHTML={{ __html: html }} />;
}

/* numbered "here's the whole flow" overview box */
export function Pipeline({ steps }: { steps: string[] }) {
  return (
    <ol className="my-8 grid gap-px overflow-hidden rounded-sm border border-pearl/10 bg-pearl/10 sm:grid-cols-2">
      {steps.map((s, i) => (
        <li key={s} className="flex items-baseline gap-3 bg-anthracite px-5 py-4">
          <span className="t-mono text-xs text-aqua">{String(i + 1).padStart(2, "0")}</span>
          <span className="text-[0.98rem] leading-snug text-pearl/80">{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function Callout({ kind = "Note", children }: { kind?: string; children: ReactNode }) {
  return (
    <aside className="my-8 border-l-2 border-aqua bg-white/[0.05] px-6 py-5">
      <p className="t-mono text-[0.66rem] uppercase tracking-[0.2em] text-aqua">{kind}</p>
      <div className="mt-2 text-[1.02rem] leading-[1.7] text-pearl/80">{children}</div>
    </aside>
  );
}

export function PullQuote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="my-12 border-l-2 border-aqua pl-7">
      <p className="font-serif text-2xl italic leading-snug text-pearl md:text-[1.7rem]">{children}</p>
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
    <figure data-reveal className="corner-ticks my-9 rounded-sm border border-black/10 bg-sisal p-4 sm:p-5">
      <div className="w-full">{children}</div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-anthracite/12 pt-3">
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

export function DataTable({
  head,
  rows,
  variant = "data",
}: {
  head: string[];
  rows: ReactNode[][];
  variant?: "data" | "prose";
}) {
  const prose = variant === "prose";
  return (
    <div className="my-8 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[0.95rem]">
        <thead>
          <tr className="border-b border-pearl/20">
            {head.map((h, i) => (
              <th
                key={h}
                className={`pb-2 t-mono text-[0.68rem] uppercase tracking-[0.14em] text-steel ${
                  prose || i === 0 ? "" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-pearl/10 align-top">
              {r.map((cell, ci) => (
                <td
                  key={ci}
                  className={
                    prose
                      ? `py-2.5 pr-5 leading-[1.6] text-pearl/80 ${ci === 0 ? "font-medium text-pearl" : ""}`
                      : `py-2.5 text-pearl/80 ${ci === 0 ? "font-medium" : "tnum t-mono text-right text-pearl"}`
                  }
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
    <section className="mt-16 border-t border-pearl/10 pt-8">
      <p className="t-mono text-[0.66rem] uppercase tracking-[0.24em] text-steel">References</p>
      <ol className="mt-5 space-y-3 text-[0.9rem] leading-relaxed text-pearl/75">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span>{i + 1}.</span>
            <span>{it}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
