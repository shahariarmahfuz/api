from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, model_validator


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr


class UserSignup(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)

    @model_validator(mode="after")
    def check_passwords_match(self) -> "UserSignup":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    role: Optional[str] = "USER"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)

    @model_validator(mode="after")
    def check_passwords_match(self) -> "ResetPasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None


class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)

    @model_validator(mode="after")
    def check_passwords_match(self) -> "UserPasswordChange":
        if self.new_password != self.confirm_password:
            raise ValueError("New passwords do not match.")
        return self


class UserAdminUpdateRole(BaseModel):
    role: str = Field(..., pattern="^(USER|ADMIN|user|admin)$")


class UserAdminUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(active|suspended|pending)$")


class UserResponse(UserBase):
    id: str
    role: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserDetailResponse(UserResponse):
    keys_count: int = 0
    requests_count: int = 0


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserUsageStatsResponse(BaseModel):
    total_requests: int
    requests_today: int
    api_keys_count: int
    active_apis_count: int
    success_requests: int
    error_requests: int
    avg_response_time_ms: float
    usage_by_api: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
