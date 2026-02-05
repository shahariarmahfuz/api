import os
import json
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, Optional, List, Tuple

import httpx
import anyio
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

APP_NAME = "xgodo-proxy"
DEFAULT_BASE_URL = "https://xgodo.com"

XGODO_BASE_URL = os.getenv("XGODO_BASE_URL", DEFAULT_BASE_URL).rstrip("/")
XGODO_TOKEN = os.getenv("XGODO_TOKEN", "").strip()
TIMEOUT_SECONDS = float(os.getenv("HTTP_TIMEOUT", "20"))

# Local DB (SQLite)
DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "data.sqlite3"))

app = FastAPI(title=APP_NAME, version="1.3.0")

# Serve static UI
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def root():
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


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _extract_task_id(payload: Any) -> Optional[str]:
    """
    Try to extract a task identifier from various common upstream response shapes.
    """
    if payload is None:
        return None

    # If it's a simple string/int, might be an id
    if isinstance(payload, (str, int)):
        return str(payload)

    if isinstance(payload, dict):
        # Common top-level keys
        for k in ("task_id", "taskId", "id", "taskID"):
            v = payload.get(k)
            if isinstance(v, (str, int)) and str(v).strip():
                return str(v).strip()

        # Nested common keys
        for k in ("task", "data", "result"):
            v = payload.get(k)
            if isinstance(v, dict):
                for kk in ("task_id", "taskId", "id", "taskID"):
                    vv = v.get(kk)
                    if isinstance(vv, (str, int)) and str(vv).strip():
                        return str(vv).strip()

    return None


def _db_connect() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True) if os.path.dirname(DB_PATH) else None
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _db_init_sync() -> None:
    conn = _db_connect()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                job_id TEXT NOT NULL,
                job_proof TEXT NOT NULL,
                task_id TEXT NULL,
                upstream_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON submissions(task_id);")
        conn.commit()
    finally:
        conn.close()


async def _db_init() -> None:
    await anyio.to_thread.run_sync(_db_init_sync)


def _db_insert_submission_sync(
    *,
    user_id: str,
    job_id: str,
    job_proof: str,
    task_id: Optional[str],
    upstream_payload: Any,
) -> int:
    conn = _db_connect()
    try:
        upstream_json = json.dumps(upstream_payload, ensure_ascii=False, default=str)
        cur = conn.execute(
            """
            INSERT INTO submissions (user_id, job_id, job_proof, task_id, upstream_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, job_id, job_proof, task_id, upstream_json, _utc_now_iso()),
        )
        conn.commit()
        return int(cur.lastrowid)
    finally:
        conn.close()


async def _db_insert_submission(
    *,
    user_id: str,
    job_id: str,
    job_proof: str,
    task_id: Optional[str],
    upstream_payload: Any,
) -> int:
    return await anyio.to_thread.run_sync(
        _db_insert_submission_sync,
        user_id=user_id,
        job_id=job_id,
        job_proof=job_proof,
        task_id=task_id,
        upstream_payload=upstream_payload,
    )


def _db_list_submissions_sync(user_id: str) -> List[Dict[str, Any]]:
    conn = _db_connect()
    try:
        rows = conn.execute(
            """
            SELECT id, user_id, job_id, job_proof, task_id, upstream_json, created_at
            FROM submissions
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user_id,),
        ).fetchall()

        out: List[Dict[str, Any]] = []
        for r in rows:
            upstream = None
            try:
                upstream = json.loads(r["upstream_json"])
            except Exception:
                upstream = {"_raw": r["upstream_json"]}

            out.append(
                {
                    "id": r["id"],
                    "user_id": r["user_id"],
                    "job_id": r["job_id"],
                    "job_proof": r["job_proof"],
                    "task_id": r["task_id"],
                    "created_at": r["created_at"],
                    "upstream": upstream,
                }
            )
        return out
    finally:
        conn.close()


async def _db_list_submissions(user_id: str) -> List[Dict[str, Any]]:
    return await anyio.to_thread.run_sync(_db_list_submissions_sync, user_id)


@app.on_event("startup")
async def _startup() -> None:
    await _db_init()


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
    user_id: str = Query(..., description="User ID (required)"),
    job_id: str = Query(..., description="Job ID (required)"),
    job_proof: str = Query(..., description="Job proof (required)"),
):
    """
    ✅ এখন submit করতে user_id REQUIRED (লোকাল DB-তে সেভ হবে)

    Client calls:
      GET /submit?user_id=...&job_id=...&job_proof=...

    Server calls xgodo:
      POST /api/v2/tasks/submit
      Body: { "job_id": "...", "job_proof": "..." }

    Then server stores a record in local DB (user_id -> submitted tasks).
    """
    payload = {"job_id": job_id, "job_proof": job_proof}
    data = await _xgodo_post("/api/v2/tasks/submit", json_body=payload)

    task_id = _extract_task_id(data)
    row_id = await _db_insert_submission(
        user_id=user_id.strip(),
        job_id=str(job_id).strip(),
        job_proof=str(job_proof),
        task_id=task_id,
        upstream_payload=data,
    )

    return JSONResponse(
        content={
            "ok": True,
            "submitted": data,
            "stored": {
                "submission_id": row_id,
                "user_id": user_id,
                "job_id": job_id,
                "task_id": task_id,
            },
        }
    )


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


@app.get("/user/submissions")
async def user_submissions(
    user_id: str = Query(..., description="User ID (required)"),
):
    """
    ✅ ইউজারের সাবমিট হিস্ট্রি (লোকাল DB) দেখাবে।
    Upstream call করবে না।

    Client calls:
      GET /user/submissions?user_id=...
    """
    submissions = await _db_list_submissions(user_id.strip())
    return JSONResponse(content={"ok": True, "user_id": user_id, "count": len(submissions), "submissions": submissions})


@app.get("/user/tasks")
async def user_tasks_details(
    user_id: str = Query(..., description="User ID (required)"),
):
    """
    ✅ ইউজারের সাবমিট করা সব কাজের ডিটেল একসাথে দেখাবে।
    লোকাল DB থেকে task_id গুলো বের করে, প্রতিটা task_id এর জন্য upstream details এনে একসাথে JSON দেবে।

    Client calls:
      GET /user/tasks?user_id=...
    """
    submissions = await _db_list_submissions(user_id.strip())

    # Collect task_ids in submission order (most recent first), avoid duplicates
    seen: set[str] = set()
    task_ids: List[str] = []
    missing: List[Dict[str, Any]] = []

    for s in submissions:
        tid = s.get("task_id")
        if tid and str(tid).strip():
            tid = str(tid).strip()
            if tid not in seen:
                seen.add(tid)
                task_ids.append(tid)
        else:
            missing.append(
                {
                    "submission_id": s.get("id"),
                    "job_id": s.get("job_id"),
                    "created_at": s.get("created_at"),
                    "reason": "missing_task_id_in_upstream_response",
                    "upstream": s.get("upstream"),
                }
            )

    # Fetch details for each task_id
    details: List[Dict[str, Any]] = []
    for tid in task_ids:
        d = await _xgodo_post("/api/v2/tasks/details", params={"task_id": tid}, json_body={})
        details.append({"task_id": tid, "detail": d})

    return JSONResponse(
        content={
            "ok": True,
            "user_id": user_id,
            "task_count": len(task_ids),
            "missing_task_id_count": len(missing),
            "tasks": details,
            "missing": missing,
        }
    )
