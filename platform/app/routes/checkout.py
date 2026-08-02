"""Checkout routes.

POST /api/checkout            — start a checkout with the active provider.
POST /api/checkout/{id}/confirm — mock-provider only: simulate card entry.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import services
from ..auth import get_current_user
from ..db import get_db
from ..models import Plan, User
from ..payments import get_provider
from ..payments.base import ConfigurationError
from ..payments.mock import MockProvider

router = APIRouter(prefix="/api/checkout", tags=["checkout"])


class CheckoutIn(BaseModel):
    plan_code: str


class ConfirmIn(BaseModel):
    card_number: str


@router.post("")
def create_checkout(
    body: CheckoutIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    plan = db.get(Plan, body.plan_code)
    if plan is None:
        raise HTTPException(status_code=404, detail="Unknown plan")
    if plan.amount_cents == 0:
        raise HTTPException(status_code=400, detail="The Starter plan is free — nothing to buy")

    # Reject downgrades and duplicate purchases. Because activate_subscription
    # overwrites the single subscription row in place, buying a plan of equal or
    # lower rank than the active one would silently replace better access (e.g.
    # Lifetime → a 30-day Pro) and take a second payment. Only strict upgrades
    # are allowed here; managing an existing plan happens on the account page.
    current = services.get_subscription(db, user.id)
    if (
        current is not None
        and services.effective_status(current) == "active"
        and services.plan_rank(plan.code) <= services.plan_rank(current.plan_code)
    ):
        raise HTTPException(
            status_code=409,
            detail=f"You already have an active {current.plan_code} plan — nothing to buy here.",
        )

    provider = get_provider()
    try:
        result = provider.create_checkout(user, plan)
    except ConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "checkout_id": result.checkout_id,
        "client_action": result.client_action,
        "plan_code": plan.code,
        "amount_cents": plan.amount_cents,
    }


@router.post("/{checkout_id}/confirm")
def confirm_checkout(
    checkout_id: str,
    body: ConfirmIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    provider = get_provider()
    if not isinstance(provider, MockProvider):
        raise HTTPException(
            status_code=404,
            detail="Manual confirm is only available with the mock provider; "
            "Stripe checkouts complete via redirect + webhook.",
        )

    checkout = provider.get_checkout(checkout_id)
    if checkout is None or checkout.user_id != user.id:
        raise HTTPException(status_code=404, detail="Unknown checkout")
    if checkout.status != "pending":
        raise HTTPException(status_code=409, detail=f"Checkout already {checkout.status}")

    plan = db.get(Plan, checkout.plan_code)
    if plan is None:  # pragma: no cover - plan removed mid-checkout
        raise HTTPException(status_code=409, detail="Plan no longer available")

    if provider.resolve_card(checkout, body.card_number):
        # Same internal activation path a webhook success would take.
        sub = services.activate_subscription(
            db, user, plan, provider="mock", provider_ref=checkout_id
        )
        return {
            "status": "succeeded",
            "subscription": {
                "plan_code": sub.plan_code,
                "status": services.effective_status(sub),
                "current_period_end": sub.current_period_end,
            },
        }

    services.record_failed_payment(db, user, plan, provider="mock", provider_ref=checkout_id)
    raise HTTPException(status_code=402, detail="Card declined")
