from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.api_registry import (
    ApiRegistryCreate,
    ApiRegistryUpdate,
    ApiRegistryResponse,
    ApiStatusToggle,
    CategorySummary,
)
from app.schemas.common import StandardResponse, PaginatedResponse
from app.services.registry_service import RegistryService

router = APIRouter(prefix="/apis", tags=["API Registry"])


@router.get("", response_model=PaginatedResponse[ApiRegistryResponse])
async def list_apis(
    category: Optional[str] = Query(None, description="Filter by category (e.g. image, utility, ai)"),
    status: Optional[str] = Query(None, description="Filter by status (active, beta, deprecated, disabled)"),
    search: Optional[str] = Query(None, description="Search query across name, slug, endpoint"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve catalog of APIs registered on Orvia."""
    service = RegistryService(db)
    return await service.list_apis(
        category=category,
        status=status,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get("/categories", response_model=StandardResponse[List[CategorySummary]])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Retrieve all distinct API categories and count of APIs in each."""
    service = RegistryService(db)
    categories = await service.get_categories()
    return StandardResponse(
        success=True,
        data=categories,
    )


@router.get("/{slug}", response_model=StandardResponse[ApiRegistryResponse])
async def get_api_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Get complete API specification, schema, and documentation by slug."""
    service = RegistryService(db)
    api_spec = await service.get_by_slug(slug)
    return StandardResponse(
        success=True,
        data=api_spec,
    )


@router.post("", response_model=StandardResponse[ApiRegistryResponse], status_code=status.HTTP_201_CREATED)
async def register_new_api(api_in: ApiRegistryCreate, db: AsyncSession = Depends(get_db)):
    """Register a new API in the central Orvia registry."""
    service = RegistryService(db)
    registered = await service.register_api(api_in)
    return StandardResponse(
        success=True,
        data=registered,
        message=f"API '{registered.name}' successfully registered.",
    )


@router.patch("/{slug}", response_model=StandardResponse[ApiRegistryResponse])
async def update_api_metadata(slug: str, update_in: ApiRegistryUpdate, db: AsyncSession = Depends(get_db)):
    """Update API metadata, documentation, or rate limit configuration."""
    service = RegistryService(db)
    updated = await service.update_api(slug, update_in)
    return StandardResponse(
        success=True,
        data=updated,
        message=f"API '{slug}' successfully updated.",
    )


@router.patch("/{slug}/status", response_model=StandardResponse[ApiRegistryResponse])
async def toggle_api_status(slug: str, body: ApiStatusToggle, db: AsyncSession = Depends(get_db)):
    """Toggle API status between active, beta, deprecated, and disabled."""
    service = RegistryService(db)
    updated = await service.toggle_status(slug, body.status)
    return StandardResponse(
        success=True,
        data=updated,
        message=f"API '{slug}' status changed to '{body.status}'.",
    )
