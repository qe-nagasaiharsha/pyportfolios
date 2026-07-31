"""Public plan catalogue."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Plan

router = APIRouter(prefix="/api", tags=["plans"])

# Stable display order (matches the pricing section on the landing page).
_ORDER = {"starter": 0, "pro-monthly": 1, "pro-annual": 2, "lifetime": 3}


@router.get("/plans")
def list_plans(db: Session = Depends(get_db)) -> list[dict]:
    plans = db.execute(select(Plan)).scalars().all()
    plans.sort(key=lambda p: _ORDER.get(p.code, 99))
    return [
        {
            "code": p.code,
            "name": p.name,
            "amount_cents": p.amount_cents,
            "interval": p.interval,  # "month" | "year" | null (one-time / free)
        }
        for p in plans
    ]
