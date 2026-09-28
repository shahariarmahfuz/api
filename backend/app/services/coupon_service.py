from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.models.coupon import Coupon
from app.models.subscription import CouponUsage
from app.models.plan import Plan
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponValidateResponse
from app.core.errors import NotFoundError, DuplicateResourceError, ValidationError
from app.core.logging import logger


class CouponService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_admin_coupons(self) -> List[Dict[str, Any]]:
        """List all coupons with plan details and usage metrics for the Admin Panel."""
        query = select(Coupon).options(selectinload(Coupon.applicable_plan)).order_by(Coupon.created_at.desc())
        res = await self.db.execute(query)
        coupons = res.scalars().all()

        results = []
        for c in coupons:
            results.append({
                "id": c.id,
                "code": c.code,
                "description": c.description,
                "discount_type": c.discount_type,
                "discount_value": c.discount_value,
                "applicable_plan_id": c.applicable_plan_id,
                "applicable_plan_name": c.applicable_plan.name if c.applicable_plan else "All Eligible Plans",
                "max_uses": c.max_uses,
                "times_used": c.times_used,
                "is_active": c.is_active,
                "valid_from": c.valid_from,
                "valid_until": c.valid_until,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
            })
        return results

    async def get_by_id(self, coupon_id: str) -> Coupon:
        query = select(Coupon).where(Coupon.id == coupon_id).options(selectinload(Coupon.applicable_plan))
        res = await self.db.execute(query)
        coupon = res.scalars().first()
        if not coupon:
            raise NotFoundError(f"Coupon with id '{coupon_id}' not found.")
        return coupon

    async def get_by_code(self, code: str) -> Optional[Coupon]:
        clean_code = code.strip().upper()
        query = select(Coupon).where(Coupon.code == clean_code).options(selectinload(Coupon.applicable_plan))
        res = await self.db.execute(query)
        return res.scalars().first()

    async def create_coupon(self, data: CouponCreate) -> Coupon:
        clean_code = data.code.strip().upper()
        existing = await self.get_by_code(clean_code)
        if existing:
            raise DuplicateResourceError(f"Coupon code '{clean_code}' already exists.")

        if data.applicable_plan_id:
            plan_res = await self.db.execute(select(Plan).where(Plan.id == data.applicable_plan_id))
            if not plan_res.scalars().first():
                raise NotFoundError("The selected applicable plan does not exist.")

        coupon = Coupon(
            code=clean_code,
            description=data.description,
            discount_type=data.discount_type,
            discount_value=data.discount_value,
            applicable_plan_id=data.applicable_plan_id,
            max_uses=data.max_uses,
            is_active=data.is_active,
            valid_until=data.valid_until,
        )
        self.db.add(coupon)
        await self.db.commit()
        await self.db.refresh(coupon)
        logger.info(f"Created coupon: {coupon.code} ({coupon.discount_type}: {coupon.discount_value})")
        return coupon

    async def update_coupon(self, coupon_id: str, data: CouponUpdate) -> Coupon:
        coupon = await self.get_by_id(coupon_id)
        update_fields = data.model_dump(exclude_unset=True)

        if "applicable_plan_id" in update_fields and update_fields["applicable_plan_id"]:
            plan_res = await self.db.execute(select(Plan).where(Plan.id == update_fields["applicable_plan_id"]))
            if not plan_res.scalars().first():
                raise NotFoundError("The selected applicable plan does not exist.")

        for key, value in update_fields.items():
            setattr(coupon, key, value)

        await self.db.commit()
        await self.db.refresh(coupon)
        logger.info(f"Updated coupon: {coupon.id} ({coupon.code})")
        return coupon

    async def toggle_status(self, coupon_id: str, is_active: bool) -> Coupon:
        coupon = await self.get_by_id(coupon_id)
        coupon.is_active = is_active
        await self.db.commit()
        await self.db.refresh(coupon)
        logger.info(f"Toggled coupon {coupon.code} is_active to {is_active}")
        return coupon

    async def validate_coupon(
        self, code: str, plan_id: str, user_id: Optional[str] = None
    ) -> CouponValidateResponse:
        """
        Authoritative server-side coupon validation.
        Validates existence, status, expiration, limits, plan compatibility, and user eligibility.
        """
        clean_code = code.strip().upper()
        coupon = await self.get_by_code(clean_code)

        if not coupon:
            raise ValidationError(f"Invalid coupon code '{clean_code}'.")

        if not coupon.is_active:
            raise ValidationError("This coupon is currently inactive.")

        now = datetime.now(timezone.utc)
        if coupon.valid_until and coupon.valid_until < now:
            raise ValidationError("This coupon has expired.")

        if coupon.max_uses is not None and coupon.times_used >= coupon.max_uses:
            raise ValidationError("This coupon has reached its maximum redemption limit.")

        # Check plan applicability
        if coupon.applicable_plan_id and coupon.applicable_plan_id != plan_id:
            plan_name = coupon.applicable_plan.name if coupon.applicable_plan else "another plan"
            raise ValidationError(f"Coupon '{clean_code}' is only valid for the {plan_name}.")

        # Check if user has already redeemed this coupon
        if user_id:
            usage_query = select(CouponUsage).where(
                CouponUsage.coupon_id == coupon.id,
                CouponUsage.user_id == user_id,
            )
            usage_res = await self.db.execute(usage_query)
            if usage_res.scalars().first():
                raise ValidationError("You have already redeemed this coupon code.")

        # Fetch plan price to calculate discount
        plan_res = await self.db.execute(select(Plan).where(Plan.id == plan_id))
        plan = plan_res.scalars().first()
        if not plan:
            raise NotFoundError("Specified plan was not found.")

        original_price = float(plan.price)
        if coupon.discount_type == "PERCENTAGE":
            discount_amount = round(original_price * (coupon.discount_value / 100.0), 2)
        else:
            discount_amount = round(min(original_price, coupon.discount_value), 2)

        final_price = max(0.0, round(original_price - discount_amount, 2))

        discount_label = f"{coupon.discount_value}% OFF" if coupon.discount_type == "PERCENTAGE" else f"${coupon.discount_value} OFF"
        return CouponValidateResponse(
            valid=True,
            code=coupon.code,
            discount_type=coupon.discount_type,
            discount_value=coupon.discount_value,
            original_price=original_price,
            discount_amount=discount_amount,
            final_price=final_price,
            applicable_plan_id=coupon.applicable_plan_id,
            message=f"Coupon applied successfully! ({discount_label})",
        )
