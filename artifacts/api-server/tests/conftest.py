# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/conftest.py
# Shared pytest fixtures for all test suites.
# Uses an in-memory SQLite database for fast isolated tests.
# Page Object Model pattern: each fixture surface gives a page-object wrapper.
# =============================================================================

import asyncio
from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from src.database import Base, get_db_session
from src.main import create_app
from src.models import (  # noqa: F401 — import all models for Base.metadata
    DataSource, FeatureSet, Profile, ScrapeJob, TestRun, TrainingRun, User,
)

# ---------------------------------------------------------------------------
# Database — shared SQLite in-memory engine for all tests
# ---------------------------------------------------------------------------
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="session")
async def engine():
    """Session-scoped async SQLite engine with schema created once."""
    eng = create_async_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    """Function-scoped database session — rolled back after each test."""
    session_factory = async_sessionmaker(
        bind=engine, expire_on_commit=False, autoflush=False
    )
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()


# ---------------------------------------------------------------------------
# FastAPI test app + HTTP client
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def app(db_session: AsyncSession) -> FastAPI:
    """Return the FastAPI app with DB session overridden."""
    test_app = create_app()

    async def override_db():
        yield db_session

    test_app.dependency_overrides[get_db_session] = override_db
    return test_app


@pytest_asyncio.fixture
async def auth_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """
    Async HTTP client with a mocked Clerk user injected.
    Used by page objects in authenticated test suites.
    """
    from src.middleware.auth import ClerkUser, get_current_clerk_user

    mock_clerk_user = ClerkUser({
        "sub": "user_test_123",
        "email": "test@synaptiq.dev",
        "first_name": "Test",
        "last_name": "User",
    })

    app.dependency_overrides[get_current_clerk_user] = lambda: mock_clerk_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


@pytest_asyncio.fixture
async def anon_client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """Unauthenticated HTTP client (no auth override)."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client
