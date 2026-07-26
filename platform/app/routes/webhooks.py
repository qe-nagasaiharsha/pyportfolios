"""Provider webhook intake.

Idempotency: every event id is recorded in webhook_events with a unique
(provider, event_id) constraint. A replayed event is acknowledged with
{"received": true, "duplicate": true} and produces no side effects.
"""

import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import services
from ..db import get_db
from ..models import Plan, User, WebhookEvent
from ..payments import get_provider
from ..payments.base import (
    ConfigurationError,
    NormalizedEvent,
    WebhookVerificationError,
)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/{provider_name}")
async def receive_webhook(
    provider_name: str, request: Request, db: Session = Depends(get_db)
) -> dict:
    provider = get_provider()
    if provider_name != provider.name:
        raise HTTPException(status_code=404, detail="Unknown or inactive provider")

    try:
        event: NormalizedEvent = await provider.handle_webhook(request)
    except WebhookVerificationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if not event.event_id:
        raise HTTPException(status_code=400, detail="Webhook event missing id")

    # Idempotency check before any side effects.
    seen = db.execute(
        select(WebhookEvent).where(
            WebhookEvent.provider == provider.name,
            WebhookEvent.event_id == event.event_id,
        )
    ).scalar_one_or_none()
    if seen is not None:
        return {"received": True, "duplicate": True}

    handled = False
    if event.event_type == "checkout.completed":
        user = db.get(User, event.user_id) if event.user_id is not None else None
        plan = db.get(Plan, event.plan_code) if event.plan_code else None
        if user is not None and plan is not None:
            services.activate_subscription(
                db,
                user,
                plan,
                provider=provider.name,
                provider_ref=event.provider_ref or event.event_id,
                amount_cents=event.amount_cents,
                currency=event.currency,
            )
            handled = True

    db.add(
        WebhookEvent(
            provider=provider.name,
            event_id=event.event_id,
            event_type=event.event_type,
            payload_json=json.dumps(event.raw),
        )
    )
    db.commit()
    return {"received": True, "duplicate": False, "handled": handled}
