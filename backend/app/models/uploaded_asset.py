from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, generate_uuid

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.api_key import ApiKey
    from app.models.api_registry import ApiRegistry


class UploadedAsset(Base):
    __tablename__ = "uploaded_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    api_key_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("api_keys.id", ondelete="SET NULL"), nullable=True, index=True)
    api_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("api_registry.id", ondelete="SET NULL"), nullable=True, index=True)

    cloudinary_public_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    secure_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    format: Mapped[str] = mapped_column(String(20), nullable=False)
    bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User")
    api_key: Mapped[Optional["ApiKey"]] = relationship("ApiKey")
    api: Mapped[Optional["ApiRegistry"]] = relationship("ApiRegistry")
