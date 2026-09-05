# ComplyWise — Industrial Compliance & Standards Intelligence Platform

> **Problem Statement ID: 26130**  
> *Efficiency in streamlining industrial approvals, compliance processes, and access to government support services.*

ComplyWise is an AI-powered industrial compliance intelligence platform for Indian businesses.  
It converts fragmented regulatory information into a personalized, explainable, evidence-backed execution plan.

---

## 1. System Architecture

ComplyWise is architected as a clean **modular monolith**:

- **Backend**: Python 3.12+, Django 6.0, Django REST Framework, PostgreSQL / Supabase with `pgvector`
- **Frontend**: Next.js (App Router), React 19, TypeScript, Tailwind CSS
- **AI & Evidence**: OpenAI API (configured via environment variables), provenance-backed evidence records
- **Deployment Target**: Azure-compatible cloud / containerized App Service

### Core Product Principle

```text
Source → Evidence → Verified Knowledge → Structured Rule → Deterministic Applicability → Business Decision
```

AI and RAG are used for classification assistance, extraction, retrieval, and explanation.  
**AI/RAG is never the final authority for regulatory applicability.** Applicability is evaluated deterministically using structured, versioned rules with three-valued logic (`TRUE`, `FALSE`, `UNKNOWN`).

---

## 2. Repository Structure

```text
complywise/
├── backend/
│   ├── manage.py                # Django management entry point
│   ├── pyproject.toml           # Pytest, ruff, and Python toolchain configuration
│   ├── requirements.txt         # Runtime dependencies
│   ├── requirements-dev.txt     # Test and development dependencies
│   ├── config/                  # Django project configuration (settings, URLs, health views)
│   ├── apps/                    # Modular domain apps
│   │   ├── accounts/            # Authentication and user access
│   │   ├── businesses/          # Business entity, active profile, immutable profile versions
│   │   ├── onboarding/          # Adaptive questions, answers, and onboarding state
│   │   ├── knowledge/           # Rules, requirements, evidence, sources
│   │   ├── evidence/            # Authoritative sources and provenance
│   │   ├── applicability/       # AST evaluator, three-valued logic, rule engine
│   │   ├── requirements/        # Requirement catalog and instances
│   │   ├── documents/           # Document requirements, OCR, pre-validation
│   │   ├── workflows/           # Workflows, dependencies, step execution
│   │   ├── calendar/            # Deadlines, renewals, and reminders
│   │   ├── schemes/             # Government scheme eligibility and benefits
│   │   ├── standards/           # BIS / QCO / testing standards intelligence
│   │   ├── regulatory_updates/  # Regulatory changes and review events
│   │   ├── assistant/           # Source-grounded AI assistant
│   │   ├── ingestion/           # Pipeline for acquiring and verifying sources
│   │   └── dashboard/           # Read aggregation layer
│   ├── domain/                  # Pure domain logic (rules AST, evaluation, classification)
│   ├── knowledge_packs/         # Curated, versioned regulatory knowledge packs
│   └── tests/                   # Automated pytest suite (83 foundation tests)
├── frontend/
│   ├── app/                     # Next.js App Router (layout, page)
│   ├── components/              # Shared UI library (Navbar, StatusBadge, MetricCard, etc.)
│   ├── features/                # Feature boundaries (accounts, businesses, onboarding, etc.)
│   ├── lib/api/                 # Typed API client matching FRONTEND_INSTRUCTIONS.md
│   ├── types/                   # Canonical TypeScript status and entity types
│   └── package.json             # Frontend dependencies
├── docs/                        # Authoritative documentation contracts
│   ├── PRD.md                   # Product Requirements Document v2.0
│   ├── TRD.md                   # Technical Requirements Document v2.0
│   ├── FRONTEND_INSTRUCTIONS.md # UI design system and API wiring rules
│   └── PROJECT_EXECUTION.md     # Living implementation roadmap & test tracker
├── .env.example                 # Environment configuration template
├── .gitignore                   # Workspace gitignore rules
└── README.md                    # This document
```

---

## 3. Quickstart & Local Setup

### Prerequisites

- **Python**: `3.12+` (Ensure `python` and `pip` are accessible in your PATH)
- **Node.js**: `v20+` or `v22+` (with `npm v10+`)
- **Database**: [Supabase](https://supabase.com) PostgreSQL project (or local PostgreSQL with `pgvector`). If omitted, ComplyWise runs seamlessly on an offline local SQLite fallback (`.local.sqlite3`).

---

### Step 1: Clone Repository & Configure Environment

```bash
git clone https://github.com/sn0wstorm20202/ComplyWise.git
cd ComplyWise

# Copy environment template
cp .env.example .env
```

Open `.env` in your editor and configure your environment variables:

```env
# Server configuration
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=your-secure-development-secret-key-2026
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,[::1]
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1

# Supabase PostgreSQL Configuration (Target Engine)
# Note: Use the IPv4 Connection Pooler URI (Session Mode: 5432 or Transaction Mode: 6543):
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
DATABASE_CONN_MAX_AGE=0
DATABASE_SSL_REQUIRE=True
ENABLE_PGVECTOR=True

# AI & Regulatory Intelligence Model Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.6-luna
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

> **Supabase Connection Tip**: Supabase direct database hostnames (`db.<ref>.supabase.co`) only provide IPv6 (`AAAA`) records. On standard IPv4 internet connections, use Supabase's connection pooler endpoint (`aws-0-<region>.pooler.supabase.com`) on port `5432` (Session mode) or `6543` (Transaction mode).

---

### Step 2: Backend Setup

Open a terminal in the project root:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate a Python virtual environment
# Windows (PowerShell):
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate

# 3. Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements-dev.txt

# 4. Apply all database migrations to Supabase / PostgreSQL
python manage.py migrate

# 5. Load curated regulatory knowledge packs into the database
python manage.py load_knowledge_packs

# 6. Run the test suite to verify everything passes (242 automated tests)
pytest

# 7. Start the Django development server
python manage.py runserver 127.0.0.1:8000
```

The backend server is now running at:
- **Liveness probe**: `http://127.0.0.1:8000/api/v1/health`
- **Readiness check**: `http://127.0.0.1:8000/api/v1/health/ready`
- **API Root**: `http://127.0.0.1:8000/api/v1/`

---

### Step 3: Frontend Setup

Open a **separate terminal** in the project root:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Verify TypeScript compilation (Zero errors)
npx tsc --noEmit

# 4. Start Next.js development server
npm run dev
```

The web application is now accessible at:
- **Application URL**: `http://localhost:3000`
- **Interactive Onboarding Pipeline**: `http://localhost:3000/onboarding`
- **Operational Dashboard**: `http://localhost:3000/dashboard`


---

## 4. API Foundation

All endpoints return the canonical response envelope:

- **Success**: `{"data": ..., "meta": {...}}`
- **Error**: `{"error": {"code": "...", "message": "...", "details": [...]}}`

### Foundation Endpoints (Task 1)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Unversioned platform liveness probe | No |
| `GET` | `/api/v1/health` | Versioned API liveness check | No |
| `GET` | `/api/v1/health/ready` | Deep readiness probe (DB, pgvector, knowledge packs, integrations) | No |
| `POST` | `/api/v1/auth/register` | Register new user account | No |
| `POST` | `/api/v1/auth/login` | Login and acquire API token | No |
| `POST` | `/api/v1/auth/logout` | Invalidate token | Yes |
| `GET` | `/api/v1/auth/me` | Current user identity (no PAN/Aadhaar stored) | Yes |
| `GET` | `/api/v1/businesses` | List businesses accessible to user | Yes |
| `POST` | `/api/v1/businesses` | Create business with caller as owner | Yes |
| `GET` | `/api/v1/businesses/{id}` | Get business details | Yes |
| `GET` | `/api/v1/businesses/{id}/profile` | Get current business profile and missing variables | Yes |
| `POST` | `/api/v1/businesses/{id}/profile` | Create new immutable profile version (POST, not PUT) | Yes |
| `GET` | `/api/v1/businesses/{id}/profile/history` | Audit trail of all profile versions | Yes |
| `GET` | `/api/v1/profile/variables` | Canonical V01–V19 variable definitions registry | Yes |

---

## 5. Golden Regression Fixtures

The system includes five curated golden fixtures for testing and demo verification:

1. `GUJARAT_FOOD`: Gujarat — Food Processing MSME (FSSAI, GPCB, Factories Act)
2. `TELANGANA_ELECTRONICS`: Telangana — Electronics / Smart Meter (BIS CRS, TSPCB, EPR E-Waste)
3. `GUJARAT_TRADE`: Gujarat — Import / Export Trade (DGFT, IEC, Customs)
4. `TAMIL_NADU_AUTO`: Tamil Nadu — Auto Components (TNPCB, Fire NOC, Factory License)
5. `KARNATAKA_ESDM`: Karnataka — Electronics ESDM (KSPCB, WPC, Legal Metrology)

> **Rule:** Evaluator logic is generic (`rules = load_rules(context); evaluate(rules)`). Evaluator code must never contain `if scenario == ...` branches.

---

## 6. Testing

Run the automated backend test suite:

```bash
cd backend
pytest -v
```

All 242 tests validate:
- Three-valued Kleene logic engine (`TRUE`, `FALSE`, `UNKNOWN`)
- Generic AST rule evaluation (100% dynamic, zero hardcoded industry branches)
- Immutable profile versioning and variable origin provenance tracking
- Authentication, tokens, and data minimization
- Tenant isolation and business access controls
- Knowledge boundaries and statutory validation
- Platform health and deep readiness reporting (Supabase, pgvector, knowledge packs, models)

Run the frontend validation:

```bash
cd frontend
# TypeScript verification
npx tsc --noEmit

# Production Next.js build
npm run build
```

