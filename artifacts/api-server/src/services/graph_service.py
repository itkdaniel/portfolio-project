# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/services/graph_service.py
# Factory service for constructing the live knowledge graph of platform data.
# =============================================================================

from sqlalchemy import select

from src.database import AsyncSession
from src.models.data_source import DataSource
from src.models.feature_set import FeatureSet
from src.models.scrape_job import ScrapeJob, JobStatus
from src.models.training_run import TrainingRun
from src.models.user import User
from src.schemas.knowledge_graph import (
    KnowledgeGraphEdgeOut,
    KnowledgeGraphNodeOut,
    KnowledgeGraphOut,
)
from src.services.base import BaseService


class GraphService(BaseService[User]):
    """
    Factory service that assembles the knowledge graph from live DB data.
    Each entity type becomes a node; foreign-key relationships become edges.
    """

    async def build_graph(self) -> KnowledgeGraphOut:
        """Build and return the complete platform knowledge graph."""
        nodes: list[KnowledgeGraphNodeOut] = []
        edges: list[KnowledgeGraphEdgeOut] = []

        # ---- Users ----------------------------------------------------------
        users_result = await self.db.execute(select(User))
        for user in users_result.scalars().all():
            nodes.append(KnowledgeGraphNodeOut(
                id=f"user:{user.id}",
                label=user.email,
                entity_type="user",
                detail={"role": user.role.value if hasattr(user.role, 'value') else user.role},
            ))

        # ---- Data sources ---------------------------------------------------
        ds_result = await self.db.execute(select(DataSource).where(DataSource.active == True))
        for ds in ds_result.scalars().all():
            nodes.append(KnowledgeGraphNodeOut(
                id=f"data_source:{ds.id}",
                label=ds.name,
                entity_type="data_source",
                detail={"category": ds.category.value if hasattr(ds.category, 'value') else ds.category},
            ))

        # ---- Scrape jobs ----------------------------------------------------
        sj_result = await self.db.execute(
            select(ScrapeJob).where(ScrapeJob.status == JobStatus.complete).limit(50)
        )
        for job in sj_result.scalars().all():
            nodes.append(KnowledgeGraphNodeOut(
                id=f"scrape_job:{job.id}",
                label=f"Scrape #{job.id}",
                entity_type="scrape_job",
                detail={"record_count": job.record_count},
            ))
            edges.append(KnowledgeGraphEdgeOut(
                source=f"user:{job.user_id}",
                target=f"scrape_job:{job.id}",
                relation="ran_by",
            ))
            edges.append(KnowledgeGraphEdgeOut(
                source=f"scrape_job:{job.id}",
                target=f"data_source:{job.data_source_id}",
                relation="scrapes",
            ))

        # ---- Feature sets ---------------------------------------------------
        fs_result = await self.db.execute(select(FeatureSet).limit(50))
        for fs in fs_result.scalars().all():
            nodes.append(KnowledgeGraphNodeOut(
                id=f"feature_set:{fs.id}",
                label=f"Features #{fs.id}",
                entity_type="feature_set",
                detail={"row_count": fs.row_count},
            ))
            edges.append(KnowledgeGraphEdgeOut(
                source=f"scrape_job:{fs.scrape_job_id}",
                target=f"feature_set:{fs.id}",
                relation="processed_into",
            ))

        # ---- Training runs --------------------------------------------------
        tr_result = await self.db.execute(select(TrainingRun).limit(30))
        for tr in tr_result.scalars().all():
            nodes.append(KnowledgeGraphNodeOut(
                id=f"training_run:{tr.id}",
                label=f"Train #{tr.id}",
                entity_type="training_run",
                detail=tr.metrics,
            ))
            edges.append(KnowledgeGraphEdgeOut(
                source=f"feature_set:{tr.feature_set_id}",
                target=f"training_run:{tr.id}",
                relation="trained_on",
            ))

        return KnowledgeGraphOut(nodes=nodes, edges=edges)
