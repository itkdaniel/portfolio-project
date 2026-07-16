# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/e2e/test_e2e.py
# End-to-End tests — full request/response cycle using the FastAPI test client.
# Uses Page Object Model for all HTTP interactions.
# Each test exercises a complete user flow through the API.
# =============================================================================

import pytest
from httpx import AsyncClient

from tests.page_objects.health_page import HealthPage
from tests.page_objects.users_page import UsersPage
from tests.page_objects.agent_page import AgentPage
from tests.page_objects.graph_page import GraphPage


# ---------------------------------------------------------------------------
# E2E: Health
# ---------------------------------------------------------------------------

class TestHealthE2E:
    @pytest.mark.asyncio
    async def test_health_endpoint_full_cycle(self, anon_client: AsyncClient):
        """E2E: Anonymous GET /api/healthz → 200 with version field."""
        page = HealthPage(anon_client)
        await page.check()
        page.assert_healthy()
        data = page.json()
        assert data["version"] == "2.0.0"


# ---------------------------------------------------------------------------
# E2E: User registration and profile flow
# ---------------------------------------------------------------------------

class TestUserE2E:
    @pytest.mark.asyncio
    async def test_user_me_returns_jit_created_user(self, auth_client: AsyncClient):
        """
        E2E: First call to GET /api/users/me creates the user JIT and returns it.
        Subsequent call returns the same user (idempotent).
        """
        page = UsersPage(auth_client)

        # First call — JIT create
        await page.get_me()
        page.assert_ok(200)
        first = page.json()
        assert first["clerk_user_id"] == "user_test_123"

        # Second call — idempotent
        await page.get_me()
        page.assert_ok(200)
        second = page.json()
        assert second["id"] == first["id"]

    @pytest.mark.asyncio
    async def test_list_users_requires_no_credentials_error(self, anon_client: AsyncClient):
        """E2E: GET /api/users/ without auth → 401."""
        page = UsersPage(anon_client)
        await page.list_users()
        page.assert_status(401)


# ---------------------------------------------------------------------------
# E2E: Knowledge graph
# ---------------------------------------------------------------------------

class TestKnowledgeGraphE2E:
    @pytest.mark.asyncio
    async def test_graph_returns_valid_structure(self, auth_client: AsyncClient):
        """E2E: GET /api/knowledge-graph/ returns {nodes, edges} structure."""
        page = GraphPage(auth_client)
        await page.get_graph()
        page.assert_ok(200).assert_graph_shape()

    @pytest.mark.asyncio
    async def test_graph_nodes_have_required_fields(self, auth_client: AsyncClient):
        """E2E: Every node has id, label, entity_type fields."""
        # Create a user first so the graph has at least one node
        users_page = UsersPage(auth_client)
        await users_page.get_me()

        graph_page = GraphPage(auth_client)
        await graph_page.get_graph()
        data = graph_page.json()

        for node in data["nodes"]:
            assert "id" in node, f"Node missing 'id': {node}"
            assert "label" in node, f"Node missing 'label': {node}"
            assert "entity_type" in node, f"Node missing 'entity_type': {node}"


# ---------------------------------------------------------------------------
# E2E: Agent data sources
# ---------------------------------------------------------------------------

class TestAgentDataSourcesE2E:
    @pytest.mark.asyncio
    async def test_list_data_sources_seeded_on_first_call(self, auth_client: AsyncClient):
        """E2E: GET /api/agent/data-sources seeds sources and returns a non-empty list."""
        page = AgentPage(auth_client)
        await page.list_data_sources()
        page.assert_ok(200)
        sources = page.json()
        assert isinstance(sources, list)
        assert len(sources) > 0

    @pytest.mark.asyncio
    async def test_data_sources_have_required_shape(self, auth_client: AsyncClient):
        """E2E: Every data source has id, name, category, url, active."""
        page = AgentPage(auth_client)
        await page.list_data_sources()
        for source in page.json():
            assert "id" in source
            assert "name" in source
            assert "category" in source
            assert "url" in source
            assert "active" in source


# ---------------------------------------------------------------------------
# E2E: Full agent pipeline (scrape → process → train)
# ---------------------------------------------------------------------------

class TestAgentPipelineE2E:
    @pytest.mark.asyncio
    async def test_scrape_job_returns_valid_shape(self, auth_client: AsyncClient):
        """E2E: POST /api/agent/scrape returns a valid ScrapeJob."""
        agent = AgentPage(auth_client)

        # Ensure data sources are seeded
        await agent.list_data_sources()

        # Run scrape (uses live hacker-news if network available; fallback on error)
        await agent.run_scrape("hacker-news")
        agent.assert_job_shape()
        job = agent.json()
        # Status should be complete or failed (not stuck at pending)
        assert job["status"] in ("complete", "failed")

    @pytest.mark.asyncio
    async def test_process_unknown_job_returns_404(self, auth_client: AsyncClient):
        """E2E: POST /api/agent/process with non-existent scrape_job_id → 404."""
        agent = AgentPage(auth_client)
        await agent.run_process(scrape_job_id=99999)
        agent.assert_status(404)
