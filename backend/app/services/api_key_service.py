import math
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.api_key_repository import ApiKeyRepository
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.models.api_key import ApiKey
from app.core.security import generate_api_key, hash_api_key
from app.core.errors import (
    AuthenticationError,
    NotFoundError,
    PermissionDeniedError,
    MissingApiKeyError,
    InvalidApiKeyError,
)


class ApiKeyService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ApiKeyRepository(db)

    async def create_key(self, key_in: ApiKeyCreate, owner_id: Optional[str] = None) -> ApiKeyCreatedResponse:
        secret_key, key_prefix, key_hash = generate_api_key()

        expires_at = None
        if key_in.expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=key_in.expires_in_days)

        api_key = ApiKey(
            name=key_in.name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            owner_id=owner_id,
            status="active",
            rate_limit=key_in.rate_limit or "60/min",
            expires_at=expires_at,
        )
        created = await self.repo.create(api_key)

        return ApiKeyCreatedResponse(
            id=created.id,
            name=created.name,
            key_prefix=created.key_prefix,
            owner_id=created.owner_id,
            status=created.status,
            rate_limit=created.rate_limit,
            last_used_at=created.last_used_at,
            expires_at=created.expires_at,
            created_at=created.created_at,
            secret_key=secret_key,
        )

    async def verify_key(self, raw_key: str) -> ApiKey:
        if not raw_key or not raw_key.strip():
            raise MissingApiKeyError("API key is required.")

        key_hash = hash_api_key(raw_key.strip())
        api_key = await self.repo.get_by_hash(key_hash)

        if not api_key:
            raise InvalidApiKeyError("The provided API key is invalid.")

        if api_key.status != "active":
            raise InvalidApiKeyError("The provided API key is inactive or revoked.")


        if api_key.expires_at and api_key.expires_at < datetime.now(timezone.utc):
            api_key.status = "expired"
            await self.db.flush()
            raise AuthenticationError("API key has expired.")

        # Update last used timestamp
        await self.repo.update_last_used(api_key.id)
        return api_key

    async def list_keys(
        self,
        owner_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedResponse[ApiKeyResponse]:
        skip = (page - 1) * page_size
        if owner_id:
            items = await self.repo.get_by_owner(owner_id)
            total = len(items)
            paginated_items = items[skip : skip + page_size]
        else:
            paginated_items, total = await self.repo.get_all_keys(skip=skip, limit=page_size)

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        data = [ApiKeyResponse.model_validate(item) for item in paginated_items]

        return PaginatedResponse(
            success=True,
            data=data,
            pagination=PaginationMeta(
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            ),
        )

    async def revoke_key(self, key_id: str, owner_id: Optional[str] = None) -> ApiKeyResponse:
        key = await self.repo.get(key_id)
        if not key:
            raise NotFoundError(f"API key with ID '{key_id}' not found.")

        if owner_id and key.owner_id and key.owner_id != owner_id:
            raise PermissionDeniedError("You do not have permission to revoke this API key.")

        revoked = await self.repo.revoke(key_id)
        return ApiKeyResponse.model_validate(revoked)
