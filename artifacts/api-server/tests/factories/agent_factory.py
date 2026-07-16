# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/factories/agent_factory.py
# Factory Boy factories for agent pipeline entities.
# =============================================================================

import factory
from factory import Faker

from src.models.data_source import DataSource, DataSourceCategory
from src.models.scrape_job import JobStatus, ScrapeJob
from src.models.feature_set import FeatureSet
from src.models.training_run import TrainingRun
from src.models.test_run import TestRun, TestSuiteType


class DataSourceFactory(factory.Factory):
    class Meta:
        model = DataSource

    id = factory.Sequence(lambda n: n + 1)
    name = factory.LazyAttribute(lambda o: f"source-{o.id}")
    category = DataSourceCategory.tech
    url = Faker("url")
    description = Faker("sentence")
    active = True


class ScrapeJobFactory(factory.Factory):
    class Meta:
        model = ScrapeJob

    id = factory.Sequence(lambda n: n + 1)
    data_source_id = 1
    user_id = 1
    status = JobStatus.complete
    record_count = 20
    storage_path = factory.LazyAttribute(lambda o: f"raw/source-{o.id}.ndjson")
    error = None


class FeatureSetFactory(factory.Factory):
    class Meta:
        model = FeatureSet

    id = factory.Sequence(lambda n: n + 1)
    scrape_job_id = 1
    user_id = 1
    feature_names = "title,score,category"
    row_count = 20
    storage_path = factory.LazyAttribute(lambda o: f"features/{o.id}-features.csv")


class TrainingRunFactory(factory.Factory):
    class Meta:
        model = TrainingRun

    id = factory.Sequence(lambda n: n + 1)
    feature_set_id = 1
    user_id = 1
    status = JobStatus.complete
    metrics = {
        "accuracy": 0.92,
        "loss": 0.08,
        "epochs": 20,
        "samples": 20,
        "feature_importances": {"title": 0.5, "score": 0.3, "category": 0.2},
    }


class TestRunFactory(factory.Factory):
    class Meta:
        model = TestRun

    id = factory.Sequence(lambda n: n + 1)
    user_id = 1
    suite_type = TestSuiteType.unit
    total = 10
    passed = 9
    failed = 1
    skipped = 0
    duration_ms = 500
