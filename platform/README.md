# pyportfolios platform sidecar

Standalone FastAPI service providing accounts, subscriptions, payments, and
gated content for pyportfolios.com. The static Next.js export (in `../site`)
stays untouched — nginx reverse-proxies `location /api/` to this process.

## Architecture

```
browser ──► nginx :443
              ├── /            → static Next.js export (site/out)
              └── /api/*       → 127.0.0.1:8787 (this service)

platform/
  app/
    main.py            FastAPI app + CORS + lifespan (create tables, seed plans)
    config.py          pydantic-settings (.env)
    db.py              SQLAlchemy engine/session, naive-UTC datetimes
    models.py          User, UserSession, Plan, Subscription, Payment, WebhookEvent
    services.py        activate_subscription / entitlements — shared by mock + webhooks
    auth.py            bcrypt, DB sessions, httpOnly cookie, naive rate limit
    payments/
      base.py          PaymentProvider protocol + NormalizedEvent
      mock.py          deterministic in-process provider (default)
      stripe_adapter.py  Stripe Checkout via httpx, inert without keys
    routes/            auth, plans, checkout, subscription, webhooks, content, entitlements
  tests/test_e2e.py    full-flow tests (TestClient + tmp SQLite, no network)
```

## Run

```bash
cd platform
python -m pip install -r requirements.txt
copy .env.example .env        # optional — sane dev defaults are built in
uvicorn app.main:app --port 8787
```

Interactive docs: http://127.0.0.1:8787/api/docs

Tests (from the repo root or from `platform/`):

```bash
python -m pytest platform/tests -q
```

## API surface

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | — | email + password (min 8), sets session cookie |
| POST | `/api/auth/login` | — | 429 after 5 failed attempts / 5 min |
| POST | `/api/auth/logout` | — | deletes server session, clears cookie |
| GET  | `/api/auth/me` | cookie | current user (never returns hashes) |
| GET  | `/api/plans` | — | 4 seeded plans |
| POST | `/api/checkout` | cookie | `{plan_code}` → provider checkout |
| POST | `/api/checkout/{id}/confirm` | cookie | mock only: `{card_number}` (4242… ok, 4000…0002 declines) |
| GET  | `/api/subscription` | cookie | effective status, period end, cancel flag |
| POST | `/api/subscription/cancel` | cookie | sets `cancel_at_period_end` |
| POST | `/api/webhooks/{provider}` | signature | idempotent via `webhook_events` |
| GET  | `/api/content/notebooks/{slug}` | cookie | 402 without active Pro/Lifetime |
| GET  | `/api/entitlements` | cookie | `{tier, features}` for client-side gating |
| GET  | `/api/health` | — | liveness |

## Plans (seeded on startup, mirror the landing page)

| code | price | interval |
|---|---|---|
| `starter` | $0 | — |
| `pro-monthly` | $20 | month (period = now + 30d) |
| `pro-annual` | $199 | year (period = now + 365d) |
| `lifetime` | $950 one-time | — (no period end) |

## Design decisions

- **Sessions**: server-side rows in `user_sessions`. The cookie holds a random
  256-bit token; only an HMAC-SHA256 (keyed with `SESSION_SECRET`) of it is
  stored, so a DB leak can't be replayed as cookies, and logout is a real
  server-side revocation. (`itsdangerous` signed cookies were the alternative;
  rejected because they can't be revoked without a denylist.)
- **Period handling**: no background jobs. `current_period_end` is written at
  activation (30d/365d/None) and the *effective* status is computed at read
  time — a subscription past its period end reads as `expired`. Cancellation
  only sets `cancel_at_period_end`; access continues until the period ends.
- **One activation path**: the mock confirm endpoint and the webhook route both
  call `services.activate_subscription`, so a Stripe `checkout.session.completed`
  produces byte-for-byte the same DB state as a mock confirmation.
- **Webhook idempotency**: `(provider, event_id)` is unique in `webhook_events`;
  replays return `{"duplicate": true}` with zero side effects.
- **Postgres-ready schema**: only Integer/String/Text/Boolean/DateTime columns,
  naive-UTC timestamps (`timestamp without time zone`); switch `DATABASE_URL`
  to `postgresql+psycopg://…` and add the driver.

## Switching to Stripe (test keys)

1. Create three Prices in the Stripe dashboard ($20/mo, $199/yr recurring;
   $950 one-time) and a webhook endpoint for
   `https://pyportfolios.com/api/webhooks/stripe` subscribed to
   `checkout.session.completed`.
2. In `platform/.env`:
   ```
   PAYMENT_PROVIDER=stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_PRO_MONTHLY=price_...
   STRIPE_PRICE_PRO_ANNUAL=price_...
   STRIPE_PRICE_LIFETIME=price_...
   ```
3. Restart. `POST /api/checkout` now returns a `redirect` client action to
   Stripe-hosted checkout; activation happens via the signed webhook.
   With `STRIPE_SECRET_KEY` empty the adapter raises `ConfigurationError`
   (surfaced as HTTP 503) — it can never make an unconfigured network call.

## Security notes

- Passwords: bcrypt via passlib (`bcrypt<4.1` pinned for passlib 1.7.4 compat).
- Cookies: `HttpOnly; SameSite=Lax`; set `COOKIE_SECURE=true` in production —
  HTTPS is assumed to terminate at nginx.
- Login rate limit: in-memory, per-process (5 failed / 5 min / email). It
  resets on restart and is not shared across workers — replace with Redis or
  nginx `limit_req` before scaling beyond one process.
- Login errors don't distinguish unknown email from wrong password.
- Notebook route enforces slug regex `^[a-z0-9-]+$` plus a resolved-path
  containment check; it is the gating enforcement point once the static site
  stops shipping notebooks publicly.
- `SESSION_SECRET` has a dev default — override it in production.
