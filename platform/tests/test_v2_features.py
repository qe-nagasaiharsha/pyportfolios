"""Tests for the vault-content, early-access, and password-management
features. Same style as test_e2e.py: TestClient + temporary SQLite + temp
content dirs, fully deterministic, zero network (the email backend is
monkeypatched to an in-memory capture list).
"""

import io
import re
import zipfile

import pytest
from fastapi.testclient import TestClient

from app import auth
from app import email as email_mod
from app.config import get_settings
from app.main import app
from app.payments.mock import CARD_SUCCESS, mock_provider
from app.routes import early_access

NOTEBOOK_SLUG = "momentum-alpha"
BUNDLE_SLUG = "momentum-alpha"
PASSWORD = "s3cure-pass!"
NEW_PASSWORD = "n3w-pass-please!"


def _dummy_zip_bytes() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("README.txt", "bundle payload")
    return buf.getvalue()


class CaptureEmailBackend:
    """Test double for the EmailBackend protocol — records instead of sending."""

    name = "capture"

    def __init__(self) -> None:
        self.sent: list[dict] = []

    def send(self, to: str, subject: str, body: str) -> None:
        self.sent.append({"to": to, "subject": subject, "body": body})


@pytest.fixture()
def outbox() -> CaptureEmailBackend:
    return CaptureEmailBackend()


@pytest.fixture()
def client(tmp_path, monkeypatch, outbox):
    db_path = tmp_path / "test.db"
    notebooks = tmp_path / "notebooks"
    notebooks.mkdir()
    (notebooks / f"{NOTEBOOK_SLUG}.ipynb").write_text("{}", encoding="utf-8")
    bundles = tmp_path / "bundles"
    bundles.mkdir()
    (bundles / f"{BUNDLE_SLUG}.zip").write_bytes(_dummy_zip_bytes())

    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("CONTENT_NOTEBOOKS_DIR", str(notebooks))
    monkeypatch.setenv("CONTENT_BUNDLES_DIR", str(bundles))
    monkeypatch.setenv("PAYMENT_PROVIDER", "mock")
    get_settings.cache_clear()
    mock_provider._checkouts.clear()
    auth.reset_failed_logins()
    early_access.reset_signup_limits()
    monkeypatch.setattr(email_mod, "get_email_backend", lambda: outbox)

    with TestClient(app) as c:
        yield c

    get_settings.cache_clear()


def register(client: TestClient, email: str, password: str = PASSWORD) -> dict:
    r = client.post(
        "/api/auth/register", json={"email": email, "password": password, "name": "T"}
    )
    assert r.status_code == 201, r.text
    return r.json()


def buy_pro(client: TestClient) -> None:
    r = client.post("/api/checkout", json={"plan_code": "pro-monthly"})
    assert r.status_code == 200, r.text
    r2 = client.post(
        f"/api/checkout/{r.json()['checkout_id']}/confirm",
        json={"card_number": CARD_SUCCESS},
    )
    assert r2.status_code == 200, r2.text


def reset_token_from(outbox: CaptureEmailBackend) -> str:
    assert outbox.sent, "no reset email was sent"
    m = re.search(r"Reset token: (\S+)", outbox.sent[-1]["body"])
    assert m, outbox.sent[-1]["body"]
    return m.group(1)


# ---------------------------------------------------------------------------
# Bundles: gated exactly like notebooks
# ---------------------------------------------------------------------------

def test_bundle_download_gated_flow(client):
    # Unauthenticated -> 401
    fresh = TestClient(app)
    assert fresh.get(f"/api/content/bundles/{BUNDLE_SLUG}").status_code == 401

    register(client, "zoe@example.com")

    # Free tier -> 402
    r = client.get(f"/api/content/bundles/{BUNDLE_SLUG}")
    assert r.status_code == 402

    # Subscribe via the mock provider -> 200 with a zip attachment
    buy_pro(client)
    r = client.get(f"/api/content/bundles/{BUNDLE_SLUG}")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/zip"
    disposition = r.headers.get("content-disposition", "")
    assert "attachment" in disposition
    assert f"{BUNDLE_SLUG}.zip" in disposition
    assert zipfile.ZipFile(io.BytesIO(r.content)).namelist() == ["README.txt"]

    # Notebook route still works from the vault dir (backward compatible)
    assert client.get(f"/api/content/notebooks/{NOTEBOOK_SLUG}").status_code == 200


def test_bundle_slug_guard(client):
    register(client, "guard@example.com")
    buy_pro(client)  # fully entitled attacker
    for bad in ("..%2f..%2fsecret", "..%5C..%5Cwin", "UPPER", "dot.dot", "a_b"):
        assert client.get(f"/api/content/bundles/{bad}").status_code == 404, bad
    assert client.get("/api/content/bundles/no-such-bundle").status_code == 404


# ---------------------------------------------------------------------------
# Early access
# ---------------------------------------------------------------------------

def test_early_access_signup_and_idempotent_duplicate(client):
    r = client.post("/api/early-access", json={"email": "keen@example.com"})
    assert r.status_code == 200
    assert r.json() == {"ok": True, "duplicate": False}

    # Duplicate is idempotent — 200, flagged, no error (no enumeration)
    r = client.post("/api/early-access", json={"email": "KEEN@example.com "})
    assert r.status_code == 200
    assert r.json() == {"ok": True, "duplicate": True}

    # Optional source is stored without complaint
    r = client.post(
        "/api/early-access", json={"email": "src@example.com", "source": "landing-hero"}
    )
    assert r.json() == {"ok": True, "duplicate": False}


def test_early_access_bad_email_422(client):
    for bad in ("not-an-email", "a@b", "spaces in@example.com", ""):
        r = client.post("/api/early-access", json={"email": bad})
        assert r.status_code == 422, bad


def test_early_access_rate_limited(client):
    for i in range(early_access.MAX_SIGNUP_ATTEMPTS):
        r = client.post("/api/early-access", json={"email": f"u{i}@example.com"})
        assert r.status_code == 200
    r = client.post("/api/early-access", json={"email": "straw@example.com"})
    assert r.status_code == 429


# ---------------------------------------------------------------------------
# Password reset (full flow)
# ---------------------------------------------------------------------------

def test_full_password_reset_flow(client, outbox):
    register(client, "resetme@example.com")  # client now holds a live session

    # Request: always 200; token arrives via the (captured) email backend
    r = client.post("/api/auth/request-password-reset", json={"email": "resetme@example.com"})
    assert r.status_code == 200 and r.json() == {"ok": True}
    token = reset_token_from(outbox)
    assert outbox.sent[-1]["to"] == "resetme@example.com"

    # Unknown email: same 200, no email sent (no enumeration)
    sent_before = len(outbox.sent)
    r = client.post("/api/auth/request-password-reset", json={"email": "ghost@example.com"})
    assert r.status_code == 200 and r.json() == {"ok": True}
    assert len(outbox.sent) == sent_before

    # Reset with the captured token
    r = client.post(
        "/api/auth/reset-password", json={"token": token, "new_password": NEW_PASSWORD}
    )
    assert r.status_code == 200 and r.json() == {"ok": True}

    # Old session is dead (ALL sessions revoked)
    assert client.get("/api/auth/me").status_code == 401

    # Old password no longer works; new one does
    r = client.post(
        "/api/auth/login", json={"email": "resetme@example.com", "password": PASSWORD}
    )
    assert r.status_code == 401
    r = client.post(
        "/api/auth/login", json={"email": "resetme@example.com", "password": NEW_PASSWORD}
    )
    assert r.status_code == 200

    # Token is single-use
    r = client.post(
        "/api/auth/reset-password", json={"token": token, "new_password": "another-pass1"}
    )
    assert r.status_code == 400


def test_reset_password_rejects_bad_tokens_and_short_passwords(client):
    register(client, "tok@example.com")
    r = client.post(
        "/api/auth/reset-password", json={"token": "bogus", "new_password": NEW_PASSWORD}
    )
    assert r.status_code == 400
    r = client.post(
        "/api/auth/reset-password", json={"token": "bogus", "new_password": "short"}
    )
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# Change password
# ---------------------------------------------------------------------------

def test_change_password_revokes_other_sessions_only(client):
    register(client, "changer@example.com")

    # Second session on another "device"
    other = TestClient(app)
    r = other.post(
        "/api/auth/login", json={"email": "changer@example.com", "password": PASSWORD}
    )
    assert r.status_code == 200
    assert other.get("/api/auth/me").status_code == 200

    # Wrong current password -> 400, nothing revoked
    r = client.post(
        "/api/auth/change-password",
        json={"current_password": "wrong-pass", "new_password": NEW_PASSWORD},
    )
    assert r.status_code == 400
    assert other.get("/api/auth/me").status_code == 200

    # Short new password -> 422
    r = client.post(
        "/api/auth/change-password",
        json={"current_password": PASSWORD, "new_password": "short"},
    )
    assert r.status_code == 422

    # Correct change: current session survives, the other one dies
    r = client.post(
        "/api/auth/change-password",
        json={"current_password": PASSWORD, "new_password": NEW_PASSWORD},
    )
    assert r.status_code == 200 and r.json() == {"ok": True}
    assert client.get("/api/auth/me").status_code == 200
    assert other.get("/api/auth/me").status_code == 401

    # New password is live
    r = other.post(
        "/api/auth/login", json={"email": "changer@example.com", "password": NEW_PASSWORD}
    )
    assert r.status_code == 200

    # Unauthenticated change-password -> 401
    fresh = TestClient(app)
    r = fresh.post(
        "/api/auth/change-password",
        json={"current_password": PASSWORD, "new_password": NEW_PASSWORD},
    )
    assert r.status_code == 401
