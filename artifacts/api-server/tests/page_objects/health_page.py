# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/page_objects/health_page.py
# Page Object for GET /api/healthz.
# =============================================================================

from tests.page_objects.base_page import BasePage


class HealthPage(BasePage):
    BASE_PATH = "/api"

    async def check(self):
        """GET /api/healthz → 200."""
        return await self.get("/healthz")

    def assert_healthy(self) -> "HealthPage":
        self.assert_ok(200)
        data = self.json()
        assert data["status"] == "ok"
        assert data["version"] == "2.0.0"
        assert data["service"] == "synaptiq-api"
        return self
