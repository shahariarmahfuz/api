from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.user import User
from app.models.api_registry import ApiRegistry
from app.models.api_key import ApiKey
from app.models.api_request_log import ApiRequestLog
from app.models.plan import Plan
from app.models.coupon import Coupon
from app.core.security import hash_password, hash_api_key
from app.core.logging import logger


DEMO_APIS = [
    {
        "name": "Image Resize",
        "slug": "image-resize",
        "category": "image",
        "version": "v1",
        "method": "POST",
        "endpoint": "/api/v1/image/resize",
        "status": "active",
        "authentication_required": True,
        "rate_limit": "60/min",
        "description": "High-performance smart image resizing with aspect ratio preservation, WebP/AVIF output, and quality tuning.",
        "documentation": {
            "summary": "Resize images dynamically with automated quality optimization and crop modes.",
            "parameters": [
                {"name": "image_url", "type": "string (url)", "required": True, "description": "Public URL or base64 of the source image to resize.", "example": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675"},
                {"name": "width", "type": "integer", "required": False, "description": "Target width in pixels (10 to 4096).", "example": 800},
                {"name": "height", "type": "integer", "required": False, "description": "Target height in pixels (10 to 4096).", "example": 600},
                {"name": "format", "type": "string", "required": False, "description": "Output format: webp, avif, jpeg, png.", "example": "webp"},
                {"name": "quality", "type": "integer", "required": False, "description": "Compression quality from 1 to 100.", "example": 85}
            ],
            "request_example": {
                "image_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675",
                "width": 800,
                "height": 600,
                "format": "webp",
                "quality": 85
            },
            "response_example": {
                "success": True,
                "data": {
                    "output_url": "https://cdn.orvia.dev/renders/img_8923a1b0.webp",
                    "original_size_bytes": 1420580,
                    "optimized_size_bytes": 148200,
                    "compression_ratio": "89.6%",
                    "dimensions": {"width": 800, "height": 600}
                }
            },
            "error_responses": [
                {"code": "INVALID_IMAGE_URL", "status": 400, "message": "Source image URL could not be fetched."},
                {"code": "RATE_LIMIT_EXCEEDED", "status": 429, "message": "Exceeded rate limit of 60 req/min."}
            ],
            "tags": ["image", "media", "optimization", "resize"]
        }
    },
    {
        "name": "Video Metadata Extractor",
        "slug": "video-metadata",
        "category": "video",
        "version": "v1",
        "method": "POST",
        "endpoint": "/api/v1/video/metadata",
        "status": "active",
        "authentication_required": True,
        "rate_limit": "30/min",
        "description": "Inspect and extract stream metadata, audio/video codecs, bitrate, duration, FPS, and color space from media containers.",
        "documentation": {
            "summary": "Extract deep container and stream telemetry from video URLs without full media downloads.",
            "parameters": [
                {"name": "video_url", "type": "string (url)", "required": True, "description": "URL to MP4, MKV, MOV, or HLS stream.", "example": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
            ],
            "request_example": {
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            },
            "response_example": {
                "success": True,
                "data": {
                    "duration_seconds": 596.5,
                    "video_streams": [{"codec": "h264", "resolution": "1920x1080", "fps": 24.0, "bitrate_kbps": 2100}],
                    "audio_streams": [{"codec": "aac", "channels": 2, "sample_rate": 48000}]
                }
            },
            "tags": ["video", "metadata", "streaming", "media"]
        }
    },
    {
        "name": "QR Code Generator",
        "slug": "qr-generator",
        "category": "utility",
        "version": "v1",
        "method": "POST",
        "endpoint": "/api/v1/utility/qr",
        "status": "active",
        "authentication_required": False,
        "rate_limit": "120/min",
        "description": "Generate dynamic, styled 2D QR codes with customized colors, error correction levels, and vector SVG or raster PNG formats.",
        "documentation": {
            "summary": "Create SVG and PNG QR codes with customizable payloads and visual themes.",
            "parameters": [
                {"name": "content", "type": "string", "required": True, "description": "Text, URL, or WiFi credentials payload.", "example": "https://orvia.dev"},
                {"name": "size", "type": "integer", "required": False, "description": "Pixel width/height.", "example": 512},
                {"name": "format", "type": "string", "required": False, "description": "svg or png.", "example": "svg"}
            ],
            "request_example": {
                "content": "https://orvia.dev",
                "size": 512,
                "format": "svg"
            },
            "response_example": {
                "success": True,
                "data": {
                    "data_url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmci...",
                    "content_length": 1824
                }
            },
            "tags": ["utility", "qr", "generator", "svg"]
        }
    },
    {
        "name": "UUID / Cryptographic ID Generator",
        "slug": "uuid-generator",
        "category": "utility",
        "version": "v1",
        "method": "GET",
        "endpoint": "/api/v1/utility/uuid",
        "status": "active",
        "authentication_required": False,
        "rate_limit": "300/min",
        "description": "Batch generate UUIDv4, UUIDv7 (time-ordered), NanoID, or ULID identifiers with cryptographic entropy.",
        "documentation": {
            "summary": "Cryptographically secure ID generator with time-sortable and compact ID variations.",
            "parameters": [
                {"name": "type", "type": "string", "required": False, "description": "v4, v7, nanoid, ulid.", "example": "v7"},
                {"name": "count", "type": "integer", "required": False, "description": "Number of IDs to generate (1 to 100).", "example": 5}
            ],
            "request_example": {},
            "response_example": {
                "success": True,
                "data": {
                    "ids": [
                        "018f92b1-7a8e-73b2-9a01-49b0e9b9d311",
                        "018f92b1-7a8e-73b2-9a02-89c1f0e8e422"
                    ],
                    "type": "v7",
                    "count": 2
                }
            },
            "tags": ["utility", "uuid", "nanoid", "ulid", "ids"]
        }
    },
    {
        "name": "Text Sentiment & Entity Analysis",
        "slug": "text-sentiment",
        "category": "ai",
        "version": "v1",
        "method": "POST",
        "endpoint": "/api/v1/ai/sentiment",
        "status": "beta",
        "authentication_required": True,
        "rate_limit": "60/min",
        "description": "High-throughput natural language analyzer for multi-language sentiment scoring, emotional polarity, and named entity recognition.",
        "documentation": {
            "summary": "Analyze sentiment, tone polarity, and extract entities from textual content.",
            "parameters": [
                {"name": "text", "type": "string", "required": True, "description": "The input text to analyze.", "example": "Orvia makes managing and discovering APIs an absolute joy to use!"}
            ],
            "request_example": {
                "text": "Orvia makes managing and discovering APIs an absolute joy to use!"
            },
            "response_example": {
                "success": True,
                "data": {
                    "sentiment": "positive",
                    "score": 0.94,
                    "entities": [{"text": "Orvia", "label": "PRODUCT"}]
                }
            },
            "tags": ["ai", "nlp", "sentiment", "text"]
        }
    },
    {
        "name": "IP Geo & ASN Intelligence",
        "slug": "ip-lookup",
        "category": "data",
        "version": "v1",
        "method": "GET",
        "endpoint": "/api/v1/data/ip-lookup",
        "status": "active",
        "authentication_required": True,
        "rate_limit": "100/min",
        "description": "Sub-millisecond IP geolocation, autonomous system number (ASN) lookup, carrier detection, and threat reputation scoring.",
        "documentation": {
            "summary": "Instant IP intelligence with low latency lookup for geolocation, datacenter detection, and ASN info.",
            "parameters": [
                {"name": "ip", "type": "string", "required": False, "description": "Target IPv4/IPv6 address. Defaults to caller IP.", "example": "8.8.8.8"}
            ],
            "request_example": {},
            "response_example": {
                "success": True,
                "data": {
                    "ip": "8.8.8.8",
                    "country": "United States",
                    "country_code": "US",
                    "city": "Mountain View",
                    "asn": "AS15169 GOOGLE",
                    "is_datacenter": True
                }
            },
            "tags": ["data", "ip", "asn", "geolocation"]
        }
    }
]


async def seed_initial_data(db: AsyncSession) -> Dict[str, Any]:
    """Seed initial administrator, test API keys, and demo API registry entries."""
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
    # Key: orv_live_demo_key_for_testing_2026_orvia
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

    # 3. Seed Demo APIs in Registry
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
            stats["apis_created"] += 1
            logger.info(f"Seeded registry entry: {api_data['slug']}")

    # 4. Seed initial sample logs for dashboard visualization
    res = await db.execute(select(ApiRequestLog).limit(1))
    if not res.scalars().first():
        sample_logs = [
            ApiRequestLog(
                request_id="req_98f12a34-1100-4b2a",
                endpoint="/api/v1/image/resize",
                method="POST",
                status_code=200,
                response_time_ms=42.5,
                ip_address="127.0.0.1",
                api_key_id=demo_key.id,
                user_id=admin_user.id,
                timestamp=datetime.now(timezone.utc) - timedelta(minutes=15),
            ),
            ApiRequestLog(
                request_id="req_87c21e54-2200-4c3b",
                endpoint="/api/v1/utility/uuid",
                method="GET",
                status_code=200,
                response_time_ms=8.2,
                ip_address="127.0.0.1",
                timestamp=datetime.now(timezone.utc) - timedelta(minutes=10),
            ),
            ApiRequestLog(
                request_id="req_76b32d65-3300-4d4c",
                endpoint="/api/v1/video/metadata",
                method="POST",
                status_code=200,
                response_time_ms=95.1,
                ip_address="192.168.1.10",
                api_key_id=demo_key.id,
                timestamp=datetime.now(timezone.utc) - timedelta(minutes=5),
            ),
            ApiRequestLog(
                request_id="req_65a43c76-4400-4e5d",
                endpoint="/api/v1/ai/sentiment",
                method="POST",
                status_code=401,
                response_time_ms=12.0,
                ip_address="10.0.0.4",
                timestamp=datetime.now(timezone.utc) - timedelta(minutes=2),
            ),
        ]
        db.add_all(sample_logs)

    # 5. Seed Initial Plans
    plan_count_res = await db.execute(select(func.count(Plan.id)) if "func" in locals() else select(Plan).limit(1))
    existing_plan = plan_count_res.scalars().first()
    if not existing_plan:
        # Fetch APIs for basic plan
        qr_api_res = await db.execute(select(ApiRegistry).where(ApiRegistry.slug.in_(["qr-generator", "uuid-generator", "image-resize"])))
        basic_apis = list(qr_api_res.scalars().all())

        basic_plan = Plan(
            name="Basic",
            slug="basic",
            description="Essential utilities and lightweight media processing for developers building prototypes.",
            price=9.0,
            currency="USD",
            billing_interval="monthly",
            duration_days=30,
            monthly_request_limit=25000,
            rate_limit_per_minute=30,
            max_concurrent_requests=5,
            is_all_apis=False,
            allowed_apis=basic_apis,
            features=[
                "25,000 monthly requests",
                "30 requests/minute",
                "QR & UUID generators",
                "Standard image resizing",
                "Community support",
            ],
            status="ACTIVE",
        )

        pro_plan = Plan(
            name="Pro",
            slug="pro",
            description="High-throughput access to all media, AI, and intelligence endpoints for scaling production applications.",
            price=29.0,
            currency="USD",
            billing_interval="monthly",
            duration_days=30,
            monthly_request_limit=100000,
            rate_limit_per_minute=60,
            max_concurrent_requests=15,
            is_all_apis=True,
            features=[
                "100,000 monthly requests",
                "60 requests/minute",
                "All current & upcoming APIs",
                "AI Sentiment analysis",
                "Sub-millisecond IP lookup",
                "Priority routing",
            ],
            status="ACTIVE",
        )

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
            features=[
                "1,000,000 monthly requests",
                "300 requests/minute",
                "All platform APIs",
                "Unlimited concurrency",
                "Dedicated account support",
                "99.99% uptime SLA",
            ],
            status="ACTIVE",
        )

        db.add_all([basic_plan, pro_plan, enterprise_plan])
        await db.flush()
        logger.info("Seeded initial plans: Basic, Pro, Enterprise.")

        # 6. Seed Initial Coupons
        c1 = Coupon(
            code="ORVIA100",
            description="Launch celebration 100% discount on any plan",
            discount_type="PERCENTAGE",
            discount_value=100.0,
            applicable_plan_id=None,  # Applies to all plans
            max_uses=1000,
            is_active=True,
        )

        c2 = Coupon(
            code="PRO50",
            description="50% off first month for Pro plan developers",
            discount_type="PERCENTAGE",
            discount_value=50.0,
            applicable_plan_id=pro_plan.id,
            max_uses=500,
            is_active=True,
        )

        db.add_all([c1, c2])
        logger.info("Seeded initial coupons: ORVIA100, PRO50.")

    await db.commit()
    return stats

