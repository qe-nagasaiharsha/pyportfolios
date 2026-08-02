"use client";

/* Early-access capture — collect intent now, before subscriptions exist (a later
   milestone). Posts through the shared platform API client (lib/api), which
   resolves the base URL from NEXT_PUBLIC_API_BASE in dev and the nginx-proxied
   /api in production. Signups land in the customer DB, idempotent on duplicate
   emails. */

import { useState, type FormEvent } from "react";
import { PhotoBackdrop } from "@/components/brand/PhotoBackdrop";
import { api } from "@/lib/api";

type State = "idle" | "loading" | "done" | "error";

const INVALID_EMAIL = "Please enter a valid email address.";
const REQUEST_FAILED = "Something went wrong — please try again.";

export function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errMsg, setErrMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setErrMsg(INVALID_EMAIL);
      setState("error");
      return;
    }
    setState("loading");
    try {
      await api.earlyAccess(email);
      setState("done");
    } catch {
      setErrMsg(REQUEST_FAILED);
      setState("error");
    }
  }

  return (
    <section id="early-access" className="relative scroll-mt-20 overflow-hidden border-y border-pearl/10">
      <PhotoBackdrop src="/hero.jpeg" position="center 70%" />
      <div className="vignette pointer-events-none absolute inset-0" aria-hidden="true" />
      <div data-reveal className="relative mx-auto max-w-3xl px-6 py-28 text-center md:py-36">
          <h2 className="t-display text-pearl">
            Find your edge<span className="text-aqua">.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-pearl/70">
            Get your first lesson for free.
          </p>

          {state === "done" ? (
            <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-3 rounded-sm border border-aqua/40 bg-navy/70 backdrop-blur-sm px-6 py-4">
              <span className="live-dot inline-block h-2 w-2 rounded-full bg-aqua" aria-hidden="true" />
              <p className="t-mono text-sm uppercase tracking-[0.14em] text-pearl">You&apos;re on the list — talk soon.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
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
                  if (state === "error") { setState("idle"); setErrMsg(""); }
                }}
                aria-invalid={state === "error"}
                className="min-w-0 flex-1 rounded-sm border border-pearl/15 bg-navy/70 backdrop-blur-sm px-4 py-3 text-pearl placeholder:text-steel focus:border-aqua focus:outline-none"
              />
              <button
                type="submit"
                disabled={state === "loading"}
                className="shrink-0 rounded-sm bg-pearl px-8 py-3.5 t-mono text-sm font-semibold text-navy transition-colors duration-300 hover:bg-aqua disabled:opacity-60"
              >
                {state === "loading" ? "Joining…" : "Join free"}
              </button>
            </form>
          )}

          <p aria-live="polite" className="mt-3 h-4 t-mono text-xs text-mist">
            {state === "error" ? errMsg : ""}
          </p>
      </div>
    </section>
  );
}
