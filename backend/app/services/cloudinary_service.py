import io
from typing import Dict, Any, Optional
import cloudinary
import cloudinary.uploader
from app.core.config import settings
from app.core.errors import UploadProviderError
from app.core.logging import logger


class CloudinaryService:
    """
    Dedicated encapsulation of Cloudinary SDK interactions.
    Provides decoupled asset uploading, folder structuring, and safe provider error handling.
    """

    def __init__(self):
        creds = settings.cloudinary_credentials
        cloudinary.config(
            cloud_name=creds.get("cloud_name"),
            api_key=creds.get("api_key"),
            api_secret=creds.get("api_secret"),
            secure=True,
        )

    async def upload_image_bytes(
        self,
        image_bytes: bytes,
        filename: Optional[str] = None,
        folder: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Upload raw image bytes securely to Cloudinary.
        Returns normalized asset telemetry with HTTPS secure_url.
        """
        target_folder = folder or settings.CLOUDINARY_UPLOAD_FOLDER

        try:
            # File-like stream from memory
            file_stream = io.BytesIO(image_bytes)
            if filename:
                file_stream.name = filename

            # Upload to Cloudinary in worker thread
            import asyncio
            upload_result = await asyncio.to_thread(
                cloudinary.uploader.upload,
                file_stream,
                folder=target_folder,
                resource_type="image",
                use_filename=bool(filename),
                unique_filename=True,
                overwrite=False,
            )

            logger.info(
                f"Cloudinary upload succeeded: public_id={upload_result.get('public_id')}, "
                f"bytes={upload_result.get('bytes')}, format={upload_result.get('format')}"
            )

            return {
                "public_id": upload_result.get("public_id"),
                "url": upload_result.get("url"),
                "secure_url": upload_result.get("secure_url"),
                "format": upload_result.get("format"),
                "width": upload_result.get("width", 0),
                "height": upload_result.get("height", 0),
                "bytes": upload_result.get("bytes", len(image_bytes)),
                "created_at": upload_result.get("created_at"),
            }

        except Exception as e:
            # Sanitize and never expose Cloudinary secrets or internal stack trace
            logger.error(f"Cloudinary upload failure: {type(e).__name__} - {str(e)}")
            raise UploadProviderError("The image upload provider could not process the request.")
