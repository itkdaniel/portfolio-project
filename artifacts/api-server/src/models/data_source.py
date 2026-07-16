# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/models/data_source.py
# SQLAlchemy ORM model for trending-topic data sources.
# =============================================================================

import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class DataSourceCategory(str, enum.Enum):
    tech = "tech"
    news = "news"
    crypto = "crypto"
    stocks = "stocks"
    sports = "sports"


class DataSource(Base):
    """A named external data source the agent pipeline can scrape."""
    __tablename__ = "data_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    category: Mapped[DataSourceCategory] = mapped_column(
        Enum(DataSourceCategory, name="data_source_category"), nullable=False
    )
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    scrape_jobs = relationship("ScrapeJob", back_populates="data_source", lazy="noload")

    def __repr__(self) -> str:
        return f"<DataSource name={self.name!r} category={self.category}>"
