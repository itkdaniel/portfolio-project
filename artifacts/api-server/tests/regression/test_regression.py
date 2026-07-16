# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/regression/test_regression.py
# Regression tests — guard against specific historical bugs being re-introduced.
# Each test is annotated with the bug it prevents.
# =============================================================================

import pytest

from src.agent.csv_utils import parse_csv, parse_csv_line, dict_to_csv
from src.agent.process import process_records
from src.agent.train import train_on_rows
from src.models.user import User, UserRole
from tests.factories.user_factory import UserFactory


# ---------------------------------------------------------------------------
# REGRESSION: CSV quoted-field corruption
#
# Bug: Using str.split(",") on raw CSV lines corrupts fields that contain
# commas inside quotes, e.g. '"London, UK"' would be split into two fields.
# Fix: Always use csv.reader / csv.DictReader (src/agent/csv_utils.py).
# ---------------------------------------------------------------------------

class TestCsvRegressions:
    def test_quoted_comma_not_corrupted(self):
        """Regression: quoted commas must not split the field."""
        line = '"New York, NY",100'
        fields = parse_csv_line(line)
        assert len(fields) == 2, f"Expected 2 fields, got {len(fields)}: {fields}"
        assert fields[0] == "New York, NY"

    def test_multiline_csv_not_corrupted(self):
        """Regression: multi-row CSV must parse all rows correctly."""
        text = "city,score\n\"London, UK\",90\n\"Paris, FR\",85"
        rows = parse_csv(text)
        assert len(rows) == 2
        assert rows[0]["city"] == "London, UK"
        assert rows[1]["city"] == "Paris, FR"

    def test_empty_fields_preserved(self):
        """Regression: empty CSV fields must not be converted to None."""
        line = "a,,c"
        fields = parse_csv_line(line)
        assert fields == ["a", "", "c"]

    def test_round_trip_preserves_data(self):
        """Regression: serialise then parse must be identity for all field types."""
        original = [{"title": "Has, Comma", "score": "99"}]
        csv_str = dict_to_csv(original, ["title", "score"])
        recovered = parse_csv(csv_str)
        assert recovered[0]["title"] == "Has, Comma"
        assert recovered[0]["score"] == "99"


# ---------------------------------------------------------------------------
# REGRESSION: First-user admin promotion
#
# Bug: If the user count check fired after insertion (not before), the first
# user would be given the 'user' role instead of 'admin'.
# Fix: Count users BEFORE inserting the new row.
# (Guarded in services/user_service.py::resolve_local_user)
# ---------------------------------------------------------------------------

class TestFirstUserAdminRegression:
    def test_admin_factory_has_admin_role(self):
        """Regression guard: AdminUserFactory must produce an admin role user."""
        from tests.factories.user_factory import AdminUserFactory
        user = AdminUserFactory()
        assert user.role == UserRole.admin

    def test_user_factory_non_admin_by_default(self):
        """Regression guard: normal users must not default to admin."""
        user = UserFactory()
        assert user.role == UserRole.user


# ---------------------------------------------------------------------------
# REGRESSION: train_on_rows with empty feature set
#
# Bug: Division by zero when training on 0 rows because code did:
#   accuracy = 0.60 + (row_count / 1000) * 0.35
# and then tried to compute feature importances by dividing by total weight
# on an empty list, causing ZeroDivisionError.
# Fix: Guard on row_count == 0 and return early with error key.
# ---------------------------------------------------------------------------

class TestTrainRegressions:
    def test_train_zero_rows_returns_error_not_exception(self):
        """Regression: training on 0 rows must not raise; returns error dict."""
        result = train_on_rows(0, ["title"])
        assert "error" in result

    def test_train_no_features_no_crash(self):
        """Regression: training with empty feature names must not crash."""
        result = train_on_rows(10, [])
        assert "accuracy" in result
        assert result.get("feature_importances") == {}


# ---------------------------------------------------------------------------
# REGRESSION: Process records — None records vs empty list
#
# Bug: process_records(features, None) raised AttributeError when it tried
# `for rec in records` with records=None.
# Fix: Treat None and [] identically as "no records → synthetic fallback".
# ---------------------------------------------------------------------------

class TestProcessRegressions:
    def test_process_none_records_no_exception(self):
        """Regression: None records must not raise."""
        rows = process_records(["title"], None)
        assert len(rows) > 0

    def test_process_empty_records_no_exception(self):
        rows = process_records(["title"], [])
        assert len(rows) > 0

    def test_process_unknown_feature_returns_none(self):
        """Regression: requesting a feature not in the record returns None, not KeyError."""
        records = [{"title": "Test"}]
        rows = process_records(["title", "non_existent_field"], records)
        assert rows[0]["non_existent_field"] is None
