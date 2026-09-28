from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db, check_database_health
from app.api.deps import require_admin
from app.models.user import User
from app.schemas.user import (
    UserDetailResponse,
    UserResponse,
    UserAdminUpdateRole,
    UserAdminUpdateStatus,
)
from app.schemas.api_registry import (
    ApiRegistryCreate,
    ApiRegistryUpdate,
    ApiRegistryResponse,
    ApiStatusToggle,
)
from app.schemas.api_key import ApiKeyResponse
from app.schemas.common import StandardResponse, PaginatedResponse
from app.services.admin_service import AdminService
from app.services.registry_service import RegistryService
from app.services.api_key_service import ApiKeyService

router = APIRouter(prefix="/admin", tags=["Admin System"])


@router.get("/overview", response_model=StandardResponse[Dict[str, Any]])
async def get_admin_overview(
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve platform-wide administration telemetry."""
    service = AdminService(db)
    overview = await service.get_overview()
    db_health = await check_database_health()
    overview["database"] = db_health
    return StandardResponse(
        success=True,
        data=overview,
    )


# 1. User Administration
@router.get("/users", response_model=PaginatedResponse[UserDetailResponse])
async def list_users(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by role: USER, ADMIN"),
    status: Optional[str] = Query(None, description="Filter by status: active, suspended, pending"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all registered users with key and request metrics."""
    service = AdminService(db)
    return await service.list_users(
        search=search,
        role=role,
        status=status,
        page=page,
        page_size=page_size,
    )


@router.get("/users/{user_id}", response_model=StandardResponse[Dict[str, Any]])
async def get_user_details(
    user_id: str,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed user information, owned keys, and request metrics."""
    service = AdminService(db)
    data = await service.get_user_details(user_id)
    return StandardResponse(
        success=True,
        data=data,
    )


@router.patch("/users/{user_id}/status", response_model=StandardResponse[UserResponse])
async def update_user_status(
    user_id: str,
    body: UserAdminUpdateStatus,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Activate or suspend a user account (with safeguard against self-suspension)."""
    service = AdminService(db)
    updated = await service.update_user_status(current_admin.id, user_id, body.status)
    return StandardResponse(
        success=True,
        data=updated,
        message=f"User status updated to '{body.status}'.",
    )


@router.patch("/users/{user_id}/role", response_model=StandardResponse[UserResponse])
async def update_user_role(
    user_id: str,
    body: UserAdminUpdateRole,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Change user role between USER and ADMIN (with safeguard against self-demotion)."""
    service = AdminService(db)
    updated = await service.update_user_role(current_admin.id, user_id, body.role)
    return StandardResponse(
        success=True,
        data=updated,
        message=f"User role updated to '{body.role.upper()}'.",
    )


# 2. API Registry Administration
@router.get("/apis", response_model=PaginatedResponse[ApiRegistryResponse])
async def list_registry_apis(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all registered APIs in the platform registry."""
    service = RegistryService(db)
    return await service.list_apis(
        category=category,
        status=status,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.post("/apis", response_model=StandardResponse[ApiRegistryResponse], status_code=status.HTTP_201_CREATED)
async def create_api_entry(
    api_in: ApiRegistryCreate,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Register a new API into the central catalog."""
    service = RegistryService(db)
    created = await service.register_api(api_in)
    return StandardResponse(
        success=True,
        data=created,
        message="API successfully registered.",
    )


@router.patch("/apis/{slug}", response_model=StandardResponse[ApiRegistryResponse])
async def update_api_entry(
    slug: str,
    update_in: ApiRegistryUpdate,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update API metadata, description, rate limits, or documentation schemas."""
    service = RegistryService(db)
    updated = await service.update_api(slug, update_in)
    return StandardResponse(
        success=True,
        data=updated,
        message=f"API '{slug}' successfully updated.",
    )


@router.patch("/apis/{slug}/status", response_model=StandardResponse[ApiRegistryResponse])
async def toggle_api_entry_status(
    slug: str,
    body: ApiStatusToggle,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Toggle API status between active, beta, deprecated, and disabled."""
    service = RegistryService(db)
    updated = await service.toggle_status(slug, body.status)
    return StandardResponse(
        success=True,
        data=updated,
        message=f"API '{slug}' status changed to '{body.status}'.",
    )


# 3. API Key Administration
@router.get("/api-keys", response_model=PaginatedResponse[Dict[str, Any]])
async def list_all_keys(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """View platform-wide API keys with owner email and usage timestamps."""
    service = AdminService(db)
    return await service.list_all_keys(page=page, page_size=page_size)


@router.delete("/api-keys/{key_id}", response_model=StandardResponse[ApiKeyResponse])
async def revoke_any_key(
    key_id: str,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Revoke any active API key on the platform."""
    key_service = ApiKeyService(db)
    revoked = await key_service.revoke_key(key_id)
    return StandardResponse(
        success=True,
        data=revoked,
        message="API key revoked by administrator.",
    )


# 4. Request Monitoring
@router.get("/requests", response_model=PaginatedResponse[Dict[str, Any]])
async def list_all_requests(
    endpoint: Optional[str] = Query(None),
    status_code: Optional[int] = Query(None),
    method: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Monitor platform-wide API request telemetry with pagination and filters."""
    service = AdminService(db)
    return await service.list_all_requests(
        endpoint=endpoint,
        status_code=status_code,
        method=method,
        user_id=user_id,
        page=page,
        page_size=page_size,
    )


@router.get("/settings", response_model=StandardResponse[Dict[str, Any]])
async def get_admin_settings(
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve platform configuration and database health metrics."""
    db_health = await check_database_health()
    return StandardResponse(
        success=True,
        data={
            "database": db_health,
            "roles_supported": ["USER", "ADMIN"],
            "password_hashing": "bcrypt",
            "api_key_hashing": "SHA-256",
            "cors_policy": "Strict origin or configurable",
        },
    )
