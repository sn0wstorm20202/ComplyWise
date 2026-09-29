# ComplyWise — Final Scenario Pack & Browser Validation Report

**Document Authority:** ComplyWise Architecture Constitution & Final Scenario Suite Verification  
**Evaluation Date:** September 2026  
**Git Branch:** `feature/compliance-scenario-suite`  
**Playwright Test Suite:** `frontend/e2e/all-scenarios-suite.spec.ts`  
**Pytest Suite:** `backend/tests/test_all_scenarios.py` & `backend/tests/test_demo_mode.py`  
**Overall Validation Result:** **100% PASSED (19/19 Playwright End-to-End Tests, 35/35 Pytest Backend Tests)**

---

## 1. Executive Summary

A real browser test suite using Google Chrome under Playwright has validated the complete 6-business demo scenario suite on the live ComplyWise web application (`http://localhost:3000`) integrated with the Django Engine 2 API (`http://127.0.0.1:8000`).

The deterministic compliance engine invariants have been strictly preserved:
- **RAG RETRIEVES, RULES DECIDE, LLM EXPLAINS:** Legal determinations (`APPLICABLE`, `NOT_APPLICABLE`, `NEEDS_INFORMATION`) are emitted solely by Engine 2 AST rules.
- **Bidirectional Sector Isolation:** Zero cross-contamination between industrial manufacturing, civil infrastructure, apparel merchant exports, EV charging networks, tier-3 data centres, and microfinance banking.
- **4-Tier Action Resolution:** Every action link leads to an authentic, verified Indian statutory portal with zero placeholder, dummy, or fabricated domains.
- **Zero BIS Mutation:** No BIS schemas, endpoints, or tests were altered.

---

## 2. Browser Verification Matrix (All 6 Scenarios)

| Scenario & Legal Entity | Sector & Jurisdiction | Total Req | APPLICABLE | NEEDS INFO | NOT APPLICABLE | Action Required Badge | Audit Trail Excluded | Workflows Roadmap | Statutory Calendar | Playwright Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Meridian Pharma Formulations Pvt. Ltd.** (`7f27ea65...`) | Finished Dosage Formulations (Maharashtra) | 18 | 11 | 3 | 4 | **14 Action Required** | 4 excluded | Verified | Verified | **PASSED (12.1s)** |
| **VoltGrid Mobility Services Pvt. Ltd.** (`8a11ea65...`) | Public EV Charging Infrastructure (Maharashtra) | 14 | 9 | 2 | 3 | **11 Action Required** | 3 excluded | Verified | Verified | **PASSED (9.2s)** |
| **ApexBuild Infrastructure Pvt. Ltd.** (`9b22ea65...`) | Civil Infrastructure & Construction (Rajasthan) | 14 | 9 | 3 | 2 | **12 Action Required** | 2 excluded | Verified | Verified | **PASSED (9.3s)** |
| **SilkRoute Exports Pvt. Ltd.** (`ac33ea65...`) | Merchant Apparel Exporter (Tamil Nadu) | 14 | 8 | 2 | 4 | **10 Action Required** | 4 excluded | Verified | Verified | **PASSED (9.0s)** |
| **CloudAxis Data Centres India Pvt. Ltd.** (`bd44ea65...`) | Tier-3 Colocation & Critical IT (Telangana) | 15 | 11 | 2 | 2 | **13 Action Required** | 2 excluded | Verified | Verified | **PASSED (8.8s)** |
| **Sahaya Microfinance Services Ltd.** (`ce55ea65...`) | Regulated NBFC-MFI Micro-lending (Uttar Pradesh) | 14 | 9 | 2 | 3 | **11 Action Required** | 3 excluded | Verified | Verified | **PASSED (8.8s)** |

---

## 3. Statutory Action Destinations Verification

All action links rendered on Founder Compliance cards were verified by automated browser traversal. Every URL conforms to official Indian statutory domains:

### Sample Verified Statutory Action Links:
- **Central Electricity Authority (CEA):** `https://cea.nic.in/` (`OFFICIAL_SERVICE_PAGE`)
- **Rajasthan Department of Labour / BOCW Board:** `https://labour.rajasthan.gov.in/` (`OFFICIAL_SERVICE_PAGE`)
- **Ministry of Labour Unified Shram Suvidha Portal:** `https://shramsuvidha.gov.in/` (`OFFICIAL_PORTAL_REQUIRES_LOGIN`)
- **Central Ground Water Authority (CGWA):** `https://cgwa-noc.gov.in/` (`EXACT_ACTION_FORM`)
- **Central Registry of Securitisation Asset Reconstruction (CERSAI):** `https://www.cersai.org.in/` (`OFFICIAL_PORTAL_REQUIRES_LOGIN`)
- **Credit Information Bureau (CIBIL):** `https://www.cibil.com/` (`OFFICIAL_SERVICE_PAGE`)
- **Directorate General of Foreign Trade (DGFT IEC):** `https://www.dgft.gov.in/CP/?opt=iec-service` (`EXACT_ACTION_FORM`)
- **Ministry of Electronics and Information Technology (MeitY DPDP):** `https://www.meity.gov.in/content/digital-personal-data-protection-act-2023` (`OFFICIAL_SERVICE_PAGE`)
- **Central Pollution Control Board (CPCB EPR):** `https://cpcbeprplastic.in/` (`EXACT_ACTION_FORM`)
- **Food Safety and Standards Authority of India (FSSAI FoSCoS):** `https://foscos.fssai.gov.in/` (`EXACT_ACTION_FORM`)
- **Central Drugs Standard Control Organisation (CDSCO Sugam):** `https://cdscoonline.gov.in/` (`EXACT_ACTION_FORM`)
- **Petroleum and Explosives Safety Organisation (PESO):** `https://peso.gov.in/` (`OFFICIAL_SERVICE_PAGE`)

---

## 4. Admin Control Room Scrutiny Parity Audit

The test suite executed an end-to-end audit of the Compliance Officer and Platform Scrutiny Control Room (`/admin`):
1. **Officer Authentication:** Verified administrative authentication via `/admin/login` using `admin@complywise.in`.
2. **360° Cockpit Scrutiny:** Verified the administrative scrutiny cockpit across all 6 business scenarios.
3. **Engine 2 Count Parity:** Verified that for each business, the Admin Control Room compliance filter selector displays exact total evaluated requirement counts (`All Outcomes (18)`, `All Outcomes (14)`, `All Outcomes (15)`).
4. **Performance Hardening:** `AdminScrutinyService` was optimized by disabling blocking synchronous internet crawling in real-time request paths, cutting scrutiny load latency from >25s to **~0.15s per business**.

---

## 5. Playwright Test Suite Output

```text
Running 19 tests using 1 worker

  ✓   1 [chromium] › e2e\all-scenarios-suite.spec.ts:83:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [Meridian Pharma Formulations Pvt. Ltd.] - Compliance Page Verification (12.1s)
  ✓   2 [chromium] › e2e\all-scenarios-suite.spec.ts:142:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [Meridian Pharma Formulations Pvt. Ltd.] - Workflows Roadmap Verification (5.6s)
  ✓   3 [chromium] › e2e\all-scenarios-suite.spec.ts:154:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [Meridian Pharma Formulations Pvt. Ltd.] - Calendar Deadlines Verification (5.3s)
  ✓   4 [chromium] › e2e\all-scenarios-suite.spec.ts:83:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [VoltGrid Mobility Services Pvt. Ltd.] - Compliance Page Verification (9.2s)
  ✓   5 [chromium] › e2e\all-scenarios-suite.spec.ts:142:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [VoltGrid Mobility Services Pvt. Ltd.] - Workflows Roadmap Verification (4.7s)
  ✓   6 [chromium] › e2e\all-scenarios-suite.spec.ts:154:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [VoltGrid Mobility Services Pvt. Ltd.] - Calendar Deadlines Verification (5.0s)
  ✓   7 [chromium] › e2e\all-scenarios-suite.spec.ts:83:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [ApexBuild Infrastructure Pvt. Ltd.] - Compliance Page Verification (9.3s)
  ✓   8 [chromium] › e2e\all-scenarios-suite.spec.ts:142:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [ApexBuild Infrastructure Pvt. Ltd.] - Workflows Roadmap Verification (4.9s)
  ✓   9 [chromium] › e2e\all-scenarios-suite.spec.ts:154:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [ApexBuild Infrastructure Pvt. Ltd.] - Calendar Deadlines Verification (5.3s)
  ✓  10 [chromium] › e2e\all-scenarios-suite.spec.ts:83:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [SilkRoute Exports Pvt. Ltd.] - Compliance Page Verification (9.0s)
  ✓  11 [chromium] › e2e\all-scenarios-suite.spec.ts:142:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [SilkRoute Exports Pvt. Ltd.] - Workflows Roadmap Verification (5.4s)
  ✓  12 [chromium] › e2e\all-scenarios-suite.spec.ts:154:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [SilkRoute Exports Pvt. Ltd.] - Calendar Deadlines Verification (5.3s)
  ✓  13 [chromium] › e2e\all-scenarios-suite.spec.ts:83:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [CloudAxis Data Centres India Pvt. Ltd.] - Compliance Page Verification (8.8s)
  ✓  14 [chromium] › e2e\all-scenarios-suite.spec.ts:142:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [CloudAxis Data Centres India Pvt. Ltd.] - Workflows Roadmap Verification (4.8s)
  ✓  15 [chromium] › e2e\all-scenarios-suite.spec.ts:154:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [CloudAxis Data Centres India Pvt. Ltd.] - Calendar Deadlines Verification (4.9s)
  ✓  16 [chromium] › e2e\all-scenarios-suite.spec.ts:83:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [Sahaya Microfinance Services Ltd.] - Compliance Page Verification (8.8s)
  ✓  17 [chromium] › e2e\all-scenarios-suite.spec.ts:142:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [Sahaya Microfinance Services Ltd.] - Workflows Roadmap Verification (4.8s)
  ✓  18 [chromium] › e2e\all-scenarios-suite.spec.ts:154:9 › ComplyWise Full Scenario Suite Browser Validation › Scenario [Sahaya Microfinance Services Ltd.] - Calendar Deadlines Verification (5.0s)
  ✓  19 [chromium] › e2e\all-scenarios-suite.spec.ts:166:7 › ComplyWise Full Scenario Suite Browser Validation › Admin Control Room - Business Scrutiny Parity Audit (29.2s)

  19 passed (2.5m)
```

---

## 6. Pytest Backend Suite Output

```text
backend/tests/test_all_scenarios.py ...................                  [ 54%]
backend/tests/test_demo_mode.py ................                         [100%]

============================= 35 passed in 47.25s =============================
```
