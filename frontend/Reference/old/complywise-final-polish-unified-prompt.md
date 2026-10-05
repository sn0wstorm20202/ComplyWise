# COMPLYWISE — FINAL POLISH / SUBMISSION FREEZE / UNIFIED ENGINEERING PROMPT

## ROLE

Act as the senior software engineer / staff-level architect responsible for the final submission-quality state of ComplyWise.

Before editing, read these three authoritative documents:

1. `instruction.md`
2. `complywise-codebase-structure-cleanup.md`
3. `complywise-codebase-structure-cleanup-prompt.md`

Also inspect the current:

- `task-progress.md`
- `docs/backend-architecture.mmd`
- frontend reference/design documents
- actual repository structure
- current provider/configuration code
- existing tests and E2E tests

Historical audit documents are evidence to verify, not facts to blindly repeat. Never reuse old test counts as current results.

The current goal is:

> DELIVER THE CLEANEST, MOST RELIABLE, FASTEST, MOST CREDIBLE END-TO-END COMPLYWISE PRODUCT POSSIBLE FOR THE SIH JUDGING SUBMISSION.

Do not fabricate successful provider calls, legal results, sources, documents, workflows, latency, or test results.

---

# 0. PRIORITY ORDER

Execute in this order:

P0 — Inspect and establish current reality
P1 — Fix judge onboarding / business autofill
P2 — Replace the active Firecrawl acquisition path
P3 — Implement and verify the 3-Gemini-key rotation/fallback chain
P4 — Harden LLM prompts/output against hallucination
P5 — Verify RAG/search/acquisition → assessment → workspace end-to-end
P6 — Remove duplicate work and obvious latency problems
P7 — Full browser + backend + API + provider + visual QA
P8 — Update architecture documentation and task progress
P9 — Only after behavior is green, perform safe submission-related structural cleanup
P10 — Final submission freeze and honest report

Do NOT begin a broad repository rewrite before P0–P8 are green.

The cleanup documents are engineering standards and a later refactoring guide. They are not permission to destabilize working product architecture immediately before submission.

---

# 1. INSPECT BEFORE EDITING

Inspect:

- repository root and git state
- backend/frontend structure
- existing uncommitted work
- dependency files
- environment variable names without printing values
- LLM/provider abstraction
- Gemini provider
- OpenAI provider
- RAG adapter
- search/web-discovery adapter
- Firecrawl integration
- Crawlee/Crawly integration
- onboarding/business creation/admin creation routes
- login/register routes
- task progress
- architecture diagram
- frontend reference/design directory
- tests

Do not reset the working tree. Do not overwrite unrelated work. Do not expose secrets.

At the beginning add/update a `FINAL SUBMISSION POLISH — START` section in `task-progress.md` recording the current SHA, working tree, current provider configuration, current acquisition providers, and current autofill status.

---

# 2. REQUIREMENT PRIORITY

Resolve conflicts in this order:

1. Latest explicit user requirement
2. Actual repository behavior
3. Current `instruction.md`
4. Current audit/architecture documents
5. Cleanup playbook

Never silently pretend an old architecture description is still implemented.

---

# 3. FINAL ACQUISITION DECISION — REMOVE FIRECRAWL FROM ACTIVE PATH

The current submission MUST NOT depend on Firecrawl for live search or scraping.

The active acquisition architecture is:

```text
Business Context
      ↓
SERP API / live source discovery
      ↓
Candidate URLs
      ↓
Official-domain / redirect / jurisdiction validation
      ↓
Crawlee acquisition
      ↓
HTTP or browser extraction
      ↓
Normalized content
      ↓
Source/version metadata
      ↓
RetrievedDocument / evidence context
      ↓
RAG / deterministic applicability / LLM contextual interpretation
```

Remove Firecrawl from the ACTIVE runtime path.

Do not merely hide Firecrawl behind a flag while still calling it.

Inspect every Firecrawl call site, dependency and environment setting.

Then:

- remove Firecrawl calls from active discovery/acquisition
- remove Firecrawl retry/timeout logic from active execution
- remove Firecrawl provider selection from orchestration
- remove Firecrawl runtime credentials where safe
- update tests
- update documentation
- update `docs/backend-architecture.mmd`
- update `task-progress.md`

If deletion of legacy Firecrawl code is too risky immediately before submission, disable it completely from execution and mark it legacy for the later cleanup phase.

Do NOT keep a hidden Firecrawl fallback.

---

# 4. IDENTIFY THE SERP API EXACTLY

The user refers to a SERP API / SERP layer and separately to Crawly/Crawlee.

Do not assume the exact vendor.

Inspect:

- dependencies
- environment variables
- provider modules
- source-discovery services
- tests
- documentation

Determine the exact search provider and exact Crawlee package currently available/intended.

Use two explicit responsibilities:

```text
Search provider = discovers candidate URLs
Crawlee = acquires/renders/fetches content
```

If a search provider is configured, use it. If it is not configured, do not fabricate success. Build/repair the adapter and record the blocker.

Record safely:

- provider/package name
- endpoint/API contract
- configuration names without values
- installed version
- timeout
- rate-limit behavior
- failure classes
- whether the live probe actually ran

---

# 5. SEARCH + CRAWLEE FLOW

Implement/verify:

```text
Business Context
      ↓
Query Planner
      ↓
SERP API
      ↓
Candidate URLs
      ↓
Source/domain/jurisdiction checks
      ↓
Crawlee router
      ↓
HTTP or Browser acquisition
      ↓
Capture
      ↓
Normalize / hash / version
      ↓
RetrievedDocument
      ↓
Evidence/interpretation
```

A successful HTTP request is NOT enough. Validate:

- final URL
- redirect chain
- official domain
- MIME type
- content length
- useful extracted text
- title/content consistency
- source identity
- jurisdiction where available
- publication/effective dates where available
- duplicate/version identity

Reject login pages, error pages, CAPTCHAs, empty shells, unrelated content and boilerplate as regulatory captures.

---

# 6. CRAWLEE: REAL INSTALLATION AND REAL TEST

Inspect/install/configure the actual Crawlee package required by the repository.

Verify:

- package/version
- HTTP backend
- browser backend
- Playwright dependency
- browser binary
- OS/runtime dependencies

Run real authorized probes where possible:

A. static official HTML
B. official PDF
C. JavaScript-dependent official page
D. failed/blocked source
E. unofficial redirect
F. empty/boilerplate response

Record the actual acquisition mode:

`SEARCH_API`, `CRAWLEE_HTTP`, `CRAWLEE_BROWSER`, or persisted/local recovery.

Never label HTTP as a browser acquisition.

---

# 7. HIGH PRIORITY — BUSINESS STARTER / AUTO-FILL UX

A judge should NOT have to invent a company or manually fill a long profile.

Add visible, polished starter/autofill controls, for example:

- Restaurant
- Manufacturing
- Retail / Trading
- IT Services
- Warehouse / Logistics
- Healthcare
- Renewable Energy
- Start with my own business

Use structured starter profile data.

Clicking a starter must:

- populate the initial business profile
- populate a realistic business description
- populate relevant fields/ranges
- keep everything editable
- NOT submit automatically
- continue through the REAL assessment pipeline

Do not automatically fabricate adaptive-question answers. The real planner still generates those.

---

# 8. WHERE AUTO-FILL MUST EXIST

Support starter/autofill wherever business creation/configuration occurs.

### USER ONBOARDING

After successful authentication, when the business form appears, show an obvious starter-profile selector.

### USER ADD-BUSINESS

Reuse the same starter profiles when adding another business.

### ADMIN BUSINESS CREATION

Provide the same starter profiles when an admin creates a business/user record.

### ADMIN/REVIEWER TESTING ENTRY

Where a business is selected/created for review or testing, provide the same convenience.

### LOGIN

Do NOT autofill passwords, tokens, real emails, or credentials.

Do not create insecure one-click credential login.

After successful sign-in, make starter-profile onboarding immediately available. If the existing login flow supports a safe, authenticated "Explore with a sample business" transition, add it; otherwise do not distort authentication just for the demo.

Registration credentials remain manual.

---

# 9. AUTO-FILL UX

Use clear UI such as:

> Use a starting profile — you can edit anything before continuing.

When clicked:

- populate form
- visually show selected starter
- allow edits
- do not auto-submit

Do not call it fake/demo data in the normal product UI. Prefer "Starting profile", "Quick start", or "Example business".

Do not build a separate fake assessment engine for starter profiles.

---

# 10. THREE GEMINI KEYS — GEMINI PRIMARY

The CURRENT default LLM provider is Gemini.

There are THREE Gemini API keys.

Implement an ordered rotating pool with failure-aware skipping:

```text
Gemini slot 1
    ↓ failure/quota
Gemini slot 2
    ↓ failure/quota
Gemini slot 3
    ↓ failure/quota
OpenAI final fallback
```

The user also wants round-robin behavior across healthy Gemini slots.

Use a rotating cursor for normal requests:

```text
request 1 → Gemini 1
request 2 → Gemini 2
request 3 → Gemini 3
request 4 → Gemini 1
...
```

BUT never blindly retry a known-exhausted slot.

If slot 1 hits quota:

```text
skip slot 1
→ slot 2
→ slot 3
→ OpenAI if all Gemini slots are unavailable
```

If slot 2 is also exhausted, continue to slot 3.

Temporarily cool down unavailable slots and reintroduce them when eligible.

Detect/document whether several keys share the same quota project/bucket. Do not pretend key rotation creates independent quota when it does not.

Do not create recursive provider loops.

---

# 11. GEMINI FAILURE CLASSIFICATION

Classify:

- quota exceeded
- rate limit
- authentication failure
- timeout
- network failure
- provider unavailable
- malformed response
- schema failure
- unusable/refusal output

Retry/fallback only when appropriate.

Invalid application requests should not be retried forever.

One logical LLM request must have one bounded provider-attempt chain.

---

# 12. GEMINI TELEMETRY

Track safely:

- provider
- slot number
- model
- attempt number
- latency
- success/failure
- failure class
- fallback occurrence
- final provider
- token usage when available

Never log:

- API keys
- auth headers
- raw secrets
- sensitive prompts
- private document bodies

---

# 13. LLM PROMPT HARDENING — NO HALLUCINATED COMPLIANCE

Inspect all LLM prompts for:

- business understanding
- fact extraction
- question planning
- answer interpretation
- search planning
- evidence/claim extraction
- compliance synthesis
- unsupported-business fallback
- documents/workflows suggestions
- standards/schemes contextual suggestions
- assistant/copilot

Prompts must explicitly tell the model:

1. Use only supplied business facts and supplied/retrieved evidence.
2. Do not invent legislation.
3. Do not invent sections/rules/thresholds.
4. Do not invent official URLs.
5. Do not invent publication/effective dates.
6. Do not invent government forms.
7. Do not invent statutory fees/deadlines.
8. Do not turn inference into deterministic applicability.
9. Preserve source identity and evidence excerpts.
10. Distinguish source-backed facts from inference.
11. Treat missing information as missing.
12. Never claim a source was retrieved unless it was actually retrieved.
13. Never claim a provider succeeded unless a validated response was received.
14. Never manufacture citations to make the UI look complete.

Use this division of responsibility:

```text
Search/RAG → finds evidence
Deterministic engine → decides applicability when a published rule exists
LLM → understands, extracts, explains and gives bounded contextual planning
```

For unsupported/partial businesses, the LLM may provide useful contextual planning, but must never manufacture official legal authority.

Keep an internal origin such as:

- `DETERMINISTIC_KB_RESULT`
- `HUMAN_REVIEW_RESULT`
- `LLM_FALLBACK_RESULT`

Never let fallback guidance become a fake published rule.

---

# 14. STRUCTURED LLM OUTPUT

Use/strengthen schemas for:

- business understanding
- question plan
- answer interpretation
- evidence claim
- workspace guidance
- document suggestion
- workflow suggestion
- scheme suggestion
- standard suggestion

Validate before persistence.

Reject:

- malformed output
- fabricated identifiers
- invalid URLs
- unsupported rule references
- document/workflow items with no supporting basis

If the first Gemini slot fails schema validation, continue through the configured provider pool.

---

# 15. KNOWLEDGE PATH VS LLM FALLBACK PATH

### Supported path

```text
Business
 ↓
Understanding
 ↓
Questions
 ↓
Search/RAG
 ↓
Published rule/evidence
 ↓
Deterministic applicability
 ↓
Workspace
```

### Partial/unsupported path

```text
Business
 ↓
Understanding
 ↓
Questions
 ↓
Search/RAG
 ↓
Insufficient verified coverage
 ↓
LLM contextual fallback
 ↓
Structured guidance
 ↓
Normal workspace
```

Do not produce a blank workspace merely because a domain is not fully represented in the current knowledge base.

Do not manufacture statutory obligations to make the workspace look full.

---

# 16. END-TO-END REAL BUSINESS TESTS

At minimum execute:

### A — strongly covered starter business

Login → starter autofill → edit → description → adaptive questions → search/RAG → deterministic applicability → compliance → documents → workflows → schemes → standards → dashboard.

### B — arbitrary / partially covered business

Own business → description → questions → search/RAG → partial coverage → LLM fallback → structured guidance → persisted workspace.

### C — acquisition failure

Force SERP API or Crawlee failure and verify controlled recovery without fabricated success.

### D — Gemini rotation

Force slot 1 quota failure → slot 2.
Force slot 2 quota failure → slot 3.
Force slot 3 failure → OpenAI.

### E — total LLM exhaustion

All Gemini + OpenAI fail → controlled final failure; user inputs remain intact; no fake workspace.

---

# 17. JUDGE-FRIENDLY USER FLOW

The polished journey should feel like:

```text
Login
 ↓
Choose a starting business
 ↓
One-click autofill
 ↓
Edit profile
 ↓
Describe business
 ↓
0–5 meaningful adaptive questions
 ↓
Analyze
 ↓
Compliance workspace
```

The judge should not need to search for a fictional company or understand your architecture.

---

# 18. ADMIN EXPERIENCE

Audit and support:

- admin user creation
- admin business creation
- starter autofill
- business selection
- requirement review
- evidence review
- publication/review decision
- propagation to linked assessments

Preserve role boundaries. Do not grant global publication authority to ordinary users.

---

# 19. NO FABRICATED RESULTS

Never fabricate:

- legal sources
- section numbers
- thresholds
- deadlines
- government forms
- fees
- schemes
- standards
- scrape success
- retrieval success
- provider success
- test results
- accuracy percentages

Synthetic fixtures belong only in tests.

---

# 20. LATENCY

The objective is not literally zero latency. It is no unnecessary latency.

Measure:

- login
- profile save
- business understanding
- question planning
- answer submission
- search
- Crawlee acquisition
- RAG
- LLM fallback
- assessment completion
- dashboard load

Fix:

- duplicate requests
- repeated question generation
- duplicate search
- duplicate acquisition
- repeated provider calls
- avoidable serial work
- provider calls during simple workspace GETs

Use safe profile/assessment-scoped caching and persistence.

Parallelize independent searches/acquisitions where safe.

Do not reduce correctness for speed.

---

# 21. UI QUALITY

Keep the existing visual language. Do not redesign it unnecessarily.

Fix:

- missing starter buttons
- awkward onboarding
- stale data
- confusing loading
- bad error/empty states
- clipped/mobile defects
- inconsistent labels
- incorrect result status
- internal/technical wording visible to judges
- broken navigation

---

# 22. BROWSER + SCREENSHOT QA

Use the existing browser test framework.

Test:

### Authentication
- login
- register
- duplicate registration
- logout
- protected route

### User
- onboarding
- starter autofill
- edit starter
- arbitrary business
- assessment
- compliance
- documents
- workflows
- schemes
- standards
- calendar
- assistant
- settings

### Admin
- login
- user creation
- business creation
- starter autofill
- review
- approval/rejection
- propagation

### Responsive
- desktop
- tablet
- mobile

### Accessibility
- keyboard
- focus
- dialogs
- reduced motion

### Failure states
- provider timeout
- search failure
- Crawlee failure
- Gemini rotation
- all-provider exhaustion
- empty search
- missing document
- upload failure

Take screenshots of at least:

1. Login
2. Starter selection
3. Autofilled onboarding
4. Adaptive questions
5. Analysis/loading
6. Compliance
7. Documents
8. Workflows
9. Schemes
10. Standards
11. Dashboard
12. Admin business creation
13. Admin review

Inspect screenshots for visual defects. Fix actual issues found.

---

# 23. NETWORK QA

For one complete assessment inspect browser/network telemetry.

Confirm:

- frontend never calls Gemini directly
- frontend never calls SERP API using secret credentials
- frontend never calls Crawlee directly
- secrets stay backend-side
- provider fallback occurs server-side
- assessment/profile scoping is preserved
- no duplicate assessment creation
- no duplicate question generation
- no search storm
- no acquisition storm

---

# 24. RESULT CORRECTNESS QA

For every requirement presented as an actual compliance obligation:

```text
Business facts
 ↓
Rule
 ↓
Applicability decision
 ↓
Evidence
 ↓
Source
 ↓
Workspace
```

Verify the chain.

For fallback guidance:

```text
Business context
 ↓
Available evidence/context
 ↓
LLM output
 ↓
Schema validation
 ↓
Workspace
```

Do not label a contextual LLM suggestion as a deterministic statutory requirement without supporting evidence.

---

# 25. REQUIRED FINAL REAL-PROVIDER E2E GATE

Run one complete assessment using the CURRENT Gemini-primary environment.

Report:

- business type
- assessment ID
- adaptive-question count
- provider sequence actually used
- search provider actually used
- Crawlee acquisition mode actually used
- search result count
- accepted official source count
- retrieval result summary
- deterministic decision count
- fallback guidance count
- compliance output
- document output
- workflow output
- scheme output
- standard output
- dashboard output
- total duration
- retries/failures

Do not expose private keys.

If any part cannot be independently verified, say so.

---

# 26. TASK-PROGRESS.md IS THE SOURCE OF TRUTH FOR WORK COMPLETION

Update `task-progress.md` after EVERY meaningful task.

For each entry record:

- date/time
- task ID
- exact files changed
- exact behavioral change
- reason
- exact tests/probes
- exact result
- external dependency state
- remaining concern

Use:

`[x]` verified complete
`[~]` in progress
`[!]` blocked
`[?]` needs investigation
`[ ]` not started

Never mark `[x]` because code was merely written.

Preserve historical entries. Do not erase previous work.

At the end add a `FINAL SUBMISSION FREEZE` section containing the exact current state.

Explicitly record everything completed AND everything intentionally not completed.

---

# 27. CREATE FRONTEND REFERENCE — CURRENT SCENARIO

Create:

`frontend/reference/current-product-scenario.md`

Document the ACTUAL final behavior after this task:

1. Authentication
2. Starter profile/autofill
3. User onboarding
4. Business profile
5. Assessment lifecycle
6. Adaptive questions
7. SERP API
8. Crawlee acquisition
9. RAG
10. Gemini rotation
11. OpenAI fallback
12. LLM contextual fallback
13. Deterministic applicability
14. Compliance
15. Documents
16. Workflows
17. Schemes
18. Standards
19. Calendar/alerts
20. Admin
21. Error/loading states
22. Performance behavior
23. Environment configuration categories
24. Known limitations
25. Final E2E result
26. What is intentionally not implemented

Do not copy an old conceptual diagram verbatim.

---

# 28. UPDATE BACKEND ARCHITECTURE DIAGRAM

Update:

`docs/backend-architecture.mmd`

The active architecture must show:

```text
SERP API
   ↓
Crawlee
   ↓
Capture
   ↓
Evidence/context
   ↓
RAG / rules / LLM
```

It must NOT show Firecrawl as an active provider.

Show:

```text
Gemini 1
  ↓ failure/quota
Gemini 2
  ↓ failure/quota
Gemini 3
  ↓ failure/quota
OpenAI
```

Also show:

```text
RAG / retrieval
      ↓
insufficient coverage
      ↓
LLM fallback
      ↓
WorkspaceGuidance
      ↓
normal workspace
```

Only include components that actually exist in the current code.

---

# 29. SAFE CODEBASE CLEANUP ONLY

Use the supplied cleanup playbook as the engineering standard.

For this submission pass, only perform low-risk structural cleanup directly related to the work:

- remove obsolete Firecrawl imports after migration
- consolidate duplicate Gemini configuration created by this task
- remove dead provider branches made obsolete by Firecrawl removal
- fix naming of newly touched modules
- move newly added logic into the correct existing boundary
- remove debug code/imports

Do NOT now:

- rename hundreds of files
- migrate frameworks
- introduce microservices
- introduce repositories/factories everywhere
- rewrite working services
- redesign the database

A broader cleanup pass remains a separate phase after the submission freeze.

---

# 30. SECURITY

Before completion verify:

- no secrets in git diff
- no secrets in frontend bundle
- no Gemini keys in browser responses
- no SERP API key in frontend
- no Crawlee credentials in frontend
- no raw provider prompts in logs
- no cross-tenant data
- no cross-assessment data
- no insecure demo credentials

---

# 31. FINAL TEST SUITE

Run and separately report:

BACKEND
- Django checks
- migrations
- unit tests
- integration/API tests
- provider tests
- Gemini rotation/fallback tests
- search tests
- Crawlee tests
- RAG contract tests
- applicability tests
- workspace persistence tests
- tenant isolation tests

FRONTEND
- TypeScript
- build
- lint
- unit tests
- route tests

BROWSER
- authentication
- starter autofill
- onboarding
- covered business
- arbitrary business
- workspace
- admin
- mobile
- keyboard
- reduced motion

REAL INTEGRATIONS
- Gemini live
- all three Gemini slots live where credentials permit
- SERP API live
- Crawlee live
- deployed RAG live

Separate:

- mocked tests
- local tests
- real-provider tests
- deployed-provider tests

Never combine these into a misleading aggregate pass number.

---

# 32. FINAL SUBMISSION CRITERIA

The product is ready only when:

1. Judge can log in.
2. Judge can quickly choose a starter business.
3. Business data autofills.
4. Judge can edit it.
5. Judge can enter an arbitrary business.
6. Adaptive questioning remains 0–5 for the first pass.
7. Search uses the intended SERP API.
8. Acquisition uses Crawlee.
9. Firecrawl is not used in the active path.
10. Gemini is the default LLM provider.
11. Three Gemini slots rotate/fail over correctly.
12. OpenAI is the final fallback.
13. LLM output is schema-validated.
14. No fabricated compliance claims.
15. Covered businesses use deterministic knowledge where available.
16. Partial/unknown businesses receive useful contextual fallback without fabricated legal authority.
17. Results persist correctly.
18. Documents/workflows/schemes/standards/dashboard are coherent.
19. Admin can create businesses with starter autofill.
20. No cross-assessment or cross-tenant contamination.
21. No critical browser/runtime errors.
22. Latency is measured and obvious duplicate work removed.
23. Architecture documentation matches reality.
24. `task-progress.md` records exact completed/uncompleted work.
25. `frontend/reference/current-product-scenario.md` describes actual behavior.
26. One complete real-provider business journey is independently tested.
27. Remaining blockers are explicit.

---

# 33. FINAL REPORT

Produce:

## Implemented
Exact changes and files.

## Not Implemented
Exact remaining work.

## Why Not Implemented
Technical/external reason.

## Acquisition
SERP API name/status/latency/results.
Crawlee package/mode/status/latency.
Firecrawl removal status.

## Gemini
Default provider.
Slot 1/2/3.
Rotation behavior.
Quota failure behavior.
OpenAI fallback behavior.

## Hallucination Controls
Prompt constraints.
Schemas.
Validation.
Evidence requirements.

## End-to-End Test
Exact business.
Exact workflow.
Exact provider/search/acquisition sequence.
Exact outputs.
Exact duration.
Exact failures.

## Browser QA
Routes/states tested, viewports, screenshot review, fixes.

## Test Results
Separate backend/frontend/E2E/provider/search/Crawlee/RAG results.

## Remaining Blockers
Only real blockers.

## Rollback
Exact configuration/code changes needed to disable the new SERP API/Crawlee/Gemini rotation path safely.

---

# ABSOLUTE FINAL RULE

Do not optimize this submission by making the system LOOK successful.

Optimize it by making the system ACTUALLY WORK.

The target is:

```text
Judge
 ↓
Login
 ↓
One-click business starter
 ↓
Editable profile
 ↓
Adaptive questions
 ↓
SERP API
 ↓
Crawlee
 ↓
RAG / deterministic rules
 ↓
Gemini 1 → 2 → 3 → OpenAI when necessary
 ↓
Evidence-backed compliance workspace
 ↓
Documents / Workflows / Schemes / Standards / Calendar
```

with:

- NO Firecrawl in the active path
- NO fabricated compliance
- NO fake sources
- NO fake success
- NO cross-tenant data
- NO fake progress
- NO hidden provider failures
- NO hardcoded demo results replacing real computation

If a component cannot be verified, report the exact limitation.

Do not hallucinate.

Do not claim accuracy that was not measured.

Deliver the strongest truthful, polished, submission-ready product the repository can support.
