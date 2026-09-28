from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, generate_uuid

if TYPE_CHECKING:
    from app.models.api_registry import ApiRegistry
    from app.models.api_key import ApiKey
    from app.models.user import User


class ApiRequestLog(Base):
    __tablename__ = "api_request_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    request_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    api_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("api_registry.id", ondelete="SET NULL"),
        nullable=True,
    )
    endpoint: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    response_time_ms: Mapped[float] = mapped_column(Float, nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)

    api_key_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("api_keys.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    api: Mapped[Optional["ApiRegistry"]] = relationship("ApiRegistry", back_populates="logs")
    api_key: Mapped[Optional["ApiKey"]] = relationship("ApiKey", back_populates="logs")
    user: Mapped[Optional["User"]] = relationship("User", back_populates="request_logs")

    __table_args__ = (
        Index("idx_request_logs_timestamp_status", "timestamp", "status_code"),
    )
