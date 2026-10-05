# ComplyWise — Standards, Schemes, Source Provenance & Analysis UX Hardening

## 0. Purpose

This is the implementation specification for a **focused functional hardening pass** on the existing ComplyWise codebase.

The product already has the major architecture, deterministic applicability flow, tenant/assessment/profile-version model, provider rotation, Crawlee acquisition, retrieval adapters, standards/schemes sections, and prior regression coverage.

Do **not** redesign the product.
Do **not** rewrite the architecture.
Do **not** turn this into a broad cleanup/refactor.

The goal is to make the current system materially more trustworthy and demo-ready by fixing:

1. generic/over-broad standards and scheme matching;
2. missing or misleading source links;
3. weak evidence/provenance binding;
4. AST/application logic that is too generic;
5. generic explanations that are not grounded in actual business facts;
6. obvious cross-assessment/stale-template data contamination;
7. onboarding starter-profile placement;
8. the long analysis transition UX;
9. LLM prompts/structured output contracts that allow unsupported claims.

Use the existing architecture and fix the underlying causes rather than adding company-specific patches.

---

# 1. Non-negotiable engineering rules

## Preserve

Keep the existing:

- Django modular monolith;
- Next.js App Router frontend;
- PostgreSQL;
- current authentication;
- current business/assessment/profile-version model;
- deterministic applicability engine;
- AST-based rule evaluation;
- CIR/result model;
- Crawlee acquisition abstraction;
- SerpApi search adapter;
- Gemini rotation + OpenAI final fallback;
- existing retrieval adapters;
- current visual design language;
- existing tenant and assessment isolation;
- existing browser/regression test intent.

Do not replace functioning subsystems just because they could be implemented differently.

## Avoid

Do not:

- add microservices;
- add another database;
- introduce repository/factory/DI layers without a concrete need;
- replace Engine 2 with an LLM;
- create company-specific `if/else` rules;
- hardcode VoltEdge or any other demo business;
- invent legal requirements to improve demo output;
- fabricate source URLs;
- fabricate evidence excerpts;
- manufacture “official” source links from a domain homepage;
- label an item mandatory/applicable merely because semantic similarity is high;
- delete historical tests or weaken their assertions;
- perform unrelated cleanup while fixing these bugs.

Every code change should have a direct relationship to one of the failures in this specification.

---

# 2. Start with a repository audit

Before editing:

1. inspect the source tree;
2. trace the actual standards pipeline;
3. trace the actual schemes pipeline;
4. trace source/evidence/provenance persistence;
5. trace AST creation and evaluation;
6. trace LLM prompt construction and response validation;
7. trace onboarding layout/state;
8. trace the final-question → analysis → workspace transition;
9. inspect current regression tests for standards, schemes, retrieval, evidence, onboarding and workspace generation.

Create a short internal audit ledger:

| Area | Current path | Root cause | Planned fix | Regression |
|---|---|---|---|---|
| Standards | ... | ... | ... | ... |
| Schemes | ... | ... | ... | ... |
| Provenance | ... | ... | ... | ... |
| AST | ... | ... | ... | ... |
| LLM | ... | ... | ... | ... |
| Onboarding | ... | ... | ... | ... |
| Analysis UX | ... | ... | ... | ... |

Do not begin broad edits before locating ownership of each behavior.

---

# 3. Primary problem: source provenance is not trustworthy enough

## Current failure pattern

Some standards/schemes have no visible evidence/source link.

Others have a source link, but it redirects to a generic government homepage or a root domain instead of the actual document/page from which the result was derived.

This is not acceptable for a compliance product.

A source shown to the user must be the **actual source record used for the result**, not merely a government-looking URL.

## Required source contract

Every evidence-backed standards/schemes result should carry, where available:

- `source_id`;
- `source_url`;
- `canonical_url`;
- resolved/final URL;
- source title;
- issuing authority;
- source domain;
- document/page title;
- content type;
- retrieved timestamp;
- publication date if available;
- effective/current date if available;
- source version/hash if available;
- acquisition method;
- evidence excerpt;
- evidence location such as section/page/heading when available;
- source status;
- provenance/origin;
- whether the source was actually reviewed/validated.

Use existing evidence/source models when they already support this. Add the smallest necessary fields only if a real gap exists.

Do not create a parallel provenance model merely for UI convenience.

## Link rule

The UI must prefer:

1. exact source document/page URL;
2. exact canonical source URL;
3. exact document URL with a fragment/anchor when one exists.

It must **not** silently downgrade to:

- ministry homepage;
- department homepage;
- portal root;
- generic search page;
- generic Google result;
- vendor landing page.

If there is no trustworthy exact source URL, show:

> Source unavailable / source link not recorded

rather than a misleading generic link.

## Important distinction

A `source_url` is not proof of legal applicability.

A source only establishes where the evidence came from.

The applicability status must still be supported by rule/eligibility logic.

---

# 4. Evidence must be attached to the result, not the explanation

Audit whether current result explanations are generated from:

- actual evidence records;
- generic knowledge strings;
- LLM free-form output;
- source metadata only.

Fix the path so the UI can trace:

```text
Result
  ↓
Decision / eligibility rationale
  ↓
Evidence record(s)
  ↓
Exact source
  ↓
Exact excerpt / location
```

Do not allow the explanation layer to invent supporting text.

If a source exists but no usable excerpt/location was captured, say so explicitly.

Never create a fake quotation from the business description and label it as source evidence.

The existing distinction between requirement basis, planning basis, and contextual guidance must remain intact.

---

# 5. Standards matching must become narrower and evidence-driven

## Core principle

The system must distinguish:

1. statutory/mandatory requirement;
2. standard referenced by a law/regulation;
3. recognized voluntary/industry standard;
4. contextual quality/safety guidance;
5. candidate/unreviewed standard.

Do not flatten these into one “applicable standards” category.

## Required result states

Use the current model where possible, but the conceptual states must remain distinguishable:

- `REVIEWED_APPLICABLE`
- `REVIEWED_NOT_APPLICABLE`
- `CONTEXTUAL`
- `CANDIDATE`
- `NEEDS_REVIEW`

Do not call an item “mandatory” unless a validated legal source/rule supports the mandatory linkage.

Do not call a contextual ISO/IATF-style item a statutory obligation.

Do not convert “industry relevance” into “legal requirement”.

## Matching dimensions

Evaluate standards candidates against structured business facts such as:

- industry/sector;
- product category;
- product type;
- manufacturing process;
- intended use;
- jurisdiction;
- activity;
- electrical/mechanical/chemical characteristics where known;
- vehicle category/use case where relevant;
- standard scope;
- mandatory-reference relationship;
- certification-only relevance;
- exclusions.

Broad words such as manufacturing, industrial, electronics, automotive, or factory must not be sufficient on their own to promote a standard to applicable/mandatory.

## Example regression direction

For an EV battery-pack manufacturer profile, the system should be capable of discovering/reviewing standards genuinely relevant to:

- lithium-ion traction battery packs/systems;
- EV propulsion battery/cell safety;
- relevant vehicle-category electrical/REESS requirements;

while clearly distinguishing between:

- product/test/safety standards;
- vehicle regulations/reference documents;
- certification/quality-management standards;
- legally mandatory requirements.

Do not simply add hardcoded EV battery standards to make one demo look good.

The matcher must find relevant standards from source scope and business facts.

At implementation time, verify current authoritative sources rather than copying stale URLs or outdated legal assumptions.

---

# 6. Schemes matching must stop using generic category similarity as “applicable”

## Current failure mode

The scheme section can produce a large number of “applicable” schemes where the evidence is only something like:

> manufacturing MSME

That is not enough.

A scheme should not be marked applicable merely because the business belongs to a broad sector.

## Required states

Distinguish at least:

- `ELIGIBLE / EVIDENCE_SUPPORTED`;
- `LIKELY_ELIGIBLE / SOME_FACTS_UNVERIFIED`;
- `CANDIDATE / RELEVANT_BUT_NOT_ESTABLISHED`;
- `NOT_ELIGIBLE`;
- `EXPIRED_OR_NOT_CURRENT`;
- `NEEDS_REVIEW`.

Use the existing data model where possible. Do not force a schema migration if the current model can represent the distinction cleanly.

## Eligibility evidence

Determine which actual facts support a promoted scheme, for example:

- state;
- district/category;
- enterprise classification;
- new/existing unit;
- project stage;
- turnover;
- investment;
- sector;
- product type;
- export status;
- employee count;
- ownership/category where legally relevant;
- technology type;
- application window;
- scheme-specific cap or threshold.

The result should be explainable as:

> Matched because: Maharashtra + manufacturing + existing unit + stated investment band.

Not:

> Applicable because you are a manufacturing MSME.

## Negative gating

Explicitly suppress or downgrade schemes when a required fact contradicts the scheme.

Examples:

- export incentive when the business explicitly says it does not export;
- “new project” scheme when the business is already operating, unless the scheme explicitly covers expansion;
- household/residential programme when the subject is a business;
- scheme restricted to cell/gigafactory manufacturing when the company only assembles battery packs;
- scheme requiring a specific certification or registration when that fact is unknown.

When a contradiction exists, semantic similarity must not override it.

---

# 7. Fix the AST/applicability engine if it is too generic

The current behavior suggests some matching is driven by broad semantic/category similarity rather than precise decision predicates.

Inspect AST construction, normalization, and evaluation.

## Required principle

AST evaluation must be based on typed facts and explicit predicates, not raw paragraph similarity.

Prefer:

```text
ALL(
  state == MAHARASHTRA,
  activity IN [...],
  employee_count >= 20,
  exports == false
)
```

over a generic semantic score.

## AST capabilities to verify

Ensure the existing engine correctly supports concepts already needed by the product, including:

- boolean facts;
- explicit false/negative facts;
- numeric comparisons;
- ranges;
- enumerations;
- membership;
- nested `ALL` / `ANY`;
- `NOT`;
- jurisdiction;
- date validity;
- activity/product scope;
- unknown values;
- conflicting values;
- source/reference linkage.

Use three-valued logic:

- TRUE;
- FALSE;
- UNKNOWN.

Do not collapse UNKNOWN into FALSE.

Do not let an LLM silently fill UNKNOWN with a guess.

## Candidate generation vs decision

It is reasonable for search/LLM/retrieval to generate candidates.

It is not reasonable for candidate relevance alone to become a deterministic decision.

Keep:

```text
Business facts
→ candidate retrieval
→ scope/filtering
→ AST evaluation
→ evidence binding
→ final status
```

LLM may help extract canonical facts, expand search concepts, and explain validated output.

LLM must not silently replace AST applicability.

---

# 8. Harden LLM prompts and structured outputs

Do not build one giant prompt.

Keep responsibilities separated.

## Business fact extraction

Return only canonical facts and confidence/uncertainty.

Do not return legal conclusions from this step.

## Candidate interpretation

Return structured candidate concepts, not final statutory decisions.

## Explanation generation

Input only:

- validated business facts;
- deterministic decision;
- validated evidence;
- validated source metadata;
- validated scheme/standard status.

The explanation must not introduce:

- new thresholds;
- new deadlines;
- new forms;
- new fees;
- new authorities;
- new URLs;
- new legal obligations.

Every factual claim presented as evidence-backed must be traceable to an input evidence/source record.

## Validation

Reject or downgrade model output when:

- a URL was not present in supplied source records;
- an evidence quote was not present in supplied excerpts;
- a mandatory/applicable claim has no deterministic/rule support;
- a numerical threshold is unsupported;
- the model returns an unknown source or citation ID;
- source metadata does not match the record.

Prefer structured validation errors over silently accepting questionable output.

---

# 9. Fix generic explanations

Current explanations can drift into canned phrases that do not describe the actual company.

Every explanation should be generated from actual known facts.

Avoid:

> Relevant because you are a manufacturing business.

Prefer a fact-grounded form such as:

> Relevant because the profile identifies a Maharashtra manufacturing unit with 86 employees, lithium-ion traction battery-pack assembly, imported cells/BMS components, and an industrial plant.

Only include facts actually present in the current assessment snapshot.

Never copy facts from another assessment.

Never invent missing facts.

---

# 10. Fix stale/cross-business generated content

The current demo exposed a serious data-quality symptom:

A VoltEdge document referenced a wage register for **64 employees** even though the current profile states **86 employees**.

Treat this as a potential cross-assessment/template-staleness defect.

Trace:

```text
Current assessment
→ profile snapshot
→ document generation/template
→ stored document metadata
→ UI rendering
```

Verify that:

- generated document text is derived from the current assessment snapshot;
- template variables are resolved from the current business/assessment context;
- cached document previews are scoped correctly;
- prior assessment values cannot leak into a new assessment;
- default/demo text cannot overwrite live values;
- document regeneration uses the intended profile version.

Add a regression test that changes a business fact between assessments and proves the new document uses the new value.

Do not fix this by replacing `64` with `86`.

Fix the data path.

---

# 11. Known VoltEdge-style regressions to investigate

Use the current EV battery manufacturer scenario as a **regression case**, not as a hardcoded special case.

Observed problems to reproduce or explain include:

- false-positive smart-meter CRS result;
- IEC result with an unrelated “commercial outbound apparel shipments” explanation;
- hazardous-waste explanation mentioning “spent dyes” and other unrelated waste;
- missing explicit battery-waste/EPR-focused result despite battery manufacturing context;
- standards dominated by unrelated/contextual generic items;
- missing exact source links;
- scheme list containing export/new-project/household/general-category candidates presented too strongly;
- employee-count mismatch in generated document output.

Each must be fixed generically.

---

# 12. Source discovery and acquisition rules

The search system may return candidates.

Search snippets are not authoritative evidence.

A promoted source should follow:

```text
candidate
→ destination validation
→ actual acquisition
→ content validation
→ authority/domain validation
→ exact URL capture
→ evidence extraction
→ provenance record
→ result binding
```

Do not create a source record merely because SerpApi returned a search result.

Do not treat a generic government homepage as equivalent to the actual source document.

Use the existing SerpApi + Crawlee architecture.

Do not reintroduce Firecrawl.

---

# 13. Source hierarchy for the matcher

## Standards

Prefer authoritative source classes appropriate to the object:

1. official BIS / standards catalogue / official LIMS;
2. official ministry/regulator/department publication;
3. official vehicle/testing authority publications where relevant;
4. official standards body publication;
5. approved/authorized certification source for certification information;
6. reputable secondary source only for candidate discovery, never as the sole basis for mandatory status.

## Schemes

Prefer:

1. official government scheme portal;
2. ministry/department notification;
3. official government policy / operational guideline;
4. official application/eligibility portal;
5. authoritative government agency document.

Do not rely on generic commercial scheme-listing pages to establish eligibility.

Verify current dates/status because policy details change.

---

# 14. Source-link UI behavior

In standards and schemes cards/details, show a clear source block containing:

- source title;
- issuing authority;
- exact source link;
- source type;
- evidence status;
- last retrieved date when available.

Example:

```text
Source
Bureau of Indian Standards
IS 17855:2022 — ...
View source ↗
Retrieved: 04 Oct 2026
Evidence: validated
```

When exact source data is unavailable:

```text
Source
Not recorded for this contextual result.
```

Do not create a fake URL.

The click must open the stored exact source.

Do not route users to the platform's own generic `/government`, `/standards`, `/schemes`, or root domain when they asked to inspect the underlying evidence.

---

# 15. Standards/schemes API contract

Inspect the API responses.

Ensure the backend sends structured provenance rather than forcing the frontend to reconstruct it.

Conceptually:

```json
{
  "id": "...",
  "status": "REVIEWED_APPLICABLE",
  "title": "...",
  "summary": "...",
  "reasoning": "...",
  "source": {
    "id": "...",
    "title": "...",
    "url": "...",
    "authority": "...",
    "retrieved_at": "...",
    "evidence_status": "VALIDATED"
  },
  "evidence": [
    {
      "excerpt": "...",
      "location": "...",
      "source_id": "..."
    }
  ],
  "matched_facts": [
    "state",
    "business_activity",
    "product_type"
  ]
}
```

Adapt to actual repository contracts instead of creating duplicate DTOs unnecessarily.

The key is:

**source and evidence must be first-class response data.**

---

# 16. Improve standards/scheme ranking

Ranking should prioritize:

1. evidence-backed exact match;
2. rule/scope match;
3. authority quality;
4. currentness;
5. fact specificity;
6. relevance.

It should penalize:

- generic sector-only matches;
- missing source;
- stale source;
- broad semantic similarity;
- contradictions with explicit business facts;
- unsupported mandatory claims.

A generic “manufacturing MSME” scheme must not outrank a highly specific EV-battery/manufacturing incentive merely because the generic record has more keywords.

---

# 17. Onboarding starter profile placement

The onboarding page currently shows default/starter profiles too prominently at the top.

Change the information hierarchy.

## Primary path

At the top of onboarding, show first:

1. actual onboarding questions/forms;
2. business profile inputs;
3. editable answers;
4. progression/navigation.

## Secondary convenience path

After the primary onboarding content, place:

> “Need a head start? Use a starter profile”

with the existing editable starter-profile cards below.

Starter profiles must remain:

- optional;
- editable;
- clearly suggested;
- non-authoritative;
- never automatically accepted as verified facts;
- never used as a substitute for manual registration credentials.

Do not delete the starter feature.

Do not hide it.

Only change the visual hierarchy and layout.

Add/update browser regression coverage for the new ordering.

---

# 18. Analysis/loading transition UX

After final onboarding answers are submitted, the system can legitimately take significant time because it performs work such as:

- business understanding;
- question/answer consolidation;
- deterministic evaluation;
- source discovery;
- retrieval;
- evidence processing;
- workspace generation.

The user currently experiences a long transition without enough context.

Add a clear, persistent message in the analysis state:

> **Your compliance analysis can take up to 1–2 minutes. Please keep this page open while we verify sources and build your workspace.**

Use “may take up to 1–2 minutes” if exact runtime cannot be guaranteed.

Add a compact progress/status line where practical, for example:

```text
Understanding your business
Checking applicable rules
Reviewing standards and schemes
Building your workspace
```

Do not fake granular progress percentages.

Only display stages that correspond to real orchestration steps.

The existing timeout/budget must remain correct; this is UX communication, not a timeout workaround.

---

# 19. Performance: do not merely make the wait look better

Instrument the analysis flow.

Measure at least:

- business understanding latency;
- adaptive-question generation latency;
- answer submission latency;
- source discovery latency;
- acquisition latency;
- retrieval latency;
- deterministic evaluation latency;
- synthesis/LLM latency;
- workspace persistence latency;
- total orchestration latency.

Do not remove real analysis work just to shorten the spinner.

Do not start duplicate competing orchestration requests.

Reuse existing persisted-result/read-after-completion behavior.

---

# 20. Regression suite required

Add focused tests for the root causes.

## Provenance

- exact source URL is returned;
- generic domain homepage is never substituted;
- source title/authority match the stored source;
- evidence excerpt belongs to the same source;
- missing source is honestly represented.

## Standards

- generic manufacturing similarity does not create a mandatory standard;
- voluntary/contextual standard remains contextual;
- product-specific standard can be surfaced when facts match;
- explicit negative facts can suppress a candidate;
- source provenance is preserved.

## Schemes

- export-only benefit is suppressed when `exports=false`;
- new-project scheme is downgraded when the unit is already operating;
- business does not receive residential-only programme as applicable;
- sector-only similarity remains a candidate/needs-review state;
- supported eligibility claims list the actual matched facts.

## AST

- TRUE / FALSE / UNKNOWN are preserved;
- numeric threshold comparisons work;
- `NOT` works with explicit false facts;
- unknown required fact does not become a positive decision;
- jurisdiction/product/activity scopes are respected.

## Cross-assessment

- generated document uses the current assessment snapshot;
- changing employee count in a new assessment changes generated content;
- no prior-assessment fact leaks into standards/schemes explanations.

## Onboarding

- starter profiles render below the primary form;
- starter suggestions remain editable;
- manual credentials remain manual.

## Analysis UX

- analysis state appears after final submission;
- wait message is visible;
- existing loading/error/completion behavior remains correct;
- duplicate analysis requests are not introduced.

---

# 21. Real regression scenario matrix

Re-run at least these business categories after the focused fixes:

1. manufacturing;
2. restaurant/food service;
3. IT services;
4. warehouse/logistics;
5. healthcare/clinic;
6. EV battery/component manufacturing (VoltEdge-style scenario).

For each, inspect:

- compliance specificity;
- standards specificity;
- scheme specificity;
- source links;
- evidence excerpts;
- provenance;
- explanation grounding;
- negative facts;
- loading/analysis UX.

Do not judge success by “more results”.

Judge success by:

> **fewer unsupported results + more source-backed relevant results + clearer uncertainty.**

---

# 22. Quality gates

The change is not done when the UI merely looks better.

It is done when:

- no misleading generic source links remain in affected sections;
- source links resolve to the actual stored evidence source;
- contextual results are clearly contextual;
- mandatory/applicable labels have deterministic/rule support;
- scheme matches have fact-based eligibility reasoning;
- AST evaluation is materially more specific than broad semantic/category similarity;
- LLM output cannot invent unsupported sources/claims;
- VoltEdge-style false positives are removed generically;
- the employee-count/document contamination class is fixed;
- onboarding starter profiles are visually secondary;
- analysis state clearly communicates expected wait time;
- focused tests pass;
- existing functional/browser tests still pass.

---

# 23. Validation commands

Use the repository's actual commands, but run the relevant equivalents of:

```bash
# backend focused tests
pytest ...

# frontend/unit tests
npm test ...

# type checking
npm run typecheck

# production build
npm run build

# browser/regression suite
npx playwright test ...

# static checks
ruff ...
eslint ...
```

Also inspect:

```bash
git diff
git status
```

Do not stop at “tests passed”.

Inspect at least one real response payload for:

- standards;
- schemes;
- source provenance;
- evidence;
- analysis state.

Verify representative authoritative source links manually or with bounded tests.

---

# 24. Implementation reporting

When finished, update:

- `task-progress.md`;
- the existing architecture documentation if an actual data-flow changed;
- relevant tests.

Also produce a concise engineering report with:

### Fixed

Exact root causes and files changed.

### Not fixed

Anything requiring:

- new authoritative knowledge ingestion;
- expert legal review;
- unavailable external provider configuration;
- unavailable remote RAG internals.

### Validation

Exact test/build/browser results.

### Remaining risks

Only real unresolved issues.

Do not claim legal completeness.

Do not claim every current government rule or scheme is covered merely because the demo works.

---

# 25. Final engineering principle

The product's credibility depends on this invariant:

> **A result must be as specific as the evidence and business facts justify — never more specific.**

Therefore:

```text
Search discovers.
Acquisition captures.
Evidence records.
AST/rules decide.
LLM explains.
UI exposes provenance.
Unknown remains unknown.
```

Do not optimize for impressive-looking result counts.

Optimize for:

**correct scope + exact source + explicit evidence + deterministic status + honest uncertainty.**
