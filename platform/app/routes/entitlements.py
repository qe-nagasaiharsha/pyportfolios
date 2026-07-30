"""Entitlements for client-side gating.

The front-end uses this to decide what UI to show; server routes (e.g.
content.py) enforce access independently — never trust the client copy.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import services
from ..auth import get_current_user
from ..db import get_db
from ..models import User

router = APIRouter(prefix="/api", tags=["entitlements"])


@router.get("/entitlements")
def get_entitlements(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    return services.entitlements_for(db, user.id)
