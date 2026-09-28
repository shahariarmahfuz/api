from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc
from app.models.api_registry import ApiRegistry
from app.repositories.base import BaseRepository


class RegistryRepository(BaseRepository[ApiRegistry]):
    def __init__(self, db: AsyncSession):
        super().__init__(ApiRegistry, db)

    async def get_by_slug(self, slug: str) -> Optional[ApiRegistry]:
        stmt = select(ApiRegistry).where(ApiRegistry.slug == slug)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_endpoint_and_method(self, endpoint: str, method: str) -> Optional[ApiRegistry]:
        stmt = select(ApiRegistry).where(
            ApiRegistry.endpoint == endpoint,
            ApiRegistry.method == method.upper(),
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_filtered(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[ApiRegistry], int]:
        stmt = select(ApiRegistry)
        count_stmt = select(func.count()).select_from(ApiRegistry)

        filters = []
        if category and category.lower() != "all":
            filters.append(ApiRegistry.category == category.lower())
        if status and status.lower() != "all":
            filters.append(ApiRegistry.status == status.lower())
        if search:
            search_term = f"%{search.strip().lower()}%"
            filters.append(
                or_(
                    func.lower(ApiRegistry.name).like(search_term),
                    func.lower(ApiRegistry.slug).like(search_term),
                    func.lower(ApiRegistry.description).like(search_term),
                    func.lower(ApiRegistry.endpoint).like(search_term),
                )
            )

        if filters:
            stmt = stmt.where(*filters)
            count_stmt = count_stmt.where(*filters)

        # Count total
        count_res = await self.db.execute(count_stmt)
        total = count_res.scalar() or 0

        # Execute paginated query
        stmt = stmt.order_by(desc(ApiRegistry.created_at)).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        return items, total

    async def get_categories_summary(self) -> List[Dict[str, Any]]:
        stmt = (
            select(ApiRegistry.category, func.count(ApiRegistry.id).label("count"))
            .group_by(ApiRegistry.category)
            .order_by(desc("count"))
        )
        result = await self.db.execute(stmt)
        return [{"category": row[0], "count": row[1]} for row in result.all()]
