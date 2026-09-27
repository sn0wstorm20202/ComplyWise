# ComplyWise — Implementation Prompt for Claude Code / Enterprise CLI

Read `/mnt/data/instruction.md` first and treat it as the implementation contract.

You are the lead engineer for a bug-fix and architecture-stabilization pass on the existing ComplyWise codebase.

The platform is largely built, but there are serious state, data-isolation, onboarding, assessment-lifecycle, dashboard, compliance, document, scheme, workflow, calendar, and admin bugs. Do not rewrite the platform. Diagnose and fix the existing implementation generically.

## Non-negotiable constraints

1. Do not hardcode fixes for NorthStar Culture Logistics Pvt. Ltd., Storyloom Pvt. Ltd., or any other specific company.
2. Do not solve bugs with company/state/sector-specific `if/else` branches.
3. Do not remove Engine 2 or replace deterministic applicability with an LLM.
4. Do not run Playwright/browser/visual/UI automation tests. I will do manual testing after implementation.
5. Basic unit/service/API/database tests are required.
6. Add regression tests for every root cause you fix.
7. Integrate **Crawlee only** as the new open-source web acquisition implementation.
8. Do not integrate IBM Docling or Zyte in this iteration.
9. Do not introduce a new database if the project already has its existing database architecture. Preserve the current Supabase-backed persistence design where applicable.
10. Keep the web-acquisition layer replaceable so other providers can be added later.

## Primary objectives

### 1. Perform a full repository audit first

Before editing code, inspect:

- backend structure;
- frontend structure;
- database schema/migrations;
- authentication/session code;
- business profile models/services;
- assessment lifecycle;
- onboarding/question engine;
- Engine 1;
- Engine 2;
- CIR;
- Engine 3;
- source/evidence registry;
- documents;
- schemes;
- standards;
- workflows;
- calendars/deadlines;
- admin panel;
- background jobs;
- frontend state/cache;
- prompts.

Build a root-cause audit map before making large changes.

### 2. Fix business/assessment context isolation

There is currently stale data leakage between companies and assessments.

A user is seeing the compliance and documents of a previous company after switching/onboarding another company.

Trace every layer:

```text
Current business/assessment selection
→ frontend state
→ API request
→ backend authorization
→ repository query
→ database
→ response
→ frontend cache/state
→ rendered UI
```

Make `user_id + business_id + assessment_id + profile_version_id` an explicit context wherever required.

Every compliance/document/scheme/standard/workflow/calendar query must use the correct server-side scope.

Fix frontend query/cache keys so that the active business and assessment are part of the key.

Invalidate/refetch when business or assessment changes.

Add tests proving Company A cannot see Company B data.

### 3. Fix duplicate assessment creation

The UI currently shows two assessments even though only one was initiated. One appears empty with 0 requirements/standards/workflows/documents.

Find the actual cause.

Investigate:

- duplicate POSTs;
- assessment creation on page load;
- onboarding + worker both creating assessments;
- retry behavior;
- missing uniqueness constraints;
- race conditions;
- draft vs assessment confusion;
- frontend state bugs.

Implement idempotent assessment creation and database-level protection where appropriate.

Do not hide duplicates in the UI without fixing their origin.

### 4. Fix onboarding/adaptive question logic

The user has already provided many facts in the initial business description/form, yet the system asks for the same information again.

The system must first create a canonical business-fact store from:

- business description;
- initial form;
- previous question answers;
- current profile version.

Only unresolved, decision-critical facts should generate questions.

Do not ask the user to determine whether a license/regulation is applicable. Ask for factual business information from which Engine 2 can determine applicability.

Implement question metadata with:

- fact keys;
- dependency/required facts;
- suppression rules;
- priority;
- answer type;
- options;
- custom-answer support.

Deduplicate questions using fact identity/semantic intent, not only wording.

Do not arbitrarily slice the question list to 5 or 6. Ask the minimum set of unresolved facts needed to resolve the current decision set.

### 5. Fix custom answer handling

The user can choose an option or provide a custom answer. Custom answers currently fail to advance the flow in at least the scheme section and may fail elsewhere.

Create a normalized answer contract containing:

```text
question_id
assessment_id
profile_version_id
answer_type
selected_option
custom_text
raw_value
normalized_value
```

Ensure `Other` + custom text survives:

```text
UI
→ request
→ backend
→ persistence
→ canonical fact update
→ next-question calculation
```

Add tests for onboarding and schemes. Audit the same mechanism across compliance, documents, workflows, and calendars where applicable.

### 6. Remove hard-coded dashboard data

Current dashboard activity/documents/actions/status values are hard-coded.

Remove them.

Load dashboard data from actual current-assessment records or deterministic aggregates.

Examples:

- compliance status from current CIR/requirements;
- recent activity from real persisted events;
- documents from current context;
- actions from workflow state;
- calendar/deadlines from current assessment.

Empty states must be real empty states, not old/demo data.

### 7. Fix compliance page data

Trace why the current company sees a previous company's compliance.

Investigate both backend and frontend causes:

- missing filters;
- current assessment not sent to API;
- backend defaults to latest assessment;
- global singleton state;
- stale query cache;
- localStorage/sessionStorage;
- background jobs attaching results to the wrong assessment.

Fix the root cause and add a regression test.

### 8. Fix document page data

Apply the same root-cause process to documents.

Verify document ownership and scope.

Add backend authorization tests for cross-company access.

### 9. Audit schemes and standards

Keep:

```text
Compliance requirements
Schemes
Standards
```

as separate categories.

A scheme match must not become a mandatory compliance rule.

A standard must not become a statutory obligation without an explicit validated legal linkage.

Fix stale/current assessment scoping here as well.

### 10. Implement safe fallback when the deterministic “firewall”/validation gate fails

Do not remove the deterministic compliance boundary.

Implement result states:

- `VERIFIED`
- `NEEDS_INFORMATION`
- `UNVERIFIED`
- `CONFLICT_REVIEW`

When the deterministic path cannot complete because retrieval/evidence/firewall validation fails, return a clearly labeled `PRELIMINARY / UNVERIFIED` LLM-assisted informational response instead of an empty response.

The fallback must:

- use available evidence only;
- distinguish known vs missing facts;
- show sources where available;
- never invent legal applicability;
- never invent thresholds, penalties, deadlines, authority, or license requirements;
- never overwrite Engine 2/CIR verified decisions;
- never be presented as a verified compliance result.

### 11. Refactor backend prompting into stages

Do not rely on one giant prompt.

Separate:

A. Business Fact Extraction
B. Missing Fact / Question Analysis
C. Retrieval Query Expansion
D. Grounded Explanation

The explanation layer must consume CIR + validated evidence rather than independently deciding legal applicability.

### 12. Audit the admin panel end-to-end

Check:

- authentication/authorization;
- business selection;
- assessment selection;
- stale/cross-company data;
- document review;
- approve/query/reject lifecycle;
- user re-upload after query;
- requirement disposition;
- workflow transitions;
- deadlines;
- notifications.

System applicability and admin disposition must remain separate.

### 13. Add business profile deletion/archive

Implement a safe business profile delete/archive flow.

Prefer soft-delete if the existing architecture supports historical compliance/audit records.

Do not destroy shared knowledge.

Make sure the UI and backend enforce ownership.

### 14. Integrate Crawlee only

Create a replaceable abstraction such as:

```text
BaseWebAcquisitionLayer
```

Implement:

```text
CrawleeAcquisitionProvider
```

Use Crawlee Python as the primary web acquisition implementation.

Use HTTP crawling for simple pages and PlaywrightCrawler through Crawlee when browser rendering is required.

Do not add IBM Docling.
Do not add Zyte.
Do not add Firecrawl to the new path.

Normalize output into a source/evidence contract containing at minimum:

- source_url;
- resolved_url;
- domain;
- title;
- retrieved_at;
- HTTP status;
- content format;
- content/raw artifact reference;
- content hash;
- acquisition tier/engine;
- discovered links;
- crawl metadata.

Pass Crawlee results through the existing source validation/evidence pack pipeline. Crawlee must not directly decide legal applicability.

### 15. Audit background jobs

Every async job must carry explicit:

- user_id;
- business_id;
- assessment_id;
- profile_version_id where relevant.

Make result-generation and assessment-creation jobs idempotent.

Verify that retries cannot create duplicate assessments or attach compliance/documents to another assessment.

### 16. Audit frontend state/cache

Inspect React Query/TanStack Query, Redux, Zustand, Context, localStorage, sessionStorage, router state, and any global “current company/current assessment” store.

There must be one authoritative current workspace context.

Scoped query keys should conceptually look like:

```text
compliance:{business_id}:{assessment_id}
documents:{business_id}:{assessment_id}
schemes:{business_id}:{assessment_id}
standards:{business_id}:{assessment_id}
workflows:{business_id}:{assessment_id}
calendar:{business_id}:{assessment_id}
```

Do not use globally shared keys for user/company/assessment-specific data.

### 17. Audit database integrity

Inspect schema and migrations for:

- foreign keys;
- uniqueness constraints;
- orphaned records;
- duplicate assessment creation;
- missing ownership fields.

Create safe migrations only where required.

Do not delete data merely to make the UI look clean.

## Required test suite

Do NOT run browser tests.

Run only basic automated tests such as:

- unit tests;
- service tests;
- API tests without browsers;
- DB tests;
- onboarding/question tests;
- custom answer tests;
- cross-company isolation tests;
- cross-assessment isolation tests;
- assessment idempotency tests;
- dashboard data tests;
- document isolation tests;
- scheme/standards separation tests;
- workflow/calendar scope tests;
- admin permission tests;
- fallback-state tests;
- Crawlee adapter tests with network mocked where practical.

## Required implementation workflow

Use this sequence:

```text
PHASE 0 — Repository and architecture audit
        ↓
PHASE 1 — Reproduce and classify bugs
        ↓
PHASE 2 — Fix identity/context/assessment lifecycle
        ↓
PHASE 3 — Fix onboarding/question engine
        ↓
PHASE 4 — Fix dashboard/compliance/documents/schemes/standards
        ↓
PHASE 5 — Fix workflows/calendars
        ↓
PHASE 6 — Audit/fix admin panel
        ↓
PHASE 7 — Add safe fallback states
        ↓
PHASE 8 — Integrate Crawlee behind abstraction
        ↓
PHASE 9 — Add/run regression tests
        ↓
PHASE 10 — Produce final audit report
```

Do not skip directly to UI patches.

## Final deliverables

At the end, produce:

1. list of files changed;
2. root cause for every reported bug;
3. exact architectural changes;
4. data-flow/context changes;
5. question-engine changes;
6. assessment lifecycle fix;
7. dashboard fix;
8. compliance/document isolation fix;
9. scheme/standards fix;
10. workflow/calendar audit;
11. admin audit;
12. fallback-state implementation;
13. Crawlee integration details;
14. database migrations, if any;
15. tests added;
16. tests executed and result;
17. browser/UI tests intentionally not executed;
18. known remaining issues;
19. exact manual testing checklist for me to perform after your work.

Do not claim manual UI functionality was verified.

## Manual testing checklist to output

Include explicit test scenarios for:

1. Create Company A.
2. Complete assessment A.
3. Create Company B.
4. Complete assessment B.
5. Switch A → B → A.
6. Verify compliance changes correctly.
7. Verify documents change correctly.
8. Verify schemes/standards change correctly.
9. Verify workflows change correctly.
10. Verify calendar changes correctly.
11. Create only one assessment and refresh repeatedly.
12. Confirm no empty duplicate assessment appears.
13. Enter a custom answer in onboarding.
14. Enter a custom answer in schemes.
15. Verify custom answer persists and affects subsequent logic.
16. Verify questions are not repeated from the initial form.
17. Trigger a missing-information path.
18. Trigger an unverified/firewall-failure path.
19. Confirm user gets a preliminary labeled response rather than an empty result.
20. Verify admin review for the correct business/assessment.
21. Upload/query/re-upload a document.
22. Verify workflow continuity.
23. Verify a deadline is attached to the correct assessment.
24. Archive/delete a business profile and confirm expected behavior.

Start by reading `instruction.md`, then inspect the repository and report the initial root-cause map before making broad edits. Proceed through the phases, implement the fixes, run basic tests only, and finish with the required audit report.
