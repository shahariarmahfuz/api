from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CloudinaryUploadResult(BaseModel):
    public_id: str = Field(..., description="Cloudinary unique asset identifier")
    url: str = Field(..., description="Standard HTTP asset URL")
    secure_url: str = Field(..., description="Primary HTTPS secure asset URL")
    format: str = Field(..., description="Asset file format extension (e.g., jpg, png, webp)")
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    bytes: int = Field(..., description="File size in bytes")
    created_at: Optional[str] = Field(None, description="Cloudinary creation timestamp")



class ImageUploadResponse(CloudinaryUploadResult):
    pass


class UploadedAssetResponse(BaseModel):
    id: str
    user_id: str
    api_key_id: Optional[str] = None
    cloudinary_public_id: str
    url: str
    secure_url: str
    format: str
    width: int
    height: int
    bytes: int
    created_at: datetime

    model_config = {"from_attributes": True}
