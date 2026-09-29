# 06. COMPLYWISE API CONTRACTS SPECIFICATION
## SECURE REST API ENDPOINTS, RFC 7807 ERROR MODEL & HTTP SEMANTICS

- **Document ID**: `CW-API-2026-V1`
- **Precedence Level**: **LEVEL 6**
- **Status**: MANDATORY / NORMATIVE
- **Effective Date**: September 28, 2026
- **Base URI**: `/api/v2`
- **Authentication**: Bearer JWT (`Authorization: Bearer <token>`)
- **Core Security Rule**: Zero unauthenticated tenant endpoints. Zero global `.first()` fallbacks.

---

## 1. RECONCILED RFC 7807 ERROR SPECIFICATION

Previous specifications erroneously nested error details inside a custom `{"error": {...}}` envelope while claiming strict RFC 7807 compliance. This specification formally reconciles the contract to conform to **RFC 7807 (Problem Details for HTTP APIs)**:

```json
{
  "type": "https://complywise.in/errors/unauthorized",
  "title": "Unauthorized Access",
  "status": 403,
  "detail": "Principal does not hold the required OWNER or ADMIN role for this business.",
  "instance": "/api/v2/businesses/baae1c93-5f1c-4000-9b58-c0e8097fe98b/settings",
  "code": "UNAUTHORIZED",
  "correlation_id": "req-9a1d48c8-3801-447a-9721",
  "timestamp": "2026-09-28T12:10:00Z",
  "invalid_params": []
}
```

---

## 2. RECONCILED 403 VS. 404 TENANT AUTHORIZATION SEMANTICS

To defend against **UUID enumeration attacks**, the platform strictly bifurcates 403 and 404 responses:
- **HTTP 404 (`NOT_FOUND`)**: Returned when a requested business or assessment UUID does not exist **OR** when the caller has no membership association with that business. The system completely conceals the existence of other tenants' records.
- **HTTP 403 (`UNAUTHORIZED`)**: Returned when the resource is confirmed to belong to the caller's authorized tenant organization, but the caller's specific role (`MEMBER`, `VIEWER`) is insufficient to execute the action (e.g. an employee attempting to delete the business).

---

## 3. API SEMANTICS: INVALID REQUEST VS. UNKNOWN LEGAL FACTS

The platform strictly differentiates client-side syntax/schema errors from legitimate domain evaluations with incomplete facts:
- **Client Error (HTTP 422 `Unprocessable Entity`)**: Occurs when submitted input violates schema, data types, or ranges (e.g. `worker_count = -5` or submitting string text for a currency field).
- **Legitimate Domain Evaluation (HTTP 200 `OK`)**: When input is well-formed, but an operational variable is legitimately unknown to the user, Engine 2 evaluates the AST using Kleene logic and emits `NEEDS_INFORMATION`. The API returns **HTTP 200 OK** with `status: "NEEDS_INFORMATION"`.

---

## 4. COMPREHENSIVE ERROR TAXONOMY

| Error Code | HTTP Status | Retryable? | Client Action | Server Action | Log Severity |
|---|---|---|---|---|---|
| `UNAUTHENTICATED` | 401 | No | Redirect user to `/auth/login` | Reject request | INFO |
| `UNAUTHORIZED` | 403 | No | Show permission denied notice | Audit log authorization denial | WARNING |
| `BUSINESS_NOT_FOUND` | 404 | No | Prompt user to select active business | Return 404 (conceal existence) | INFO |
| `ASSESSMENT_NOT_FOUND`| 404 | No | Redirect to business dashboard | Return 404 | INFO |
| `PROFILE_VERSION_NOT_FOUND` | 404 | No | Refresh profile state | Return 404 | WARNING |
| `STALE_PROFILE` | 409 | Yes | Fetch latest profile version & retry | Abort evaluation; state locked | WARNING |
| `INVALID_FACT` | 422 | No | Correct form input per `invalid_params`| Reject payload with details | INFO |
| `INVALID_ANSWER` | 422 | No | Re-answer question with valid option | Reject answer payload | INFO |
| `INSUFFICIENT_INFORMATION` | 422 | Yes | Submit required answers to proceed | Flag missing variable IDs | INFO |
| `DECISION_NOT_AVAILABLE` | 409 | Yes | Poll assessment status or re-evaluate | Return evaluation in progress | INFO |
| `CONFLICT_REVIEW_REQUIRED` | 422 | No | Contact compliance desk for review | Flag assessment for admin review| WARNING |
| `EVIDENCE_NOT_VERIFIED` | 502 | Yes | Retry request after backoff | Alert legal knowledge team | ERROR |
| `SOURCE_UNAVAILABLE` | 503 | Yes | Retry with exponential backoff | Log upstream gazette outage | ERROR |
| `RETRIEVAL_FAILURE` | 503 | Yes | Retry with exponential backoff | Fall back to cached local packs | ERROR |

---

## 5. CORE REST API ENDPOINTS

### A. Business Lifecycle

#### 1. `POST /api/v2/businesses/`
- **Purpose**: Provision a new enterprise tenant organization.
- **Auth**: `IsAuthenticated`.
- **Tenant Scope**: Associates newly created business with authenticated user as `OWNER`.
- **Idempotency**: Supported via `Idempotency-Key` header.
- **State**: `[CURRENT]` AllowAny leak; `[TARGET]` Strict JWT authentication.
- **Request Payload**:
  ```json
  {
    "name": "Surat Cotton Spinning Mill Ltd",
    "entity_type": "PRIVATE_LIMITED",
    "state_code": "GJ",
    "district": "Surat",
    "raw_description": "Operating an automated cotton spinning and weaving mill in Surat..."
  }
  ```
- **Response Payload (201 Created)**:
  ```json
  {
    "business_id": "baae1c93-5f1c-4000-9b58-c0e8097fe98b",
    "name": "Surat Cotton Spinning Mill Ltd",
    "owner_email": "owner@suratcotton.com",
    "created_at": "2026-09-28T12:00:00Z"
  }
  ```

#### 2. `PATCH /api/v2/businesses/{id}/`
- **Purpose**: Update enterprise profile metadata.
- **Auth**: `IsAuthenticated` + `HasBusinessRole([OWNER, ADMIN])`.
- **Tenant Scope**: Strictly scoped to URL parameter `{id}`. Fails with 404 if caller is not an authorized member.
- **Response Payload (200 OK)**: Updated business object.

---

### B. Assessment & Questioning Workflow

#### 3. `POST /api/v2/assessments/{id}/orchestration/generate-questions/`
- **Purpose**: Execute Understanding and Engine 1 Discovery to generate 0–4 targeted questions.
- **Auth**: `IsAuthenticated` + `HasBusinessAccess`.
- **Business / Assessment Scope**: URL param `{id}` must match an active assessment for the authorized business.
- **Side Effects**: Ingests free text, creates `BusinessProfileVersion` (v1), queries ComplianceRag candidates, creates `SmartQuestionPlan`.
- **Response Payload (200 OK)**:
  ```json
  {
    "assessment_id": "9a1d48c8-3801-447a-9721-cfa59d6dbdb6",
    "questions_count": 2,
    "questions": [
      {
        "question_id": "Q_LOAD_01",
        "target_fact_key": "operations.connected_load_hp",
        "question_text": "What is the total sanctioned electrical load of your facility?",
        "category": "Power & Energy",
        "answer_type": "NUMBER",
        "unit": "HP",
        "required": true,
        "order": 1,
        "reasoning": "Determines applicability of State Electricity Duty and Factory Act Power thresholds."
      },
      {
        "question_id": "Q_BOILER_01",
        "target_fact_key": "environmental.boiler_fuel_type",
        "question_text": "What fuel is consumed in the 3 TPH industrial boiler?",
        "category": "Boiler Safety",
        "answer_type": "SINGLE_SELECT",
        "options": [
          {"value": "AGRO_BIOMASS", "label": "Agro-waste / Biomass Briquettes"},
          {"value": "NATURAL_GAS", "label": "Piped Natural Gas (PNG)"},
          {"value": "COAL_LIGNITE", "label": "Coal / Lignite"}
        ],
        "required": true,
        "order": 2,
        "reasoning": "Determines GPCB Air Pollution Control measures and fuel ban compliance."
      }
    ]
  }
  ```

#### 4. `POST /api/v2/assessments/{id}/answers/`
- **Purpose**: Submit user answers to the adaptive questionnaire.
- **Auth**: `IsAuthenticated` + `HasBusinessAccess`.
- **Request Payload**:
  ```json
  {
    "answers": [
      { "question_id": "Q_LOAD_01", "value": 643.7, "unit": "HP" },
      { "question_id": "Q_BOILER_01", "value": "NATURAL_GAS" }
    ]
  }
  ```
- **Side Effects**: Normalizes answers into `CanonicalFact` objects, increments version to `BusinessProfileVersion` (v2), freezes profile version.
- **Response Payload (200 OK)**:
  ```json
  {
    "assessment_id": "9a1d48c8-3801-447a-9721-cfa59d6dbdb6",
    "profile_version": 2,
    "status": "PROFILE_FROZEN",
    "ready_for_evaluation": true
  }
  ```

#### 5. `POST /api/v2/assessments/{id}/evaluate/`
- **Purpose**: Trigger Engine 2 deterministic applicability evaluation against frozen profile.
- **Auth**: `IsAuthenticated` + `HasBusinessAccess`.
- **Side Effects**: Evaluates candidate ASTs, persists `DecisionRun`, `DecisionResults`, aggregates and signs `CIR`.
- **Response Payload (200 OK)**:
  ```json
  {
    "assessment_id": "9a1d48c8-3801-447a-9721-cfa59d6dbdb6",
    "decision_run_id": "RUN-2026-09-28-001",
    "cir_id": "CIR-2026-09-28-SURAT-TEXTILE-01",
    "status": "COMPLETED",
    "metrics": {
      "applicable_count": 6,
      "not_applicable_count": 28,
      "needs_info_count": 0
    }
  }
  ```

---

### C. Compliance & Projections

#### 6. `GET /api/v2/assessments/{id}/compliance/`
- **Purpose**: Retrieve verified compliance determinations and legal citations.
- **Auth**: `IsAuthenticated` + `HasBusinessAccess`.
- **Response Payload (200 OK)**:
  ```json
  {
    "cir_id": "CIR-2026-09-28-SURAT-TEXTILE-01",
    "assessment_id": "9a1d48c8-3801-447a-9721-cfa59d6dbdb6",
    "profile_version": 2,
    "summary": {
      "applicable_count": 6,
      "not_applicable_count": 28,
      "needs_information_count": 0
    },
    "determinations": [
      {
        "requirement_id": "REQ-GPCB-CTE",
        "title": "Consent to Establish (Pollution Control)",
        "status": "APPLICABLE",
        "authority": "Gujarat Pollution Control Board",
        "evidence": {
          "act_title": "Water (Prevention and Control of Pollution) Act, 1974",
          "section": "Section 25",
          "official_url": "https://gpcb.gujarat.gov.in/consent_rules.pdf"
        },
        "explanation": "Applicable because your facility operates fabric dyeing and discharges industrial effluent in Gujarat."
      }
    ]
  }
  ```

#### 7. `GET /api/v2/assessments/{id}/schemes/`
- **Purpose**: Retrieve matched government subsidy and incentive programs.
- **Auth**: `IsAuthenticated` + `HasBusinessAccess`.

#### 8. `GET /api/v2/assessments/{id}/standards/`
- **Purpose**: Retrieve mandatory QCOs versus voluntary quality certifications.
- **Auth**: `IsAuthenticated` + `HasBusinessAccess`.

#### 9. `GET /api/v2/assessments/{id}/calendar/`
- **Purpose**: Retrieve statutory deadlines derived from CIR applicable obligations.
- **Auth**: `IsAuthenticated` + `HasBusinessAccess`.

---

### D. Administrative Scrutiny & Governance

#### 10. `GET /api/v2/admin/assessments/{id}/`
- **Purpose**: Full compliance scrutiny view for auditors.
- **Auth**: `IsAuthenticated` + `IsStaffUser`.
- **Response Payload (200 OK)**: Full evaluation trace, AST logic trees, variable resolutions, and raw gazette chunk snippets.
