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


def init_db(database_url: str) -> None:
    """Create engine + tables and seed reference data. Idempotent."""
    global engine, SessionLocal

    connect_args = {}
    if database_url.startswith("sqlite"):
        # TestClient / uvicorn may touch the session from different threads.
        connect_args["check_same_thread"] = False

    engine = create_engine(database_url, connect_args=connect_args, future=True)
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
