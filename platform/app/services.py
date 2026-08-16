"""Subscription/payment domain logic shared by the mock confirm endpoint and
the webhook path — both funnel through activate_subscription so behaviour is
identical no matter how a successful payment is reported.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import utcnow
from .models import Payment, Plan, Subscription, User

PAID_PLAN_CODES = {"pro-monthly", "pro-annual", "premium-monthly", "premium-annual"}
PREMIUM_PLAN_CODES = {"premium-monthly", "premium-annual"}

PERIOD_BY_INTERVAL = {"month": timedelta(days=30), "year": timedelta(days=365)}

# Ordered access tiers, used to reject downgrades / duplicate purchases at
# checkout: buying a plan whose rank is <= the active plan's rank would only
# overwrite the existing (equal-or-better) subscription in place — see
# activate_subscription — so it is blocked. Monthly/annual of a tier share a
# rank: they are the same tier billed differently.
PLAN_RANK = {
    "starter": 0,
    "pro-monthly": 1,
    "pro-annual": 1,
    "premium-monthly": 2,
    "premium-annual": 2,
}


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
        and sub.plan_code in PAID_PLAN_CODES
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
    provider_sub_id: str | None = None,
) -> Subscription:
    """Record a successful payment and activate/renew the user's subscription.

    period_end: now+30d (monthly), now+365d (annual), None if the plan has no
    interval (only the free Basic tier, since Lifetime was retired).
    Re-activation of an existing subscription updates it in place (renewal or
    plan change) and clears any pending cancellation.

    provider_sub_id: the provider's subscription handle (Stripe `sub_...`),
    stored so renewals/cancellation can find this row later.
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
    if provider_sub_id is not None:
        sub.provider_sub_id = provider_sub_id
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


def subscription_by_provider_sub_id(
    db: Session, provider_sub_id: str
) -> Subscription | None:
    return db.execute(
        select(Subscription).where(Subscription.provider_sub_id == provider_sub_id)
    ).scalars().first()


def renew_subscription(
    db: Session,
    provider_sub_id: str,
    *,
    period_end_ts: int | None,
    amount_cents: int | None,
    currency: str = "usd",
    provider: str,
    provider_ref: str,
) -> Subscription | None:
    """Extend a subscription on a recurring payment (Stripe invoice.paid).

    Located by provider_sub_id; returns None if no matching row exists yet
    (e.g. a renewal event that raced ahead of activation). Records the renewal
    payment for audit and pushes current_period_end to the provider's value.
    """
    sub = subscription_by_provider_sub_id(db, provider_sub_id)
    if sub is None:
        return None

    if period_end_ts is not None:
        sub.current_period_end = datetime.fromtimestamp(
            period_end_ts, tz=timezone.utc
        ).replace(tzinfo=None)
    sub.status = "active"
    db.add(
        Payment(
            user_id=sub.user_id,
            subscription_id=sub.id,
            provider=provider,
            provider_ref=provider_ref,
            amount_cents=amount_cents if amount_cents is not None else 0,
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
    if sub is not None and effective_status(sub) == "active" and sub.plan_code in PAID_PLAN_CODES:
        tier = "premium" if sub.plan_code in PREMIUM_PLAN_CODES else "pro"

    features = ["foundations-module", "backtests-5-per-month", "community-forum"]
    if tier in ("pro", "premium"):
        features = [
            "all-modules",
            "unlimited-backtests",
            "library-tooling",
            "priority-support",
            "notebooks",
        ]
    if tier == "premium":
        # Carried over from the retired Lifetime plan, minus "lifetime-updates",
        # which no longer means anything on a renewing subscription.
        features += ["mentorship", "private-community", "certificate"]
    return {"tier": tier, "features": features}
