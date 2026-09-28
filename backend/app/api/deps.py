from typing import Optional
from fastapi import Depends, Header, Request, Cookie
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
    auth_token: Optional[str] = Cookie(None, alias="orvia_token"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT access token from Authorization header or cookie, and return current User."""
    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif auth_token:
        token = auth_token

    if not token:
        raise AuthenticationError("Authentication required. Please log in.")

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token payload.")
    except Exception:
        raise AuthenticationError("Session expired or invalid credentials. Please log in again.")

    auth_service = AuthService(db)
    user_schema = await auth_service.get_current_user(user_id)
    user = await auth_service.user_repo.get_by_id(user_schema.id)

    if not user or user.status != "active":
        raise AuthenticationError(f"Account is {user.status if user else 'not found'}.")

    request.state.user_id = user.id
    return user


async def require_authenticated_user(current_user: User = Depends(get_current_user)) -> User:
    """Explicit dependency ensuring the caller is an active authenticated user."""
    return current_user


async def require_user(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the authenticated caller has USER role and is not an administrator."""
    if current_user.role.upper() != "USER":
        raise PermissionDeniedError("Access denied. Admin accounts cannot access user dashboard endpoints.")
    return current_user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the authenticated user has ADMIN role."""
    if current_user.role.upper() != "ADMIN":
        raise PermissionDeniedError("Administrative privileges required. Access denied.")
    return current_user


get_current_admin = require_admin


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

    # Attach key ID and owner ID to request state for logging
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
