"""Subscription status + cancellation."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import services
from ..auth import get_current_user
from ..db import get_db
from ..models import User

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
    # (Lifetime has no period end — the flag is recorded but has no effect.)
    sub.cancel_at_period_end = True
    db.commit()
    return _serialize(sub)
