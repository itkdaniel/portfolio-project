# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/middleware/auth.py
# Clerk JWT verification middleware and FastAPI dependency.
# Fetches and caches Clerk's JWKS; verifies RS256 tokens on every request.
# =============================================================================

import time
from functools import lru_cache
from typing import Any

import jwt
import httpx
import structlog
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.config import get_settings

logger = structlog.get_logger(__name__)

# JWT bearer extraction
_bearer = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# JWKS fetching + caching (refreshed every 5 minutes)
# ---------------------------------------------------------------------------
_jwks_cache: dict[str, Any] = {}
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 300  # seconds


async def _get_jwks() -> dict[str, Any]:
    """Fetch Clerk JWKS; cache the result for _JWKS_TTL seconds."""
    global _jwks_cache, _jwks_fetched_at

    if _jwks_cache and (time.monotonic() - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache

    settings = get_settings()

    # Derive JWKS URL from publishable key if not explicitly configured
    jwks_url = settings.clerk_jwks_url
    if not jwks_url:
        # pk_live_<frontend-api> → https://<frontend-api>/.well-known/jwks.json
        pub_key = settings.clerk_publishable_key
        if pub_key.startswith("pk_live_") or pub_key.startswith("pk_test_"):
            # Strip prefix and base64-decode the instance URL
            import base64
            raw = pub_key.split("_", 2)[-1].rstrip("$")
            try:
                instance_url = base64.b64decode(raw + "==").decode().rstrip("$")
                jwks_url = f"https://{instance_url}/.well-known/jwks.json"
            except Exception:
                # Fallback: use Clerk's backend API
                jwks_url = "https://api.clerk.com/v1/jwks"
        else:
            jwks_url = "https://api.clerk.com/v1/jwks"

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        data: dict[str, Any] = resp.json()

    _jwks_cache = data
    _jwks_fetched_at = time.monotonic()
    await logger.ainfo("clerk.jwks_refreshed", url=jwks_url)
    return data


# ---------------------------------------------------------------------------
# Token verification
# ---------------------------------------------------------------------------
async def _verify_clerk_token(token: str) -> dict[str, Any]:
    """
    Verify a Clerk JWT using the cached JWKS.
    Returns the decoded claims on success; raises HTTPException on failure.
    """
    jwks = await _get_jwks()

    try:
        # PyJWT's PyJWKClient handles key selection from JWKS
        from jwt import PyJWKClient, PyJWKClientError

        jwks_client = PyJWKClient.__new__(PyJWKClient)
        jwks_client.jwk_set_data = jwks

        # Find the matching key by kid
        signing_key = None
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        for key_data in jwks.get("keys", []):
            if key_data.get("kid") == kid:
                from jwt.algorithms import RSAAlgorithm
                signing_key = RSAAlgorithm.from_jwk(key_data)
                break

        if signing_key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No matching JWKS key found for token kid",
            )

        payload: dict[str, Any] = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            options={"verify_exp": True, "verify_aud": False},
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


# ---------------------------------------------------------------------------
# ClerkUser — parsed JWT claims
# ---------------------------------------------------------------------------
class ClerkUser:
    """Represents the authenticated Clerk user extracted from a JWT."""

    def __init__(self, claims: dict[str, Any]) -> None:
        self.clerk_user_id: str = claims.get("sub", "")
        self.email: str = (claims.get("email") or
                          (claims.get("email_addresses") or [{}])[0].get("email_address", ""))
        self.first_name: str | None = claims.get("first_name")
        self.last_name: str | None = claims.get("last_name")
        self.image_url: str | None = claims.get("image_url")
        self.claims: dict[str, Any] = claims

    def __repr__(self) -> str:
        return f"ClerkUser(id={self.clerk_user_id!r}, email={self.email!r})"


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------
async def get_current_clerk_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> ClerkUser:
    """
    FastAPI dependency: extract + verify Bearer JWT → return ClerkUser.
    Raises 401 if the token is absent or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = await _verify_clerk_token(credentials.credentials)
    return ClerkUser(claims)


# Type alias for cleaner route signatures
CurrentClerkUser = Depends(get_current_clerk_user)
