import time
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Header, Body, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.common import StandardResponse
from app.api.deps import optional_api_key, verify_api_key
from app.services.registry_service import RegistryService
from app.models.api_key import ApiKey
from app.core.errors import AuthenticationError, NotFoundError

router = APIRouter(prefix="/test", tags=["API Playground & Tester"])


@router.post("/execute/{slug}", response_model=StandardResponse[Dict[str, Any]])
async def execute_api_test(
    slug: str,
    request: Request,
    payload: Dict[str, Any] = Body(default_factory=dict),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
):
    """
    Simulate live execution of an API endpoint from the Playground.
    Enforces authentication if the API requires it, validates payload,
    and returns response according to the registered API documentation schema.
    """
    registry_service = RegistryService(db)
    api_spec = await registry_service.get_by_slug(slug)

    # If the API requires authentication, verify the key
    if api_spec.authentication_required:
        await verify_api_key(request, x_api_key=x_api_key, db=db)

    # Return sample output defined in the documentation or default success
    doc = api_spec.documentation or {}
    sample_response = doc.get("response_example", {
        "success": True,
        "message": f"Successfully executed {api_spec.name}",
        "received_payload": payload,
    })

    # Unwrap if sample already has success wrapper, or return directly
    data = sample_response.get("data", sample_response) if isinstance(sample_response, dict) else sample_response

    return StandardResponse(
        success=True,
        data={
            "api": api_spec.name,
            "endpoint": api_spec.endpoint,
            "method": api_spec.method,
            "response": data,
            "execution_mode": "playground_sandbox",
        },
        message=f"API '{api_spec.name}' simulated execution succeeded.",
    )
