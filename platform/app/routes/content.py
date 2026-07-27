"""Gated content delivery.

THIS IS THE GATING ENFORCEMENT POINT. The paid content now lives in the
repo-level vault (vault/notebooks/*.ipynb, vault/bundles/*.zip) and is no
longer shipped inside the static site — these routes are the ONLY way users
obtain it. Do not add other download paths.

Path-traversal guard (both routes): the slug must match ^[a-z0-9-]+$ (no
dots, slashes, backslashes, or drive letters possible), and the resolved
file path is additionally checked to remain inside the content directory.
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


def _gated_file(
    db: Session,
    user: User,
    slug: str,
    *,
    content_dir: str,
    extension: str,
    kind: str,
) -> Path:
    """Shared gate: slug shape, Pro/Lifetime entitlement, path containment."""
    if not SLUG_RE.fullmatch(slug) or len(slug) > 128:
        raise HTTPException(status_code=404, detail=f"{kind} not found")

    if not services.has_active_pro(db, user.id):
        raise HTTPException(
            status_code=402,
            detail="A Pro or Lifetime subscription is required to download this content",
        )

    base_dir = Path(content_dir).resolve()
    file_path = (base_dir / f"{slug}{extension}").resolve()

    # Defense in depth: the regex already prevents traversal, but verify the
    # resolved path never escapes the content directory.
    if base_dir not in file_path.parents:
        raise HTTPException(status_code=404, detail=f"{kind} not found")
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"{kind} not found")
    return file_path


@router.get("/notebooks/{slug}")
def download_notebook(
    slug: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    file_path = _gated_file(
        db,
        user,
        slug,
        content_dir=get_settings().content_notebooks_dir,
        extension=".ipynb",
        kind="Notebook",
    )
    return FileResponse(
        file_path,
        media_type="application/x-ipynb+json",
        filename=f"{slug}.ipynb",
    )


@router.get("/bundles/{slug}")
def download_bundle(
    slug: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    file_path = _gated_file(
        db,
        user,
        slug,
        content_dir=get_settings().content_bundles_dir,
        extension=".zip",
        kind="Bundle",
    )
    return FileResponse(
        file_path,
        media_type="application/zip",
        filename=f"{slug}.zip",
        content_disposition_type="attachment",
    )
