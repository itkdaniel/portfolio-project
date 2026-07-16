# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/services/user_service.py
# Factory service for user management and JIT role resolution.
# =============================================================================

import structlog
from fastapi import HTTPException, status
from sqlalchemy import func, select, update

from src.database import AsyncSession
from src.middleware.auth import ClerkUser
from src.models.user import User, UserRole
from src.services.base import BaseService

logger = structlog.get_logger(__name__)


class UserService(BaseService[User]):
    """
    Factory service for user operations.

    Key factory method: `resolve_local_user` — JIT creates or fetches a User
    row on every authenticated request, promoting the very first user to admin.
    """

    async def resolve_local_user(self, clerk_user: ClerkUser) -> User:
        """
        Idempotently resolve a Clerk JWT to a local User row.

        - If the user already exists → return it.
        - If it doesn't exist → create it.
        - If it's the first user ever inserted → grant `admin` role.
        """
        result = await self.db.execute(
            select(User).where(User.clerk_user_id == clerk_user.clerk_user_id)
        )
        user = result.scalar_one_or_none()

        if user is not None:
            return user

        # Count existing users to decide role (first user = admin)
        count_result = await self.db.execute(select(func.count()).select_from(User))
        total = count_result.scalar_one()
        role = UserRole.admin if total == 0 else UserRole.user

        user = User(
            clerk_user_id=clerk_user.clerk_user_id,
            email=clerk_user.email,
            first_name=clerk_user.first_name,
            last_name=clerk_user.last_name,
            image_url=clerk_user.image_url,
            role=role,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)

        await logger.ainfo(
            "user.created",
            user_id=user.id,
            role=role.value,
            email=clerk_user.email,
        )
        return user

    async def list_users(self) -> list[User]:
        """Return all users ordered by creation date."""
        result = await self.db.execute(select(User).order_by(User.created_at))
        return list(result.scalars().all())

    async def get_by_id(self, user_id: int) -> User:
        """Fetch a user by primary key; raises 404 if not found."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    async def update_role(self, user_id: int, role: UserRole) -> User:
        """Update a user's RBAC role (admin only)."""
        await self.db.execute(
            update(User).where(User.id == user_id).values(role=role)
        )
        return await self.get_by_id(user_id)
