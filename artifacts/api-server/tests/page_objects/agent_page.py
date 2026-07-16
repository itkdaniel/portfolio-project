# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/page_objects/agent_page.py
# Page Object for /api/agent endpoints.
# =============================================================================

from tests.page_objects.base_page import BasePage


class AgentPage(BasePage):
    BASE_PATH = "/api/agent"

    async def list_data_sources(self):
        return await self.get("/data-sources")

    async def run_scrape(self, source: str = "hacker-news", path: str = "raw"):
        return await self.post("/scrape", json={"source": source, "path": path})

    async def list_scrape_jobs(self):
        return await self.get("/scrape")

    async def run_process(self, scrape_job_id: int, feature_names: list[str] | None = None):
        body = {
            "scrape_job_id": scrape_job_id,
            "feature_names": feature_names or ["title", "score", "category"],
        }
        return await self.post("/process", json=body)

    async def list_feature_sets(self):
        return await self.get("/feature-sets")

    async def run_train(self, feature_set_id: int):
        return await self.post("/train", json={"feature_set_id": feature_set_id})

    async def list_training_runs(self):
        return await self.get("/training-runs")

    def assert_job_shape(self) -> "AgentPage":
        data = self.json()
        assert "id" in data
        assert "status" in data
        assert data["status"] in ("pending", "running", "complete", "failed")
        return self
