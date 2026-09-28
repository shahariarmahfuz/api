from typing import Optional, Dict
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import require_authenticated_user
from app.models.user import User
from app.schemas.user import (
    UserResponse,
    UserProfileUpdate,
    UserPasswordChange,
    UserUsageStatsResponse,
)
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse
from app.schemas.api_request_log import ApiRequestLogResponse
from app.schemas.common import StandardResponse, PaginatedResponse
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter(prefix="/user", tags=["User Dashboard System"])


@router.get("/profile", response_model=StandardResponse[UserResponse])
async def get_my_profile(current_user: User = Depends(require_authenticated_user)):
    """Retrieve authenticated user's profile."""
    return StandardResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
    )


@router.patch("/profile", response_model=StandardResponse[UserResponse])
async def update_my_profile(
    update_in: UserProfileUpdate,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Update authenticated user's name or email."""
    auth_service = AuthService(db)
    updated = await auth_service.update_profile(current_user.id, update_in)
    return StandardResponse(
        success=True,
        data=updated,
        message="Profile updated successfully.",
    )


@router.put("/change-password", response_model=StandardResponse[Dict[str, str]])
async def change_my_password(
    change_in: UserPasswordChange,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Change authenticated user's password."""
    auth_service = AuthService(db)
    await auth_service.change_password(current_user.id, change_in)
    return StandardResponse(
        success=True,
        data={"status": "password_changed"},
        message="Password changed successfully.",
    )


@router.get("/api-keys", response_model=PaginatedResponse[ApiKeyResponse])
async def get_my_api_keys(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve API keys belonging strictly to the authenticated user."""
    service = UserService(db)
    return await service.get_user_keys(current_user.id, page=page, page_size=page_size)


@router.post("/api-keys", response_model=StandardResponse[ApiKeyCreatedResponse], status_code=status.HTTP_201_CREATED)
async def create_my_api_key(
    key_in: ApiKeyCreate,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an API key owned by the authenticated user.
    The secret key is displayed ONLY ONCE in this response.
    """
    service = UserService(db)
    created = await service.create_user_key(current_user.id, key_in)
    return StandardResponse(
        success=True,
        data=created,
        message="API key created successfully. Save your secret key safely now.",
    )


@router.delete("/api-keys/{key_id}", response_model=StandardResponse[ApiKeyResponse])
async def revoke_my_api_key(
    key_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke an API key owned by the authenticated user."""
    service = UserService(db)
    revoked = await service.revoke_user_key(current_user.id, key_id)
    return StandardResponse(
        success=True,
        data=revoked,
        message="API key revoked successfully.",
    )


@router.get("/usage", response_model=StandardResponse[UserUsageStatsResponse])
async def get_my_usage_stats(
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve isolated usage statistics and analytics for the authenticated user."""
    service = UserService(db)
    stats = await service.get_user_usage_stats(current_user.id)
    return StandardResponse(
        success=True,
        data=stats,
    )


@router.get("/logs", response_model=PaginatedResponse[ApiRequestLogResponse])
async def get_my_request_logs(
    endpoint: Optional[str] = Query(None),
    status_code: Optional[int] = Query(None),
    method: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve request audit logs strictly belonging to the authenticated user."""
    service = UserService(db)
    return await service.get_user_logs(
        user_id=current_user.id,
        endpoint=endpoint,
        status_code=status_code,
        method=method,
        page=page,
        page_size=page_size,
    )
