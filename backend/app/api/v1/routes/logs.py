from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.api_request_log import ApiRequestLogResponse, LogStatsResponse
from app.schemas.common import StandardResponse, PaginatedResponse
from app.services.log_service import LogService

router = APIRouter(prefix="/logs", tags=["Request Logs & Analytics"])


@router.get("", response_model=PaginatedResponse[ApiRequestLogResponse])
async def list_logs(
    endpoint: Optional[str] = Query(None, description="Filter by endpoint path"),
    status_code: Optional[int] = Query(None, description="Filter by HTTP status code"),
    method: Optional[str] = Query(None, description="Filter by HTTP method"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve audit log of API requests processed by the platform."""
    service = LogService(db)
    return await service.get_logs(
        endpoint=endpoint,
        status_code=status_code,
        method=method,
        page=page,
        page_size=page_size,
    )


@router.get("/stats", response_model=StandardResponse[LogStatsResponse])
async def get_log_stats(db: AsyncSession = Depends(get_db)):
    """Retrieve platform analytics: request counts, success rates, latency, status distribution."""
    service = LogService(db)
    stats = await service.get_stats()
    return StandardResponse(
        success=True,
        data=stats,
    )
