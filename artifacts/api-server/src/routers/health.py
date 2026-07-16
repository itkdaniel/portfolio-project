# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/routers/health.py
# GET /api/healthz — liveness check (no auth required).
# =============================================================================

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthStatus(BaseModel):
    status: str = "ok"
    version: str = "2.0.0"
    service: str = "synaptiq-api"


@router.get("/healthz", response_model=HealthStatus, summary="Liveness check")
async def health_check() -> HealthStatus:
    """Returns 200 OK when the service is running."""
    return HealthStatus()
