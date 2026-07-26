"""Auth routes: register, login, logout, me.

Password hashes never leave the database layer — responses are built from an
explicit whitelist of fields (UserOut).
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import auth
from ..db import get_db
from ..models import User

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
