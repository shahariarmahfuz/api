import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Any, Dict
import bcrypt
import jwt
from app.core.config import settings


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def create_password_reset_token(email: str, expires_minutes: int = 30) -> str:
    """Create a signed password reset JWT token valid for 30 minutes."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload = {
        "sub": email.lower().strip(),
        "type": "password_reset",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_password_reset_token(token: str) -> str:
    """Decode and validate password reset token, returning the subject email."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "password_reset":
            raise ValueError("Invalid token type.")
        email = payload.get("sub")
        if not email:
            raise ValueError("Token missing email.")
        return email
    except Exception as e:
        raise ValueError(f"Invalid or expired reset token: {str(e)}")


def generate_api_key(prefix: str = settings.API_KEY_PREFIX) -> Tuple[str, str, str]:
    """
    Generate a cryptographically secure API key.
    Returns:
        (full_secret_key, key_prefix, key_hash)
        - full_secret_key: Shown ONLY ONCE to the user upon creation.
        - key_prefix: Stored in DB for display/identification (e.g. "orv_live_8f3a...")
        - key_hash: SHA-256 hash stored in DB for verification.
    """
    random_bytes = secrets.token_hex(20)
    full_key = f"{prefix}{random_bytes}"
    key_prefix = f"{full_key[:14]}..."
    key_hash = hash_api_key(full_key)
    return full_key, key_prefix, key_hash


def hash_api_key(secret_key: str) -> str:
    """Calculate SHA-256 hash of API key for secure database storage."""
    return hashlib.sha256(secret_key.strip().encode("utf-8")).hexdigest()
