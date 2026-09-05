# COMPLYWISE — INITIAL PROJECT START PROMPT

You are the lead implementation agent for the ComplyWise hackathon project.

Read these documents FIRST, in this order, before modifying code:

1. `PRD_v2.0.md`
2. `TRD_v2.0.md`
3. `FRONTEND_INSTRUCTIONS.md`
4. `PROJECT_EXECUTION.md`

Also inspect the repository that currently exists. Do not assume a repository structure that is not actually present.

---

## 1. Mission

Initialize the ComplyWise project as a **working hackathon prototype** for:

**Problem Statement ID: 26130**

> Efficiency in streamlining industrial approvals, compliance processes, and access to government support services.

The goal is NOT to build a production-scale enterprise platform.

The goal is to establish a clean, executable foundation on which the team can rapidly build:

```text
Welcome
→ Business Profile
→ Products & Activities
→ Smart Questions
→ Regulatory Analysis
→ Initial Results
→ Dashboard
→ Compliance
→ Requirement Detail
→ Documents
→ Workflows
→ Calendar
→ Schemes
→ Standards
→ Regulatory Intelligence / AI Assistant
```

The visual reference supplied by the project owner is the UI direction.

The implementation must feel like one coherent product.

---

## 2. Non-Negotiable Architecture

Use a simple **modular monolith**.

Backend:

- Python 3.12+
- Django
- Django REST Framework
- PostgreSQL
- pgvector where needed

Frontend:

- Next.js
- React
- TypeScript

AI:

- OpenAI API
- Model names/configuration through environment variables

Deployment target:

- Azure

Do NOT introduce:

- microservices
- Kubernetes
- service mesh
- complex distributed infrastructure
- enterprise IAM
- premature scaling architecture
- unnecessary queues/caches
- unnecessary third-party services

Keep the project easy for a six-person hackathon team to understand and modify.

---

## 3. Critical Product Principle

The most important architecture rule is:

```text
Source
 ↓
Evidence
 ↓
Verified Knowledge
 ↓
Structured Rule
 ↓
Deterministic Applicability
 ↓
Business Decision
```

AI/RAG is used for:

```text
Classification
Extraction
Retrieval
Explanation
Natural-language assistance
```

AI/RAG is NOT the final authority for regulatory applicability.

Never implement:

```text
LLM says requirement applies
→ show requirement as fact
```

Instead:

```text
Evidence-backed published rule
→ deterministic evaluator
→ decision
→ explanation/evidence
```

---

## 4. Accuracy Philosophy

We cannot promise 100% legal accuracy.

The engineering objective is to make unsupported AI output difficult to propagate into a compliance result.

The prototype quality target is:

**>90% correctness on the curated implemented regression/golden test set.**

That is a development benchmark, not a claim of nationwide legal accuracy.

Uncertainty must be represented explicitly:

```text
APPLICABLE
NOT_APPLICABLE
NEEDS_INFORMATION
CONFLICT_REVIEW
UNVERIFIED
```

Never convert:

```text
UNKNOWN → FALSE
```

---

## 5. Five Existing Scenarios

These are **regression/demo fixtures**, not product boundaries:

```text
GUJARAT_FOOD
TELANGANA_ELECTRONICS
GUJARAT_TRADE
TAMIL_NADU_AUTO
KARNATAKA_ESDM
```

DO NOT write evaluator logic like:

```python
if scenario == "GUJARAT_FOOD":
    ...
```

Write generic logic:

```python
rules = load_published_rules(context)
results = evaluator.evaluate(rules, context)
```

New industries/states should be added primarily through knowledge data, not new evaluator branches.

---

## 6. First Task: Repository and Project Initialization

Before writing domain features:

### Step A — Inspect

Inspect:

- existing files;
- installed runtimes;
- current git state;
- package managers;
- existing frontend/backend code;
- environment files;
- README;
- tests;
- any existing implementation.

Do not delete useful existing work.

If the repository is empty, initialize the project according to the TRD.

### Step B — Establish structure

Create a clean structure approximately like:

```text
complywise/
├── backend/
├── frontend/
├── docs/
├── knowledge_packs/
├── tests/
├── .env.example
├── README.md
└── .gitignore
```

Use the exact structure from `TRD_v2.0.md` where it is applicable.

Place/maintain:

```text
docs/PRD.md
docs/TRD.md
docs/FRONTEND_INSTRUCTIONS.md
docs/PROJECT_EXECUTION.md
```

The four supplied documents are authoritative. Copy them into the repository if they are not already present.

Do NOT silently rewrite their content during initialization.

---

## 7. Backend Initialization

Create the Django project and modular apps needed by the TRD.

At minimum establish the boundaries for:

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
regulatory_updates
assistant
ingestion
dashboard
```

Do not over-implement every module in this task.

The objective is to establish a healthy project shell with correct boundaries.

The backend should start successfully.

---

## 8. Frontend Initialization

Create the Next.js/React/TypeScript shell.

Establish:

- base layout;
- navigation shell;
- API client location;
- shared UI component location;
- feature folder structure;
- basic route structure.

Do not attempt to finish all fifteen screens during initialization.

The first goal is:

```text
Frontend starts
Backend starts
Frontend can call backend
```

---

## 9. Database Initialization

Create PostgreSQL configuration and initial migration setup.

we are gonna use supabase for databases

Only create foundation models now.

Start with the minimum entities needed for the first vertical slice:

```text
User
Business
BusinessProfileVersion
```

Do not prematurely implement the entire final schema.

The database should migrate cleanly.

---

## 10. API Foundation

Create a working API foundation:

```text
/api/v1/
```

Establish:

- health endpoint;
- authentication foundation;
- business endpoint;
- profile endpoint.

Example:

```text
GET /api/v1/health
GET /api/v1/auth/me
GET /api/v1/businesses
POST /api/v1/businesses
GET /api/v1/businesses/{id}
GET /api/v1/businesses/{id}/profile
```

Do not implement fake regulatory responses just to make endpoints appear complete.

---

## 11. Environment Configuration

Create:

```text
.env.example
```

Include placeholders for:

```text
DJANGO_SECRET_KEY
DJANGO_DEBUG
DATABASE_URL

OPENAI_API_KEY
OPENAI_MODEL
OPENAI_EMBEDDING_MODEL

AZURE_STORAGE_CONNECTION_STRING
AZURE_STORAGE_CONTAINER

FIRECRAWL_API_KEY
```

Do not put real secrets into git.

Do not print secrets during tests.

---

## 12. Health Verification

After implementation, actually run the system.

At minimum:

### Backend
- install dependencies;
- run migrations;
- run tests;
- start Django;
- verify health endpoint.

### Frontend
- install dependencies;
- run type checking/build/lint where configured;
- start Next.js;
- verify root page loads.

### Integration
Verify:

```text
Frontend
   ↓
Backend health endpoint
```

The project is NOT initialized merely because files exist.

---

## 13. Browser Verification

Playwright MCP is available in the development environment.

Use browser automation when a browser-visible behavior exists.

For this initialization task, verify at minimum:

```text
Open frontend
→ page loads
→ app shell renders
→ no obvious runtime error
```

When onboarding UI is implemented later, Playwright should verify the actual flow:

```text
Welcome
→ Business Profile
→ Products
→ Questions
→ Analysis
→ Results
```

Do not use Playwright as a substitute for backend unit/API tests.

Use both where appropriate.

---

## 14. Testing Rule

After every MAJOR feature:

```text
Implement
 ↓
Run automated tests
 ↓
Start relevant services
 ↓
Exercise the API/UI
 ↓
Use Playwright for browser-visible behavior
 ↓
Fix failures
 ↓
Update PROJECT_EXECUTION.md
```

Do not hand the project owner a feature that has merely been coded but not exercised.

---

## 15. Parallel Agent Strategy

Multiple agents MAY be used.

Use parallelization only when work can safely happen independently.

Good parallel split:

```text
Agent A — Backend Foundation
Agent B — Frontend Foundation
Agent C — Test / QA scaffolding
```

After that, synchronize before merging interacting changes.

Do NOT have multiple agents simultaneously edit the same files such as:

```text
settings.py
package.json
core API contracts
shared TypeScript types
PRD/TRD/project execution docs
```

when the edits can conflict.

The lead agent must review parallel-agent output before integration.

Recommended model:

```text
Lead Agent
├── Agent A: Backend
├── Agent B: Frontend
└── Agent C: QA / test scaffolding
        ↓
Lead integrates
        ↓
Run complete test suite
        ↓
Run browser smoke test
```

Parallel agents increase speed; they do NOT remove the need for integration testing.

---

## 16. Coding Rules

Follow these strictly:

### Do not hardcode regulatory truth into:
- React components;
- serializers;
- view functions;
- prompt strings;
- random constants;
- frontend mock data.

### Do not invent:
- regulations;
- government fees;
- deadlines;
- standards;
- applicability conditions;
- official URLs.

### Do not silently:
- convert uncertainty to a negative;
- treat derived classification as user-provided;
- treat AI validation as government approval;
- treat scraped content as verified regulatory truth.

### Keep:
- user input;
- derived values;
- lookup values

as distinct concepts.

---

## 17. Documentation Rule

After the initialization task is genuinely verified, update:

```text
docs/PROJECT_EXECUTION.md
```

Record:

```text
TASK 1 — Foundation
Status: DONE

Implemented:
- ...

Verified:
- ...

Tests:
- ...

Known issues:
- ...

Files changed:
- ...

Next:
- TASK 2 — Knowledge & Applicability Core
```

Do not claim DONE unless the application actually runs.

Do not rewrite old completed history in `PROJECT_EXECUTION.md`.

---

## 18. Stop Conditions

Stop and report instead of making assumptions when:

- an existing implementation conflicts materially with PRD/TRD;
- a dependency is missing;
- database configuration is unavailable;
- a required environment variable is unclear;
- two documents contain a material conflict;
- a regulatory fact is needed but not present in the knowledge base;
- a test exposes an architectural inconsistency.

State:

```text
Issue
Evidence
Impact
Recommended decision
```

Do not silently invent a solution.

---

## 19. Deliverable For This First Run

At the end of this prompt, the repository should have:

```text
✅ backend starts
✅ frontend starts
✅ database configuration exists
✅ initial migrations work
✅ health endpoint works
✅ frontend can reach backend
✅ baseline tests run
✅ browser smoke test passes where applicable
✅ docs copied/organized
✅ PROJECT_EXECUTION.md updated
✅ README explains how to run locally
```

Do NOT start implementing:
- full applicability engine;
- full RAG;
- full document AI;
- all dashboard modules;
- all knowledge packs

in this first initialization task.

Those come next.

---

## 20. Final Response Format

When finished, report only:

### Implemented
What was actually added.

### Tests Run
Exact commands and outcomes.

### Browser Check
What Playwright/browser verification confirmed.

### Known Issues
Only real current issues.

### Files Changed
Major files/folders.

### Next Task
The next major task from `TRD_v2.0.md`.

Then update `docs/PROJECT_EXECUTION.md`.

Do not give a vague “project initialized successfully” without evidence.
