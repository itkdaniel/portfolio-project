# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/models/training_run.py
# SQLAlchemy ORM model for AI training run records.
# =============================================================================

from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base
from src.models.scrape_job import JobStatus


class TrainingRun(Base):
    """Stores the result of training a trend model on a feature set."""
    __tablename__ = "training_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    feature_set_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("feature_sets.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, name="job_status"), nullable=False, default=JobStatus.pending
    )
    # JSON blob: { accuracy, loss, epochs, feature_importances, … }
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    feature_set = relationship("FeatureSet", back_populates="training_runs")
    user = relationship("User", back_populates="training_runs")
