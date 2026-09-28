from typing import Dict, Any
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.user import (
    UserSignup,
    UserLogin,
    UserResponse,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.common import StandardResponse
from app.services.auth_service import AuthService
from app.api.deps import require_authenticated_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=StandardResponse[UserResponse], status_code=status.HTTP_201_CREATED)
async def signup(signup_in: UserSignup, db: AsyncSession = Depends(get_db)):
    """Create a new user account with validated credentials."""
    auth_service = AuthService(db)
    user = await auth_service.signup(signup_in)
    return StandardResponse(
        success=True,
        data=user,
        message="Account created successfully. You can now log in.",
    )


@router.post("/register", response_model=StandardResponse[UserResponse], status_code=status.HTTP_201_CREATED)
async def register_alias(signup_in: UserSignup, db: AsyncSession = Depends(get_db)):
    """Alias for /signup endpoint."""
    return await signup(signup_in, db)


@router.post("/login", response_model=StandardResponse[TokenResponse])
async def login(login_in: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return signed JWT bearer token."""
    auth_service = AuthService(db)
    token_resp = await auth_service.login(login_in)

    # Set HTTP-only cookie as an additional auth transport
    response.set_cookie(
        key="orvia_token",
        value=token_resp.access_token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
    )

    return StandardResponse(
        success=True,
        data=token_resp,
        message="Authentication successful.",
    )


@router.post("/logout", response_model=StandardResponse[Dict[str, str]])
async def logout(response: Response):
    """Clear session token."""
    response.delete_cookie(key="orvia_token")
    return StandardResponse(
        success=True,
        data={"status": "logged_out"},
        message="Successfully logged out.",
    )


@router.post("/forgot-password", response_model=StandardResponse[Dict[str, Any]])
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Generate password reset token for given email."""
    auth_service = AuthService(db)
    result = await auth_service.forgot_password(req.email)
    return StandardResponse(
        success=True,
        data=result,
        message=result["message"],
    )


@router.post("/reset-password", response_model=StandardResponse[Dict[str, str]])
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using verified reset token."""
    auth_service = AuthService(db)
    await auth_service.reset_password(req.token, req.new_password)
    return StandardResponse(
        success=True,
        data={"status": "password_reset_success"},
        message="Your password has been successfully reset. Please log in.",
    )


@router.get("/me", response_model=StandardResponse[UserResponse])
async def get_current_user_profile(current_user: User = Depends(require_authenticated_user)):
    """Get profile of currently authenticated user."""
    return StandardResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
    )
