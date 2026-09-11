"use client";

/* Password-reset landing — the link in the reset email points here with
   ?token=…; single-use, 1h expiry, resets revoke every session. */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArticleNav } from "@/components/article/ArticleNav";
import { api, ApiError } from "@/lib/api";

const input =
  "w-full rounded-md border border-pearl/15 bg-navy-sunken/60 px-4 py-3 text-pearl placeholder:text-steel/60 outline-none transition-colors focus:border-aqua/50";

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-7 text-center">
        <p className="text-2xl" aria-hidden="true">✓</p>
        <h2 className="mt-2 font-serif text-xl text-pearl">Password reset.</h2>
        <p className="mt-2 text-sm text-mist">All sessions were signed out — sign in with the new password…</p>
      </div>
    );
  }

  return (
    <form
      className="mx-auto max-w-md space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        try {
          await api.resetPassword(token.trim(), password);
          setDone(true);
          setTimeout(() => router.push("/account"), 1600);
        } catch (ex) {
          setErr(ex instanceof ApiError ? ex.message : "The platform API is unreachable.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <label htmlFor="rs-token" className="t-mono text-[0.64rem] uppercase tracking-[0.16em] text-steel">Reset token</label>
        <input id="rs-token" required className={`${input} mt-2 t-mono text-[0.85rem]`} value={token} onChange={(e) => setToken(e.target.value)} placeholder="From the reset email" />
      </div>
      <div>
        <label htmlFor="rs-pass" className="t-mono text-[0.64rem] uppercase tracking-[0.16em] text-steel">New password</label>
        <input id="rs-pass" type="password" required minLength={8} className={`${input} mt-2`} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="Min. 8 characters" />
      </div>
      {err ? <p className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{err}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center rounded-full bg-pearl px-7 py-3 text-sm font-semibold text-navy transition-colors duration-300 hover:bg-aqua disabled:opacity-50"
      >
        {busy ? "…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPage() {
  return (
    <div className="min-h-dvh bg-navy text-pearl">
      <ArticleNav />
      <main>
        <section className="relative overflow-hidden border-b border-pearl/10">
          <div className="grid-paper absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-24 lg:px-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-pearl/25" aria-hidden="true" />
              <p className="t-eyebrow text-pearl">Members · Password reset</p>
            </div>
            <h1 className="t-display mt-8 text-pearl">
              Set a new password<span className="text-aqua">.</span>
            </h1>
          </div>
        </section>
        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <Suspense fallback={<p className="text-center t-mono text-xs uppercase tracking-[0.2em] text-steel">Loading…</p>}>
              <ResetInner />
            </Suspense>
          </div>
        </section>
      </main>
      <footer className="bg-navy-sunken">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-6 py-12 t-mono text-[0.66rem] uppercase tracking-[0.16em] text-steel sm:flex-row lg:px-8">
          <Link href="/" className="transition-colors hover:text-aqua">← pyportfolios.com</Link>
          <span>Where finance theory, coding &amp; markets converge · <span className="text-aqua">pyportfolios.com</span></span>
        </div>
      </footer>
    </div>
  );
}
