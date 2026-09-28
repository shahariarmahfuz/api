from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update
from app.models.api_key import ApiKey
from app.repositories.base import BaseRepository


class ApiKeyRepository(BaseRepository[ApiKey]):
    def __init__(self, db: AsyncSession):
        super().__init__(ApiKey, db)

    async def get_by_hash(self, key_hash: str) -> Optional[ApiKey]:
        stmt = select(ApiKey).where(ApiKey.key_hash == key_hash)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_owner(self, owner_id: str) -> List[ApiKey]:
        stmt = (
            select(ApiKey)
            .where(ApiKey.owner_id == owner_id)
            .order_by(desc(ApiKey.created_at))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all_keys(self, skip: int = 0, limit: int = 50) -> Tuple[List[ApiKey], int]:
        count_stmt = select(func.count()).select_from(ApiKey)
        count_res = await self.db.execute(count_stmt)
        total = count_res.scalar() or 0

        stmt = select(ApiKey).order_by(desc(ApiKey.created_at)).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())
        return items, total

    async def update_last_used(self, key_id: str) -> None:
        stmt = (
            update(ApiKey)
            .where(ApiKey.id == key_id)
            .values(last_used_at=datetime.now(timezone.utc))
        )
        await self.db.execute(stmt)
        await self.db.flush()

    async def revoke(self, key_id: str) -> Optional[ApiKey]:
        api_key = await self.get(key_id)
        if api_key:
            api_key.status = "revoked"
            await self.db.flush()
            await self.db.refresh(api_key)
        return api_key
