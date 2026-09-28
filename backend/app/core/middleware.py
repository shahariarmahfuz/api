import time
import uuid
import asyncio
from typing import Optional
from starlette.datastructures import Headers, MutableHeaders
from app.core.database import AsyncSessionLocal
from app.services.log_service import LogService
from app.core.logging import logger


class RequestTracingMiddleware:
    """Pure ASGI middleware for attaching request ID to every request/response."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)
        request_id = headers.get("x-request-id") or str(uuid.uuid4())
        scope.setdefault("state", {})
        scope["state"]["request_id"] = request_id

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                resp_headers = MutableHeaders(scope=message)
                resp_headers["X-Request-ID"] = request_id
            await send(message)

        await self.app(scope, receive, send_wrapper)


class RequestLoggingMiddleware:
    """Pure ASGI middleware for measuring request execution time and logging."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.perf_counter()
        status_code = 200

        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 200)
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            path = scope.get("path", "")
            if not path.startswith(("/static", "/favicon.ico", "/openapi.json")):
                duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
                state = scope.get("state", {})
                request_id = state.get("request_id", str(uuid.uuid4()))
                client = scope.get("client")
                client_ip = client[0] if client else None
                method = scope.get("method", "GET")
                api_key_id = state.get("api_key_id")
                user_id = state.get("user_id")

                try:
                    loop = asyncio.get_running_loop()
                    if loop.is_running():
                        loop.create_task(
                            self._persist_log(
                                request_id=request_id,
                                endpoint=path,
                                method=method,
                                status_code=status_code,
                                response_time_ms=duration_ms,
                                ip_address=client_ip,
                                api_key_id=api_key_id,
                                user_id=user_id,
                            )
                        )
                except Exception:
                    pass

    async def _persist_log(
        self,
        request_id: str,
        endpoint: str,
        method: str,
        status_code: int,
        response_time_ms: float,
        ip_address: Optional[str] = None,
        api_key_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> None:
        try:
            async with AsyncSessionLocal() as session:
                log_service = LogService(session)
                await log_service.record_log(
                    request_id=request_id,
                    endpoint=endpoint,
                    method=method,
                    status_code=status_code,
                    response_time_ms=response_time_ms,
                    ip_address=ip_address,
                    api_key_id=api_key_id,
                    user_id=user_id,
                )
                await session.commit()
        except Exception as e:
            logger.debug(f"Failed to record request log: {e}")
