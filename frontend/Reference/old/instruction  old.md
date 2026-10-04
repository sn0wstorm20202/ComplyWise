# ComplyWise — Full Product Audit & Fix Instructions

## 0. Mission

This task is a **full product audit + fix**, not a cosmetic redesign.

The final ComplyWise product must feel like a polished, premium, trustworthy $10k–$12k product while remaining technically honest.

### Primary objective

> **A new business should be able to onboard with minimal friction and receive the most accurate, evidence-backed compliance, standards and scheme results that the available verified knowledge can support — without fabricated information, broken flows, unexplained errors, or unnecessary questions.**

User experience is the first priority.

Accuracy and trust are the second priority.

Architecture correctness is the third priority.

Do not optimize for visual polish by sacrificing data integrity.

---

# 1. Non-negotiable product principles

1. **Never fabricate regulatory information.**
2. **Never convert missing knowledge into “Not Applicable”.**
3. Use explicit states such as:
   - Applicable
   - Not Applicable
   - Needs Information
   - Knowledge Not Covered
   - Pending Verification
   - Verified
   - Failed / Error
4. Every regulatory result must preserve its source/evidence/provenance where available.
5. The LLM may understand, extract, retrieve and explain.
6. The deterministic applicability/rule layer decides applicability.
7. Human/admin verification remains the trust layer.
8. Empty live data must remain empty. Never display an unrelated seeded/sample record as a fallback.
9. Every mutation must have a real backend response.
10. Never show a successful UI state when the database/API operation failed.
11. Preserve user input on failure.
12. Never make the user repeat information unnecessarily.
13. No page should trap the user in loading, broken navigation, or unexplained error states.
14. The system must be responsive at desktop, tablet and mobile widths.
15. Reduced-motion users must receive an accessible non-animated experience.

---

# 2. Existing product baseline

The previous frontend audit already covered 37 page files/routes, including aliases and parameterized routes. Preserve working routes, API contracts and existing functionality unless the audit proves that a change is required.

Existing audited areas include:

- authentication
- onboarding
- dashboard
- business profile
- compliance
- requirement details
- documents
- workflows
- applications
- cases
- calendar
- notifications
- standards
- schemes
- regulatory updates
- assistant
- settings
- admin
- admin businesses
- admin cases

The existing audit also established application-only design tokens, shared shells, keyboard/focus handling, responsive behaviour and restrained GSAP motion. Continue that direction rather than rebuilding the product from scratch.

Reference: the previous audit explicitly retained the existing application architecture and route/API contracts while fixing functional and UX problems. fileciteturn42file0L75-L87

---

# 3. Visual direction

## Keep the established landing-page visual language

The application must belong to the same design family as the existing light editorial landing page.

Use:

- warm ivory / cream background
- charcoal typography
- muted sage as the primary positive/verified interaction colour
- restrained secondary accents
- soft warm-gray surfaces
- thin borders
- generous whitespace
- strong typography hierarchy
- premium editorial composition
- subtle shadows
- calm micro-interactions
- precise spacing
- restrained GSAP transitions

Do NOT turn the application into the landing-page animation itself.

### Application motion rule

The product UI is a **calm premium workspace**, not a cinematic scrolling story.

Use animation for:

- state transitions
- opening/closing panels
- progress
- navigation
- filtering
- step changes
- data refresh
- successful mutations
- contextual hover/focus
- onboarding question transitions

Do not use:

- continuous 3D scenes
- unnecessary WebGL
- giant animated backgrounds
- scroll-jacking
- excessive parallax
- constant floating objects
- animation that delays task completion

---

# 4. Dashboard — restore the previous product behaviour

The current dashboard became too static and information-reduced.

Restore the **previous dashboard's more interactive visual structure** as the reference.

The old dashboard should be treated as a **visual/product reference**, not as a source of fake data.

### Restore the concept of:

- Compliance Activity
- Documents progress
- Compliance Actions
- Compliance Status
- visually meaningful progress/workflow areas
- quick workspace actions
- business/context summary
- upcoming deadlines / attention items
- interactive dashboard widgets

### Important

The old dashboard was visually interactive but not truly data-driven.

Do NOT reproduce its static/fabricated behaviour.

Instead:

**Old visual composition → real current backend data.**

For example:

- activity widget → actual tracked actions
- document widget → actual document registry state
- compliance status → actual assessment results
- action list → actual unresolved actions
- deadlines → actual supported dates
- progress → calculated only from real persisted state
- empty values → honest empty state

If the backend does not contain enough information to calculate a metric, do not invent the metric.

### Dashboard interaction quality

Each meaningful dashboard block should have:

- hover/focus feedback
- clear click target
- contextual navigation
- loading state
- empty state
- error state
- success/update transition where appropriate

The dashboard should feel like a **live command workspace**, not a static analytics page.

---

# 5. Schemes — remove the black business-context panel

The current Schemes page contains a large dark/black section containing:

- active business context
- registered state
- switch business profile

This is visually inconsistent with the established light product language.

### Replace it with

A premium light context panel using:

- warm ivory / white surface
- subtle border
- soft sage or very restrained accent
- strong business name typography
- compact metadata
- clearly labelled registered state
- light dropdown/select
- no black hero block

The section must visually communicate:

> “These schemes are being matched against this business.”

Do not make it look like a separate dark product.

### Scheme colour semantics

Use colour sparingly and consistently.

Suggested semantic system:

- sage → verified / eligible / active / positive
- blue → informational / source / navigation
- amber → review / attention
- red → urgent / error / failed
- neutral → inactive / unavailable / empty

Do not assign arbitrary colours to every scheme category.

The scheme cards should prioritize:

1. scheme name
2. benefit
3. why the business matches
4. eligibility conditions
5. jurisdiction
6. evidence/source
7. action

Not decorative colour blocks.

---

# 6. Standards — fix the false “standards everywhere” experience

A business does not necessarily have a matching standard.

The Standards page must therefore support:

### Matching standards

Show:

- standard identifier
- title
- issuing authority
- applicability/match reason
- mandatory vs voluntary status where verified
- associated order/QCO when verified
- evidence/source
- relevant clauses where available

### No matching standards

Show a polished empty state:

> No verified standards were matched to this business profile yet.

Then explain:

- what was checked
- jurisdiction/scope
- whether additional information could change the result
- how the user can refine the profile

Never display unrelated standards merely to make the page look populated.

### Standards search

Searching must:

- clear stale results
- show loading state
- show no-result state
- show backend/API errors
- preserve citations
- load the requested standard by ID
- never fall back to the first standard

---

# 7. Onboarding — reduce the adaptive questionnaire to 4–5 questions maximum

This is a major product change.

The user should NOT answer a long questionnaire after entering the basic business profile.

## Initial business profile

Collect only the core information required for a useful starting context, such as:

- business name
- legal/entity type
- location/state
- business stage
- employee/workforce range
- basic turnover/investment range where needed
- import/export intent
- primary business activity
- natural-language business description

Keep this form understandable and fast.

## After the profile

The system should:

1. parse the business description
2. extract canonical business facts
3. identify regulatory domains likely to matter
4. retrieve candidate knowledge
5. identify decision-critical missing facts
6. generate only the questions that can materially change retrieval/applicability

### Maximum adaptive questions

**4–5 questions maximum in the normal onboarding flow.**

Prefer fewer.

If no additional question is decision-critical, ask zero.

### Question design

Prefer:

- multiple choice
- yes/no
- range selection
- compact chips
- segmented controls
- one short numeric input only when necessary

Avoid long free-text questions.

### Question quality rule

Every adaptive question must have a reason.

Internally record:

- missing fact
- why it matters
- rules/knowledge affected
- expected answer type
- whether the answer can change applicability

Do not ask a question merely because it is available in the ontology.

### If more information is genuinely needed

Do not force the user through 15+ questions.

Instead:

- complete the first-pass assessment
- mark affected results as `Needs Information`
- allow the user to provide more information later

This is preferable to onboarding fatigue.

---

# 8. LLM role in onboarding and regulatory discovery

The LLM should act as the **business understanding and retrieval-orchestration layer**.

Flow:

Business profile
→ business description
→ canonical facts
→ candidate regulatory domains
→ source/query planning
→ retrieval/web ingestion
→ verified knowledge
→ deterministic applicability
→ evidence-backed result
→ human-readable explanation

The LLM may:

- understand natural language
- extract business facts
- classify activities
- identify missing decision-critical facts
- propose adaptive questions
- formulate search/retrieval queries
- summarize retrieved evidence
- explain final validated decisions

The LLM must NOT:

- invent a regulation
- invent a threshold
- invent a source
- invent a compliance obligation
- declare applicability without the rule engine
- turn missing evidence into a positive result
- override an administrator's verified decision

---

# 9. Web scraping / Firecrawl audit

Audit the current scraping implementation end-to-end.

The project refers to web scraping through Firecrawl/Crawly. Inspect the actual implementation and determine exactly which service/package is currently used.

Do not assume scraping is working because an API call exists.

### Verify:

1. Source URL selection
2. Official-domain allowlisting
3. request execution
4. authentication/configuration
5. timeout handling
6. retry handling
7. rate-limit handling
8. HTML/document extraction
9. JavaScript-rendered pages where required
10. PDF/document handling
11. content cleaning
12. duplicate detection
13. source metadata
14. publication date
15. effective date
16. document/version identity
17. authority
18. jurisdiction
19. source URL
20. retrieved timestamp
21. extraction errors
22. stale-source handling
23. failed-source handling
24. persistence into the knowledge pipeline
25. downstream retrieval actually using the scraped content

### Critical provenance requirement

Every ingested regulatory source should be traceable to:

`source → retrieved document → normalized content → knowledge item → rule/evidence → business decision`

If any link in this chain is missing, fix it.

### Never do this

If scraping fails:

`scraping failure → LLM guesses`

Instead:

`scraping failure → explicit source/retrieval failure → retry or Knowledge Not Covered`

The user must never receive fabricated regulatory information because a source failed to load.

### Retrieval quality

Test real representative businesses against:

- Central Government sources
- Maharashtra sources
- sector-specific sources
- standards/QCO sources
- scheme sources

Measure whether the correct source is actually retrieved.

Do not merely test whether the endpoint returns HTTP 200.

---

# 10. Compliance accuracy and decision safety

The compliance engine must maintain a strict separation:

### Retrieval

Find relevant candidate knowledge.

### Deterministic applicability

Evaluate:

- thresholds
- conditions
- exemptions
- jurisdiction
- entity type
- activity
- dates
- lifecycle stage
- sector
- other decision-critical variables

### Result

Return one of:

- TRUE / Applicable
- FALSE / Not Applicable
- UNKNOWN / Needs Information
- KNOWLEDGE_NOT_COVERED

### Evidence

Attach:

- authority
- source
- citation/evidence passage
- effective/current version
- jurisdiction
- rule/version identifier

If these cannot be established, lower the trust state rather than inventing them.

---

# 11. Admin verification layer — redesign and repair

The current verification panel is both visually cluttered and functionally unreliable.

Redesign it as a **calm regulatory review workspace**.

## Admin should prioritize

1. What requires review?
2. Which business?
3. Which requirement?
4. What decision did the system produce?
5. Why?
6. What evidence supports it?
7. What does the reviewer need to approve/change?
8. What happens after approval?

Do not display every internal field at once.

Use progressive disclosure.

### Review structure

**Level 1 — Queue**

- business
- requirement
- current status
- risk/review state
- submitted date
- reviewer
- action

**Level 2 — Review**

- business context
- requirement
- proposed determination
- rule explanation
- evidence
- source
- missing facts
- reviewer controls

**Level 3 — Technical trace**

Only on demand:

- AST/rule trace
- retrieval metadata
- source versions
- raw evidence
- internal IDs
- system diagnostics

### Admin actions must persist

When an admin:

- approves
- rejects
- modifies
- verifies
- marks evidence valid
- changes a determination

the change must:

1. call the real backend API
2. persist to the database
3. return the persisted state
4. update the UI from the server response
5. record reviewer identity
6. record timestamp
7. record previous state
8. record new state
9. preserve an audit trail
10. invalidate/recompute affected user results where required

Never show “verified” merely because local React state changed.

---

# 12. Admin ↔ user profile/data connection

Audit the entire relationship between:

`User → Business → Profile Version → Assessment → Requirement → Evidence → Admin Review → User Result`

The same requirement/assessment entity must not silently exist as disconnected frontend objects.

Verify:

- business IDs
- profile version IDs
- assessment IDs
- requirement IDs
- evidence IDs
- reviewer IDs
- decision IDs
- workflow/case IDs

### Required behaviour

If an admin verifies a compliance requirement:

`Admin decision`
→ database
→ assessment/result state
→ user dashboard/compliance page

The user must see the updated state after refresh.

If a business profile changes:

`Profile version`
→ affected assessment
→ affected rules
→ affected results
→ affected dashboard

Do not leave stale results attached to an outdated profile without clearly identifying the version.

---

# 13. Latency and perceived performance

Audit both actual latency and perceived latency.

Measure:

- initial page load
- authentication
- onboarding save
- LLM extraction
- adaptive question generation
- scraping
- retrieval
- assessment
- dashboard
- admin queue
- admin decision
- standards search
- schemes search
- document upload/verification

### Improve where possible

- parallelize independent requests
- cache safe read-only retrieval
- deduplicate repeated requests
- debounce search
- avoid unnecessary re-renders
- paginate large admin lists
- lazy-load heavy modules
- use skeletons instead of blank screens
- stream only where truthful
- show meaningful progress for genuinely long operations
- never fake progress

The user should always know whether the system is:

- loading
- analyzing
- retrieving
- waiting for a source
- awaiting verification
- complete
- failed

---

# 14. Authentication

Keep current authentication.

Add complete Google authentication.

## Required Google behaviour

- Google sign-in
- secure OAuth callback
- verified email handling
- account creation for new Google users
- existing-account handling
- session creation
- logout
- protected-route handling
- frontend/backend state synchronization
- error handling
- mobile compatibility

### Duplicate email rule

Email identity must be unique.

If a user attempts normal registration using an email that already exists:

> **The user already exists. Please sign in.**

Do not create a duplicate account.

If the email already exists through Google, the normal registration flow must produce the same message.

If an existing account is being accessed through Google, use a secure verified-email/account-linking strategy rather than creating another user record.

### Remove forgot password

Remove/hide forgot-password UI and route references for this stage.

Do not leave dead links or broken navigation.

---

# 15. Google Auth environment handoff

At the end of the implementation, provide a section named:

`GOOGLE AUTH ENVIRONMENT VARIABLES`

The agent must list the **exact environment variable names used by the actual implementation**, not guessed names.

Include:

- variable name
- where it belongs (frontend/backend)
- purpose
- whether secret/public
- local development value format
- production value format
- Google OAuth redirect URI
- authorized JavaScript origins
- any backend callback URL
- any session/JWT-related setting required by the implementation

Never commit client secrets.

Do not invent a variable name merely for documentation; inspect the actual code/config first.

---

# 16. Error and empty-state standard

Every important page must support:

### Loading

Clear skeleton or progress state.

### Empty

Explain what is empty and what the user can do.

### Error

Human-readable error + retry/recovery action.

### Partial data

Show what is known and what is missing.

### Permission denied

Explain access and provide a valid navigation path.

### Unknown record

Never show another record as a fallback.

---

# 17. Testing requirement

Do not finish after visual inspection.

Create or update automated tests for:

### Authentication

- normal sign-in
- normal registration
- duplicate email
- Google sign-in success
- Google sign-in failure
- Google callback
- session persistence
- logout
- protected routes

### Onboarding

- profile save
- business description
- import/export data
- LLM fact extraction
- 0-question case
- 1–5-question cases
- multiple-choice answers
- failed analysis
- retry
- preserved input
- no fabricated result

### Retrieval/scraping

- source success
- source failure
- timeout
- retry
- duplicate content
- invalid source
- source provenance
- evidence persistence

### Compliance

- applicable
- not applicable
- unknown
- knowledge not covered
- evidence missing
- rule version mismatch
- profile change and re-evaluation

### Admin

- queue loading
- review
- approve
- reject
- modify
- persistence
- user-side propagation
- permission denial
- audit history

### UI

- desktop
- tablet
- mobile
- keyboard navigation
- reduced motion
- no horizontal overflow
- no console errors
- no infinite loading

---

# 18. Required final audit

Before declaring completion, produce:

## A. Architecture audit

Explain:

- frontend architecture
- backend architecture
- authentication
- database
- API layer
- LLM layer
- retrieval layer
- Firecrawl/Crawly layer
- regulatory knowledge pipeline
- rule engine
- admin verification
- caching
- state management
- error handling
- observability

For each subsystem:

`Working / Partially Working / Broken / Missing`

Then fix what is fixable.

## B. Data-flow audit

Trace one complete business:

`Registration → Business Profile → Description → Questions → Facts → Retrieval → Scraping → Knowledge → Rules → Assessment → Admin Verification → Dashboard → Compliance`

Prove the IDs and persisted states remain connected.

## C. UX audit

Test a first-time user from registration to result.

The user should not encounter:

- unexplained errors
- excessive questions
- fake information
- dead buttons
- broken back navigation
- blank pages
- confusing states
- accidental duplicate actions
- unnecessary waiting

## D. Visual audit

Review every route.

Fix:

- clutter
- inconsistent spacing
- bad typography
- excessive pills
- excessive cards
- arbitrary colours
- dark blocks inconsistent with theme
- dense admin layouts
- unclear hierarchy
- poor empty states
- inconsistent controls
- mobile overflow

---

# 19. Definition of done

Do not declare the task complete until:

- previous dashboard interaction model is restored with real data
- schemes context panel is light and visually consistent
- standards correctly support both matched and no-match states
- onboarding normally asks no more than 4–5 adaptive questions
- adaptive questions are decision-critical
- scraping is proven end-to-end
- source provenance is preserved
- compliance decisions remain deterministic
- missing knowledge is not fabricated
- admin verification persists to the database
- verified admin decisions propagate to the user
- profile/assessment/result IDs remain connected
- latency bottlenecks are addressed
- Google Auth is implemented
- duplicate email registration is handled correctly
- forgot password is removed
- every important route has loading/empty/error states
- automated tests cover critical paths
- build passes
- no critical console errors remain
- no critical broken routes remain
- the final environment-variable handoff is documented
- the task log is updated after every completed task

The final product should feel **calm, premium, fast, trustworthy and understandable**.

The user should feel:

> “ComplyWise understands my business, asks only what matters, shows me what actually applies, explains why, and never pretends to know something it cannot verify.”
