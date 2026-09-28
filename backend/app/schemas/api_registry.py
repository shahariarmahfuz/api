from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ParameterDoc(BaseModel):
    name: str
    type: str
    required: bool = True
    description: str
    example: Optional[Any] = None


class CodeExample(BaseModel):
    language: str  # curl, python, javascript, etc.
    code: str


class ApiDocumentationSchema(BaseModel):
    summary: Optional[str] = None
    parameters: List[ParameterDoc] = []
    request_example: Optional[Dict[str, Any]] = None
    response_example: Optional[Dict[str, Any]] = None
    error_responses: Optional[List[Dict[str, Any]]] = None
    code_examples: List[CodeExample] = []
    tags: List[str] = []


class ApiRegistryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    slug: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=5)
    category: str = Field(..., min_length=2, max_length=80)
    version: str = Field(default="v1", max_length=20)
    method: str = Field(default="POST", max_length=10)
    endpoint: str = Field(..., min_length=1, max_length=255)
    status: str = Field(default="active", max_length=50)
    authentication_required: bool = True
    rate_limit: str = Field(default="60/min", max_length=50)
    documentation: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ApiRegistryCreate(ApiRegistryBase):
    pass


class ApiRegistryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    version: Optional[str] = None
    method: Optional[str] = None
    endpoint: Optional[str] = None
    status: Optional[str] = None
    authentication_required: Optional[bool] = None
    rate_limit: Optional[str] = None
    documentation: Optional[Dict[str, Any]] = None


class ApiStatusToggle(BaseModel):
    status: str = Field(..., pattern="^(active|disabled|beta|deprecated)$")


class ApiRegistryResponse(ApiRegistryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategorySummary(BaseModel):
    category: str
    count: int
