import pytest
import uuid


@pytest.mark.asyncio
async def test_plans_and_subscription_system(client):
    # 1. Public list of active plans
    plans_res = await client.get("/api/v1/plans")
    assert plans_res.status_code == 200
    plans = plans_res.json()["data"]
    assert len(plans) >= 3
    slugs = [p["slug"] for p in plans]
    assert "basic" in slugs
    assert "pro" in slugs
    assert "enterprise" in slugs

    pro_plan = [p for p in plans if p["slug"] == "pro"][0]
    basic_plan = [p for p in plans if p["slug"] == "basic"][0]

    # 2. Admin logs in
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@orvia.dev", "password": "OrviaAdmin2026!"},
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. Admin views plans and coupons
    admin_plans_res = await client.get("/api/v1/admin/plans", headers=admin_headers)
    assert admin_plans_res.status_code == 200
    assert len(admin_plans_res.json()["data"]) >= 3

    admin_coupons_res = await client.get("/api/v1/admin/coupons", headers=admin_headers)
    assert admin_coupons_res.status_code == 200
    assert len(admin_coupons_res.json()["data"]) >= 2

    # 4. Create a fresh test user
    test_email = f"plan_user_{uuid.uuid4().hex[:8]}@example.com"
    signup_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "name": "Subscription Tester",
            "email": test_email,
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    assert signup_res.status_code == 201

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": "Password123!"},
    )
    assert login_res.status_code == 200
    user_token = login_res.json()["data"]["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 5. User checks active subscription -> NO active plan
    sub_res = await client.get("/api/v1/user/subscription/active", headers=user_headers)
    assert sub_res.status_code == 200
    assert sub_res.json()["data"]["has_active_plan"] is False
    assert sub_res.json()["data"]["subscription"] is None

    # 6. User creates an API key
    key_res = await client.post(
        "/api/v1/user/api-keys",
        headers=user_headers,
        json={"name": "Test Key No Plan"},
    )
    assert key_res.status_code == 201
    secret_key = key_res.json()["data"]["secret_key"]

    # 7. User tries to execute protected API -> 403 NO_ACTIVE_PLAN
    exec_no_plan = await client.post(
        "/api/v1/test/execute/image-resize",
        headers={"X-API-Key": secret_key},
        json={"image_url": "https://example.com/test.png"},
    )
    assert exec_no_plan.status_code == 403
    assert exec_no_plan.json()["error"]["code"] == "NO_ACTIVE_PLAN"

    # 8. User validates coupon PRO50 against Basic plan -> should fail plan check!
    bad_val = await client.post(
        "/api/v1/user/subscription/validate-coupon",
        headers=user_headers,
        json={"code": "PRO50", "plan_id": basic_plan["id"]},
    )
    assert bad_val.status_code == 422
    assert "only valid for" in bad_val.json()["error"]["message"]

    # 9. User validates coupon PRO50 against Pro plan -> succeeds with 50% discount
    good_val = await client.post(
        "/api/v1/user/subscription/validate-coupon",
        headers=user_headers,
        json={"code": "PRO50", "plan_id": pro_plan["id"]},
    )
    assert good_val.status_code == 200
    val_data = good_val.json()["data"]
    assert val_data["valid"] is True
    assert val_data["discount_amount"] > 0
    assert val_data["final_price"] < val_data["original_price"]

    # 10. User activates Pro plan with ORVIA100 (100% discount)
    act_res = await client.post(
        "/api/v1/user/subscription/activate-coupon",
        headers=user_headers,
        json={"plan_id": pro_plan["id"], "coupon_code": "ORVIA100"},
    )
    assert act_res.status_code == 200
    act_data = act_res.json()["data"]
    assert act_data["status"] == "ACTIVE"
    assert act_data["amount_paid"] == 0.0

    # 11. User checks active subscription -> has_active_plan: true
    sub_after = await client.get("/api/v1/user/subscription/active", headers=user_headers)
    assert sub_after.status_code == 200
    sub_payload = sub_after.json()["data"]
    assert sub_payload["has_active_plan"] is True
    assert sub_payload["subscription"]["plan_snapshot"]["name"] == "Pro"
    assert sub_payload["usage"]["requests_limit"] == 100000

    # 12. User executes protected API -> now succeeds with 200!
    exec_with_plan = await client.post(
        "/api/v1/test/execute/image-resize",
        headers={"X-API-Key": secret_key},
        json={"image_url": "https://example.com/test.png"},
    )
    assert exec_with_plan.status_code == 200
    assert exec_with_plan.json()["success"] is True

    # 13. Prevent duplicate coupon redemption
    dup_coupon = await client.post(
        "/api/v1/user/subscription/activate-coupon",
        headers=user_headers,
        json={"plan_id": pro_plan["id"], "coupon_code": "ORVIA100"},
    )
    assert dup_coupon.status_code == 422
    assert "already redeemed" in dup_coupon.json()["error"]["message"]

    # 14. Architecture-ready payment initiation
    enterprise_id = [p["id"] for p in plans if p["slug"] == "enterprise"][0]
    pay_res = await client.post(
        "/api/v1/user/subscription/initiate-payment",
        headers=user_headers,
        json={"plan_id": enterprise_id, "billing_interval": "yearly"},
    )
    assert pay_res.status_code == 200

    pay_data = pay_res.json()["data"]
    assert pay_data["status"] == "PENDING"
    assert pay_data["payment_reference"].startswith("pi_orv_")
