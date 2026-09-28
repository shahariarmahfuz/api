from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator
from app.schemas.plan import PlanResponse


class SubscriptionBase(BaseModel):
    plan_id: str
    activation_method: str = Field(default="COUPON", pattern="^(COUPON|PAYMENT)$")
    billing_interval: str = Field(default="monthly", pattern="^(monthly|yearly)$")


class CouponActivationRequest(BaseModel):
    plan_id: str
    coupon_code: str

    @field_validator("coupon_code")
    @classmethod
    def clean_coupon(cls, v: str) -> str:
        return v.strip().upper()


class PaymentInitiateRequest(BaseModel):
    plan_id: str
    billing_interval: str = Field(default="monthly", pattern="^(monthly|yearly)$")


class PaymentInitiateResponse(BaseModel):
    subscription_id: str
    payment_reference: str
    status: str
    plan_name: str
    amount: float
    currency: str
    billing_interval: str
    checkout_url: Optional[str] = None
    instructions: str


class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    plan_id: str
    status: str
    activation_method: str
    start_date: datetime
    end_date: datetime
    billing_interval: str
    amount_paid: float
    currency: str
    plan_snapshot: Dict[str, Any]
    payment_reference: Optional[str] = None
    payment_status: str
    coupon_id: Optional[str] = None
    created_at: datetime
    plan: Optional[PlanResponse] = None

    class Config:
        from_attributes = True


class ActiveSubscriptionUsage(BaseModel):
    requests_used: int = 0
    requests_limit: int = 0
    usage_percentage: float = 0.0
    rate_limit_per_minute: int = 60
    period_start: datetime
    period_end: datetime
    days_remaining: int = 0


class ActiveSubscriptionResponse(BaseModel):
    has_active_plan: bool
    subscription: Optional[SubscriptionResponse] = None
    usage: Optional[ActiveSubscriptionUsage] = None
