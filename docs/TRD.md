# TRD.md --- ComplyWise

## Technical Requirements Document

**Version:** 2.0\
**Status:** Canonical hackathon build specification\
**Product:** ComplyWise --- AI-Powered Industrial Compliance & Standards
Intelligence Platform\
**Target:** SIH / hackathon MVP\
**Primary deployment target:** Azure-compatible cloud\
**Primary backend owner:** Somsubhra

------------------------------------------------------------------------

## 0. Purpose and Authority

This document converts `PRD.md` into an implementation specification for
the backend, frontend and UX teams.

Source hierarchy:

``` text
Research
  ↓
Project Decision Log
  ↓
PRD.md
  ↓
TRD.md
  ↓
Source code + knowledge packs + tests
```

The old TRD is historical reference only. This document is canonical for
implementation details.

The finalized decisions establish one generalized engine, a 19-variable
business profile, deterministic applicability, evidence-backed results,
versioned knowledge, human review, rule tests, separate
workflow/document states, and progressive knowledge build. The
applicability architecture is considered locked; remaining work is
implementation, verified rule population, lookup services and tests.

------------------------------------------------------------------------

# 1. Technical Objectives

1.  Build one generalized dynamic compliance engine; the five scenarios are regression fixtures only.
2.  Keep regulatory rules as data, not application-specific code.
3.  Preserve `TRUE / FALSE / UNKNOWN` evaluation.
4.  Make every material regulatory result explainable and
    evidence-backed.
5.  Make rule/evidence versions and effective dates explicit.
6.  Support progressive questions driven by rule dependencies.
7.  Connect requirements to documents, workflows and deadlines.
8.  Provide contextual standards, schemes and AI assistance.
9.  Keep the MVP a modular monolith.
10. Deploy reliably to Azure-compatible infrastructure.
11. Minimize third-party services and keep all external credentials
    server-side.
12. Make one verified golden path the first complete vertical slice; do not couple the engine to a named scenario.

------------------------------------------------------------------------

# 2. Non-Goals

MVP does not include:

-   complete nationwide regulatory coverage;
-   autonomous government submissions;
-   live write integrations to FoSCoS, NSWS or state portals;
-   complex EIA calculations;
-   accounting/GST engines;
-   legal contract generation;
-   enterprise SSO;
-   complex multi-tenant permissions;
-   visual rule-builder/CMS;
-   microservice fleet;
-   separate databases per module;
-   autonomous legal interpretation;
-   unrestricted live web browsing by the assistant.

Government/official portals are external execution destinations.
ComplyWise prepares the user and provides verified links; it does not
claim official submission or approval.

------------------------------------------------------------------------

# 3. System Architecture

``` text
┌──────────────────────────────────────────────┐
│ FRONTEND                                     │
│ React / Next.js + TypeScript                 │
│ Onboarding · Dashboard · Compliance          │
│ Documents · Workflows · Calendar · AI        │
└──────────────────────┬───────────────────────┘
                       │ HTTPS/JSON
                       ▼
┌──────────────────────────────────────────────┐
│ DJANGO MODULAR MONOLITH                     │
│                                              │
│ Accounts                                     │
│ Businesses / Profiles                        │
│ Onboarding / Questions                       │
│ Knowledge / Evidence                         │
│ Applicability Engine                         │
│ Requirements                                 │
│ Documents                                    │
│ Workflows / Calendar                         │
│ Schemes / Standards                          │
│ Regulatory Updates                           │
│ Assistant / RAG                              │
│ Dashboard                                    │
└───────────────┬─────────────────┬────────────┘
                │                 │
                ▼                 ▼
        PostgreSQL + pgvector   Private Blob Storage
                │
                ▼
       Versioned Knowledge Packs
                │
                ▼
      Optional AI/OCR Providers
```

**Invariant:** frontend never calls AI providers, vector stores,
government APIs or private object storage directly.

------------------------------------------------------------------------

# 4. Recommended Stack

## Backend

-   Python 3.12+
-   Django 6.x, current security patch
-   Django REST Framework
-   PostgreSQL
-   pgvector
-   pytest / Django tests
-   Pydantic for structured non-ORM validation where useful

Django should provide the application shell, ORM, authentication,
migrations, validation, security middleware and REST layer. Domain logic
must live in explicit services, not views.

## Frontend

-   Next.js / React
-   TypeScript
-   reusable component system
-   responsive desktop-first SaaS layout

## Storage

-   PostgreSQL for structured data and vectors
-   Azure Blob Storage or S3-compatible private object storage for
    documents

## Async processing

Use synchronous execution for cheap deterministic operations. Use
background jobs for OCR, document processing, embeddings and long AI
operations. Redis may be used when a queue/cache is actually required;
it is not a mandatory dependency for every request.

## AI

Use provider interfaces:

``` text
LLMProvider
EmbeddingProvider
OCRProvider
```

Do not couple domain code directly to a vendor SDK.

------------------------------------------------------------------------

# 5. Repository Structure

``` text
complywise/
├── backend/
│   ├── manage.py
│   ├── config/
│   ├── apps/
│   │   ├── accounts/
│   │   ├── businesses/
│   │   ├── onboarding/
│   │   ├── knowledge/
│   │   ├── evidence/
│   │   ├── applicability/
│   │   ├── requirements/
│   │   ├── documents/
│   │   ├── workflows/
│   │   ├── calendar/
│   │   ├── schemes/
│   │   ├── standards/
│   │   ├── regulatory_updates/
│   │   ├── assistant/
│   │   └── dashboard/
│   ├── domain/
│   │   ├── rules/
│   │   ├── evaluation/
│   │   ├── classification/
│   │   └── provenance/
│   ├── knowledge_packs/
│   │   ├── common/
│   │   ├── gujarat_food/
│   │   ├── telangana_electronics/
│   │   ├── gujarat_trade/
│   │   ├── tamil_nadu_auto/
│   │   └── karnataka_esdm/
│   └── tests/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── hooks/
│   └── tests/
└── docs/
```

Exact naming can vary; domain boundaries must remain explicit.

------------------------------------------------------------------------

# 6. Domain Boundaries

### Accounts

Authentication and user access.

### Businesses

Business entity, active profile and profile versions.

### Onboarding

Adaptive questions, answers and onboarding state.

### Knowledge

Rules, requirements, documents, workflows, schemes, standards, source
metadata and publication lifecycle.

### Evidence

Authoritative sources, evidence records and verification.

### Applicability

Scope filtering, AST evaluation, unknown handling, precedence,
explanation traces.

### Requirements

Requirement catalog and business-specific requirement instances.

### Documents

Document requirements, uploads, OCR/extraction and pre-validation.

### Workflows

Workflow templates, instances, steps and execution dependencies.

### Calendar

Deadlines, renewals and reminders.

### Schemes

Eligibility rules and benefit estimates.

### Standards

BIS/standards/QCO/testing knowledge and retrieval.

### Regulatory Updates

Changes, relevance and review events.

### Assistant

Contextual retrieval and source-grounded answers.

### Dashboard

Read aggregation only. It is not a second source of truth.

------------------------------------------------------------------------

# 7. Canonical Data Model

``` text
User
 ↓
Business
 ↓
BusinessProfileVersion
 ↓
DecisionRun
 ├── DecisionResult
 │    ├── RuleVersion
 │    ├── RequirementDefinition
 │    ├── Evidence
 │    └── ExplanationTrace
 ├── RequirementInstance
 │    ├── DocumentRequirement
 │    │    └── Document
 │    └── WorkflowInstance
 │         └── WorkflowStep
 ├── SchemeMatch
 └── StandardsMatch
```

Knowledge graph:

``` text
Source
 ↓
Evidence
 ↓
RuleVersion
 ↓
RequirementDefinition
 ↓
DocumentRequirementDefinition
 ↓
WorkflowTemplate
```

------------------------------------------------------------------------

# 8. Business Profile

The canonical 19 variables are:

``` text
V01 Legal Constitution
V02 Lifecycle Stage
V03 State
V04 District
V05 Industrial Zone Status
V06 Product Description
V07 Annual Turnover
V08 Plant & Machinery Investment
V09 Ownership Social Category
V10 Ownership Gender
V11 Import/Export Intent
V12 Export Destination
V13 Total Worker Count
V14 Contract Worker Count
V15 Connected Power Load
V16 Effluent/Emission Generation
V17 Hazardous Waste Generation
V18 E-Commerce Operations
V19 Multi-State Operations
```

Every variable may be:

``` text
CORE
CONDITIONAL
OPTIONAL
NOT_NEEDED
```

The question/dependency matrix determines which questions are displayed. Runtime questioning is driven by missing decision-relevant variables. Scenario fixtures are test data only.

The system must distinguish:

``` text
USER_PROVIDED
DERIVED
LOOKUP
```

Example:

``` json
{
  "variable": "product_classification",
  "value": "food_processing",
  "origin": "DERIVED",
  "confidence": 0.91,
  "derived_from": ["V06"]
}
```

Original user input is immutable and must never be overwritten by a
derived value.

------------------------------------------------------------------------

# 9. Business Profile Versioning

``` text
BusinessProfileVersion
- id
- business_id
- version
- all applicable V01–V19 values
- created_by
- created_at
```

Material profile changes create a new version.

A decision run always references a specific profile version.

------------------------------------------------------------------------

# 10. Knowledge / Domain Model

The engine must not require a scenario identifier to decide applicability.
A decision is driven by the business context and published knowledge matching
its jurisdiction, domain, product/activity and effective dates.

Conceptually:

```text
Business Context
   ↓
Knowledge Scope Selection
   ↓
Published Rules
   ↓
Evaluation
```

The old five scenarios remain test/fixture identifiers only:

```text
GUJARAT_FOOD
TS_ELECTRONICS
GUJ_TRADE
TN_AUTO
KA_ESDM
```

No scenario-specific evaluator code is allowed. A fixture only packages a
representative profile, knowledge snapshot, expected results and tests.

# 11A. Knowledge Acquisition, Ingestion & Verification Pipeline

This is a first-class technical subsystem. It is responsible for turning official
source material into publishable structured knowledge while preserving provenance.

## Pipeline

```text
Source Discovery
      ↓
Source Acquisition
      ↓
SourceDocument Version
      ↓
PDF / HTML Normalization
      ↓
OCR / Text Extraction
      ↓
Document Structure + Locators
      ↓
Claim Extraction
      ↓
Evidence Objects
      ↓
Semantic Verification
      ↓
Cross-Source Consistency
      ↓
Rule / Requirement Draft
      ↓
Schema + Type Validation
      ↓
Rule / Regression Tests
      ↓
Human Review if required
      ↓
APPROVED → PUBLISHED
```

## Source adapters

Use an interface such as:

```python
class SourceConnector(Protocol):
    def fetch(self, source_reference: str) -> SourceArtifact: ...
```

Possible implementations:

```text
OfficialAPIConnector
FirecrawlConnector
CrawleeConnector
ManualFileConnector
HTMLConnector
PDFConnector
```

Firecrawl/Crawlee are acquisition tools, not authorities.

## Raw-source preservation

For important sources retain:
- original file/HTML snapshot;
- canonical URL;
- retrieval timestamp;
- content hash;
- document identifier;
- MIME/type metadata.

## Verification gates

A claim may not silently become production truth. Validate:

1. source authenticity;
2. extraction accuracy;
3. semantic support by the source;
4. effective-date correctness;
5. cross-source consistency;
6. structured-rule validity;
7. boundary/regression tests;
8. reviewer approval when ambiguous.

Conflicts become `CONFLICTING` / `REVIEW`, not an LLM tie-break decision.

## Publication invariant

```text
DRAFT → VALIDATION_PENDING → UNDER_REVIEW → APPROVED → PUBLISHED
```

Only `PUBLISHED` knowledge can affect runtime compliance decisions.


# 11. Rule Model

Regulatory thresholds, conditions, fees, exceptions, overrides and
eligibility rules are data.

Conceptual:

``` text
RuleVersion
- id
- rule_id
- version
- domain
- scenario
- jurisdiction
- effective_from
- effective_until
- status
- requirement_id
- condition_ast
- result
- evidence_refs
- supersedes_rule_version
```

Only `PUBLISHED` rules can affect production decisions.

------------------------------------------------------------------------

# 12. Rule AST

Initial operators:

### Boolean

``` text
AND
OR
NOT
```

### Comparison

``` text
EQ
NEQ
GT
GTE
LT
LTE
IN
NOT_IN
```

### Existence

``` text
EXISTS
MISSING
```

### Classification

``` text
CONTAINS
MATCHES_CLASSIFICATION
INTERSECTS
```

AST nodes must be schema-validated before publication.

Example:

``` json
{
  "op": "AND",
  "args": [
    {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"},
    {"op": "GTE", "left": {"var": "annual_turnover"}, "right": 15000000}
  ]
}
```

------------------------------------------------------------------------

# 13. Three-Valued Logic

Evaluator values:

``` text
TRUE
FALSE
UNKNOWN
```

Required behavior:

``` text
TRUE AND TRUE       → TRUE
TRUE AND FALSE      → FALSE
TRUE AND UNKNOWN    → UNKNOWN
FALSE AND UNKNOWN   → FALSE

TRUE OR UNKNOWN     → TRUE
FALSE OR UNKNOWN    → UNKNOWN

NOT TRUE            → FALSE
NOT FALSE           → TRUE
NOT UNKNOWN         → UNKNOWN
```

Missing decision-critical data must not become FALSE.

------------------------------------------------------------------------

# 14. Applicability Pipeline

``` text
Decision request
 ↓
Immutable profile context
 ↓
Evaluation date
 ↓
Scenario resolution
 ↓
Scope pre-filter
 ↓
Published rule loading
 ↓
AST evaluation
 ↓
Exception / override resolution
 ↓
UNKNOWN/conflict resolution
 ↓
Decision results
 ↓
Explanation traces
 ↓
Evidence attachment
 ↓
Requirement resolution
 ↓
Documents
 ↓
Workflows
 ↓
Calendar
 ↓
Schemes / Standards
```

------------------------------------------------------------------------

# 15. Rule Scope Pre-Filtering

Filter rules before evaluation by:

-   scenario;
-   country/state/jurisdiction;
-   domain;
-   lifecycle;
-   product/activity;
-   effective date;
-   published status.

This reduces unnecessary evaluation and cross-domain leakage.

------------------------------------------------------------------------

# 16. Rule Precedence

Explicitly model:

``` text
BASE RULE
 ↓
EXCEPTION
 ↓
OVERRIDE
 ↓
FINAL RESULT
```

Never depend on insertion order or database query order.

------------------------------------------------------------------------

# 17. Result Statuses

Canonical applicability statuses:

``` text
APPLICABLE
NOT_APPLICABLE
NEEDS_INFORMATION
CONFLICT_REVIEW
UNVERIFIED
```

Definitions:

-   `APPLICABLE`: verified rule matched.
-   `NOT_APPLICABLE`: verified rule evaluated and did not match.
-   `NEEDS_INFORMATION`: decision-critical input is missing.
-   `CONFLICT_REVIEW`: authoritative rules/evidence conflict.
-   `UNVERIFIED`: potential requirement exists but evidence does not
    meet verification requirements.

------------------------------------------------------------------------

# 18. Decision Run

``` text
DecisionRun
- id
- business_id
- profile_version_id
- knowledge_snapshot_id
- evaluation_date
- knowledge_pack_version
- status
- started_at
- completed_at
- error_summary
```

Statuses:

``` text
PENDING
RUNNING
COMPLETED
PARTIAL
FAILED
```

Decision runs are immutable historical facts.

------------------------------------------------------------------------

# 19. Decision Result

``` text
DecisionResult
- id
- decision_run_id
- requirement_definition_id
- rule_id
- rule_version
- status
- priority
- explanation_trace_json
- evidence_refs
- created_at
```

Multiple rules may resolve to one canonical requirement.

------------------------------------------------------------------------

# 20. Explanation Trace

Every material result must preserve:

``` json
{
  "rule_id": "RULE-001",
  "rule_version": 2,
  "variables": [
    {
      "name": "annual_turnover",
      "value": 42000000,
      "origin": "USER_PROVIDED"
    }
  ],
  "conditions": [
    {
      "expression": "annual_turnover <= threshold",
      "result": true
    }
  ],
  "exceptions": [],
  "overrides": [],
  "final_result": "APPLICABLE",
  "evidence_refs": ["EV-001"]
}
```

The frontend converts this into human-readable explanation.

------------------------------------------------------------------------

# 21. Requirement Definition

``` text
RequirementDefinition
- id
- code
- name
- authority
- domain
- requirement_type
- description
- jurisdiction
- default_priority
- external_portal_url
- status
```

Types:

``` text
LICENSE
REGISTRATION
CONSENT
CERTIFICATION
STANDARD
REPORTING
RENEWAL
NOTIFICATION
DOCUMENT
OTHER
```

------------------------------------------------------------------------

# 22. Requirement Instance

``` text
RequirementInstance
- id
- business_id
- decision_run_id
- requirement_definition_id
- applicability_status
- priority
- deadline
- validity_until
- created_at
- updated_at
```

Do not delete historical requirement instances when a later analysis
changes the result.

------------------------------------------------------------------------

# 23. Evidence Model

## Source

``` text
Source
- id
- authority
- title
- source_type
- canonical_url
- publication_date
- updated_date
- effective_date
- status
- content_hash
- retrieved_at
```

Source statuses:

``` text
ACTIVE
UPDATED
SUPERSEDED
EXPIRED
WITHDRAWN
CONFLICTING
```

## Evidence

``` text
Evidence
- id
- source_id
- locator
- structured_fact_or_excerpt
- verification_status
- effective_from
- effective_until
```

Verification:

``` text
VERIFIED
UNVERIFIED
CONFLICTING
```

------------------------------------------------------------------------

# 24. Provenance

Required relationship:

``` text
Source
→ Evidence
→ RuleVersion
→ DecisionResult
→ RequirementInstance
→ WorkflowInstance
```

This supports explanation, audit, review and future impact analysis.

------------------------------------------------------------------------

# 25. Knowledge Lifecycle

Pipeline:

``` text
RESEARCH
→ DRAFT
→ VALIDATION
→ HUMAN REVIEW
→ APPROVAL
→ PUBLISH
```

Record statuses:

``` text
DRAFT
VALIDATION_PENDING
UNDER_REVIEW
APPROVED
PUBLISHED
SUPERSEDED
ARCHIVED
REJECTED
```

Only `PUBLISHED` knowledge is production-active.

------------------------------------------------------------------------

# 26. Knowledge Validation Gate

Before publication validate:

-   schema;
-   data types;
-   AST;
-   rule references;
-   requirement references;
-   evidence references;
-   workflow references;
-   document references;
-   dates;
-   dependencies;
-   critical rule tests;
-   regression tests.

Invalid knowledge cannot be published.

MVP knowledge authoring does not require a visual admin UI. JSON/YAML +
Git + automated validation + review is sufficient.

------------------------------------------------------------------------

# 27. Knowledge Packs

Knowledge packs are versioned bundles of verified evidence and structured rules.
They should be organized around domains/jurisdictions/authorities as coverage grows.

```text
knowledge_packs/
├── common/
├── authorities/
├── domains/
├── jurisdictions/
└── fixtures/
    ├── gujarat_food/
    ├── telangana_electronics/
    ├── gujarat_trade/
    ├── tamil_nadu_auto/
    └── karnataka_esdm/
```

Each pack may contain:

``` text
scenario.json
sources.json
evidence.json
requirements.json
rules.json
documents.json
workflows.json
schemes.json
standards.json
tests/
```

The first complete pack may be the easiest verified golden path, but its name must not be hardcoded into evaluator logic.

------------------------------------------------------------------------

# 28. Derived / Lookup Services

These are separate from the evaluator.

## Product classification

``` text
raw product description
→ normalized activity/product
→ candidate classification
→ confidence
```

## Standards

``` text
product
→ candidate standards
→ QCO/certification/testing information
```

## Trade

``` text
product
→ HS/ITC(HS)
→ current DGFT policy
→ Free / Restricted / Prohibited / conditions
→ additional requirements
```

## Location

``` text
state
→ district
→ zone/industrial-zone context
→ scheme inputs
```

Do not make the LLM responsible for final lookup truth.

------------------------------------------------------------------------

# 29. Progressive Question Engine

Algorithm:

``` text
Profile
 ↓
Evaluate rules
 ↓
Find UNKNOWN variables
 ↓
Rank by decision impact
 ↓
Select highest-impact variable
 ↓
Generate question
 ↓
Save answer
 ↓
Re-evaluate
```

Stop when:

-   no decision-critical UNKNOWN remains;
-   all supported results resolve;
-   configured question limit is reached;
-   human review is required.

Question definition:

``` text
QuestionDefinition
- id
- variable_id
- question_text
- help_text
- input_type
- options
- dependency
- scenario
- priority
```

------------------------------------------------------------------------

# 30. API Standards

Base path:

``` text
/api/v1/
```

Use:

-   JSON;
-   UUIDs;
-   ISO-8601 timestamps;
-   explicit enums;
-   pagination;
-   server-side authorization;
-   consistent errors;
-   no secrets in responses.

Success envelope:

``` json
{
  "data": {},
  "meta": {}
}
```

Error:

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The profile is incomplete.",
    "details": []
  }
}
```

------------------------------------------------------------------------

# 31. Core API

## Auth

``` text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## Businesses

``` text
GET   /api/v1/businesses
POST  /api/v1/businesses
GET   /api/v1/businesses/{id}
PATCH /api/v1/businesses/{id}
```

## Profiles

``` text
GET  /api/v1/businesses/{id}/profile
POST /api/v1/businesses/{id}/profile/versions
GET  /api/v1/businesses/{id}/profile/history
```

## Onboarding

``` text
POST /api/v1/onboarding/start
GET  /api/v1/onboarding/{id}
GET  /api/v1/onboarding/{id}/questions
POST /api/v1/onboarding/{id}/answers
POST /api/v1/onboarding/{id}/complete
```

## Analysis

``` text
POST /api/v1/businesses/{id}/analysis
GET  /api/v1/analysis/{id}
GET  /api/v1/analysis/{id}/results
```

## Requirements

``` text
GET /api/v1/businesses/{id}/requirements
GET /api/v1/requirements/{id}
GET /api/v1/requirements/{id}/explanation
GET /api/v1/requirements/{id}/evidence
```

## Documents

``` text
GET    /api/v1/businesses/{id}/documents
POST   /api/v1/businesses/{id}/documents
GET    /api/v1/documents/{id}
POST   /api/v1/documents/{id}/validate
POST   /api/v1/documents/{id}/replace
DELETE /api/v1/documents/{id}
```

## Workflows

``` text
GET  /api/v1/businesses/{id}/workflows
GET  /api/v1/workflows/{id}
POST /api/v1/workflows/{id}/start
POST /api/v1/workflows/{id}/steps/{step_id}/complete
POST /api/v1/workflows/{id}/steps/{step_id}/reset
```

## Calendar

``` text
GET /api/v1/businesses/{id}/calendar
GET /api/v1/calendar/events/{id}
```

## Schemes

``` text
GET /api/v1/businesses/{id}/schemes
GET /api/v1/schemes/{id}
```

## Standards

``` text
GET  /api/v1/businesses/{id}/standards
POST /api/v1/standards/query
GET  /api/v1/standards/{id}
```

## Updates

``` text
GET /api/v1/businesses/{id}/regulatory-updates
GET /api/v1/regulatory-updates/{id}
```

## Assistant

``` text
POST /api/v1/businesses/{id}/assistant/query
GET  /api/v1/businesses/{id}/assistant/conversations
GET  /api/v1/assistant/conversations/{id}
```

## Dashboard

``` text
GET /api/v1/businesses/{id}/dashboard
```

------------------------------------------------------------------------

# 32. Authorization

For every business-scoped request:

``` text
authenticated user
→ access to business
→ resource belongs to business
→ operation allowed
```

Never trust a client-supplied business ID.

This applies to documents, requirements, workflows, calendar, assistant
context and profile data.

------------------------------------------------------------------------

# 33. Document Model

## DocumentRequirement

``` text
DocumentRequirement
- id
- requirement_definition_id
- name
- description
- required_fields
- accepted_mime_types
- max_size
- validation_rules
- expiry_expected
```

## Document

``` text
Document
- id
- business_id
- document_requirement_id
- file_name
- storage_key
- mime_type
- size_bytes
- checksum
- uploaded_at
- uploaded_by
- status
- extracted_data_json
```

Document statuses:

``` text
NOT_UPLOADED
UPLOADED
PROCESSING
VERIFIED
ISSUE
NEEDS_REVIEW
EXPIRED
REPLACEMENT_REQUIRED
```

------------------------------------------------------------------------

# 34. Document Processing

``` text
Upload
→ security checks
→ file identification
→ OCR/text extraction
→ classification
→ field extraction
→ profile consistency
→ requirement consistency
→ date/expiry checks
→ validation result
```

Validation:

``` text
PASS
ISSUE
NEEDS_REVIEW
```

AI pre-validation is never official approval.

------------------------------------------------------------------------

# 35. Document Security

-   private object storage;
-   access control;
-   file size/type checks;
-   checksum;
-   optional malware scan;
-   signed URLs or backend streaming;
-   no permanent public URLs;
-   no raw file contents in logs.

------------------------------------------------------------------------

# 36. Workflow Model

## WorkflowTemplate

``` text
WorkflowTemplate
- id
- requirement_definition_id
- version
- status
- external_portal_url
```

## WorkflowInstance

``` text
WorkflowInstance
- id
- business_id
- requirement_instance_id
- template_version
- status
- started_at
- completed_at
```

## WorkflowStep

``` text
WorkflowStep
- id
- workflow_instance_id
- definition_id
- sequence
- status
- dependency_ids
- required_document_ids
- external_portal_url
- statutory_deadline
- processing_sla
```

Workflow statuses:

``` text
NOT_STARTED
IN_PROGRESS
WAITING_FOR_USER
UNDER_REVIEW
NEEDS_CORRECTION
READY
SUBMITTED
COMPLETED
OVERDUE
BLOCKED
```

------------------------------------------------------------------------

# 37. Workflow Dependency

Keep two concepts separate:

``` text
REGULATORY DEPENDENCY
→ affects applicability

WORKFLOW DEPENDENCY
→ affects execution order
```

Example:

``` text
IEC verified
 ↓
Trade registration
 ↓
Submission
```

If IEC is incomplete, downstream workflow step is `BLOCKED`.

Dependencies are server-validated.

------------------------------------------------------------------------

# 38. Workflow State Transitions

Typical valid transitions:

``` text
NOT_STARTED → IN_PROGRESS
IN_PROGRESS → WAITING_FOR_USER
IN_PROGRESS → NEEDS_CORRECTION
NEEDS_CORRECTION → IN_PROGRESS
IN_PROGRESS → READY
READY → SUBMITTED
SUBMITTED → COMPLETED
```

Invalid transitions return `409 CONFLICT`.

------------------------------------------------------------------------

# 39. Calendar

``` text
CalendarEvent
- id
- business_id
- event_type
- title
- description
- starts_at
- due_at
- source_requirement_id
- source_workflow_id
- source_document_id
- status
```

Types:

``` text
STATUTORY_DEADLINE
SUBMISSION_DEADLINE
RENEWAL
REMINDER
WORKFLOW_MILESTONE
```

Deadlines must come from verified knowledge or explicit user-created
events.

Do not invent renewal cycles.

------------------------------------------------------------------------

# 40. Schemes

Use the generic rule engine where possible:

``` text
Business Context
→ Scheme rules
→ TRUE/FALSE/UNKNOWN
→ Potentially Eligible / More Information Needed / Not Eligible
```

Scheme match stores:

``` text
rule
evidence
missing variables
benefit formula
confidence
```

Benefit estimates use `Decimal`, not floating point, and must be
labelled indicative.

------------------------------------------------------------------------

# 41. Standards / BIS

Standard:

``` text
Standard
- id
- code
- title
- scope
- domain
- status
- publication_date
- current_version
```

Additional information:

``` text
QCO
testing
certification
amendments
source
verification
```

The user should be able to ask product-language questions without
knowing an IS number.

------------------------------------------------------------------------

# 42. RAG Architecture

``` text
User query
 ↓
Business context
 ↓
query normalization
 ↓
metadata filters
 ↓
semantic retrieval
 +
exact keyword/code retrieval
 ↓
result fusion/rerank
 ↓
evidence selection
 ↓
LLM synthesis
 ↓
citation validation
 ↓
response
```

Metadata:

``` text
authority
domain
scenario
state
product
status
effective_from
effective_until
verification_status
source_id
evidence_id
```

Do not rely only on vector similarity; exact regulatory codes and
standard numbers need lexical retrieval.

------------------------------------------------------------------------

# 43. RAG Chunk Contract

Every indexed chunk must preserve:

``` text
chunk_id
source_id
evidence_id
authority
title
section/page locator
scenario
state
effective dates
verification status
content hash
```

Changed content gets a new content hash and embedding.

------------------------------------------------------------------------

# 44. Assistant Response Contract

``` json
{
  "answer": "...",
  "classification": "FACT",
  "sources": [
    {
      "evidence_id": "EV-001",
      "authority": "...",
      "title": "...",
      "locator": "..."
    }
  ],
  "verification": "VERIFIED",
  "confidence": 0.91,
  "needs_review": false
}
```

Classification:

``` text
FACT
SOURCE
AI_INTERPRETATION
VERIFICATION_REQUIRED
```

If evidence is insufficient, answer with `VERIFICATION_REQUIRED`.

If sources conflict, use `CONFLICT_REVIEW`.

The model must never invent citations, fees, deadlines, standards or
legal conclusions.

------------------------------------------------------------------------

# 45. Prompt Architecture

Use separate prompts for:

1.  product/activity classification;
2.  smart-question generation;
3.  source-grounded assistant;
4.  document classification;
5.  document extraction;
6.  explanation generation.

Prompts must not hardcode current regulatory thresholds.

All structured LLM output must be schema validated before persistence.

------------------------------------------------------------------------

# 46. AI Failure Handling

If AI is unavailable:

``` text
deterministic applicability → continues
assistant → controlled unavailable response
document AI → PROCESSING/RETRY/NEEDS_REVIEW
```

An AI failure must never become a false regulatory result.

Use bounded retries only for transient failures.

------------------------------------------------------------------------

# 47. Regulatory Updates

``` text
RegulatoryUpdate
- id
- source_id
- title
- summary
- authority
- publication_date
- effective_date
- status
- affected_rule_ids
```

Source status changes:

``` text
updated
superseded
expired
withdrawn
conflicting
```

must create review events for affected knowledge.

Full customer-wide impact recalculation is post-MVP. For the hackathon, the system only needs to identify affected knowledge/rules and require revalidation before publishing a changed version.

------------------------------------------------------------------------

# 48. Human Review

``` text
ReviewCase
- id
- business_id
- decision_run_id
- requirement_id
- reason
- status
- assigned_to
- notes
- resolution
- created_at
- resolved_at
```

Reasons:

``` text
SOURCE_CONFLICT
MISSING_EVIDENCE
AMBIGUOUS_CLASSIFICATION
LOCAL_APPLICABILITY_UNVERIFIED
EXPERT_INTERPRETATION
```

Statuses:

``` text
OPEN
IN_REVIEW
RESOLVED
REJECTED
```

A review resolution creates a new event/result. It must not silently
rewrite history.

------------------------------------------------------------------------

# 49. Re-analysis

Material profile change:

``` text
new profile version
→ affected knowledge/rules
→ new decision run
→ requirement reconciliation
→ workflow/calendar reconciliation
```

Historical runs remain immutable.

Examples of material changes:

-   product;
-   state/district;
-   turnover;
-   workers;
-   power load;
-   environmental conditions;
-   import/export intent;
-   multi-state operations.

------------------------------------------------------------------------

# 50. Requirement Deduplication

If multiple rules produce the same requirement:

``` text
Rule A → Requirement X
Rule B → Requirement X
```

create one canonical `RequirementInstance` for the decision run while
retaining:

-   both rule references;
-   both explanation paths where relevant;
-   all evidence references.

Do not use first-match-wins.

------------------------------------------------------------------------

# 51. Readiness Score

Dashboard score is:

``` text
Compliance readiness
```

not legal compliance.

Suggested deterministic inputs:

Positive: - completed workflows; - verified documents; - completed
actions.

Negative: - overdue actions; - missing documents; - blocked workflows; -
unresolved high-priority items.

Normalize to 0--100.

Exact formula must be implemented as a versioned deterministic function.

------------------------------------------------------------------------

# 52. Dashboard API

``` json
{
  "business": {},
  "readiness": {
    "score": 82,
    "label": "Compliance readiness"
  },
  "summary": {
    "action_required": 3,
    "due_soon": 4,
    "on_track": 11,
    "benefits_identified": 4
  },
  "priority_actions": [],
  "upcoming_deadlines": [],
  "recent_updates": [],
  "scheme_summary": {}
}
```

Numbers must come from actual records.

------------------------------------------------------------------------

# 53. Frontend Architecture

``` text
frontend/
├── app/
│   ├── onboarding/
│   ├── dashboard/
│   ├── compliance/
│   ├── documents/
│   ├── workflows/
│   ├── calendar/
│   ├── schemes/
│   ├── standards/
│   ├── updates/
│   ├── assistant/
│   ├── reports/
│   ├── profile/
│   └── settings/
├── components/
├── features/
└── lib/api/
```

All server calls go through a typed API client.

Do not scatter raw API calls across UI components.

------------------------------------------------------------------------

# 54. Frontend State

Separate:

### Server state

-   profile;
-   requirements;
-   documents;
-   workflows;
-   calendar;
-   schemes;
-   standards;
-   updates;
-   assistant history.

### UI state

-   tabs;
-   filters;
-   modals;
-   expanded cards;
-   current onboarding step.

Do not duplicate regulatory truth in local UI state.

------------------------------------------------------------------------

# 55. Frontend Status Types

Use the same enums as backend:

``` ts
type ApplicabilityStatus =
  | "APPLICABLE"
  | "NOT_APPLICABLE"
  | "NEEDS_INFORMATION"
  | "CONFLICT_REVIEW"
  | "UNVERIFIED";

type WorkflowStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "UNDER_REVIEW"
  | "NEEDS_CORRECTION"
  | "READY"
  | "SUBMITTED"
  | "COMPLETED"
  | "OVERDUE"
  | "BLOCKED";

type DocumentStatus =
  | "NOT_UPLOADED"
  | "UPLOADED"
  | "PROCESSING"
  | "VERIFIED"
  | "ISSUE"
  | "NEEDS_REVIEW"
  | "EXPIRED"
  | "REPLACEMENT_REQUIRED";
```

------------------------------------------------------------------------

# 56. Frontend Screen Contract

Required screens:

``` text
Welcome
Business Profile
Products & Activities
Smart Questions
Regulatory Analysis
Initial Results
Dashboard
Compliance
Requirement Detail
Documents
Workflows
Calendar
Schemes & Benefits
Standards
Regulatory Updates
AI Assistant
Reports
Business Profile Editing
Settings
```

Every screen needs:

``` text
loading
success
empty
error
retry
```

The supplied UI reference is the visual direction: calm premium
enterprise SaaS, light surfaces, subtle blue/lavender accents, thin
borders, restrained semantic colors, whitespace, compact typography and
clear hierarchy. It is not a pixel-perfect implementation spec.

------------------------------------------------------------------------

# 57. UX Requirements

1.  Progressive disclosure.
2.  No irrelevant questions.
3.  Explain why decision-critical questions matter.
4.  Show derived values separately from user input.
5.  Distinguish all uncertainty states.
6.  Every actionable requirement has a next action.
7.  Blocked workflow steps explain the blocker.
8.  Evidence is accessible from requirement detail.
9.  AI pre-validation is visibly different from official approval.
10. Status cannot be conveyed only through color.

------------------------------------------------------------------------

# 58. Loading / Analysis UX

If asynchronous:

``` text
QUEUED
CONTEXT
CLASSIFICATION
RULE_EVALUATION
REQUIREMENTS
DOCUMENTS
WORKFLOWS
SCHEMES
STANDARDS
FINALIZING
COMPLETED
```

If analysis is fast/synchronous, show a simple analyzing state.

Never fabricate progress percentages.

------------------------------------------------------------------------

# 59. API Mocking

Frontend may develop before backend completion using:

``` text
frontend/mocks/
dashboard.json
requirements.json
requirement-detail.json
documents.json
workflows.json
calendar.json
schemes.json
standards.json
assistant.json
```

Mock shapes must match final API contracts.

------------------------------------------------------------------------

# 60. Security Requirements

## Authentication

Use secure session/token authentication.

## Authorization

Enforce business-level object access server-side.

## Documents

Private storage only; signed URLs or backend streaming.

## Secrets

Never commit:

``` text
API keys
database passwords
signing secrets
storage credentials
LLM credentials
```

Use environment variables/Azure secret management.

## Input safety

Validate:

-   enums;
-   UUIDs;
-   dates;
-   numeric ranges;
-   file size/type;
-   ownership.

## Rendering

Sanitize:

-   LLM output;
-   source content;
-   extracted document content.

Do not render arbitrary HTML.

## Prompt injection

Retrieved regulatory content is data, not executable instructions. It
cannot override authorization or system/domain rules.

------------------------------------------------------------------------

# 61. Data Minimization

Do not collect information unless it changes the decision architecture.

Avoid unnecessary:

-   bank details;
-   exact GPS;
-   DIN;
-   government identifiers;
-   sensitive personal information.

The 19-variable profile is a decision-oriented triage layer.

------------------------------------------------------------------------

# 62. Audit Events

Record:

``` text
PROFILE_CREATED
PROFILE_UPDATED
DECISION_RUN_CREATED
DECISION_RUN_COMPLETED
KNOWLEDGE_PUBLISHED
KNOWLEDGE_SUPERSEDED
RULE_REVIEWED
DOCUMENT_UPLOADED
DOCUMENT_VALIDATED
WORKFLOW_STARTED
WORKFLOW_STEP_UPDATED
ASSISTANT_QUERY
```

Audit model:

``` text
AuditEvent
- id
- actor
- action
- entity_type
- entity_id
- metadata
- timestamp
```

Do not log passwords, tokens, API keys or complete sensitive files.

------------------------------------------------------------------------

# 63. Idempotency and Concurrency

Use idempotency for costly mutation operations where duplicate requests
are possible:

-   analysis;
-   document upload;
-   validation;
-   workflow completion.

Use transactions/locking/version checks for concurrent:

-   profile updates;
-   workflow step updates;
-   document replacement;
-   analysis creation.

------------------------------------------------------------------------

# 64. Caching

Safe candidates:

-   published knowledge;
-   standards metadata;
-   source metadata;
-   dashboard read aggregation.

Decision cache keys must include:

``` text
business
profile_version
knowledge_version
evaluation_date
```

Never serve stale knowledge as current.

------------------------------------------------------------------------

# 65. Performance Targets

Engineering targets:

``` text
ordinary API P95: ~500 ms excluding external AI
deterministic analysis: ~2–5 seconds for demo profiles
AI/document processing: asynchronous where necessary
```

Targets may be tuned after real measurements.

------------------------------------------------------------------------

# 66. Database Indexing

At minimum index:

``` text
Business(owner_user_id)
BusinessProfileVersion(business_id, version)
DecisionRun(business_id, created_at)
RequirementInstance(business_id, applicability_status)
RuleVersion(rule_id, version)
RuleVersion(status, effective_from, effective_until)
Evidence(source_id, verification_status)
Document(business_id, status)
WorkflowInstance(business_id, status)
WorkflowStep(workflow_instance_id, sequence)
CalendarEvent(business_id, due_at)
RegulatoryUpdate(effective_date, status)
```

Use PostgreSQL constraints for unique IDs, foreign keys and version
integrity.

we are going to use supabase for this

------------------------------------------------------------------------

# 67. Date / Currency Rules

Store timestamps in UTC.

Display in user/business timezone.

Legal effective dates are date values unless the source specifies an
instant.

Use `Decimal`/numeric for:

-   turnover;
-   investment;
-   fees;
-   benefits;
-   thresholds.

Never use floating point for regulatory money comparisons.

Explicitly encode inclusive/exclusive thresholds with `GT/GTE/LT/LTE`.

------------------------------------------------------------------------

# 68. Current Regulatory Baseline Fixtures

The current project decisions require knowledge/test coverage for:

## FSSAI

Effective 1 April 2026:

``` text
up to ₹1.5 crore
→ Registration

> ₹1.5 crore to ₹50 crore
→ State License

> ₹50 crore
→ Central License
```

The rule must also account for applicable Kind of Business and must use
the current perpetual-validity framework rather than historical generic
1--5 year renewal assumptions.

## Labour

The engine must be date- and jurisdiction-aware. The Occupational
Safety, Health and Working Conditions Code, 2020 is enforced from 21
November 2025; historical 10/20-worker thresholds must not be
universally hardcoded.

## Trade

``` text
Product
→ HS/ITC(HS)
→ current DGFT policy
→ Free / Restricted / Prohibited / conditions
→ additional requirements
```

These are knowledge-pack facts, not application-code constants.

------------------------------------------------------------------------

# 69. Testing Architecture

``` text
Unit
 ↓
Rule tests
 ↓
Knowledge validation
 ↓
Integration
 ↓
API contract
 ↓
End-to-end
```

Critical rule test matrix:

``` text
normal positive
normal negative
threshold
threshold - 1
threshold + 1
exception
override
missing input
effective-date boundary
```

------------------------------------------------------------------------

# 70. Applicability Tests

Must test:

-   AST parsing;
-   every operator;
-   nested expressions;
-   TRUE/FALSE/UNKNOWN;
-   unknown propagation;
-   exception/override;
-   effective-date selection;
-   overlapping versions;
-   conflict detection;
-   evidence attachment;
-   explanation trace;
-   requirement deduplication.

------------------------------------------------------------------------

# 71. API Tests

Test:

-   auth;
-   business authorization;
-   validation;
-   status codes;
-   pagination;
-   object-level isolation;
-   error envelopes;
-   idempotency;
-   file upload;
-   workflow transitions.

------------------------------------------------------------------------

# 72. RAG Tests

Evaluation queries should include:

-   exact standard number;
-   product-to-standard;
-   QCO;
-   requirement explanation;
-   source lookup;
-   ambiguous question;
-   unsupported question;
-   conflicting evidence.

Pass criteria:

``` text
correct evidence
+
valid citation
+
correct verification status
+
no fabricated claim
```

------------------------------------------------------------------------

# 73. Document Tests

Test:

``` text
valid file
unsupported type
oversized file
OCR failure
wrong document type
field mismatch
expiry
replacement
needs review
```

------------------------------------------------------------------------

# 74. Workflow Tests

Test:

``` text
valid transition
invalid transition
dependency blocked
dependency unlocked
completion
overdue
correction/reset
```

------------------------------------------------------------------------

# 75. End-to-End Golden Test

``` text
create user
→ create Gujarat Food business
→ save profile
→ product description
→ adaptive questions
→ analysis
→ requirements
→ explanation
→ evidence
→ document requirement
→ upload document
→ validation
→ workflow
→ complete step
→ calendar
→ assistant query
→ source-backed response
```

This is the primary demo acceptance test.

------------------------------------------------------------------------

# 76. Scenario Fixtures

Create:

``` text
fixture_gujarat_food
fixture_telangana_electronics
fixture_gujarat_trade
fixture_tamil_nadu_auto
fixture_karnataka_esdm
```

Each fixture contains:

-   profile;
-   expected scenario;
-   knowledge pack;
-   expected key requirements;
-   documents;
-   workflows;
-   evidence.

------------------------------------------------------------------------

# 77. Knowledge Seeding

Recommended commands:

``` bash
python manage.py migrate
python manage.py seed_knowledge
python manage.py seed_demo
```

`seed_knowledge` must:

1.  validate schemas;
2.  validate references;
3.  load sources;
4.  load evidence;
5.  load requirements;
6.  load rules;
7.  load workflows;
8.  load documents;
9.  load schemes/standards;
10. run tests;
11. publish only valid records.

Failed seeding must not leave invalid partial production knowledge.

------------------------------------------------------------------------

# 78. CI/CD

Pipeline:

``` text
push
 ↓
lint
 ↓
static/type checks
 ↓
unit tests
 ↓
rule tests
 ↓
knowledge validation
 ↓
integration tests
 ↓
build
 ↓
deploy
```

Deployment must fail if critical knowledge/rule tests fail.

------------------------------------------------------------------------

# 79. Deployment

Azure-compatible topology:

``` text
HTTPS
 ↓
Frontend hosting
 ↓
Django API
 ├── PostgreSQL + pgvector
 ├── private Blob Storage
 ├── optional Redis
 └── AI/OCR providers
```

All external credentials stay server-side.

Environment separation:

``` text
development
demo/staging
production
```

For the hackathon, development + demo/staging are mandatory.

------------------------------------------------------------------------

# 80. Health Endpoints

``` text
GET /health
GET /health/ready
```

Readiness may verify:

-   database;
-   storage;
-   knowledge availability.

Optional AI provider failure should not make the entire application
unhealthy.

------------------------------------------------------------------------

# 81. Backup / Recovery

Maintain:

-   database backup/snapshot;
-   reproducible knowledge seed;
-   deterministic demo fixtures;
-   known-good deployment version.

Before the final demo:

``` text
backup
→ deploy
→ seed
→ run golden test
```

------------------------------------------------------------------------

# 82. Development Phases

## Task 1 — Foundation

Django project, supabase database, business/profile models and base APIs.

## Task 2 — Knowledge & Applicability Core

Source/evidence models, knowledge packs, AST, evaluator, versioning, traces and tests.

## Task 3 — Dynamic Onboarding → Analysis

Activity classification, adaptive questions, analysis and initial results.

## Task 4 — Operational Compliance

Requirements, documents, AI pre-validation, workflows and calendar.

## Task 5 — Intelligence Layer

Schemes, standards, regulatory updates and RAG assistant.

## Task 6 — UI Integration

Frontend screens wired to live API contracts.

## Task 7 — Accuracy, Polish & Azure

Regression/benchmark testing, demo polish, smoke tests and deployment.

Update `PROJECT_EXECUTION.md` after every major task.

# 83. Regression Fixture Technical Requirements

## S1 --- Gujarat Food Fixture

Demonstrate:

``` text
food activity
→ current FSSAI logic
→ state/environment context
→ documents
→ workflow
→ deadlines
→ schemes
```

## S2 --- Telangana Electronics Fixture

Demonstrate:

``` text
smart meter
→ product understanding
→ BIS/standard/QCO knowledge
→ testing/certification
→ scheme logic
```

## S3 --- Gujarat Trade Fixture

Demonstrate:

``` text
export intent
→ HS lookup
→ DGFT policy
→ IEC/dependency
→ downstream workflow
```

## S4 --- Tamil Nadu Auto Fixture

Demonstrate:

``` text
manufacturing
→ workforce/infrastructure
→ environment/safety
→ state-specific rules
```

## S5 --- Karnataka ESDM Fixture

Demonstrate:

``` text
PCB assembly
→ Karnataka zone
→ investment
→ incentive logic
→ indicative benefit
```

------------------------------------------------------------------------

# 84. Critical Invariants

The following must remain true:

1.  Applicability is deterministic and evidence-backed.
2.  UNKNOWN never becomes FALSE.
3.  Unverified/conflicting knowledge never becomes a definitive legal
    result.
4.  Published rules are versioned.
5.  Current effective rules are selected by date.
6.  Every material result has a trace.
7.  Every published regulatory fact has authoritative evidence.
8.  Requirement, workflow and document status are independent.
9.  Workflow dependencies are not regulatory dependencies.
10. Rule thresholds are knowledge data.
11. Frontend does not implement regulatory logic.
12. Dashboard is not a source of truth.
13. AI does not invent legal conclusions.
14. Five scenarios use the same engine.
15. Historical decisions remain reproducible.

------------------------------------------------------------------------

# 85. AI Coding Agent Rules

An AI coding agent receiving `PRD.md` + `BRD.md` + `TRD.md` must:

-   read all three before coding;
-   implement the domain model first;
-   implement rules as data;
-   never hardcode individual regulatory thresholds;
-   preserve the status enums;
-   preserve provenance;
-   write tests with each critical rule;
-   avoid scenario-specific evaluator branches;
-   keep AI orchestration separate from domain logic;
-   keep external credentials server-side;
-   update migrations with schema changes;
-   expose stable REST contracts;
-   never fabricate regulatory data to make a screen look complete.

If a required regulatory fact is absent from the knowledge pack, the
agent should create a placeholder data contract or `UNVERIFIED` state
rather than inventing the fact.

------------------------------------------------------------------------

# 86. Frontend/Backend Contract

Frontend receives:

``` json
{
  "applicability_status": "APPLICABLE",
  "workflow_status": "NOT_STARTED",
  "document_status": "NOT_UPLOADED"
}
```

These must remain three separate dimensions.

Requirement detail should receive enough information to render:

``` text
what
why
evidence
documents
fee if verified
validity if verified
deadline if verified
next action
workflow
```

No frontend component should derive legal applicability from text.

------------------------------------------------------------------------

# 87. Demo Reliability

Before demo:

``` text
[ ] clean deployment tested
[ ] database seeded
[ ] all knowledge packs validated
[ ] critical rule tests pass
[ ] official source links checked
[ ] AI credentials tested
[ ] deterministic fallback checked
[ ] document upload checked
[ ] workflow dependency checked
[ ] calendar checked
[ ] assistant citations checked
[ ] Gujarat Food golden path passed
[ ] no fabricated regulatory values
```

------------------------------------------------------------------------

# 88. Definition of Technical Done

The MVP backend is technically ready when:

``` text
[✓] Django runs
[✓] PostgreSQL works
[✓] migrations work
[✓] knowledge packs validate
[✓] rules evaluate
[✓] UNKNOWN works
[✓] versions work
[✓] evidence works
[✓] traces persist
[✓] requirements resolve
[✓] documents upload
[✓] validation works
[✓] workflows instantiate
[✓] dependencies work
[✓] calendar works
[✓] schemes resolve
[✓] standards retrieval works
[✓] assistant is source-grounded
[✓] dashboard aggregates data
[✓] authorization works
[✓] scenario fixtures load
[✓] golden path passes
[✓] deployment works
```

------------------------------------------------------------------------

# 89. Final Technical Architecture

``` text
                    BUSINESS PROFILE
                           │
                           ▼
                 ┌──────────────────┐
                 │ BUSINESS CONTEXT │
                 └────────┬─────────┘
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
      DERIVED / LOOKUP            RULE ENGINE
             │                         │
             │                  AST + UNKNOWN
             │                         │
             └────────────┬────────────┘
                          ▼
                    DECISION RUN
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         REQUIREMENT    TRACE       EVIDENCE
              │           │           │
              ▼           │           ▼
          DOCUMENT        │      OFFICIAL SOURCE
              │           │
              ▼           │
       DOCUMENT AI        │
              │           │
              └─────┬─────┘
                    ▼
                 WORKFLOW
                    │
                    ▼
                 CALENDAR
                    │
             ┌──────┴──────┐
             ▼             ▼
          SCHEMES       STANDARDS
                           │
                           ▼
                       RAG / AI
                           │
                           ▼
                     AI ASSISTANT
```

The core trust chain is:

``` text
Decision
 ↓
Rule Version
 ↓
Explanation Trace
 ↓
Evidence
 ↓
Authoritative Source
```

The core execution chain is:

``` text
Business
 ↓
Applicability
 ↓
Requirement
 ↓
Document
 ↓
Workflow
 ↓
Deadline
 ↓
Action
```

------------------------------------------------------------------------

# 90. Final Engineering Principle

Do not build ComplyWise as:

``` text
dashboard + chatbot + checklist
```

Build it as:

``` text
context
→ deterministic decision
→ explanation
→ evidence
→ requirement
→ document
→ workflow
→ deadline
→ action
```

AI surrounds and enriches this chain through classification, retrieval,
extraction and explanation.

The deterministic, evidence-backed compliance engine is the technical
core.

**End of TRD.md**


---

## Document Control Note — v2.0

This version supersedes the earlier implementation framing that treated the five scenarios as the product scope. The technical architecture is now explicitly **dynamic and generalized**, with a first-class source acquisition → verification → publication pipeline. The five scenarios are preserved as regression/demo fixtures.
