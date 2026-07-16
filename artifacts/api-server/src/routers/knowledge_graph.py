# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/routers/knowledge_graph.py
# Live knowledge graph endpoint — returns the platform's relational data
# as a force-directed graph payload for the canvas renderer.
# =============================================================================

from fastapi import APIRouter, Depends

from src.database import DBSession
from src.models.user import User
from src.routers.users import get_current_user
from src.schemas.knowledge_graph import KnowledgeGraphOut
from src.services.graph_service import GraphService

router = APIRouter()


@router.get("/", response_model=KnowledgeGraphOut, summary="Get live knowledge graph")
async def get_knowledge_graph(
    db: DBSession = None,
    _user: User = Depends(get_current_user),
) -> KnowledgeGraphOut:
    svc = GraphService(db)
    return await svc.build_graph()
