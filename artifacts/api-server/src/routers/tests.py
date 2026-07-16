# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/routers/tests.py
# Test-suite runner and history endpoints.
# =============================================================================

from fastapi import APIRouter, Depends

from src.database import DBSession
from src.models.user import User
from src.routers.users import get_current_user, require_admin
from src.schemas.tests import TestRunIn, TestRunOut
from src.services.test_service import TestService

router = APIRouter()


@router.post("/run", response_model=TestRunOut, summary="Run a test suite (admin)")
async def run_test_suite(
    body: TestRunIn,
    db: DBSession = None,
    user: User = Depends(require_admin),
) -> TestRunOut:
    svc = TestService(db)
    run = await svc.run_suite(body.suite_type, user)
    return TestRunOut.model_validate(run)


@router.get("/", response_model=list[TestRunOut], summary="List test run history")
async def list_test_runs(
    db: DBSession = None,
    _user: User = Depends(get_current_user),
) -> list[TestRunOut]:
    svc = TestService(db)
    runs = await svc.list_runs()
    return [TestRunOut.model_validate(r) for r in runs]
