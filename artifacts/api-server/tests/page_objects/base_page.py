# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/page_objects/base_page.py
# Abstract base Page Object.  Each router has its own Page Object that extends
# this class, encapsulating HTTP interactions and response assertions.
#
# Pattern: Page Objects wrap httpx.AsyncClient, exposing typed helpers.
# This mirrors the TypeScript Page Object Model from tests/page_objects/.
# =============================================================================

from typing import Any

from httpx import AsyncClient, Response


class BasePage:
    """
    Base Page Object for Synaptiq API tests.

    Sub-classes override `BASE_PATH` and add typed request methods.
    All raw responses are available via `.last_response` for assertion.
    """
    BASE_PATH: str = "/api"

    def __init__(self, client: AsyncClient) -> None:
        self.client = client
        self.last_response: Response | None = None

    def url(self, path: str = "") -> str:
        return f"{self.BASE_PATH}{path}"

    async def get(self, path: str = "", **kwargs: Any) -> Response:
        self.last_response = await self.client.get(self.url(path), **kwargs)
        return self.last_response

    async def post(self, path: str = "", **kwargs: Any) -> Response:
        self.last_response = await self.client.post(self.url(path), **kwargs)
        return self.last_response

    async def put(self, path: str = "", **kwargs: Any) -> Response:
        self.last_response = await self.client.put(self.url(path), **kwargs)
        return self.last_response

    async def patch(self, path: str = "", **kwargs: Any) -> Response:
        self.last_response = await self.client.patch(self.url(path), **kwargs)
        return self.last_response

    async def delete(self, path: str = "", **kwargs: Any) -> Response:
        self.last_response = await self.client.delete(self.url(path), **kwargs)
        return self.last_response

    # ---- Assertion helpers --------------------------------------------------

    def assert_ok(self, status: int = 200) -> "BasePage":
        assert self.last_response is not None
        assert self.last_response.status_code == status, (
            f"Expected {status}, got {self.last_response.status_code}: "
            f"{self.last_response.text}"
        )
        return self

    def assert_status(self, status: int) -> "BasePage":
        return self.assert_ok(status)

    def json(self) -> Any:
        assert self.last_response is not None
        return self.last_response.json()
