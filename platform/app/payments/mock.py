"""Mock payment provider — deterministic, fully in-process, no network.

Flow:
  1. POST /api/checkout {plan_code}       -> create_checkout() returns a
     checkout_id and client_action {type: "collect_card", confirm_url}.
  2. POST /api/checkout/{id}/confirm {card_number} simulates card entry:
       4242424242424242 -> success  (Payment recorded, Subscription activated)
       4000000000000002 -> decline  (failed Payment recorded, no subscription)
     Success goes through services.activate_subscription — the exact same
     internal activation path the webhook route uses, so mock and Stripe
     behave identically downstream.

Pending checkouts live in process memory (dict) — acceptable for the mock;
Stripe holds this state on its side in production.
"""

import json
import secrets
from dataclasses import dataclass

from fastapi import Request

from ..models import Plan, Subscription, User
from .base import CheckoutResult, NormalizedEvent, WebhookVerificationError

CARD_SUCCESS = "4242424242424242"
CARD_DECLINE = "4000000000000002"


@dataclass
class PendingCheckout:
    checkout_id: str
    user_id: int
    plan_code: str
    amount_cents: int
    status: str = "pending"  # pending | succeeded | failed


class MockProvider:
    name = "mock"

    def __init__(self) -> None:
        self._checkouts: dict[str, PendingCheckout] = {}

    # -- protocol --------------------------------------------------------

    def create_checkout(self, user: User, plan: Plan) -> CheckoutResult:
        checkout_id = "mock_co_" + secrets.token_hex(12)
        self._checkouts[checkout_id] = PendingCheckout(
            checkout_id=checkout_id,
            user_id=user.id,
            plan_code=plan.code,
            amount_cents=plan.amount_cents,
        )
        return CheckoutResult(
            checkout_id=checkout_id,
            client_action={
                "type": "collect_card",
                "confirm_url": f"/api/checkout/{checkout_id}/confirm",
                "test_cards": {"success": CARD_SUCCESS, "decline": CARD_DECLINE},
            },
        )

    async def handle_webhook(self, request: Request) -> NormalizedEvent:
        """Accept a synthetic webhook: {"id", "type", "data": {...}}.

        Useful for exercising the idempotency path without Stripe.
        """
        try:
            payload = json.loads(await request.body())
            data = payload.get("data", {})
            return NormalizedEvent(
                event_id=str(payload["id"]),
                event_type=str(payload["type"]),
                user_id=int(data["user_id"]) if "user_id" in data else None,
                plan_code=data.get("plan_code"),
                amount_cents=data.get("amount_cents"),
                provider_ref=data.get("provider_ref", ""),
                subscription_id=data.get("subscription_id"),
                period_end_ts=data.get("period_end_ts"),
                raw=payload,
            )
        except (ValueError, KeyError, TypeError) as exc:
            raise WebhookVerificationError(f"Malformed mock webhook: {exc}") from exc

    def cancel(self, subscription: Subscription) -> None:
        # Nothing to do provider-side for the mock.
        return None

    # -- mock-specific ----------------------------------------------------

    def get_checkout(self, checkout_id: str) -> PendingCheckout | None:
        return self._checkouts.get(checkout_id)

    def resolve_card(self, checkout: PendingCheckout, card_number: str) -> bool:
        """Deterministic card simulation. Returns True on success."""
        card = card_number.replace(" ", "").replace("-", "")
        ok = card == CARD_SUCCESS
        checkout.status = "succeeded" if ok else "failed"
        return ok


# Module-level singleton so pending checkouts survive across requests.
mock_provider = MockProvider()
