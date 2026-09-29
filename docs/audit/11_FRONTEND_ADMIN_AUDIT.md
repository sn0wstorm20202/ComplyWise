# 11. Frontend & Admin Control Room Forensic Audit

## Executive Summary
This document provides a forensic audit of the user-facing web interface (`frontend/` in Next.js 14) and the administrative control surfaces (`apps/*/admin.py` in Django) for the ComplyWise platform.

### Central Findings:
1. **Pervasive Mock Fallback Deception:** The frontend codebase contains 658 lines of hardcoded mock business and compliance data (`frontend/data/userProfileHomeData.ts`). When backend API endpoints fail, return 401/404/500, or time out, React components silently substitute mock records. This creates an illusion of working end-to-end functionality while masking critical backend failures.
2. **Session Bleed in `AuthContext.tsx`:** When a user logs out, `logout()` removes JWT access and refresh tokens from `localStorage`, but **fails to purge** `complywise_active_business_id` and `complywise_cached_businesses`. When a subsequent user logs in on the same browser, their session inherits the previous tenant's active business ID.
3. **Absence of an Admin Control Room:** The Django administration surface consists solely of basic, out-of-the-box `ModelAdmin` CRUD tables. There is no operator control room to inspect Engine 2 AST evaluation traces, monitor RAG vector index health, view Crawlee scraper job status, or audit cryptographic evidence chains.

---

## 1. Frontend Architecture Audit (`frontend/`)

### 1.1 Stack & Configuration
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS, Radix UI primitives, Lucide React icons
- **State Management:** React Context (`AuthContext.tsx`, `BusinessContext.tsx`) + LocalStorage
- **Data Fetching:** Custom `fetch` wrappers in `frontend/lib/api.ts`

### 1.2 Authentication & Tenant Context Leaks (`AuthContext.tsx`)
Inspection of `frontend/context/AuthContext.tsx` reveals a severe session pollution flaw:

```typescript
// Location: frontend/context/AuthContext.tsx (lines 82-96)
const logout = () => {
    localStorage.removeItem("complywise_access_token");
    localStorage.removeItem("complywise_refresh_token");
    setUser(null);
    setIsAuthenticated(false);
    // CRITICAL OMISSION:
    // localStorage.removeItem("complywise_active_business_id"); <-- MISSING!
    // localStorage.removeItem("complywise_cached_businesses");   <-- MISSING!
    router.push("/auth/login");
};
```

#### Forensic Exploitation Flow:
1. User A (Owner of "Alpha Textiles", ID `11111111-...`) logs in, setting `complywise_active_business_id` in `localStorage`.
2. User A clicks "Log Out".
3. User B (Owner of "Beta Software", ID `22222222-...`) logs in on the same computer.
4. The dashboard initializes: `const activeId = localStorage.getItem("complywise_active_business_id")`.
5. User B's dashboard sends API requests with `User B's JWT token` but with `X-Business-ID: 11111111-...`!
6. If the backend endpoint suffers from the `resolve_safely()` vulnerability (detailed in Report 12), User B receives User A's confidential compliance records.

---

## 2. The Mock Fallback Deception (`userProfileHomeData.ts`)

### 2.1 File Inspection
- **File:** `E:/complience/ComplyWise/frontend/data/userProfileHomeData.ts`
- **Lines of Code:** 658 lines
- **Mock Entities Defined:**
  - Mock Business: *"Acme Textiles Private Limited"* (Surat, Gujarat)
  - Mock Compliance Score: `84%`
  - Mock Mandatory Compliances: 14 requirements (Factories Act, GPCB Consent to Operate, Boiler Inspection, EPF, ESI, etc.)
  - Mock Deadlines: 6 upcoming calendar events
  - Mock Filings: 4 workflow cases

### 2.2 Component Consumption Analysis
Across multiple dashboard pages and components, API errors trigger silent mock fallbacks:

```typescript
// Typical pattern found across frontend/app/dashboard/...:
useEffect(() => {
    async function loadData() {
        try {
            const res = await api.get(`/api/applicability/assessments/?business_id=${businessId}`);
            if (!res.ok) throw new Error("Failed");
            setData(await res.json());
        } catch (err) {
            console.warn("Backend unavailable, using default profile data", err);
            setData(mockUserProfileHomeData.compliances); // <-- SILENT FALLBACK
        }
    }
    loadData();
}, [businessId]);
```

### 2.3 Consequences
1. **Misleading User Perception:** An enterprise user whose profile has unfulfilled legal obligations or whose backend evaluation crashed is shown an attractive green dashboard indicating 84% compliance with fake due dates.
2. **Obfuscation of Integration Gaps:** Development and QA teams testing the platform believe the integration between the Next.js frontend, Django backend, and RAG engine is operational, when in reality the backend returns `404 Not Found` or `500 Internal Server Error` and the frontend renders static fixtures.

---

## 3. Discrepancies Between Frontend Display and Engine 2

| Feature / Metric | Frontend UI Display | Engine 2 Real Output | Root Cause |
| :--- | :--- | :--- | :--- |
| **Compliance Score** | Displayed as a percentage circular gauge (e.g. `84%`). | Engine 2 outputs raw boolean counts (`applicable`, `not_applicable`, `needs_information`). | Frontend computes percentage via arbitrary formula: `(applicable / total) * 100` or renders mock constant. |
| **Missing Facts** | Renders "All requirements up to date" or generic questions. | Engine 2 flags specific AST variables as `NEEDS_INFORMATION`. | Frontend suppresses `needs_information` items and shows a hardcoded 16-question wizard. |
| **Statutory Deadlines** | Interactive calendar with color-coded badges. | Engine 2 has no temporal reasoning or calendar models; rules output static compliance status. | Calendar events are independently generated in `apps/calendar` without linking to `DecisionResult`. |
| **Official Citations** | Plain text string labels (e.g. *"Factories Act 1948"*). | Engine 2 references `Rule.code` and `Rule.legal_act`. | API flattens relational rule/evidence objects into flat string arrays. |

---

## 4. Admin Surface Audit (`apps/*/admin.py`)

### 4.1 Current Django Admin Configuration
The Django administration interface (`/admin/`) registers standard ModelAdmins:
- `BusinessAdmin` (`apps/businesses/admin.py`)
- `UserAdmin` (`apps/accounts/admin.py`)
- `RequirementAdmin` (`apps/requirements/admin.py`)
- `CaseAdmin` (`apps/workflows/admin.py`)
- `RuleAdmin` (`apps/knowledge/admin.py`)
- `KnowledgeDocumentAdmin` (`apps/knowledge/admin.py`)
- `DecisionRunAdmin` (`apps/applicability/admin.py`)

### 4.2 Missing Capabilities of the Admin Surface
To function as an enterprise-grade compliance intelligence platform, the admin surface must provide operational observability and control. Currently, the following capabilities are **completely missing**:

1. **Rule AST Visualizer / Editor:**
   - Administrators cannot view the boolean tree (`AND`/`OR`/`NOT`) of a rule condition.
   - Rule conditions are stored as raw JSON strings in the database; editing a condition requires manually typing JSON with no schema validation or syntax checking.
2. **Decision Run Execution Trace Inspector:**
   - No UI exists to inspect the step-by-step evaluation trace of a `DecisionRun` to see why a specific company triggered or failed a rule.
3. **Evidence Lineage & Hash Verification Tool:**
   - No tool to verify whether an `EvidenceItem`'s `content_hash` matches its live web content or to view the historical snapshot captured during acquisition.
4. **Scraper & Crawler Control Room:**
   - Zero visibility into Crawlee execution status, crawl queues, error rates, or domain rate-limiting blocks.
5. **RAG Vector Store Management:**
   - Zero admin controls to inspect ChromaDB collections, trigger re-indexing of statutory documents, or test hybrid search relevance.

---

## 5. Required Architectural Remediation

1. **Eliminate Silent Mock Fallbacks:** Delete or quarantine `userProfileHomeData.ts`. If an API endpoint fails, the frontend must display an explicit error boundary with an actionable error code and retry mechanism.
2. **Fix Session Hygiene in `AuthContext.tsx`:** Update `logout()` to clear all tenant and business artifacts from `localStorage`:
   ```typescript
   localStorage.removeItem("complywise_access_token");
   localStorage.removeItem("complywise_refresh_token");
   localStorage.removeItem("complywise_active_business_id");
   localStorage.removeItem("complywise_cached_businesses");
   sessionStorage.clear();
   ```
3. **Build a Dedicated Admin Control Room:**
   - Develop custom Django Admin views or a dedicated React Admin dashboard (`/control-room/`) exposing:
     - Live Engine 2 AST evaluation trees with truth value debugging.
     - Evidence Merkle tree verification.
     - Scraper telemetry and domain health metrics.
     - RAG index synchronization status.
