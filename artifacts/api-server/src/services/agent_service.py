# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/services/agent_service.py
# Factory service for the AI agent pipeline: scrape → process → train.
# =============================================================================

from datetime import datetime, timezone

import structlog
from fastapi import HTTPException, status
from sqlalchemy import select

from src.agent.data_sources import DATA_SOURCE_DEFINITIONS, get_definition
from src.agent.process import process_records
from src.agent.scrape import scrape_data_source
from src.agent.train import train_on_rows
from src.database import AsyncSession
from src.models.data_source import DataSource
from src.models.feature_set import FeatureSet
from src.models.scrape_job import JobStatus, ScrapeJob
from src.models.training_run import TrainingRun
from src.models.user import User
from src.services.base import BaseService

logger = structlog.get_logger(__name__)


class AgentService(BaseService[ScrapeJob]):
    """Factory service for the full scrape → process → train pipeline."""

    # ---- Data sources -------------------------------------------------------

    async def ensure_data_sources_seeded(self) -> None:
        """Idempotently seed DATA_SOURCE_DEFINITIONS into the DB."""
        result = await self.db.execute(select(DataSource.name))
        existing = {row[0] for row in result.fetchall()}
        for defn in DATA_SOURCE_DEFINITIONS:
            if defn["name"] not in existing:
                self.db.add(DataSource(**defn))
        await self.db.flush()

    async def list_data_sources(self) -> list[DataSource]:
        result = await self.db.execute(
            select(DataSource).where(DataSource.active == True).order_by(DataSource.name)
        )
        return list(result.scalars().all())

    # ---- Scrape -------------------------------------------------------------

    async def run_scrape(self, source_name: str, path: str, user: User) -> ScrapeJob:
        """
        Factory method — creates a ScrapeJob, runs the scraper, and persists
        the result. Returns the completed or failed ScrapeJob.
        """
        defn = get_definition(source_name)
        if defn is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown data source: {source_name!r}",
            )

        # Find the DataSource row
        result = await self.db.execute(
            select(DataSource).where(DataSource.name == source_name)
        )
        ds = result.scalar_one_or_none()
        if ds is None:
            raise HTTPException(status_code=404, detail="Data source not found in DB")

        job = ScrapeJob(
            data_source_id=ds.id,
            user_id=user.id,
            status=JobStatus.running,
        )
        self.db.add(job)
        await self.db.flush()
        await self.db.refresh(job)

        try:
            records = await scrape_data_source(source_name)
            storage_path = f"{path}/{source_name}-{job.id}.ndjson"
            job.status = JobStatus.complete
            job.record_count = len(records)
            job.storage_path = storage_path
            job.completed_at = datetime.now(timezone.utc)
        except Exception as exc:
            job.status = JobStatus.failed
            job.error = str(exc)
            job.completed_at = datetime.now(timezone.utc)
            await logger.aerror("agent.scrape_failed", error=str(exc), source=source_name)

        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def list_scrape_jobs(self, user: User) -> list[ScrapeJob]:
        result = await self.db.execute(
            select(ScrapeJob)
            .where(ScrapeJob.user_id == user.id)
            .order_by(ScrapeJob.created_at.desc())
        )
        return list(result.scalars().all())

    # ---- Process ------------------------------------------------------------

    async def run_process(
        self, scrape_job_id: int, feature_names: list[str], user: User
    ) -> FeatureSet:
        """Factory method — processes a scrape job into a feature CSV set."""
        result = await self.db.execute(
            select(ScrapeJob).where(
                ScrapeJob.id == scrape_job_id, ScrapeJob.user_id == user.id
            )
        )
        job = result.scalar_one_or_none()
        if job is None:
            raise HTTPException(status_code=404, detail="Scrape job not found")
        if job.status != JobStatus.complete:
            raise HTTPException(status_code=400, detail="Scrape job has not completed successfully")

        rows = process_records(feature_names)
        fs = FeatureSet(
            scrape_job_id=job.id,
            user_id=user.id,
            feature_names=",".join(feature_names),
            row_count=len(rows),
            storage_path=f"features/{scrape_job_id}-features.csv",
        )
        self.db.add(fs)
        await self.db.flush()
        await self.db.refresh(fs)
        return fs

    async def list_feature_sets(self, user: User) -> list[FeatureSet]:
        result = await self.db.execute(
            select(FeatureSet)
            .where(FeatureSet.user_id == user.id)
            .order_by(FeatureSet.created_at.desc())
        )
        return list(result.scalars().all())

    # ---- Train --------------------------------------------------------------

    async def run_train(self, feature_set_id: int, user: User) -> TrainingRun:
        """Factory method — trains a trend model on a feature set."""
        result = await self.db.execute(
            select(FeatureSet).where(
                FeatureSet.id == feature_set_id, FeatureSet.user_id == user.id
            )
        )
        fs = result.scalar_one_or_none()
        if fs is None:
            raise HTTPException(status_code=404, detail="Feature set not found")

        run = TrainingRun(
            feature_set_id=fs.id,
            user_id=user.id,
            status=JobStatus.running,
        )
        self.db.add(run)
        await self.db.flush()

        try:
            metrics = train_on_rows(fs.row_count, fs.feature_names.split(","))
            run.status = JobStatus.complete
            run.metrics = metrics
            run.completed_at = datetime.now(timezone.utc)
        except Exception as exc:
            run.status = JobStatus.failed
            run.completed_at = datetime.now(timezone.utc)
            await logger.aerror("agent.train_failed", error=str(exc))

        await self.db.flush()
        await self.db.refresh(run)
        return run

    async def list_training_runs(self, user: User) -> list[TrainingRun]:
        result = await self.db.execute(
            select(TrainingRun)
            .where(TrainingRun.user_id == user.id)
            .order_by(TrainingRun.created_at.desc())
        )
        return list(result.scalars().all())
