from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Friendly identifier for this key")
    rate_limit: Optional[str] = Field(default="60/min", max_length=50)
    expires_in_days: Optional[int] = Field(default=None, ge=1, le=365)


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    owner_id: Optional[str] = None
    status: str
    rate_limit: str
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApiKeyCreatedResponse(ApiKeyResponse):
    """Returned ONLY ONCE upon creation with the plaintext secret key."""
    secret_key: str
