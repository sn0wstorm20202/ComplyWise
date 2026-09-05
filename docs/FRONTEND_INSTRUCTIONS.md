# FRONTEND_INSTRUCTIONS.md — ComplyWise

## Hackathon Frontend Build & Backend Wiring

**Version:** 1.0  
**Product:** ComplyWise  
**Problem Statement:** 26130  
**Target:** Working prototype matching the supplied visual reference

---

## 1. Objective

Build one coherent product, not a collection of static screens.

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
→ Schemes & Benefits
→ Standards
→ Regulatory Updates + AI Assistant
```

The UI must be wired to real backend responses as soon as those APIs exist.

---

## 2. Visual Direction

Use the supplied reference as the visual language:
- premium enterprise SaaS;
- light neutral surfaces;
- restrained blue/lavender accent;
- thin borders;
- soft shadows;
- strong whitespace;
- clean typography;
- compact information density;
- restrained rounded corners;
- semantic status colors.

Do not overload the design with neon, giant gradients, glassmorphism, decorative clutter or excessive pills.

---

## 3. Golden Rule

> **The backend is the source of regulatory truth.**

The frontend may calculate presentational values, but must not implement applicability rules.

Bad:
```ts
if (turnover > SOME_LEGAL_THRESHOLD) ...
```

Good:
```ts
const requirements = await api.requirements.list(businessId)
```

---

## 4. API Client

Put all API access under:

```text
frontend/lib/api/
```

Use typed functions such as:

```text
api.businesses.get()
api.profile.get()
api.onboarding.questions()
api.onboarding.answer()
api.analysis.start()
api.analysis.get()
api.requirements.list()
api.requirements.get()
api.documents.list()
api.documents.upload()
api.workflows.list()
api.workflows.completeStep()
api.calendar.list()
api.schemes.list()
api.standards.query()
api.updates.list()
api.assistant.ask()
api.dashboard.get()
```

Do not scatter raw `fetch()` calls across components.

---

## 5. Shared Status Types

```ts
export type ApplicabilityStatus =
  | "APPLICABLE"
  | "NOT_APPLICABLE"
  | "NEEDS_INFORMATION"
  | "CONFLICT_REVIEW"
  | "UNVERIFIED";

export type WorkflowStatus =
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

export type DocumentStatus =
  | "NOT_UPLOADED"
  | "UPLOADED"
  | "PROCESSING"
  | "VERIFIED"
  | "ISSUE"
  | "NEEDS_REVIEW"
  | "EXPIRED"
  | "REPLACEMENT_REQUIRED";
```

Never rename these statuses just for visual convenience.

---

## 6. Screen Rules

### Welcome
Explain the value and start the journey.

### Business Profile
Collect core business context. Do not expose every possible variable in one huge form.

### Products & Activities
Large natural-language input. Derived classifications are visibly marked as derived.

### Smart Questions
Render the questions returned by the backend. The backend decides which question matters next.

### Regulatory Analysis
Show real analysis state. Never fake progress percentages.

### Initial Results
Four core metrics:
- Applicable Requirements;
- Potential Schemes;
- Document Requirements;
- Upcoming Deadlines.

### Dashboard
Reproduce the visual hierarchy of the supplied design:
- Compliance Readiness;
- Action Required;
- Due Soon;
- On Track;
- Benefits Identified;
- Priority Actions;
- Upcoming Deadlines;
- Recent Regulatory Changes.

### Compliance
Requirement list + filters + statuses.

### Requirement Detail
Must answer:
1. Why does this apply?
2. What do I need?
3. What do I do next?
4. Where did this come from?

### Documents
Show requirement-linked documents, validation status and expiry.

### Workflows
Show step progression and blocked dependencies.

### Calendar
Show only backend-supplied deadlines/renewals or explicit user events.

### Schemes
Show potential eligibility and missing information without promising government sanction.

### Standards
Natural-language product-to-standard lookup.

### Regulatory Intelligence + AI Assistant
Show updates plus source-grounded answers with evidence/verification.

---

## 7. Evidence UI

Use a compact evidence panel.

Collapsed:
```text
✓ Source-backed
```

Expanded:
```text
Authority
Source title
Page / section
Effective date
Verification status
Open source
```

Do not rely only on an AI confidence percentage.

---

## 8. Uncertainty UI

Render these distinctly:

```text
NEEDS_INFORMATION → More information needed
CONFLICT_REVIEW   → Review required
UNVERIFIED        → Verification required
NOT_APPLICABLE    → Not applicable
APPLICABLE        → Applicable
```

Never convert unknown/conflict/unverified to not-applicable in UI logic.

---

## 9. Document AI UI

Show:

```text
Processing → Extracting → Checking → Result
```

Possible result:
- PASS;
- ISSUE;
- NEEDS_REVIEW.

Always display:

> AI pre-validation is not official government approval.

---

## 10. Error / Loading / Empty States

Every screen must have:
- loading;
- empty;
- error;
- retry.

Examples:

```text
We couldn't load this information.
[Try again]
```

AI unavailable:

```text
AI assistance is temporarily unavailable.
Your verified compliance data is still available.
```

---

## 11. Component Library

Create reusable components:

```text
MetricCard
RequirementCard
StatusBadge
PriorityBadge
EvidenceCard
SourcePanel
DeadlineCard
WorkflowStepper
DocumentRow
EmptyState
ErrorState
LoadingSkeleton
```

Components receive data. They do not perform regulatory reasoning.

---

## 12. Frontend State

Server state:
- business;
- profile;
- onboarding;
- analysis;
- requirements;
- documents;
- workflows;
- calendar;
- schemes;
- standards;
- updates;
- assistant.

Local UI state:
- tabs;
- filters;
- open/closed panels;
- dialogs;
- temporary form state.

Do not duplicate regulatory truth in local state.

---

## 13. Build Order

Keep implementation grouped into major tasks:

1. App shell + API client + shared components.
2. Onboarding + profile + product + smart questions.
3. Analysis + results + dashboard.
4. Compliance + requirement detail + documents + workflows + calendar.
5. Schemes + standards + updates + assistant.
6. Integration polish + responsive states + evidence UI.

After each major task, update `PROJECT_EXECUTION.md`.

---

## 14. Definition of Done

A frontend task is done when:
- the screen exists;
- navigation works;
- API is wired;
- loading/success/error/empty states exist;
- backend statuses render correctly;
- evidence is visible where relevant;
- no regulatory logic is duplicated;
- visual style matches the reference;
- the main user journey works.

---

## 15. Final UX Principle

Make a complicated regulatory system feel simple:

```text
Tell us about your business
        ↓
Answer a few relevant questions
        ↓
See what applies
        ↓
See why
        ↓
See what you need
        ↓
Do the work
```
