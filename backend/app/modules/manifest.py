from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter


class ParameterSpec(BaseModel):
    name: str
    type: str
    required: bool = True
    description: str
    example: Optional[Any] = None


class DocumentationSpec(BaseModel):
    summary: Optional[str] = None
    parameters: List[ParameterSpec] = []
    request_example: Optional[Dict[str, Any]] = None
    response_example: Optional[Dict[str, Any]] = None
    error_responses: Optional[List[Dict[str, Any]]] = None
    tags: List[str] = []


class ApiModuleManifest(BaseModel):
    """
    Contract for every modular API in Orvia.
    Future APIs provide an instance of this manifest to declare their
    routes, docs, schema, and security requirements without touching core code.
    """
    name: str
    slug: str
    category: str  # image, video, utility, ai, data, developer_tools, other
    version: str = "v1"
    method: str = "POST"
    endpoint: str
    description: str
    status: str = "active"  # active, beta, deprecated, disabled
    authentication_required: bool = True
    rate_limit: str = "60/min"
    documentation: Optional[Dict[str, Any]] = Field(default_factory=dict)

    class Config:
        arbitrary_types_allowed = True
