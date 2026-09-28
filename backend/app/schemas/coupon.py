from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class CouponBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None
    discount_type: str = Field(default="PERCENTAGE", pattern="^(PERCENTAGE|FIXED)$")
    discount_value: float = Field(..., gt=0.0)
    applicable_plan_id: Optional[str] = None
    max_uses: Optional[int] = Field(None, gt=0)
    is_active: bool = True
    valid_until: Optional[datetime] = None

    @field_validator("code")
    @classmethod
    def uppercase_code(cls, v: str) -> str:
        return v.strip().upper()


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    description: Optional[str] = None
    discount_type: Optional[str] = Field(None, pattern="^(PERCENTAGE|FIXED)$")
    discount_value: Optional[float] = Field(None, gt=0.0)
    applicable_plan_id: Optional[str] = None
    max_uses: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None
    valid_until: Optional[datetime] = None


class CouponStatusUpdate(BaseModel):
    is_active: bool


class CouponResponse(CouponBase):
    id: str
    times_used: int
    valid_from: datetime
    created_at: datetime
    updated_at: datetime
    applicable_plan_name: Optional[str] = None

    class Config:
        from_attributes = True


class CouponValidateRequest(BaseModel):
    code: str
    plan_id: str

    @field_validator("code")
    @classmethod
    def uppercase_code(cls, v: str) -> str:
        return v.strip().upper()


class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_type: str
    discount_value: float
    original_price: float
    discount_amount: float
    final_price: float
    applicable_plan_id: Optional[str] = None
    message: str
