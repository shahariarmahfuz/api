from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse
from app.schemas.common import StandardResponse, PaginatedResponse
from app.services.api_key_service import ApiKeyService

router = APIRouter(prefix="/api-keys", tags=["API Keys"])


@router.post("", response_model=StandardResponse[ApiKeyCreatedResponse], status_code=status.HTTP_201_CREATED)
async def create_api_key(
    key_in: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a new API key.
    IMPORTANT: The secret key will only be displayed ONCE in this response.
    """
    service = ApiKeyService(db)
    created = await service.create_key(key_in, owner_id=None)
    return StandardResponse(
        success=True,
        data=created,
        message="API key created successfully. Save your secret key safely as it cannot be shown again.",
    )


@router.get("", response_model=PaginatedResponse[ApiKeyResponse])
async def list_api_keys(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List API keys with their prefixes, status, and usage timestamps."""
    service = ApiKeyService(db)
    return await service.list_keys(page=page, page_size=page_size)


@router.delete("/{key_id}", response_model=StandardResponse[ApiKeyResponse])
async def revoke_api_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Revoke an active API key immediately."""
    service = ApiKeyService(db)
    revoked = await service.revoke_key(key_id)
    return StandardResponse(
        success=True,
        data=revoked,
        message="API key successfully revoked.",
    )
