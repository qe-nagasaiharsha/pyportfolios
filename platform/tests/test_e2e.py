"""End-to-end tests for the pyportfolios platform sidecar.

Runs against a temporary SQLite database and a temporary notebooks directory
per test — fully deterministic, zero network access (the mock provider is
in-process and the Stripe adapter is only exercised via its pure signature-
verification function).
"""

import hashlib
import hmac
import json
import time

import pytest
from fastapi.testclient import TestClient

from app import auth
from app.config import get_settings
from app.main import app
from app.payments.mock import CARD_DECLINE, CARD_SUCCESS, mock_provider
from app.payments.stripe_adapter import verify_stripe_signature

NOTEBOOK_SLUG = "momentum-alpha"
NOTEBOOK_BODY = json.dumps({"cells": [], "nbformat": 4, "nbformat_minor": 5})

PASSWORD = "s3cure-pass!"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    notebooks = tmp_path / "notebooks"
    notebooks.mkdir()
    (notebooks / f"{NOTEBOOK_SLUG}.ipynb").write_text(NOTEBOOK_BODY, encoding="utf-8")

    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("CONTENT_NOTEBOOKS_DIR", str(notebooks))
    monkeypatch.setenv("CONTENT_BUNDLES_DIR", str(tmp_path / "bundles"))
    monkeypatch.setenv("PAYMENT_PROVIDER", "mock")
    get_settings.cache_clear()
    mock_provider._checkouts.clear()
    auth.reset_failed_logins()

    with TestClient(app) as c:
        yield c

    get_settings.cache_clear()


def register(client: TestClient, email: str, name: str = "Test User") -> dict:
    r = client.post(
        "/api/auth/register",
        json={"email": email, "password": PASSWORD, "name": name},
    )
    assert r.status_code == 201, r.text
    return r.json()


def buy(client: TestClient, plan_code: str, card: str) -> tuple[int, dict]:
    r = client.post("/api/checkout", json={"plan_code": plan_code})
    assert r.status_code == 200, r.text
    checkout = r.json()
    assert checkout["client_action"]["type"] == "collect_card"
    r2 = client.post(
        f"/api/checkout/{checkout['checkout_id']}/confirm",
        json={"card_number": card},
    )
    return r2.status_code, r2.json()


# ---------------------------------------------------------------------------
# Happy path: register -> login -> plans -> buy pro-monthly -> gated content
# -> cancel at period end
# ---------------------------------------------------------------------------

def test_full_pro_monthly_flow(client):
    user = register(client, "alice@example.com", "Alice")
    assert user["email"] == "alice@example.com"
    assert "password" not in json.dumps(user).lower() or "password_hash" not in user

    # Session cookie flags
    cookie_header = ""
    r = client.post("/api/auth/logout")
    assert r.status_code == 200
    r = client.post(
        "/api/auth/login", json={"email": "alice@example.com", "password": PASSWORD}
    )
    assert r.status_code == 200
    cookie_header = r.headers.get("set-cookie", "")
    assert "HttpOnly" in cookie_header
    assert "samesite=lax" in cookie_header.lower()

    # Plans: the 4 seeded tiers with landing-page prices
    r = client.get("/api/plans")
    assert r.status_code == 200
    plans = {p["code"]: p for p in r.json()}
    assert set(plans) == {"starter", "pro-monthly", "pro-annual", "lifetime"}
    assert plans["starter"]["amount_cents"] == 0
    assert plans["pro-monthly"]["amount_cents"] == 2000
    assert plans["pro-annual"]["amount_cents"] == 19900
    assert plans["lifetime"]["amount_cents"] == 95000

    # Before purchase: starter entitlements, notebook payment-required
    r = client.get("/api/entitlements")
    assert r.json()["tier"] == "starter"
    r = client.get(f"/api/content/notebooks/{NOTEBOOK_SLUG}")
    assert r.status_code == 402

    # Buy pro-monthly with the success test card
    status, body = buy(client, "pro-monthly", CARD_SUCCESS)
    assert status == 200, body
    assert body["status"] == "succeeded"
    assert body["subscription"]["status"] == "active"
    assert body["subscription"]["current_period_end"] is not None

    # Subscription reflects the active plan with a ~30-day period end
    r = client.get("/api/subscription")
    sub = r.json()
    assert sub["status"] == "active"
    assert sub["plan_code"] == "pro-monthly"
    assert sub["cancel_at_period_end"] is False
    assert sub["current_period_end"] is not None

    # Entitlements flip to pro
    r = client.get("/api/entitlements")
    ent = r.json()
    assert ent["tier"] == "pro"
    assert "notebooks" in ent["features"]

    # Gated notebook now downloads
    r = client.get(f"/api/content/notebooks/{NOTEBOOK_SLUG}")
    assert r.status_code == 200
    assert r.text == NOTEBOOK_BODY
    assert "ipynb" in r.headers.get("content-disposition", "")

    # Cancel: access continues until period end
    r = client.post("/api/subscription/cancel")
    assert r.status_code == 200
    sub = r.json()
    assert sub["cancel_at_period_end"] is True
    assert sub["status"] == "active"  # still active until current_period_end

    r = client.get(f"/api/content/notebooks/{NOTEBOOK_SLUG}")
    assert r.status_code == 200  # still entitled until period end


# ---------------------------------------------------------------------------
# Decline path
# ---------------------------------------------------------------------------

def test_declined_card_leaves_no_subscription(client):
    register(client, "bob@example.com")
    status, body = buy(client, "pro-monthly", CARD_DECLINE)
    assert status == 402
    assert "declined" in body["detail"].lower()

    r = client.get("/api/subscription")
    assert r.json()["status"] == "none"

    r = client.get(f"/api/content/notebooks/{NOTEBOOK_SLUG}")
    assert r.status_code == 402

    r = client.get("/api/entitlements")
    assert r.json()["tier"] == "starter"


# ---------------------------------------------------------------------------
# Auth failure modes
# ---------------------------------------------------------------------------

def test_auth_failures(client):
    register(client, "carol@example.com")

    # Duplicate email
    r = client.post(
        "/api/auth/register",
        json={"email": "carol@example.com", "password": PASSWORD},
    )
    assert r.status_code == 409

    # Short password rejected by validation
    r = client.post(
        "/api/auth/register", json={"email": "short@example.com", "password": "short"}
    )
    assert r.status_code == 422

    # Wrong password
    r = client.post(
        "/api/auth/login", json={"email": "carol@example.com", "password": "wrong-pass"}
    )
    assert r.status_code == 401

    # Unauthenticated access
    fresh = TestClient(app)
    assert fresh.get("/api/subscription").status_code == 401
    assert fresh.get("/api/auth/me").status_code == 401
    assert fresh.get("/api/entitlements").status_code == 401
    assert fresh.get(f"/api/content/notebooks/{NOTEBOOK_SLUG}").status_code == 401

    # Logout invalidates the session server-side
    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401


def test_login_rate_limit(client):
    register(client, "dave@example.com")
    client.post("/api/auth/logout")
    for _ in range(5):
        r = client.post(
            "/api/auth/login", json={"email": "dave@example.com", "password": "bad-pass"}
        )
        assert r.status_code == 401
    r = client.post(
        "/api/auth/login", json={"email": "dave@example.com", "password": "bad-pass"}
    )
    assert r.status_code == 429
    # Even the correct password is throttled while the window is hot
    r = client.post(
        "/api/auth/login", json={"email": "dave@example.com", "password": PASSWORD}
    )
    assert r.status_code == 429


# ---------------------------------------------------------------------------
# Checkout edge cases
# ---------------------------------------------------------------------------

def test_checkout_rejects_free_and_unknown_plans(client):
    register(client, "erin@example.com")
    assert client.post("/api/checkout", json={"plan_code": "starter"}).status_code == 400
    assert client.post("/api/checkout", json={"plan_code": "nope"}).status_code == 404
    # Confirming a nonexistent checkout
    r = client.post(
        "/api/checkout/mock_co_doesnotexist/confirm", json={"card_number": CARD_SUCCESS}
    )
    assert r.status_code == 404


def test_lifetime_has_no_period_end(client):
    register(client, "frank@example.com")
    status, body = buy(client, "lifetime", CARD_SUCCESS)
    assert status == 200
    assert body["subscription"]["current_period_end"] is None
    r = client.get("/api/entitlements")
    assert r.json()["tier"] == "lifetime"
    # Cancel is recorded but lifetime access persists (no period end)
    r = client.post("/api/subscription/cancel")
    assert r.status_code == 200
    assert client.get(f"/api/content/notebooks/{NOTEBOOK_SLUG}").status_code == 200


def test_checkout_blocks_downgrade_and_duplicate(client):
    """A Lifetime member cannot re-checkout into a lesser (or equal) plan —
    that would overwrite better access in place and take a second payment."""
    register(client, "grace@example.com")
    status, _ = buy(client, "lifetime", CARD_SUCCESS)
    assert status == 200

    # Downgrade to Pro is refused before any checkout/payment is created.
    r = client.post("/api/checkout", json={"plan_code": "pro-monthly"})
    assert r.status_code == 409
    # Buying Lifetime again (equal rank) is refused too.
    assert client.post("/api/checkout", json={"plan_code": "lifetime"}).status_code == 409

    # The original Lifetime subscription is untouched.
    sub = client.get("/api/subscription").json()
    assert sub["plan_code"] == "lifetime"
    assert sub["status"] == "active"


def test_checkout_allows_upgrade_pro_to_lifetime(client):
    """A strict upgrade (Pro → Lifetime) is still permitted."""
    register(client, "heidi@example.com")
    assert buy(client, "pro-monthly", CARD_SUCCESS)[0] == 200
    status, body = buy(client, "lifetime", CARD_SUCCESS)
    assert status == 200
    assert body["subscription"]["plan_code"] == "lifetime"
    assert body["subscription"]["current_period_end"] is None


# ---------------------------------------------------------------------------
# Content gating: path traversal
# ---------------------------------------------------------------------------

def test_notebook_path_traversal_blocked(client):
    register(client, "mallory@example.com")
    buy(client, "pro-monthly", CARD_SUCCESS)  # fully entitled attacker

    for bad in ("..%2f..%2fsecret", "..%5C..%5Cwin", "UPPER", "dot.dot", "a_b"):
        r = client.get(f"/api/content/notebooks/{bad}")
        assert r.status_code == 404, bad

    # Unknown-but-valid slug is a plain 404
    assert client.get("/api/content/notebooks/no-such-notebook").status_code == 404


# ---------------------------------------------------------------------------
# Webhooks: activation + idempotency
# ---------------------------------------------------------------------------

def test_webhook_activates_and_is_idempotent(client):
    user = register(client, "grace@example.com")
    event = {
        "id": "evt_test_001",
        "type": "checkout.completed",
        "data": {
            "user_id": user["id"],
            "plan_code": "pro-annual",
            "amount_cents": 19900,
            "provider_ref": "mock_co_webhook",
        },
    }
    r = client.post("/api/webhooks/mock", json=event)
    assert r.status_code == 200
    assert r.json() == {"received": True, "duplicate": False, "handled": True}

    sub = client.get("/api/subscription").json()
    assert sub["status"] == "active"
    assert sub["plan_code"] == "pro-annual"

    # Replay: acknowledged, no double-processing
    r = client.post("/api/webhooks/mock", json=event)
    assert r.status_code == 200
    assert r.json() == {"received": True, "duplicate": True}

    # Wrong provider path 404s
    assert client.post("/api/webhooks/stripe", json=event).status_code == 404

    # Malformed payload is rejected
    r = client.post("/api/webhooks/mock", json={"type": "x"})
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# Stripe adapter: pure signature verification (no network) + inert-by-default
# ---------------------------------------------------------------------------

def _sign(payload: bytes, secret: str, ts: int) -> str:
    mac = hmac.new(secret.encode(), f"{ts}.".encode() + payload, hashlib.sha256)
    return f"t={ts},v1={mac.hexdigest()}"


def test_stripe_signature_verification():
    secret = "whsec_fake_test_secret"
    payload = json.dumps({"id": "evt_1", "type": "checkout.session.completed"}).encode()
    now = int(time.time())

    assert verify_stripe_signature(payload, _sign(payload, secret, now), secret)
    # Tampered payload
    assert not verify_stripe_signature(payload + b" ", _sign(payload, secret, now), secret)
    # Wrong secret
    assert not verify_stripe_signature(payload, _sign(payload, "whsec_other", now), secret)
    # Stale timestamp (replay)
    assert not verify_stripe_signature(payload, _sign(payload, secret, now - 3600), secret)
    # Garbage header shapes
    assert not verify_stripe_signature(payload, "", secret)
    assert not verify_stripe_signature(payload, "t=abc,v1=deadbeef", secret)
    assert not verify_stripe_signature(payload, f"t={now}", secret)


def test_stripe_provider_inert_without_keys(client, monkeypatch):
    register(client, "heidi@example.com")
    monkeypatch.setenv("PAYMENT_PROVIDER", "stripe")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "")
    get_settings.cache_clear()
    try:
        r = client.post("/api/checkout", json={"plan_code": "pro-monthly"})
        assert r.status_code == 503
        assert "STRIPE_SECRET_KEY" in r.json()["detail"]
    finally:
        get_settings.cache_clear()
