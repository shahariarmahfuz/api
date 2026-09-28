from datetime import datetime, timezone
from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlalchemy import String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.plan import Plan
    from app.models.coupon import Coupon


class Subscription(Base, TimestampMixin):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("plans.id", ondelete="RESTRICT"), index=True, nullable=False)
    
    # Status: ACTIVE, EXPIRED, CANCELLED, PENDING
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", index=True, nullable=False)
    # Activation method: COUPON, PAYMENT
    activation_method: Mapped[str] = mapped_column(String(20), default="COUPON", nullable=False)
    
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    billing_interval: Mapped[str] = mapped_column(String(20), default="monthly", nullable=False)
    
    # Financial snapshot
    amount_paid: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    
    # Technical snapshot of plan configuration at activation time
    plan_snapshot: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    
    # Payment gateway abstraction fields
    payment_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(20), default="COMPLETED", nullable=False)  # PENDING, COMPLETED, FAILED, WAIVED
    
    # Coupon link if activated via coupon
    coupon_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("coupons.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="subscriptions")
    plan: Mapped["Plan"] = relationship("Plan", back_populates="subscriptions", lazy="selectin")
    coupon: Mapped[Optional["Coupon"]] = relationship("Coupon", lazy="selectin")
    usage_record: Mapped[Optional["CouponUsage"]] = relationship("CouponUsage", back_populates="subscription", uselist=False)

    @property
    def is_currently_active(self) -> bool:
        now = datetime.now(timezone.utc)
        return self.status == "ACTIVE" and self.end_date > now


class CouponUsage(Base):
    __tablename__ = "coupon_usages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    coupon_id: Mapped[str] = mapped_column(String(36), ForeignKey("coupons.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    subscription_id: Mapped[str] = mapped_column(String(36), ForeignKey("subscriptions.id", ondelete="CASCADE"), index=True, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    coupon: Mapped["Coupon"] = relationship("Coupon", back_populates="usages")
    user: Mapped["User"] = relationship("User")
    subscription: Mapped["Subscription"] = relationship("Subscription", back_populates="usage_record")
