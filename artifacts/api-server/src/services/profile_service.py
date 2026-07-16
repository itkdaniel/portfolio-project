# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/services/profile_service.py
# Factory service for resume/portfolio profile management.
# =============================================================================

from fastapi import HTTPException, status
from sqlalchemy import select

from src.database import AsyncSession
from src.models.profile import Profile
from src.models.user import User
from src.schemas.profile import ProfileIn
from src.services.base import BaseService


class ProfileService(BaseService[Profile]):
    """Factory service for profile CRUD and public directory."""

    async def get_or_create(self, user: User) -> Profile:
        """Get existing profile or create an empty one (factory method)."""
        result = await self.db.execute(
            select(Profile).where(Profile.user_id == user.id)
        )
        profile = result.scalar_one_or_none()
        if profile is None:
            profile = Profile(user_id=user.id)
            self.db.add(profile)
            await self.db.flush()
            await self.db.refresh(profile)
        return profile

    async def update(self, user: User, data: ProfileIn) -> Profile:
        """Update the user's profile from a ProfileIn payload."""
        profile = await self.get_or_create(user)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)
        await self.db.flush()
        await self.db.refresh(profile)
        return profile

    async def list_public(self) -> list[Profile]:
        """Return all profiles marked is_public=True."""
        result = await self.db.execute(
            select(Profile).where(Profile.is_public == True).order_by(Profile.updated_at.desc())
        )
        return list(result.scalars().all())

    async def get_public_by_user(self, user_id: int) -> Profile:
        result = await self.db.execute(
            select(Profile).where(Profile.user_id == user_id, Profile.is_public == True)
        )
        profile = result.scalar_one_or_none()
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return profile
