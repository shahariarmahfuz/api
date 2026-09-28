from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.core.errors import AuthenticationError, DuplicateResourceError, NotFoundError


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def register(self, user_in: UserCreate) -> UserResponse:
        existing = await self.user_repo.get_by_email(user_in.email)
        if existing:
            raise DuplicateResourceError(f"User with email '{user_in.email}' already exists.")

        user = User(
            name=user_in.name,
            email=user_in.email.lower().strip(),
            hashed_password=hash_password(user_in.password),
            role=user_in.role or "developer",
            status="active",
        )
        created = await self.user_repo.create(user)
        return UserResponse.model_validate(created)

    async def login(self, login_in: UserLogin) -> TokenResponse:
        user = await self.user_repo.get_by_email(login_in.email)
        if not user or not verify_password(login_in.password, user.hashed_password):
            raise AuthenticationError("Invalid email or password.")

        if user.status != "active":
            raise AuthenticationError(f"Account is {user.status}.")

        token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    async def get_current_user(self, user_id: str) -> UserResponse:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found.")
        return UserResponse.model_validate(user)
