"""Application settings via pydantic-settings.

Every field can be overridden by an environment variable of the same name
(upper-cased) or via a `.env` file in the working directory (platform/).
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # SQLAlchemy URL. SQLite for dev; schema is Postgres-ready — point this at
    # e.g. postgresql+psycopg://user:pass@host/db for production.
    database_url: str = "sqlite:///./pyportfolios.db"

    # Dev-only default. MUST be overridden in production (.env). Used to harden
    # session-token derivation; leaking it does not directly leak sessions
    # (tokens are random), but treat it as secret anyway.
    session_secret: str = "dev-secret-change-me"
    session_ttl_days: int = 30

    # Set true behind HTTPS (nginx terminates TLS in production).
    cookie_secure: bool = False
    # Session-cookie SameSite policy. "lax" for same-origin (nginx proxy). Set
    # "none" when the frontend is a different origin (e.g. Vercel → Render) so
    # the cookie rides cross-site fetches — requires cookie_secure=true.
    cookie_samesite: str = "lax"

    # Extra CORS origins allowed to call the API with credentials, comma-
    # separated (e.g. "https://pyportfolios.vercel.app"). localhost is always
    # allowed for dev. Needed when the frontend is a separate origin.
    cors_origins: str = ""

    # "mock" (default; in-process fake checkout) or "stripe".
    payment_provider: str = "mock"

    # Public origin of the site, used to build Stripe success/cancel redirect
    # URLs. Override per environment (e.g. https://pyportfolios.vercel.app).
    public_base_url: str = "https://pyportfolios.com"

    # Stripe credentials — empty by default so the Stripe adapter stays inert.
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_pro_monthly: str = ""
    stripe_price_pro_annual: str = ""
    stripe_price_premium_monthly: str = ""
    stripe_price_premium_annual: str = ""

    # Gated content directories. The paid content moved out of the static
    # site into the vault — the API is the only way users obtain these files.
    content_notebooks_dir: str = "../vault/notebooks"
    content_bundles_dir: str = "../vault/bundles"

    # Email backend: "console" (default; DEV ONLY, logs emails via logging)
    # or "smtp" (requires the SMTP_* settings below).
    email_backend: str = "console"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = "no-reply@pyportfolios.com"


@lru_cache
def get_settings() -> Settings:
    return Settings()
