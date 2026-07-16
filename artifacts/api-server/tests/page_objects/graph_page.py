# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/page_objects/graph_page.py
# Page Object for /api/knowledge-graph endpoints.
# =============================================================================

from tests.page_objects.base_page import BasePage


class GraphPage(BasePage):
    BASE_PATH = "/api/knowledge-graph"

    async def get_graph(self):
        return await self.get("/")

    def assert_graph_shape(self) -> "GraphPage":
        data = self.json()
        assert "nodes" in data
        assert "edges" in data
        assert isinstance(data["nodes"], list)
        assert isinstance(data["edges"], list)
        return self
