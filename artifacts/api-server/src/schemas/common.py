# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/schemas/common.py
# Shared Pydantic response envelopes and utility models.
# =============================================================================

from pydantic import BaseModel, ConfigDict


class ErrorEnvelope(BaseModel):
    """Standard error response body."""
    error: str


class OkEnvelope(BaseModel):
    """Standard success response with optional message."""
    ok: bool = True
    message: str | None = None


class SynaptiqModel(BaseModel):
    """Base model with shared configuration for all Synaptiq schemas."""
    model_config = ConfigDict(
        from_attributes=True,   # Enable ORM mode (SQLAlchemy → Pydantic)
        populate_by_name=True,  # Accept both alias and field name
        use_enum_values=True,   # Serialise enums as their .value
    )
