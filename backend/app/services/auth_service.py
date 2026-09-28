from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    UserSignup,
    UserLogin,
    UserResponse,
    TokenResponse,
    UserProfileUpdate,
    UserPasswordChange,
)
from app.models.user import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
)
from app.core.errors import (
    AuthenticationError,
    DuplicateResourceError,
    NotFoundError,
    ValidationError,
)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def signup(self, signup_in: UserSignup) -> UserResponse:
        existing = await self.user_repo.get_by_email(signup_in.email)
        if existing:
            raise DuplicateResourceError(f"An account with email '{signup_in.email}' already exists.")

        user = User(
            name=signup_in.name.strip(),
            email=signup_in.email.lower().strip(),
            hashed_password=hash_password(signup_in.password),
            role="USER",
            status="active",
        )
        created = await self.user_repo.create(user)
        return UserResponse.model_validate(created)

    async def login(self, login_in: UserLogin) -> TokenResponse:
        user = await self.user_repo.get_by_email(login_in.email)
        if not user or not verify_password(login_in.password, user.hashed_password):
            raise AuthenticationError("Invalid email or password.")

        if user.status != "active":
            raise AuthenticationError(f"Account is {user.status}. Please contact an administrator.")

        token = create_access_token({
            "sub": user.id,
            "email": user.email,
            "role": user.role.upper(),
            "name": user.name,
        })
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    async def forgot_password(self, email: str) -> Dict[str, Any]:
        user = await self.user_repo.get_by_email(email)
        if not user:
            # For security, avoid leaking whether the email exists, but return success message
            return {
                "message": "If this email is registered, password reset instructions have been generated.",
                "reset_token": None,
            }

        token = create_password_reset_token(user.email)
        return {
            "message": "Password reset token generated successfully.",
            "reset_token": token,  # Exposed for developer convenience / demo environment
        }

    async def reset_password(self, token: str, new_password: str) -> bool:
        try:
            email = decode_password_reset_token(token)
        except ValueError as e:
            raise ValidationError(str(e))

        user = await self.user_repo.get_by_email(email)
        if not user:
            raise NotFoundError("User not found.")

        user.hashed_password = hash_password(new_password)
        await self.db.flush()
        return True

    async def change_password(self, user_id: str, change_in: UserPasswordChange) -> bool:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found.")

        if not verify_password(change_in.current_password, user.hashed_password):
            raise ValidationError("Current password is incorrect.")

        user.hashed_password = hash_password(change_in.new_password)
        await self.db.flush()
        return True

    async def update_profile(self, user_id: str, update_in: UserProfileUpdate) -> UserResponse:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found.")

        if update_in.name:
            user.name = update_in.name.strip()
        if update_in.email:
            new_email = update_in.email.lower().strip()
            if new_email != user.email:
                existing = await self.user_repo.get_by_email(new_email)
                if existing:
                    raise DuplicateResourceError(f"Email '{new_email}' is already in use.")
                user.email = new_email

        await self.db.flush()
        await self.db.refresh(user)
        return UserResponse.model_validate(user)

    async def get_current_user(self, user_id: str) -> UserResponse:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found.")
        return UserResponse.model_validate(user)
