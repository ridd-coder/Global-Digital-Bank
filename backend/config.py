"""
Global Digital Bank — Application Configuration
Uses pydantic-settings for type-safe env variable loading.
"""
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Database ───────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./gdb_demo.db"

    # ── JWT ────────────────────────────────────────────────────────────────────
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Admin Credentials ──────────────────────────────────────────────────────
    ADMIN_EMAIL: str = "admin@globaldigitalbank.com"
    ADMIN_PASSWORD: str = "Admin@SecurePass1"

    # ── Banking Rules ──────────────────────────────────────────────────────────
    MIN_AGE: int = 18
    MIN_BALANCE_SAVINGS: float = 1000.0
    MIN_BALANCE_CURRENT: float = 5000.0
    DAILY_WITHDRAWAL_LIMIT: float = 50000.0
    MAX_FAILED_ATTEMPTS: int = 3

    # ── CORS ───────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:2500",
        "http://127.0.0.1:2500",
        "http://localhost:3000",
        "http://localhost:80",
        "http://127.0.0.1:5173",
        "https://*.vercel.app",
    ]
    CORS_ORIGIN_REGEX: str = r"https://.*\.vercel\.app"

    # ── App ────────────────────────────────────────────────────────────────────
    APP_NAME: str = "Global Digital Bank"
    APP_ENV: str = "development"
    DEBUG: bool = True
    BACKEND_PORT: int = 8000

    # ── AI Integration ─────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = ""

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v


settings = Settings()
