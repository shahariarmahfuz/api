from typing import List, Optional
from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.common import StandardResponse
from app.schemas.subscription import (
    ActiveSubscriptionResponse,
    SubscriptionResponse,
    CouponActivationRequest,
    PaymentInitiateRequest,
    PaymentInitiateResponse,
)
from app.schemas.coupon import CouponValidateRequest, CouponValidateResponse
from app.api.deps import require_user
from app.models.user import User
from app.services.subscription_service import SubscriptionService
from app.services.coupon_service import CouponService

router = APIRouter(prefix="/user/subscription", tags=["User Subscriptions"])


@router.get("/active", response_model=StandardResponse[ActiveSubscriptionResponse])
async def get_active_subscription(
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's active subscription, snapshot limits, and current period usage.
    Returns has_active_plan: false if user has no active subscription.
    """
    sub_service = SubscriptionService(db)
    details = await sub_service.get_user_active_subscription_details(current_user.id)
    return StandardResponse(
        success=True,
        data=details,
        message="Active subscription details retrieved.",
    )


@router.post("/validate-coupon", response_model=StandardResponse[CouponValidateResponse])
async def validate_coupon(
    payload: CouponValidateRequest,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Validate a coupon code against a plan and compute discount before activation.
    """
    coupon_service = CouponService(db)
    result = await coupon_service.validate_coupon(
        code=payload.code,
        plan_id=payload.plan_id,
        user_id=current_user.id,
    )
    return StandardResponse(
        success=True,
        data=result,
        message=result.message,
    )


@router.post("/activate-coupon", response_model=StandardResponse[SubscriptionResponse])
async def activate_with_coupon(
    payload: CouponActivationRequest,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Activate a plan using a valid coupon code.
    Immediately creates active subscription and registers coupon usage.
    """
    sub_service = SubscriptionService(db)
    subscription = await sub_service.activate_with_coupon(
        user_id=current_user.id,
        plan_id=payload.plan_id,
        coupon_code=payload.coupon_code,
    )
    return StandardResponse(
        success=True,
        data=SubscriptionResponse.model_validate(subscription),
        message="Plan successfully activated!",
    )


@router.post("/initiate-payment", response_model=StandardResponse[PaymentInitiateResponse])
async def initiate_payment(
    payload: PaymentInitiateRequest,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a pending subscription and payment checkout intent abstraction.
    Does NOT falsify payment success.
    """
    sub_service = SubscriptionService(db)
    result = await sub_service.initiate_payment(
        user_id=current_user.id,
        plan_id=payload.plan_id,
        billing_interval=payload.billing_interval,
    )
    return StandardResponse(
        success=True,
        data=result,
        message="Payment intent created. Direct payment gateway integration pending.",
    )


@router.get("/history", response_model=StandardResponse[List[SubscriptionResponse]])
async def list_subscription_history(
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """List subscription history for current user."""
    sub_service = SubscriptionService(db)
    history = await sub_service.list_user_history(current_user.id)
    return StandardResponse(
        success=True,
        data=[SubscriptionResponse.model_validate(s) for s in history],
        message="Subscription history retrieved.",
    )
