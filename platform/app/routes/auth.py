"""Auth routes: register, login, logout, me, and password management
(request-password-reset, reset-password, change-password).

Password hashes never leave the database layer — responses are built from an
explicit whitelist of fields (UserOut).

Password-reset design: request-password-reset ALWAYS answers 200 {ok:true}
(no user enumeration). When the account exists, a random 256-bit token is
generated, stored HMAC-hashed (same keyed scheme as sessions), and delivered
via the configured email backend (console logger in dev). Tokens are
single-use and expire after 1 hour; a successful reset revokes every session
of the user.
"""

import logging
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, field_validator
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .. import auth
from .. import email as email_mod
from ..db import get_db, utcnow
from ..models import PasswordResetToken, User, UserSession
from ..payments.base import ConfigurationError

logger = logging.getLogger("pyportfolios.auth")

RESET_TOKEN_TTL = timedelta(hours=1)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterIn(BaseModel):
    email: str
    password: str
    name: str | None = None

    @field_validator("email")
    @classmethod
    def _email_shape(cls, v: str) -> str:
        v = v.strip().lower()
        if not auth.EMAIL_RE.match(v):
            raise ValueError("invalid email address")
        return v

    @field_validator("password")
    @classmethod
    def _password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v


class LoginIn(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _normalize(cls, v: str) -> str:
        return v.strip().lower()


class UserOut(BaseModel):
    id: int
    email: str
    name: str | None


def _user_out(user: User) -> UserOut:
    return UserOut(id=user.id, email=user.email, name=user.name)


@router.post("/register", status_code=201)
def register(body: RegisterIn, response: Response, db: Session = Depends(get_db)) -> UserOut:
    existing = db.execute(select(User).where(User.email == body.email)).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(
        email=body.email,
        password_hash=auth.hash_password(body.password),
        name=body.name,
    )
    db.add(user)
    db.commit()
    auth.create_session(db, user, response)
    return _user_out(user)


@router.post("/login")
def login(body: LoginIn, response: Response, db: Session = Depends(get_db)) -> UserOut:
    auth.check_login_allowed(body.email)  # raises 429 when over the limit
    user = db.execute(select(User).where(User.email == body.email)).scalar_one_or_none()
    if user is None or not auth.verify_password(body.password, user.password_hash):
        auth.record_failed_login(body.email)
        # Same message for unknown email vs wrong password (no user enumeration).
        raise HTTPException(status_code=401, detail="Invalid email or password")
    auth.reset_failed_logins(body.email)
    auth.create_session(db, user, response)
    return _user_out(user)


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> dict:
    auth.destroy_session(db, request, response)
    return {"ok": True}


@router.get("/me")
def me(user: User = Depends(auth.get_current_user)) -> UserOut:
    return _user_out(user)


# --- password management ------------------------------------------------------


class RequestPasswordResetIn(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def _normalize(cls, v: str) -> str:
        return v.strip().lower()


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def _password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def _password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v


@router.post("/request-password-reset")
def request_password_reset(body: RequestPasswordResetIn, db: Session = Depends(get_db)) -> dict:
    """Always 200 {ok:true} — the response never reveals whether an account
    exists for the address (no user enumeration)."""
    user = db.execute(select(User).where(User.email == body.email)).scalar_one_or_none()
    if user is not None:
        token = secrets.token_urlsafe(32)
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=auth.hash_token(token),
                expires_at=utcnow() + RESET_TOKEN_TTL,
            )
        )
        db.commit()
        try:
            email_mod.get_email_backend().send(
                user.email,
                "Reset your pyportfolios password",
                "A password reset was requested for your pyportfolios account.\n\n"
                f"Reset token: {token}\n\n"
                "It expires in 1 hour and can be used once. If you did not "
                "request this, you can ignore this email.",
            )
        except ConfigurationError:
            # Misconfigured email backend must not turn into an enumeration
            # oracle (an error only when the account exists) — log and still
            # answer 200. Operators see this in the logs.
            logger.exception("Password-reset email could not be sent (backend misconfigured)")
    return {"ok": True}


@router.post("/reset-password")
def reset_password(body: ResetPasswordIn, db: Session = Depends(get_db)) -> dict:
    row = db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == auth.hash_token(body.token)
        )
    ).scalar_one_or_none()
    if row is None or row.used_at is not None or row.expires_at <= utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.get(User, row.user_id)
    if user is None:  # pragma: no cover - orphaned token
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user.password_hash = auth.hash_password(body.new_password)
    row.used_at = utcnow()
    # Revoke ALL sessions — anyone holding a stolen cookie is logged out.
    db.execute(delete(UserSession).where(UserSession.user_id == user.id))
    db.commit()
    return {"ok": True}


@router.post("/change-password")
def change_password(
    body: ChangePasswordIn,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(auth.get_current_user),
) -> dict:
    if not auth.verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.password_hash = auth.hash_password(body.new_password)
    # Revoke all OTHER sessions; the session performing the change stays alive.
    current_token = request.cookies.get(auth.SESSION_COOKIE, "")
    db.execute(
        delete(UserSession).where(
            UserSession.user_id == user.id,
            UserSession.token_hash != auth.hash_token(current_token),
        )
    )
    db.commit()
    return {"ok": True}
