from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class PlanBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=5)
    price: float = Field(..., ge=0.0)
    currency: str = Field(default="USD", max_length=10)
    billing_interval: str = Field(default="monthly", pattern="^(monthly|yearly)$")
    duration_days: int = Field(default=30, gt=0)
    monthly_request_limit: int = Field(..., gt=0)
    rate_limit_per_minute: int = Field(..., gt=0)
    max_concurrent_requests: int = Field(default=10, gt=0)
    is_all_apis: bool = Field(default=False)
    features: Optional[List[str]] = Field(default_factory=list)
    status: str = Field(default="ACTIVE", pattern="^(ACTIVE|INACTIVE)$")


class PlanCreate(PlanBase):
    api_ids: Optional[List[str]] = Field(default_factory=list)


class PlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0.0)
    currency: Optional[str] = None
    billing_interval: Optional[str] = Field(None, pattern="^(monthly|yearly)$")
    duration_days: Optional[int] = Field(None, gt=0)
    monthly_request_limit: Optional[int] = Field(None, gt=0)
    rate_limit_per_minute: Optional[int] = Field(None, gt=0)
    max_concurrent_requests: Optional[int] = Field(None, gt=0)
    is_all_apis: Optional[bool] = None
    features: Optional[List[str]] = None
    status: Optional[str] = Field(None, pattern="^(ACTIVE|INACTIVE)$")
    api_ids: Optional[List[str]] = None


class PlanStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(ACTIVE|INACTIVE)$")


class ApiSummary(BaseModel):
    id: str
    name: str
    slug: str
    category: str
    method: str
    endpoint: str

    class Config:
        from_attributes = True



class PlanResponse(PlanBase):
    id: str
    created_at: datetime
    updated_at: datetime
    allowed_apis: Optional[List[ApiSummary]] = Field(default_factory=list)
    active_subscribers_count: Optional[int] = 0

    class Config:
        from_attributes = True


class PlanDetailResponse(PlanResponse):
    pass
