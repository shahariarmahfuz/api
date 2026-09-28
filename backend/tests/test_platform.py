import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data
    assert data["app_name"] == "Orvia"


@pytest.mark.asyncio
async def test_api_catalog_list(client):
    response = await client.get("/api/v1/apis")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert len(payload["data"]) >= 5
    assert "pagination" in payload


@pytest.mark.asyncio
async def test_api_detail_and_not_found(client):
    # Existing slug
    response = await client.get("/api/v1/apis/image-resize")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["slug"] == "image-resize"
    assert payload["data"]["category"] == "image"

    # Non-existing slug should return uniform JSON error
    err_res = await client.get("/api/v1/apis/non-existent-api-xyz")
    assert err_res.status_code == 404
    err_payload = err_res.json()
    assert err_payload["success"] is False
    assert "error" in err_payload
    assert err_payload["error"]["code"] == "RESOURCE_NOT_FOUND"


@pytest.mark.asyncio
async def test_categories(client):
    response = await client.get("/api/v1/apis/categories")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    categories = [c["category"] for c in payload["data"]]
    assert "image" in categories or "utility" in categories


@pytest.mark.asyncio
async def test_system_overview(client):
    response = await client.get("/api/v1/system/overview")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["total_apis"] >= 5
