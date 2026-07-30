"""Early-access signup — POST /api/early-access.

No auth required. Idempotent by design: a duplicate email answers
200 {ok:true, duplicate:true} rather than an error, so the endpoint cannot
be used to enumerate who already signed up.

Rate limit: same naive in-memory pattern as the login limiter (per client
IP, per-process, resets on restart) — replace with Redis or nginx limit_req
before scaling beyond one process.
"""

import time

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import EMAIL_RE
from ..db import get_db
from ..models import EarlyAccessSignup

router = APIRouter(prefix="/api", tags=["early-access"])

MAX_SIGNUP_ATTEMPTS = 10
SIGNUP_WINDOW_SECONDS = 300.0

_signup_hits: dict[str, list[float]] = {}


def check_signup_allowed(client_key: str) -> None:
    now = time.monotonic()
    hits = [t for t in _signup_hits.get(client_key, []) if now - t < SIGNUP_WINDOW_SECONDS]
    _signup_hits[client_key] = hits
    if len(hits) >= MAX_SIGNUP_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many signup attempts; try again later")
    hits.append(now)


def reset_signup_limits() -> None:
    _signup_hits.clear()


class EarlyAccessIn(BaseModel):
    email: str
    source: str | None = None

    @field_validator("email")
    @classmethod
    def _email_shape(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("invalid email address")
        return v


@router.post("/early-access")
def early_access_signup(
    body: EarlyAccessIn, request: Request, db: Session = Depends(get_db)
) -> dict:
    client_key = request.client.host if request.client else "unknown"
    check_signup_allowed(client_key)

    existing = db.execute(
        select(EarlyAccessSignup).where(EarlyAccessSignup.email == body.email)
    ).scalar_one_or_none()
    if existing is not None:
        return {"ok": True, "duplicate": True}

    db.add(EarlyAccessSignup(email=body.email, source=body.source))
    try:
        db.commit()
    except IntegrityError:  # pragma: no cover - concurrent duplicate insert
        db.rollback()
        return {"ok": True, "duplicate": True}
    return {"ok": True, "duplicate": False}
