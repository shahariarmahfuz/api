import math
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from app.models.api_key import ApiKey
from app.models.api_request_log import ApiRequestLog
from app.models.api_registry import ApiRegistry
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse
from app.schemas.api_request_log import ApiRequestLogResponse
from app.schemas.user import UserUsageStatsResponse
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.services.api_key_service import ApiKeyService
from app.core.errors import NotFoundError, PermissionDeniedError


class UserService:
    """Service handling isolated user operations (My Keys, My Usage, My Logs)."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.api_key_service = ApiKeyService(db)

    # 1. API Key Management (strictly scoped to user_id)
    async def get_user_keys(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedResponse[ApiKeyResponse]:
        skip = (page - 1) * page_size

        count_stmt = select(func.count()).select_from(ApiKey).where(ApiKey.owner_id == user_id)
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = (
            select(ApiKey)
            .where(ApiKey.owner_id == user_id)
            .order_by(desc(ApiKey.created_at))
            .offset(skip)
            .limit(page_size)
        )
        items = (await self.db.execute(stmt)).scalars().all()

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        data = [ApiKeyResponse.model_validate(k) for k in items]

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

    async def create_user_key(
        self,
        user_id: str,
        key_in: ApiKeyCreate,
    ) -> ApiKeyCreatedResponse:
        return await self.api_key_service.create_key(key_in, owner_id=user_id)

    async def revoke_user_key(
        self,
        user_id: str,
        key_id: str,
    ) -> ApiKeyResponse:
        # Enforce data isolation: verify ownership
        key = await self.api_key_service.repo.get(key_id)
        if not key or key.owner_id != user_id:
            raise NotFoundError("API key not found.")
        return await self.api_key_service.revoke_key(key_id, owner_id=user_id)

    # 2. API Usage Analytics (strictly scoped to user_id)
    async def get_user_usage_stats(self, user_id: str) -> UserUsageStatsResponse:
        # Total requests
        total_stmt = select(func.count()).select_from(ApiRequestLog).where(ApiRequestLog.user_id == user_id)
        total_requests = (await self.db.execute(total_stmt)).scalar() or 0

        # Today's requests
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_stmt = (
            select(func.count())
            .select_from(ApiRequestLog)
            .where(and_(ApiRequestLog.user_id == user_id, ApiRequestLog.timestamp >= today_start))
        )
        requests_today = (await self.db.execute(today_stmt)).scalar() or 0

        # Active keys count
        keys_stmt = (
            select(func.count())
            .select_from(ApiKey)
            .where(and_(ApiKey.owner_id == user_id, ApiKey.status == "active"))
        )
        api_keys_count = (await self.db.execute(keys_stmt)).scalar() or 0

        # Active platform APIs
        apis_stmt = select(func.count()).select_from(ApiRegistry).where(ApiRegistry.status == "active")
        active_apis_count = (await self.db.execute(apis_stmt)).scalar() or 0

        # Success count (<400)
        success_stmt = (
            select(func.count())
            .select_from(ApiRequestLog)
            .where(and_(ApiRequestLog.user_id == user_id, ApiRequestLog.status_code < 400))
        )
        success_requests = (await self.db.execute(success_stmt)).scalar() or 0
        error_requests = total_requests - success_requests

        # Average latency
        latency_stmt = (
            select(func.avg(ApiRequestLog.response_time_ms))
            .select_from(ApiRequestLog)
            .where(ApiRequestLog.user_id == user_id)
        )
        avg_res = (await self.db.execute(latency_stmt)).scalar()
        avg_response_time_ms = round(float(avg_res), 2) if avg_res else 0.0

        # Usage by API endpoint
        by_api_stmt = (
            select(
                ApiRequestLog.endpoint,
                ApiRequestLog.method,
                func.count().label("calls"),
                func.avg(ApiRequestLog.response_time_ms).label("avg_latency"),
            )
            .where(ApiRequestLog.user_id == user_id)
            .group_by(ApiRequestLog.endpoint, ApiRequestLog.method)
            .order_by(desc("calls"))
            .limit(10)
        )
        by_api_res = (await self.db.execute(by_api_stmt)).all()
        usage_by_api = [
            {
                "endpoint": row[0],
                "method": row[1],
                "calls": row[2],
                "avg_latency_ms": round(float(row[3]), 2) if row[3] else 0.0,
            }
            for row in by_api_res
        ]

        # Recent activity
        recent_stmt = (
            select(ApiRequestLog)
            .where(ApiRequestLog.user_id == user_id)
            .order_by(desc(ApiRequestLog.timestamp))
            .limit(10)
        )
        recent_items = (await self.db.execute(recent_stmt)).scalars().all()
        recent_activity = [
            {
                "id": log.id,
                "request_id": log.request_id,
                "endpoint": log.endpoint,
                "method": log.method,
                "status_code": log.status_code,
                "response_time_ms": log.response_time_ms,
                "timestamp": log.timestamp.isoformat(),
            }
            for log in recent_items
        ]

        return UserUsageStatsResponse(
            total_requests=total_requests,
            requests_today=requests_today,
            api_keys_count=api_keys_count,
            active_apis_count=active_apis_count,
            success_requests=success_requests,
            error_requests=error_requests,
            avg_response_time_ms=avg_response_time_ms,
            usage_by_api=usage_by_api,
            recent_activity=recent_activity,
        )

    # 3. Request Logs (strictly scoped to user_id)
    async def get_user_logs(
        self,
        user_id: str,
        endpoint: Optional[str] = None,
        status_code: Optional[int] = None,
        method: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
    ) -> PaginatedResponse[ApiRequestLogResponse]:
        skip = (page - 1) * page_size

        filters = [ApiRequestLog.user_id == user_id]
        if endpoint:
            filters.append(ApiRequestLog.endpoint.like(f"%{endpoint.strip()}%"))
        if status_code:
            filters.append(ApiRequestLog.status_code == status_code)
        if method:
            filters.append(ApiRequestLog.method == method.upper())

        count_stmt = select(func.count()).select_from(ApiRequestLog).where(and_(*filters))
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = (
            select(ApiRequestLog)
            .where(and_(*filters))
            .order_by(desc(ApiRequestLog.timestamp))
            .offset(skip)
            .limit(page_size)
        )
        items = (await self.db.execute(stmt)).scalars().all()

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
