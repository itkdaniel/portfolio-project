# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/schemas/agent.py
# Pydantic schemas for the AI agent pipeline endpoints
# (scrape / process / train).
# =============================================================================

from datetime import datetime

from pydantic import Field

from src.models.data_source import DataSourceCategory
from src.models.scrape_job import JobStatus
from src.schemas.common import SynaptiqModel


# ---- Data sources -----------------------------------------------------------

class DataSourceOut(SynaptiqModel):
    id: int
    name: str
    category: DataSourceCategory
    url: str
    description: str | None = None
    active: bool


# ---- Scrape -----------------------------------------------------------------

class ScrapeIn(SynaptiqModel):
    """Body for POST /agent/scrape."""
    source: str = Field(..., description="Data source name (e.g. 'hacker-news')")
    path: str = Field(default="raw", description="Storage path prefix")


class ScrapeJobOut(SynaptiqModel):
    id: int
    data_source_id: int
    user_id: int
    status: JobStatus
    record_count: int | None = None
    storage_path: str | None = None
    error: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


# ---- Process ----------------------------------------------------------------

class ProcessIn(SynaptiqModel):
    """Body for POST /agent/process."""
    scrape_job_id: int
    feature_names: list[str] = Field(
        default=["title", "score", "category"],
        description="Feature column names to extract",
    )


class FeatureSetOut(SynaptiqModel):
    id: int
    scrape_job_id: int
    user_id: int
    feature_names: str
    row_count: int
    storage_path: str | None = None
    created_at: datetime


# ---- Train ------------------------------------------------------------------

class TrainIn(SynaptiqModel):
    """Body for POST /agent/train."""
    feature_set_id: int


class TrainingRunMetricsOut(SynaptiqModel):
    accuracy: float | None = None
    loss: float | None = None
    epochs: int | None = None
    samples: int | None = None
    feature_importances: dict[str, float] | None = None


class TrainingRunOut(SynaptiqModel):
    id: int
    feature_set_id: int
    user_id: int
    status: JobStatus
    metrics: dict | None = None
    created_at: datetime
    completed_at: datetime | None = None
