import math
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.registry_repository import RegistryRepository
from app.schemas.api_registry import (
    ApiRegistryCreate,
    ApiRegistryUpdate,
    ApiRegistryResponse,
    CategorySummary,
)
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.models.api_registry import ApiRegistry
from app.core.errors import NotFoundError, DuplicateResourceError


class RegistryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = RegistryRepository(db)

    async def list_apis(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedResponse[ApiRegistryResponse]:
        skip = (page - 1) * page_size
        items, total = await self.repo.get_filtered(
            category=category,
            status=status,
            search=search,
            skip=skip,
            limit=page_size,
        )

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        data = [ApiRegistryResponse.model_validate(item) for item in items]

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

    async def get_by_slug(self, slug: str) -> ApiRegistryResponse:
        item = await self.repo.get_by_slug(slug)
        if not item:
            raise NotFoundError(f"API with slug '{slug}' not found.")
        return ApiRegistryResponse.model_validate(item)

    async def register_api(self, api_in: ApiRegistryCreate) -> ApiRegistryResponse:
        existing = await self.repo.get_by_slug(api_in.slug)
        if existing:
            raise DuplicateResourceError(f"API with slug '{api_in.slug}' already exists.")

        model = ApiRegistry(
            name=api_in.name,
            slug=api_in.slug,
            description=api_in.description,
            category=api_in.category.lower(),
            version=api_in.version,
            method=api_in.method.upper(),
            endpoint=api_in.endpoint,
            status=api_in.status,
            authentication_required=api_in.authentication_required,
            rate_limit=api_in.rate_limit,
            documentation=api_in.documentation or {},
        )
        created = await self.repo.create(model)
        return ApiRegistryResponse.model_validate(created)

    async def update_api(self, slug: str, update_in: ApiRegistryUpdate) -> ApiRegistryResponse:
        item = await self.repo.get_by_slug(slug)
        if not item:
            raise NotFoundError(f"API with slug '{slug}' not found.")

        update_data = update_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key == "category" and value:
                value = value.lower()
            if key == "method" and value:
                value = value.upper()
            setattr(item, key, value)

        await self.db.flush()
        await self.db.refresh(item)
        return ApiRegistryResponse.model_validate(item)

    async def toggle_status(self, slug: str, new_status: str) -> ApiRegistryResponse:
        item = await self.repo.get_by_slug(slug)
        if not item:
            raise NotFoundError(f"API with slug '{slug}' not found.")

        item.status = new_status
        await self.db.flush()
        await self.db.refresh(item)
        return ApiRegistryResponse.model_validate(item)

    async def get_categories(self) -> List[CategorySummary]:
        raw_list = await self.repo.get_categories_summary()
        return [CategorySummary(category=r["category"], count=r["count"]) for r in raw_list]
