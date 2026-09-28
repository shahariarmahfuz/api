from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class ApiRequestLogResponse(BaseModel):
    id: str
    request_id: str
    api_id: Optional[str] = None
    endpoint: str
    method: str
    status_code: int
    response_time_ms: float
    ip_address: Optional[str] = None
    api_key_id: Optional[str] = None
    user_id: Optional[str] = None
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class LogStatsResponse(BaseModel):
    total_requests: int
    success_requests: int
    error_requests: int
    avg_response_time_ms: float
    status_breakdown: Dict[str, int]
    top_endpoints: List[Dict[str, Any]]
