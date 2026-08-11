"""Subscription status + cancellation."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import services
from ..auth import get_current_user
from ..db import get_db
from ..models import User
from ..payments import get_provider
from ..payments.base import ConfigurationError

router = APIRouter(prefix="/api/subscription", tags=["subscription"])


def _serialize(sub) -> dict:
    return {
        "plan_code": sub.plan_code,
        "status": services.effective_status(sub),
        "current_period_end": sub.current_period_end,
        "cancel_at_period_end": sub.cancel_at_period_end,
        "created_at": sub.created_at,
    }


@router.get("")
def get_subscription(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    sub = services.get_subscription(db, user.id)
    if sub is None:
        return {"status": "none", "plan_code": "starter"}
    return _serialize(sub)


@router.post("/cancel")
def cancel_subscription(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    sub = services.get_subscription(db, user.id)
    if sub is None or services.effective_status(sub) != "active":
        raise HTTPException(status_code=404, detail="No active subscription to cancel")

    # Access continues until current_period_end; renewal simply won't happen.
    sub.cancel_at_period_end = True
    # Tell the provider to stop renewing too, or the card keeps getting charged.
    # Mock is a no-op; Stripe flips cancel_at_period_end on its side. A provider
    # that can't cancel (no sub id / not configured) raises ConfigurationError —
    # the local flag still stands so the UI is consistent.
    try:
        get_provider().cancel(sub)
    except ConfigurationError:
        pass
    db.commit()
    return _serialize(sub)
