# xgodo-railway (FastAPI Proxy + HTML UI)

এই প্রজেক্টটা Railway.com এ deploy করার জন্য ready।

## কী করবে?
- আপনার Railway সার্ভারে `XGODO_TOKEN` secret থাকবে
- আপনি ব্রাউজার থেকে আপনার server এ HTML UI দিয়ে টেস্ট করবেন (CORS হবে না)
- এবং চাইলে মেনুয়ালি API endpoint hit করবেন

## Environment Variables (Railway → Variables)
- `XGODO_TOKEN`  (required)  → আপনার xgodo Bearer token
- `XGODO_BASE_URL` (optional) → default: https://xgodo.com
- `HTTP_TIMEOUT` (optional) → default: 20

## Deploy (Railway)
1. GitHub এ এই প্রজেক্ট push করুন
2. Railway → New Project → Deploy from GitHub
3. Variables এ `XGODO_TOKEN` সেট করুন
4. Deploy complete হলে:
   - UI: `https://<your-app>.up.railway.app/`
   - Health: `/health`
   - Apply: `/apply?job_id=...`
   - Submit: `/submit?job_id=...&job_proof=...`
   - Tasks: `/tasks?job_id=...` বা `/tasks?task_id=...`

## Local Run
```bash
pip install -r requirements.txt
export XGODO_TOKEN="..."
uvicorn main:app --reload --port 8000
```
