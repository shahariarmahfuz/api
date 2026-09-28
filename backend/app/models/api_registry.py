from typing import Optional, Dict, Any, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.api_request_log import ApiRequestLog


class ApiRegistry(Base, TimestampMixin):
    __tablename__ = "api_registry"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(80), index=True, nullable=False)  # image, video, utility, ai, data, developer_tools, other
    version: Mapped[str] = mapped_column(String(20), default="v1", nullable=False)
    method: Mapped[str] = mapped_column(String(10), default="GET", nullable=False)  # GET, POST, PUT, DELETE, etc.
    endpoint: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)  # active, beta, deprecated, disabled
    authentication_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rate_limit: Mapped[str] = mapped_column(String(50), default="60/min", nullable=False)

    # Rich metadata for documentation, schema parameters, examples
    documentation: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)

    # Relationships
    logs: Mapped[List["ApiRequestLog"]] = relationship("ApiRequestLog", back_populates="api")
