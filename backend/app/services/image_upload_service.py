import io
import time
from typing import Dict, Any, Optional
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.errors import (
    UnsupportedImageError,
    FileTooLargeError,
)
from app.services.cloudinary_service import CloudinaryService
from app.models.uploaded_asset import UploadedAsset
from app.models.api_registry import ApiRegistry
from app.models.api_request_log import ApiRequestLog
from app.core.logging import logger

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
}


class ImageUploadService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.cloudinary_service = CloudinaryService()

    def validate_image(self, file_bytes: bytes, filename: Optional[str], content_type: Optional[str]) -> None:
        """
        Validate incoming file:
        - Non-empty
        - File size <= MAX_IMAGE_UPLOAD_SIZE_MB
        - File extension in allowed list
        - Content-Type in allowed list
        - Real image validity using Pillow binary verification
        """
        if not file_bytes or len(file_bytes) == 0:
            raise UnsupportedImageError("The uploaded file is empty or missing.")

        # 1. Size check
        max_bytes = settings.MAX_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024
        if len(file_bytes) > max_bytes:
            raise FileTooLargeError("The uploaded image exceeds the maximum allowed file size.")

        # 2. Extension check
        if filename:
            parts = filename.rsplit(".", 1)
            if len(parts) > 1:
                ext = parts[1].lower()
                if ext not in ALLOWED_EXTENSIONS:
                    raise UnsupportedImageError("The uploaded file format is not supported.")

        # 3. Content-Type check (if provided by client)
        if content_type:
            cleaned_type = content_type.split(";")[0].strip().lower()
            if cleaned_type not in ALLOWED_MIME_TYPES and cleaned_type != "application/octet-stream":
                raise UnsupportedImageError("The uploaded file format is not supported.")

        # 4. Deep binary image verification with Pillow
        try:
            image_stream = io.BytesIO(file_bytes)
            with Image.open(image_stream) as img:
                img.verify()
        except Exception:
            raise UnsupportedImageError("The uploaded file format is not supported.")

    async def process_and_upload(
        self,
        file_bytes: bytes,
        filename: Optional[str],
        content_type: Optional[str],
        user_id: str,
        api_key_id: Optional[str],
        request_id: Optional[str],
        ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Complete end-to-end execution:
        1. Validates image binary & metadata
        2. Uploads securely to Cloudinary
        3. Persists record in uploaded_assets
        4. Logs request in api_request_logs
        """
        start_time = time.time()

        # Validate image
        self.validate_image(file_bytes, filename, content_type)

        # Upload to Cloudinary
        upload_result = await self.cloudinary_service.upload_image_bytes(
            image_bytes=file_bytes,
            filename=filename,
            folder=settings.CLOUDINARY_UPLOAD_FOLDER,
        )

        duration_ms = round((time.time() - start_time) * 1000.0, 2)

        # Lookup API ID for 'cloudinary-image-upload'
        api_res = await self.db.execute(
            select(ApiRegistry.id).where(ApiRegistry.slug == "cloudinary-image-upload")
        )
        api_id = api_res.scalar_one_or_none()

        # Save to uploaded_assets table
        asset = UploadedAsset(
            user_id=user_id,
            api_key_id=api_key_id,
            api_id=api_id,
            cloudinary_public_id=upload_result["public_id"],
            secure_url=upload_result["secure_url"],
            url=upload_result["url"],
            format=upload_result["format"],
            bytes=upload_result["bytes"],
            width=upload_result["width"],
            height=upload_result["height"],
        )
        self.db.add(asset)

        # Record usage in api_request_logs
        req_log = ApiRequestLog(
            request_id=request_id or f"req_{int(time.time()*1000)}",
            endpoint="/api/v1/image/upload",
            method="POST",
            status_code=200,
            response_time_ms=duration_ms,
            ip_address=ip_address or "127.0.0.1",
            api_key_id=api_key_id,
            user_id=user_id,
            api_id=api_id,
        )
        self.db.add(req_log)

        await self.db.commit()
        await self.db.refresh(asset)

        logger.info(f"Image uploaded and tracked successfully for user {user_id}: {asset.secure_url}")
        return upload_result
