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

    # "mock" (default; in-process fake checkout) or "stripe".
    payment_provider: str = "mock"

    # Stripe credentials — empty by default so the Stripe adapter stays inert.
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_pro_monthly: str = ""
    stripe_price_pro_annual: str = ""
    stripe_price_lifetime: str = ""

    # Directory containing the gated .ipynb files.
    notebooks_dir: str = "../site/public/notebooks"


@lru_cache
def get_settings() -> Settings:
    return Settings()
