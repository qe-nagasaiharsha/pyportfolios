"""Subscription/payment domain logic shared by the mock confirm endpoint and
the webhook path — both funnel through activate_subscription so behaviour is
identical no matter how a successful payment is reported.
"""

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import utcnow
from .models import Payment, Plan, Subscription, User

PRO_PLAN_CODES = {"pro-monthly", "pro-annual", "lifetime"}

PERIOD_BY_INTERVAL = {"month": timedelta(days=30), "year": timedelta(days=365)}

# Ordered access tiers, used to reject downgrades / duplicate purchases at
# checkout: buying a plan whose rank is <= the active plan's rank would only
# overwrite the existing (equal-or-better) subscription in place — see
# activate_subscription — so it is blocked. pro-monthly and pro-annual share a
# rank: they are the same tier billed differently.
PLAN_RANK = {"starter": 0, "pro-monthly": 1, "pro-annual": 1, "lifetime": 2}


def plan_rank(plan_code: str) -> int:
    return PLAN_RANK.get(plan_code, 0)


def effective_status(sub: Subscription) -> str:
    """Compute the status as of now (no background expiry job runs)."""
    if sub.status != "active":
        return sub.status
    if sub.current_period_end is not None and sub.current_period_end <= utcnow():
        return "expired"
    return "active"


def get_subscription(db: Session, user_id: int) -> Subscription | None:
    return db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.created_at.desc(), Subscription.id.desc())
    ).scalars().first()


def has_active_pro(db: Session, user_id: int) -> bool:
    sub = get_subscription(db, user_id)
    return (
        sub is not None
        and sub.plan_code in PRO_PLAN_CODES
        and effective_status(sub) == "active"
    )


def activate_subscription(
    db: Session,
    user: User,
    plan: Plan,
    *,
    provider: str,
    provider_ref: str,
    amount_cents: int | None = None,
    currency: str = "usd",
) -> Subscription:
    """Record a successful payment and activate/renew the user's subscription.

    period_end: now+30d (monthly), now+365d (annual), None (lifetime).
    Re-activation of an existing subscription updates it in place (renewal or
    plan change) and clears any pending cancellation.
    """
    period = PERIOD_BY_INTERVAL.get(plan.interval or "")
    period_end = utcnow() + period if period else None

    sub = get_subscription(db, user.id)
    if sub is None:
        sub = Subscription(user_id=user.id)
        db.add(sub)
    sub.plan_code = plan.code
    sub.status = "active"
    sub.current_period_end = period_end
    sub.cancel_at_period_end = False
    db.flush()  # ensure sub.id

    db.add(
        Payment(
            user_id=user.id,
            subscription_id=sub.id,
            provider=provider,
            provider_ref=provider_ref,
            amount_cents=plan.amount_cents if amount_cents is None else amount_cents,
            currency=currency,
            status="succeeded",
        )
    )
    db.commit()
    return sub


def record_failed_payment(
    db: Session,
    user: User,
    plan: Plan,
    *,
    provider: str,
    provider_ref: str,
) -> None:
    db.add(
        Payment(
            user_id=user.id,
            subscription_id=None,
            provider=provider,
            provider_ref=provider_ref,
            amount_cents=plan.amount_cents,
            currency="usd",
            status="failed",
        )
    )
    db.commit()


def entitlements_for(db: Session, user_id: int) -> dict:
    """Tier + feature flags for client-side gating (server routes still
    enforce independently — see routes/content.py)."""
    sub = get_subscription(db, user_id)
    tier = "starter"
    if sub is not None and effective_status(sub) == "active" and sub.plan_code in PRO_PLAN_CODES:
        tier = "lifetime" if sub.plan_code == "lifetime" else "pro"

    features = ["foundations-module", "backtests-5-per-month", "community-forum"]
    if tier in ("pro", "lifetime"):
        features = [
            "all-modules",
            "unlimited-backtests",
            "library-tooling",
            "priority-support",
            "notebooks",
        ]
    if tier == "lifetime":
        features += ["mentorship", "private-community", "certificate", "lifetime-updates"]
    return {"tier": tier, "features": features}
