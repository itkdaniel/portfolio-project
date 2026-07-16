# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/services/base.py
# Abstract base service using the Factory / Repository pattern.
# All domain services extend BaseService to get a typed DB session.
# =============================================================================

from typing import Generic, TypeVar

from sqlalchemy.ext.asyncio import AsyncSession

from src.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseService(Generic[ModelT]):
    """
    Generic service (factory/repository) base class.

    Pattern:
      - Each service wraps a DB session injected at construction time.
      - Factory classmethods (create_*, build_*) encapsulate record creation.
      - Fetch methods return domain objects; callers never touch the session.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def flush(self) -> None:
        """Flush pending changes to the DB without committing."""
        await self.db.flush()

    async def refresh(self, instance: ModelT) -> None:
        """Refresh an ORM instance from the database."""
        await self.db.refresh(instance)
