# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/schemas/profile.py
# Pydantic schemas for resume / portfolio profile endpoints.
# =============================================================================

import json
from datetime import datetime

from pydantic import Field, field_validator

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
    """Public-facing profile serialised to camelCase per the OpenAPI spec.

    Uses Pydantic validation_alias to read snake_case ORM attributes and
    output the camelCase field names the TypeScript frontend expects.
    """

    # Maps ORM attribute → OpenAPI / TypeScript field name via validation_alias
    userId: int = Field(validation_alias="user_id")
    name: str = Field(validation_alias="display_name", default="")
    headline: str | None = Field(None, validation_alias="title")
    summary: str | None = Field(None, validation_alias="bio")
    # The ORM stores skills as a JSON-encoded string; parsed to list below.
    skills: list[str] = Field(default_factory=list)
    githubUrl: str | None = Field(None, validation_alias="github_url")
    linkedinUrl: str | None = Field(None, validation_alias="linkedin_url")
    websiteUrl: str | None = None
    resumeObjectPath: str | None = None
    avatarObjectPath: str | None = None

    @field_validator("skills", mode="before")
    @classmethod
    def parse_skills(cls, v: object) -> list[str]:
        """Parse skills from JSON string or pass through a list as-is."""
        if v is None:
            return []
        if isinstance(v, list):
            return [str(s) for s in v]
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return [str(s) for s in parsed] if isinstance(parsed, list) else []
            except (json.JSONDecodeError, ValueError):
                return []
        return []

    @field_validator("name", mode="before")
    @classmethod
    def default_name(cls, v: object) -> str:
        """Fall back to empty string if display_name is None."""
        return str(v) if v is not None else ""
