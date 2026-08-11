"""Payment provider abstraction.

Any provider (mock, Stripe, future Razorpay, ...) implements this protocol.
Webhooks from every provider are normalized to `NormalizedEvent` so the
webhook route and the activation service stay provider-agnostic.
"""

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

from fastapi import Request

from ..models import Plan, Subscription, User


class ConfigurationError(RuntimeError):
    """Provider is selected but not configured (e.g. missing API keys)."""


class WebhookVerificationError(ValueError):
    """Webhook payload failed signature verification or was malformed."""


@dataclass
class CheckoutResult:
    checkout_id: str
    # What the client should do next, e.g.
    #   {"type": "collect_card", "confirm_url": "/api/checkout/<id>/confirm"}  (mock)
    #   {"type": "redirect", "url": "https://checkout.stripe.com/..."}          (stripe)
    client_action: dict[str, Any]


@dataclass
class NormalizedEvent:
    event_id: str
    event_type: str  # "checkout.completed" | "invoice.paid" | other passthrough
    user_id: int | None = None
    plan_code: str | None = None
    amount_cents: int | None = None
    currency: str = "usd"
    provider_ref: str = ""
    # Provider-side subscription id (Stripe `sub_...`), captured on checkout so
    # renewals and cancellation can be tied back to the local subscription row.
    subscription_id: str | None = None
    # New period end for a renewal, as a unix timestamp (converted to a
    # naive-UTC datetime in the service). None outside renewal events.
    period_end_ts: int | None = None
    raw: dict[str, Any] = field(default_factory=dict)


@runtime_checkable
class PaymentProvider(Protocol):
    name: str

    def create_checkout(self, user: User, plan: Plan) -> CheckoutResult:
        """Start a checkout for `plan`; returns id + the client's next action."""
        ...

    async def handle_webhook(self, request: Request) -> NormalizedEvent:
        """Verify and parse an incoming webhook into a NormalizedEvent.

        Raises WebhookVerificationError on bad signature / malformed payload.
        """
        ...

    def cancel(self, subscription: Subscription) -> None:
        """Provider-side cancellation hook (stop future renewals)."""
        ...
