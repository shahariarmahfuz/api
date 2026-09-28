from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.common import StandardResponse
from app.schemas.plan import PlanResponse
from app.services.plan_service import PlanService

router = APIRouter(prefix="/plans", tags=["Plans & Pricing"])


@router.get("", response_model=StandardResponse[List[PlanResponse]])
async def list_active_plans(db: AsyncSession = Depends(get_db)):
    """List all publicly active plans with allowed APIs and limits."""
    plan_service = PlanService(db)
    plans = await plan_service.list_active_plans()
    return StandardResponse(
        success=True,
        data=[PlanResponse.model_validate(p) for p in plans],
        message="Active plans retrieved successfully.",
    )


@router.get("/{slug}", response_model=StandardResponse[PlanResponse])
async def get_plan_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Get active plan details by slug."""
    plan_service = PlanService(db)
    plan = await plan_service.get_by_slug(slug)
    return StandardResponse(
        success=True,
        data=PlanResponse.model_validate(plan),
        message=f"Plan '{plan.name}' retrieved.",
    )
