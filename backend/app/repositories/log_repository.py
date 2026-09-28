from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from app.models.api_request_log import ApiRequestLog
from app.repositories.base import BaseRepository


class LogRepository(BaseRepository[ApiRequestLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(ApiRequestLog, db)

    async def get_logs_filtered(
        self,
        endpoint: Optional[str] = None,
        status_code: Optional[int] = None,
        method: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[ApiRequestLog], int]:
        stmt = select(ApiRequestLog)
        count_stmt = select(func.count()).select_from(ApiRequestLog)

        filters = []
        if endpoint:
            filters.append(ApiRequestLog.endpoint.like(f"%{endpoint.strip()}%"))
        if status_code:
            filters.append(ApiRequestLog.status_code == status_code)
        if method:
            filters.append(ApiRequestLog.method == method.upper())

        if filters:
            stmt = stmt.where(and_(*filters))
            count_stmt = count_stmt.where(and_(*filters))

        count_res = await self.db.execute(count_stmt)
        total = count_res.scalar() or 0

        stmt = stmt.order_by(desc(ApiRequestLog.timestamp)).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        return items, total

    async def get_metrics(self) -> Dict[str, Any]:
        total_stmt = select(func.count()).select_from(ApiRequestLog)
        total_res = await self.db.execute(total_stmt)
        total_requests = total_res.scalar() or 0

        avg_latency_stmt = select(func.avg(ApiRequestLog.response_time_ms)).select_from(ApiRequestLog)
        avg_res = await self.db.execute(avg_latency_stmt)
        avg_latency = float(avg_res.scalar() or 0.0)

        # Status code breakdown
        success_stmt = (
            select(func.count())
            .select_from(ApiRequestLog)
            .where(ApiRequestLog.status_code < 400)
        )
        success_res = await self.db.execute(success_stmt)
        success_count = success_res.scalar() or 0
        error_count = total_requests - success_count

        # Top endpoints
        top_endpoints_stmt = (
            select(ApiRequestLog.endpoint, ApiRequestLog.method, func.count().label("calls"))
            .group_by(ApiRequestLog.endpoint, ApiRequestLog.method)
            .order_by(desc("calls"))
            .limit(5)
        )
        top_res = await self.db.execute(top_endpoints_stmt)
        top_endpoints = [
            {"endpoint": row[0], "method": row[1], "calls": row[2]}
            for row in top_res.all()
        ]

        # Status distribution
        status_stmt = (
            select(ApiRequestLog.status_code, func.count().label("count"))
            .group_by(ApiRequestLog.status_code)
            .order_by(desc("count"))
        )
        status_res = await self.db.execute(status_stmt)
        status_breakdown = {str(row[0]): row[1] for row in status_res.all()}

        return {
            "total_requests": total_requests,
            "success_requests": success_count,
            "error_requests": error_count,
            "avg_response_time_ms": round(avg_latency, 2),
            "status_breakdown": status_breakdown,
            "top_endpoints": top_endpoints,
        }
