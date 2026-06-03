"use client";

/* Early-access capture — collect intent now, before subscriptions exist (a later
   milestone). Static-site friendly: set ENDPOINT to a form service (Formspree /
   Buttondown) or the platform API and it POSTs; until then it confirms
   optimistically so the UX is complete and demoable. */

import { useState, type FormEvent } from "react";

const ENDPOINT = ""; // ← set to a form endpoint to start collecting for real

type State = "idle" | "loading" | "done" | "error";

export function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState("error");
      return;
    }
    setState("loading");
    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error("bad response");
      } else {
        await new Promise((r) => setTimeout(r, 450)); // no endpoint wired yet
      }
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <section id="early-access" className="scroll-mt-20 border-b border-pearl/10">
      <div className="relative overflow-hidden">
        <div className="grid-paper absolute inset-0" aria-hidden="true" />
        <div className="hero-aura absolute inset-0" aria-hidden="true" />
        <div data-reveal className="relative mx-auto max-w-3xl px-6 py-28 text-center md:py-32">
          <p className="t-eyebrow text-mist">Early access</p>
          <h2 className="t-display mt-6 text-pearl" style={{ fontSize: "clamp(2rem, 4vw + 1rem, 3.4rem)" }}>
            Get the first lessons<span className="text-aqua"> free</span>.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-mist">
            Join the early list — we&apos;ll send new case studies as they ship and let you in first when the
            full platform goes live. No noise.
          </p>

          {state === "done" ? (
            <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-3 rounded-sm border border-aqua/40 bg-navy-elevated/60 px-6 py-4">
              <span className="live-dot inline-block h-2 w-2 rounded-full bg-aqua" aria-hidden="true" />
              <p className="t-mono text-sm uppercase tracking-[0.14em] text-pearl">You&apos;re on the list — talk soon.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
              <label htmlFor="ea-email" className="sr-only">Email address</label>
              <input
                id="ea-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state === "error") setState("idle");
                }}
                aria-invalid={state === "error"}
                className="min-w-0 flex-1 rounded-sm border border-pearl/15 bg-navy-elevated/60 px-4 py-3 text-pearl placeholder:text-steel focus:border-aqua focus:outline-none"
              />
              <button
                type="submit"
                disabled={state === "loading"}
                className="shrink-0 rounded-sm bg-pearl px-7 py-3 text-sm font-semibold text-navy transition-colors duration-300 hover:bg-aqua disabled:opacity-60"
              >
                {state === "loading" ? "Joining…" : "Join free"}
              </button>
            </form>
          )}

          <p aria-live="polite" className="mt-3 h-4 t-mono text-xs text-mist">
            {state === "error" ? "Please enter a valid email address." : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
