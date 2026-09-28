import math
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_, and_
from app.models.user import User
from app.models.api_registry import ApiRegistry
from app.models.api_key import ApiKey
from app.models.api_request_log import ApiRequestLog
from app.schemas.user import UserDetailResponse, UserResponse
from app.schemas.api_key import ApiKeyResponse
from app.schemas.api_request_log import ApiRequestLogResponse
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.core.errors import NotFoundError, PermissionDeniedError, ValidationError


class AdminService:
    """Service handling platform-wide administration operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_overview(self) -> Dict[str, Any]:
        # Users telemetry
        total_users = (await self.db.execute(select(func.count()).select_from(User))).scalar() or 0
        active_users = (
            await self.db.execute(select(func.count()).select_from(User).where(User.status == "active"))
        ).scalar() or 0

        # APIs telemetry
        total_apis = (await self.db.execute(select(func.count()).select_from(ApiRegistry))).scalar() or 0
        active_apis = (
            await self.db.execute(select(func.count()).select_from(ApiRegistry).where(ApiRegistry.status == "active"))
        ).scalar() or 0

        # Requests telemetry
        total_requests = (await self.db.execute(select(func.count()).select_from(ApiRequestLog))).scalar() or 0
        avg_res = (await self.db.execute(select(func.avg(ApiRequestLog.response_time_ms)))).scalar()
        avg_latency_ms = round(float(avg_res), 2) if avg_res else 0.0

        # Recent platform activity
        recent_stmt = select(ApiRequestLog).order_by(desc(ApiRequestLog.timestamp)).limit(10)
        recent_logs = (await self.db.execute(recent_stmt)).scalars().all()

        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_apis": total_apis,
            "active_apis": active_apis,
            "total_requests": total_requests,
            "avg_latency_ms": avg_latency_ms,
            "recent_activity": [
                {
                    "id": l.id,
                    "endpoint": l.endpoint,
                    "method": l.method,
                    "status_code": l.status_code,
                    "response_time_ms": l.response_time_ms,
                    "timestamp": l.timestamp.isoformat(),
                    "user_id": l.user_id,
                }
                for l in recent_logs
            ],
        }

    async def list_users(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedResponse[UserDetailResponse]:
        skip = (page - 1) * page_size
        filters = []

        if search:
            s = f"%{search.strip().lower()}%"
            filters.append(or_(func.lower(User.name).like(s), func.lower(User.email).like(s)))
        if role and role.lower() != "all":
            filters.append(func.upper(User.role) == role.upper())
        if status and status.lower() != "all":
            filters.append(User.status == status.lower())

        count_stmt = select(func.count()).select_from(User)
        if filters:
            count_stmt = count_stmt.where(and_(*filters))
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = select(User)
        if filters:
            stmt = stmt.where(and_(*filters))
        stmt = stmt.order_by(desc(User.created_at)).offset(skip).limit(page_size)
        users = (await self.db.execute(stmt)).scalars().all()

        # Gather keys & requests count for each user
        user_details = []
        for u in users:
            k_count = (
                await self.db.execute(
                    select(func.count()).select_from(ApiKey).where(ApiKey.owner_id == u.id)
                )
            ).scalar() or 0
            r_count = (
                await self.db.execute(
                    select(func.count()).select_from(ApiRequestLog).where(ApiRequestLog.user_id == u.id)
                )
            ).scalar() or 0

            user_details.append(
                UserDetailResponse(
                    id=u.id,
                    name=u.name,
                    email=u.email,
                    role=u.role.upper(),
                    status=u.status,
                    created_at=u.created_at,
                    updated_at=u.updated_at,
                    keys_count=k_count,
                    requests_count=r_count,
                )
            )

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        return PaginatedResponse(
            success=True,
            data=user_details,
            pagination=PaginationMeta(
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            ),
        )

    async def get_user_details(self, user_id: str) -> Dict[str, Any]:
        stmt = select(User).where(User.id == user_id)
        user = (await self.db.execute(stmt)).scalars().first()
        if not user:
            raise NotFoundError("User not found.")

        # Keys
        keys = (
            await self.db.execute(
                select(ApiKey).where(ApiKey.owner_id == user_id).order_by(desc(ApiKey.created_at))
            )
        ).scalars().all()

        # Total calls
        req_count = (
            await self.db.execute(
                select(func.count()).select_from(ApiRequestLog).where(ApiRequestLog.user_id == user_id)
            )
        ).scalar() or 0

        return {
            "user": UserResponse.model_validate(user),
            "keys": [ApiKeyResponse.model_validate(k) for k in keys],
            "total_requests": req_count,
        }

    async def update_user_status(self, admin_id: str, target_user_id: str, new_status: str) -> UserResponse:
        # Safeguard: cannot deactivate self
        if admin_id == target_user_id and new_status != "active":
            raise PermissionDeniedError("Safeguard: Administrators cannot deactivate their own account.")

        user = (await self.db.execute(select(User).where(User.id == target_user_id))).scalars().first()
        if not user:
            raise NotFoundError("User not found.")

        user.status = new_status
        await self.db.flush()
        await self.db.refresh(user)
        return UserResponse.model_validate(user)

    async def update_user_role(self, admin_id: str, target_user_id: str, new_role: str) -> UserResponse:
        # Safeguard: cannot demote self
        if admin_id == target_user_id and new_role.upper() != "ADMIN":
            raise PermissionDeniedError("Safeguard: Administrators cannot remove their own admin privileges.")

        user = (await self.db.execute(select(User).where(User.id == target_user_id))).scalars().first()
        if not user:
            raise NotFoundError("User not found.")

        user.role = new_role.upper()
        await self.db.flush()
        await self.db.refresh(user)
        return UserResponse.model_validate(user)

    async def list_all_keys(self, page: int = 1, page_size: int = 25) -> PaginatedResponse[Dict[str, Any]]:
        skip = (page - 1) * page_size
        total = (await self.db.execute(select(func.count()).select_from(ApiKey))).scalar() or 0

        stmt = (
            select(ApiKey, User.name, User.email)
            .outerjoin(User, ApiKey.owner_id == User.id)
            .order_by(desc(ApiKey.created_at))
            .offset(skip)
            .limit(page_size)
        )
        rows = (await self.db.execute(stmt)).all()

        data = [
            {
                "id": k.id,
                "name": k.name,
                "key_prefix": k.key_prefix,
                "owner_id": k.owner_id,
                "owner_name": u_name or "System / Demo",
                "owner_email": u_email or "system@orvia.dev",
                "status": k.status,
                "rate_limit": k.rate_limit,
                "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
                "expires_at": k.expires_at.isoformat() if k.expires_at else None,
                "created_at": k.created_at.isoformat(),
            }
            for k, u_name, u_email in rows
        ]

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        return PaginatedResponse(
            success=True,
            data=data,
            pagination=PaginationMeta(
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            ),
        )

    async def list_all_requests(
        self,
        endpoint: Optional[str] = None,
        status_code: Optional[int] = None,
        method: Optional[str] = None,
        user_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
    ) -> PaginatedResponse[Dict[str, Any]]:
        skip = (page - 1) * page_size
        filters = []

        if endpoint:
            filters.append(ApiRequestLog.endpoint.like(f"%{endpoint.strip()}%"))
        if status_code:
            filters.append(ApiRequestLog.status_code == status_code)
        if method:
            filters.append(ApiRequestLog.method == method.upper())
        if user_id:
            filters.append(ApiRequestLog.user_id == user_id)

        count_stmt = select(func.count()).select_from(ApiRequestLog)
        if filters:
            count_stmt = count_stmt.where(and_(*filters))
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = (
            select(ApiRequestLog, User.email, ApiKey.key_prefix)
            .outerjoin(User, ApiRequestLog.user_id == User.id)
            .outerjoin(ApiKey, ApiRequestLog.api_key_id == ApiKey.id)
        )
        if filters:
            stmt = stmt.where(and_(*filters))
        stmt = stmt.order_by(desc(ApiRequestLog.timestamp)).offset(skip).limit(page_size)
        rows = (await self.db.execute(stmt)).all()

        data = [
            {
                "id": log.id,
                "request_id": log.request_id,
                "api_id": log.api_id,
                "endpoint": log.endpoint,
                "method": log.method,
                "status_code": log.status_code,
                "response_time_ms": log.response_time_ms,
                "ip_address": log.ip_address,
                "api_key_prefix": key_prefix or "None",
                "user_email": u_email or "Public / Unauthenticated",
                "timestamp": log.timestamp.isoformat(),
            }
            for log, u_email, key_prefix in rows
        ]

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        return PaginatedResponse(
            success=True,
            data=data,
            pagination=PaginationMeta(
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            ),
        )

    # 5. Asset Administration
    async def get_all_assets(
        self,
        user_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ):
        from app.models.uploaded_asset import UploadedAsset
        from app.schemas.image_upload import UploadedAssetResponse

        skip = (page - 1) * page_size
        query = select(UploadedAsset)
        count_stmt = select(func.count()).select_from(UploadedAsset)

        if user_id:
            query = query.where(UploadedAsset.user_id == user_id)
            count_stmt = count_stmt.where(UploadedAsset.user_id == user_id)

        total = (await self.db.execute(count_stmt)).scalar() or 0
        items = (
            await self.db.execute(
                query.order_by(desc(UploadedAsset.created_at)).offset(skip).limit(page_size)
            )
        ).scalars().all()
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        data = [UploadedAssetResponse.model_validate(a) for a in items]

        return PaginatedResponse(
            success=True,
            data=data,
            pagination=PaginationMeta(
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            ),
        )
