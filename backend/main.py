"""
Global Digital Bank — FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_tables

# Routers
from routers import auth, accounts, transactions, transfers, beneficiaries
from routers import analytics, notifications, security
from routers.admin import dashboard as admin_dashboard, fraud as admin_fraud

logging.basicConfig(level=logging.INFO if settings.DEBUG else logging.WARNING)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables and warm up ML model."""
    logger.info("Starting Global Digital Bank API...")
    create_tables()
    # Warm up ML fraud model
    try:
        from fraud.ml_model import get_model
        get_model()
        logger.info("Fraud ML model loaded.")
    except Exception as e:
        logger.warning(f"ML model warm-up failed (non-fatal): {e}")
    logger.info("API ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Global Digital Bank API",
    description="AI-Powered Digital Banking Platform — REST API",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(transfers.router)
app.include_router(beneficiaries.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(security.router)
from routers import ai
app.include_router(ai.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_fraud.router)


# ── Health & Root check ────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Global Digital Bank API",
        "version": "2.0.0",
        "health": "/api/health",
        "docs": "/api/docs",
        "frontend": "https://frontend-gray-eight-53.vercel.app",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "Global Digital Bank API",
        "version": "2.0.0",
        "docs": "/api/docs",
    }


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("  Global Digital Bank — FastAPI Backend")
    print(f"  Running on http://localhost:{settings.BACKEND_PORT}")
    print(f"  API Docs: http://localhost:{settings.BACKEND_PORT}/api/docs")
    print("=" * 60)
    uvicorn.run("main:app", host="0.0.0.0", port=settings.BACKEND_PORT, reload=settings.DEBUG)
