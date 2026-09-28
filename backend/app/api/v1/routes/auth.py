from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.schemas.common import StandardResponse
from app.services.auth_service import AuthService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=StandardResponse[UserResponse], status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    auth_service = AuthService(db)
    user = await auth_service.register(user_in)
    return StandardResponse(
        success=True,
        data=user,
        message="User successfully registered.",
    )


@router.post("/login", response_model=StandardResponse[TokenResponse])
async def login(login_in: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT bearer token."""
    auth_service = AuthService(db)
    token_resp = await auth_service.login(login_in)
    return StandardResponse(
        success=True,
        data=token_resp,
        message="Authentication successful.",
    )


@router.get("/me", response_model=StandardResponse[UserResponse])
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get profile of currently authenticated user."""
    return StandardResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
    )
