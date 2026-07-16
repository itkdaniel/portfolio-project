# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/models/user.py
# SQLAlchemy ORM model for the `users` table.
# Mirrors the Drizzle schema in lib/db/src/schema/users.ts.
# =============================================================================

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class UserRole(str, enum.Enum):
    """
    RBAC role enumeration.

    Hierarchy (lowest → highest): guest < user < admin

    - guest : default for newly registered users; read-only access to
              dashboard, graph, team, and profile — no pipeline or tests.
    - user  : standard member; full access except admin panel.
    - admin : first-provisioned user; unrestricted access.
    """
    guest = "guest"
    user = "user"
    admin = "admin"

    # Numeric weights — used for comparison in require_* dependencies.
    @property
    def level(self) -> int:
        return {"guest": 0, "user": 1, "admin": 2}[self.value]


class User(Base):
    """
    Platform user — created JIT on first authenticated request.
    The first user ever inserted receives the `admin` role automatically
    (see services/user_service.py::resolve_local_user).
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    clerk_user_id: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str | None] = mapped_column(String, nullable=True)
    last_name: Mapped[str | None] = mapped_column(String, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.guest
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, lazy="selectin")
    scrape_jobs = relationship("ScrapeJob", back_populates="user", lazy="noload")
    feature_sets = relationship("FeatureSet", back_populates="user", lazy="noload")
    training_runs = relationship("TrainingRun", back_populates="user", lazy="noload")
    test_runs = relationship("TestRun", back_populates="user", lazy="noload")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role}>"
