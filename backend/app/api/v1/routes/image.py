from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.common import StandardResponse
from app.schemas.image_upload import ImageUploadResponse
from app.api.deps import verify_api_key
from app.models.api_key import ApiKey
from app.services.subscription_service import SubscriptionService
from app.services.image_upload_service import ImageUploadService
from app.core.errors import UnsupportedImageError, AuthenticationError

router = APIRouter(prefix="/image", tags=["Image Services"])


@router.post(
    "/upload",
    response_model=StandardResponse[ImageUploadResponse],
    status_code=status.HTTP_200_OK,
    summary="Upload image to Cloudinary",
    description="Securely upload an image asset to Cloudinary. Requires an active Orvia API key and an active subscription plan.",
)
async def upload_image(
    request: Request,
    file: UploadFile = File(..., description="The image file to upload (JPEG, PNG, WebP, GIF)"),
    api_key: ApiKey = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/v1/image/upload
    Receives multipart/form-data file, verifies caller's active plan,
    checks endpoint entitlement ('cloudinary-image-upload'),
    enforces rate limits & request quotas, validates the image, and uploads to Cloudinary.
    """
    if not api_key.owner_id:
        raise AuthenticationError("API key is not associated with an active account.")

    # 1. Centralized access check (Active subscription, Plan API access, Quota limit, Rate limit)
    sub_service = SubscriptionService(db)
    await sub_service.check_user_api_access(api_key.owner_id, "cloudinary-image-upload")

    # 2. Read file bytes
    try:
        file_bytes = await file.read()
    except Exception:
        raise UnsupportedImageError("Failed to read the uploaded image stream.")

    if not file_bytes:
        raise UnsupportedImageError("The uploaded file is empty or missing.")

    # 3. Process, validate, and upload via ImageUploadService
    upload_service = ImageUploadService(db)
    request_id = getattr(request.state, "request_id", None)
    client_ip = request.client.host if request.client else "127.0.0.1"

    result = await upload_service.process_and_upload(
        file_bytes=file_bytes,
        filename=file.filename,
        content_type=file.content_type,
        user_id=api_key.owner_id,
        api_key_id=api_key.id,
        request_id=request_id,
        ip_address=client_ip,
    )

    return StandardResponse(
        success=True,
        data=ImageUploadResponse.model_validate(result),
        request_id=request_id,
        message="Image successfully uploaded to Cloudinary.",
    )
