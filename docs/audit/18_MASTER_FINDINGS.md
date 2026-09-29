# 18. Master Findings Register

This document serves as the formal, authoritative register of all architectural, security, correctness, and operational findings identified during the forensic platform audit of **ComplyWise** and **ComplianceRag**.

Every finding strictly adheres to the 12-attribute forensic schema mandated for this audit.

---

### FINDING: SEC-01
- **ID:** SEC-01
- **SEVERITY:** CRITICAL
- **REPOSITORY:** ComplyWise
- **FILE:** `apps/businesses/models.py`
- **LINE:** 108
- **COMPONENT:** Multi-Tenancy Authorization / `Business.resolve_safely()`
- **CURRENT BEHAVIOR:** When `user` is `None` or `request.user.is_authenticated` is `False`, the method executes `cls.objects.filter(pk=uuid_obj).first()`, returning the business object to unauthenticated callers.
- **EXPECTED BEHAVIOR:** Method must strictly enforce authentication and ownership. If `user` is unauthenticated or does not own the requested business, it must return `None` or raise `PermissionDenied`.
- **EVIDENCE:**
  ```python
  if user and user.is_authenticated:
      return cls.objects.filter(pk=uuid_obj, owner=user).first()
  # Line 108: Falls back to returning business without authorization:
  return cls.objects.filter(pk=uuid_obj).first()
  ```
- **RISK:** Complete multi-tenant compromise. Any unauthenticated user or external attacker who knows or enumerates a `business_id` UUID can view proprietary tax IDs, worker counts, power loads, and compliance violations.
- **RECOMMENDED FIX:** Remove lines 107–108. Explicitly require an authenticated user and restrict query to `cls.objects.filter(pk=uuid_obj, owner=user).first()`.
- **DEPENDENCIES:** Requires updating any internal Celery tasks that call `resolve_safely()` without a user context to use an explicit system-level selector.
- **REGRESSION TEST:** Write a pytest test in `apps/businesses/tests/test_security.py` asserting that an unauthenticated client passing a valid business UUID receives HTTP 401/403 or `None`.

---

### FINDING: SEC-02
- **ID:** SEC-02
- **SEVERITY:** CRITICAL
- **REPOSITORY:** ComplyWise
- **FILE:** `apps/assistant/views.py`
- **LINE:** 69
- **COMPONENT:** AI Assistant Tenant Scoping / `AssistantChatView`
- **CURRENT BEHAVIOR:** If no `business_id` is passed in the request or session, the endpoint executes `Business.objects.filter(is_active=True).first()`, binding the conversational session to whichever business was created first in the database.
- **EXPECTED BEHAVIOR:** The endpoint must require an authenticated user and an explicit `business_id` belonging to that user. If no business is specified, it must return `400 Bad Request`.
- **EVIDENCE:**
  ```python
  if not business:
      business = Business.objects.filter(is_active=True).first()
  ```
- **RISK:** Tenant data leakage. A user chatting with the assistant without selecting a business receives advice and citations grounded in another tenant's confidential corporate records.
- **RECOMMENDED FIX:** Replace fallback query with:
  ```python
  if not business:
      return Response({"error": "An active business must be explicitly selected."}, status=status.HTTP_400_BAD_REQUEST)
  ```
- **DEPENDENCIES:** Frontend chat component must always pass the active business UUID in headers or payload.
- **REGRESSION TEST:** Test `AssistantChatView` with an authenticated user with no active business; verify response is HTTP 400.

---

### FINDING: SEC-03
- **ID:** SEC-03
- **SEVERITY:** CRITICAL
- **REPOSITORY:** ComplianceRag
- **FILE:** `complywise/retrieval/retriever.py`
- **LINE:** 53
- **COMPONENT:** Query Cache Persistence / `ComplianceRetriever._load_cache()`
- **CURRENT BEHAVIOR:** Disk cache for query results is deserialized using Python's `pickle.load()` from `cache/query_cache.pkl`.
- **EXPECTED BEHAVIOR:** Cache storage must use safe serialization formats such as JSON or a managed key-value store (Redis) with cryptographic validation.
- **EVIDENCE:**
  ```python
  with open(self.cache_file, "rb") as f:
      self.cache = pickle.load(f)
  ```
- **RISK:** Arbitrary Remote Code Execution (CWE-502). If an attacker tampers with or crafts a malicious `query_cache.pkl` file, the Python interpreter will execute arbitrary shell commands upon retriever initialization.
- **RECOMMENDED FIX:** Replace `pickle` with `json.load()` / `json.dump()`, or connect to Redis.
- **DEPENDENCIES:** Delete existing `.pkl` files in `ComplianceRag/cache/`.
- **REGRESSION TEST:** Verify cache serialization and deserialization functions use `json` and reject non-string/primitive structures.

---

### FINDING: ENG-01
- **ID:** ENG-01
- **SEVERITY:** CRITICAL
- **REPOSITORY:** ComplyWise
- **FILE:** `apps/requirements/views.py`
- **LINE:** 172–205
- **COMPONENT:** Legal Applicability Determination / `RequirementListView.get_queryset()`
- **CURRENT BEHAVIOR:** The view layer uses regex pattern matching against `business.name` and business attributes to manually exclude compliance categories (e.g. excluding Factory Safety if company name contains "tech" or "saas").
- **EXPECTED BEHAVIOR:** Legal applicability must be determined exclusively by `ApplicabilityEngine` (`apps/applicability/engine.py`) using verified canonical profile facts and AST rules. The view layer must never filter compliance rules based on regex matching.
- **EVIDENCE:**
  ```python
  is_tech = bool(re.search(r'\b(tech|software|saas|ai|platform|digital|app|cloud|data)\b', business_name))
  if is_tech:
      qs = qs.exclude(category__in=["Pollution Control", "Factory Safety", "Hazardous Waste"])
  ```
- **RISK:** Severe legal failure. A technology company operating physical manufacturing, assembly lines, or server assembly warehouses with over 20 workers is illegally exempted from Factory Safety rules because the word "tech" appears in its name.
- **RECOMMENDED FIX:** Completely delete lines 172–205 in `apps/requirements/views.py`. All filtering must be derived from `DecisionResult` records produced by `ApplicabilityEngine`.
- **DEPENDENCIES:** Requires expanding knowledge pack rules to cover tech/office establishments.
- **REGRESSION TEST:** Create a test case for a business named "Tech Logistics Warehouses Ltd" with 50 workers; verify that Factory and Warehouse rules evaluate based on worker counts and physical operations, not company name.

---

### FINDING: RAG-01
- **ID:** RAG-01
- **SEVERITY:** CRITICAL
- **REPOSITORY:** ComplianceRag
- **FILE:** `complywise/analysis/gemini_analyzer.py`
- **LINE:** 88–124
- **COMPONENT:** Applicability Determination / `GeminiAnalyzer.analyze_compliances()`
- **CURRENT BEHAVIOR:** Prompts Gemini 2.5 Flash to act as the legal judge: *"YOUR TASK: Determine which Indian regulatory COMPLIANCES apply to THIS SPECIFIC business."* Gemini assigns `APPLICABLE`, `POTENTIALLY_APPLICABLE`, and `NOT_APPLICABLE`.
- **EXPECTED BEHAVIOR:** RAG must only retrieve and rerank statutory text chunks. Applicability decisions must be made deterministically by Engine 2 AST rules in ComplyWise.
- **EVIDENCE:**
  ```python
  prompt = f"""
  YOUR TASK: Determine which Indian regulatory COMPLIANCES (not schemes) apply to THIS SPECIFIC business.
  For each compliance, classify as: APPLICABLE, POTENTIALLY_APPLICABLE, NOT_APPLICABLE.
  """
  ```
- **RISK:** Violation of the core architectural mandate: *RAG RETRIEVES. RULES DECIDE. LLM EXPLAINS.* Legal decisions become probabilistic, non-deterministic, and legally indefensible.
- **RECOMMENDED FIX:** Strip applicability classification from `gemini_analyzer.py`. Restructure output to return verified statutory chunks with relevance scores.
- **DEPENDENCIES:** ComplyWise Engine 2 must consume RAG evidence chunks.
- **REGRESSION TEST:** Verify that `gemini_analyzer.py` emits only evidentiary summaries and zero compliance decision labels.

---

### FINDING: SEC-04
- **ID:** SEC-04
- **SEVERITY:** HIGH
- **REPOSITORY:** ComplyWise
- **FILE:** Multiple (`apps/documents/views.py:28`, `apps/workflows/views.py:42`, `apps/calendar/views.py:35`, `apps/schemes/views.py:22`, `apps/standards/views.py:19`)
- **LINE:** 19–45 across 5 files
- **COMPONENT:** API Authentication & Access Control
- **CURRENT BEHAVIOR:** Over 25 view classes define `permission_classes = [AllowAny]`, exposing corporate documents, legal dispute cases, workflow tasks, and calendar filings to the public internet without authentication.
- **EXPECTED BEHAVIOR:** All endpoints exposing tenant compliance records must enforce `permission_classes = [IsAuthenticated]`.
- **EVIDENCE:**
  ```python
  # apps/documents/views.py:
  class DocumentUploadView(APIView):
      permission_classes = [AllowAny]
      
  # apps/workflows/views.py:
  class CaseListView(APIView):
      permission_classes = [AllowAny]
  ```
- **RISK:** Unauthorized public access, arbitrary file uploads to server storage, and data harvesting of enterprise filing dates.
- **RECOMMENDED FIX:** Replace `AllowAny` with `IsAuthenticated` across all affected views. Implement tenant-level scoping checking `request.user`.
- **DEPENDENCIES:** Frontend API client must attach JWT Bearer tokens to all requests.
- **REGRESSION TEST:** Execute unauthenticated `GET` and `POST` requests to each endpoint; verify all return HTTP 401.

---

### FINDING: CIR-01
- **ID:** CIR-01
- **SEVERITY:** HIGH
- **REPOSITORY:** ComplyWise
- **FILE:** N/A (Missing Architecture)
- **LINE:** N/A
- **COMPONENT:** Compliance Single Source of Truth / Domain Data Model
- **CURRENT BEHAVIOR:** No `ComplianceIntelligenceRecord` (CIR) model exists. Compliance truth is fragmented across 6 conflicting stores (`DecisionResult`, `Requirement`, `Case`, `ComplianceEvent`, `IntelligenceReport`, and frontend mock files).
- **EXPECTED BEHAVIOR:** A single canonical `ComplianceIntelligenceRecord` model must exist, binding an immutable profile version, decision run, evidence digests, and active requirements.
- **EVIDENCE:** Grep across both codebases for `ComplianceIntelligenceRecord` yields 0 class definitions.
- **RISK:** State desynchronization. Completing a task does not update its decision result; different pages in the frontend show contradictory compliance statuses.
- **RECOMMENDED FIX:** Implement the `ComplianceIntelligenceRecord` model as specified in Audit Report 10 and 16.
- **DEPENDENCIES:** Requires schema migration in PostgreSQL.
- **REGRESSION TEST:** Assert that mutating requirement status or re-running applicability updates the active CIR.

---

### FINDING: FND-01
- **ID:** FND-01
- **SEVERITY:** HIGH
- **REPOSITORY:** ComplyWise
- **FILE:** `frontend/data/userProfileHomeData.ts`
- **LINE:** 1–658
- **COMPONENT:** Frontend UI State Management & Error Handling
- **CURRENT BEHAVIOR:** 658 lines of hardcoded mock business, compliance, and calendar data are silently rendered by dashboard components when backend API calls fail or return 401/404/500.
- **EXPECTED BEHAVIOR:** When an API request fails, the UI must render an explicit error message or retry state. It must never display mock data in place of live data.
- **EVIDENCE:**
  ```typescript
  catch (err) {
      console.warn("Backend unavailable, using default profile data", err);
      setData(mockUserProfileHomeData.compliances);
  }
  ```
- **RISK:** Deceptive user experience. Users and testers are led to believe the platform is functioning and compliant when the backend is completely failing.
- **RECOMMENDED FIX:** Delete `userProfileHomeData.ts` or restrict its usage exclusively to Storybook / unit test fixtures.
- **DEPENDENCIES:** Backend endpoints must be robust and handle empty states cleanly.
- **REGRESSION TEST:** Disconnect backend server and verify that frontend displays error state rather than "Acme Textiles".

---

### FINDING: FND-02
- **ID:** FND-02
- **SEVERITY:** HIGH
- **REPOSITORY:** ComplyWise
- **FILE:** `frontend/context/AuthContext.tsx`
- **LINE:** 85
- **COMPONENT:** Frontend Authentication Session Management
- **CURRENT BEHAVIOR:** `logout()` clears access and refresh tokens from `localStorage`, but fails to clear `complywise_active_business_id` and `complywise_cached_businesses`.
- **EXPECTED BEHAVIOR:** `logout()` must purge all authentication and tenant session artifacts from `localStorage` and `sessionStorage`.
- **EVIDENCE:**
  ```typescript
  const logout = () => {
      localStorage.removeItem("complywise_access_token");
      localStorage.removeItem("complywise_refresh_token");
      // ACTIVE BUSINESS ID NOT CLEARED!
      setUser(null);
  };
  ```
- **RISK:** Session pollution. If a user logs out and another user logs in on the same browser, the second user's dashboard inherits the first user's active business ID.
- **RECOMMENDED FIX:** Add `localStorage.removeItem("complywise_active_business_id")` and `localStorage.removeItem("complywise_cached_businesses")` to `logout()`.
- **DEPENDENCIES:** None.
- **REGRESSION TEST:** Log in as User A, switch business, log out, log in as User B; verify `localStorage.getItem("complywise_active_business_id")` is reset.

---

### FINDING: EVD-01
- **ID:** EVD-01
- **SEVERITY:** HIGH
- **REPOSITORY:** ComplyWise
- **FILE:** `apps/applicability/models.py`
- **LINE:** 84
- **COMPONENT:** Evidence Provenance Lineage / `DecisionResult.evidence_used`
- **CURRENT BEHAVIOR:** `DecisionResult` stores evidence as a disconnected, unindexed `JSONField(default=list)` containing untyped snippet dictionaries.
- **EXPECTED BEHAVIOR:** Decisions must link to `EvidenceItem` models via a Many-to-Many relational junction table enforcing referential integrity and SHA256 content verification.
- **EVIDENCE:**
  ```python
  class DecisionResult(TimeStampedModel):
      evidence_used = models.JSONField(default=list)
  ```
- **RISK:** Complete loss of cryptographic evidence lineage. If an `EvidenceItem` is updated or disputed, the `DecisionResult` retains unverified, orphaned text snippets.
- **RECOMMENDED FIX:** Implement `decision_evidence_usages` junction table as specified in Report 16.
- **DEPENDENCIES:** Django database migration.
- **REGRESSION TEST:** Assert that creating a `DecisionResult` creates corresponding `DecisionEvidenceUsage` records with foreign keys to `EvidenceItem`.

---

### FINDING: ONB-01
- **ID:** ONB-01
- **SEVERITY:** HIGH
- **REPOSITORY:** ComplyWise
- **FILE:** `domain/intelligence/questionnaire.py` & `apps/onboarding/planner.py`
- **LINE:** 48 (`questionnaire.py`), 36 (`planner.py`)
- **COMPONENT:** Adaptive Onboarding Intake / Question Planner
- **CURRENT BEHAVIOR:** `questionnaire.py` forces LLM prompt to generate *"EXACTLY 5 or 6 questions"*. `planner.py` sets `TARGET_QUESTIONS_COUNT = 16`. Neither can emit 0–4 questions.
- **EXPECTED BEHAVIOR:** Question count must be dynamically determined by the number of missing variables in Engine 2 AST rules. If all facts are known, it must emit exactly 0 questions.
- **EVIDENCE:**
  ```python
  # domain/intelligence/questionnaire.py:
  "Generate EXACTLY 5 or 6 high-priority questions..."
  # apps/onboarding/planner.py:
  TARGET_QUESTIONS_COUNT = 16
  ```
- **RISK:** Redundant onboarding friction. Users who provide comprehensive descriptions are forced to answer redundant, hardcoded questions.
- **RECOMMENDED FIX:** Refactor question planner to evaluate Engine 2 rule preconditions first; only emit questions for variables evaluating to `UNKNOWN`.
- **DEPENDENCIES:** Requires integration between `OnboardingPlanner` and `ApplicabilityEngine`.
- **REGRESSION TEST:** Pass a fully populated profile fixture with worker counts, power load, and sector; assert generated questions list is empty (`[]`).

---

### FINDING: INT-01
- **ID:** INT-01
- **SEVERITY:** HIGH
- **REPOSITORY:** Both
- **FILE:** Entire Codebases
- **LINE:** All
- **COMPONENT:** Inter-Repository Integration
- **CURRENT BEHAVIOR:** ComplyWise has zero network calls, URL configurations, or dependencies pointing to ComplianceRag. ComplianceRag is an isolated local CLI script (`main.py`) with no server interface.
- **EXPECTED BEHAVIOR:** ComplianceRag should act as an asynchronous retrieval worker or microservice providing verified evidence chunks to ComplyWise.
- **EVIDENCE:** Grep across `ComplyWise` for `ComplianceRag`, `8001`, `ChromaDB`, `master_kb` returns 0 hits.
- **RISK:** The advanced hybrid retrieval, BM25, and cross-encoder reranking capabilities in ComplianceRag are completely unused in the live platform.
- **RECOMMENDED FIX:** Implement Option C (Asynchronous Celery Worker with `pgvector`) or Option A (FastAPI wrapper) as detailed in Report 14.
- **DEPENDENCIES:** Docker compose and queue orchestration.
- **REGRESSION TEST:** Trigger a retrieval run in ComplyWise and verify that RAG hybrid retrieval executes and returns verified chunks.

---

### FINDING: SEC-05
- **ID:** SEC-05
- **SEVERITY:** HIGH
- **REPOSITORY:** ComplyWise
- **FILE:** `domain/acquisition/crawlee_provider.py`
- **LINE:** 74
- **COMPONENT:** Web Acquisition Scraper / SSRF Prevention
- **CURRENT BEHAVIOR:** Crawlee crawler fetches arbitrary URLs without validating target IP addresses against loopback (`127.0.0.1`) or private subnets (`169.254.169.254`).
- **EXPECTED BEHAVIOR:** URLs must be resolved to IP addresses and checked against private/cloud metadata ranges before crawling.
- **EVIDENCE:**
  ```python
  await crawler.run([url])
  ```
- **RISK:** Server-Side Request Forgery (CWE-918). An attacker can supply cloud metadata URLs during business onboarding, causing the crawler to steal cloud IAM credentials.
- **RECOMMENDED FIX:** Implement an IP resolution validator blocking RFC 1918 and link-local ranges before dispatching crawl jobs.
- **DEPENDENCIES:** Python `ipaddress` and `socket` modules.
- **REGRESSION TEST:** Attempt to crawl `http://169.254.169.254/` and assert that the provider raises `SecurityException`.

---

### FINDING: TST-01
- **ID:** TST-01
- **SEVERITY:** HIGH
- **REPOSITORY:** ComplianceRag
- **FILE:** `test_encode.py`
- **LINE:** 1–19
- **COMPONENT:** Automated Quality Assurance
- **CURRENT BEHAVIOR:** ComplianceRag contains only one test file (19 lines) testing SentenceTransformer string encoding. The hybrid retriever, BM25, indexer, crawler, and analyzer have 0% test coverage.
- **EXPECTED BEHAVIOR:** Automated unit and integration test suite covering retrieval accuracy, BM25 scoring, schema validation, and edge cases.
- **EVIDENCE:** Directory listing of `ComplianceRag/tests/` reveals directory does not exist.
- **RISK:** High risk of silent regressions, runtime crashes, and division-by-zero errors in RRF formulas in production.
- **RECOMMENDED FIX:** Implement comprehensive pytest suite for all RAG components.
- **DEPENDENCIES:** `pytest`, `pytest-mock`.
- **REGRESSION TEST:** Run `pytest` across `ComplianceRag` with coverage threshold >= 80%.

---

### FINDING: KBD-01
- **ID:** KBD-01
- **SEVERITY:** MEDIUM
- **REPOSITORY:** ComplianceRag
- **FILE:** `complywise/retrieval/indexer.py`
- **LINE:** 42
- **COMPONENT:** Knowledge Base Indexing Pipeline
- **CURRENT BEHAVIOR:** `KBIndexer` only parses `kb/master_kb.json`. The extensive markdown files under `kb/central_laws/`, `kb/states/`, and `kb/cross_reference/` are completely ignored dead code.
- **EXPECTED BEHAVIOR:** Indexer must traverse and ingest all legal markdown acts and state gazettes in the knowledge directory.
- **EVIDENCE:**
  ```python
  def index_master_kb(self):
      with open("kb/master_kb.json", "r") as f:
          data = json.load(f)
      # Does not index any .md files in subdirectories
  ```
- **RISK:** The knowledge base is severely starved of statutory context that has already been drafted but never loaded into ChromaDB.
- **RECOMMENDED FIX:** Extend `KBIndexer` to parse and chunk all `.md` files in `kb/`.
- **DEPENDENCIES:** Markdown chunking parser.
- **REGRESSION TEST:** Verify ChromaDB chunk count increases from ~150 to >1000 after indexing markdown files.

---

### FINDING: KBD-02
- **ID:** KBD-02
- **SEVERITY:** MEDIUM
- **REPOSITORY:** ComplyWise
- **FILE:** `knowledge_packs/` directory
- **LINE:** All
- **COMPONENT:** Rule Pack Coverage
- **CURRENT BEHAVIOR:** Static JSON rule packs exist for only 5 sectors in 6 states. Modern service sectors (SaaS, Logistics, Fintech) have 0 rules.
- **EXPECTED BEHAVIOR:** Knowledge packs must cover all major national industrial and service codes (NIC codes).
- **EVIDENCE:** Listing files in `knowledge_packs/` shows only textiles, food processing, pharma, chemicals, and engineering.
- **RISK:** Engine 2 fails for 80%+ of businesses, triggering ungrounded LLM synthesis fallbacks.
- **RECOMMENDED FIX:** Ingest national Shops and Establishments Acts, IT Act 2000, DPDP Act 2023, and GST rules into AST packs.
- **DEPENDENCIES:** Rule authoring schema.
- **REGRESSION TEST:** Onboard a SaaS business and assert that IT Act and Shops & Establishments rules evaluate to `APPLICABLE`.

---

### FINDING: ADM-01
- **ID:** ADM-01
- **SEVERITY:** MEDIUM
- **REPOSITORY:** ComplyWise
- **FILE:** `apps/*/admin.py`
- **LINE:** All
- **COMPONENT:** Administrative Control Room
- **CURRENT BEHAVIOR:** Django Admin provides only basic CRUD tables. There is no visual AST inspector, evaluation trace debugger, or crawler telemetry dashboard.
- **EXPECTED BEHAVIOR:** Comprehensive Admin Control Room enabling compliance officers to audit decision traces, inspect evidence hashes, and manage scrapers.
- **EVIDENCE:** Inspection of `apps/applicability/admin.py` reveals basic `ModelAdmin` for `DecisionRun`.
- **RISK:** Operations and compliance teams cannot debug or override erroneous legal decisions.
- **RECOMMENDED FIX:** Build dedicated Control Room views in Django Admin or React dashboard.
- **DEPENDENCIES:** None.
- **REGRESSION TEST:** Access `/admin/control-room/` and verify trace visualization for any `DecisionRun`.

---

### FINDING: SEC-06
- **ID:** SEC-06
- **SEVERITY:** LOW
- **REPOSITORY:** ComplyWise
- **FILE:** `config/settings.py`
- **LINE:** 23, 145
- **COMPONENT:** Deployment Security Configuration
- **CURRENT BEHAVIOR:** Insecure default `SECRET_KEY` and `CORS_ALLOW_ALL_ORIGINS = True` in settings file.
- **EXPECTED BEHAVIOR:** Raise `ImproperlyConfigured` exception if `SECRET_KEY` is not provided via environment in production; restrict CORS to trusted domains.
- **EVIDENCE:**
  ```python
  SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-complywise-default-key-change-in-production')
  ```
- **RISK:** CSRF tokens and signed cookies can be forged if default key is deployed.
- **RECOMMENDED FIX:** Add production environment validation enforcing non-default `SECRET_KEY`.
- **DEPENDENCIES:** Deployment `.env` configuration.
- **REGRESSION TEST:** Run `manage.py check --deploy` and verify no security warnings.
