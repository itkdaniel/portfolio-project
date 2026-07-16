# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/routers/storage.py
# Object storage pre-signed URL endpoint.
# =============================================================================

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.config import get_settings
from src.models.user import User
from src.routers.users import get_current_user

router = APIRouter()


class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str = "application/octet-stream"


class UploadUrlResponse(BaseModel):
    upload_url: str
    object_path: str


@router.post("/upload-url", response_model=UploadUrlResponse, summary="Get pre-signed upload URL")
async def get_upload_url(
    body: UploadUrlRequest,
    _user: User = Depends(get_current_user),
) -> UploadUrlResponse:
    """
    Returns a pre-signed URL for client-side direct object uploads.
    In production this would call the Replit Object Storage API.
    In development it returns a local placeholder.
    """
    settings = get_settings()
    object_path = f"{settings.private_object_dir}/{body.filename}"
    # Placeholder — replace with real Replit Object Storage signed URL in prod
    upload_url = f"/api/storage/local/{object_path}"
    return UploadUrlResponse(upload_url=upload_url, object_path=object_path)
