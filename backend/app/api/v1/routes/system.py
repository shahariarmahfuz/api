from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db, check_database_health
from app.core.config import settings
from app.schemas.common import StandardResponse
from app.repositories.registry_repository import RegistryRepository
from app.repositories.api_key_repository import ApiKeyRepository
from app.repositories.log_repository import LogRepository
from app.seed import seed_initial_data

router = APIRouter(prefix="/system", tags=["System Management"])


@router.get("/overview", response_model=StandardResponse[Dict[str, Any]])
async def get_system_overview(db: AsyncSession = Depends(get_db)):
    """Summary metrics of the Orvia platform for the dashboard."""
    registry_repo = RegistryRepository(db)
    api_key_repo = ApiKeyRepository(db)
    log_repo = LogRepository(db)

    total_apis = await registry_repo.count()
    total_keys = await api_key_repo.count()
    metrics = await log_repo.get_metrics()
    db_health = await check_database_health()

    return StandardResponse(
        success=True,
        data={
            "app_name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "total_apis": total_apis,
            "total_keys": total_keys,
            "total_requests": metrics["total_requests"],
            "avg_latency_ms": metrics["avg_response_time_ms"],
            "success_rate": round(
                (metrics["success_requests"] / metrics["total_requests"] * 100)
                if metrics["total_requests"] > 0
                else 100.0,
                1,
            ),
            "database": db_health,
        },
    )


@router.post("/seed", response_model=StandardResponse[Dict[str, Any]])
async def run_seed(db: AsyncSession = Depends(get_db)):
    """Seed initial sample APIs and platform configuration into the database."""
    result = await seed_initial_data(db)
    return StandardResponse(
        success=True,
        data=result,
        message="Platform initial data successfully seeded.",
    )
