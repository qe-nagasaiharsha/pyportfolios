"use client";

/* Shared client-side session — one source of truth for "who is signed in and
   what they own", consumed by the nav, the pricing grid, the checkout guard and
   the account page. A tiny external store (useSyncExternalStore) so every
   component shares a single /me + /subscription + /entitlements fetch and all
   re-render together on sign-in / sign-out / purchase. */

import { useSyncExternalStore } from "react";
import { api, type Entitlements, type Me, type SubscriptionInfo } from "./api";

export type OwnedTier = "none" | "pro" | "premium";

export interface SessionState {
  status: "loading" | "ready";
  me: Me | null;
  sub: SubscriptionInfo | null;
  ent: Entitlements | null;
}

let state: SessionState = { status: "loading", me: null, sub: null, ent: null };
const listeners = new Set<() => void>();
let started = false;

function set(next: Partial<SessionState>): void {
  state = { ...state, ...next };
  for (const l of listeners) l();
}

/** Re-fetch identity + subscription + entitlements. Call after any auth or
    purchase so every subscriber (nav, pricing, …) reflects the new state. */
export async function refreshSession(): Promise<void> {
  const me = await api.me().catch(() => null);
  if (!me) {
    set({ status: "ready", me: null, sub: null, ent: null });
    return;
  }
  const [sub, ent] = await Promise.all([
    api.subscription().catch(() => null),
    api.entitlements().catch(() => null),
  ]);
  set({ status: "ready", me, sub, ent });
}

/** Sign out and clear the shared session (nav flips back to "Sign in"). */
export async function signOutSession(): Promise<void> {
  await api.logout().catch(() => null);
  set({ status: "ready", me: null, sub: null, ent: null });
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (!started) {
    started = true;
    void refreshSession();
  }
  return () => {
    listeners.delete(cb);
  };
}

/** The tier the user actually owns, from server entitlements (never trusted for
    gating — content routes enforce independently — only for showing the right
    labels). A subscription only counts while its effective status is active. */
export function ownedTier(s: SessionState): OwnedTier {
  if (!s.me) return "none";
  if (s.ent?.tier === "premium") return "premium";
  if (s.ent?.tier === "pro" && s.sub?.status === "active") return "pro";
  return "none";
}

/** 0 = free / logged-out, 1 = pro, 2 = premium. Mirrors the backend PLAN_RANK
    so the UI blocks the same downgrades the API does. */
export function ownedRank(s: SessionState): number {
  const t = ownedTier(s);
  return t === "premium" ? 2 : t === "pro" ? 1 : 0;
}

export function planRank(planCode: string): number {
  if (planCode === "premium-monthly" || planCode === "premium-annual") return 2;
  if (planCode === "pro-monthly" || planCode === "pro-annual") return 1;
  return 0;
}

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
