import math
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.log_repository import LogRepository
from app.schemas.api_request_log import ApiRequestLogResponse, LogStatsResponse
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.models.api_request_log import ApiRequestLog


class LogService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = LogRepository(db)

    async def record_log(
        self,
        request_id: str,
        endpoint: str,
        method: str,
        status_code: int,
        response_time_ms: float,
        ip_address: Optional[str] = None,
        api_id: Optional[str] = None,
        api_key_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> ApiRequestLog:
        log_entry = ApiRequestLog(
            request_id=request_id,
            endpoint=endpoint,
            method=method.upper(),
            status_code=status_code,
            response_time_ms=response_time_ms,
            ip_address=ip_address,
            api_id=api_id,
            api_key_id=api_key_id,
            user_id=user_id,
            timestamp=datetime.now(timezone.utc),
        )
        return await self.repo.create(log_entry)

    async def get_logs(
        self,
        endpoint: Optional[str] = None,
        status_code: Optional[int] = None,
        method: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
    ) -> PaginatedResponse[ApiRequestLogResponse]:
        skip = (page - 1) * page_size
        items, total = await self.repo.get_logs_filtered(
            endpoint=endpoint,
            status_code=status_code,
            method=method,
            skip=skip,
            limit=page_size,
        )

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        data = [ApiRequestLogResponse.model_validate(item) for item in items]

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

    async def get_stats(self) -> LogStatsResponse:
        metrics = await self.repo.get_metrics()
        return LogStatsResponse(
            total_requests=metrics["total_requests"],
            success_requests=metrics["success_requests"],
            error_requests=metrics["error_requests"],
            avg_response_time_ms=metrics["avg_response_time_ms"],
            status_breakdown=metrics["status_breakdown"],
            top_endpoints=metrics["top_endpoints"],
        )
