# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/models/__init__.py
# SQLAlchemy ORM model registry. Import all models here so Alembic's
# autogenerate command can discover every table.
# =============================================================================

from src.models.user import User, UserRole
from src.models.profile import Profile
from src.models.data_source import DataSource, DataSourceCategory
from src.models.scrape_job import ScrapeJob, JobStatus
from src.models.feature_set import FeatureSet
from src.models.training_run import TrainingRun
from src.models.test_run import TestRun, TestSuiteType

__all__ = [
    "User", "UserRole",
    "Profile",
    "DataSource", "DataSourceCategory",
    "ScrapeJob", "JobStatus",
    "FeatureSet",
    "TrainingRun",
    "TestRun", "TestSuiteType",
]
