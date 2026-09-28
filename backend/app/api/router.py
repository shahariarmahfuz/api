from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.core.database import check_database_health
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.user import router as user_router
from app.api.v1.routes.admin import router as admin_router
from app.api.v1.routes.registry import router as registry_router
from app.api.v1.routes.api_keys import router as api_keys_router
from app.api.v1.routes.logs import router as logs_router
from app.api.v1.routes.system import router as system_router
from app.api.v1.routes.tester import router as tester_router
from app.api.v1.routes.plans import router as plans_router
from app.api.v1.routes.subscriptions import router as subscriptions_router
from app.modules.registry import module_registry

api_router = APIRouter()


@api_router.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint verifying application uptime and database connectivity.
    """
    db_health = await check_database_health()
    is_healthy = db_health.get("status") == "connected"

    return {
        "status": "healthy" if is_healthy else "degraded",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_health,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# V1 API Router aggregation
v1_router = APIRouter(prefix=settings.API_V1_PREFIX)
v1_router.include_router(auth_router)
v1_router.include_router(user_router)
v1_router.include_router(admin_router)
v1_router.include_router(registry_router)
v1_router.include_router(api_keys_router)
v1_router.include_router(logs_router)
v1_router.include_router(system_router)
v1_router.include_router(tester_router)
v1_router.include_router(plans_router)
v1_router.include_router(subscriptions_router)


# Mount dynamically registered modular API routers
for mod_router in module_registry.get_routers():
    v1_router.include_router(mod_router)

api_router.include_router(v1_router)
