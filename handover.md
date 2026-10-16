# ComplyWise Engineering Handover: Google OAuth, Demo Reviewer, Compliance UI & FSSAI Rules

> **Branch Context**: `feat/api-orchestration`  
> **Target Audience**: Collaborator / Teammate merging into or from this branch  
> **Status**: Production-ready implementation with unit tests, e2e specifications, and verification runbooks  
> **Date**: October 2026

---

## 1. Executive Summary & Change Rationale

This document provides a comprehensive technical handover for the changes on the `feat/api-orchestration` branch (working tree unstaged/untracked on local commit `b09dbf43`). Four primary capabilities and foundational safeguards are included:

1. **Google OAuth Sign-In Reliability & Security Hardening**:
   - **PostgreSQL Row-Locking Fix**: Eliminated an `HTTP 500` error occurring during `/api/v1/auth/google/exchange` by resolving a PostgreSQL incompatibility with `FOR UPDATE` queries on nullable outer-joined user relations.
   - **Token Clock Skew Resilience**: Added a bounded 30-second clock skew tolerance to token validation to prevent intermittent authentication rejections caused by slight server-host time drift.
   - **Origin Isolation & Cookie State Decoupling**: Solved host-bound OAuth cookie loss when frontend rewrites are enabled by directing the browser initiation specifically to the backend origin.
   - **Log Hygiene**: Sanitized Gunicorn production logs to prevent sensitive OAuth authorization codes from leaking in access logs.
   - **Structured Stage/Reason Logging**: Introduced safe, non-sensitive failure telemetry in Google OAuth callback processing.

2. **Admin & Compliance Officer Demo Reviewer Autofill System**:
   - **Secure, Opt-In Backend Credential Endpoint**: Created `/api/v1/auth/demo-reviewer-credentials` strictly guarded by environment flags (`DEMO_REVIEWER_AUTOFILL_ENABLED`), protected with `no-store` headers, and issuing **no** automatic session tokens.
   - **Least-Privilege Authorization Model**: Configured specifically for the `COMPLIANCE_OFFICER` role (excluding staff and superusers unless explicitly permitted).
   - **Admin Login Route Permissions**: Corrected `/admin/login` to allow users with `is_compliance_officer` permissions in addition to traditional staff/superusers.
   - **Automated Provisioning Management Command**: Added `python manage.py configure_demo_reviewer` to safely and idempotently provision the reviewer account in PostgreSQL.
   - **Reusable Frontend Autofill Component**: Created `<DemoReviewerAutofill />` and integrated it across both `/admin/login` and `/auth/signin?mode=officer`.

3. **Compliance Obligations UI Simplification (Frontend Only)**:
   - Streamlined `frontend/app/compliance/page.tsx` to display strictly actionable obligations.
   - Removed the "Under Review" and "All Requirements" view tabs and excluded audit-trail/quarantine blocks from the user dashboard.
   - Preserved all category domain filters (`ALL`, `FOOD`, `ENVIRONMENT`, etc.), modal details ("Why this applies"), and backend audit data.

4. **Knowledge Pack FSSAI Rule Generalization for Culinary/Food Presets**:
   - Generalized AST condition in `RULE-FSSAI-STATE-01` (`backend/knowledge_packs/fixtures/gujarat_food/rules.json`) and `RULE-FSSAI-CENTRAL-01` (`central_food/rules.json`) so the `OR` check matches food/culinary synonyms: `"FOOD"`, `"RESTAURANT"`, `"KITCHEN"`, `"MEAL"`, `"CATERING"`, `"CAFE"`, `"SNACK"`, `"BEVERAGE"`, `"BAKERY"`, `"MILLET"`, `"AGRO"`, `"GRAIN"`, `"FLOUR"`.
   - Reloaded knowledge packs into the database (`python manage.py load_knowledge_packs --force-status`), enabling presets like **"Neighbourhood Kitchen"** to automatically receive `REQ-FSSAI-STATE-LICENCE`.

---

## 2. Git Status Inventory

Below is the complete analysis of modified and untracked files as reported by `git status`.

### 2.1 Modified Files (Unstaged)

| File Path | Component | Summary of Changes |
| :--- | :--- | :--- |
| [`.env.example`](file:///O:/Project/branches/ComplyWise/.env.example) | Root Config | Added documentation for demo reviewer environment variables (`DEMO_REVIEWER_*`). |
| [`backend/apps/accounts/google_auth.py`](file:///O:/Project/branches/ComplyWise/backend/apps/accounts/google_auth.py) | Backend Auth | 1) `select_for_update(of=("self",))` on `GoogleLoginAttempt`.<br>2) `clock_skew_in_seconds=30` in token validation.<br>3) Structured logging of failure stages without exposing claims/tokens.<br>4) Added `Cache-Control: no-store` and `Referrer-Policy: no-referrer`. |
| [`backend/apps/accounts/urls.py`](file:///O:/Project/branches/ComplyWise/backend/apps/accounts/urls.py) | Backend Routes | Registered route `demo-reviewer-credentials`. |
| [`backend/apps/accounts/views.py`](file:///O:/Project/branches/ComplyWise/backend/apps/accounts/views.py) | Backend Views | Implemented `DemoReviewerCredentialsView` with validation against user roles and passwords. |
| [`backend/config/settings.py`](file:///O:/Project/branches/ComplyWise/backend/config/settings.py) | Backend Settings | Added demo reviewer feature flags and configuration settings. |
| [`backend/entrypoint.sh`](file:///O:/Project/branches/ComplyWise/backend/entrypoint.sh) | Docker / Runtime | Updated Gunicorn access log format to omit query strings (`%U` instead of `%r` with queries). |
| [`backend/knowledge_packs/fixtures/central_food/rules.json`](file:///O:/Project/branches/ComplyWise/backend/knowledge_packs/fixtures/central_food/rules.json) | Knowledge Packs | Generalized `RULE-FSSAI-CENTRAL-01` AST to match culinary/restaurant synonyms. |
| [`backend/knowledge_packs/fixtures/gujarat_food/rules.json`](file:///O:/Project/branches/ComplyWise/backend/knowledge_packs/fixtures/gujarat_food/rules.json) | Knowledge Packs | Generalized `RULE-FSSAI-STATE-01` AST to match culinary/restaurant synonyms. |
| [`backend/tests/test_google_auth.py`](file:///O:/Project/branches/ComplyWise/backend/tests/test_google_auth.py) | Backend Tests | Added assertions verifying row locking uses `of=("self",)`. |
| [`frontend/app/admin/login/page.tsx`](file:///O:/Project/branches/ComplyWise/frontend/app/admin/login/page.tsx) | Admin UI | 1) Allowed `is_compliance_officer` access.<br>2) Removed hardcoded default credentials.<br>3) Integrated `<DemoReviewerAutofill />`. |
| [`frontend/app/auth/signin/page.tsx`](file:///O:/Project/branches/ComplyWise/frontend/app/auth/signin/page.tsx) | User Auth UI | Integrated `<DemoReviewerAutofill />` into officer mode. |
| [`frontend/app/compliance/page.tsx`](file:///O:/Project/branches/ComplyWise/frontend/app/compliance/page.tsx) | Compliance UI | Removed "Under Review" and "All Requirements" view tabs, keeping only Action Required view. |
| [`frontend/lib/api/auth.ts`](file:///O:/Project/branches/ComplyWise/frontend/lib/api/auth.ts) | Frontend Client | Added `authApi.demoReviewerCredentials()`. |
| [`frontend/lib/googleAuth.ts`](file:///O:/Project/branches/ComplyWise/frontend/lib/googleAuth.ts) | Frontend Auth | Updated `startGoogleSignIn()` to compute start URL using `googleAuthStartUrl()`. |

### 2.2 Untracked Files

| File Path | Type | Purpose & Description |
| :--- | :--- | :--- |
| [`backend/apps/accounts/management/commands/configure_demo_reviewer.py`](file:///O:/Project/branches/ComplyWise/backend/apps/accounts/management/commands/configure_demo_reviewer.py) | Management Command | Django command to idempotently create or verify the dedicated demo reviewer account. |
| [`backend/tests/test_demo_reviewer_auth.py`](file:///O:/Project/branches/ComplyWise/backend/tests/test_demo_reviewer_auth.py) | Test Suite | 6 comprehensive pytest cases validating demo credential endpoints, opt-in guards, role restrictions, and provisioning logic. |
| [`frontend/components/DemoReviewerAutofill.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/DemoReviewerAutofill.tsx) | UI Component | Reusable client button that fetches demo credentials on click and pre-fills email/password fields without auto-submitting. |
| [`frontend/lib/googleAuthNavigation.ts`](file:///O:/Project/branches/ComplyWise/frontend/lib/googleAuthNavigation.ts) | Helper Utility | Pure helper to determine direct backend authorization URL, bypassing frontend proxy rewrites. |
| [`frontend/tests/googleAuthNavigation.test.ts`](file:///O:/Project/branches/ComplyWise/frontend/tests/googleAuthNavigation.test.ts) | Unit Test | Node test runner verifying origin resolution and URL parameter encoding. |
| [`frontend/e2e/google-reviewer-auth.spec.ts`](file:///O:/Project/branches/ComplyWise/frontend/e2e/google-reviewer-auth.spec.ts) | E2E Test Suite | Playwright tests verifying button autofill, disabled state handling, and single-use Google exchange. |
| [`frontend/Reference/deployment-instructions.md`](file:///O:/Project/branches/ComplyWise/frontend/Reference/deployment-instructions.md) | Documentation | Step-by-step local verification and Azure deployment manual. |
| [`frontend/Reference/google-auth-reviewer-verification.md`](file:///O:/Project/branches/ComplyWise/frontend/Reference/google-auth-reviewer-verification.md) | Documentation | Technical verification report on Google OAuth and demo reviewer flows. |
| [`handover.md`](file:///O:/Project/branches/ComplyWise/handover.md) | Documentation | Master engineering handover reference. |

---

## 3. Deep Dive: Google OAuth Architecture & Fixes

```
┌─────────────────┐       1. Click "Sign in with Google"       ┌──────────────────┐
│  Client Browser │ ─────────────────────────────────────────> │ Frontend Next.js │
└─────────────────┘                                            └──────────────────┘
         │
         │ 2. Compute PKCE Challenge & Redirect Directly to Backend Origin
         │    (Bypasses Frontend Rewrite to keep cookie on backend domain)
         ▼
┌──────────────────┐      3. Set state cookie & 302 to Google  ┌──────────────────┐
│ Backend (Django) │ ────────────────────────────────────────> │ Google Identity  │
└──────────────────┘                                           └──────────────────┘
         ▲                                                               │
         │ 4. Google redirects back with code & state                    │
         └───────────────────────────────────────────────────────────────┘
         │
         │ 5. Validate nonce, state, exchange code, verify ID Token (with 30s clock skew)
         │    Create one-time Ticket and redirect to Frontend:
         │    https://frontend/auth/google/callback#ticket=...
         ▼
┌─────────────────┐       6. POST ticket + verifier            ┌──────────────────┐
│ Client Browser  │ ─────────────────────────────────────────> │ Backend Exchange │
│ Callback Page   │ <───────────────────────────────────────── │ (Row-locked)     │
└─────────────────┘       7. Return AuthToken + User           └──────────────────┘
```

### 3.1 The PostgreSQL Lock Bug Fix (`of=("self",)`)
- **Problem**: When exchanging the ticket in `GoogleExchangeView`, the query previously chained `.select_related("user")` with a general `.select_for_update()`. In PostgreSQL, `GoogleLoginAttempt.user` is a nullable foreign key rendered as an `OUTER JOIN`. PostgreSQL explicitly disallows `FOR UPDATE` on the nullable side of an outer join and throws a SQL exception (`HTTP 500`).
- **Solution**:
  ```python
  # backend/apps/accounts/google_auth.py
  attempt = (
      GoogleLoginAttempt.objects.select_for_update(of=("self",))
      .select_related("user")
      .filter(ticket_hash=ticket_hash)
      .first()
  )
  ```
  Specifying `of=("self",)` tells PostgreSQL to lock only the `GoogleLoginAttempt` row, completely avoiding the outer-joined `auth_user` relation.

### 3.2 Clock Skew Handling (30-second leeway)
- **Problem**: Small time differences between container hosts and Google Identity servers caused valid ID tokens to be rejected with `Token used before issued` or `Token expired`.
- **Solution**:
  ```python
  id_info = google_id_token.verify_oauth2_token(
      token_response["id_token"],
      google_requests.Request(),
      settings.GOOGLE_AUTH_CLIENT_ID,
      clock_skew_in_seconds=30,
  )
  ```

### 3.3 Direct Origin Navigation
- **Problem**: In Next.js with `rewrite` rules mapping `/api/*` to the Django backend, navigating to `/api/v1/auth/google/start` in the browser caused the `complywise_google_oauth` state cookie to bind to the frontend host, whereas the callback was processed on the backend host, losing state.
- **Solution**: Implemented `googleAuthStartUrl()` in [`frontend/lib/googleAuthNavigation.ts`](file:///O:/Project/branches/ComplyWise/frontend/lib/googleAuthNavigation.ts) to direct the browser directly to the Django backend origin (`NEXT_PUBLIC_API_URL` or `http://127.0.0.1:8000`).

---

## 4. Deep Dive: Demo Reviewer Autofill System

### 4.1 Architecture & Flow

```
┌─────────────────────────────────┐
│ Admin / Officer Sign-In Page    │
│  [Use Demo Reviewer Credentials]│
└─────────────────────────────────┘
                │
                │ Click button
                ▼
┌───────────────────────────────────────────────────────────┐
│ GET /api/v1/auth/demo-reviewer-credentials                │
│ Headers: Cache-Control: no-store                          │
└───────────────────────────────────────────────────────────┘
                │
         Is feature enabled?
                ├─ No  ─> HTTP 403 Forbidden { detail: "Disabled" }
                │
                └─ Yes ─> Validate user exists in DB and is COMPLIANCE_OFFICER
                         Return { email: "...", password: "...", role: "COMPLIANCE_OFFICER" }
                │
                ▼
┌───────────────────────────────────────────────────────────┐
│ Frontend updates state & sets input values                │
│ (Form NOT automatically submitted — requires manual click)│
└───────────────────────────────────────────────────────────┘
```

### 4.2 Security Guards
1. **Disabled by Default**: Controlled via `DEMO_REVIEWER_AUTOFILL_ENABLED=true`.
2. **Explicit Role Constraint**: Only users with `role="COMPLIANCE_OFFICER"` or `is_compliance_officer=True` can have their credentials surfaced. Staff and superuser accounts are strictly forbidden from being surfaced via this endpoint.
3. **No Automatic Sign-In**: No session cookies or JWT tokens are issued by this endpoint. It only populates form inputs so the reviewer can click Sign In.
4. **Cache Neutralization**: Response strictly returns `Cache-Control: no-store, no-cache, must-revalidate, private`.

### 4.3 Automated Provisioning
A Django management command was implemented to safely configure or update the demo reviewer account:
```powershell
python manage.py configure_demo_reviewer `
  --email "reviewer@complywise.in" `
  --password "DemoReviewer!2026" `
  --name "Demo Compliance Reviewer"
```
The command automatically sets `role="COMPLIANCE_OFFICER"`, `is_compliance_officer=True`, `is_staff=False`, `is_superuser=False`, and `email_verified=True`.

---

## 5. Deep Dive: FSSAI Rule Generalization & Compliance UI

### 5.1 FSSAI Rule Generalization
- **Issue**: Businesses created from the "Neighbourhood Kitchen" preset (`product_description = "A neighbourhood restaurant preparing and serving meals on-site, with takeaway service."`) did not receive an FSSAI state food license (`REQ-FSSAI-STATE-LICENCE`) because the condition AST strictly checked `CONTAINS(product_description, 'FOOD')`.
- **Resolution**: Updated `RULE-FSSAI-STATE-01` and `RULE-FSSAI-CENTRAL-01` to test an `OR` branch covering culinary synonyms:
  - `"FOOD"`, `"RESTAURANT"`, `"KITCHEN"`, `"MEAL"`, `"CATERING"`, `"CAFE"`, `"SNACK"`, `"BEVERAGE"`, `"BAKERY"`, `"MILLET"`, `"AGRO"`, `"GRAIN"`, `"FLOUR"`.
- **Database Reload**: Executed `python manage.py load_knowledge_packs --force-status`.
- **Verification**: Evaluated the deterministic engine directly against `Neighbourhood Kitchen` (turnover ₹60L, Karnataka); `REQ-FSSAI-STATE-LICENCE` resolved cleanly to `APPLICABLE`.

### 5.2 Compliance UI Simplification
- In [`frontend/app/compliance/page.tsx`](file:///O:/Project/branches/ComplyWise/frontend/app/compliance/page.tsx), removed view tabs ("Under Review", "All Requirements") and excluded audit blocks.
- The user is now presented with an uncluttered, high-impact view showing only **Action Required** statutory obligations, filterable by sector domain chips (`ALL`, `FOOD`, `ENVIRONMENT`, etc.).

---

## 6. How to Test & Verify

### Step 1: Run Backend Tests
```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests/test_fixtures_regression.py tests/test_demo_reviewer_auth.py tests/test_google_auth.py
```
**Expected Result**: All 28 tests pass in ~10 seconds.

### Step 2: Run Frontend Unit & Type Checks
```powershell
cd frontend
npx tsc --noEmit
node --experimental-strip-types --test tests/googleAuthNavigation.test.ts
```
**Expected Result**: TypeScript completes with 0 errors; 2 unit tests pass.

### Step 3: Run Playwright E2E Tests
```powershell
npx playwright test e2e/google-reviewer-auth.spec.ts
```
**Expected Result**: All 4 browser test suites pass (covers autofill, field editing, disabled state handling, and single-use Google exchange).

---
*End of Handover Documentation.*
