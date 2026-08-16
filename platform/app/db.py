"""Database engine / session management.

The engine is created lazily at application startup (lifespan) so tests can
point DATABASE_URL at a temporary SQLite file before the app boots.

All datetimes are stored as naive UTC (`timestamp without time zone` on
Postgres) — the application layer treats every stored datetime as UTC.
"""

from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    pass


engine = None
SessionLocal: sessionmaker | None = None


def utcnow() -> datetime:
    """Naive UTC 'now' — comparable with values read back from any backend."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _normalize_url(url: str) -> str:
    """Managed Postgres (Render/Railway/Heroku) hands out `postgres://…` or
    `postgresql://…`, which SQLAlchemy would route to psycopg2. We ship psycopg
    (v3), so pin the driver explicitly."""
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


def init_db(database_url: str) -> None:
    """Create engine + tables and seed reference data. Idempotent."""
    global engine, SessionLocal

    database_url = _normalize_url(database_url)

    connect_args = {}
    engine_kwargs = {"future": True}
    if database_url.startswith("sqlite"):
        # TestClient / uvicorn may touch the session from different threads.
        connect_args["check_same_thread"] = False
    else:
        # Managed Postgres drops idle connections; validate on checkout.
        engine_kwargs["pool_pre_ping"] = True

    engine = create_engine(database_url, connect_args=connect_args, **engine_kwargs)
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, future=True)

    # Import inside the function to avoid a circular import at module load.
    from . import models  # noqa: F401

    Base.metadata.create_all(engine)

    with SessionLocal() as session:
        models.seed_plans(session)
        session.commit()


def get_db():
    """FastAPI dependency yielding a scoped SQLAlchemy session."""
    if SessionLocal is None:  # pragma: no cover - startup ordering guard
        raise RuntimeError("Database not initialised — app lifespan did not run")
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
