import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from app.models.subscription import Subscription, CouponUsage
from app.models.plan import Plan
from app.models.coupon import Coupon
from app.models.api_registry import ApiRegistry
from app.models.api_request_log import ApiRequestLog
from app.schemas.subscription import (
    ActiveSubscriptionResponse,
    ActiveSubscriptionUsage,
    SubscriptionResponse,
    PaymentInitiateResponse,
)
from app.services.coupon_service import CouponService
from app.core.rate_limiter import api_rate_limiter
from app.core.errors import (
    NotFoundError,
    ValidationError,
    NoActivePlanError,
    PlanLimitExceededError,
    ApiNotInPlanError,
    RateLimitError,
)
from app.core.logging import logger


class SubscriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active_subscription_record(self, user_id: str) -> Optional[Subscription]:
        """Fetch the current active subscription entity for a user."""
        now = datetime.now(timezone.utc)
        query = (
            select(Subscription)
            .where(
                Subscription.user_id == user_id,
                Subscription.status == "ACTIVE",
                Subscription.end_date > now,
            )
            .options(
                selectinload(Subscription.plan).selectinload(Plan.allowed_apis),
                selectinload(Subscription.coupon),
            )
            .order_by(Subscription.end_date.desc())
        )
        res = await self.db.execute(query)
        return res.scalars().first()

    async def get_user_active_subscription_details(self, user_id: str) -> ActiveSubscriptionResponse:
        """
        Returns active plan status, subscription details, and real billing-cycle usage statistics.
        If no plan is active, returns has_active_plan: false.
        """
        sub = await self.get_active_subscription_record(user_id)
        if not sub:
            return ActiveSubscriptionResponse(has_active_plan=False, subscription=None, usage=None)

        now = datetime.now(timezone.utc)
        start_date = sub.start_date
        end_date = sub.end_date

        # Calculate actual requests made within current subscription period
        log_count_query = select(func.count(ApiRequestLog.id)).where(
            ApiRequestLog.user_id == user_id,
            ApiRequestLog.timestamp >= start_date,
            ApiRequestLog.timestamp <= end_date,
        )
        log_res = await self.db.execute(log_count_query)
        requests_used = log_res.scalar() or 0

        snapshot = sub.plan_snapshot or {}
        monthly_limit = snapshot.get("monthly_request_limit") or (sub.plan.monthly_request_limit if sub.plan else 100000)
        rate_limit = snapshot.get("rate_limit_per_minute") or (sub.plan.rate_limit_per_minute if sub.plan else 60)

        usage_pct = round((requests_used / monthly_limit) * 100.0, 2) if monthly_limit > 0 else 0.0
        days_rem = max(0, (end_date - now).days)

        usage_data = ActiveSubscriptionUsage(
            requests_used=requests_used,
            requests_limit=monthly_limit,
            usage_percentage=min(100.0, usage_pct),
            rate_limit_per_minute=rate_limit,
            period_start=start_date,
            period_end=end_date,
            days_remaining=days_rem,
        )

        return ActiveSubscriptionResponse(
            has_active_plan=True,
            subscription=SubscriptionResponse.model_validate(sub),
            usage=usage_data,
        )

    async def activate_with_coupon(self, user_id: str, plan_id: str, coupon_code: str) -> Subscription:
        """
        Activate subscription using a validated coupon code.
        Validates the coupon against the target plan, snapshots commercial limits,
        registers usage, and marks subscription active immediately.
        """
        coupon_service = CouponService(self.db)
        validation = await coupon_service.validate_coupon(
            code=coupon_code,
            plan_id=plan_id,
            user_id=user_id,
        )

        coupon = await coupon_service.get_by_code(coupon_code)
        if not coupon:
            raise ValidationError("Coupon could not be retrieved.")

        # Fetch Plan
        plan_query = select(Plan).where(Plan.id == plan_id).options(selectinload(Plan.allowed_apis))
        plan_res = await self.db.execute(plan_query)
        plan = plan_res.scalars().first()
        if not plan:
            raise NotFoundError(f"Plan '{plan_id}' not found.")

        if plan.status != "ACTIVE":
            raise ValidationError("Cannot activate an inactive plan.")

        # Build snapshot of plan configuration at activation time
        allowed_slugs = [api.slug for api in plan.allowed_apis]
        plan_snapshot = {
            "id": plan.id,
            "name": plan.name,
            "slug": plan.slug,
            "description": plan.description,
            "price": plan.price,
            "currency": plan.currency,
            "billing_interval": plan.billing_interval,
            "monthly_request_limit": plan.monthly_request_limit,
            "rate_limit_per_minute": plan.rate_limit_per_minute,
            "max_concurrent_requests": plan.max_concurrent_requests,
            "is_all_apis": plan.is_all_apis,
            "allowed_api_slugs": allowed_slugs,
            "coupon_code": coupon.code,
            "discount_applied": validation.discount_amount,
        }

        now = datetime.now(timezone.utc)
        duration_days = plan.duration_days or (365 if plan.billing_interval == "yearly" else 30)
        end_date = now + timedelta(days=duration_days)

        # Deactivate any previous active subscription for this user
        prev_subs_res = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.status == "ACTIVE",
            )
        )
        for prev in prev_subs_res.scalars().all():
            prev.status = "CANCELLED"

        # Create new active subscription
        sub = Subscription(
            user_id=user_id,
            plan_id=plan.id,
            status="ACTIVE",
            activation_method="COUPON",
            start_date=now,
            end_date=end_date,
            billing_interval=plan.billing_interval,
            amount_paid=validation.final_price,
            currency=plan.currency,
            plan_snapshot=plan_snapshot,
            payment_status="COMPLETED",
            coupon_id=coupon.id,
        )
        self.db.add(sub)
        await self.db.flush()

        # Record coupon usage
        usage = CouponUsage(
            coupon_id=coupon.id,
            user_id=user_id,
            subscription_id=sub.id,
            discount_amount=validation.discount_amount,
            used_at=now,
        )
        self.db.add(usage)

        # Increment coupon times_used
        coupon.times_used += 1

        await self.db.commit()
        await self.db.refresh(sub)
        logger.info(f"User {user_id} successfully activated plan '{plan.name}' with coupon '{coupon.code}'")
        return sub

    async def initiate_payment(
        self, user_id: str, plan_id: str, billing_interval: str = "monthly"
    ) -> PaymentInitiateResponse:
        """
        Architecture-ready payment initiation.
        Creates a PENDING subscription with payment reference abstraction.
        Does NOT falsify payment success.
        """
        plan_query = select(Plan).where(Plan.id == plan_id).options(selectinload(Plan.allowed_apis))
        plan_res = await self.db.execute(plan_query)
        plan = plan_res.scalars().first()
        if not plan:
            raise NotFoundError(f"Plan '{plan_id}' not found.")

        if plan.status != "ACTIVE":
            raise ValidationError("Cannot subscribe to an inactive plan.")

        payment_reference = f"pi_orv_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        duration_days = 365 if billing_interval == "yearly" else 30
        end_date = now + timedelta(days=duration_days)

        plan_snapshot = {
            "id": plan.id,
            "name": plan.name,
            "slug": plan.slug,
            "price": plan.price,
            "currency": plan.currency,
            "billing_interval": billing_interval,
            "monthly_request_limit": plan.monthly_request_limit,
            "rate_limit_per_minute": plan.rate_limit_per_minute,
            "is_all_apis": plan.is_all_apis,
            "allowed_api_slugs": [a.slug for a in plan.allowed_apis],
        }

        # Create PENDING subscription
        sub = Subscription(
            user_id=user_id,
            plan_id=plan.id,
            status="PENDING",
            activation_method="PAYMENT",
            start_date=now,
            end_date=end_date,
            billing_interval=billing_interval,
            amount_paid=plan.price,
            currency=plan.currency,
            plan_snapshot=plan_snapshot,
            payment_reference=payment_reference,
            payment_status="PENDING",
        )
        self.db.add(sub)
        await self.db.commit()
        await self.db.refresh(sub)

        logger.info(f"Initiated pending payment checkout for user {user_id}, plan {plan.name}, ref={payment_reference}")
        return PaymentInitiateResponse(
            subscription_id=sub.id,
            payment_reference=payment_reference,
            status="PENDING",
            plan_name=plan.name,
            amount=plan.price,
            currency=plan.currency,
            billing_interval=billing_interval,
            checkout_url=f"/dashboard/plans/checkout?ref={payment_reference}",
            instructions="Payment provider architecture initialized. In production, this redirects to the payment gateway checkout session. For testing right now, please use coupon code ORVIA100 to instantly activate.",
        )

    async def list_user_history(self, user_id: str) -> List[Subscription]:
        """List past and present subscriptions for a user."""
        query = (
            select(Subscription)
            .where(Subscription.user_id == user_id)
            .options(selectinload(Subscription.plan), selectinload(Subscription.coupon))
            .order_by(Subscription.created_at.desc())
        )
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def check_user_api_access(self, user_id: str, api_slug: str) -> None:
        """
        Centralized API Gateway access control:
        1. Check active subscription exists
        2. Check plan grants access to target API
        3. Check monthly request limit not exceeded
        4. Check rate limit per minute not exceeded
        """
        sub = await self.get_active_subscription_record(user_id)
        if not sub:
            raise NoActivePlanError("An active plan is required to use this API.")

        snapshot = sub.plan_snapshot or {}
        is_all_apis = snapshot.get("is_all_apis", False)
        allowed_slugs = snapshot.get("allowed_api_slugs") or []

        # If not all APIs and not in allowed slugs, check live plan as fallback
        if not is_all_apis and api_slug not in allowed_slugs:
            if sub.plan:
                plan_allowed_slugs = [a.slug for a in sub.plan.allowed_apis]
                if not sub.plan.is_all_apis and api_slug not in plan_allowed_slugs:
                    raise ApiNotInPlanError("Your current plan does not grant access to this API. Please upgrade your plan.")
            else:
                raise ApiNotInPlanError("Your current plan does not grant access to this API. Please upgrade your plan.")

        # Check monthly usage limit
        monthly_limit = snapshot.get("monthly_request_limit") or (sub.plan.monthly_request_limit if sub.plan else 100000)
        log_count_query = select(func.count(ApiRequestLog.id)).where(
            ApiRequestLog.user_id == user_id,
            ApiRequestLog.timestamp >= sub.start_date,
            ApiRequestLog.timestamp <= sub.end_date,
        )
        log_res = await self.db.execute(log_count_query)
        requests_used = log_res.scalar() or 0

        if requests_used >= monthly_limit:
            raise PlanLimitExceededError("Your plan's request limit has been reached.")

        # Check rate limit per minute
        rate_limit = snapshot.get("rate_limit_per_minute") or (sub.plan.rate_limit_per_minute if sub.plan else 60)
        allowed, current_count, _ = api_rate_limiter.is_allowed(f"user_{user_id}", rate_limit)
        if not allowed:
            raise RateLimitError("Rate limit exceeded. Please try again later.")
