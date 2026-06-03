"use client";

/* Early-access capture — collect intent now, before subscriptions exist (a later
   milestone). Static-site friendly: set ENDPOINT to a form service (Formspree /
   Buttondown) or the platform API and it POSTs; until then it confirms
   optimistically so the UX is complete and demoable. */

import { useState, useEffect, useRef, type FormEvent } from "react";
import { MountainScene } from "@/components/brand/MountainScene";

const ENDPOINT = ""; // ← set to a form endpoint to start collecting for real

type State = "idle" | "loading" | "done" | "error";

export function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const sceneRef = useRef<HTMLDivElement>(null);

  // subtle scroll parallax — drives --ms-p (-1..1) on the scene; the ridge
  // layers translate by different multiples of it. Off under reduced-motion.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const center = r.top + r.height / 2;
      const p = Math.max(-1, Math.min(1, (vh / 2 - center) / (vh / 2 + r.height / 2)));
      el.style.setProperty("--ms-p", p.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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
      <div ref={sceneRef} className="relative overflow-hidden">
        <MountainScene />
        <div className="vignette pointer-events-none absolute inset-0" aria-hidden="true" />
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
