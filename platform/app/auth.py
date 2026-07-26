"""Authentication core: bcrypt password hashing, DB-backed sessions carried
in an httpOnly SameSite=Lax cookie, and a naive in-memory login rate limit.

Rate-limit limitation (documented): the failed-attempt counter lives in this
process's memory. It resets on restart and is not shared across workers —
fine for a single-process sidecar, replace with Redis (or nginx limit_req)
before scaling out.
"""

import hashlib
import hmac
import re
import secrets
import time
from datetime import timedelta

from fastapi import Depends, HTTPException, Request, Response
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db, utcnow
from .models import User, UserSession

SESSION_COOKIE = "pp_session"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- passwords ---------------------------------------------------------------

def hash_password(password: str) -> str:
    return _pwd.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _pwd.verify(password, password_hash)


# --- sessions ----------------------------------------------------------------

def _token_hash(token: str) -> str:
    """Keyed hash of the session token; only the hash is persisted."""
    secret = get_settings().session_secret.encode()
    return hmac.new(secret, token.encode(), hashlib.sha256).hexdigest()


def create_session(db: Session, user: User, response: Response) -> None:
    token = secrets.token_urlsafe(32)
    settings = get_settings()
    db.add(
        UserSession(
            token_hash=_token_hash(token),
            user_id=user.id,
            expires_at=utcnow() + timedelta(days=settings.session_ttl_days),
        )
    )
    db.commit()
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=settings.session_ttl_days * 86400,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,  # true behind HTTPS/nginx in production
        path="/",
    )


def destroy_session(db: Session, request: Request, response: Response) -> None:
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        row = db.execute(
            select(UserSession).where(UserSession.token_hash == _token_hash(token))
        ).scalar_one_or_none()
        if row is not None:
            db.delete(row)
            db.commit()
    response.delete_cookie(SESSION_COOKIE, path="/")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    row = db.execute(
        select(UserSession).where(UserSession.token_hash == _token_hash(token))
    ).scalar_one_or_none()
    if row is None or row.expires_at <= utcnow():
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    user = db.get(User, row.user_id)
    if user is None:  # pragma: no cover - orphaned session
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    return user


# --- naive login rate limit ---------------------------------------------------

MAX_FAILED_ATTEMPTS = 5
FAIL_WINDOW_SECONDS = 300.0

_failed_logins: dict[str, list[float]] = {}


def check_login_allowed(email: str) -> None:
    now = time.monotonic()
    attempts = [t for t in _failed_logins.get(email, []) if now - t < FAIL_WINDOW_SECONDS]
    _failed_logins[email] = attempts
    if len(attempts) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=429, detail="Too many login attempts; try again later"
        )


def record_failed_login(email: str) -> None:
    _failed_logins.setdefault(email, []).append(time.monotonic())


def reset_failed_logins(email: str | None = None) -> None:
    if email is None:
        _failed_logins.clear()
    else:
        _failed_logins.pop(email, None)
