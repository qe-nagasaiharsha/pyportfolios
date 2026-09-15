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
  /** For 402s, the plan_code to upsell (e.g. "premium-monthly"), when the
      server tells us which tier the blocked download needs. */
  requiredPlan?: string;
  constructor(public status: number, message: string, requiredPlan?: string) {
    super(message);
    this.requiredPlan = requiredPlan;
  }
}

/** Build an ApiError from a non-OK response, parsing FastAPI's `detail`, which
    may be a string, a validation array, or an object {message, required_plan}
    (the content gate uses the last form). */
async function errorFrom(res: Response): Promise<ApiError> {
  let message = res.statusText;
  let requiredPlan: string | undefined;
  try {
    const body = (await res.json()) as {
      detail?: string | { msg?: string }[] | { message?: string; required_plan?: string };
    };
    const d = body.detail;
    if (typeof d === "string") message = d;
    else if (Array.isArray(d)) {
      if (d[0]?.msg) message = d[0].msg!;
    } else if (d && typeof d === "object") {
      if (d.message) message = d.message;
      requiredPlan = d.required_plan;
    }
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(res.status, message, requiredPlan);
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw await errorFrom(res);
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
  /** matches services.entitlements_for: "starter" | "pro" | "premium". */
  tier: "starter" | "pro" | "premium";
  features: string[];
}

export interface CheckoutSession {
  checkout_id: string;
  /** What to do next: mock → {type:"collect_card"}; Stripe → {type:"redirect", url}. */
  client_action: { type: string; url?: string };
}

/* ------------------------------------------------------------------ calls -- */

export const api = {
  /** Liveness + which payment provider is active ("mock" | "stripe"). */
  health: () => req<{ ok: boolean; provider: string }>("/health"),
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
  /** Gated notebook download — returns a Blob; throws ApiError (401 signed-out,
      402 not entitled, with .requiredPlan set to the tier to upsell). */
  notebook: async (slug: string): Promise<Blob> => {
    const res = await fetch(`${BASE}/content/notebooks/${slug}`, { credentials: "include" });
    if (!res.ok) throw await errorFrom(res);
    return res.blob();
  },
  /** Gated run-anywhere ZIP bundle (notebook + launchers). */
  bundle: async (slug: string): Promise<Blob> => {
    const res = await fetch(`${BASE}/content/bundles/${slug}`, { credentials: "include" });
    if (!res.ok) throw await errorFrom(res);
    return res.blob();
  },
  /** Gated typeset research-note PDF — free for the 4 samples, otherwise Pro. */
  pdf: async (slug: string): Promise<Blob> => {
    const res = await fetch(`${BASE}/content/pdfs/${slug}`, { credentials: "include" });
    if (!res.ok) throw await errorFrom(res);
    return res.blob();
  },
  earlyAccess: (email: string) =>
    req<{ ok: boolean; duplicate?: boolean }>("/early-access", { method: "POST", body: JSON.stringify({ email }) }),
  requestPasswordReset: (email: string) =>
    req<{ ok: boolean }>("/auth/request-password-reset", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token: string, new_password: string) =>
    req<{ ok: boolean }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, new_password }) }),
  changePassword: (current_password: string, new_password: string) =>
    req<{ ok: boolean }>("/auth/change-password", { method: "POST", body: JSON.stringify({ current_password, new_password }) }),
};

/** Trigger a browser download from a fetched Blob. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
