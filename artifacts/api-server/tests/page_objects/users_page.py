# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/page_objects/users_page.py
# Page Object for /api/users endpoints.
# =============================================================================

from tests.page_objects.base_page import BasePage


class UsersPage(BasePage):
    BASE_PATH = "/api/users"

    async def get_me(self):
        return await self.get("/me")

    async def list_users(self):
        return await self.get("/")

    async def update_role(self, user_id: int, role: str):
        return await self.patch(f"/{user_id}/role", json={"role": role})

    def assert_user_shape(self) -> "UsersPage":
        """Assert the response contains a valid user object."""
        data = self.json()
        assert "id" in data
        assert "email" in data
        assert "role" in data
        assert "clerk_user_id" in data
        return self
