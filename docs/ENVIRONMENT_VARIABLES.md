# ComplyWise — Canonical Environment Variables Reference

This document provides the definitive specification of all environment variables used across the ComplyWise platform (Backend Django, Frontend Next.js, and Demo Mode subsystem).

---

## 1. Core Platform Configuration

| Variable | Type | Default | Description | Example |
|---|---|---|---|---|
| `DJANGO_SETTINGS_MODULE` | string | `config.settings` | Points to the primary Django settings module. | `config.settings` |
| `SECRET_KEY` | string | (Insecure default in dev) | Cryptographic key for session signing, CSRF protection, and JWT generation. Must be 50+ random characters in production. | `django-insecure-prod-key-xyz...` |
| `DEBUG` | boolean | `False` | Toggles Django debug mode. Must be `False` in production to prevent traceback disclosure. | `False` |
| `ALLOWED_HOSTS` | comma-separated list | `*` in dev | Hostnames and IP addresses permitted to serve requests. | `localhost,127.0.0.1,api.complywise.in` |
| `CORS_ALLOWED_ORIGINS` | comma-separated list | `http://localhost:3000,...` | Allowed CORS origins for frontend web application. | `http://localhost:3000,https://app.complywise.in` |

---

## 2. Database & Storage Configuration

| Variable | Type | Default | Description | Example |
|---|---|---|---|---|
| `USE_LOCAL_SQLITE` | boolean | `false` | When set to `true`, forces Django to use local file-backed SQLite database (`backend/.local.sqlite3`) instead of PostgreSQL / Supabase pooler. Essential for offline demo runs, automated CI/CD pipelines, and isolated testing. | `true` |
| `DATABASE_URL` | string (URI) | `""` | Connection string for primary PostgreSQL database when `USE_LOCAL_SQLITE` is not enabled. | `postgresql://postgres:pwd@db.supabase.co:5432/postgres` |
| `SUPABASE_URL` | string (URI) | `""` | Supabase API URL for storage buckets and direct database integrations. | `https://xyzproject.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | string | `""` | Elevated Supabase admin API key for backend migrations and storage operations. | `eyJhbGciOi...` |

---

## 3. Demo Mode & Scenario Suite Configuration

| Variable | Type | Default | Description | Example |
|---|---|---|---|---|
| `COMPLYWISE_DEMO_MODE` | boolean | `true` | Enables deterministic scenario discovery, catalog resolution, and controlled statutory evaluation for curated demo businesses. Guarantees 100% predictable compliance outcomes for investor presentations. | `true` |
| `SEED_DEMO_DATA` | boolean | `false` | When set to `true` during startup or seed scripts, initializes the 6 canonical demo enterprises and evaluates their statutory compliance packs. | `true` |

---

## 4. Artificial Intelligence & RAG Retrieval Configuration

| Variable | Type | Default | Description | Example |
|---|---|---|---|---|
| `OPENAI_API_KEY` | string | `""` | OpenAI API key for LLM explanation generation (`gpt-4o` / `gpt-4o-mini`) and text embeddings (`text-embedding-3-small`). *Note: Engine 2 remains the sole legal authority; LLM output never overrides statutory rules.* | `sk-proj-...` |
| `CHROMA_PERSIST_DIRECTORY` | string (path) | `backend/data/chroma` | Local directory containing persistent Chroma vector database indexes for gazettes, circulars, and notifications. | `/var/data/complywise/chroma` |
| `RAG_SIMILARITY_THRESHOLD` | float | `0.65` | Minimum cosine similarity threshold for statutory document retrieval. | `0.70` |

---

## 5. Frontend (Next.js) Environment Variables

| Variable | Type | Default | Description | Example |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | string (URI) | `http://localhost:8000/api/v1` | Public backend base URL used by browser client requests. | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_DEMO_MODE` | boolean | `true` | Frontend flag enabling quick demo presets, prefilled answers, and fast login switcher. | `true` |
| `PORT` | integer | `3000` | Port for the Next.js production or development server. | `3000` |
| `NO_PROXY` | comma-separated list | `""` | Internal network proxy bypass list (critical in sandboxed and corporate proxy environments). | `localhost,127.0.0.1` |

---

## 6. Pre-Flight Verification Script

To verify all required environment variables are set correctly in your target environment, run:

```bash
# In backend virtualenv
python -c "
import os
from config import settings
print(f'Django Debug: {settings.DEBUG}')
print(f'Database Engine: {settings.DATABASES[\"default\"][\"ENGINE\"]}')
print(f'Demo Mode: {os.getenv(\"COMPLYWISE_DEMO_MODE\", \"false\")}')
"
```
