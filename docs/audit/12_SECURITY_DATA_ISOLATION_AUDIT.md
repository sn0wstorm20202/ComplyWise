# 12. Security & Multi-Tenant Data Isolation Audit

## Executive Summary
This document provides an exhaustive forensic security audit of `ComplyWise` and `ComplianceRag`, focusing on multi-tenant data isolation, authentication, authorization, cryptographic verification, and remote code execution vulnerabilities.

### Critical Vulnerability Summary:
1. **Critical Tenant Bypass in `Business.resolve_safely()`:** In `apps/businesses/models.py` (line 108), unauthenticated requests fall back to fetching any business by UUID (`cls.objects.filter(pk=uuid_obj).first()`) without verifying ownership or active session.
2. **Arbitrary Tenant Bleed in AI Assistant Views:** In `apps/assistant/views.py` (lines 63, 69, 75), endpoints fall back to querying `Business.objects.filter(is_active=True).first()`, arbitrarily binding an active chat session to whichever business happened to be created first in the database.
3. **Pervasive `AllowAny` Overexposure:** Over 25 view classes across `documents`, `workflows`, `calendar`, `schemes`, and `standards` define `permission_classes = [AllowAny]`, allowing unauthenticated public read/write access to sensitive corporate compliance records.
4. **Critical Arbitrary Code Execution (CWE-502) in ComplianceRag:** `ComplianceRag/complywise/retrieval/retriever.py` deserializes disk cache files using Python's `pickle.load()`.
5. **High Server-Side Request Forgery (SSRF) in Crawlee Ingestion:** `domain/acquisition/crawlee_provider.py` does not filter loopback addresses (`127.0.0.1`) or cloud metadata endpoints (`169.254.169.254`).

---

## 1. Deep Dive: Multi-Tenancy & Authorization Failures

### 1.1 The `resolve_safely()` Backdoor
- **Location:** `E:/complience/ComplyWise/apps/businesses/models.py` (lines 98–114)
- **Vulnerable Code:**
  ```python
  @classmethod
  def resolve_safely(cls, business_id_or_obj, user=None):
      if isinstance(business_id_or_obj, cls):
          return business_id_or_obj
      
      try:
          uuid_obj = uuid.UUID(str(business_id_or_obj))
      except (ValueError, TypeError):
          return None
      
      if user and user.is_authenticated:
          # Proper tenant check:
          return cls.objects.filter(pk=uuid_obj, owner=user).first()
      
      # CRITICAL SECURITY FLAW:
      # If user is None or unauthenticated, it returns the business anyway!
      return cls.objects.filter(pk=uuid_obj).first()
  ```

#### Forensic Exploitation Scenario:
1. An attacker sends a `GET` request to any endpoint utilizing `resolve_safely()` (e.g., `/api/businesses/<uuid>/` or `/api/requirements/?business_id=<uuid>`) without an `Authorization` header.
2. Since `request.user.is_authenticated` is `False`, the method bypasses the `owner=user` filter and executes `cls.objects.filter(pk=uuid_obj).first()`.
3. The attacker receives full business metadata, worker counts, power loads, legal violations, and proprietary tax numbers.

---

### 1.2 Tenant Bleed via `.first()` Queries in `apps/assistant/views.py`
- **Location:** `E:/complience/ComplyWise/apps/assistant/views.py` (lines 58–78)
- **Vulnerable Code:**
  ```python
  class AssistantChatView(APIView):
      permission_classes = [AllowAny]  # FLAW 1: Public endpoint
      
      def post(self, request):
          business_id = request.data.get("business_id")
          business = None
          
          if business_id:
              business = Business.objects.filter(id=business_id).first()
          
          if not business:
              # FLAW 2: Arbitrary fallback to first business in database!
              business = Business.objects.filter(is_active=True).first()
              
          # Chat engine executes with 'business' context:
          response = assistant_service.ask(business=business, prompt=request.data.get("message"))
          return Response(response)
  ```

#### Forensic Impact:
- If a random internet user sends a message to `/api/assistant/chat/` without specifying a `business_id`, the system loads the confidential operational facts of whichever client company is returned by `Business.objects.filter(is_active=True).first()` and provides advice tailored to that company's private data!

---

### 1.3 Audit of Overexposed `AllowAny` Views

The following table catalogs views in `ComplyWise` where `permission_classes = [AllowAny]` permits unauthenticated access:

| App / Module | View Class | Endpoint Path | Vulnerability & Exposure Risk |
| :--- | :--- | :--- | :--- |
| `apps/documents` | `DocumentUploadView` | `POST /api/documents/upload/` | Unauthenticated arbitrary file upload to local server storage. |
| `apps/documents` | `DocumentListView` | `GET /api/documents/` | Unauthenticated enumeration of uploaded corporate documents. |
| `apps/workflows` | `CaseListView` | `GET /api/workflows/cases/` | Unauthenticated viewing of legal dispute cases and licenses. |
| `apps/workflows` | `CaseTaskUpdateView` | `PATCH /api/workflows/tasks/<id>/` | Unauthenticated mutation of statutory compliance task states. |
| `apps/calendar` | `ComplianceEventListView` | `GET /api/calendar/events/` | Unauthenticated scraping of enterprise filing deadlines. |
| `apps/schemes` | `SchemeListView` | `GET /api/schemes/` | Unauthenticated listing of government subsidy schemes. |
| `apps/standards` | `StandardListView` | `GET /api/standards/` | Unauthenticated listing of BIS/ISO quality standards. |
| `apps/assistant` | `AssistantChatView` | `POST /api/assistant/chat/` | Unauthenticated LLM prompt execution leaking tenant context. |
| `apps/assistant` | `AssistantHistoryView` | `GET /api/assistant/history/` | Unauthenticated retrieval of past conversational history. |

---

## 2. Remote Code Execution in ComplianceRag (`pickle.load`)

### 2.1 Code Inspection
- **File:** `E:/complience/ComplianceRag/complywise/retrieval/retriever.py`
- **Lines:** 45–62
- **Vulnerable Code:**
  ```python
  class ComplianceRetriever:
      def __init__(self, ...):
          self.cache_file = os.path.join(cache_dir, "query_cache.pkl")
          self._load_cache()
          
      def _load_cache(self):
          if os.path.exists(self.cache_file):
              try:
                  with open(self.cache_file, "rb") as f:
                      self.cache = pickle.load(f)  # <-- CRITICAL RCE VULNERABILITY
              except Exception:
                  self.cache = {}
  ```

### 2.2 Forensic Risk Analysis
- **CWE-502:** Deserialization of Untrusted Data.
- Python's `pickle` module allows execution of arbitrary shell commands during deserialization via `__reduce__`.
- If an attacker gains write access to `cache/query_cache.pkl` (e.g. through a shared volume, backup restore, or file upload vulnerability in an integrated microservice), the RAG worker will execute arbitrary commands upon startup or query handling.

---

## 3. Server-Side Request Forgery (SSRF) in Crawlee Ingestion

### 3.1 Code Inspection
- **File:** `E:/complience/ComplyWise/domain/acquisition/crawlee_provider.py`
- **Issue:** The `CrawleeAcquisitionProvider.acquire()` method accepts a list of URLs and delegates crawling to `BeautifulSoupCrawler` or `urllib.request`.
- **Missing Validation:**
  - No check for loopback addresses (`127.0.0.1`, `localhost`).
  - No check for private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  - No check for cloud instance metadata endpoints (`http://169.254.169.254/latest/meta-data/`).

### 3.2 Exploitation Flow
1. An attacker configures a business profile with an official website URL: `http://169.254.169.254/latest/meta-data/iam/security-credentials/`.
2. The acquisition worker invokes `acquire([url])`.
3. The crawler fetches the URL and extracts the text (containing temporary AWS IAM credentials).
4. The worker saves this text into `apps/evidence/models.py` (`EvidenceItem.raw_content`).
5. The attacker views the evidence record in the dashboard or API, obtaining the AWS IAM keys.

---

## 4. Cryptographic & Configuration Deficiencies

### 4.1 Insecure Default Django Secret Key
- **File:** `E:/complience/ComplyWise/config/settings.py` (line 23)
  ```python
  SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-complywise-default-key-change-in-production')
  ```
- **Finding:** If the environment variable `DJANGO_SECRET_KEY` is omitted in staging or production deployments, the system silently uses a public, hardcoded key, compromising all cryptographic signing, sessions, and CSRF protection tokens.

### 4.2 Unrestricted CORS Configuration
- **File:** `E:/complience/ComplyWise/config/settings.py` (line 145)
  ```python
  CORS_ALLOW_ALL_ORIGINS = True  # In development/staging
  ```
- **Finding:** Allows any malicious website visited by an authenticated user to perform cross-origin AJAX requests against the ComplyWise API.

---

## 5. Security Remediation Action Plan

| Finding ID | Component | Remediation Required | Priority |
| :--- | :--- | :--- | :--- |
| **SEC-01** | `Business.resolve_safely()` | Remove unauthenticated fallback; require explicit `user` and assert `owner == user`. | **IMMEDIATE** |
| **SEC-02** | `apps/assistant/views.py` | Delete `.first()` fallback; return `400 Bad Request` or `404 Not Found` if business unselected. Set `permission_classes = [IsAuthenticated]`. | **IMMEDIATE** |
| **SEC-03** | View Permissions | Remove `AllowAny` from all document, workflow, calendar, and assistant views; enforce `[IsAuthenticated]`. | **IMMEDIATE** |
| **SEC-04** | `query_cache.pkl` | Delete `pickle.load()`; replace with `json.load()` or Redis key-value cache with TTL. | **IMMEDIATE** |
| **SEC-05** | SSRF in Crawler | Implement URL IP resolution validation before crawling; block RFC 1918 and link-local ranges. | **HIGH** |
| **SEC-06** | `SECRET_KEY` | Raise `ImproperlyConfigured` exception if `DJANGO_SECRET_KEY` is not set when `DEBUG = False`. | **HIGH** |
