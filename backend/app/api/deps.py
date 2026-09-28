from typing import Optional
from fastapi import Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.errors import AuthenticationError, PermissionDeniedError
from app.models.user import User
from app.models.api_key import ApiKey
from app.services.auth_service import AuthService
from app.services.api_key_service import ApiKeyService

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT access token and return current User."""
    if not credentials or not credentials.credentials:
        raise AuthenticationError("Authorization header is missing or invalid.")

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token payload.")
    except Exception:
        raise AuthenticationError("Could not validate credentials or token expired.")

    auth_service = AuthService(db)
    user_schema = await auth_service.get_current_user(user_id)
    user = await auth_service.user_repo.get_by_id(user_schema.id)

    if not user or user.status != "active":
        raise AuthenticationError("User is inactive or not found.")

    request.state.user_id = user.id
    return user


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the authenticated user has admin role."""
    if current_user.role != "admin":
        raise PermissionDeniedError("Admin privileges required.")
    return current_user


async def verify_api_key(
    request: Request,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> ApiKey:
    """
    Validate API key from X-API-Key header or Bearer orv_live_...
    """
    raw_key = None
    if x_api_key:
        raw_key = x_api_key.strip()
    elif authorization and authorization.startswith("Bearer orv_"):
        raw_key = authorization.replace("Bearer ", "").strip()

    if not raw_key:
        raise AuthenticationError("Missing required API key. Provide via 'X-API-Key' header.")

    api_key_service = ApiKeyService(db)
    api_key = await api_key_service.verify_key(raw_key)

    # Attach key ID to request state for logging
    request.state.api_key_id = api_key.id
    if api_key.owner_id:
        request.state.user_id = api_key.owner_id

    return api_key


async def optional_api_key(
    request: Request,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> Optional[ApiKey]:
    """Validate API key if present, but do not fail if omitted."""
    raw_key = None
    if x_api_key:
        raw_key = x_api_key.strip()
    elif authorization and authorization.startswith("Bearer orv_"):
        raw_key = authorization.replace("Bearer ", "").strip()

    if not raw_key:
        return None

    try:
        api_key_service = ApiKeyService(db)
        api_key = await api_key_service.verify_key(raw_key)
        request.state.api_key_id = api_key.id
        if api_key.owner_id:
            request.state.user_id = api_key.owner_id
        return api_key
    except Exception:
        return None
