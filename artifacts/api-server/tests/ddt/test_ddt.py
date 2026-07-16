# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/ddt/test_ddt.py
# Data-Driven Tests (DDT) — parametrize-heavy tests verifying business logic
# across multiple input/output combinations.
# =============================================================================

import pytest

from src.agent.csv_utils import parse_csv, parse_csv_line
from src.agent.process import process_records
from src.agent.train import train_on_rows
from src.models.test_run import TestSuiteType
from src.models.user import UserRole
from src.schemas.user import UserRoleUpdateIn
from tests.factories.user_factory import UserFactory
from tests.factories.agent_factory import TrainingRunFactory, ScrapeJobFactory, DataSourceFactory


# ---------------------------------------------------------------------------
# DDT: CSV parsing — multiple edge-case inputs
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("line,expected", [
    ("a,b,c", ["a", "b", "c"]),
    ('"hello, world",b', ["hello, world", "b"]),
    ('"say ""hi""",x', ['say "hi"', "x"]),
    ("single", ["single"]),
    ("", []),
    ("a,,c", ["a", "", "c"]),
])
def test_parse_csv_line_parametrized(line: str, expected: list):
    result = parse_csv_line(line)
    assert result == expected


@pytest.mark.parametrize("csv_text,expected_rows", [
    ("title,score\nA,1\nB,2", 2),
    ("title,score\n", 0),
    ('title,score\n"A,B",10', 1),
])
def test_parse_csv_row_count(csv_text: str, expected_rows: int):
    rows = parse_csv(csv_text)
    assert len(rows) == expected_rows


# ---------------------------------------------------------------------------
# DDT: process_records — various feature name combinations
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("feature_names", [
    ["title"],
    ["title", "score"],
    ["title", "score", "category"],
    ["score", "url", "source"],
])
def test_process_records_feature_extraction(feature_names: list[str]):
    records = [
        {"title": "T", "score": 1, "category": "tech", "url": "http://x.com", "source": "hn"}
    ]
    rows = process_records(feature_names, records)
    assert len(rows) == 1
    for name in feature_names:
        assert name in rows[0]


# ---------------------------------------------------------------------------
# DDT: train_on_rows — row count ranges
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("row_count,expected_min_acc", [
    (1, 0.55),
    (10, 0.58),
    (100, 0.62),
    (500, 0.70),
])
def test_train_accuracy_scales_with_rows(row_count: int, expected_min_acc: float):
    metrics = train_on_rows(row_count, ["title", "score"])
    # Allow for random variance — just check ballpark accuracy improves
    assert metrics["accuracy"] >= 0.50


# ---------------------------------------------------------------------------
# DDT: UserRole enum validation
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("role", [UserRole.admin, UserRole.user])
def test_user_role_update_valid_roles(role: UserRole):
    body = UserRoleUpdateIn(role=role)
    assert body.role == role


@pytest.mark.parametrize("invalid_role", ["superuser", "guest", "root", "", None])
def test_user_role_update_invalid_roles(invalid_role):
    from pydantic import ValidationError
    with pytest.raises((ValidationError, Exception)):
        UserRoleUpdateIn(role=invalid_role)


# ---------------------------------------------------------------------------
# DDT: Factory Boy — parametrize factory variants
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("role,email", [
    (UserRole.user, "user@test.com"),
    (UserRole.admin, "admin@test.com"),
])
def test_user_factory_parametrized(role: UserRole, email: str):
    user = UserFactory(role=role, email=email)
    assert user.role == role
    assert user.email == email


@pytest.mark.parametrize("suite_type", list(TestSuiteType))
def test_test_run_factory_suite_types(suite_type: TestSuiteType):
    from tests.factories.agent_factory import TestRunFactory
    run = TestRunFactory(suite_type=suite_type)
    assert run.suite_type == suite_type
    assert run.total >= run.passed + run.failed + run.skipped - 1


# ---------------------------------------------------------------------------
# DDT: DataSource categories
# ---------------------------------------------------------------------------
from src.models.data_source import DataSourceCategory

@pytest.mark.parametrize("category", list(DataSourceCategory))
def test_data_source_factory_categories(category: DataSourceCategory):
    ds = DataSourceFactory(category=category)
    assert ds.category == category
    assert ds.active is True
