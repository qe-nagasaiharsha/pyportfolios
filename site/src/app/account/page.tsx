"use client";

/* Account — sign in / sign up + the member area (subscription status,
   entitlements, gated notebook downloads, cancel). Fully client-side: the
   static export talks to the platform API through nginx (/api). */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArticleNav } from "@/components/article/ArticleNav";
import { ARTICLES } from "@/lib/articles";
import { api, ApiError, type Entitlements, type Me, type SubscriptionInfo } from "@/lib/api";

const input =
  "w-full rounded-md border border-pearl/15 bg-navy-sunken/60 px-4 py-3 text-pearl placeholder:text-steel/60 outline-none transition-colors focus:border-aqua/50";
const label = "t-mono text-[0.64rem] uppercase tracking-[0.16em] text-steel";
const btn =
  "inline-flex items-center justify-center rounded-full bg-pearl px-7 py-3 text-sm font-semibold text-navy transition-colors duration-300 hover:bg-aqua disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "inline-flex items-center justify-center rounded-full border border-pearl/25 px-6 py-2.5 text-sm font-semibold text-pearl transition-colors duration-300 hover:border-aqua/50 hover:text-aqua disabled:opacity-50";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function AuthForms({ onAuthed }: { onAuthed: (me: Me) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const me =
        mode === "signup"
          ? await api.register(email, password, name || undefined)
          : await api.login(email, password);
      onAuthed(me);
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "The platform API is unreachable — is the sidecar running?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="flex rounded-full border border-pearl/15 p-1" role="tablist">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setErr(null); }}
            className={`flex-1 rounded-full px-4 py-2 t-mono text-[0.68rem] uppercase tracking-[0.16em] transition-colors ${
              mode === m ? "bg-pearl text-navy" : "text-steel hover:text-pearl"
            }`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-8 space-y-5">
        {mode === "signup" ? (
          <div>
            <label htmlFor="acc-name" className={label}>Name</label>
            <input id="acc-name" className={`${input} mt-2`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" autoComplete="name" />
          </div>
        ) : null}
        <div>
          <label htmlFor="acc-email" className={label}>Email</label>
          <input id="acc-email" type="email" required className={`${input} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="acc-pass" className={label}>Password</label>
          <input
            id="acc-pass"
            type="password"
            required
            minLength={8}
            className={`${input} mt-2`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </div>
        {err ? <p className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{err}</p> : null}
        <button type="submit" disabled={busy} className={`${btn} w-full`}>
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}

function MemberArea({ me, onSignedOut }: { me: Me; onSignedOut: () => void }) {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [ent, setEnt] = useState<Entitlements | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [s, e] = await Promise.all([api.subscription().catch(() => null), api.entitlements().catch(() => null)]);
    setSub(s);
    setEnt(e);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const isPro = ent?.tier === "pro" || ent?.tier === "lifetime";

  const cancel = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const s = await api.cancelSubscription();
      setSub(s);
      setMsg(`Cancellation scheduled — access continues until ${fmtDate(s.current_period_end)}.`);
    } catch (ex) {
      setMsg(ex instanceof ApiError ? ex.message : "Could not cancel — try again.");
    } finally {
      setBusy(false);
    }
  };

  const download = async (slug: string) => {
    setMsg(null);
    try {
      const blob = await api.notebook(slug);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.ipynb`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (ex) {
      setMsg(ex instanceof ApiError ? ex.message : "Download failed.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* identity row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pearl/10 pb-6">
        <div>
          <p className={label}>Signed in as</p>
          <p className="mt-1 text-lg text-pearl">{me.name || me.email}</p>
          {me.name ? <p className="text-sm text-steel">{me.email}</p> : null}
        </div>
        <button
          className={btnGhost}
          onClick={async () => { await api.logout().catch(() => null); onSignedOut(); }}
        >
          Sign out
        </button>
      </div>

      {/* subscription */}
      <div className="mt-10">
        <h2 className="font-serif text-xl text-pearl md:text-2xl">Subscription</h2>
        <div className="mt-4 rounded-lg border border-pearl/10 bg-navy-elevated/50 p-6">
          {sub ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-pearl">
                  <span className="t-mono text-[0.7rem] uppercase tracking-[0.14em] text-aqua">{sub.plan_code}</span>
                  <span className="ml-3 t-mono text-[0.7rem] uppercase tracking-[0.14em] text-emerald-300/90">● {sub.status}</span>
                </p>
                <p className="text-sm text-mist">
                  {sub.cancel_at_period_end
                    ? `Cancels at period end — access until ${fmtDate(sub.current_period_end)}`
                    : sub.current_period_end
                      ? `Renews ${fmtDate(sub.current_period_end)}`
                      : "Lifetime access — nothing renews, nothing expires"}
                </p>
              </div>
              {sub.status === "active" && !sub.cancel_at_period_end && sub.current_period_end ? (
                <button className={btnGhost} onClick={cancel} disabled={busy}>Cancel renewal</button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-mist">Free tier — the Starter plan. Upgrade for the full library and notebook downloads.</p>
              <Link href="/checkout?plan=pro-monthly" className={btn}>Upgrade to Pro</Link>
            </div>
          )}
        </div>
        {msg ? <p className="mt-3 text-sm text-aqua">{msg}</p> : null}
      </div>

      {/* notebooks */}
      <div className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl text-pearl md:text-2xl">Notebook library</h2>
          <span className="t-mono text-[0.64rem] uppercase tracking-[0.14em] text-steel">
            {isPro ? `${ARTICLES.length} notebooks · full access` : "Pro & Lifetime"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          Every article&apos;s runnable companion notebook, served from your account.
          {isPro ? "" : " Upgrade to download."}
        </p>
        <ul className="mt-5 divide-y divide-pearl/10 rounded-lg border border-pearl/10 bg-navy-elevated/50">
          {ARTICLES.map((a) => (
            <li key={a.slug} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-[0.95rem] text-pearl">{a.title}</p>
                <p className="t-mono text-[0.66rem] text-steel">{a.notebook}</p>
              </div>
              {isPro ? (
                <button
                  onClick={() => download(a.slug)}
                  className="shrink-0 t-mono text-[0.66rem] uppercase tracking-[0.14em] text-aqua transition-transform hover:translate-x-0.5"
                >
                  Download ↓
                </button>
              ) : (
                <span className="shrink-0 t-mono text-[0.66rem] uppercase tracking-[0.14em] text-steel/60">Locked</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api.me().then(setMe).catch(() => null).finally(() => setChecked(true));
  }, []);

  return (
    <div className="min-h-screen bg-navy text-pearl">
      <ArticleNav />
      <main>
        <section className="relative overflow-hidden border-b border-pearl/10">
          <div className="grid-paper absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-24 lg:px-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-pearl/25" aria-hidden="true" />
              <p className="t-eyebrow text-pearl">Members</p>
            </div>
            <h1 className="t-display mt-8 text-pearl">
              {me ? "Your account" : "Sign in"}<span className="text-aqua">.</span>
            </h1>
          </div>
        </section>
        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            {!checked ? (
              <p className="text-center t-mono text-xs uppercase tracking-[0.2em] text-steel">Loading…</p>
            ) : me ? (
              <MemberArea me={me} onSignedOut={() => setMe(null)} />
            ) : (
              <AuthForms onAuthed={setMe} />
            )}
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
