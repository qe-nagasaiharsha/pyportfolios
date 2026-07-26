/* ============================================================================
   Platform API client — talks to the FastAPI sidecar (platform/), which nginx
   exposes at /api on the same origin as the static site (deploy/nginx-8080.conf).
   The static export has no server of its own: every call here happens in the
   browser, with cookies (httpOnly session) riding along via credentials.
   For local dev against `next dev`, point NEXT_PUBLIC_API_BASE at the sidecar
   (e.g. http://127.0.0.1:8787/api) since there is no proxy in dev.
   ========================================================================== */

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: string | { msg?: string }[] };
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail) && body.detail[0]?.msg) detail = body.detail[0].msg!;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ types -- */

export interface Me {
  id: number;
  email: string;
  name: string | null;
}

export interface Plan {
  code: string;
  name: string;
  amount_cents: number;
  interval: string | null;
}

export interface SubscriptionInfo {
  plan_code: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface Entitlements {
  tier: "free" | "pro" | "lifetime";
  features: string[];
}

export interface CheckoutSession {
  checkout_id: string;
  client_action: string;
}

/* ------------------------------------------------------------------ calls -- */

export const api = {
  register: (email: string, password: string, name?: string) =>
    req<Me>("/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) }),
  login: (email: string, password: string) =>
    req<Me>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => req<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  me: () => req<Me>("/auth/me"),
  plans: () => req<Plan[]>("/plans"),
  subscription: () => req<SubscriptionInfo | null>("/subscription"),
  cancelSubscription: () => req<SubscriptionInfo>("/subscription/cancel", { method: "POST" }),
  entitlements: () => req<Entitlements>("/entitlements"),
  createCheckout: (plan_code: string) =>
    req<CheckoutSession>("/checkout", { method: "POST", body: JSON.stringify({ plan_code }) }),
  /** Mock-provider confirm — the simulator keys success/decline off the card number
      alone; expiry/CVC are UI-only and intentionally never leave the browser. */
  confirmCheckout: (checkout_id: string, card: { number: string; exp: string; cvc: string }) =>
    req<{ status: string }>(`/checkout/${checkout_id}/confirm`, {
      method: "POST",
      body: JSON.stringify({ card_number: card.number }),
    }),
  /** Gated download — returns a Blob (402 when not entitled). */
  notebook: async (slug: string): Promise<Blob> => {
    const res = await fetch(`${BASE}/content/notebooks/${slug}`, { credentials: "include" });
    if (!res.ok) throw new ApiError(res.status, res.status === 402 ? "Pro subscription required" : res.statusText);
    return res.blob();
  },
};
