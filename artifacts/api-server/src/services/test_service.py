# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/services/test_service.py
# Factory service for running pytest suites and recording results.
# =============================================================================

import subprocess
import time
from pathlib import Path

import structlog
from sqlalchemy import select

from src.database import AsyncSession
from src.models.test_run import TestRun, TestSuiteType
from src.models.user import User
from src.services.base import BaseService

logger = structlog.get_logger(__name__)

# Mapping suite → pytest node-id pattern
SUITE_PATTERNS: dict[TestSuiteType, str] = {
    TestSuiteType.unit: "tests/unit/",
    TestSuiteType.ddt: "tests/ddt/",
    TestSuiteType.bdd: "tests/bdd/",
    TestSuiteType.regression: "tests/regression/",
    TestSuiteType.e2e: "tests/e2e/",
}


class TestService(BaseService[TestRun]):
    """Factory service that runs pytest suites and persists TestRun records."""

    async def run_suite(self, suite_type: TestSuiteType, user: User | None) -> TestRun:
        """
        Factory method — execute a pytest suite, parse the JSON output,
        and persist the result as a TestRun.
        """
        pattern = SUITE_PATTERNS[suite_type]
        start = time.monotonic()

        result = subprocess.run(
            ["python", "-m", "pytest", pattern, "--tb=no", "-q", "--no-header"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent,  # artifacts/api-server/
        )

        duration_ms = int((time.monotonic() - start) * 1000)
        total, passed, failed, skipped = _parse_pytest_output(result.stdout + result.stderr)

        run = TestRun(
            user_id=user.id if user else None,
            suite_type=suite_type,
            total=total,
            passed=passed,
            failed=failed,
            skipped=skipped,
            duration_ms=duration_ms,
        )
        self.db.add(run)
        await self.db.flush()
        await self.db.refresh(run)

        await logger.ainfo(
            "test.suite_complete",
            suite=suite_type.value,
            total=total,
            passed=passed,
            failed=failed,
        )
        return run

    async def list_runs(self) -> list[TestRun]:
        result = await self.db.execute(
            select(TestRun).order_by(TestRun.ran_at.desc()).limit(100)
        )
        return list(result.scalars().all())


def _parse_pytest_output(output: str) -> tuple[int, int, int, int]:
    """
    Parse pytest summary line: "X passed, Y failed, Z skipped in …"
    Returns (total, passed, failed, skipped).
    """
    import re

    passed = failed = skipped = 0
    for match in re.finditer(r"(\d+)\s+(passed|failed|skipped|error)", output):
        count, label = int(match.group(1)), match.group(2)
        if label == "passed":
            passed = count
        elif label in ("failed", "error"):
            failed += count
        elif label == "skipped":
            skipped = count

    total = passed + failed + skipped
    return total, passed, failed, skipped
