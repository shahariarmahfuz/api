from typing import List, TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.api_key import ApiKey
    from app.models.api_request_log import ApiRequestLog


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="USER", nullable=False)  # USER, ADMIN
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)  # active, suspended, pending

    # Relationships
    api_keys: Mapped[List["ApiKey"]] = relationship("ApiKey", back_populates="owner", cascade="all, delete-orphan")
    request_logs: Mapped[List["ApiRequestLog"]] = relationship("ApiRequestLog", back_populates="user")

    @property
    def is_admin(self) -> bool:
        return self.role.upper() == "ADMIN"
