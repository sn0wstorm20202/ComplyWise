# ComplyWise — Production & Demo Deployment Guide

This guide provides zero-to-one instructions for provisioning, configuring, and operating ComplyWise in both high-stakes Demo environments and production cloud clusters.

---

## 1. System Requirements & Prerequisites

| Component | Minimum Version | Recommended | Notes |
|---|---|---|---|
| **Operating System** | Linux (Ubuntu 22.04 LTS) / Windows Server 2022 | Ubuntu 24.04 LTS | Cross-platform Python & JS runtime supported |
| **Python** | 3.11+ | Python 3.12 | Requires virtual environment isolation |
| **Node.js / Bun** | Node 20 LTS or Bun 1.1+ | Bun 1.3+ | Next.js frontend builds cleanly on both |
| **Database** | SQLite 3.35+ (Local) or PostgreSQL 15+ | PostgreSQL 16 with pgvector | SQLite for offline demo mode; Postgres for multi-tenant prod |
| **Memory / CPU** | 4 GB RAM / 2 vCPUs | 8 GB RAM / 4 vCPUs | Accommodates vector embeddings and Next.js SSR cache |

---

## 2. Zero-to-One Quick Start (Demo Mode)

To bring up the entire platform in a reproducible demo environment in under 3 minutes:

### Step 2.1: Clone and Checkout Branch

```bash
git clone https://github.com/organization/complywise.git
cd complywise
git checkout feature/compliance-scenario-suite
```

### Step 2.2: Backend Setup & Seeding

```bash
# 1. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\Activate.ps1

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Configure environment
export USE_LOCAL_SQLITE="true"
export COMPLYWISE_DEMO_MODE="true"
export OPENAI_API_KEY="sk-your-openai-api-key"  # Optional for demo mode

# On Windows PowerShell:
# $env:USE_LOCAL_SQLITE = "true"
# $env:COMPLYWISE_DEMO_MODE = "true"

# 4. Run database migrations
python backend/manage.py migrate

# 5. Seed the canonical 6-scenario demo suite
python backend/demo/seed_demo_suite.py
```

Expected output from seed script:
```text
[SEED] Created default demo user: demo@complywise.test
[SEED] Created default admin officer: admin@complywise.test
[SEED] Seeding Meridian Pharma Formulations Pvt. Ltd. (7f27ea65-f87d-4c48-9764-ae9edb14c506)...
[EVAL] Evaluated 18 requirements: 11 APPLICABLE, 3 NEEDS_INFORMATION, 4 NOT_APPLICABLE.
[SEED] Seeding VoltGrid Mobility Services Pvt. Ltd. (8a11ea65-f87d-4c48-9764-ae9edb14c507)...
[EVAL] Evaluated 14 requirements: 9 APPLICABLE, 2 NEEDS_INFORMATION, 3 NOT_APPLICABLE.
...
[SEED] Demo suite seeding complete. 6 businesses active and evaluated.
```

### Step 2.3: Start Backend API Server

```bash
python backend/manage.py runserver 127.0.0.1:8000
```
Verify backend health:
```bash
curl -I http://127.0.0.1:8000/api/v1/health/
# HTTP/1.1 200 OK
```

### Step 2.4: Frontend Setup & Launch

Open a separate terminal window:
```bash
cd frontend

# Install dependencies (using Bun or npm)
bun install  # or: npm install

# Launch Next.js development server
bun run dev  # or: npm run dev
```

The application is now live at `http://localhost:3000`.

---

## 3. Pre-Configured Demo Accounts & Profiles

| Role | Email | Password | Target URL |
|---|---|---|---|
| **Demo Founder / User** | `demo@complywise.test` | `DemoPassword123!` | `http://localhost:3000/dashboard` |
| **Admin Compliance Officer** | `admin@complywise.test` | `DemoPassword123!` | `http://localhost:3000/admin` |
| **Secondary User** | `founder@example.com` | `DemoPassword123!` | `http://localhost:3000/dashboard` |

### Curated Demo Businesses (Direct Deep-Links)

1. **Meridian Pharma Formulations Pvt. Ltd.** (Pharmaceutical Manufacturing, Gujarat)
   - ID: `7f27ea65-f87d-4c48-9764-ae9edb14c506`
   - URL: `http://localhost:3000/compliance?business_id=7f27ea65-f87d-4c48-9764-ae9edb14c506`
   - Expected: 18 reqs (11 Applicable, 3 Needs Info, 4 Not Applicable)

2. **VoltGrid Mobility Services Pvt. Ltd.** (EV Charging Infrastructure, Karnataka)
   - ID: `8a11ea65-f87d-4c48-9764-ae9edb14c507`
   - URL: `http://localhost:3000/compliance?business_id=8a11ea65-f87d-4c48-9764-ae9edb14c507`
   - Expected: 14 reqs (9 Applicable, 2 Needs Info, 3 Not Applicable)

3. **ApexBuild Infrastructure Pvt. Ltd.** (Commercial Construction, Maharashtra)
   - ID: `9b22ea65-f87d-4c48-9764-ae9edb14c508`
   - URL: `http://localhost:3000/compliance?business_id=9b22ea65-f87d-4c48-9764-ae9edb14c508`
   - Expected: 14 reqs (9 Applicable, 3 Needs Info, 2 Not Applicable)

4. **SilkRoute Exports Pvt. Ltd.** (Garments & Apparel Export, Tamil Nadu)
   - ID: `ac33ea65-f87d-4c48-9764-ae9edb14c509`
   - URL: `http://localhost:3000/compliance?business_id=ac33ea65-f87d-4c48-9764-ae9edb14c509`
   - Expected: 14 reqs (8 Applicable, 2 Needs Info, 4 Not Applicable)

5. **CloudAxis Data Centres India Pvt. Ltd.** (Colocation Data Centre, Telangana)
   - ID: `bd44ea65-f87d-4c48-9764-ae9edb14c510`
   - URL: `http://localhost:3000/compliance?business_id=bd44ea65-f87d-4c48-9764-ae9edb14c510`
   - Expected: 15 reqs (11 Applicable, 2 Needs Info, 2 Not Applicable)

6. **Sahaya Microfinance Services Ltd.** (NBFC-MFI Lending, Odisha)
   - ID: `ce55ea65-f87d-4c48-9764-ae9edb14c511`
   - URL: `http://localhost:3000/compliance?business_id=ce55ea65-f87d-4c48-9764-ae9edb14c511`
   - Expected: 14 reqs (9 Applicable, 2 Needs Info, 3 Not Applicable)

---

## 4. Production Deployment Topology

### Production Architecture Diagram

```
                [ HTTPS Clients / Browsers ]
                             │
                             ▼
                    [ Reverse Proxy / Cloudflare ]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ Next.js 14 SSR ]               [ Gunicorn / Uvicorn ]
    (Port 3000)                      (Django WSGI Port 8000)
            │                                 │
            └───────────────┬─────────────────┘
                            ▼
                [ PostgreSQL 16 + pgvector ]
                            │
               [ Chroma Vector DB / Redis ]
```

### Production Environment Variables

Ensure the following variables are configured in your production secrets manager (e.g. AWS Secrets Manager, Doppler, Vault):

```ini
DJANGO_SETTINGS_MODULE=config.settings
DEBUG=False
SECRET_KEY=long-random-cryptographic-key-for-production
ALLOWED_HOSTS=api.complywise.in,127.0.0.1
CORS_ALLOWED_ORIGINS=https://app.complywise.in
DATABASE_URL=postgresql://complywise_user:db_password@prod-db.internal:5432/complywise
OPENAI_API_KEY=sk-proj-prod-key
COMPLYWISE_DEMO_MODE=false
USE_LOCAL_SQLITE=false
```

### Systemd Service Configuration (Backend)

Create `/etc/systemd/system/complywise-backend.service`:
```ini
[Unit]
Description=ComplyWise Django API Application
After=network.target postgresql.service

[Service]
User=complywise
Group=complywise
WorkingDirectory=/var/www/complywise
EnvironmentFile=/etc/complywise/backend.env
ExecStart=/var/www/complywise/.venv/bin/gunicorn \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    config.asgi:application

Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name app.complywise.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.complywise.in;

    ssl_certificate /etc/letsencrypt/live/app.complywise.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.complywise.in/privkey.pem;

    # Frontend SSR
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API Routing
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Automated Verification Checklist

Run before declaring any deployment live:

1. [ ] **Health Endpoint Check**: `GET /api/v1/health/` returns `{"status": "healthy"}`.
2. [ ] **Scenario Evaluator Verification**: `pytest backend/tests/test_all_scenarios.py` passes 100%.
3. [ ] **Frontend End-to-End Suite**: `bunx playwright test e2e/all-scenarios-suite.spec.ts` passes 100%.
4. [ ] **Security Perimeter**: No internal LLM prompt leaks or provider API keys rendered in public HTML.
5. [ ] **Parity Check**: User compliance counts equal Admin Scrutiny counts for all 6 scenarios.
