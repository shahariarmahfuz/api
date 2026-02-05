import os
import sqlite3
from datetime import datetime
from typing import Dict, Any, List

import httpx
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

# ================= CONFIG =================
XGODO_BASE_URL = os.getenv("XGODO_BASE_URL", "https://xgodo.com").rstrip("/")
XGODO_TOKEN = os.getenv("XGODO_TOKEN", "")
DB_PATH = "data.db"
TIMEOUT = 20

FINAL_LOCK = {"submitted", "confirmed"}
HIDDEN = {"declined"}

# ================= APP =================
app = FastAPI(title="Xgodo User Tracker", version="4.0.0")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def ui():
    return FileResponse("static/index.html")

# ================= DB =================
def db():
    return sqlite3.connect(DB_PATH)

def init_db():
    con = db()
    con.execute("""
        CREATE TABLE IF NOT EXISTS user_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            job_id TEXT NOT NULL,
            job_task_id TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT,
            updated_at TEXT
        )
    """)
    con.commit()
    con.close()

init_db()

# ================= HELPERS =================
def headers():
    if not XGODO_TOKEN:
        raise HTTPException(500, "XGODO_TOKEN missing")
    return {
        "Authorization": f"Bearer {XGODO_TOKEN}",
        "Content-Type": "application/json"
    }

async def xgodo_details(task_id: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.post(
            f"{XGODO_BASE_URL}/api/v2/tasks/details",
            headers=headers(),
            params={"task_id": task_id},
            json={}
        )
    data = r.json()
    if r.is_error:
        raise HTTPException(r.status_code, data)
    return data.get("task") or data

# ================= API =================

@app.get("/submit")
async def submit(
    user_id: str = Query(...),
    job_id: str = Query(...),
    job_proof: str = Query(...)
):
    payload = {"job_id": job_id, "job_proof": job_proof}

    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.post(
            f"{XGODO_BASE_URL}/api/v2/tasks/submit",
            headers=headers(),
            json=payload
        )

    data = r.json()
    if r.is_error:
        raise HTTPException(r.status_code, data)

    job_task_id = data.get("submitted", {}).get("job_task_id")
    if not job_task_id:
        raise HTTPException(500, "job_task_id missing")

    now = datetime.utcnow().isoformat()
    con = db()
    con.execute("""
        INSERT OR IGNORE INTO user_tasks
        (user_id, job_id, job_task_id, status, created_at, updated_at)
        VALUES (?,?,?,?,?,?)
    """, (user_id, job_id, job_task_id, "submitted", now, now))
    con.commit()
    con.close()

    return JSONResponse(content=data)  # raw xgodo response

@app.get("/user/tasks")
async def user_tasks(user_id: str = Query(...)):
    con = db()
    rows = con.execute("""
        SELECT job_task_id, status
        FROM user_tasks
        WHERE user_id=?
    """, (user_id,)).fetchall()

    results: List[Dict[str, Any]] = []

    for job_task_id, status in rows:

        if status in HIDDEN:
            continue

        if status in FINAL_LOCK:
            results.append({
                "job_task_id": job_task_id,
                "status": status
            })
            continue

        task = await xgodo_details(job_task_id)
        new_status = task.get("status", status)

        con.execute("""
            UPDATE user_tasks
            SET status=?, updated_at=?
            WHERE job_task_id=?
        """, (new_status, datetime.utcnow().isoformat(), job_task_id))
        con.commit()

        if new_status not in HIDDEN:
            results.append({
                "job_task_id": job_task_id,
                "status": new_status,
                "task": task
            })

    con.close()

    return {
        "ok": True,
        "user_id": user_id,
        "total": len(results),
        "tasks": results
    }

@app.get("/health")
def health():
    return {"ok": True}
