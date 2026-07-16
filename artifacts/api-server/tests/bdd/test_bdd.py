# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/bdd/test_bdd.py
# Behaviour-Driven (BDD / Given-When-Then) tests.
# These document platform behaviours in plain-English test names and use
# the Page Object Model for HTTP interactions.
# =============================================================================

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.page_objects.health_page import HealthPage
from tests.page_objects.users_page import UsersPage
from tests.page_objects.agent_page import AgentPage
from tests.page_objects.graph_page import GraphPage


# ---------------------------------------------------------------------------
# BDD: Health endpoint
# ---------------------------------------------------------------------------

class TestHealthBehaviour:
    """
    Feature: Platform liveness
      As a monitoring system
      I want to verify the API is running
      So that I can detect outages
    """

    @pytest.mark.asyncio
    async def test_given_api_running_when_healthz_called_then_returns_ok(
        self, auth_client: AsyncClient
    ):
        # Given: the API is running
        page = HealthPage(auth_client)
        # When: the health endpoint is called
        await page.check()
        # Then: returns 200 with status=ok
        page.assert_healthy()

    @pytest.mark.asyncio
    async def test_given_api_running_when_healthz_called_anonymously_then_returns_ok(
        self, anon_client: AsyncClient
    ):
        # Given: no auth credentials
        page = HealthPage(anon_client)
        # When: health endpoint is hit anonymously
        await page.check()
        # Then: returns 200 (health is public)
        page.assert_ok(200)


# ---------------------------------------------------------------------------
# BDD: Authentication behaviour
# ---------------------------------------------------------------------------

class TestAuthBehaviour:
    """
    Feature: Clerk JWT authentication
      As a platform user
      I want my requests to be authenticated via Clerk
      So that my data is secure
    """

    @pytest.mark.asyncio
    async def test_given_valid_jwt_when_get_me_then_returns_user(
        self, auth_client: AsyncClient
    ):
        # Given: a valid Clerk JWT (mocked in conftest)
        page = UsersPage(auth_client)
        # When: GET /api/users/me is called
        await page.get_me()
        # Then: returns 200 with user shape
        page.assert_ok(200).assert_user_shape()

    @pytest.mark.asyncio
    async def test_given_no_jwt_when_get_me_then_returns_401(
        self, anon_client: AsyncClient
    ):
        # Given: no Authorization header
        page = UsersPage(anon_client)
        # When: GET /api/users/me is called
        await page.get_me()
        # Then: returns 401 Unauthorized
        page.assert_status(401)


# ---------------------------------------------------------------------------
# BDD: Knowledge graph behaviour
# ---------------------------------------------------------------------------

class TestKnowledgeGraphBehaviour:
    """
    Feature: Live knowledge graph
      As a platform user
      I want to see the platform's entities as a graph
      So that I can understand relationships between data
    """

    @pytest.mark.asyncio
    async def test_given_authenticated_when_graph_requested_then_returns_graph_shape(
        self, auth_client: AsyncClient
    ):
        # Given: authenticated user
        page = GraphPage(auth_client)
        # When: knowledge graph endpoint is called
        await page.get_graph()
        # Then: returns 200 with nodes and edges lists
        page.assert_ok(200).assert_graph_shape()

    @pytest.mark.asyncio
    async def test_given_empty_db_when_graph_requested_then_returns_empty_graph(
        self, auth_client: AsyncClient
    ):
        page = GraphPage(auth_client)
        await page.get_graph()
        data = page.json()
        # Empty DB → empty arrays (not null)
        assert isinstance(data["nodes"], list)
        assert isinstance(data["edges"], list)
