"""Payment provider registry — selected by settings.PAYMENT_PROVIDER."""

from ..config import get_settings
from .base import PaymentProvider
from .mock import mock_provider
from .stripe_adapter import StripeProvider

_stripe_provider: StripeProvider | None = None


def get_provider() -> PaymentProvider:
    global _stripe_provider
    name = get_settings().payment_provider.lower()
    if name == "mock":
        return mock_provider
    if name == "stripe":
        if _stripe_provider is None:
            _stripe_provider = StripeProvider()
        return _stripe_provider
    raise ValueError(f"Unknown PAYMENT_PROVIDER: {name!r}")
