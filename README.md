# Orvia — Modular API Platform

**Orvia** is a production-ready, scalable, and modular API platform foundation built with **FastAPI**, **SQLAlchemy 2.x**, **PostgreSQL (Neon)**, **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## 1. System Architecture

Orvia is architected with strict separation of concerns, decoupling infrastructure (authentication, logging, key management, rate limiting, cataloging) from business API modules.

```
orvia/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint, lifespan, CORS, middleware
│   │   ├── core/                    # Core configuration, DB, security, error handlers
│   │   │   ├── config.py            # Pydantic Settings & async DB URL normalization
│   │   │   ├── database.py          # SQLAlchemy 2.x async engine & sessionmaker
│   │   │   ├── security.py          # bcrypt password hashing & SHA-256 API key hashing
│   │   │   ├── middleware.py        # Request tracing (UUID) & async logging middleware
│   │   │   ├── errors.py            # Uniform JSON error handlers
│   │   │   └── logging.py           # Structured logger
│   │   ├── models/                  # DeclarativeBase SQLAlchemy 2.x models
│   │   │   ├── user.py              # Users & roles (admin, developer)
│   │   │   ├── api_registry.py      # Central API Registry & metadata specs
│   │   │   ├── api_key.py           # API keys (hashed storage, prefix, usage tracking)
│   │   │   └── api_request_log.py   # Request audit trail, status codes & latency
│   │   ├── schemas/                 # Pydantic schemas (requests, responses, pagination)
│   │   ├── repositories/            # Clean DB query layer (CRUD, filtering, stats)
│   │   ├── services/                # Business logic layer (Auth, Registry, Keys, Logs)
│   │   ├── api/                     # Versioned routing (/api/v1/...)
│   │   │   ├── router.py            # Main router & health check
│   │   │   ├── deps.py              # Dependencies: get_db, verify_api_key, get_current_user
│   │   │   └── v1/routes/
│   │   │       ├── auth.py          # Register, Login, Me
│   │   │       ├── registry.py      # Catalog list, details, categories, status toggle
│   │   │       ├── api_keys.py      # Generate, list, revoke keys
│   │   │       ├── logs.py          # Request logs & platform analytics
│   │   │       ├── system.py        # System overview metrics & sync
│   │   │       └── tester.py        # Live interactive playground sandbox
│   │   ├── modules/                 # Modular API manifest system for future APIs
│   │   │   ├── manifest.py          # ApiModuleManifest contract
│   │   │   └── registry.py          # Dynamic module registry & DB synchronizer
│   │   └── seed.py                  # Initial seed: admin, demo key, demo catalog
│   ├── alembic/                     # Database migrations
│   ├── tests/                       # Automated pytest-asyncio test suite
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx               # Root dark-mode layout with Navbar and Footer
│   │   ├── page.tsx                 # Homepage: Hero, platform telemetry, architecture
│   │   ├── apis/
│   │   │   ├── page.tsx             # Dynamic API Catalog with live search & categories
│   │   │   └── [slug]/
│   │   │       └── page.tsx         # API Detail, parameters, cURL/Python/JS & Playground
│   │   ├── docs/                    # Developer documentation system
│   │   │   ├── layout.tsx           # Docs sidebar navigation
│   │   │   ├── page.tsx             # Docs index
│   │   │   ├── getting-started/     # Quickstart guide
│   │   │   ├── authentication/      # API Keys & Bearer tokens
│   │   │   ├── api-keys/            # Key generation & hashing security
│   │   │   └── architecture/        # Modular API creation guide
│   │   ├── dashboard/               # Administrative Console
│   │   │   ├── layout.tsx           # Console sidebar
│   │   │   ├── page.tsx             # Telemetry overview & instant test widget
│   │   │   ├── apis/page.tsx        # API Registry management & live status toggle
│   │   │   ├── api-keys/page.tsx    # Key manager (reveal once, copy, revoke)
│   │   │   ├── logs/page.tsx        # Real-time request audit log viewer
│   │   │   └── settings/page.tsx    # PostgreSQL Neon health & settings
│   │   └── status/page.tsx          # Real-time system health & DB latency status
│   ├── components/                  # Navbar, Footer, Badge, CodeBlock, Playground
│   ├── lib/api.ts                   # Central typed API client
│   ├── types/index.ts               # TypeScript data models
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml               # Multi-container deployment configuration
├── .env.example                     # Environment variables template
└── README.md
```

---

## 2. Database Schema (PostgreSQL)

All models inherit from `TimestampMixin` and utilize UUID primary keys:

1. **`users`**:
   - `id` (VARCHAR(36), PK)
   - `name` (VARCHAR(120))
   - `email` (VARCHAR(255), Unique, Indexed)
   - `hashed_password` (VARCHAR(255), bcrypt)
   - `role` (VARCHAR(50), e.g. "admin", "developer")
   - `status` (VARCHAR(50), e.g. "active")
   - `created_at`, `updated_at`

2. **`api_registry`**:
   - `id` (VARCHAR(36), PK)
   - `name` (VARCHAR(150))
   - `slug` (VARCHAR(150), Unique, Indexed)
   - `description` (TEXT)
   - `category` (VARCHAR(80), Indexed)
   - `version` (VARCHAR(20), default "v1")
   - `method` (VARCHAR(10), default "POST")
   - `endpoint` (VARCHAR(255))
   - `status` (VARCHAR(50), "active" | "beta" | "deprecated" | "disabled")
   - `authentication_required` (BOOLEAN)
   - `rate_limit` (VARCHAR(50), e.g. "60/min")
   - `documentation` (JSONB, parameters, request/response examples, tags)
   - `created_at`, `updated_at`

3. **`api_keys`**:
   - `id` (VARCHAR(36), PK)
   - `name` (VARCHAR(100))
   - `key_prefix` (VARCHAR(32), Indexed, e.g. `orv_live_9f8a...`)
   - `key_hash` (VARCHAR(64), Unique, Indexed, SHA-256)
   - `owner_id` (VARCHAR(36), FK users.id)
   - `status` (VARCHAR(30), "active" | "revoked" | "expired")
   - `rate_limit` (VARCHAR(50))
   - `last_used_at` (TIMESTAMP)
   - `expires_at` (TIMESTAMP)
   - `created_at`, `updated_at`

4. **`api_request_logs`**:
   - `id` (VARCHAR(36), PK)
   - `request_id` (VARCHAR(64), Indexed, UUID)
   - `api_id` (VARCHAR(36), FK api_registry.id)
   - `endpoint` (VARCHAR(255), Indexed)
   - `method` (VARCHAR(10))
   - `status_code` (INTEGER, Indexed)
   - `response_time_ms` (FLOAT)
   - `ip_address` (VARCHAR(45))
   - `api_key_id` (VARCHAR(36), FK api_keys.id)
   - `user_id` (VARCHAR(36), FK users.id)
   - `timestamp` (TIMESTAMP, Indexed)
   - `created_at` (TIMESTAMP)

---

## 3. Standardized Response Format

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional status message",
  "request_id": "c1f7a4e6-d92a-4a61-80a5-29e847c1b415"
}
```

### Error Response:
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid or missing API key."
  },
  "request_id": "c1f7a4e6-d92a-4a61-80a5-29e847c1b415"
}
```

---

## 4. How to Add a New API in Future (Modular Workflow)

Adding a new API requires **no changes** to existing platform files:

1. **Define Schema**: Create input/output models in `backend/app/schemas/<category>/<api>.py`.
2. **Implement Service**: Write isolated business logic in `backend/app/services/<category>/<api>.py`.
3. **Mount Route**: Create the FastAPI router in `backend/app/api/v1/routes/<category>/<api>.py`.
4. **Declare Manifest**: Create an `ApiModuleManifest` defining its category, method, endpoint, rate limit, auth requirement, and documentation.
5. **Run App**: The platform automatically synchronizes the manifest into PostgreSQL on startup, exposing it immediately on the catalog, detail pages, and Swagger UI.

---

## 5. How to Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL connection string (e.g. Neon)

### 1. Environment Setup
```bash
cp .env.example .env
# Edit .env and supply your DATABASE_URL
```

### 2. Backend Setup & Startup
```bash
cd backend
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Run tests
pytest -v

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Gateway: `http://localhost:8000`
- Interactive OpenAPI / Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 3. Frontend Setup & Startup
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

---

## 6. How to Run with Docker Compose

```bash
docker compose up --build
```
Both backend and frontend will boot with automated health checks and connected networking.
