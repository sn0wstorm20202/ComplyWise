# ComplyWise — Codebase Structuring & Maintainability Playbook

## Purpose

This document defines the engineering standard for cleaning the current ComplyWise repository.

It is intentionally **not** a production-hardening checklist.

The target is a codebase that is:

- coherent
- easy to navigate
- internally consistent
- explicit about ownership
- practical to maintain
- straightforward for a senior engineer to inherit
- understandable years later by the original developer

The repository already contains a significant amount of working product architecture. The job is to **organize and clarify it**, not throw it away.

---

# 1. Engineering Standard

The desired feeling when opening the repository is:

> "I can understand where things belong."

Not:

> "There are lots of abstractions."

Good engineering is not measured by the number of folders, classes, interfaces, patterns, or layers.

The standard is **low cognitive load**.

A developer should be able to answer:

- Where does a request enter?
- Which service owns this use case?
- Where is the business rule?
- Where is the provider call?
- Where is the data persisted?
- What module owns this concept?
- Where should the next change be made?

without searching blindly.

---

# 2. Architectural Principles

## 2.1 One obvious home for each responsibility

Examples:

| Responsibility | Preferred ownership |
|---|---|
| HTTP routing | URL configuration |
| Request validation | Serializer/request schema |
| API orchestration | Application/service layer |
| Business rules | Domain layer |
| LLM provider call | Provider/integration layer |
| Firecrawl API call | Provider/integration layer |
| Retrieval | Knowledge/intelligence layer |
| Rule evaluation | Applicability/domain layer |
| Persistence | Django models/query services |
| UI rendering | Frontend components |
| Browser API communication | Frontend API clients |

Avoid duplicate implementations.

---

## 2.2 Boring entry points

API views should be easy to read.

A normal request should look conceptually like:

```text
request
  ↓
authentication
  ↓
request validation
  ↓
application service
  ↓
domain/integration work
  ↓
response serialization
```

If a view contains 200 lines of business logic, the design has probably drifted.

---

## 2.3 Business logic should not hide in helpers

A generic `utils.py` often becomes an architectural landfill.

Avoid files containing unrelated functions such as:

```text
parse_date()
build_prompt()
calculate_threshold()
format_currency()
get_scheme()
call_firecrawl()
serialize_business()
```

These functions may all be useful, but they have different responsibilities.

Place them with the domain they serve.

---

# 3. Backend Mental Model

The backend should be understandable as these broad layers:

```text
                    API
                     │
                     ▼
              Application Layer
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
     Domain Logic          Provider Layer
          │                     │
          │              ┌──────┼──────┐
          │              ▼      ▼      ▼
          │           LLM   Firecrawl  Other APIs
          │
          ▼
       Persistence
```

This is a mental model, not a command to create four artificial packages.

Use the existing Django modular architecture where it already gives a sensible boundary.

---

# 4. Backend Domain Boundaries

The current backend contains domain applications such as:

```text
accounts
businesses
onboarding
knowledge
evidence
applicability
requirements
documents
workflows
calendar
schemes
standards
ingestion
assistant
dashboard
regulatory_updates
```

Each domain should have a clear responsibility.

### Accounts

Owns:

- authentication-related domain behavior
- user/account models
- account serializers and APIs
- account permissions

### Businesses

Owns:

- business identity
- business profile
- profile versioning
- assessment ownership/linkage where applicable

### Onboarding

Owns:

- onboarding state
- adaptive/smart question planning
- question instances
- answer collection
- business-context gathering

### Knowledge

Owns:

- regulatory knowledge representation
- retrieval-related knowledge structures
- knowledge metadata

### Evidence

Owns:

- source evidence
- provenance
- supporting material

### Applicability

Owns:

- rule AST
- applicability logic
- evaluation
- decision runs
- three-valued logic where implemented

### Requirements

Owns:

- normalized compliance requirements produced by assessment

### Documents

Owns:

- compliance document/checklist representations

### Workflows

Owns:

- compliance action/process tracking

### Calendar

Owns:

- reminders
- deadlines
- scheduled compliance activities

### Schemes

Owns:

- scheme matching/data and related services

### Standards

Owns:

- standards/BIS-related data and matching

### Ingestion

Owns:

- source discovery
- web ingestion
- Firecrawl integration
- parsing/normalization pipeline

### Assistant

Owns:

- interactive assistant/copilot behavior

### Dashboard

Owns:

- aggregation/presentation-oriented backend services for dashboard data

### Regulatory Updates

Owns:

- update/discovery-related regulatory change data

These descriptions are boundaries, not permission to create duplicate abstractions.

---

# 5. The Core Assessment Flow

The backend should make the assessment pipeline traceable.

Conceptually:

```text
Business Profile
      ↓
Assessment
      ↓
Business Understanding
      ↓
Adaptive Questions
      ↓
Answers
      ↓
Canonical Business Context
      ↓
Regulatory Discovery
      ↓
Retrieval
      ↓
Deterministic Applicability
      ↓
LLM fallback where required
      ↓
Compliance Intelligence
      ↓
Requirements / Documents / Workflows /
Schemes / Standards / Calendar
      ↓
Dashboard
```

Every transition should have an identifiable owner in code.

---

# 6. AI/LLM Architecture

The LLM should not be a mysterious global dependency.

A future developer should be able to search the repository and quickly locate:

```text
LLM provider
Prompt construction
Structured output validation
Question generation
Business understanding
Compliance synthesis
Fallback logic
Assistant
```

A useful conceptual separation is:

```text
Prompt construction
      ↓
Provider invocation
      ↓
Response validation
      ↓
Domain interpretation
```

Do not combine all four responsibilities into one giant function.

---

# 7. Web / Firecrawl Architecture

A developer should be able to follow:

```text
Official source
      ↓
Discovery / ingestion trigger
      ↓
Firecrawl provider
      ↓
Fetched content
      ↓
Parser
      ↓
Normalizer
      ↓
Evidence / knowledge
      ↓
Validation / versioning
      ↓
Indexing
      ↓
Retrieval
```

Firecrawl-specific API details should remain at the integration boundary.

Domain logic should not know Firecrawl request payload details.

---

# 8. Retrieval Architecture

A clean conceptual model is:

```text
Query
 ↓
Query understanding
 ↓
Metadata filtering
 ↓
Dense retrieval ─┐
                 ├→ Fusion
BM25 retrieval ──┘
 ↓
Reranking
 ↓
Context blending
 ↓
Evidence selection
 ↓
Rule evaluation / LLM reasoning
```

Not every application request must execute every stage.

Do not hide this architecture behind a function named `search_everything()`.

---

# 9. Deterministic Applicability Architecture

Applicability is one of the core technical differentiators of ComplyWise.

Keep it explicit.

```text
Business Context
      ↓
Candidate Rules
      ↓
Rule AST
      ↓
Evaluator
      ↓
TRUE / FALSE / UNKNOWN
      ↓
Decision Run
      ↓
Requirement
      ↓
Evidence
```

Keep this logic separate from the LLM provider.

The LLM can interpret business context.

The rule engine should remain the explicit computational layer for rules that are represented deterministically.

---

# 10. LLM Fallback Architecture

Current SIH prototype behavior includes fallback for businesses/rule domains not sufficiently covered by the current knowledge base.

The architecture should remain conceptually:

```text
Retrieval
    ↓
Sufficient usable knowledge?
    ├── YES → deterministic path
    └── NO  → LLM fallback
                     ↓
              structured result
                     ↓
              normal workspace
```

This is a prototype capability.

Do not leak temporary prototype implementation details into unrelated layers.

The fallback should still use structured domain objects where possible.

---

# 11. Models Should Represent Concepts

Good model names describe durable domain concepts.

Prefer:

```text
Assessment
BusinessProfile
ProfileVersion
Evidence
DecisionRun
Requirement
Workflow
Document
Scheme
Standard
DiscoveryRun
SmartQuestionInstance
```

Avoid generic models such as:

```text
Data
Record
Object
Entry
Information
Result
```

unless the concept really is generic.

---

# 12. Database Rule

Do not automatically create:

```text
repository.py
dao.py
manager.py
service.py
selector.py
factory.py
adapter.py
```

for every model.

That creates ceremony rather than clarity.

Use the simplest layer that makes the responsibility obvious.

---

# 13. Frontend Mental Model

Use:

```text
Route
  ↓
Page/feature composition
  ↓
Feature components
  ↓
Feature state/hooks
  ↓
API client
```

Avoid page files that simultaneously contain:

- API calls
- complex business decisions
- validation
- animation orchestration
- state machines
- reusable UI
- formatting logic
- data transformation

---

# 14. Frontend Feature Boundaries

Group code around meaningful product capabilities, such as:

```text
accounts
onboarding
businesses
assessment
compliance
documents
workflows
schemes
standards
calendar
assistant
admin
```

A feature should own its internal components and logic.

Shared code belongs in shared locations only when it is genuinely shared.

---

# 15. Shared Code Rule

A `shared` or `common` module must not become a dumping ground.

Before adding code there, ask:

> "Is this truly shared infrastructure?"

Examples that may belong there:

- API client infrastructure
- date utilities
- authentication primitives
- generic UI primitives
- common error types

Examples that probably do not:

- restaurant-specific business logic
- regulatory rule evaluation
- scheme-specific transformations
- onboarding-specific prompts

---

# 16. Naming Rules

Names should communicate intent.

Prefer:

```python
assessment_context
business_profile
discovery_run
applicability_decision
candidate_requirements
```

over:

```python
ctx
data
obj
result2
temp
processed_data
new_result
```

Likewise for files.

Prefer:

```text
assessment_orchestrator.py
question_planner.py
firecrawl_provider.py
applicability_evaluator.py
```

over:

```text
helper.py
misc.py
utils2.py
new_service.py
final_service.py
```

---

# 17. Avoid "Final", "New", "Old", "Temp"

Do not maintain files such as:

```text
service_new.py
service_final.py
service_v2.py
service_old.py
component_fixed.tsx
api_new.py
```

There should be one authoritative implementation.

If two implementations genuinely need to coexist, name them by the actual boundary:

```text
legacy_provider.py
openai_provider.py
firecrawl_provider.py
```

---

# 18. Duplicate Logic Policy

Before introducing a helper:

1. Search for an existing implementation.
2. Check whether the existing implementation has a clear owner.
3. Reuse it if appropriate.
4. If it is badly placed, move it first.
5. Do not create a second implementation merely because the first is inconvenient.

When consolidating code, preserve semantics.

---

# 19. Dead Code Policy

Remove code that is proven unused:

- obsolete imports
- abandoned routes
- unreachable branches
- stale compatibility code
- commented-out implementation blocks
- obsolete feature flags
- duplicated old components

Do not remove code just because it is unfamiliar.

Trace references first.

---

# 20. Dependency Review

During cleanup, look specifically for:

### Bad

```text
dashboard → onboarding
documents → frontend
domain → provider-specific SDK
model → unrelated feature service
component → random global utility
```

### Better

```text
dashboard
   ↓
application service
   ↓
domain/application modules
```

and:

```text
domain service
   ↓
provider abstraction
   ↓
provider implementation
```

Dependencies should follow responsibilities.

---

# 21. Comments

Comments should explain:

- why something is unusual
- why a dependency exists
- why a workaround is necessary
- what a non-obvious invariant means

Do not write comments that merely repeat the code.

Bad:

```python
# increment count
count += 1
```

Good:

```python
# Assessment versions are immutable after evaluation because
# requirements and evidence must remain reproducible.
```

---

# 22. Documentation Strategy

Keep documentation limited to useful documents.

Recommended:

```text
docs/
├── architecture/
│   ├── backend-architecture.mmd
│   └── backend-architecture.md
├── engineering/
│   └── codebase-structure.md
└── product/
    ...
```

Do not create dozens of documents that nobody maintains.

Documentation should explain decisions, not restate every file.

---

# 23. Refactoring Safety

For each structural move:

```text
Find references
    ↓
Move/consolidate
    ↓
Update imports
    ↓
Run focused tests
    ↓
Run full tests
    ↓
Inspect diff
```

Never do a large blind rename without reference validation.

---

# 24. Quality Gates

Before declaring the cleanup complete:

### Backend

- Django checks pass
- unit tests pass
- API tests pass
- import graph is sane
- no accidental circular imports
- provider calls remain isolated
- database migrations unchanged unless truly necessary

### Frontend

- build passes
- TypeScript checks pass
- lint passes where configured
- key routes render
- API clients remain functional
- no broken imports

### Full system

- authentication works
- onboarding works
- assessment creation works
- adaptive questions work
- LLM calls work
- Firecrawl/integration paths work
- deterministic applicability still works
- LLM fallback still works
- dashboard works
- documents/workflows/schemes/standards still load

---

# 25. Refactoring Order

Do not start with cosmetic renaming.

Use this order:

```text
1. Inventory
2. Architecture map
3. Dependency problems
4. Oversized modules
5. Logic misplaced across boundaries
6. Duplicate implementations
7. Shared utilities cleanup
8. Configuration cleanup
9. Dead code
10. Naming normalization
11. Documentation
12. Full validation
```

This avoids repeatedly moving the same code.

---

# 26. What Not To Optimize

Do not optimize this cleanup for:

- line-count reduction
- number of files
- maximum abstraction
- maximum test count
- maximum number of interfaces
- "enterprise" appearance
- a specific framework pattern
- theoretical purity

Optimize for:

**understandability.**

---

# 27. Long-Term Test

Imagine this repository is opened again in 2036.

A competent engineer should be able to understand:

```text
How does onboarding work?
Where is an assessment created?
Where does the LLM get called?
Where does Firecrawl get called?
Where is regulatory knowledge stored?
How does retrieval work?
Where is applicability evaluated?
How does fallback work?
Where are requirements persisted?
How does the dashboard assemble its data?
```

That is the ultimate test of this cleanup.

---

# 28. Final Principle

The goal is not:

> "Make the code look sophisticated."

The goal is:

> **"Make the code tell a coherent story."**

A strong codebase makes the architecture visible through:

- names
- boundaries
- dependency direction
- module ownership
- consistent APIs
- predictable file structure
- focused services
- explicit integrations
- useful documentation

That is the standard for the ComplyWise cleanup.
