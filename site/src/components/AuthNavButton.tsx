"use client";

/* Desktop auth control for the top nav — the single place the header reflects
   sign-in state. Logged out: a "Sign in" link to /account. Logged in: an
   "Account" link plus a "Sign out" action that clears the shared session so the
   whole header updates at once. Hidden below `lg`; the hamburger (MobileNav)
   carries the same affordance on small screens. */

import Link from "next/link";
import { signOutSession, useSession } from "@/lib/session";

const PILL =
  "inline-flex items-center justify-center rounded-sm border border-pearl/30 py-2 t-mono text-xs font-semibold text-pearl transition-colors duration-300 hover:border-aqua hover:text-aqua";

export function AuthNavButton() {
  const { status, me } = useSession();

  // Reserve the button's footprint while the session resolves so the header
  // doesn't shift when it flips to Account / Sign out.
  if (status === "loading") {
    return <span aria-hidden className={`hidden w-[183px] lg:inline-flex ${PILL} opacity-0`}>Sign in</span>;
  }

  if (!me) {
    return (
      <Link href="/account" className={`hidden w-[183px] lg:inline-flex ${PILL}`}>
        Sign in
      </Link>
    );
  }

  return (
    <span className="hidden items-center gap-2 lg:inline-flex">
      <Link href="/account" className={`${PILL} px-5`}>Account</Link>
      <button
        type="button"
        onClick={() => void signOutSession()}
        className="t-mono text-xs font-semibold text-steel transition-colors duration-300 hover:text-aqua"
      >
        Sign out
      </button>
    </span>
  );
}
