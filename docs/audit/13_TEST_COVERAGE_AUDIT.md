# 13. Test Coverage & Verification Audit

## Executive Summary
This document provides a forensic audit of the testing infrastructure, automated test suites, test coverage, and sector-specific verification across `ComplyWise` and `ComplianceRag`.

### Central Findings:
1. **ComplianceRag Has Virtually Zero Automated Tests:** The entire `ComplianceRag` repository contains exactly **one test file (`test_encode.py`), spanning only 19 lines of code**. This file merely verifies that `SentenceTransformer` can encode a single dummy string. The hybrid retriever, BM25 tokenizer, ChromaDB indexer, web crawlers, SerpApi integration, and Gemini analyzer have **0% test coverage**.
2. **ComplyWise Test Suite is Unit-Isolated:** While `ComplyWise` contains a well-structured Pytest suite for `ApplicabilityEngine` and `OnboardingPlanner`, it lacks integration tests linking discovery, Crawlee acquisition, rule evaluation, and the frontend.
3. **Severe Sector Coverage Blind Spots:** Testing in ComplyWise is almost exclusively centered around a single synthetic textile factory in Gujarat. Complex sectors (SaaS, Logistics, Pharmaceuticals, Cold Chain, Chemical Processing) have **zero automated verification**.

---

## 1. ComplianceRag Testing Audit

### 1.1 Complete Inventory of Test Files
- **File:** `E:/complience/ComplianceRag/test_encode.py`
- **Line Count:** 19 lines
- **Contents:**
  ```python
  from sentence_transformers import SentenceTransformer

  def test_encoding():
      model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
      embeddings = model.encode(["This is a test document."])
      assert embeddings.shape[0] == 1
      assert embeddings.shape[1] == 384
      print("Encoding test passed!")

  if __name__ == "__main__":
      test_encoding()
  ```

### 1.2 Uncovered Critical Components in ComplianceRag

| Component / File | Lines of Code | Test Coverage | Critical Risks Unmonitored |
| :--- | :--- | :--- | :--- |
| `complywise/retrieval/retriever.py` | 240 lines | **0%** | BM25 tokenization crashes, RRF score division by zero, pickle deserialization exploits. |
| `complywise/retrieval/indexer.py` | 180 lines | **0%** | ChromaDB batch insertion failures, duplicate chunk collisions, schema migrations. |
| `complywise/analysis/gemini_analyzer.py` | 165 lines | **0%** | Gemini API schema parsing errors, rate limiting, JSON serialization failures. |
| `complywise/crawler/official_crawler.py` | 145 lines | **0%** | Async HTTP timeouts, unhandled HTML parsing exceptions, infinite redirect loops. |
| `complywise/search/serp_client.py` | 95 lines | **0%** | SerpApi quota exhaustion, missing API key handling, malformed query responses. |

---

## 2. ComplyWise Testing Audit

### 2.1 Test Frameworks & Tools
- **Test Runner:** `pytest`
- **Django Plugin:** `pytest-django`
- **Async Plugin:** `pytest-asyncio`
- **Frontend E2E:** Playwright (`frontend/e2e/`)

### 2.2 Inventory of ComplyWise Test Suites

| Test Module / Directory | Component Tested | Assertions & Scope | Quality / Completeness |
| :--- | :--- | :--- | :--- |
| `apps/applicability/tests/test_engine.py` | `ApplicabilityEngine` | Kleene 3-valued truth tables, basic comparison operators, AND/OR nesting. | **High (Unit Level):** Rigorous boolean AST verification. |
| `apps/onboarding/tests/test_planner.py` | `OnboardingPlanner` | Fact extraction prompt schema, question generation counts. | **Medium:** Does not assert 0-question invariant on complete facts. |
| `apps/businesses/tests/test_models.py` | `Business` & `Profile` | CRUD operations and slug generation. | **Low:** Completely misses testing `resolve_safely()` unauthenticated security hole. |
| `apps/knowledge/tests/test_rules.py` | `Rule` model & loading | Fixture loading from JSON knowledge packs. | **Medium:** Verifies 5 default packs only. |
| `frontend/e2e/auth.setup.ts` | Next.js Login flow | Form submission and redirect to `/dashboard`. | **Medium:** Uses mock credentials. |
| `frontend/e2e/dashboard.spec.ts` | Dashboard UI rendering | Page load and tab navigation. | **Low:** Passes against hardcoded mock data in `userProfileHomeData.ts`. |

---

## 3. Sector-by-Sector Coverage Analysis

To evaluate whether the platform can reliably serve Indian commerce, we audited test coverage across key industrial and service sectors:

| Sector | Jurisdiction Tested | Real Knowledge Pack? | Engine 2 Test Suite? | RAG Test Suite? | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Textiles & Garments** | Gujarat (Surat) | **YES** | **YES** (1 test case) | None | **MINIMAL PASS** |
| **SaaS / IT Services** | Karnataka (Bengaluru) | **NO** (Bypassed by regex) | **NO** | None | **UNTESTED / BROKEN** |
| **Pharmaceuticals** | Maharashtra (Pune) | **PARTIAL** (Basic pack) | **NO** | None | **UNTESTED** |
| **Cold Storage / Logistics** | Uttar Pradesh | **NO** | **NO** | None | **UNTESTED** |
| **Food Processing / Dairy** | Tamil Nadu | **PARTIAL** (Basic pack) | **NO** | None | **UNTESTED** |
| **Fintech / NBFC** | Maharashtra (Mumbai) | **NO** | **NO** | None | **UNTESTED** |

---

## 4. Architectural Integration Test Deficit

There is **not a single automated test** in the entire workspace that executes the target end-to-end lifecycle:
$$\text{Free-text Description} \longrightarrow \text{Canonical Facts} \longrightarrow \text{Search Plan} \longrightarrow \text{Evidence Retrieval} \longrightarrow \text{AST Evaluation} \longrightarrow \text{Verified CIR}$$

### Specific Integration Gaps:
1. **No Crawlee-to-Engine-2 Test:** No test exists verifying that an HTML page scraped by `CrawleeAcquisitionProvider` produces an `EvidenceItem` whose `content_hash` satisfies an AST precondition in `ApplicabilityEngine`.
2. **No Regression Test for View Regex Bypass:** There is no test asserting that `apps/requirements/views.py` respects the output of `apps/applicability/engine.py` without string manipulation on company names.
3. **No Mock Deception E2E Test:** Frontend E2E tests are configured to succeed regardless of backend status because the frontend silently falls back to `userProfileHomeData.ts`.

---

## 5. Required Testing Roadmap

1. **Establish ComplianceRag Test Suite:**
   - Add unit tests for `BM25Okapi` retrieval with edge-case query tokens.
   - Add mock-based integration tests for `ChromaDB` ingestion and retrieval.
   - Add tests verifying JSON schema conformance of LLM prompts.
2. **Implement Multi-Sector Golden Benchmarks:**
   - Create golden benchmark profiles for:
     - 1. Software Startup (5 employees, remote, Bengaluru).
     - 2. Large Dyeing Mill (120 employees, Surat, 50 HP power, effluent discharge).
     - 3. Cold Chain Warehouse (15 employees, Lucknow, refrigerated ammonia storage).
     - 4. Generic Formulation Pharma Lab (45 employees, Hyderabad, Schedule M).
   - Write automated pytest suites asserting exact expected applicable laws for each benchmark.
3. **Add Multi-Tenancy Security Tests:**
   - Assert that an unauthenticated request to `Business.resolve_safely()` returns `None` or raises `PermissionDenied`.
   - Assert that a user cannot query another user's requirements or upload documents to another tenant's business.
