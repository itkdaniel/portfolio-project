# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/config.py
# Centralised application settings loaded from environment variables.
# Pydantic BaseSettings provides validation, defaults, and .env file support.
# =============================================================================

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables (or .env files).
    All secrets are required — the app will refuse to start if they are absent
    in production, preventing silent misconfigurations.
    """

    model_config = SettingsConfigDict(
        env_file=".env.local",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- Server -------------------------------------------------------------
    host: str = Field(default="0.0.0.0", description="Bind host")
    port: int = Field(default=5000, description="Bind port")
    debug: bool = Field(default=False, description="Enable debug mode")
    environment: str = Field(default="development", description="Runtime environment")

    # ---- Database -----------------------------------------------------------
    database_url: str = Field(..., description="Async PostgreSQL connection string")

    # ---- Session / security -------------------------------------------------
    session_secret: str = Field(..., description="64-char hex session signing secret")

    # ---- Clerk auth ---------------------------------------------------------
    clerk_secret_key: str = Field(..., description="Clerk server-side secret key")
    clerk_publishable_key: str = Field(..., description="Clerk publishable key")
    # Clerk JWKS URL — derived from publishable key prefix
    clerk_jwks_url: str = Field(
        default="",
        description="Clerk JWKS URL (auto-derived if empty)",
    )

    # ---- Object storage -----------------------------------------------------
    default_object_storage_bucket_id: str = Field(
        default="local", description="Replit object storage bucket ID"
    )
    private_object_dir: str = Field(default="private", description="Private object prefix")
    public_object_search_paths: str = Field(
        default="public", description="Comma-separated public object prefixes"
    )

    # ---- Agent pipeline -----------------------------------------------------
    max_scrape_records: int = Field(default=50, description="Max records per scrape job")
    scrape_timeout_seconds: int = Field(default=30, description="HTTP scrape timeout (s)")

    @property
    def async_database_url(self) -> str:
        """Ensure the database URL uses the asyncpg driver."""
        url = self.database_url
        # Rewrite postgres:// or postgresql:// to postgresql+asyncpg://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (constructed once at startup)."""
    return Settings()
