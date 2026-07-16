# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/models/feature_set.py
# SQLAlchemy ORM model for processed feature CSV sets.
# =============================================================================

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class FeatureSet(Base):
    """A processed CSV feature set derived from a scrape job."""
    __tablename__ = "feature_sets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scrape_job_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("scrape_jobs.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    feature_names: Mapped[str] = mapped_column(String(1024), nullable=False)
    row_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    storage_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    scrape_job = relationship("ScrapeJob", back_populates="feature_sets")
    user = relationship("User", back_populates="feature_sets")
    training_runs = relationship("TrainingRun", back_populates="feature_set", lazy="noload")
