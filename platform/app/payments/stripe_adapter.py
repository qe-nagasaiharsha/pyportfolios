"""Stripe Checkout adapter — code-complete but inert without keys.

HOW TO GO LIVE
==============
1. In platform/.env set:
       PAYMENT_PROVIDER=stripe
       STRIPE_SECRET_KEY=sk_test_...          (or sk_live_...)
       STRIPE_WEBHOOK_SECRET=whsec_...        (from the webhook endpoint config)
       STRIPE_PRICE_PRO_MONTHLY=price_...     ($20/mo recurring price)
       STRIPE_PRICE_PRO_ANNUAL=price_...      ($199/yr recurring price)
       STRIPE_PRICE_LIFETIME=price_...        ($950 one-time price)
2. In the Stripe dashboard create the three Prices above and a webhook
   endpoint pointing at https://pyportfolios.com/api/webhooks/stripe
   subscribed to `checkout.session.completed` (at minimum).
3. Restart the sidecar. POST /api/checkout now returns
   {client_action: {type: "redirect", url: <Stripe-hosted checkout>}}.

If STRIPE_SECRET_KEY is empty, any attempt to use this provider raises
ConfigurationError with a clear message — no silent no-ops, and no network
calls can happen unconfigured (tests never hit the network).

The Stripe REST API is called directly with httpx (form-encoded, as Stripe
expects); no `stripe` SDK dependency. Webhook signatures are verified per
https://stripe.com/docs/webhooks/signatures : the `Stripe-Signature` header
carries `t=<timestamp>,v1=<hmac>`; the signed payload is
`"{t}.{raw_body}"` HMAC-SHA256'd with the webhook secret, compared with a
constant-time comparison, and the timestamp is checked against a tolerance
window to block replays.
"""

import hashlib
import hmac
import json
import time

import httpx
from fastapi import Request

from ..config import get_settings
from ..models import Plan, Subscription, User
from .base import (
    CheckoutResult,
    ConfigurationError,
    NormalizedEvent,
    PaymentError,
    WebhookVerificationError,
)

STRIPE_API_BASE = "https://api.stripe.com/v1"
SIGNATURE_TOLERANCE_SECONDS = 300


def verify_stripe_signature(
    payload: bytes,
    sig_header: str,
    secret: str,
    *,
    tolerance: int = SIGNATURE_TOLERANCE_SECONDS,
    now: int | None = None,
) -> bool:
    """Verify a Stripe webhook signature (v1 HMAC-SHA256 scheme).

    Pure function — unit-testable with a fake secret, no network involved.
    """
    if not sig_header or not secret:
        return False

    timestamp: int | None = None
    candidate_sigs: list[str] = []
    for part in sig_header.split(","):
        key, _, value = part.strip().partition("=")
        if key == "t":
            try:
                timestamp = int(value)
            except ValueError:
                return False
        elif key == "v1":
            candidate_sigs.append(value)

    if timestamp is None or not candidate_sigs:
        return False

    current = int(time.time()) if now is None else now
    if abs(current - timestamp) > tolerance:
        return False

    signed_payload = f"{timestamp}.".encode() + payload
    expected = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, sig) for sig in candidate_sigs)


class StripeProvider:
    name = "stripe"

    # -- config -----------------------------------------------------------

    def _require_key(self) -> str:
        key = get_settings().stripe_secret_key
        if not key:
            raise ConfigurationError(
                "PAYMENT_PROVIDER=stripe but STRIPE_SECRET_KEY is empty. "
                "Set STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_*) "
                "in platform/.env — see the header of app/payments/stripe_adapter.py."
            )
        return key

    def _price_id_for(self, plan: Plan) -> str:
        settings = get_settings()
        price_id = {
            "pro-monthly": settings.stripe_price_pro_monthly,
            "pro-annual": settings.stripe_price_pro_annual,
            "premium-monthly": settings.stripe_price_premium_monthly,
            "premium-annual": settings.stripe_price_premium_annual,
        }.get(plan.code, "")
        if not price_id:
            raise ConfigurationError(
                f"No Stripe price configured for plan {plan.code!r}. "
                f"Set the matching STRIPE_PRICE_* variable in platform/.env."
            )
        return price_id

    # -- protocol ----------------------------------------------------------

    def create_checkout(self, user: User, plan: Plan) -> CheckoutResult:
        key = self._require_key()
        price_id = self._price_id_for(plan)
        mode = "subscription" if plan.interval in ("month", "year") else "payment"
        base = get_settings().public_base_url.rstrip("/")

        # Stripe expects application/x-www-form-urlencoded with bracketed keys.
        # For subscription mode, propagate the metadata onto the subscription too
        # so renewal invoices can be traced back if ever needed.
        form = {
            "mode": mode,
            "line_items[0][price]": price_id,
            "line_items[0][quantity]": "1",
            "customer_email": user.email,
            "client_reference_id": str(user.id),
            "metadata[user_id]": str(user.id),
            "metadata[plan_code]": plan.code,
            "success_url": f"{base}/account?checkout=success",
            "cancel_url": f"{base}/#pricing",
        }
        if mode == "subscription":
            form["subscription_data[metadata][user_id]"] = str(user.id)
            form["subscription_data[metadata][plan_code]"] = plan.code
        try:
            response = httpx.post(
                f"{STRIPE_API_BASE}/checkout/sessions",
                data=form,
                auth=(key, ""),
                timeout=20.0,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            # Stripe rejected it (bad price id, wrong/insufficient key, …).
            # Surface Stripe's own message instead of a blank 500.
            try:
                reason = exc.response.json().get("error", {}).get("message", "")
            except Exception:
                reason = exc.response.text
            raise PaymentError(
                f"Stripe rejected the checkout ({exc.response.status_code}): {reason}"
            ) from exc
        except httpx.HTTPError as exc:  # network / timeout
            raise PaymentError(f"Could not reach Stripe: {exc}") from exc

        session = response.json()
        return CheckoutResult(
            checkout_id=session["id"],
            client_action={"type": "redirect", "url": session["url"]},
        )

    async def handle_webhook(self, request: Request) -> NormalizedEvent:
        secret = get_settings().stripe_webhook_secret
        if not secret:
            raise ConfigurationError(
                "STRIPE_WEBHOOK_SECRET is empty — cannot verify Stripe webhooks."
            )
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature", "")
        if not verify_stripe_signature(payload, sig_header, secret):
            raise WebhookVerificationError("Invalid Stripe webhook signature")

        event = json.loads(payload)
        event_type = event.get("type", "")
        obj = event.get("data", {}).get("object", {})

        if event_type == "checkout.session.completed":
            metadata = obj.get("metadata") or {}
            user_id = metadata.get("user_id") or obj.get("client_reference_id")
            return NormalizedEvent(
                event_id=event["id"],
                event_type="checkout.completed",
                user_id=int(user_id) if user_id is not None else None,
                plan_code=metadata.get("plan_code"),
                amount_cents=obj.get("amount_total"),
                currency=obj.get("currency", "usd"),
                provider_ref=obj.get("id", ""),
                # `subscription` is the sub_... id for subscription-mode sessions
                # (None for one-time payments); stored to match renewals/cancels.
                subscription_id=obj.get("subscription"),
                raw=event,
            )

        if event_type in ("invoice.paid", "invoice.payment_succeeded"):
            # The first invoice of a subscription is the initial charge, already
            # handled by checkout.session.completed — only act on renewals.
            if obj.get("billing_reason") == "subscription_create":
                return NormalizedEvent(
                    event_id=event["id"], event_type=event_type, raw=event
                )
            lines = (obj.get("lines") or {}).get("data") or []
            period = lines[0].get("period", {}) if lines else {}
            return NormalizedEvent(
                event_id=event["id"],
                event_type="invoice.paid",
                subscription_id=obj.get("subscription"),
                amount_cents=obj.get("amount_paid"),
                currency=obj.get("currency", "usd"),
                provider_ref=obj.get("id", ""),
                period_end_ts=period.get("end"),
                raw=event,
            )

        # Anything else is acknowledged but not acted upon (still recorded
        # in webhook_events for idempotency/audit).
        return NormalizedEvent(
            event_id=event.get("id", ""),
            event_type=event_type,
            raw=event,
        )

    def cancel(self, subscription: Subscription) -> None:
        """Set cancel_at_period_end on the Stripe subscription so it stops
        renewing (access continues until the current period ends).

        Uses the sub_... id captured on activation (Subscription.provider_sub_id).
        A subscription without one — a mock purchase, or one predating the Stripe
        integration — can't be cancelled provider-side; the caller keeps the
        local cancel flag regardless.
        """
        key = self._require_key()
        stripe_sub_id = subscription.provider_sub_id
        if not stripe_sub_id:
            raise ConfigurationError(
                "Cannot cancel on Stripe: subscription has no provider_sub_id."
            )
        httpx.post(
            f"{STRIPE_API_BASE}/subscriptions/{stripe_sub_id}",
            data={"cancel_at_period_end": "true"},
            auth=(key, ""),
            timeout=20.0,
        ).raise_for_status()
