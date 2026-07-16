# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/routers/users.py
# User management routes: list, me, role update (admin-gated).
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, status

from src.database import DBSession
from src.middleware.auth import ClerkUser, get_current_clerk_user
from src.models.user import User, UserRole
from src.schemas.user import UserListOut, UserOut, UserRoleUpdateIn
from src.services.user_service import UserService

router = APIRouter()


async def get_current_user(
    clerk_user: ClerkUser = Depends(get_current_clerk_user),
    db: DBSession = None,
) -> User:
    """Resolve Clerk JWT to a local User, creating JIT if needed."""
    svc = UserService(db)
    return await svc.resolve_local_user(clerk_user)


async def require_user(user: User = Depends(get_current_user)) -> User:
    """
    Raise 403 if the resolved user is in the `guest` role.

    This enforces the role hierarchy: user and admin pass through,
    guest is blocked. Use for Pipeline, Tests, and any write endpoints.
    """
    if user.role.level < UserRole.user.level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature requires a full account. "
                   "Ask an admin to upgrade your role from guest to user.",
        )
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Raise 403 unless the resolved user has the admin role."""
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


@router.get("/me", response_model=UserOut, summary="Get current user")
async def get_me(user: User = Depends(get_current_user)) -> User:
    return user


@router.get("/", response_model=UserListOut, summary="List all users (admin)")
async def list_users(
    db: DBSession = None,
    _admin: User = Depends(require_admin),
) -> UserListOut:
    svc = UserService(db)
    users = await svc.list_users()
    return UserListOut(users=[UserOut.model_validate(u) for u in users], total=len(users))


@router.patch("/{user_id}/role", response_model=UserOut, summary="Update user role (admin)")
async def update_role(
    user_id: int,
    body: UserRoleUpdateIn,
    db: DBSession = None,
    _admin: User = Depends(require_admin),
) -> UserOut:
    svc = UserService(db)
    user = await svc.update_role(user_id, body.role)
    return UserOut.model_validate(user)
