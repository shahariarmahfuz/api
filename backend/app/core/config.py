import os
from typing import List, Union
from urllib.parse import urlparse, urlunparse
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Orvia"
    APP_DESCRIPTION: str = "Orvia — Production-Ready Modular API Platform"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://neondb_owner:npg_3TkGHpOnFx7m@ep-shy-base-b3p8bplr-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # Security & JWT
    SECRET_KEY: str = "orvia-platform-super-secret-key-production-ready-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # API Key Configuration
    API_KEY_PREFIX: str = "orv_live_"

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    @property
    def async_database_url(self) -> str:
        """
        Normalize database URL for SQLAlchemy asyncpg engine.
        Handles neon/aws connection strings by stripping URL parameters that asyncpg
        requires via connect_args or doesn't support in query strings.
        """
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]

        parsed = urlparse(url)
        # Use postgresql+asyncpg scheme
        return urlunparse((
            "postgresql+asyncpg",
            parsed.netloc,
            parsed.path,
            "",
            "",
            ""
        ))

    @property
    def is_ssl_required(self) -> bool:
        """Determines if SSL connection is required (e.g. Neon, AWS RDS)."""
        return "sslmode=require" in self.DATABASE_URL or "neon.tech" in self.DATABASE_URL

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
