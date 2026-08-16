# Staging deploy — Vercel + Render (client review, Stripe test mode)

A week-long, always-on staging of pyportfolios.com for client approval. No real
money (Stripe stays in **test** mode). Two hosts + the domain:

```
visitor browser ─► Vercel (static Next.js from site/)
                     └─ API calls ─► Render (FastAPI, platform/)   [cross-origin + CORS]
                                        │
Stripe ──────────── webhook ───────────┘  (direct to Render URL)
                                        └─ Postgres (Render managed)
```

Cross-origin wiring: a Next.js **static export** ignores `vercel.json` rewrites,
so the browser talks to Render directly. That makes it cross-origin, which needs
two things on the backend: the session cookie set `SameSite=None; Secure`
(`COOKIE_SAMESITE=none`), and the Vercel origin allow-listed for credentialed
CORS (`CORS_ORIGINS=https://<your>.vercel.app`). Both are env-driven.

---

## 1. Backend → Render

1. Push this branch to GitHub.
2. Render dashboard → **New → Blueprint** → pick this repo. It reads
   [`render.yaml`](render.yaml): creates `pyportfolios-api` + a Postgres DB and
   wires `DATABASE_URL` automatically.
3. In the service's **Environment**, paste the secrets marked `sync:false`
   (test values):
   - `STRIPE_SECRET_KEY` = `sk_test_…`
   - `STRIPE_PRICE_PRO_MONTHLY / _PRO_ANNUAL / _PREMIUM_MONTHLY / _PREMIUM_ANNUAL` = the `price_…` ids
   - `STRIPE_WEBHOOK_SECRET` — leave blank for now (step 4 fills it)
4. Deploy. You get a URL like `https://pyportfolios-api.onrender.com`.
   Check it: `https://…onrender.com/api/health` → `{"ok":true,"provider":"stripe"}`.

> On first boot the app creates all tables and seeds the 5 plans (create_all).
> No migration step for a fresh DB.

## 2. Frontend → Vercel

1. Vercel → **Add New → Project** → import this repo.
2. **Root Directory: `site`** (critical), **Production Branch: `stripe-integration`**
   (Settings → Environments → Production → Branch Tracking).
3. **Environment Variable:** `NEXT_PUBLIC_API_BASE` = your Render API base, e.g.
   `https://pyportfolios-api.onrender.com/api`. (Inlined at build → redeploy after changing.)
4. Then set the matching backend env on Render so the cross-origin cookie works:
   - `COOKIE_SAMESITE=none`  (cookie rides cross-site fetches)
   - `CORS_ORIGINS=https://<your-project>.vercel.app`  (allow the frontend origin)
   - `PUBLIC_BASE_URL=https://<your-project>.vercel.app`  (Stripe redirects back here)
   `COOKIE_SECURE` is already `true`.

## 3. Domain → pyportfolios.com  (needs the domain owner)

1. Vercel project → **Settings → Domains → Add** `pyportfolios.com` (+ `www`).
2. Vercel shows the exact A/CNAME records. The **client (domain owner)** adds
   them at the registrar. HTTPS is issued automatically once DNS resolves.
   - Until DNS is live you can review on the free `…vercel.app` URL — but the
     cookie proxy and Stripe redirects are tied to the domain, so finish this
     before the client review.

## 4. Stripe webhook (replaces `stripe listen`)

1. Stripe dashboard (**test mode**) → **Developers → Webhooks → Add endpoint**.
2. URL: `https://pyportfolios-api.onrender.com/api/webhooks/stripe`
   (point it straight at Render — webhooks are server-to-server, no proxy needed).
3. Events: **`checkout.session.completed`**, **`invoice.paid`**
   (+ `customer.subscription.deleted` for cancel confirmation).
4. Copy the endpoint's **`whsec_…`** → set `STRIPE_WEBHOOK_SECRET` in Render →
   the service redeploys. The local `stripe listen` is no longer used.

## 5. Smoke test (test cards, no real money)

On `https://pyportfolios.com`: sign up → Upgrade to Pro → pay `4242 4242 4242 4242`
→ back on `/account`, subscription **active**. Confirm the webhook shows `200` in
the Stripe dashboard, and the row appears in the DB (Render → the database →
Connect, or a quick `psql`).

---

## Things to know for the week

- **Cold starts (free plan):** the Render free web service sleeps after ~15 min
  idle, so the first click after a lull waits ~30–60s. For a client-facing week,
  bump the service to **Starter (~$7/mo)** so it stays warm — Render dashboard →
  the service → **Settings → Instance Type**. Cancel after approval.
- **Free Postgres** expires after 90 days — irrelevant for a week.
- **Still test mode:** `sk_test_` keys, test cards only, no real charges. Going
  live is a separate flip (live keys + live Prices + live webhook + one real
  purchase/refund).
- **Email is console-only** (`EMAIL_BACKEND=console`), so password-reset mail
  won't actually send in staging. Fine for review; wire SMTP for production.
- **Teardown after approval:** delete the Render service + DB and the Vercel
  project (or keep and promote to production with live keys).
