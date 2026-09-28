from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from app.models.user import User
from app.models.api_registry import ApiRegistry
from app.models.api_key import ApiKey
from app.models.api_request_log import ApiRequestLog
from app.models.plan import Plan, plan_api_access
from app.models.coupon import Coupon
from app.core.security import hash_password, hash_api_key
from app.core.logging import logger


DEMO_APIS = [
    {
        "name": "Cloudinary Image Upload",
        "slug": "cloudinary-image-upload",
        "category": "image",
        "version": "v1",
        "method": "POST",
        "endpoint": "/api/v1/image/upload",
        "status": "active",
        "authentication_required": True,
        "rate_limit": "60/min",
        "description": "Securely upload, optimize, and store images on Cloudinary with instant CDN distribution and binary format validation.",
        "documentation": {
            "summary": "Upload JPEG, PNG, WebP, or GIF image assets up to 10MB using multipart/form-data. Enforces binary payload validation and rate limits.",
            "parameters": [
                {
                    "name": "file",
                    "type": "binary (multipart/form-data)",
                    "required": True,
                    "description": "The image file to upload. Supported formats: JPEG, PNG, WebP, GIF. Maximum file size: 10MB.",
                    "example": "photo.jpg"
                }
            ],
            "request_example": {
                "file": "(binary image data)"
            },
            "response_example": {
                "success": True,
                "data": {
                    "public_id": "orvia_uploads/sample_upload_12345",
                    "url": "http://res.cloudinary.com/diwp8ug1r/image/upload/v1727512800/orvia_uploads/sample_upload_12345.jpg",
                    "secure_url": "https://res.cloudinary.com/diwp8ug1r/image/upload/v1727512800/orvia_uploads/sample_upload_12345.jpg",
                    "format": "jpg",
                    "width": 1200,
                    "height": 800,
                    "bytes": 245120,
                    "created_at": "2026-09-28T09:00:00Z"
                },
                "message": "Image uploaded successfully"
            },
            "error_responses": [
                {"code": "MISSING_API_KEY", "status": 401, "message": "API key required in X-API-Key header."},
                {"code": "INVALID_API_KEY", "status": 401, "message": "The provided API key is invalid or revoked."},
                {"code": "SUBSCRIPTION_REQUIRED", "status": 403, "message": "Active subscription required to access this API."},
                {"code": "API_NOT_IN_PLAN", "status": 403, "message": "Your current plan does not allow access to this API."},
                {"code": "FILE_TOO_LARGE", "status": 413, "message": "Uploaded file exceeds maximum limit of 10MB."},
                {"code": "UNSUPPORTED_IMAGE_FORMAT", "status": 415, "message": "File format not supported. Only JPEG, PNG, WebP, GIF are permitted."},
                {"code": "UPLOAD_PROVIDER_ERROR", "status": 502, "message": "Cloudinary upload service failed to process the image."}
            ],
            "tags": ["image", "upload", "cloudinary", "cdn", "media"]
        }
    }
]


async def seed_initial_data(db: AsyncSession) -> Dict[str, Any]:
    """Seed initial administrator, test API keys, and Cloudinary Image Upload API registry entry."""
    stats = {"users_created": 0, "apis_created": 0, "keys_created": 0}

    # 1. Admin User
    admin_email = "admin@orvia.dev"
    res = await db.execute(select(User).where(User.email == admin_email))
    admin_user = res.scalars().first()
    if not admin_user:
        admin_user = User(
            name="Orvia Administrator",
            email=admin_email,
            hashed_password=hash_password("OrviaAdmin2026!"),
            role="ADMIN",
            status="active",
        )
        db.add(admin_user)
        await db.flush()
        stats["users_created"] += 1
        logger.info(f"Seeded admin user: {admin_email}")
    else:
        admin_user.role = "ADMIN"
        await db.flush()

    # 2. Seed Default Demo API Key
    demo_key_secret = "orv_live_demo_platform_key_2026_modular"
    demo_key_hash = hash_api_key(demo_key_secret)
    res = await db.execute(select(ApiKey).where(ApiKey.key_hash == demo_key_hash))
    demo_key = res.scalars().first()
    if not demo_key:
        demo_key = ApiKey(
            name="Default Platform Key",
            key_prefix="orv_live_demo_...",
            key_hash=demo_key_hash,
            owner_id=admin_user.id,
            status="active",
            rate_limit="1000/min",
            expires_at=datetime.now(timezone.utc) + timedelta(days=365),
        )
        db.add(demo_key)
        await db.flush()
        stats["keys_created"] += 1
        logger.info("Seeded demo API key.")

    # 3. Purge legacy demo APIs from DB
    current_slugs = [a["slug"] for a in DEMO_APIS]
    legacy_apis_res = await db.execute(select(ApiRegistry).where(~ApiRegistry.slug.in_(current_slugs)))
    legacy_apis = list(legacy_apis_res.scalars().all())
    for legacy_api in legacy_apis:
        logger.info(f"Purging legacy/demo API: {legacy_api.slug}")
        # Delete associations in plan_api_access
        await db.execute(delete(plan_api_access).where(plan_api_access.c.api_id == legacy_api.id))
        await db.delete(legacy_api)
    await db.flush()

    # 4. Seed Cloudinary Image Upload API in Registry
    cloudinary_api_model = None
    for api_data in DEMO_APIS:
        res = await db.execute(select(ApiRegistry).where(ApiRegistry.slug == api_data["slug"]))
        existing = res.scalars().first()
        if not existing:
            new_api = ApiRegistry(
                name=api_data["name"],
                slug=api_data["slug"],
                description=api_data["description"],
                category=api_data["category"],
                version=api_data["version"],
                method=api_data["method"],
                endpoint=api_data["endpoint"],
                status=api_data["status"],
                authentication_required=api_data["authentication_required"],
                rate_limit=api_data["rate_limit"],
                documentation=api_data["documentation"],
            )
            db.add(new_api)
            await db.flush()
            stats["apis_created"] += 1
            cloudinary_api_model = new_api
            logger.info(f"Seeded registry entry: {api_data['slug']}")
        else:
            existing.name = api_data["name"]
            existing.description = api_data["description"]
            existing.category = api_data["category"]
            existing.endpoint = api_data["endpoint"]
            existing.method = api_data["method"]
            existing.status = api_data["status"]
            existing.rate_limit = api_data["rate_limit"]
            existing.documentation = api_data["documentation"]
            await db.flush()
            cloudinary_api_model = existing

    # 5. Clean up old request logs referencing deleted endpoints
    await db.execute(
        delete(ApiRequestLog).where(
            ~ApiRequestLog.endpoint.in_(["/api/v1/image/upload", "/health"])
        )
    )

    # 6. Seed Plans or update existing plans
    plans_res = await db.execute(select(Plan))
    existing_plans = {p.slug: p for p in plans_res.scalars().all()}

    allowed_list = [cloudinary_api_model] if cloudinary_api_model else []

    if "basic" not in existing_plans:
        basic_plan = Plan(
            name="Basic",
            slug="basic",
            description="Essential cloud image uploads for developers building prototypes.",
            price=9.0,
            currency="USD",
            billing_interval="monthly",
            duration_days=30,
            monthly_request_limit=25000,
            rate_limit_per_minute=30,
            max_concurrent_requests=5,
            is_all_apis=False,
            allowed_apis=allowed_list,
            features=[
                "25,000 monthly image uploads",
                "30 requests/minute",
                "Cloudinary Image Upload API",
                "Max 10MB per image",
                "Community support",
            ],
            status="ACTIVE",
        )
        db.add(basic_plan)
    else:
        p = existing_plans["basic"]
        p.allowed_apis = allowed_list
        p.features = [
            "25,000 monthly image uploads",
            "30 requests/minute",
            "Cloudinary Image Upload API",
            "Max 10MB per image",
            "Community support",
        ]

    if "pro" not in existing_plans:
        pro_plan = Plan(
            name="Pro",
            slug="pro",
            description="High-throughput image processing and instant CDN distribution for scaling production applications.",
            price=29.0,
            currency="USD",
            billing_interval="monthly",
            duration_days=30,
            monthly_request_limit=100000,
            rate_limit_per_minute=60,
            max_concurrent_requests=15,
            is_all_apis=True,
            allowed_apis=allowed_list,
            features=[
                "100,000 monthly image uploads",
                "60 requests/minute",
                "Cloudinary Image Upload API",
                "Instant CDN asset delivery",
                "Priority upload pipeline",
            ],
            status="ACTIVE",
        )
        db.add(pro_plan)
    else:
        p = existing_plans["pro"]
        p.allowed_apis = allowed_list
        p.features = [
            "100,000 monthly image uploads",
            "60 requests/minute",
            "Cloudinary Image Upload API",
            "Instant CDN asset delivery",
            "Priority upload pipeline",
        ]

    if "enterprise" not in existing_plans:
        enterprise_plan = Plan(
            name="Enterprise",
            slug="enterprise",
            description="Dedicated infrastructure, extreme throughput, custom concurrency, and SLA guarantees for enterprise platforms.",
            price=99.0,
            currency="USD",
            billing_interval="monthly",
            duration_days=30,
            monthly_request_limit=1000000,
            rate_limit_per_minute=300,
            max_concurrent_requests=50,
            is_all_apis=True,
            allowed_apis=allowed_list,
            features=[
                "1,000,000 monthly image uploads",
                "300 requests/minute",
                "Cloudinary Image Upload API",
                "Dedicated asset storage",
                "99.99% uptime SLA",
            ],
            status="ACTIVE",
        )
        db.add(enterprise_plan)
    else:
        p = existing_plans["enterprise"]
        p.allowed_apis = allowed_list
        p.features = [
            "1,000,000 monthly image uploads",
            "300 requests/minute",
            "Cloudinary Image Upload API",
            "Dedicated asset storage",
            "99.99% uptime SLA",
        ]

    await db.flush()

    # 7. Seed Initial Coupons if not present
    coupon_res = await db.execute(select(Coupon).limit(1))
    if not coupon_res.scalars().first():
        c1 = Coupon(
            code="ORVIA100",
            description="Launch celebration 100% discount on any plan",
            discount_type="PERCENTAGE",
            discount_value=100.0,
            applicable_plan_id=None,
            max_uses=1000,
            is_active=True,
        )

        c2 = Coupon(
            code="PRO50",
            description="50% off first month for Pro plan developers",
            discount_type="PERCENTAGE",
            discount_value=50.0,
            applicable_plan_id=None,
            max_uses=500,
            is_active=True,
        )

        db.add_all([c1, c2])
        logger.info("Seeded initial coupons: ORVIA100, PRO50.")

    await db.commit()
    return stats
