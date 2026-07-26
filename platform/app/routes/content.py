"""Gated content delivery.

THIS IS THE GATING ENFORCEMENT POINT. Today the static site still ships
notebooks publicly under site/public/notebooks/, so this route is belt-and-
braces; once the front-end stops exporting notebooks into the static bundle
and links to /api/content/notebooks/{slug} instead, this becomes the single
place where paid access is enforced. Do not add other download paths.

Path-traversal guard: the slug must match ^[a-z0-9-]+$ (no dots, slashes,
backslashes, or drive letters possible), and the resolved file path is
additionally checked to remain inside the notebooks directory.
"""

import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .. import services
from ..auth import get_current_user
from ..config import get_settings
from ..db import get_db
from ..models import User

router = APIRouter(prefix="/api/content", tags=["content"])

SLUG_RE = re.compile(r"^[a-z0-9-]+$")


@router.get("/notebooks/{slug}")
def download_notebook(
    slug: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    if not SLUG_RE.fullmatch(slug) or len(slug) > 128:
        raise HTTPException(status_code=404, detail="Notebook not found")

    if not services.has_active_pro(db, user.id):
        raise HTTPException(
            status_code=402,
            detail="A Pro or Lifetime subscription is required to download notebooks",
        )

    notebooks_dir = Path(get_settings().notebooks_dir).resolve()
    file_path = (notebooks_dir / f"{slug}.ipynb").resolve()

    # Defense in depth: the regex already prevents traversal, but verify the
    # resolved path never escapes the notebooks directory.
    if notebooks_dir not in file_path.parents:
        raise HTTPException(status_code=404, detail="Notebook not found")
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Notebook not found")

    return FileResponse(
        file_path,
        media_type="application/x-ipynb+json",
        filename=f"{slug}.ipynb",
    )
