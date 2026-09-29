# ComplyWise — Final Engineering Handoff Document

**Target Audience**: Systems Engineer / Deployment Engineer / Technical Lead  
**Branch**: `feature/compliance-scenario-suite`  
**Status**: DEMO-READY & AUDITED  
**Date**: September 2026  

---

## 1. Executive Summary

This handoff packages the complete, hardened statutory compliance scenario suite for ComplyWise. The platform has been enhanced to support **6 curated Indian business profiles** across diverse sectors (Pharmaceuticals, EV Charging, Civil Infrastructure, Apparel Export, Data Centres, and NBFC Microfinance). 

All implementations strictly adhere to the foundational invariant:
$$\mathbf{RAG\ RETRIEVES} \quad \longrightarrow \quad \mathbf{RULES\ DECIDE} \quad \longrightarrow \quad \mathbf{LLM\ EXPLAINS}$$

Engine 2 remains the **sole legal authority** in the application. Large Language Models are strictly confined to generating contextual explanations and answering founder questions; LLMs can never emit legal determinations or alter compliance statuses.

---

## 2. Curated Business Profiles & Verified Outcomes

The 6 canonical business entities are seeded deterministically with fixed UUIDs:

| # | Business Name | UUID | Sector | State | Total Reqs | APPLICABLE | NEEDS_INFO | NOT_APPLICABLE |
|---|---|---|---|---|:---:|:---:|:---:|:---:|
| 1 | **Meridian Pharma Formulations Pvt. Ltd.** | `7f27ea65-f87d-4c48-9764-ae9edb14c506` | Pharma Formulations | Gujarat | 18 | 11 | 3 | 4 |
| 2 | **VoltGrid Mobility Services Pvt. Ltd.** | `8a11ea65-f87d-4c48-9764-ae9edb14c507` | EV Charging Infrastructure | Karnataka | 14 | 9 | 2 | 3 |
| 3 | **ApexBuild Infrastructure Pvt. Ltd.** | `9b22ea65-f87d-4c48-9764-ae9edb14c508` | Commercial Construction | Maharashtra | 14 | 9 | 3 | 2 |
| 4 | **SilkRoute Exports Pvt. Ltd.** | `ac33ea65-f87d-4c48-9764-ae9edb14c509` | Garments & Textile Export | Tamil Nadu | 14 | 8 | 2 | 4 |
| 5 | **CloudAxis Data Centres India Pvt. Ltd.** | `bd44ea65-f87d-4c48-9764-ae9edb14c510` | Colocation Data Centre | Telangana | 15 | 11 | 2 | 2 |
| 6 | **Sahaya Microfinance Services Ltd.** | `ce55ea65-f87d-4c48-9764-ae9edb14c511` | NBFC-MFI Lending | Odisha | 14 | 9 | 2 | 3 |

---

## 3. Key Architectural Enhancements

### 3.1 Bidirectional Sector Isolation Guard (`backend/apps/onboarding/planner.py`)
- Prevents cross-contamination during adaptive question planning.
- Strict industry-specific filters ensure that pure export entities (SilkRoute) never see boiler or chemical discharge questions, and digital IT enterprises (CloudAxis) never see hazardous factory licensing questions.

### 3.2 ActionLinkResolver 4-Tier Model (`backend/demo/destinations.py`)
All statutory obligations now resolve to verified official government URLs:
- `EXACT_ACTION_FORM`: Direct e-filing forms (e.g. DGFT IEC, EPFO E-Sewa).
- `OFFICIAL_SERVICE_PAGE`: Technical standard guidelines (e.g. CEA EVSE regulations, BEE norms).
- `OFFICIAL_PORTAL_REQUIRES_LOGIN`: SPCB OCMMS, RERA, CIMS.
- `ACTION_PAGE_NOT_VERIFIED`: Safe fallback to official statutory gazettes.
- *Zero dummy domains (`example.com`, `placeholder`) exist in the catalog.*

### 3.3 Founder UI vs Admin Control Room Parity
- **Founder View (`/compliance`)**: Prioritizes Action Required obligations (`APPLICABLE` + `NEEDS_INFORMATION`). The collapsible "Audit & Inactive" section exposes `NOT_APPLICABLE` obligations with clear statutory threshold justifications.
- **Admin Control Room (`/admin?tab=compliance`)**: Scrutiny Cockpit provides regulatory officers with AST evaluation traces, fact provenance, and rule conditions.
- **Parity Guarantee**: The legal counts evaluated by Engine 2 are identical across both interfaces.

---

## 4. Test Suite & Verification Results

### 4.1 Pytest Suite
Ran the comprehensive test suite across all 6 scenarios:
```bash
pytest backend/tests/test_all_scenarios.py backend/tests/test_demo_mode.py
```
**Result**: `35 passed in 42.04s (100% pass rate)`

### 4.2 Playwright Real-Browser Validation Suite
Automated real-browser tests in Chromium/Chrome covering:
- Compliance page loading and count validation.
- Statutory action link verification (real URLs).
- Collapsible audit section inspection.
- Workflows roadmap generation.
- Regulatory deadline calendar rendering.
- Admin Control Room legal parity verification.

---

## 5. Deployment Quick Steps

For the deployment engineer bringing this branch live on target infrastructure:

1. **Pull Branch**:
   ```bash
   git fetch origin
   git checkout feature/compliance-scenario-suite
   ```
2. **Environment Variables**:
   Copy `.env.example` to `.env` and set:
   ```ini
   USE_LOCAL_SQLITE=true
   COMPLYWISE_DEMO_MODE=true
   DJANGO_SETTINGS_MODULE=config.settings
   ```
3. **Migrate & Seed**:
   ```bash
   python backend/manage.py migrate
   python backend/demo/seed_demo_suite.py
   ```
4. **Start Daemons**:
   - Backend: `python backend/manage.py runserver 127.0.0.1:8000`
   - Frontend: `cd frontend && bun run dev` (or `bun run build && bun run start`)
5. **Verify**:
   - Health check: `curl http://127.0.0.1:8000/api/v1/health/`
   - Test suite: `pytest backend/tests/test_all_scenarios.py`
