"""SQLAlchemy 2.0 models.

Postgres-ready: only Integer / String / Text / Boolean / DateTime columns,
no SQLite-specific types. All datetimes are naive UTC (see app.db).

Session mechanism (decision): server-side sessions in the `user_sessions`
table. The browser cookie carries a random 256-bit token; only its SHA-256
hash (keyed with SESSION_SECRET) is stored, so a leaked DB dump cannot be
replayed as cookies. Revocation (logout) is a simple row delete — something
signed-cookie (itsdangerous) sessions cannot do without a denylist.
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    select,
)
from sqlalchemy.orm import Mapped, Session as OrmSession, mapped_column

from .db import Base, utcnow


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


class PasswordResetToken(Base):
    """One-shot password-reset tokens.

    Same at-rest scheme as sessions: the emailed token is random 256-bit and
    only its HMAC-SHA256 (keyed with SESSION_SECRET) is stored, so a DB leak
    cannot be replayed as a reset link. Tokens expire after 1 hour and are
    single-use (`used_at`).
    """

    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


class EarlyAccessSignup(Base):
    """Early-access interest list. No auth attached — email is the identity.

    Duplicate submissions are idempotent at the API layer (200 with
    duplicate=true), backed by the unique constraint here.
    """

    __tablename__ = "early_access_signups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


class Plan(Base):
    __tablename__ = "plans"

    code: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    # "month" | "year" | None (one-time / free)
    interval: Mapped[str | None] = mapped_column(String(16), nullable=True)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    plan_code: Mapped[str] = mapped_column(ForeignKey("plans.code"), nullable=False)
    # Stored status: active | canceled | past_due | expired.
    # Effective status is computed at read time against current_period_end
    # (there is no background expiry job) — see app.services.effective_status.
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="active")
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    subscription_id: Mapped[int | None] = mapped_column(
        ForeignKey("subscriptions.id"), nullable=True
    )
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_ref: Mapped[str] = mapped_column(String(255), nullable=False)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="usd")
    status: Mapped[str] = mapped_column(String(16), nullable=False)  # succeeded | failed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


class WebhookEvent(Base):
    """Processed webhook events — the idempotency ledger.

    (provider, event_id) is unique: replays of the same provider event are
    detected before any side effects run.
    """

    __tablename__ = "webhook_events"
    __table_args__ = (UniqueConstraint("provider", "event_id", name="uq_webhook_provider_event"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    event_id: Mapped[str] = mapped_column(String(255), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    processed_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


# Seed data — prices mirror site/src/components/landing/Pricing.tsx.
# The one-time "lifetime" plan was retired in favour of Premium, a recurring
# subscription; nothing had been sold on it. Premium carries what Lifetime used
# to (mentorship, private community, certificate) but renews like Pro.
PLAN_SEED = [
    {"code": "starter", "name": "Basic", "amount_cents": 0, "interval": None},
    {"code": "pro-monthly", "name": "Pro (Monthly)", "amount_cents": 2900, "interval": "month"},
    {"code": "pro-annual", "name": "Pro (Annual)", "amount_cents": 29000, "interval": "year"},
    {"code": "premium-monthly", "name": "Premium (Monthly)", "amount_cents": 7900, "interval": "month"},
    {"code": "premium-annual", "name": "Premium (Annual)", "amount_cents": 79000, "interval": "year"},
]


def seed_plans(session: OrmSession) -> None:
    """Reconcile the plans table with PLAN_SEED.

    This used to insert missing codes only, which meant a repricing never
    reached an already-seeded database: the catalogue kept serving the old
    amounts while the landing page showed the new ones. It now also updates
    name/amount/interval in place, and drops retired codes that nothing has
    been sold on. plans.code is a foreign key from subscriptions, so a code
    with any subscription against it is kept rather than deleted (payments
    reach a plan through their subscription, so that one check covers both).
    """
    by_code = {p.code: p for p in session.execute(select(Plan)).scalars()}

    for row in PLAN_SEED:
        plan = by_code.get(row["code"])
        if plan is None:
            session.add(Plan(**row))
            continue
        plan.name = row["name"]
        plan.amount_cents = row["amount_cents"]
        plan.interval = row["interval"]

    seeded = {row["code"] for row in PLAN_SEED}
    for code, plan in by_code.items():
        if code in seeded:
            continue
        in_use = session.execute(
            select(Subscription.id).where(Subscription.plan_code == code).limit(1)
        ).first()
        if not in_use:
            session.delete(plan)
