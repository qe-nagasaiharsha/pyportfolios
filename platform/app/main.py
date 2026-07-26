"""pyportfolios subscription sidecar.

Run (from platform/):
    uvicorn app.main:app --port 8787

All routes live under /api so nginx can reverse-proxy `location /api/` to
127.0.0.1:8787 in front of the static Next.js export.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import init_db
from .routes import auth as auth_routes
from .routes import checkout as checkout_routes
from .routes import content as content_routes
from .routes import entitlements as entitlement_routes
from .routes import plans as plan_routes
from .routes import subscription as subscription_routes
from .routes import webhooks as webhook_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    init_db(settings.database_url)  # creates tables + seeds plans, idempotent
    yield


app = FastAPI(
    title="pyportfolios platform API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# Dev CORS: the static site is served from another localhost port during
# development. In production both are same-origin behind nginx, so CORS is
# effectively moot there. allow_credentials is required for the session cookie.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(plan_routes.router)
app.include_router(checkout_routes.router)
app.include_router(subscription_routes.router)
app.include_router(webhook_routes.router)
app.include_router(content_routes.router)
app.include_router(entitlement_routes.router)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "provider": get_settings().payment_provider}
