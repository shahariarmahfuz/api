from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import logger
from app.core.database import engine, AsyncSessionLocal
from app.models.base import Base
from app.core.errors import (
    OrviaException,
    orvia_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    unhandled_exception_handler,
)
from app.core.middleware import RequestTracingMiddleware, RequestLoggingMiddleware
from app.api.router import api_router
from app.seed import seed_initial_data
from app.modules.registry import module_registry


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle startup and shutdown handler."""
    logger.info(f"Starting {settings.APP_NAME} API Platform v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")

    # 1. Ensure database tables are created
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")

    # 2. Sync modular manifests and seed initial data
    try:
        async with AsyncSessionLocal() as session:
            await module_registry.sync_to_database(session)
            await seed_initial_data(session)
        logger.info("Platform registry and initial seed data verified.")
    except Exception as e:
        logger.error(f"Failed to seed initial data: {e}")

    yield

    # Shutdown
    logger.info("Shutting down Orvia backend. Disposing connection pool...")
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Orvia is a production-ready, modular API platform designed for scalability, centralized discovery, and rapid API extensibility.",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Exception handlers
app.add_exception_handler(OrviaException, orvia_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Custom Middlewares (order matters: Trace first, then Logging, then CORS)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RequestTracingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# Mount API routes
app.include_router(api_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "platform": settings.APP_NAME,
        "tagline": "Modular API Platform",
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "health_check": "/health",
        "api_v1_prefix": settings.API_V1_PREFIX,
    }
