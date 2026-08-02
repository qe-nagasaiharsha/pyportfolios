"use client";

/* Checkout — plan summary + payment form against the platform API.
   The payment provider is the built-in mock while the site is pre-launch
   (deterministic test cards; card data goes to our own sidecar only and is
   never stored). Flipping PAYMENT_PROVIDER=stripe on the sidecar swaps this
   flow for Stripe Checkout with no changes here beyond following the
   client_action returned by /api/checkout. */

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArticleNav } from "@/components/article/ArticleNav";
import { api, ApiError, type Me, type Plan } from "@/lib/api";

const input =
  "w-full rounded-md border border-pearl/15 bg-navy-sunken/60 px-4 py-3 t-mono text-[0.9rem] text-pearl placeholder:text-steel/50 outline-none transition-colors focus:border-aqua/50";
const label = "t-mono text-[0.64rem] uppercase tracking-[0.16em] text-steel";
const btn =
  "inline-flex w-full items-center justify-center rounded-full bg-pearl px-7 py-3.5 text-sm font-semibold text-navy transition-colors duration-300 hover:bg-aqua disabled:cursor-not-allowed disabled:opacity-50";

const PLAN_BLURB: Record<string, string> = {
  "pro-monthly": "Full curriculum, unlimited notebooks, cancel any time.",
  "pro-annual": "Everything in Pro, two months free.",
  "premium-monthly": "Everything in Pro, plus datasets, deep-dive reports and priority access.",
  "premium-annual": "Everything in Premium, two months free.",
};

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function CheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const planCode = params.get("plan") ?? "pro-monthly";

  const [me, setMe] = useState<Me | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [phase, setPhase] = useState<"loading" | "auth" | "pay" | "done">("loading");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* auth inline */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNew, setIsNew] = useState(true);

  /* mock card */
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12/28");
  const [cvc, setCvc] = useState("123");

  const plan = useMemo(() => plans.find((p) => p.code === planCode), [plans, planCode]);

  useEffect(() => {
    Promise.all([api.me().catch(() => null), api.plans().catch(() => [] as Plan[])]).then(([m, ps]) => {
      setMe(m);
      setPlans(ps);
      setPhase(m ? "pay" : "auth");
    });
  }, []);

  const doAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const m = isNew ? await api.register(email, password) : await api.login(email, password);
      setMe(m);
      setPhase("pay");
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "The platform API is unreachable — is the sidecar running?");
    } finally {
      setBusy(false);
    }
  };

  const doPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const session = await api.createCheckout(planCode);
      await api.confirmCheckout(session.checkout_id, {
        number: card.replace(/\s+/g, ""),
        exp,
        cvc,
      });
      setPhase("done");
      setTimeout(() => router.push("/account"), 1600);
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "Payment failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className="mx-auto grid max-w-4xl gap-10 px-6 py-16 md:grid-cols-[1fr_1.2fr] lg:px-8">
        {/* order summary */}
        <aside className="h-fit rounded-lg border border-pearl/10 bg-navy-elevated/50 p-7">
          <p className={label}>Your plan</p>
          <h2 className="mt-3 text-2xl text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>
            {plan?.name ?? planCode}
          </h2>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl text-pearl" style={{ fontFamily: "var(--font-sans)", fontWeight: 900 }}>
              {plan ? money(plan.amount_cents) : "—"}
            </span>
            <span className="t-mono text-xs uppercase tracking-[0.14em] text-steel">
              {plan?.interval ? `/ ${plan.interval}` : "one-time"}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-mist">{PLAN_BLURB[planCode] ?? ""}</p>
          <div className="mt-6 border-t border-pearl/10 pt-4">
            <p className="t-mono text-[0.62rem] uppercase tracking-[0.14em] leading-relaxed text-steel">
              Pre-launch test mode — the built-in payment simulator is active and no real card is
              ever charged. Use 4242 4242 4242 4242 to approve, 4000 0000 0000 0002 to decline.
            </p>
          </div>
        </aside>

        {/* flow */}
        <div>
          {phase === "loading" ? (
            <p className="t-mono text-xs uppercase tracking-[0.2em] text-steel">Loading…</p>
          ) : null}

          {phase === "auth" ? (
            <form onSubmit={doAuth} className="space-y-5">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-xl text-pearl">First, an account</h3>
                <button type="button" onClick={() => setIsNew((v) => !v)} className="t-mono text-[0.66rem] uppercase tracking-[0.14em] text-aqua">
                  {isNew ? "Have one? Sign in" : "New? Create one"}
                </button>
              </div>
              <div>
                <label htmlFor="co-email" className={label}>Email</label>
                <input id="co-email" type="email" required className={`${input} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div>
                <label htmlFor="co-pass" className={label}>Password</label>
                <input id="co-pass" type="password" required minLength={8} className={`${input} mt-2`} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isNew ? "new-password" : "current-password"} />
              </div>
              {err ? <p className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{err}</p> : null}
              <button type="submit" disabled={busy} className={btn}>{busy ? "…" : "Continue to payment"}</button>
            </form>
          ) : null}

          {phase === "pay" ? (
            <form onSubmit={doPay} className="space-y-5">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-xl text-pearl">Payment</h3>
                {me ? <span className="t-mono text-[0.66rem] text-steel">{me.email}</span> : null}
              </div>
              <div>
                <label htmlFor="co-card" className={label}>Card number · test simulator</label>
                <input id="co-card" required inputMode="numeric" className={`${input} mt-2`} value={card} onChange={(e) => setCard(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="co-exp" className={label}>Expiry</label>
                  <input id="co-exp" required className={`${input} mt-2`} value={exp} onChange={(e) => setExp(e.target.value)} placeholder="MM/YY" />
                </div>
                <div>
                  <label htmlFor="co-cvc" className={label}>CVC</label>
                  <input id="co-cvc" required inputMode="numeric" className={`${input} mt-2`} value={cvc} onChange={(e) => setCvc(e.target.value)} />
                </div>
              </div>
              {err ? <p className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{err}</p> : null}
              <button type="submit" disabled={busy || !plan} className={btn}>
                {busy ? "Processing…" : plan ? `Pay ${money(plan.amount_cents)} (test)` : "Plan unavailable"}
              </button>
              <p className="t-mono text-[0.6rem] uppercase tracking-[0.14em] leading-relaxed text-steel/70">
                Simulated payment — no real charge, no card data stored.
              </p>
            </form>
          ) : null}

          {phase === "done" ? (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-7 text-center">
              <p className="text-2xl" aria-hidden="true">✓</p>
              <h3 className="mt-2 font-serif text-xl text-pearl">You&apos;re in.</h3>
              <p className="mt-2 text-sm text-mist">Subscription active — taking you to your account…</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-navy text-pearl">
      <ArticleNav />
      <main>
        <section className="relative overflow-hidden border-b border-pearl/10">
          <div className="grid-paper absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-4xl px-6 py-16 md:py-20 lg:px-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-pearl/25" aria-hidden="true" />
              <p className="t-eyebrow text-pearl">Checkout</p>
            </div>
            <h1 className="t-display mt-6 text-pearl">
              Almost there<span className="text-aqua">.</span>
            </h1>
          </div>
        </section>
        <Suspense fallback={<p className="px-6 py-16 text-center t-mono text-xs uppercase tracking-[0.2em] text-steel">Loading…</p>}>
          <CheckoutInner />
        </Suspense>
      </main>
      <footer className="bg-navy-sunken">
        <div className="mx-auto flex max-w-4xl flex-col justify-between gap-3 px-6 py-12 t-mono text-[0.66rem] uppercase tracking-[0.16em] text-steel sm:flex-row lg:px-8">
          <Link href="/" className="transition-colors hover:text-aqua">← pyportfolios.com</Link>
          <span>Secured by the platform API · test mode</span>
        </div>
      </footer>
    </div>
  );
}
