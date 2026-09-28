import io
import pytest
import uuid
from unittest.mock import patch
from PIL import Image


def generate_image_bytes(format_name: str = "JPEG", size=(100, 100)) -> bytes:
    """Generate in-memory image bytes for testing."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color="teal")
    img.save(buf, format=format_name)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_cloudinary_upload_comprehensive(client):
    # Setup: Register and activate a Pro plan user
    random_id = uuid.uuid4().hex[:6]
    user_email = f"upload_user_{random_id}@orvia.dev"
    password = "UploadPassword2026!"

    # 1. Signup
    signup_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "name": "Upload Tester",
            "email": user_email,
            "password": password,
            "confirm_password": password,
        },
    )
    assert signup_res.status_code == 201

    # 2. Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": password},
    )
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]
    user_headers = {"Authorization": f"Bearer {token}"}

    # 3. Create an API key
    key_res = await client.post(
        "/api/v1/user/api-keys",
        headers=user_headers,
        json={"name": "Upload Key"},
    )
    assert key_res.status_code == 201
    secret_key = key_res.json()["data"]["secret_key"]

    valid_jpeg = generate_image_bytes("JPEG")

    # TEST A: Missing API Key -> 401
    res_no_key = await client.post(
        "/api/v1/image/upload",
        files={"file": ("test.jpg", valid_jpeg, "image/jpeg")},
    )
    assert res_no_key.status_code == 401
    assert res_no_key.json()["error"]["code"] == "MISSING_API_KEY"

    # TEST B: Invalid API Key -> 401
    res_bad_key = await client.post(
        "/api/v1/image/upload",
        headers={"X-API-Key": "orv_live_invalid_garbage_key_12345"},
        files={"file": ("test.jpg", valid_jpeg, "image/jpeg")},
    )
    assert res_bad_key.status_code == 401
    assert res_bad_key.json()["error"]["code"] == "INVALID_API_KEY"

    # TEST C: No Active Plan -> 403
    res_no_plan = await client.post(
        "/api/v1/image/upload",
        headers={"X-API-Key": secret_key},
        files={"file": ("test.jpg", valid_jpeg, "image/jpeg")},
    )
    assert res_no_plan.status_code == 403
    assert res_no_plan.json()["error"]["code"] == "NO_ACTIVE_PLAN"

    # Activate Pro Plan with ORVIA100 coupon
    plans_res = await client.get("/api/v1/plans")
    pro_plan = next(p for p in plans_res.json()["data"] if p["slug"] == "pro")

    act_res = await client.post(
        "/api/v1/user/subscription/activate-coupon",
        headers=user_headers,
        json={"plan_id": pro_plan["id"], "coupon_code": "ORVIA100"},
    )
    assert act_res.status_code == 200

    # TEST D: Non-image / Corrupted binary (e.g. text file disguised as jpg) -> 415
    res_corrupt = await client.post(
        "/api/v1/image/upload",
        headers={"X-API-Key": secret_key},
        files={"file": ("fake.jpg", b"This is not a real image binary file.", "image/jpeg")},
    )
    assert res_corrupt.status_code == 415
    assert res_corrupt.json()["error"]["code"] == "UNSUPPORTED_IMAGE_FORMAT"

    # TEST E: Unsupported extension/format (e.g. .exe or .pdf) -> 415
    res_pdf = await client.post(
        "/api/v1/image/upload",
        headers={"X-API-Key": secret_key},
        files={"file": ("doc.pdf", b"%PDF-1.4...", "application/pdf")},
    )
    assert res_pdf.status_code == 415

    # TEST F: File Too Large (>10MB) -> 413
    oversized_data = b"X" * (11 * 1024 * 1024)  # 11 MB
    res_large = await client.post(
        "/api/v1/image/upload",
        headers={"X-API-Key": secret_key},
        files={"file": ("large.jpg", oversized_data, "image/jpeg")},
    )
    assert res_large.status_code == 413
    assert res_large.json()["error"]["code"] == "FILE_TOO_LARGE"

    # TEST G: Successful Upload with Mocked Cloudinary SDK -> 200 OK
    mock_cloudinary_response = {
        "public_id": f"orvia_uploads/test_{random_id}",
        "url": f"http://res.cloudinary.com/diwp8ug1r/image/upload/v1/orvia_uploads/test_{random_id}.jpg",
        "secure_url": f"https://res.cloudinary.com/diwp8ug1r/image/upload/v1/orvia_uploads/test_{random_id}.jpg",
        "format": "jpg",
        "width": 100,
        "height": 100,
        "bytes": len(valid_jpeg),
        "created_at": "2026-09-28T09:00:00Z",
    }

    with patch("app.services.cloudinary_service.cloudinary.uploader.upload") as mock_upload:
        mock_upload.return_value = mock_cloudinary_response

        res_success = await client.post(
            "/api/v1/image/upload",
            headers={"X-API-Key": secret_key},
            files={"file": ("photo.jpg", valid_jpeg, "image/jpeg")},
        )
        assert res_success.status_code == 200
        data = res_success.json()["data"]
        assert data["public_id"] == mock_cloudinary_response["public_id"]
        assert data["secure_url"] == mock_cloudinary_response["secure_url"]
        assert data["format"] == "jpg"
        assert data["width"] == 100
        assert data["height"] == 100

    # TEST H: Cloudinary Provider Error Handling -> 502
    with patch("app.services.cloudinary_service.cloudinary.uploader.upload") as mock_upload:
        mock_upload.side_effect = Exception("Cloudinary connection reset by peer")

        res_fail = await client.post(
            "/api/v1/image/upload",
            headers={"X-API-Key": secret_key},
            files={"file": ("photo.jpg", valid_jpeg, "image/jpeg")},
        )
        assert res_fail.status_code == 502
        assert res_fail.json()["error"]["code"] == "UPLOAD_PROVIDER_ERROR"

    # TEST I: User checks their uploaded assets -> 1 asset present!
    assets_res = await client.get("/api/v1/user/assets", headers=user_headers)
    assert assets_res.status_code == 200
    assets_data = assets_res.json()["data"]
    assert len(assets_data) >= 1
    assert assets_data[0]["cloudinary_public_id"] == mock_cloudinary_response["public_id"]

    # TEST J: User checks usage stats -> image upload counted!
    usage_res = await client.get("/api/v1/user/usage", headers=user_headers)
    assert usage_res.status_code == 200
    usage_data = usage_res.json()["data"]
    assert usage_data["total_requests"] >= 1

    # TEST K: User checks request logs -> log recorded!
    logs_res = await client.get("/api/v1/user/logs?endpoint=/api/v1/image/upload", headers=user_headers)
    assert logs_res.status_code == 200
    logs_data = logs_res.json()["data"]
    assert len(logs_data) >= 1
    assert logs_data[0]["endpoint"] == "/api/v1/image/upload"

    # TEST L: Admin can list platform assets
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@orvia.dev", "password": "OrviaAdmin2026!"},
    )
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    admin_assets_res = await client.get("/api/v1/admin/assets", headers=admin_headers)
    assert admin_assets_res.status_code == 200
    admin_assets = admin_assets_res.json()["data"]
    assert len(admin_assets) >= 1
