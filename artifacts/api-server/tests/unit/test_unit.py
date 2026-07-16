# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# tests/unit/test_unit.py
# Unit tests — pure function tests with no I/O or DB.
# Tests: config, CSV utils, agent processing, train metrics, schema validation.
# =============================================================================

import pytest
from pydantic import ValidationError

from src.agent.csv_utils import dict_to_csv, parse_csv, parse_csv_line
from src.agent.process import process_records
from src.agent.train import train_on_rows
from src.config import Settings
from src.models.user import UserRole
from src.schemas.common import OkEnvelope, ErrorEnvelope
from src.schemas.user import UserRoleUpdateIn
from tests.factories.user_factory import UserFactory, AdminUserFactory


# ---------------------------------------------------------------------------
# CSV Utils
# ---------------------------------------------------------------------------

class TestCsvUtils:
    def test_parse_simple_csv(self):
        text = "title,score\nHello World,42\nFoo Bar,99"
        rows = parse_csv(text)
        assert len(rows) == 2
        assert rows[0]["title"] == "Hello World"
        assert rows[0]["score"] == "42"

    def test_parse_csv_quoted_commas(self):
        """CSV parsing must handle quoted fields containing commas."""
        text = 'title,score\n"Hello, World",42'
        rows = parse_csv(text)
        assert len(rows) == 1
        assert rows[0]["title"] == "Hello, World"

    def test_parse_csv_line_quoted(self):
        line = '"Hello, World",42,"foo,bar"'
        fields = parse_csv_line(line)
        assert fields == ["Hello, World", "42", "foo,bar"]

    def test_dict_to_csv_roundtrip(self):
        rows = [{"title": "A", "score": "10"}, {"title": "B,C", "score": "20"}]
        csv_text = dict_to_csv(rows, ["title", "score"])
        parsed = parse_csv(csv_text)
        assert parsed[0]["title"] == "A"
        assert parsed[1]["title"] == "B,C"  # quoted field preserved

    def test_parse_empty_csv(self):
        assert parse_csv("") == []

    def test_dict_to_csv_empty(self):
        assert dict_to_csv([]) == ""


# ---------------------------------------------------------------------------
# Agent — process records
# ---------------------------------------------------------------------------

class TestProcessRecords:
    def test_process_extracts_features(self):
        records = [{"title": "Item A", "score": 10, "category": "tech", "extra": "ignore"}]
        rows = process_records(["title", "score"], records)
        assert len(rows) == 1
        assert rows[0] == {"title": "Item A", "score": 10}

    def test_process_missing_field_returns_none(self):
        records = [{"title": "Item A"}]
        rows = process_records(["title", "score"], records)
        assert rows[0]["score"] is None

    def test_process_empty_records_returns_synthetic(self):
        """No records → synthetic fallback for demo purposes."""
        rows = process_records(["title", "score"], [])
        assert len(rows) == 10
        assert "title" in rows[0]

    def test_process_none_records_returns_synthetic(self):
        rows = process_records(["title"])
        assert len(rows) == 10


# ---------------------------------------------------------------------------
# Agent — train
# ---------------------------------------------------------------------------

class TestTrainOnRows:
    def test_train_returns_metrics(self):
        metrics = train_on_rows(100, ["title", "score", "category"])
        assert "accuracy" in metrics
        assert "loss" in metrics
        assert "epochs" in metrics
        assert "samples" in metrics
        assert "feature_importances" in metrics

    def test_train_accuracy_in_range(self):
        for _ in range(5):
            metrics = train_on_rows(50, ["title", "score"])
            assert 0.0 <= metrics["accuracy"] <= 1.0
            assert 0.0 <= metrics["loss"] <= 1.0

    def test_train_feature_importances_sum_to_one(self):
        metrics = train_on_rows(100, ["a", "b", "c"])
        importances = metrics["feature_importances"]
        assert abs(sum(importances.values()) - 1.0) < 0.01

    def test_train_empty_feature_set(self):
        metrics = train_on_rows(0, ["title"])
        assert "error" in metrics

    def test_train_epoch_scaling(self):
        small = train_on_rows(10, ["title"])["epochs"]
        large = train_on_rows(500, ["title"])["epochs"]
        assert large >= small


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class TestSchemas:
    def test_ok_envelope_defaults(self):
        env = OkEnvelope()
        assert env.ok is True
        assert env.message is None

    def test_error_envelope(self):
        env = ErrorEnvelope(error="Something went wrong")
        assert env.error == "Something went wrong"

    def test_role_update_valid(self):
        body = UserRoleUpdateIn(role=UserRole.admin)
        assert body.role == UserRole.admin

    def test_role_update_invalid(self):
        with pytest.raises(ValidationError):
            UserRoleUpdateIn(role="superuser")


# ---------------------------------------------------------------------------
# Factories
# ---------------------------------------------------------------------------

class TestFactories:
    def test_user_factory_defaults(self):
        user = UserFactory()
        assert user.id >= 1
        assert "@" in user.email
        assert user.role == UserRole.user

    def test_admin_factory(self):
        admin = AdminUserFactory()
        assert admin.role == UserRole.admin

    def test_user_factory_batch(self):
        users = UserFactory.build_batch(5)
        assert len(users) == 5
        ids = {u.id for u in users}
        assert len(ids) == 5  # unique IDs

    def test_user_factory_override(self):
        user = UserFactory(email="custom@test.com", role=UserRole.admin)
        assert user.email == "custom@test.com"
        assert user.role == UserRole.admin
