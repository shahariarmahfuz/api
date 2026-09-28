from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from app.models.plan import Plan, plan_api_access
from app.models.api_registry import ApiRegistry
from app.models.subscription import Subscription
from app.schemas.plan import PlanCreate, PlanUpdate
from app.core.errors import NotFoundError, DuplicateResourceError, ValidationError
from app.core.logging import logger


class PlanService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_active_plans(self) -> List[Plan]:
        """List all active plans for public and user dashboard display."""
        query = (
            select(Plan)
            .where(Plan.status == "ACTIVE")
            .options(selectinload(Plan.allowed_apis))
            .order_by(Plan.price.asc())
        )
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def list_admin_plans(self) -> List[Dict[str, Any]]:
        """List all plans for admin management with active subscriber counts."""
        query = (
            select(Plan)
            .options(selectinload(Plan.allowed_apis))
            .order_by(Plan.created_at.desc())
        )
        res = await self.db.execute(query)
        plans = res.scalars().all()

        now = datetime.now(timezone.utc)
        results = []
        for plan in plans:
            # Count active subscribers for this plan
            sub_count_query = select(func.count(Subscription.id)).where(
                Subscription.plan_id == plan.id,
                Subscription.status == "ACTIVE",
                Subscription.end_date > now,
            )
            sub_res = await self.db.execute(sub_count_query)
            active_subs = sub_res.scalar() or 0

            plan_dict = {
                "id": plan.id,
                "name": plan.name,
                "slug": plan.slug,
                "description": plan.description,
                "price": plan.price,
                "currency": plan.currency,
                "billing_interval": plan.billing_interval,
                "duration_days": plan.duration_days,
                "monthly_request_limit": plan.monthly_request_limit,
                "rate_limit_per_minute": plan.rate_limit_per_minute,
                "max_concurrent_requests": plan.max_concurrent_requests,
                "is_all_apis": plan.is_all_apis,
                "features": plan.features or [],
                "status": plan.status,
                "created_at": plan.created_at,
                "updated_at": plan.updated_at,
                "allowed_apis": [
                    {
                        "id": api.id,
                        "name": api.name,
                        "slug": api.slug,
                        "category": api.category,
                        "method": api.method,
                        "endpoint": api.endpoint,
                    }
                    for api in plan.allowed_apis
                ],
                "active_subscribers_count": active_subs,
            }
            results.append(plan_dict)

        return results

    async def get_by_id(self, plan_id: str) -> Plan:
        query = (
            select(Plan)
            .where(Plan.id == plan_id)
            .options(selectinload(Plan.allowed_apis))
        )
        res = await self.db.execute(query)
        plan = res.scalars().first()
        if not plan:
            raise NotFoundError(f"Plan with id '{plan_id}' not found.")
        return plan

    async def get_by_slug(self, slug: str) -> Plan:
        query = (
            select(Plan)
            .where(Plan.slug == slug)
            .options(selectinload(Plan.allowed_apis))
        )
        res = await self.db.execute(query)
        plan = res.scalars().first()
        if not plan:
            raise NotFoundError(f"Plan with slug '{slug}' not found.")
        return plan

    async def create_plan(self, data: PlanCreate) -> Plan:
        # Check slug uniqueness
        existing_res = await self.db.execute(select(Plan).where(Plan.slug == data.slug))
        if existing_res.scalars().first():
            raise DuplicateResourceError(f"Plan with slug '{data.slug}' already exists.")

        plan = Plan(
            name=data.name,
            slug=data.slug,
            description=data.description,
            price=data.price,
            currency=data.currency,
            billing_interval=data.billing_interval,
            duration_days=data.duration_days,
            monthly_request_limit=data.monthly_request_limit,
            rate_limit_per_minute=data.rate_limit_per_minute,
            max_concurrent_requests=data.max_concurrent_requests,
            is_all_apis=data.is_all_apis,
            features=data.features or [],
            status=data.status,
        )

        # Link allowed APIs
        if data.api_ids and not data.is_all_apis:
            apis_res = await self.db.execute(
                select(ApiRegistry).where(ApiRegistry.id.in_(data.api_ids))
            )
            plan.allowed_apis = list(apis_res.scalars().all())

        self.db.add(plan)
        await self.db.commit()
        await self.db.refresh(plan)
        logger.info(f"Created new plan: {plan.name} ({plan.slug})")
        return plan

    async def update_plan(self, plan_id: str, data: PlanUpdate) -> Plan:
        plan = await self.get_by_id(plan_id)

        update_fields = data.model_dump(exclude_unset=True)
        api_ids = update_fields.pop("api_ids", None)

        for key, value in update_fields.items():
            setattr(plan, key, value)

        if api_ids is not None and not plan.is_all_apis:
            apis_res = await self.db.execute(
                select(ApiRegistry).where(ApiRegistry.id.in_(api_ids))
            )
            plan.allowed_apis = list(apis_res.scalars().all())

        await self.db.commit()
        await self.db.refresh(plan)
        logger.info(f"Updated plan: {plan.id} ({plan.name})")
        return plan

    async def toggle_status(self, plan_id: str, status: str) -> Plan:
        if status not in ("ACTIVE", "INACTIVE"):
            raise ValidationError("Status must be either 'ACTIVE' or 'INACTIVE'.")

        plan = await self.get_by_id(plan_id)
        plan.status = status
        await self.db.commit()
        await self.db.refresh(plan)
        logger.info(f"Toggled plan {plan.id} status to {status}")
        return plan
