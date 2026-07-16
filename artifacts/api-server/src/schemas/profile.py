# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/schemas/profile.py
# Pydantic schemas for resume / portfolio profile endpoints.
# =============================================================================

from datetime import datetime

from pydantic import HttpUrl

from src.schemas.common import SynaptiqModel


class ProfileOut(SynaptiqModel):
    """Full profile including private fields (owner or admin view)."""
    id: int
    user_id: int
    display_name: str | None = None
    title: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    skills: str | None = None
    projects: str | None = None
    is_public: bool
    updated_at: datetime


class ProfileIn(SynaptiqModel):
    """Request body for PUT /profile/me."""
    display_name: str | None = None
    title: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    skills: str | None = None
    projects: str | None = None
    is_public: bool = True


class PublicProfileOut(SynaptiqModel):
    """Public-facing profile (stripped of private fields)."""
    user_id: int
    display_name: str | None = None
    title: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    skills: str | None = None
    projects: str | None = None
