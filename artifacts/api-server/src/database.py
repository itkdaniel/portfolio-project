# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/database.py
# Async SQLAlchemy 2.0 engine and session factory.
# Uses asyncpg for high-performance PostgreSQL async I/O.
# =============================================================================

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from src.config import get_settings


# ---------------------------------------------------------------------------
# Declarative base — all ORM models inherit from this
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    """Shared SQLAlchemy declarative base for all Synaptiq models."""
    pass


# ---------------------------------------------------------------------------
# Engine — created lazily when first imported
# ---------------------------------------------------------------------------
def _make_engine():
    settings = get_settings()
    return create_async_engine(
        settings.async_database_url,
        echo=settings.debug,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # verify connections before checkout
        pool_recycle=3600,   # recycle connections every hour
    )


# Engine singleton
engine = _make_engine()

# Session factory
AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ---------------------------------------------------------------------------
# FastAPI dependency — provides a database session per request
# ---------------------------------------------------------------------------
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an async database session.
    Automatically commits on success and rolls back on exception.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Shorthand type alias for use in route signatures
DBSession = Annotated[AsyncSession, Depends(get_db_session)]
