# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/schemas/tests.py
# Pydantic schemas for the test-suite runner endpoints.
# =============================================================================

from datetime import datetime

from src.models.test_run import TestSuiteType
from src.schemas.common import SynaptiqModel


class TestRunIn(SynaptiqModel):
    """Body for POST /tests/run."""
    suite_type: TestSuiteType


class TestRunOut(SynaptiqModel):
    id: int
    suite_type: TestSuiteType
    total: int
    passed: int
    failed: int
    skipped: int
    duration_ms: int
    ran_at: datetime

    @property
    def pass_rate(self) -> float:
        """Percentage of tests that passed (0–100)."""
        return (self.passed / self.total * 100) if self.total else 0.0


class TestSuiteSummaryOut(SynaptiqModel):
    """Aggregated summary for the test dashboard progress bars."""
    suite_type: TestSuiteType
    latest_run: TestRunOut | None = None
    total_runs: int
