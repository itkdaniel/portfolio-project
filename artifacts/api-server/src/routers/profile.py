# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/routers/profile.py
# Resume/portfolio profile endpoints.
# =============================================================================

from fastapi import APIRouter, Depends

from src.database import DBSession
from src.models.user import User
from src.routers.users import get_current_user
from src.schemas.profile import ProfileIn, ProfileOut, PublicProfileOut
from src.services.profile_service import ProfileService

router = APIRouter()


@router.get("/me", response_model=ProfileOut, summary="Get my profile")
async def get_my_profile(
    db: DBSession = None,
    user: User = Depends(get_current_user),
) -> ProfileOut:
    svc = ProfileService(db)
    profile = await svc.get_or_create(user)
    return ProfileOut.model_validate(profile)


@router.put("/me", response_model=ProfileOut, summary="Update my profile")
async def update_my_profile(
    body: ProfileIn,
    db: DBSession = None,
    user: User = Depends(get_current_user),
) -> ProfileOut:
    svc = ProfileService(db)
    profile = await svc.update(user, body)
    return ProfileOut.model_validate(profile)


@router.get("/public", response_model=list[PublicProfileOut], summary="List public profiles")
async def list_public_profiles(
    db: DBSession = None,
    _user: User = Depends(get_current_user),
) -> list[PublicProfileOut]:
    svc = ProfileService(db)
    profiles = await svc.list_public()
    return [PublicProfileOut.model_validate(p) for p in profiles]


@router.get("/public/{user_id}", response_model=PublicProfileOut, summary="Get public profile")
async def get_public_profile(
    user_id: int,
    db: DBSession = None,
    _user: User = Depends(get_current_user),
) -> PublicProfileOut:
    svc = ProfileService(db)
    profile = await svc.get_public_by_user(user_id)
    return PublicProfileOut.model_validate(profile)
