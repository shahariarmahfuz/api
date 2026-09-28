import pytest
import uuid


@pytest.mark.asyncio
async def test_auth_signup_and_login(client):
    test_email = f"dev_{uuid.uuid4().hex[:8]}@example.com"

    # 1. Password mismatch validation
    bad_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "name": "Test User",
            "email": test_email,
            "password": "Password123!",
            "confirm_password": "PasswordMismatch!",
        },
    )
    assert bad_res.status_code == 422
    assert bad_res.json()["success"] is False

    # 2. Successful signup
    signup_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "name": "Test User",
            "email": test_email,
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    assert signup_res.status_code == 201
    payload = signup_res.json()
    assert payload["success"] is True
    assert payload["data"]["email"] == test_email
    assert payload["data"]["role"] == "USER"

    # 3. Duplicate email conflict
    dup_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "name": "Duplicate User",
            "email": test_email,
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    assert dup_res.status_code == 409
    assert dup_res.json()["error"]["code"] == "DUPLICATE_RESOURCE"

    # 4. Login with bad password
    bad_login = await client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401

    # 5. Successful login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": "Password123!"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()["data"]
    assert "access_token" in token_data
    assert token_data["user"]["role"] == "USER"

    user_token = token_data["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 6. User accesses /user/profile
    profile_res = await client.get("/api/v1/user/profile", headers=user_headers)
    assert profile_res.status_code == 200
    assert profile_res.json()["data"]["email"] == test_email

    # 7. User accesses /user/usage
    usage_res = await client.get("/api/v1/user/usage", headers=user_headers)
    assert usage_res.status_code == 200
    assert usage_res.json()["data"]["total_requests"] >= 0

    # 8. User attempts to access /admin/overview -> 403 Forbidden!
    admin_fail = await client.get("/api/v1/admin/overview", headers=user_headers)
    assert admin_fail.status_code == 403
    assert admin_fail.json()["error"]["code"] == "PERMISSION_DENIED"


@pytest.mark.asyncio
async def test_admin_access_and_safeguards(client):
    # Login as admin
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@orvia.dev", "password": "OrviaAdmin2026!"},
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin access to /admin/overview
    ov_res = await client.get("/api/v1/admin/overview", headers=admin_headers)
    assert ov_res.status_code == 200
    assert ov_res.json()["data"]["total_users"] >= 1

    # Admin access to /admin/users
    users_res = await client.get("/api/v1/admin/users", headers=admin_headers)
    assert users_res.status_code == 200
    assert len(users_res.json()["data"]) >= 1

    admin_id = admin_login.json()["data"]["user"]["id"]

    # Safeguard: Admin cannot deactivate self
    self_suspend = await client.patch(
        f"/api/v1/admin/users/{admin_id}/status",
        headers=admin_headers,
        json={"status": "suspended"},
    )
    assert self_suspend.status_code == 403
    assert "Safeguard" in self_suspend.json()["error"]["message"]

    # Role separation: Admin cannot access user dashboard endpoints -> 403 Forbidden!
    admin_user_fail = await client.get("/api/v1/user/profile", headers=admin_headers)
    assert admin_user_fail.status_code == 403
    assert admin_user_fail.json()["error"]["code"] == "PERMISSION_DENIED"
    assert "Admin accounts cannot access user dashboard endpoints" in admin_user_fail.json()["error"]["message"]



@pytest.mark.asyncio
async def test_forgot_and_reset_password(client):
    temp_email = f"reset_{uuid.uuid4().hex[:8]}@example.com"
    await client.post(
        "/api/v1/auth/signup",
        json={
            "name": "Reset User",
            "email": temp_email,
            "password": "OldPassword123!",
            "confirm_password": "OldPassword123!",
        },
    )

    # Request reset token
    forgot_res = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": temp_email},
    )
    assert forgot_res.status_code == 200
    reset_token = forgot_res.json()["data"]["reset_token"]
    assert reset_token is not None

    # Reset password
    reset_res = await client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": reset_token,
            "new_password": "NewPassword123!",
            "confirm_password": "NewPassword123!",
        },
    )
    assert reset_res.status_code == 200

    # Login with new password
    login_new = await client.post(
        "/api/v1/auth/login",
        json={"email": temp_email, "password": "NewPassword123!"},
    )
    assert login_new.status_code == 200
