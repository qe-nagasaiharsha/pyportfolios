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
    models.py          User, UserSession, PasswordResetToken, EarlyAccessSignup,
                       Plan, Subscription, Payment, WebhookEvent
    services.py        activate_subscription / entitlements — shared by mock + webhooks
    auth.py            bcrypt, DB sessions, httpOnly cookie, naive rate limit
    email.py           EmailBackend protocol; console (dev) + smtp backends
    payments/
      base.py          PaymentProvider protocol + NormalizedEvent
      mock.py          deterministic in-process provider (default)
      stripe_adapter.py  Stripe Checkout via httpx, inert without keys
    routes/            auth, plans, checkout, subscription, webhooks, content,
                       entitlements, early_access
  tests/               full-flow tests (TestClient + tmp SQLite, no network)
```

## Gated content (the vault)

The paid content lives OUTSIDE the static site, in the repo-level vault:

```
<repo>/vault/notebooks/*.ipynb   → GET /api/content/notebooks/{slug}
<repo>/vault/bundles/*.zip       → GET /api/content/bundles/{slug}
```

The API is the only way users obtain these files — nothing under `vault/` is
ever served by nginx directly. Both routes require an authenticated session
(401 otherwise) AND an active Pro/Lifetime subscription (402 otherwise), and
share the same slug regex + resolved-path containment guard. Directories are
configurable via `CONTENT_NOTEBOOKS_DIR` / `CONTENT_BUNDLES_DIR` (defaults
`../vault/notebooks` / `../vault/bundles`, relative to `platform/`).

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
| POST | `/api/auth/request-password-reset` | — | `{email}` → always `{ok:true}` (no enumeration); token sent via email backend |
| POST | `/api/auth/reset-password` | — | `{token, new_password≥8}`; single-use, 1h expiry; revokes ALL sessions |
| POST | `/api/auth/change-password` | cookie | `{current_password, new_password≥8}`; revokes all OTHER sessions |
| GET  | `/api/plans` | — | 4 seeded plans |
| POST | `/api/checkout` | cookie | `{plan_code}` → provider checkout |
| POST | `/api/checkout/{id}/confirm` | cookie | mock only: `{card_number}` (4242… ok, 4000…0002 declines) |
| GET  | `/api/subscription` | cookie | effective status, period end, cancel flag |
| POST | `/api/subscription/cancel` | cookie | sets `cancel_at_period_end` |
| POST | `/api/webhooks/{provider}` | signature | idempotent via `webhook_events` |
| GET  | `/api/content/notebooks/{slug}` | cookie | vault `.ipynb`; 402 without active Pro/Lifetime |
| GET  | `/api/content/bundles/{slug}` | cookie | vault `.zip` attachment; gated identically (401/402) |
| POST | `/api/early-access` | — | `{email, source?}`; duplicate → `{ok:true, duplicate:true}`; rate-limited |
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

## Email backend

Selected via `EMAIL_BACKEND` (default `console`), mirroring the payments
provider pattern (`app/email.py`):

- `console` — **DEV ONLY.** Writes the full email (including the password
  reset token) to the application log instead of sending it. Never enable in
  production.
- `smtp` — sends via STARTTLS using `SMTP_HOST` / `SMTP_PORT` /
  `SMTP_USERNAME` / `SMTP_PASSWORD` / `SMTP_FROM`. Inert without config: it
  raises `ConfigurationError` before any network I/O if `SMTP_HOST` is unset.

Password-reset tokens are random 256-bit values; only their HMAC-SHA256
(keyed with `SESSION_SECRET` — the same scheme as session tokens) is stored
in `password_reset_tokens`. Tokens expire after 1 hour and are single-use;
a successful reset revokes every session of the user. The request endpoint
always answers `{ok:true}` so it cannot be used to enumerate accounts (an
email-backend misconfiguration is logged, not surfaced, for the same reason).

## Security notes

- Passwords: bcrypt via passlib (`bcrypt<4.1` pinned for passlib 1.7.4 compat).
- Cookies: `HttpOnly; SameSite=Lax`; set `COOKIE_SECURE=true` in production —
  HTTPS is assumed to terminate at nginx.
- Login rate limit: in-memory, per-process (5 failed / 5 min / email). It
  resets on restart and is not shared across workers — replace with Redis or
  nginx `limit_req` before scaling beyond one process. `/api/early-access`
  uses the same naive pattern (10 / 5 min / client IP).
- Login errors don't distinguish unknown email from wrong password, and
  `request-password-reset` always returns `{ok:true}` (no user enumeration).
- Content routes (notebooks + bundles) enforce slug regex `^[a-z0-9-]+$`
  plus a resolved-path containment check; they are the single gating
  enforcement point for the vault content.
- `SESSION_SECRET` has a dev default — override it in production.
