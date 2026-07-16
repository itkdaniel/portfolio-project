# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/main.py
# FastAPI application factory. Wires all routers, middleware, and lifecycle
# events. Uses the factory pattern so tests can spin up isolated instances.
# =============================================================================

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings
from src.routers import (
    agent,
    health,
    knowledge_graph,
    profile,
    storage,
    tests,
    users,
)

logger = structlog.get_logger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown hooks
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: run startup tasks, then yield, then teardown."""
    settings = get_settings()
    await logger.ainfo(
        "synaptiq.startup",
        environment=settings.environment,
        port=settings.port,
    )
    yield
    await logger.ainfo("synaptiq.shutdown")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------
def create_app() -> FastAPI:
    """
    Factory function that constructs and configures the FastAPI application.
    Keeping app creation in a factory (not module-level) allows tests to
    instantiate fresh apps with different settings.
    """
    settings = get_settings()

    app = FastAPI(
        title="Synaptiq API",
        description=(
            "Synaptiq — AI-native knowledge graph, agent pipeline, and analytics platform. "
            "Powered by Synaptic Applications."
        ),
        version="2.0.0",
        docs_url="/api/docs" if not settings.is_production else None,
        redoc_url="/api/redoc" if not settings.is_production else None,
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ---- CORS ---------------------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],   # tightened per-domain in production via env
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- Routers ------------------------------------------------------------
    app.include_router(health.router,          prefix="/api")
    app.include_router(users.router,           prefix="/api/users",          tags=["users"])
    app.include_router(profile.router,         prefix="/api/profile",        tags=["profile"])
    app.include_router(agent.router,           prefix="/api/agent",          tags=["agent"])
    app.include_router(tests.router,           prefix="/api/tests",          tags=["tests"])
    app.include_router(knowledge_graph.router, prefix="/api/knowledge-graph", tags=["knowledge-graph"])
    app.include_router(storage.router,         prefix="/api/storage",        tags=["storage"])

    return app


# Module-level app instance — used by uvicorn and gunicorn
app = create_app()
