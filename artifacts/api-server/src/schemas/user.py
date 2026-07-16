# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/schemas/user.py
# Pydantic request/response schemas for users and RBAC.
# =============================================================================

from datetime import datetime

from pydantic import EmailStr

from src.models.user import UserRole
from src.schemas.common import SynaptiqModel


class UserOut(SynaptiqModel):
    """Public user representation returned from API endpoints."""
    id: int
    clerk_user_id: str
    email: str
    first_name: str | None = None
    last_name: str | None = None
    image_url: str | None = None
    role: UserRole
    created_at: datetime


class UserRoleUpdateIn(SynaptiqModel):
    """Body for PATCH /users/:id/role (admin only)."""
    role: UserRole


class UserListOut(SynaptiqModel):
    """Paginated user list response."""
    users: list[UserOut]
    total: int
