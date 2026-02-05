import os
from typing import Any, Dict, Optional

import httpx
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

APP_NAME = "xgodo-proxy"
DEFAULT_BASE_URL = "https://xgodo.com"

XGODO_BASE_URL = os.getenv("XGODO_BASE_URL", DEFAULT_BASE_URL).rstrip("/")
XGODO_TOKEN = os.getenv("XGODO_TOKEN", "").strip()
TIMEOUT_SECONDS = float(os.getenv("HTTP_TIMEOUT", "20"))

app = FastAPI(title=APP_NAME, version="1.2.0")

# Serve static UI
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def root():
    # Simple landing page
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/health")
def health():
    return {"ok": True, "service": APP_NAME}


def _require_token() -> str:
    if not XGODO_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="Server misconfigured: XGODO_TOKEN is not set. Add it as an environment variable in Railway.",
        )
    return XGODO_TOKEN


def _auth_headers() -> Dict[str, str]:
    token = _require_token()
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


async def _xgodo_get(path: str, *, params: Optional[Dict[str, Any]] = None) -> Any:
    url = f"{XGODO_BASE_URL}{path}"
    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        try:
            res = await client.get(url, headers=_auth_headers(), params=params)
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Upstream request failed: {str(e)}")

    if res.status_code == 204:
        return {"ok": True, "status_code": 204}

    try:
        data = res.json()
    except Exception:
        data = {"_raw": res.text}

    if res.is_error:
        raise HTTPException(status_code=res.status_code, detail=data)

    return data


async def _xgodo_post(
    path: str,
    *,
    params: Optional[Dict[str, Any]] = None,
    json_body: Optional[Dict[str, Any]] = None,
) -> Any:
    url = f"{XGODO_BASE_URL}{path}"
    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        try:
            res = await client.post(url, headers=_auth_headers(), params=params, json=json_body or {})
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Upstream request failed: {str(e)}")

    if res.status_code == 204:
        return {"ok": True, "status_code": 204}

    try:
        data = res.json()
    except Exception:
        data = {"_raw": res.text}

    if res.is_error:
        raise HTTPException(status_code=res.status_code, detail=data)

    return data


@app.get("/apply")
async def apply_task(job_id: str = Query(..., description="Job ID (required)")):
    """
    Client calls:
      GET /apply?job_id=...

    Server calls xgodo:
      GET /api/v2/tasks/apply?job_id=...
    """
    data = await _xgodo_get("/api/v2/tasks/apply", params={"job_id": job_id})
    return JSONResponse(content={"ok": True, "apply": data})


@app.get("/submit")
async def submit_task(
    job_id: str = Query(..., description="Job ID (required)"),
    job_proof: str = Query(..., description="Job proof (required)"),
):
    """
    Client calls:
      GET /submit?job_id=...&job_proof=...

    Server calls xgodo:
      POST /api/v2/tasks/submit
      Body: { "job_id": "...", "job_proof": "..." }
    """
    payload = {"job_id": job_id, "job_proof": job_proof}
    data = await _xgodo_post("/api/v2/tasks/submit", json_body=payload)
    return JSONResponse(content={"ok": True, "submitted": data})


@app.get("/tasks")
async def task_details(
    task_id: str = Query(..., description="Single task_id details/status (required)"),
):
    """
    ✅ ONLY task_id ভিত্তিক ডিটেল/স্ট্যাটাস দেখা যাবে।

    Client calls:
      GET /tasks?task_id=...

    Server calls xgodo:
      POST /api/v2/tasks/details?task_id=...
    """
    data = await _xgodo_post("/api/v2/tasks/details", params={"task_id": task_id}, json_body={})
    return JSONResponse(content={"ok": True, "task": data})
