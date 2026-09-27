# ComplyWise — Upgrade Instruction

## Purpose

This document is the implementation contract for the current ComplyWise codebase.

The objective is to stabilize the existing platform, eliminate cross-company data leakage/stale-state bugs, fix onboarding/question evaluation, make the dashboard and all user/admin sections dynamically tenant/assessment scoped, add safe fallback behavior when deterministic compliance validation is unavailable, and integrate **Crawlee** as the open-source web acquisition layer.

Do **not** rewrite the product from scratch.
Do **not** redesign the product unnecessarily.
Do **not** introduce IBM Docling, Zyte, Firecrawl, or another scraping platform in this task.

For this upgrade, use **Crawlee only** for the web acquisition layer. Keep the acquisition layer behind an abstraction so additional providers can be added later without changing Engine 1, Engine 2, CIR, Engine 3, or the UI.

The current target architecture remains:

USER FACTS
→ BUSINESS UNDERSTANDING
→ CANONICAL BUSINESS FACTS
→ ADAPTIVE QUESTIONS
→ PROFILE VERSION
→ ENGINE 1
→ HARD FILTERING
→ HYBRID RETRIEVAL
→ LIVE WEB ACQUISITION
→ VERIFIED EVIDENCE
→ ENGINE 2
→ CIR
→ SCHEME / STANDARDS MATCHING
→ ENGINE 3
→ FINAL GROUNDING VALIDATOR
→ USER REPORT / WORKFLOW

Golden rule:

> RAG retrieves. Rules decide. LLM explains.

The existing research architecture requires a decoupled Web Acquisition Abstraction Layer with a replaceable crawler, evidence provenance, source versioning, and downstream integration. For this iteration, Crawlee is the primary acquisition implementation.

---

# 1. EXECUTION MODE

You are working as a senior staff engineer and debugging lead on an existing production-style compliance platform.

The codebase is already large and partially working.

Your job is to:

1. inspect the actual implementation;
2. reproduce bugs with unit/integration tests and direct code inspection;
3. identify root causes;
4. fix the root causes generically;
5. add regression tests;
6. run basic automated tests;
7. produce an audit report;
8. leave browser/UI testing for the human operator.

## Absolutely do not do

- No Playwright end-to-end testing.
- No automated browser testing.
- No screenshot-based UI testing.
- No one-off company-specific `if/else` fixes.
- No hardcoding NorthStar-specific behavior.
- No hardcoding Storyloom-specific behavior.
- No hardcoding a particular state, sector, license, scheme, document, or regulation.
- No deleting historical assessment data just to make the UI look correct.
- No silently changing compliance decisions from UNKNOWN to FALSE.
- No changing legal applicability logic merely to make a test pass.
- No replacing deterministic Engine 2 with an LLM.
- No allowing the LLM to fabricate legally applicable licenses, thresholds, deadlines, penalties, or requirements.

---

# 2. REQUIRED WORKING STYLE

Before changing code:

1. inventory the repository;
2. identify backend, frontend, worker, database, schema/migration, prompt, retrieval, compliance, workflow, document, scheme, standards, calendar, and admin modules;
3. identify the current source of truth for:
   - authenticated user;
   - business/company;
   - assessment;
   - business profile version;
   - compliance records/CIR;
   - documents;
   - schemes;
   - standards;
   - workflows;
   - calendar/deadlines;
   - admin review records;
4. trace the request/data path for each bug before patching it;
5. record findings in an audit ledger.

Use a root-cause-first workflow.

Do not make unrelated refactors while debugging.

---

# 3. AGENT PLAN

You may use multiple coding agents in the CLI if supported.

Use this division of work:

## Agent A — Repository / Data-Flow Auditor

Inspect:

- models/schema;
- API routes;
- service layer;
- repository/data access layer;
- auth/session handling;
- assessment lifecycle;
- business profile lifecycle;
- frontend query/state management;
- admin routes;
- workflow/document/calendar persistence;
- prompts and LLM orchestration.

Output:

- dependency map;
- suspected root causes;
- tenant/assessment scoping risks;
- list of hard-coded data;
- list of duplicate/ambiguous persistence paths.

Do not make broad changes until the map is complete.

## Agent B — Onboarding / Decision Engine Auditor

Focus on:

- business description parsing;
- initial form;
- canonical facts;
- adaptive questions;
- question generation;
- duplicate question detection;
- answered-fact reuse;
- custom answer handling;
- Engine 1/2 inputs;
- fallback behavior when deterministic evaluation fails.

## Agent C — User Workspace Auditor

Focus on:

- dashboard;
- compliance;
- documents;
- schemes;
- standards;
- workflows;
- calendar;
- business profile/assessment switching;
- stale data and cross-company data leakage.

## Agent D — Admin Auditor

Focus on:

- admin authentication/authorization;
- company/assessment selection;
- document review;
- compliance requirement disposition;
- workflows;
- deadlines;
- notifications;
- admin/user state synchronization;
- cross-company leakage.

## Agent E — Crawlee Integration Engineer

Implement only the acquisition abstraction + Crawlee adapter.

Do not change legal reasoning logic.

## Agent F — Test / Regression Engineer

Create generic regression tests covering all identified failures.

No browser tests.

The lead agent merges the findings and resolves conflicts.

If multi-agent execution creates duplicate changes or contradictory implementations, the lead agent must reconcile them before finalizing.

---

# 4. TENANCY AND ASSESSMENT ISOLATION — CRITICAL

This is the highest-priority bug class.

The current symptoms strongly suggest that some pages/services are fetching records without consistently filtering by the current business/assessment context.

The system must establish one canonical execution context:

```text
Authenticated User
    ↓
Selected Business Profile
    ↓
Selected Assessment
    ↓
Profile Version
    ↓
Derived Compliance / Documents / Schemes / Standards / Workflows / Calendar
```

Every user-facing read must be scoped to the current context.

Every write must record the same context.

Every background job must carry the context explicitly.

## Required context object

Create or reuse a single structured context similar to:

```text
WorkspaceContext
- user_id
- business_id
- assessment_id
- profile_version_id
- assessment_version_id if applicable
```

Do not rely on a mutable global variable for current business or assessment.

Do not infer current assessment from “latest row” unless that is an explicit, tested business rule.

## Repository/data-access rule

Every query for user-owned operational data must be scoped by the correct parent identifiers.

Examples:

- compliance requirements → assessment_id;
- CIRs → assessment_id + requirement/record identity;
- documents → business_id + assessment_id where documents are assessment-specific;
- workflows → assessment_id;
- calendar/deadlines → assessment_id;
- schemes → assessment_id;
- standards → assessment_id.

If some resource is genuinely business-level rather than assessment-level, document that distinction and scope it accordingly.

Do not use a generic `get_all()` or `latest()` query in a user workspace when the current context is known.

## Required safeguards

Add tests proving:

1. Company A cannot see Company B documents.
2. Assessment A cannot see Assessment B requirements.
3. Opening a new assessment does not mutate the previous assessment.
4. Switching business correctly switches all dependent data.
5. Switching assessment correctly switches all dependent data.
6. Empty assessment correctly shows empty state rather than previous data.
7. Direct API calls with another assessment_id are rejected.

Prefer backend authorization/data filtering to frontend-only filtering.

---

# 5. FIX THE MULTIPLE-ASSESSMENT BUG

The user reports seeing two assessments even though only one was initiated.

Investigate whether the duplicate is caused by:

- assessment row created twice;
- onboarding submit retried and not idempotent;
- frontend automatically creating assessment on page load;
- backend creating assessment both in onboarding and analysis jobs;
- missing uniqueness constraint;
- duplicate seed logic;
- stale local storage/current-assessment state;
- asynchronous job creating a second empty assessment;
- assessment/version being modeled as two different concepts but exposed as two assessments.

Do not hide duplicate rows in the UI.

Identify the actual source.

## Add idempotency

Assessment creation must be idempotent for the onboarding operation.

A repeated request with the same operation key should not create a second assessment.

Use a database uniqueness constraint where appropriate.

Do not use an application-only check as the sole protection against duplicates.

## Empty duplicate assessment

The reported second assessment has:

- 0 requirements;
- 0 standards;
- 0 workflows;
- 0 documents.

Trace whether this is:

- a real duplicate assessment;
- a failed assessment version;
- an orphaned row;
- a preview/draft row;
- a race condition;
- a UI display bug.

Fix the lifecycle rather than just hiding the row.

Preserve historical data unless there is a safe migration/cleanup path.

---

# 6. ONBOARDING QUESTION ENGINE — ROOT CAUSE FIX

The user should NOT have to repeat facts already supplied in the initial business description/form.

The system must follow:

```text
Initial description
+
Initial form
+
Previous answered questions
+
Existing profile facts
+
Existing uploaded documents where explicitly trusted
    ↓
Canonical Business Facts
    ↓
Missing Decision-Critical Facts
    ↓
Adaptive Questions
```

## Canonical fact reuse

Before generating any question:

1. normalize all existing profile facts;
2. map equivalent fields and synonyms;
3. map free-text answers into canonical facts where confidence is sufficient;
4. check whether the decision-critical fact is already known;
5. only ask the question if the required fact remains UNKNOWN or conflicts with existing facts.

Example:

If the initial profile already states:

- 118 workers;
- contract workers are used;
- cold-storage business;
- refrigerated transport;
- food products handled;
- pharmaceutical products handled;
- existing licenses known/unknown;

then an onboarding question asking again “How many workers do you have?” must be suppressed.

A question asking “Do you use contract labour?” must also be suppressed if the fact is already present.

## Important compliance principle

The system is supposed to determine applicability.

Therefore the user should NOT be asked to know the answer to the regulatory question itself.

Bad question:

> “Do you need an FCI/FCC license?”

Correct style:

> “Do you store or transport food products that are covered by regulated food-storage or food-business activities? Please describe the food products you handle.”

The system then uses verified rules/evidence to determine whether a license/registration is applicable.

Do not ask users to self-diagnose legal applicability.

## Question generation contract

Each question must have:

- `question_id`;
- `fact_key` or fact keys;
- `reason`;
- `required_for_rules`;
- `source_requirement_ids` if known;
- answer type;
- allowed options;
- `allow_custom_answer`;
- priority;
- dependencies;
- suppression conditions.

Example conceptual structure:

```text
Question
  ↓
Collects: refrigeration.refrigerant_type
  ↓
Needed by: requirement R123
  ↓
Suppressed when: canonical fact is known
```

## Ask only decision-critical questions

Do not expose all 15 questions if only 5–6 facts are required for deterministic decisions.

But do not silently drop questions because of an arbitrary maximum count.

The rule should be:

> Ask the minimum set of highest-value unresolved facts needed to resolve the current compliance decision set.

This requires a decision-criticality calculation, not `questions[:6]`.

## Duplicate-question detection

Before returning a question set:

- normalize wording;
- compare fact keys;
- compare semantic intent;
- compare previously answered facts;
- remove duplicates;
- preserve dependencies.

---

# 7. CUSTOM ANSWERS MUST WORK EVERYWHERE

The user explicitly needs to provide a custom answer when predefined options do not fit.

This must work consistently across:

- onboarding;
- compliance questions;
- schemes;
- documents;
- workflows;
- calendars;
- admin queries where relevant.

## Frontend behavior

When the user selects `Other` or custom-answer mode:

- show text input;
- bind input to form state;
- validate non-empty custom answer if required;
- include it in submission payload;
- do not lose it when moving to the next question.

## Backend behavior

Normalize all question submissions into a common model:

```text
answer_type
selected_option
custom_text
normalized_value
raw_value
question_id
assessment_id
profile_version_id
```

The backend must accept custom answers even when the answer is not one of the predefined option values.

The custom answer should update the canonical fact store when appropriate.

The assessment/profile version must be incremented or updated deterministically.

## Critical regression test

Create a test where:

1. option set is `[A, B, C, Other]`;
2. user selects Other;
3. user enters custom text;
4. submits Next;
5. backend receives text;
6. canonical fact updates;
7. next question calculation sees the new fact;
8. UI/API returns the new state.

Repeat this test in the schemes flow as specifically reported by the user.

---

# 8. BUSINESS PROFILE / ASSESSMENT UI

The business profile area must support:

- create business;
- open business;
- switch business;
- edit business;
- create assessment;
- switch assessment;
- delete/archive business profile;
- delete/archive assessment according to lifecycle rules.

## Delete business profile

Add a delete/archive action.

Prefer soft-delete/archive if the database has audit/history requirements.

The UI must make it clear whether the action is:

- archive;
- delete;
- permanently delete.

Do not perform destructive deletion without checking dependent records and foreign keys.

Define behavior for:

- documents;
- compliance records;
- workflow records;
- calendar records;
- admin reviews.

Do not delete shared reference knowledge.

---

# 9. DASHBOARD — REMOVE HARDCODED CONTENT

The dashboard currently contains hard-coded Monday/Wednesday/Friday/Saturday compliance activity and hard-coded documents/actions/statuses.

Remove all hard-coded company-specific dashboard content.

Every dashboard element must come from backend data or deterministic computed aggregates.

Examples:

- compliance activity → activity events for current assessment;
- documents → documents for current assessment/business;
- compliance status → aggregate of CIR/requirements for current assessment;
- actions → current actionable workflow items;
- upcoming deadlines → current assessment calendar;
- recent activity → actual persisted events.

If there is no data, return a real empty state:

- “No compliance activity yet”;
- “No documents uploaded”;
- “No actions pending”.

Never display demo data after onboarding unless explicitly in a demo mode.

If a demo mode exists, gate it behind an explicit feature flag and never use it for real user accounts.

---

# 10. COMPLIANCE SECTION — FIX STALE COMPANY DATA

The user reports seeing the previous company's compliance results.

Trace the complete path:

```text
Current business/assessment selection
→ frontend route/state
→ API request
→ backend authorization
→ assessment lookup
→ CIR retrieval
→ response serialization
→ frontend query key
→ cache/storage
→ rendered component
```

Check for:

- missing assessment_id query parameter;
- stale React/query cache key;
- global Redux/Zustand/store state;
- localStorage containing previous company ID;
- backend defaulting to latest assessment;
- missing owner filter;
- shared singleton service state;
- incorrect API cache key;
- background job writing into the wrong assessment.

## Cache rule

Any client-side cache/query for company-specific or assessment-specific data must include the relevant context key.

Conceptually:

```text
compliance:{business_id}:{assessment_id}
documents:{business_id}:{assessment_id}
workflows:{business_id}:{assessment_id}
calendar:{business_id}:{assessment_id}
schemes:{business_id}:{assessment_id}
standards:{business_id}:{assessment_id}
```

Do not use generic keys such as:

```text
compliance
latestCompliance
requirements
```

when multiple businesses exist.

Invalidate/refetch on context switch.

---

# 11. DOCUMENT SECTION — FIX STALE COMPANY DATA

Apply the same isolation rules to documents.

A document must have clear ownership and scope.

At minimum determine whether it is:

- business-level;
- assessment-level;
- workflow-level;
- requirement-level.

The user should never see another company's documents because of:

- unfiltered database query;
- old frontend state;
- cached API response;
- “latest uploaded document” query;
- shared global store.

Add backend tests for cross-company document isolation.

---

# 12. SCHEMES AND STANDARDS

Keep schemes and standards separate from legal applicability.

Use:

```text
Regulatory requirement
≠
Government scheme
≠
Industry standard
```

A scheme match must not become a mandatory compliance requirement merely because it was retrieved.

A standard must not become a statutory obligation unless a validated legal rule establishes that linkage.

The existing architecture explicitly keeps Scheme Matcher and Standards Matcher separate from CIR before Engine 3 explanation.

Fix any UI or backend logic that merges these categories.

---

# 13. FIREWALL / DETERMINISTIC GATE FAILURE FALLBACK

There is a current failure mode where the “firewall”/deterministic compliance gate prevents a useful result from reaching the user.

Do not remove the deterministic safety boundary.

Instead implement a layered result contract.

## State A — VERIFIED

Deterministic engine has sufficient facts + verified evidence.

Return:

```text
VERIFIED
```

The result can be presented as an applicable/not-applicable decision depending on Engine 2.

## State B — NEEDS_INFORMATION

The system knows what fact is missing.

Return:

```text
NEEDS_INFORMATION
```

Generate an adaptive question.

## State C — UNVERIFIED / FALLBACK

The deterministic path cannot confidently resolve the issue because retrieval/evidence/firewall validation failed.

The LLM may provide a **preliminary informational analysis**, but it must be visibly labeled:

```text
PRELIMINARY / UNVERIFIED
```

It must:

- use only available evidence;
- state what is known;
- state what is missing;
- avoid asserting legal applicability as verified;
- avoid inventing thresholds, penalties, license numbers, authorities, deadlines, or effective dates;
- provide a source list when available;
- recommend the exact missing evidence/fact needed for deterministic validation.

Do not silently return an empty answer when the firewall fails.

Do not let the fallback override Engine 2.

The fallback is an explanation/discovery result, not a replacement legal decision.

## State D — CONFLICT

If sources disagree:

```text
CONFLICT_REVIEW
```

The user should see the conflict rather than an invented resolution.

---

# 14. STRUCTURED BACKEND PROMPTING

The current backend prompt is reportedly not reasoning correctly.

Do not attempt to solve this with one giant prompt.

Split the responsibilities:

### Prompt 1 — Business Fact Extraction

Input:

- initial business description;
- form answers;
- prior answers.

Output only structured canonical facts.

### Prompt 2 — Missing Fact Analysis

Input:

- canonical facts;
- candidate requirements;
- conditions/AST dependencies.

Output:

- missing decision-critical facts;
- question candidates;
- suppression reasons.

### Prompt 3 — Retrieval Query Expansion

Input:

- canonical facts;
- requirement concepts.

Output:

- retrieval terms/synonyms/taxonomy mappings.

### Prompt 4 — Explanation

Input ONLY:

- CIR;
- validated evidence;
- validated scheme/standard matches.

Output:

- user-friendly explanation.

This ensures Engine 3 cannot silently become a second applicability engine.

---

# 15. LICENCE / REGISTRATION QUESTIONS

Users come to ComplyWise precisely because they do not know which license is needed.

Therefore the system should never phrase onboarding as if the user already knows the answer.

Do not ask:

> “Is FCC license applicable?”

Instead collect facts from which applicability can be determined.

For example:

> “What categories of goods do you store or transport?”

> “Do you store food products intended for sale or distribution?”

> “Do you store pharmaceutical products?”

> “Do you operate your own refrigerated vehicles?”

> “Do you use contract workers?”

The compliance engine then evaluates the regulatory rules against those facts.

Where an exact license name is uncertain, the question engine should ask the underlying factual question rather than guessing a license acronym.

---

# 16. CRAWLEE INTEGRATION

Integrate **Crawlee only** in this upgrade.

Do not integrate Docling or Zyte yet.

## Architectural requirement

Create a replaceable interface such as:

```text
BaseWebAcquisitionLayer

fetch_page(url, context)
crawl(seed_url, context)
fetch_document(url, context)
```

Implement:

```text
CrawleeAcquisitionProvider
```

Do not leak Crawlee-specific objects into the rest of the codebase.

The downstream system should receive a normalized evidence contract.

## Minimum evidence contract

Include where available:

- source URL;
- resolved URL;
- domain;
- title;
- authority/domain metadata;
- HTTP status;
- retrieved_at;
- raw HTML or normalized HTML/text reference;
- content format;
- content hash;
- acquisition engine;
- extraction timestamp;
- links discovered;
- crawl metadata.

Do not pretend to know publication/effective/currentness status solely from scraping. Those belong to validation.

## Crawlee routing

For this phase:

- use lightweight HTTP crawling when sufficient;
- use PlaywrightCrawler through Crawlee when JavaScript/browser rendering is actually required;
- keep the choice behind the acquisition adapter/router;
- do not add Zyte fallback yet;
- do not add a browser-agent framework.

## Required integration behavior

Crawlee acquisition must feed:

```text
Live Source Discovery
→ Web Source Validator
→ Context Blender
→ Evidence Pack
```

It must not bypass:

- Source Registry;
- source validation;
- currentness checks;
- evidence binding;
- Engine 2.

Do not let Crawlee output directly become a legal decision.

---

# 17. ADMIN PANEL AUDIT

Perform a full backend-first audit of the admin side.

Verify:

### Authentication

- admins can access only admin endpoints;
- normal users cannot access admin endpoints;
- company/assessment scope is respected.

### Company / Assessment selection

- admin sees correct business;
- admin sees correct assessment;
- switching assessment refreshes all related records;
- no stale previous-company data.

### Document review

Verify lifecycle:

```text
Upload
→ AI precheck
→ Human review
→ Approve / Query / Reject
→ User sees query
→ User uploads new version
→ Same case continues
```

### Requirement disposition

Maintain separation between:

```text
System applicability
```

and

```text
Admin disposition
```

Admin action must not overwrite the raw Engine 2 decision.

### Workflow

Verify status transitions and ownership.

### Calendar

Verify that deadlines are attached to the correct assessment/requirement and do not leak across companies.

### Notifications

Verify notification records are scoped correctly.

---

# 18. WORKFLOW AUDIT

Trace the workflow state machine from database to UI.

Ensure generic workflow primitives remain generic.

Verify:

- case status;
- step status;
- actor type;
- review type;
- transition validation;
- retry behavior;
- failure behavior;
- duplicate step creation;
- idempotent worker jobs.

Do not create company-specific workflow branches.

---

# 19. CALENDAR AUDIT

Every deadline must identify:

- assessment_id;
- source requirement/CIR where applicable;
- source rule;
- calculation basis;
- effective period;
- due date;
- whether system-derived or admin-defined.

Admin-created deadlines should be explicitly labeled `ADMIN_DEFINED`.

System-derived deadlines must remain traceable to a rule/evidence source.

Ensure changing the active business/assessment cannot display another company's deadlines.

---

# 20. DATA CONSISTENCY RULES

Create one canonical identity path:

```text
User
 → Business
 → Assessment
 → Profile Version
 → Result Set / CIR
```

Everything derived from the assessment must reference it.

When generating a new result set, record:

- business_id;
- assessment_id;
- profile_version_id;
- knowledge_version/source snapshot references;
- generated_at;
- engine version where applicable.

This is necessary for reproducibility.

---

# 21. BACKGROUND JOB SAFETY

Inspect Celery/Redis/background jobs if present.

Every job payload must explicitly include the relevant IDs.

Never rely on a worker-global “current company”.

Bad:

```text
process_compliance()
```

Better:

```text
process_compliance(
    user_id,
    business_id,
    assessment_id,
    profile_version_id
)
```

Likewise for:

- documents;
- OCR/AI precheck;
- scheme matching;
- workflow transitions;
- calendar generation;
- notifications.

Make jobs idempotent where retries can create duplicates.

---

# 22. FRONTEND STATE / CACHE AUDIT

Inspect:

- React Query / TanStack Query;
- Redux;
- Zustand;
- Context;
- localStorage;
- sessionStorage;
- URL parameters;
- router state.

Find any place where company or assessment selection is stored independently in multiple locations.

Establish one authoritative current-context source.

On context change:

1. update current context;
2. invalidate scoped queries;
3. clear stale derived state;
4. refetch current context data.

Do not require a full page reload as the normal fix.

---

# 23. API CONTRACT AUDIT

For each user-visible section, verify the request and response contract.

Minimum endpoints/areas:

- business profiles;
- assessments;
- onboarding/questions;
- compliance;
- documents;
- schemes;
- standards;
- workflows;
- calendar;
- dashboard;
- admin review.

For each endpoint record:

- authentication required;
- authorization rule;
- context parameters;
- server-side filtering;
- response shape;
- error behavior;
- empty-state behavior.

Look specifically for endpoints that return globally aggregated data when the UI expects scoped data.

---

# 24. DATABASE / MIGRATION AUDIT

Inspect the actual schema.

Verify foreign keys and uniqueness constraints for:

- businesses;
- assessments;
- profile versions;
- requirements;
- CIR;
- documents;
- workflows;
- deadlines;
- schemes;
- standards;
- notifications;
- admin reviews.

Add constraints where an invalid state can otherwise be created.

Do not perform destructive schema migrations without a migration plan.

If duplicate assessments already exist, write a safe migration/reconciliation script only after determining the actual cause.

Do not casually delete production-like data.

---

# 25. TESTING REQUIREMENTS

Run basic automated testing only.

Do NOT run:

- Playwright tests;
- browser tests;
- automated visual tests;
- Selenium tests.

Run:

- unit tests;
- service tests;
- API integration tests if they do not require a browser;
- database tests;
- question-engine tests;
- repository isolation tests;
- workflow tests;
- document-service tests;
- scheme/standards tests;
- Crawlee adapter unit tests with network calls mocked where practical.

## Minimum regression tests

Create tests for:

1. Existing business facts suppress duplicate onboarding questions.
2. Initial form facts are preserved into canonical facts.
3. Custom answer is persisted.
4. Custom answer changes downstream question generation.
5. Only decision-critical questions are returned.
6. Company A cannot read Company B compliance.
7. Company A cannot read Company B documents.
8. Assessment A cannot read Assessment B workflows.
9. Assessment creation is idempotent.
10. Duplicate assessment cannot be silently created.
11. Dashboard data comes from current assessment.
12. Empty current assessment shows empty state.
13. Business switching invalidates old data.
14. Assessment switching invalidates old data.
15. Scheme results are not converted into compliance requirements.
16. Standards results remain separate.
17. Admin disposition does not overwrite Engine 2 applicability.
18. Background jobs preserve business/assessment context.
19. Firewall/deterministic failure returns a labeled fallback result rather than an empty response.
20. Fallback result cannot become a verified legal decision.
21. Crawlee acquisition returns normalized evidence metadata.
22. Crawlee failures return structured errors.
23. Historical evidence remains reproducible.
24. Source/evidence references remain bound to the correct assessment.

---

# 26. OBSERVABILITY / DEBUG MODE

Add or improve structured logging around context propagation.

For every major request/job, log non-sensitive identifiers such as:

```text
request_id
user_id
business_id
assessment_id
profile_version_id
operation
status
```

For compliance evaluation additionally log:

```text
knowledge_version
engine_version
result_status
```

Do not log sensitive document contents, secrets, API keys, or personal data unnecessarily.

This will make stale-data and cross-assessment bugs much easier to diagnose.

---

# 27. ACCEPTANCE CRITERIA

The implementation is not complete until all of the following are true.

## Onboarding

- Existing initial facts are not asked again.
- Only unresolved decision-critical questions are shown.
- Custom answers work.
- Question results update canonical facts.
- Re-running onboarding does not duplicate facts or assessments.

## Dashboard

- No hard-coded fake activity for real users.
- Dashboard changes when business/assessment changes.
- Empty state works.

## Compliance

- Current company's compliance is displayed.
- Previous company's compliance cannot leak into the current company.
- Current assessment context is explicit.
- Fallback result is available when deterministic validation fails, with `PRELIMINARY / UNVERIFIED` labeling.

## Documents

- Only current business/assessment documents are shown.
- Previous-company documents cannot appear.
- New document uploads attach to the current context.

## Schemes / Standards

- Current-context data only.
- Correct separation from compliance.
- Custom answers work where applicable.

## Workflows / Calendar

- Current assessment only.
- Correct statuses.
- Correct deadlines.
- Correct admin/user synchronization.

## Business Profiles / Assessments

- Correct number of assessments.
- No accidental empty duplicate assessment.
- Business deletion/archive action exists.
- Context switching is reliable.

## Admin

- Correct company/assessment data.
- Document review works.
- Requirement disposition works.
- Workflow and deadlines are scoped.
- Admin cannot change raw system applicability inadvertently.

## Web Acquisition

- Crawlee is integrated behind an abstraction.
- Static pages can be acquired.
- Browser-rendered pages can be acquired when necessary.
- Evidence is passed into validation, not directly into legal decisions.
- No IBM Docling.
- No Zyte.
- No Firecrawl dependency added to the new path.

---

# 28. REQUIRED FINAL REPORT FROM THE CODING AGENT

At the end of the implementation, produce:

## A. Executive summary

What was broken and what was fixed.

## B. Root-cause table

For every reported issue:

| Issue | Root Cause | Files Changed | Fix | Regression Test |
|---|---|---|---|---|

## C. Data-flow audit

Show:

```text
User
→ Business
→ Assessment
→ Profile Version
→ Engine 1
→ Engine 2
→ CIR
→ UI
```

and confirm where context is attached at each stage.

## D. Question-engine audit

Report:

- number of questions before;
- number after;
- suppression logic;
- canonical fact reuse;
- custom answer behavior.

## E. Cross-company isolation audit

Report tests proving that Company A does not see Company B data.

## F. Assessment lifecycle audit

Explain why the duplicate/empty assessment occurred and the exact fix.

## G. Dashboard audit

List every removed hard-coded dataset and its replacement source.

## H. Admin audit

List admin workflows inspected and fixed.

## I. Crawlee integration

Report:

- adapter files;
- routing behavior;
- normalized evidence contract;
- how it enters the current RAG pipeline.

## J. Tests

Provide:

- command run;
- tests passed;
- tests failed;
- skipped browser tests, explicitly noting that browser testing was intentionally not run.

## K. Remaining limitations

Be explicit.

Do not claim something works unless it was actually verified by code/tests.

---

# 29. FINAL ENGINEERING PRINCIPLE

The finished platform must behave as a context-safe state machine rather than a collection of disconnected pages.

The most important invariant is:

```text
CURRENT USER
    ↓
CURRENT BUSINESS
    ↓
CURRENT ASSESSMENT
    ↓
CURRENT PROFILE VERSION
    ↓
CURRENT EVIDENCE / KNOWLEDGE VERSION
    ↓
CURRENT COMPLIANCE RESULT
    ↓
CURRENT DOCUMENTS / SCHEMES / STANDARDS / WORKFLOWS / CALENDAR
```

Nothing from another business or assessment may enter that chain.

And the compliance reasoning boundary remains:

```text
RAG retrieves.
Rules decide.
LLM explains.
```

The LLM fallback may provide preliminary information when the deterministic path is unavailable, but it must never silently convert an unverified answer into a verified compliance decision.
