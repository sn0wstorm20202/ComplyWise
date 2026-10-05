# ComplyWise

An assessment-scoped compliance workspace built as a Django modular monolith and
Next.js application. Published rules determine statutory applicability; the LLM
understands business facts, explains evidence, and supplies bounded contextual
planning when reviewed knowledge is insufficient.

## Start here

- [Code ownership and request tracing](docs/codebase-structure.md)
- [Current backend implementation map](docs/backend-architecture.mmd)
- [Task history](frontend/Reference/task-progress.md)
- [Historical functional-hardening results](docs/functional-hardening-report.md)
- [Environment template](.env.example)

`ARCHITECTURE.md` is an older snapshot, not the current runtime contract.
Historical audit artifacts under `docs/` and `frontend/Reference/old/` record
previous investigations; their test counts and deployment claims are not current
verification.

## Repository

| Location | Owns |
|---|---|
| `backend/config` | Settings, middleware, URL composition, health entry points |
| `backend/apps` | Django domain models, APIs and application services |
| `backend/domain` | Rule AST/evaluation, context, intelligence and provider boundaries |
| `backend/common` | API envelopes, enums, permissions and shared infrastructure |
| `backend/knowledge_packs` | Versioned knowledge loading and catalogs |
| `backend/tests` | Unit, application, API, provider and isolation regression tests |
| `frontend/app` | Next.js route entry points |
| `frontend/features` | Feature-owned composition and logic; onboarding is implemented here |
| `frontend/components` | Shared UI and existing product/landing components |
| `frontend/context` | Authentication, language and active business/assessment state |
| `frontend/lib/api` | Browser-to-backend request boundary and endpoint clients |
| `frontend/types` | Domain contracts exported through the stable `@/types` barrel |
| `frontend/tests`, `frontend/e2e` | Node unit checks and Playwright browser tests |

## Local setup without Docker

Use Python 3.12+ and a compatible Node.js version. Dependencies are declared in
`backend/pyproject.toml`, the requirements files, and `frontend/package.json`.
The following examples use PowerShell from the repository root.

```powershell
Copy-Item .env.example .env
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements-dev.txt
backend/.venv/Scripts/python.exe backend/manage.py migrate
backend/.venv/Scripts/python.exe backend/manage.py runserver 127.0.0.1:8000
```

In another terminal:

```powershell
Set-Location frontend
npm ci
# Configure frontend/.env.local from frontend/.env.example.
npm run dev
```

Frontend: `http://localhost:3000`; API: `http://127.0.0.1:8000/api/v1`.
Health: `/api/v1/health`; readiness: `/api/v1/health/ready`.

Set `DATABASE_URL` for PostgreSQL/Supabase. An absent URL selects local SQLite;
a failed configured PostgreSQL connection does not silently switch databases.
PostgreSQL/pgvector-specific behavior needs PostgreSQL verification. Loading
knowledge packs is an explicit operation (`manage.py load_knowledge_packs`), not
an instruction to fabricate sources or assessment results.

## Integrations

Backend-only configuration is read by `backend/config/settings.py` and the
existing provider boundaries. Never put provider credentials in `NEXT_PUBLIC_*`.

- **LLM:** Gemini is the default registry provider. Configured healthy slots
  rotate; failures try remaining eligible slots, then OpenAI. Pool state and
  cooldowns are process-local. See `domain/providers/gemini_provider.py`.
- **Search:** SerpApi Google `search.json`, configured with `SERPAPI_API_KEY` or
  the existing `SERP_API` alias. Search snippets are candidate context, not evidence.
- **Acquisition:** Crawlee HTTPX/Playwright with PDF extraction. Install the
  required Playwright browser separately for browser acquisition. Firecrawl's
  legacy boundary is inert and is not an active fallback.
- **Retrieval:** local verified-evidence token overlap and the configured external
  ComplianceRAG adapter. A pgvector extension alone does not establish a local
  dense retrieval index.
- **Authentication:** Django password/token authentication plus custom Google
  OAuth handoff. Google client/redirect/consent setup is external configuration;
  see `.env.example` and `apps/accounts/google_auth.py`.

The configured integration endpoints, OAuth setup, available reviewed knowledge,
and provider credentials are deployment-specific. Consult readiness and actual
probe results rather than treating configuration presence as service health.

## Validation

```powershell
Set-Location backend
# Tests use an isolated SQLite database by default; opt-in PostgreSQL tests
# require their own explicitly configured database.
.venv/Scripts/python.exe -m pytest -q
.venv/Scripts/python.exe manage.py check
.venv/Scripts/python.exe manage.py makemigrations --check --dry-run
```

```powershell
Set-Location frontend
node --experimental-strip-types --test tests/*.test.ts
npx tsc --noEmit
npm run lint
npm run build
# Start the frontend on port 3000 before browser tests.
npx playwright test
```

Most regression tests mock external providers. Live integrations are opt-in and
must be reported separately. Browser fixtures verify UI/API contracts; they do
not prove real provider success or legal coverage. Current cleanup validation is
recorded in `docs/codebase-structure.md` without reusing historical counts.
