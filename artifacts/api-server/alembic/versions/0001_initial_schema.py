# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# alembic/versions/0001_initial_schema.py
# Initial database schema — mirrors the Drizzle ORM schema from the
# TypeScript backend (lib/db/src/schema/).
# =============================================================================

"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2026-07-16 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---- Enums --------------------------------------------------------------
    op.execute("CREATE TYPE user_role AS ENUM ('admin', 'user')")
    op.execute("CREATE TYPE data_source_category AS ENUM ('tech', 'news', 'crypto', 'stocks', 'sports')")
    op.execute("CREATE TYPE job_status AS ENUM ('pending', 'running', 'complete', 'failed')")
    op.execute("CREATE TYPE test_suite_type AS ENUM ('unit', 'ddt', 'bdd', 'regression', 'e2e')")

    # ---- users --------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("clerk_user_id", sa.String(), nullable=False, unique=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("first_name", sa.String(), nullable=True),
        sa.Column("last_name", sa.String(), nullable=True),
        sa.Column("image_url", sa.String(), nullable=True),
        sa.Column("role", sa.Enum("admin", "user", name="user_role"), nullable=False, server_default="user"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_clerk_user_id", "users", ["clerk_user_id"], unique=True)

    # ---- profiles -----------------------------------------------------------
    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("display_name", sa.String(255), nullable=True),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.String(1024), nullable=True),
        sa.Column("github_url", sa.String(1024), nullable=True),
        sa.Column("linkedin_url", sa.String(1024), nullable=True),
        sa.Column("skills", sa.Text(), nullable=True),
        sa.Column("projects", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ---- data_sources -------------------------------------------------------
    op.create_table(
        "data_sources",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False, unique=True),
        sa.Column("category", sa.Enum("tech", "news", "crypto", "stocks", "sports", name="data_source_category"), nullable=False),
        sa.Column("url", sa.String(1024), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ---- scrape_jobs --------------------------------------------------------
    op.create_table(
        "scrape_jobs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("data_source_id", sa.Integer(), sa.ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.Enum("pending", "running", "complete", "failed", name="job_status"), nullable=False, server_default="pending"),
        sa.Column("record_count", sa.Integer(), nullable=True),
        sa.Column("storage_path", sa.String(1024), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ---- feature_sets -------------------------------------------------------
    op.create_table(
        "feature_sets",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("scrape_job_id", sa.Integer(), sa.ForeignKey("scrape_jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("feature_names", sa.String(1024), nullable=False),
        sa.Column("row_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("storage_path", sa.String(1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ---- training_runs ------------------------------------------------------
    op.create_table(
        "training_runs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("feature_set_id", sa.Integer(), sa.ForeignKey("feature_sets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.Enum("pending", "running", "complete", "failed", name="job_status"), nullable=False, server_default="pending"),
        sa.Column("metrics", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ---- test_runs ----------------------------------------------------------
    op.create_table(
        "test_runs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("suite_type", sa.Enum("unit", "ddt", "bdd", "regression", "e2e", name="test_suite_type"), nullable=False),
        sa.Column("total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("passed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("skipped", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duration_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ran_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("test_runs")
    op.drop_table("training_runs")
    op.drop_table("feature_sets")
    op.drop_table("scrape_jobs")
    op.drop_table("data_sources")
    op.drop_table("profiles")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS test_suite_type")
    op.execute("DROP TYPE IF EXISTS job_status")
    op.execute("DROP TYPE IF EXISTS data_source_category")
    op.execute("DROP TYPE IF EXISTS user_role")
