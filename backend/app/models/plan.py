from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlalchemy import String, Boolean, Text, Integer, Float, ForeignKey, Table, Column, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.api_registry import ApiRegistry
    from app.models.subscription import Subscription
    from app.models.coupon import Coupon


# Association table between Plan and ApiRegistry for explicit API entitlement
plan_api_access = Table(
    "plan_api_access",
    Base.metadata,
    Column("plan_id", String(36), ForeignKey("plans.id", ondelete="CASCADE"), primary_key=True),
    Column("api_id", String(36), ForeignKey("api_registry.id", ondelete="CASCADE"), primary_key=True),
)


class Plan(Base, TimestampMixin):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    billing_interval: Mapped[str] = mapped_column(String(20), default="monthly", nullable=False)  # monthly, yearly
    duration_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    monthly_request_limit: Mapped[int] = mapped_column(Integer, default=100000, nullable=False)
    rate_limit_per_minute: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    max_concurrent_requests: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    is_all_apis: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    features: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", index=True, nullable=False)  # ACTIVE, INACTIVE

    # Relationships
    allowed_apis: Mapped[List["ApiRegistry"]] = relationship(
        "ApiRegistry",
        secondary=plan_api_access,
        lazy="selectin",
    )
    subscriptions: Mapped[List["Subscription"]] = relationship(
        "Subscription",
        back_populates="plan",
        lazy="selectin",
    )
    coupons: Mapped[List["Coupon"]] = relationship(
        "Coupon",
        back_populates="applicable_plan",
        lazy="selectin",
    )
