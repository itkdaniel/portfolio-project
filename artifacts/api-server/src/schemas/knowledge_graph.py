# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/schemas/knowledge_graph.py
# Pydantic schemas for the live knowledge graph endpoint.
# =============================================================================

from typing import Any

from src.schemas.common import SynaptiqModel


class KnowledgeGraphNodeOut(SynaptiqModel):
    """A single node in the force-directed graph."""
    id: str
    label: str
    entity_type: str  # e.g. "user", "data_source", "scrape_job", "feature_set"
    detail: dict[str, Any] | None = None


class KnowledgeGraphEdgeOut(SynaptiqModel):
    """A directed edge between two nodes."""
    source: str
    target: str
    relation: str  # e.g. "scrapes", "processed_into", "trained_on", "ran_by"


class KnowledgeGraphOut(SynaptiqModel):
    """Complete graph payload for the canvas renderer."""
    nodes: list[KnowledgeGraphNodeOut]
    edges: list[KnowledgeGraphEdgeOut]
