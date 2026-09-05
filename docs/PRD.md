# PRD.md --- ComplyWise

## AI-Powered Industrial Compliance & Standards Intelligence Platform

**Document type:** Product Requirements Document\
**Version:** 2.0\
**Status:** Canonical hackathon build specification\
**Purpose:** Single source of truth for frontend, UX, backend, AI,
knowledge, workflow and demo implementation\
**Target:** SIH / hackathon MVP\
**Primary implementation horizon:** Demo-ready MVP\
**Product:** ComplyWise\
**Audience:** Product team, backend engineers, frontend engineer, UX
designer, AI/RAG engineers, QA, demo team, AI coding agents such as
Codex/Claude Code/Cloud Code

------------------------------------------------------------------------

## 0. How to Use This Document

This PRD defines **what ComplyWise must do and how the complete user
experience should behave**.

It is intentionally shared across the whole team:

-   **Frontend** uses it to implement screens, states, navigation and
    data presentation.
-   **UX** uses it to design the interaction model, progressive
    questioning, hierarchy, empty/error states and visual behavior.
-   **Backend** uses it to implement domain objects, APIs, business
    services, applicability evaluation, evidence, workflows, documents
    and tracking.
-   **AI/RAG** uses it to implement source-grounded retrieval,
    classification assistance and explanation.
-   **QA** uses the acceptance criteria and scenario definitions to
    validate the end-to-end product.
-   **AI coding agents** should treat this document as the product
    contract. Technical implementation details belong in `TRD.md`;
    business framing belongs in `BRD.md`.

### Source hierarchy

The product must follow this hierarchy:

``` text
Research Material
      ↓
Project Decision Log — canonical decisions
      ↓
PRD.md — what the product must do
      ↓
BRD.md + TRD.md
      ↓
Frontend / UX / Backend implementation
```

The project decision log explicitly establishes itself as the canonical
record of team decisions; research documents are supporting evidence
rather than the final source of truth.

------------------------------------------------------------------------

# 1. Executive Summary

ComplyWise is an AI-powered industrial compliance intelligence platform
for Indian businesses.

The platform asks a business owner for the **minimum information that
materially affects compliance**, understands the business context,
evaluates regulatory applicability, retrieves authoritative regulatory
evidence, identifies required documents, generates actionable workflows,
tracks deadlines and renewals, surfaces relevant government schemes,
provides standards intelligence, and offers a source-grounded AI
assistant.

The central product promise is:

> **Tell us what your business does. ComplyWise tells you what applies,
> why it applies, what you need, what to do next, and where the
> information came from.**

The product is intentionally designed as a **generalized dynamic compliance engine**.
The hackathon will not attempt to encode every Indian regulation, but the product
architecture must not be limited to a fixed set of industries or scenarios.
Coverage expands by adding verified regulatory knowledge rather than by writing a
new evaluator for each sector.

The five previously researched scenarios remain as **regression fixtures, golden
test cases and demo validation paths**:

1. Gujarat — Food Processing MSME
2. Telangana — Electronics / Smart Meter
3. Gujarat — Import / Export
4. Tamil Nadu — Auto Components
5. Karnataka — Electronics / ESDM

They are not product boundaries.

The product architecture is therefore **one platform + one business context model
+ one generalized compliance engine + progressively expanding verified knowledge**.

------------------------------------------------------------------------

# 2. Product Vision

## 2.1 Vision

Make industrial compliance understandable and actionable for Indian
businesses by converting fragmented regulatory information into a
personalized, explainable execution plan.

## 2.2 Product thesis

Most businesses do not experience compliance as a collection of isolated
laws. They experience it as a chain:

``` text
Business
→ Product / Activity
→ Location
→ Scale
→ Operating conditions
→ Applicable regulation
→ Required approval
→ Required documents
→ Workflow
→ Submission
→ Tracking
→ Renewal
```

ComplyWise turns this chain into a unified product experience.

## 2.3 Core value proposition

### Before ComplyWise

A business owner must:

-   know which authorities matter;
-   search multiple portals;
-   understand legal thresholds;
-   determine whether a rule applies;
-   discover dependencies between approvals;
-   identify documents;
-   interpret standards;
-   track deadlines;
-   understand schemes;
-   manually reconcile changing regulations.

### With ComplyWise

The owner:

1.  describes the business;
2.  answers only relevant questions;
3.  receives a personalized regulatory landscape;
4.  sees why each requirement applies;
5.  sees evidence and official sources;
6.  prepares documents;
7.  follows guided workflows;
8.  tracks deadlines and renewals;
9.  discovers schemes and standards;
10. asks the assistant questions using the same verified knowledge base.

------------------------------------------------------------------------

# 3. Product Principles

## P1 --- Minimum User Input → Maximum Regulatory Intelligence

The onboarding experience should not behave like a government form.

Collect only variables that can materially affect:

-   applicability;
-   scheme eligibility;
-   standards applicability;
-   document requirements;
-   workflow generation;
-   deadlines/renewals.

The current profile model contains 19 variables, but not every scenario
requires every variable.

## P2 --- Progressive Disclosure

Do not ask all 19 variables at once.

The system should:

1.  collect core profile data;
2.  understand product/activity;
3.  determine which additional variables are decision-relevant;
4.  ask only those questions;
5.  stop asking when sufficient information exists.

## P3 --- Deterministic Applicability, AI-Assisted Understanding

AI may help interpret natural language, classify products, retrieve
evidence and explain results.

The final applicability result must be based on structured, versioned
rules and verified evidence.

The LLM must not independently invent legal applicability.

## P4 --- UNKNOWN Is Not FALSE

If the engine lacks a decision-critical input, it must not silently
assume a negative answer.

The result should be `NEEDS_INFORMATION`, `CONFLICT_REVIEW`, or
`UNVERIFIED` where appropriate.

## P5 --- Explain Every Important Result

The user should be able to answer:

> "Why does this apply to me?"

Every applicable requirement should have an explanation trace.

## P6 --- Evidence Is First-Class

A regulatory result without supporting evidence is incomplete.

Evidence must support relevant facts such as:

-   applicability;
-   threshold;
-   definition;
-   exception;
-   override;
-   fee;
-   deadline;
-   validity.

## P7 --- Current Law Beats Historical Law

Current effective rules must be used for current decisions.

Historical versions remain available for traceability.

## P8 --- Applicability, Workflow and Document Status Are Different

These are three different dimensions.

Example:

``` text
Requirement applicability: APPLICABLE
Workflow: DOCUMENT_PENDING
Document: NOT_UPLOADED
```

They must never be collapsed into one status field.

## P9 --- Workflow Is Data, Not Hardcoded UI

Workflow steps and dependencies must be represented as structured data
so the same application can support different requirements and
scenarios.

## P10 --- Official Source Is Root Authority

Research and secondary sources can support discovery.

Published regulatory facts used for automatic compliance decisions must
ultimately resolve to authoritative evidence.

## P11 --- Transparent Uncertainty Beats False Confidence

When evidence conflicts, classification is ambiguous, or local
applicability cannot be verified, ComplyWise must say so.

## P12 --- One Dynamic Generalized Engine

The engine is generic. The five scenarios are validation fixtures only. New sectors, states, authorities and standards should be added through verified knowledge rather than scenario-specific evaluator code.

------------------------------------------------------------------------

# 4. Target Users

## 4.1 Primary persona --- MSME Owner / Entrepreneur

Typical characteristics:

-   limited regulatory expertise;
-   knows the business, not necessarily the legal terminology;
-   wants to know "what do I need to do?";
-   may not know NIC/HS/BIS classifications;
-   wants actionable next steps;
-   values deadlines and document readiness;
-   needs confidence that information is sourced.

## 4.2 Secondary persona --- Compliance / Operations Manager

Needs:

-   requirement inventory;
-   document repository;
-   workflow status;
-   deadlines;
-   renewals;
-   evidence;
-   auditability;
-   team visibility.

## 4.3 Secondary persona --- Technical / Regulatory Analyst

Needs:

-   source-backed standards information;
-   requirement reasoning;
-   rule/evidence trace;
-   version awareness;
-   verification status.

## 4.4 Internal knowledge maintainer

For the MVP, this role does not require a dedicated admin UI.

Knowledge can be managed using structured JSON/YAML, schema validation,
automated tests, version control and review.

------------------------------------------------------------------------

# 5. MVP Scope

## 5.1 In scope

### Core product

- account/session entry;
- onboarding;
- business profile;
- natural-language product/activity capture;
- adaptive smart questions;
- regulatory analysis;
- initial result summary;
- unified dashboard;
- compliance requirements;
- requirement detail;
- explanation trace;
- evidence/source display;
- document requirements;
- document upload;
- AI document pre-validation;
- workflows;
- checklist;
- calendar;
- deadline and renewal tracking;
- government schemes/benefits;
- standards/BIS intelligence;
- regulatory updates;
- source-grounded AI assistant;
- business profile editing;
- basic settings;
- polished demo journey matching the supplied reference screens.

### Knowledge / engine

- structured regulatory rules;
- versioned knowledge;
- authoritative source capture;
- evidence objects;
- deterministic applicability;
- three-valued/unknown-aware evaluation;
- explanation traces;
- rule tests;
- verification workflow;
- human review for ambiguous/conflicting knowledge;
- knowledge publication gates;
- dynamic ingestion/update pipeline;
- regression fixtures for the five researched scenarios.

### Hackathon quality target

The implemented knowledge coverage should aim for **>90% correctness on the
curated regression/golden test set**. This is an internal prototype quality
target, not a claim of nationwide legal accuracy.

## 5.2 Explicitly out of scope for MVP

-   complete nationwide regulatory coverage;
-   autonomous submission to government authorities;
-   claiming official approval from AI pre-validation;
-   fully autonomous legal interpretation;
-   visual rule-builder/admin CMS;
-   enterprise SSO;
-   complex multi-user permission architecture;
-   full ERP/accounting integration;
-   automated scraping of every government portal;
-   guaranteed real-time synchronization with every authority;
-   replacing NSWS or official government portals;
-   fully automated impact analysis across every customer;
-   complete mobile-native application;
-   production-grade legal advisory service.

------------------------------------------------------------------------

# 6. MVP Scenario Matrix

  -----------------------------------------------------------------------------
  Scenario          State             Business           Primary proof
  ----------------- ----------------- ------------------ ----------------------
  S1                Gujarat           Food Processing    Conditional regulatory
                                      MSME / IQF         applicability
                                      vegetables         

  S2                Telangana         Electronics /      BIS + standards +
                                      Smart meters       scheme logic

  S3                Gujarat           Import/Export      Trade compliance +
                                                         dependency workflow

  S4                Tamil Nadu        Auto components    Environment/safety +
                                                         infrastructure

  S5                Karnataka         Electronics/ESDM / Geography + financial
                                      PCB assembly       decision logic
  -----------------------------------------------------------------------------

The scenario validation research selected these five because together
they maximize demonstrative diversity without building separate engines.

------------------------------------------------------------------------

# 7. End-to-End User Journey

The primary journey is:

``` text
Landing
  ↓
Sign In / Entry
  ↓
Onboarding Introduction
  ↓
Business Information
  ↓
Products & Activities
  ↓
Smart Questions
  ↓
Regulatory Analysis
  ↓
Initial Results
  ↓
Dashboard
  ↓
Compliance
  ↓
Requirement Detail
  ↓
Documents
  ↓
AI Pre-validation
  ↓
Workflow
  ↓
Official Portal / Authority
  ↓
Tracking
  ↓
Calendar / Renewal
```

Parallel discovery paths:

``` text
Dashboard
 ├── Schemes & Benefits
 ├── Standards
 ├── Regulatory Updates
 ├── AI Assistant
 ├── Reports
 └── Business Profile
```

------------------------------------------------------------------------

# 8. Visual / UX Direction

The supplied ComplyWise multi-screen reference is the visual direction
for the product.

It shows a calm, light enterprise SaaS interface with:

-   white and very light neutral surfaces;
-   subtle blue/lavender accents;
-   restrained green/orange/red semantic states;
-   thin borders;
-   soft shadows;
-   rounded cards;
-   generous whitespace;
-   compact typography;
-   clear hierarchy;
-   small but meaningful status indicators;
-   simple line/iconography;
-   structured cards rather than visually noisy dashboards.

The reference contains the intended product journey:

1.  Welcome;
2.  Business Profile;
3.  Products & Activities;
4.  Smart Questions;
5.  Regulatory Analysis;
6.  Initial Results;
7.  Dashboard;
8.  Compliance;
9.  Requirement Detail;
10. Documents;
11. Workflows;
12. Compliance Calendar;
13. Schemes & Benefits;
14. Standards / certification intelligence;
15. Regulatory Intelligence + AI Assistant.

### Important design rule

The reference is **not a pixel-perfect specification**.

Frontend/UX should preserve the interaction hierarchy and overall
premium enterprise taste while improving:

-   spacing;
-   typography;
-   accessibility;
-   responsiveness;
-   interaction states;
-   information density;
-   visual consistency.

Avoid:

-   excessive gradients;
-   neon;
-   glassmorphism overload;
-   oversized decorative illustrations;
-   excessive rounded containers;
-   arbitrary color coding;
-   dashboard clutter.

------------------------------------------------------------------------

# 9. Information Architecture

## 9.1 Primary navigation

The unified application should expose:

1.  Overview
2.  Compliance
3.  Documents
4.  Workflows
5.  Calendar
6.  Schemes & Benefits
7.  Standards
8.  Regulatory Updates
9.  AI Assistant
10. Reports
11. Business Profile
12. Settings

A business switcher should be available where multiple
businesses/projects are eventually supported, but MVP can support one
primary business context.

## 9.2 Navigation behavior

-   Active section must be visually obvious.
-   Breadcrumbs should be used for deep screens.
-   Requirement detail should preserve context back to Compliance.
-   AI Assistant should retain current business context.
-   Documents opened from a requirement should remain linked to that
    requirement.
-   Workflow opened from a requirement should preserve requirement
    context.
-   Calendar events should link back to the source requirement/workflow.

------------------------------------------------------------------------

# 10. Onboarding Requirements

## 10.1 Onboarding introduction

### Goal

Explain the value before requesting business data.

### Required content

-   ComplyWise brand;
-   concise welcome;
-   one-sentence product explanation;
-   key capabilities;
-   Get Started CTA;
-   continue later / sign-in path;
-   trust/help microcopy;
-   progress indication.

### Capability statements

The onboarding should communicate that ComplyWise can:

-   understand the business;
-   identify what applies;
-   build a personalized compliance plan;
-   manage documents;
-   track deadlines;
-   discover government benefits;
-   explore standards/certifications;
-   answer compliance questions.

## 10.2 Business Information

The user should enter core business context.

Candidate fields:

-   business name;
-   legal constitution;
-   lifecycle stage;
-   registered state;
-   district/location;
-   industrial zone status where relevant.

The UI must not force irrelevant fields.

## 10.3 Products & Activities

Prompt:

> What do you manufacture or do?

Allow natural-language input.

Example:

> "We manufacture and pack various food products including spices,
> snacks, ready-to-eat items, pickles and sauces in our processing and
> packaging facility."

The system should extract/derive context without requiring the user to
know:

-   NIC codes;
-   HS codes;
-   BIS standard numbers;
-   regulatory classifications.

### Derived information

The system may produce:

-   product/activity category;
-   potential classification;
-   relevant regulatory domains;
-   candidate standards;
-   candidate requirement packs.

Derived classifications must be clearly distinguished from user-provided
facts.

## 10.4 Smart Questions

The system asks only questions that can materially alter the result.

Example questions from the reference:

-   Do you have a manufacturing/processing unit?
-   Do you employ more than 10 people?
-   Do you export your products?
-   Do you store hazardous chemicals?

Actual questions must be generated from the scenario/rule dependency
model rather than hardcoded as one universal questionnaire.

### Question types

Support:

-   yes/no;
-   single choice;
-   multi-choice;
-   number;
-   currency;
-   location;
-   date;
-   free text;
-   conditional follow-up.

### Question behavior

Every question should ideally communicate why it matters when the user
may reasonably wonder.

Example:

> "Do you generate hazardous waste?"\
> "This helps us determine whether additional environmental requirements
> may apply."

------------------------------------------------------------------------

# 11. Business Profile

## 11.1 Canonical profile variables

The current decision log defines 19 variables:

  ID    Variable
  ----- ------------------------------
  V01   Legal Constitution
  V02   Lifecycle Stage
  V03   State
  V04   District
  V05   Industrial Zone Status
  V06   Product Description
  V07   Annual Turnover
  V08   Plant & Machinery Investment
  V09   Ownership Social Category
  V10   Ownership Gender
  V11   Import/Export Intent
  V12   Export Destination
  V13   Total Worker Count
  V14   Contract Worker Count
  V15   Connected Power Load
  V16   Effluent/Emission Generation
  V17   Hazardous Waste Generation
  V18   E-Commerce Operations
  V19   Multi-State Operations

These variables are not all required for every scenario.

Each may be:

-   CORE;
-   CONDITIONAL;
-   OPTIONAL;
-   NOT NEEDED.

## 11.2 Scenario-specific collection

The knowledge dependency matrix must control onboarding. Questions should be driven by which variables are still decision-relevant for the currently matched knowledge, not by a hardcoded scenario form.

Examples:

-   Gujarat food requires a broad manufacturing profile.
-   Gujarat trade should suppress industrial variables that do not
    materially affect trade applicability.
-   Tamil Nadu auto should surface environmental and workforce
    questions.
-   Telangana electronics should emphasize product/technical/BIS
    variables.
-   Karnataka electronics should surface geographic and investment
    variables.

This prevents questionnaire bloat.

------------------------------------------------------------------------

# 12. Regulatory Analysis

## 12.1 Analysis screen

The analysis screen is a short transition between input and results.

Purpose:

-   reassure the user that their profile is being processed;
-   communicate what is being analyzed;
-   avoid misleading the user into thinking an arbitrary AI model is
    making a legal decision.

Suggested messaging:

> "Building your regulatory landscape..."

Supporting text:

> "Evaluating the rules and requirements relevant to your business
> profile."

Progress should be honest. If backend analysis is synchronous and quick,
the UI should not simulate a long-running process merely for visual
effect.

## 12.2 Analysis pipeline

Conceptually:

``` text
Business Profile
      ↓
Context Normalization
      ↓
Derived / Lookup Classification
      ↓
Scope Pre-filter
      ↓
Rule Evaluation
      ↓
Applicability Results
      ↓
Evidence Attachment
      ↓
Requirement Resolution
      ↓
Document Requirements
      ↓
Workflow Resolution
      ↓
Deadline / Renewal Resolution
      ↓
Scheme / Standards Intelligence
      ↓
Initial Result Summary
```

------------------------------------------------------------------------

# 13. Initial Results

The first results screen should give the user confidence without
overwhelming them.

Reference structure:

-   Applicable Requirements;
-   Potential Schemes;
-   Document Requirements;
-   Upcoming Deadlines.

These are summary counts, not invented numbers.

### Requirements

Count requirements with `APPLICABLE` status.

### Potential Schemes

Count schemes meeting the configured eligibility/possibility criteria.

### Document Requirements

Count unique or requirement-linked document requirements according to
the product's canonical counting rule.

### Upcoming Deadlines

Count deadlines within the configured upcoming window.

The exact window must be defined consistently by the backend.

CTA:

> Enter Dashboard

------------------------------------------------------------------------

# 14. Dashboard

## 14.1 Dashboard objective

The dashboard is the **unified interface**, not the source of truth.

It composes outputs from:

-   business profile;
-   requirements;
-   applicability engine;
-   BIS/standards intelligence;
-   documents;
-   workflows;
-   calendar;
-   notifications;
-   schemes;
-   regulatory updates.

## 14.2 Dashboard hierarchy

### Header

-   greeting;
-   active business;
-   notifications;
-   user/profile control.

### Primary summary

-   Compliance Health / readiness indicator;
-   Action Required;
-   Due Soon;
-   On Track;
-   Benefits Identified.

The exact health-score algorithm should be defined in TRD and must not
imply legal compliance certification.

Use language such as:

> Compliance readiness

rather than:

> Legally compliant.

## 14.3 Priority Actions

Show the most important actions based on:

-   urgency;
-   applicability;
-   missing documents;
-   workflow blockers;
-   deadlines;
-   risk/priority.

Each action must link to the relevant requirement/workflow.

## 14.4 Upcoming Deadlines

Show near-term deadlines with:

-   requirement;
-   date;
-   urgency;
-   status.

## 14.5 Recent Regulatory Changes

Show only changes relevant to the active business profile.

Each update should provide:

-   title;
-   authority;
-   effective date;
-   relevance;
-   impact status;
-   source.

------------------------------------------------------------------------

# 15. Compliance Module

## 15.1 Purpose

Provide the authoritative operational view of the business's
personalized requirements.

## 15.2 Tabs / filters

Recommended:

-   All;
-   Action Required;
-   Due Soon;
-   Compliant / On Track;
-   Not Applicable;
-   Needs Information;
-   Review / Conflict.

## 15.3 Requirement card

Each card should contain:

-   requirement name;
-   authority;
-   category;
-   applicability status;
-   workflow status;
-   document status summary;
-   priority;
-   deadline if known;
-   concise reason;
-   evidence/source indicator.

Example:

``` text
FSSAI License
APPLICABLE · Action Required
High priority

Food processing + relevant business conditions
Deadline: 20 May 2026
```

Do not imply a deadline exists if it is not verified.

------------------------------------------------------------------------

# 16. Requirement Detail

## 16.1 Goal

Answer four questions:

1.  Why does this apply?
2.  What exactly do I need?
3.  What documents do I need?
4.  What do I do next?

## 16.2 Required sections

### A. Requirement header

-   name;
-   status;
-   authority;
-   category;
-   priority;
-   current version/effective date where relevant.

### B. Why this applies

Show a human-readable explanation.

Example structure:

``` text
Business activity
→ Food processing

Product/activity
→ Processed food products

Applicable condition
→ Relevant licensing condition matched

Regulatory result
→ Requirement is applicable
```

### C. What you need

-   documents;
-   fee, if verified;
-   validity;
-   authority;
-   deadline;
-   prerequisite.

### D. Workflow

CTA:

> Start Workflow

### E. Evidence

Show source-backed evidence with:

-   authority;
-   source title;
-   reference;
-   effective date;
-   verification status;
-   link where available.

### F. Uncertainty / review

If the result is not definitive, explain exactly why.

------------------------------------------------------------------------

# 17. Applicability Engine Product Contract

The product must support the following statuses:

  -----------------------------------------------------------------------
  Status                              Meaning
  ----------------------------------- -----------------------------------
  APPLICABLE                          A verified rule matched

  NOT_APPLICABLE                      A verified rule was evaluated and
                                      did not match

  NEEDS_INFORMATION                   A required decision input is
                                      missing

  CONFLICT_REVIEW                     Authoritative rules/evidence
                                      conflict

  UNVERIFIED                          Potential requirement exists but
                                      evidence is insufficient
  -----------------------------------------------------------------------

The UI must not visually treat `NEEDS_INFORMATION`, `CONFLICT_REVIEW` or
`UNVERIFIED` as equivalent to `NOT_APPLICABLE`.

## 17.1 Evaluation trace

Every important result should preserve:

-   rule ID;
-   rule version;
-   variables evaluated;
-   actual values;
-   conditions;
-   match result;
-   exception/override;
-   evidence references.

## 17.2 Rule evaluation behavior

Rules may contain:

-   thresholds;
-   boolean conditions;
-   AND/OR;
-   exceptions;
-   overrides;
-   dependencies;
-   effective dates;
-   jurisdiction;
-   product/activity conditions.

## 17.3 Unknown-aware logic

Conceptually:

``` text
TRUE
FALSE
UNKNOWN
```

Examples:

``` text
TRUE AND UNKNOWN → UNKNOWN
FALSE AND UNKNOWN → FALSE
TRUE OR UNKNOWN → TRUE
FALSE OR UNKNOWN → UNKNOWN
NOT UNKNOWN → UNKNOWN
```

The exact evaluator belongs in TRD, but product behavior must preserve
the distinction.

------------------------------------------------------------------------

# 18. Documents

## 18.1 Purpose

Turn requirements into a requirement-driven document checklist.

Do not ask users to upload every conceivable document during onboarding.

Documents should be surfaced because a requirement/workflow needs them.

## 18.2 Document list

Each document record should display:

-   document name;
-   document type;
-   linked requirement;
-   upload status;
-   validation status;
-   expiry;
-   issue/renewal state.

## 18.3 Upload

Users can:

-   upload a file;
-   view linked requirement;
-   see expected document type;
-   see required fields where appropriate;
-   replace/re-upload.

## 18.4 AI pre-validation

Pipeline:

``` text
Upload
→ File identification
→ OCR / extraction
→ Document classification
→ Field extraction
→ Profile cross-check
→ Requirement-field cross-check
→ Validity/date extraction
→ Validation result
```

Possible validation outcomes:

-   PASS;
-   ISSUE;
-   NEEDS_REVIEW.

The user must see:

> AI pre-validation is not official approval.

The platform must never imply that an AI-validated document has been
accepted by the government authority.

## 18.5 Validation examples

A document may be checked for:

-   expected document type;
-   legal entity name;
-   PAN;
-   IEC;
-   relevant identifier;
-   dates;
-   expiry;
-   consistency with profile;
-   expected fields.

------------------------------------------------------------------------

# 19. Workflow Module

## 19.1 Purpose

Convert an applicable requirement into an actionable sequence.

## 19.2 Conceptual workflow

A generic requirement workflow may include:

``` text
Identified
→ Documents Required
→ Prepared
→ Uploaded
→ Pre-validated
→ Correction
→ Ready
→ Submitted
→ Tracking
→ Completed
→ Renewal
```

Not every requirement must use every state.

## 19.3 Workflow step data

Each step conceptually contains:

-   step ID;
-   step name;
-   sequence;
-   dependencies;
-   required document IDs;
-   external portal/authority link;
-   statutory deadline if known;
-   processing SLA if verified;
-   status.

## 19.4 Dependency types

Keep distinct:

### Regulatory / applicability dependency

Example:

> Rule applies only when a specific business condition is true.

### Workflow execution dependency

Example:

> APEDA registration cannot proceed until IEC is verified.

These relationships must not be merged.

## 19.5 Example trade workflow

``` text
Business Profile
→ Import/Export Intent = YES
→ Trade requirement identified
→ IEC requirement
→ IEC verified
→ AD Code / downstream trade workflow unlocked
→ Submission
→ Tracking
```

The system must lock downstream steps when a required prerequisite is
incomplete.

------------------------------------------------------------------------

# 20. Calendar

## 20.1 Purpose

Convert deadlines and validity dates into actionable time-based
information.

## 20.2 Calendar event types

-   statutory deadline;
-   submission deadline;
-   renewal;
-   reminder;
-   workflow milestone.

## 20.3 Event behavior

Every calendar event should link back to:

``` text
Calendar Event
→ Requirement
→ Workflow
→ Evidence / source
```

## 20.4 Renewal

Renewal information should be derived from verified validity/renewal
knowledge.

Do not invent renewal cycles.

------------------------------------------------------------------------

# 21. Schemes & Benefits

## 21.1 Purpose

Identify government schemes/incentives that may be relevant to the
business.

## 21.2 Scheme states

Recommended:

-   Potentially Eligible;
-   More Information Needed;
-   Not Eligible;
-   Verified Eligible where evidence supports it.

Do not label a scheme "eligible" if key evidence is missing.

## 21.3 Scheme card

Display:

-   scheme name;
-   authority;
-   eligibility summary;
-   potential benefit;
-   confidence;
-   reasons;
-   missing information;
-   source;
-   view details.

## 21.4 Benefit calculation

Where a scheme contains deterministic financial logic, the system may
calculate an indicative benefit.

The UI must clearly distinguish:

-   rule-based estimate;
-   official sanction/approval.

Example:

> Estimated benefit based on configured scheme rules. Final eligibility
> and sanction are determined by the competent authority.

------------------------------------------------------------------------

# 22. Standards / BIS Intelligence

## 22.1 Purpose

Help users discover relevant Indian Standards and certification/testing
requirements.

## 22.2 User experience

The user should be able to ask:

-   What standard applies to my product?
-   Is my product covered by a QCO?
-   What testing is required?
-   What certification route is relevant?
-   What documents are needed?
-   What changed in the standard?

## 22.3 Product-driven lookup

The user should not need to know the IS number.

Example:

``` text
“We manufacture smart electricity meters.”
        ↓
Product understanding
        ↓
Candidate standard
        ↓
Relevant QCO lookup
        ↓
BIS requirement
        ↓
Testing/certification workflow
```

## 22.4 Knowledge item

Conceptually include:

-   standard code;
-   title;
-   scope;
-   amendments;
-   QCO information;
-   source;
-   version;
-   verification status.

## 22.5 RAG answer requirements

Every answer should distinguish:

-   FACT;
-   SOURCE;
-   AI INTERPRETATION;
-   VERIFICATION REQUIRED.

If retrieval confidence/evidence is insufficient, the assistant must not
guess.

------------------------------------------------------------------------

# 23. Regulatory Updates

## 23.1 Purpose

Show regulatory changes that are relevant to the active business.

## 23.2 Update card

Include:

-   change title;
-   authority;
-   affected requirement;
-   effective date;
-   severity/relevance;
-   summary;
-   source;
-   action required.

## 23.3 Change handling

Authoritative source states may include:

-   updated;
-   superseded;
-   expired;
-   withdrawn;
-   conflicting.

Linked knowledge should be flagged for review.

The product should not silently continue treating known-superseded
evidence as current production authority.

------------------------------------------------------------------------

# 24. AI Assistant

## 24.1 Purpose

Provide contextual, source-grounded answers about the user's compliance
landscape.

## 24.2 Context

The assistant should know the active:

-   business profile;
-   scenario;
-   requirements;
-   documents;
-   workflows;
-   standards;
-   regulatory updates;
-   evidence.

## 24.3 Example questions

-   Why is this requirement applicable to me?
-   What documents are missing?
-   What is my next deadline?
-   Which schemes may apply?
-   What standards are relevant to my product?
-   What changed recently?
-   What do I need before submitting this application?

## 24.4 Answer structure

Prefer:

``` text
Short answer

Why this applies
- ...

What you should do
1. ...
2. ...

Source
- Authority
- Source / reference
- Effective date

Verification
- Verified / Verification Required
```

## 24.5 Safety behavior

The assistant must not:

-   invent legal requirements;
-   fabricate sources;
-   treat unverified knowledge as authoritative;
-   override deterministic applicability results without explicit
    review;
-   claim government approval.

------------------------------------------------------------------------

# 25. Reports

MVP reports should focus on useful summaries rather than enterprise
reporting.

Potential report views:

-   compliance readiness summary;
-   open actions;
-   upcoming deadlines;
-   missing documents;
-   applicable requirements;
-   scheme opportunities;
-   regulatory changes.

Export can be added if time permits.

------------------------------------------------------------------------

# 26. Business Profile Editing

Users must be able to update their business profile.

When material variables change, the system should be capable of
re-running the affected regulatory analysis.

Examples:

-   turnover changes;
-   worker count changes;
-   product changes;
-   export intent changes;
-   location changes;
-   process changes.

The resulting plan must reflect the new profile rather than retaining
stale applicability silently.

------------------------------------------------------------------------

# 27. Knowledge Architecture --- Product Requirements

## 27.1 Knowledge lifecycle

Knowledge records must support:

``` text
DRAFT
→ VALIDATION_PENDING
→ UNDER_REVIEW
→ APPROVED
→ PUBLISHED
→ SUPERSEDED
→ ARCHIVED / REJECTED
```

Only `PUBLISHED` knowledge can affect production applicability.

## 27.2 Ownership/audit metadata

Important knowledge records should track:

-   created_by;
-   reviewed_by;
-   approved_by;
-   created_at;
-   reviewed_at;
-   approved_at;
-   published_at.

## 27.3 Versioning

A published rule must not be silently overwritten.

Important fields:

-   rule ID;
-   version;
-   effective_from;
-   effective_until;
-   status;
-   evidence references.

Historical versions remain available for traceability.

## 27.4 Knowledge packs

Related:

-   requirements;
-   rules;
-   documents;
-   workflows;
-   evidence;
-   tests

may be grouped into a versioned Knowledge Pack.

Example:

``` text
GUJARAT_FOOD_V1
TELANGANA_ELECTRONICS_V1
TRADE_GUJARAT_V1
TN_AUTO_V1
KARNATAKA_ESDM_V1
```

The engine decision should be traceable to the knowledge-pack revision
used.

## 27.5 Knowledge authoring

MVP does not require an admin UI.

Recommended process:

``` text
Structured JSON/YAML
→ Schema Validation
→ Automated Tests
→ Human Review
→ Git / Version Control
→ Publish
```

Regulatory thresholds, conditions, exceptions, fees and incentives must
live in the knowledge layer, not application-specific code.

------------------------------------------------------------------------

# 27A. Dynamic Knowledge Acquisition & Verification

The knowledge system is a core product capability. It must support progressively
adding verified regulations without changing the applicability engine.

```text
Official Source / API / Firecrawl / Crawlee / Manual Source
        ↓
Source Capture + Versioning
        ↓
PDF/HTML Normalization
        ↓
OCR / Text Extraction
        ↓
Claim Extraction
        ↓
Evidence Linking
        ↓
Verification
        ↓
Rule / Requirement Structuring
        ↓
Boundary + Regression Tests
        ↓
Human Review (when required)
        ↓
PUBLISH
```

### Verification layers

1. source authenticity;
2. extraction correctness;
3. semantic claim verification;
4. cross-source consistency;
5. deterministic rule validation;
6. executable rule tests;
7. human review for unresolved ambiguity/conflict;
8. publication gate.

Source acquisition is not source verification. Scraping a page successfully does
not make its claims authoritative.

### Runtime safety rule

Only `PUBLISHED` knowledge may affect compliance decisions.

### Change handling

```text
Source change detected
→ new source version
→ changed claims
→ impact analysis
→ verification
→ rule tests
→ review/approval
→ publish
```

A source change must never directly mutate production compliance rules.

# 28. Evidence Model

Every published regulatory fact should ultimately resolve to
authoritative evidence.

An evidence object should conceptually contain:

-   evidence ID;
-   authority;
-   source title;
-   source location;
-   publication/update date;
-   effective date;
-   retrieved date;
-   relevant excerpt/section reference;
-   verification status;
-   linked rule/requirement;
-   version metadata.

The product should display source provenance without overwhelming the
normal user.

Advanced users should be able to inspect the evidence trail.

------------------------------------------------------------------------

# 29. Regulatory Decision Reproducibility

Every engine evaluation should be reproducible.

A decision record should conceptually contain:

-   decision ID;
-   business/profile reference;
-   evaluation timestamp;
-   evaluated rule IDs;
-   evaluated rule versions;
-   results;
-   evidence references;
-   knowledge-pack revision.

The system should be able to answer:

> "Which rule version produced this result?"

This is especially important when regulations change.

------------------------------------------------------------------------

# 30. Human Review

Human review is a valid product outcome.

Trigger review when:

-   authoritative sources conflict;
-   evidence is unavailable;
-   classification is ambiguous;
-   local applicability cannot be verified;
-   expert interpretation is required.

The product should communicate:

> "We could not verify this conclusively from the available
> authoritative evidence."

rather than displaying an invented definitive answer.

------------------------------------------------------------------------

# 31. Regulatory Rule Testing

Every critical applicability rule must have executable tests.

Tests should include where relevant:

-   positive case;
-   negative case;
-   exact threshold;
-   just below threshold;
-   just above threshold;
-   exception;
-   override;
-   missing-input / UNKNOWN;
-   effective-date boundary.

A knowledge update must not be published if required regression tests
fail.

------------------------------------------------------------------------

# 32. Functional Requirements

## FR-001 --- Account Entry

The system shall provide an entry path allowing a user to start or
resume the product experience.

## FR-002 --- Onboarding

The system shall provide an introductory onboarding screen explaining
the product's major capabilities.

## FR-003 --- Business Profile

The system shall capture the canonical business profile variables
required for the active scenario.

## FR-004 --- Adaptive Questions

The system shall display only decision-relevant questions based on the
current profile and scenario.

## FR-005 --- Natural Language Activity Input

The system shall accept natural-language descriptions of
products/activities.

## FR-006 --- Context Extraction

The system shall derive useful structured context from natural-language
product/activity descriptions where supported.

## FR-007 --- Variable Provenance

The system shall distinguish user-provided, derived and lookup values.

## FR-008 --- Regulatory Analysis

The system shall evaluate the active business profile against applicable
published rule packs.

## FR-009 --- Applicability Status

The system shall support APPLICABLE, NOT_APPLICABLE, NEEDS_INFORMATION,
CONFLICT_REVIEW and UNVERIFIED.

## FR-010 --- Explanation Trace

The system shall preserve an explanation trace for applicable and
review-relevant decisions.

## FR-011 --- Evidence

The system shall attach authoritative evidence to published regulatory
results.

## FR-012 --- Requirements

The system shall present personalized requirements derived from the
applicability engine.

## FR-013 --- Requirement Detail

The system shall explain why a requirement applies and what the user
needs to do.

## FR-014 --- Documents

The system shall generate requirement-linked document requirements.

## FR-015 --- Document Upload

The system shall allow users to upload requirement-linked documents.

## FR-016 --- Document Classification

The system shall classify uploaded documents where supported.

## FR-017 --- Document Extraction

The system shall extract configured fields from uploaded documents.

## FR-018 --- Document Pre-validation

The system shall produce PASS, ISSUE or NEEDS_REVIEW outcomes for
supported document validations.

## FR-019 --- Workflow Generation

The system shall generate structured workflows for applicable
requirements.

## FR-020 --- Workflow Dependencies

The system shall prevent downstream workflow execution when configured
prerequisites are incomplete.

## FR-021 --- Calendar

The system shall create calendar events for verified deadlines and
renewals.

## FR-022 --- Renewal Tracking

The system shall surface upcoming renewals based on verified validity
information.

## FR-023 --- Schemes

The system shall identify potentially relevant schemes and benefits.

## FR-024 --- Scheme Confidence

The system shall communicate when scheme eligibility is provisional or
missing information.

## FR-025 --- Standards Intelligence

The system shall provide product-contextual standards/BIS intelligence
for supported scenarios.

## FR-026 --- AI Assistant

The system shall provide contextual source-grounded answers.

## FR-027 --- Regulatory Updates

The system shall surface relevant regulatory changes.

## FR-028 --- Dashboard

The system shall provide a unified dashboard composing module outputs.

## FR-029 --- Profile Re-analysis

The system shall support re-analysis when material business profile
information changes.

## FR-030 --- Versioned Rules

The system shall evaluate the correct effective rule version for the
relevant application/business date.

## FR-031 --- Knowledge Status

Only published knowledge shall influence production applicability.

## FR-032 --- Human Review

The system shall support escalation of ambiguous/conflicting/unverified
cases.

## FR-033 --- Reproducibility

The system shall retain enough decision metadata to reproduce the basis
of an evaluation.

## FR-034 --- Auditability

The system shall preserve knowledge ownership and publication metadata.

## FR-035 --- Rule Tests

Critical rule packs shall have executable regression tests.

------------------------------------------------------------------------

# 33. Non-Functional Requirements

## NFR-001 --- Correctness

Deterministic rule evaluation must be reproducible.

## NFR-002 --- Explainability

Important decisions must be explainable through structured traces and
evidence.

## NFR-003 --- Traceability

Requirements must be traceable to rules and evidence.

## NFR-004 --- Version Awareness

Regulatory rules must be date/version aware.

## NFR-005 --- Security

Business data and uploaded documents must not be publicly exposed.

## NFR-006 --- Privacy

Sensitive identifiers should not be collected unless necessary for the
MVP decision flow.

## NFR-007 --- Reliability

The application should degrade gracefully when an AI provider or
retrieval service fails.

## NFR-008 --- AI Failure Safety

AI failure must not silently become a false regulatory conclusion.

## NFR-009 --- Performance

Onboarding and normal dashboard interactions should feel responsive.
Long-running analysis should expose meaningful loading/progress states.

## NFR-010 --- Accessibility

Core navigation and form interactions should be keyboard accessible and
readable.

## NFR-011 --- Maintainability

Regulatory rules must be maintainable independently of application
logic.

## NFR-012 --- Testability

Rules and core domain services must be independently testable.

## NFR-013 --- Observability

Important engine decisions and failures should be logged with sufficient
context for debugging.

## NFR-014 --- Determinism

Given identical profile, rule versions, knowledge pack and evidence, the
deterministic applicability result should remain reproducible.

------------------------------------------------------------------------

# 34. Security & Privacy Requirements

## 34.1 Data minimization

Do not collect:

-   unnecessary identity data;
-   unnecessary bank details;
-   unnecessary government identifiers;
-   unnecessary precise location data.

The onboarding profile should focus on variables that alter the
regulatory architecture.

## 34.2 Uploaded documents

Documents must:

-   be access-controlled;
-   be associated with the correct business;
-   retain validation metadata;
-   not be publicly exposed;
-   be deletable/replaceable subject to system policy.

## 34.3 AI provider handling

The implementation must define what data is sent to external AI
providers and minimize unnecessary transmission.

## 34.4 Audit trail

Record important:

-   profile changes;
-   knowledge changes;
-   rule publication;
-   review;
-   document validation;
-   engine decisions.

------------------------------------------------------------------------

# 35. Error and Edge Cases

## E1 --- Missing decision-critical information

Show:

> More information needed

Explain exactly what is missing.

## E2 --- Conflicting authoritative sources

Show:

> Review required

Do not silently select one source.

## E3 --- Ambiguous product

Ask a targeted clarifying question.

## E4 --- Low retrieval confidence

Return:

> Verification Required

## E5 --- Superseded evidence

Flag the affected knowledge for review and do not silently present it as
current authority.

## E6 --- Expired document

Show document status separately from requirement applicability.

## E7 --- Document mismatch

Example:

> PAN in uploaded document does not match the business profile.

Show the specific issue.

## E8 --- Workflow prerequisite incomplete

Lock downstream step and explain the blocker.

## E9 --- No applicable requirements found

Do not show an empty dashboard.

Explain that no verified applicable requirements were identified within
the currently supported knowledge coverage and show any
missing-information/coverage caveat.

## E10 --- Out-of-scope business

Clearly communicate that the MVP knowledge coverage does not fully
support the business rather than pretending to provide nationwide
coverage.

## E11 --- AI service unavailable

Core deterministic compliance functionality should remain usable where
possible.

------------------------------------------------------------------------

# 36. Status Model

## 36.1 Applicability

``` text
APPLICABLE
NOT_APPLICABLE
NEEDS_INFORMATION
CONFLICT_REVIEW
UNVERIFIED
```

## 36.2 Workflow

Recommended:

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

## 36.3 Document

Recommended:

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

These dimensions are independent.

------------------------------------------------------------------------

# 37. Priority Model

Requirements may have:

-   HIGH;
-   MEDIUM;
-   LOW.

Priority should reflect configured product logic such as:

-   legal/operational criticality;
-   deadline proximity;
-   workflow blockage;
-   user action requirement.

Priority must not be confused with applicability.

------------------------------------------------------------------------

# 38. Compliance Health / Readiness

The dashboard may display a readiness score for user orientation.

However:

> **A readiness score is a product metric, not a legal certification.**

The score should consider signals such as:

-   applicable requirements;
-   completed workflows;
-   document readiness;
-   overdue actions;
-   upcoming deadlines.

The exact formula belongs in TRD.

Avoid presenting:

> "You are 82% legally compliant."

Prefer:

> "Compliance readiness: 82%"

with supporting explanation.

------------------------------------------------------------------------

# 39. Regression / Demo Validation Journeys

The five researched journeys remain important as validation fixtures, not product boundaries.

## S1 — Gujarat Food Processing

Use to validate food-sector applicability, state context, documents, workflow, deadlines and schemes.

## S2 — Telangana Electronics

Use to validate product classification, standards/BIS/QCO reasoning and certification/testing paths.

## S3 — Gujarat Import / Export

Use to validate trade lookup, IEC dependency and downstream workflow ordering.

## S4 — Tamil Nadu Auto Components

Use to validate workforce, manufacturing, environment/safety and state-specific conditions.

## S5 — Karnataka Electronics / ESDM

Use to validate location/zone, investment and incentive reasoning.

The same engine must execute all five. No scenario-specific evaluator implementation is allowed.

# 40. Demo-Critical Golden Path

For the hackathon demonstration, the team should optimize one polished
path first:

``` text
Gujarat Food Processing
        ↓
Natural-language business/activity input
        ↓
Adaptive questions
        ↓
Regulatory analysis
        ↓
Personalized requirements
        ↓
“Why does this apply?”
        ↓
Document requirement
        ↓
Upload document
        ↓
AI pre-validation
        ↓
Workflow
        ↓
Calendar deadline
        ↓
AI Assistant question
        ↓
Source-backed answer
```

After this path is reliable, use the same engine to add or validate additional knowledge domains. The five existing scenarios remain regression fixtures rather than a fixed product roadmap.

------------------------------------------------------------------------

# 41. Demo Quality Bar

The demo should feel like one coherent product rather than a collection
of disconnected screens.

A judge should be able to understand:

1.  who the user is;
2.  what the business does;
3.  why the platform asks certain questions;
4.  what regulations apply;
5.  why they apply;
6.  what documents are needed;
7.  what the next action is;
8.  how the workflow progresses;
9.  where deadlines live;
10. how AI answers questions;
11. where the evidence came from;
12. why this is different from a static checklist.

------------------------------------------------------------------------

# 42. Product Differentiation

ComplyWise should not position itself as:

-   a generic chatbot;
-   a document repository;
-   a static compliance calendar;
-   a better version of a government approval portal.

The strongest product differentiation is:

### Contextual applicability

"What applies to this exact business?"

### Cross-domain reasoning

How business context affects:

-   food;
-   BIS;
-   environment;
-   labour;
-   trade;
-   schemes;
-   standards.

### Explainability

"Why did this requirement appear?"

### Uncertainty handling

"What do we know, what do we not know, and what requires review?"

### Execution

"What do I do next?"

### Evidence

"Where did this conclusion come from?"

------------------------------------------------------------------------

# 43. Relationship to Official Government Portals

ComplyWise is an intelligence and preparation layer.

It should help users understand and prepare for official processes.

It should not claim to replace official authorities or government
approval portals.

When an official portal is required, the workflow should provide an
external-process step/link where verified.

The platform can prepare the user, but the competent authority remains
the final decision maker.

------------------------------------------------------------------------

# 44. Analytics / Product Events

The MVP should capture basic product analytics where practical.

Suggested events:

-   onboarding_started;
-   onboarding_completed;
-   profile_saved;
-   product_description_submitted;
-   smart_question_answered;
-   analysis_started;
-   analysis_completed;
-   requirement_viewed;
-   explanation_viewed;
-   evidence_viewed;
-   document_uploaded;
-   document_validation_completed;
-   workflow_started;
-   workflow_step_completed;
-   deadline_viewed;
-   scheme_viewed;
-   standards_query_submitted;
-   assistant_question_submitted;
-   profile_updated.

Analytics must not become a blocker to the core demo.

------------------------------------------------------------------------

# 45. Frontend Contract

The frontend must treat backend outputs as canonical.

It should not independently reimplement regulatory logic.

Frontend responsibilities:

-   render profile;
-   render questions;
-   submit answers;
-   show analysis state;
-   render requirements;
-   render explanation/evidence;
-   render documents;
-   upload files;
-   show validation;
-   render workflows;
-   render calendar;
-   render schemes;
-   render standards;
-   render assistant;
-   display errors and uncertainty.

The frontend may calculate purely presentational values, but regulatory
applicability must come from the backend engine.

------------------------------------------------------------------------

# 46. Backend Product Contract

The backend is responsible for:

-   user/business context;
-   profile persistence;
-   question determination;
-   derived/lookup context;
-   rule evaluation;
-   evidence;
-   requirement resolution;
-   document metadata;
-   document validation;
-   workflows;
-   dependencies;
-   deadlines;
-   schemes;
-   standards knowledge;
-   assistant context;
-   versioning;
-   auditability;
-   reproducibility.

The backend must expose stable domain-oriented contracts to the
frontend.

Detailed API and database contracts belong in `TRD.md`.

------------------------------------------------------------------------

# 47. AI Coding Agent Instructions

An AI coding agent receiving this PRD must follow these rules.

## 47.1 Do not invent regulatory rules

If a requirement is not present in the knowledge pack/evidence, do not
fabricate it.

## 47.2 Do not hardcode legal thresholds into UI/application logic

Thresholds belong in rule/knowledge data.

## 47.3 Keep domain logic separate from AI orchestration

The deterministic applicability engine remains the source of compliance
decisions.

## 47.4 Preserve provenance

Any regulatory result must be traceable to:

``` text
Requirement
→ Rule
→ Rule Version
→ Evidence
→ Knowledge Pack
→ Decision
```

## 47.5 Preserve independent statuses

Never collapse applicability/workflow/document status.

## 47.6 Test boundaries

Every critical threshold needs boundary tests.

## 47.7 Build vertically

Preferred development order:

``` text
Scenario
→ Rules
→ Evidence
→ Requirements
→ Documents
→ Workflow
→ Tests
→ UI
→ Publish
```

This follows the project's progressive knowledge-build decision.

------------------------------------------------------------------------

# 48. Acceptance Criteria

## AC-001 --- Onboarding

A new user can start the onboarding flow and understand the product's
purpose.

## AC-002 --- Adaptive questionnaire

The user is not forced to answer irrelevant questions.

## AC-003 --- Product language

A user can describe their product in ordinary language.

## AC-004 --- Business context

The platform produces a structured business profile from onboarding
inputs.

## AC-005 --- Applicability

The platform produces one of the defined applicability statuses for each
evaluated requirement.

## AC-006 --- Explanation

The user can open an applicable requirement and understand why it
applies.

## AC-007 --- Evidence

The requirement displays supporting authoritative evidence.

## AC-008 --- Uncertainty

Missing/conflicting/unverified knowledge is clearly represented.

## AC-009 --- Documents

The user can see which documents are needed for a requirement.

## AC-010 --- Document validation

The user can upload a supported document and receive a pre-validation
result.

## AC-011 --- AI disclaimer

The UI clearly distinguishes AI pre-validation from official approval.

## AC-012 --- Workflow

An applicable requirement produces an actionable workflow.

## AC-013 --- Dependencies

A blocked prerequisite prevents downstream workflow progression.

## AC-014 --- Calendar

Verified deadlines/renewals can appear in the calendar.

## AC-015 --- Schemes

Relevant schemes can be surfaced with reasoning and confidence.

## AC-016 --- Standards

The user can ask a supported standards question using product language.

## AC-017 --- Assistant

The assistant answers using the business context and available verified
evidence.

## AC-018 --- Versioning

Current effective knowledge is used for current evaluation.

## AC-019 --- Reproducibility

A previous result can be associated with its rule/version/evidence
basis.

## AC-020 --- Unified dashboard

The dashboard composes outputs from the underlying modules rather than
maintaining separate duplicate truth.

------------------------------------------------------------------------

# 49. Traceability to Project Decisions

  PRD Area                             Decision basis
  ------------------------------------ ----------------
  Product objective                    D001
  Dynamic/generalized coverage           D002 superseded by current project direction
  Generalized engine                   D003
  Business profile                     D004--D005
  Natural language product input       D006
  User/derived/lookup distinction      D007
  Current rule versioning              D084--D085
  Labour date/jurisdiction awareness   D086
  Applicability statuses               D087
  Explanation trace                    D088
  Evidence with results                D089
  Human review                         D090
  Rule tests                           D091
  Rule packs                           D092
  Knowledge lifecycle                  D097
  Knowledge audit trail                D098
  Published rule versioning            D099
  Decision reproducibility             D100
  Automated validation                 D101
  Mandatory rule tests                 D102
  Regression testing                   D103
  Knowledge packs                      D104
  Separate statuses                    D105
  Separate workflow authoring          D106
  Data-driven workflow                 D107
  Dependency distinction               D108
  Impact analysis model                D109
  Source-change review events          D110
  Unverified knowledge handling        D111
  No admin UI for MVP                  D112
  Version-controlled knowledge         D113
  Rule authoring separate from code    D114
  Progressive knowledge build          D115
  Official source authority            D116

------------------------------------------------------------------------

# 50. Product Definition of Done

The MVP is product-complete when:

### User experience

-   onboarding is polished;
-   business profile is adaptive;
-   product/activity input works naturally;
-   analysis state is coherent;
-   initial results are understandable;
-   dashboard is unified;
-   requirement detail explains applicability;
-   documents are linked to requirements;
-   workflows are actionable;
-   calendar shows deadlines;
-   schemes are understandable;
-   standards assistant works;
-   AI assistant is source-grounded.

### Engine

-   at least one complete golden path is end-to-end;
-   the generalized engine is not hardcoded around named scenarios;
-   the five fixtures can be loaded through the same architecture;
-   critical rules have tests;
-   evidence is linked;
-   statuses are correct;
-   uncertainty is preserved;
-   rule versions are tracked.

### Demo

-   one complete golden path works without manual backend intervention;
-   no screen contains placeholder regulatory conclusions;
-   no unsupported legal claim is presented as fact;
-   all visible regulatory claims have a traceable source;
-   frontend and backend use the same domain terminology.

------------------------------------------------------------------------

# 51. Implementation Sequence

The build order is intentionally coarse-grained. Do not split the hackathon into dozens of micro-tasks.

## Task 1 — Foundation

Project setup, business/profile models, base APIs and basic database integration.

## Task 2 — Knowledge & Applicability Core

Sources, evidence, knowledge packs, rule AST, evaluator, versioning, explanation traces and tests.

## Task 3 — Dynamic Onboarding → Analysis

Natural-language activity input, classification, adaptive questions, regulatory analysis and initial results.

## Task 4 — Operational Compliance

Requirements, document requirements, upload/pre-validation, workflows and calendar.

## Task 5 — Intelligence Layer

Schemes, standards, regulatory updates and source-grounded AI assistant.

## Task 6 — UI Integration

Implement the supplied reference journey as a single working application and wire it to backend truth.

## Task 7 — Accuracy, Polish & Azure

Run regression tests, check the >90% prototype quality target, fix visible issues, deploy to Azure and rehearse the final demo.

After each major task, update `PROJECT_EXECUTION.md`.

# 52. Final Product Contract

The product can be reduced to one statement:

> **ComplyWise takes a business profile, determines which supported
> regulatory requirements apply using verified and versioned rules,
> explains why they apply, identifies the evidence and documents
> required, converts requirements into dependency-aware workflows and
> deadlines, and provides source-grounded standards, scheme and
> regulatory intelligence through one unified interface.**

The product must always preserve the following chain:

``` text
BUSINESS CONTEXT
      ↓
REGULATORY DECISION
      ↓
EXPLANATION
      ↓
EVIDENCE
      ↓
REQUIREMENT
      ↓
DOCUMENT
      ↓
WORKFLOW
      ↓
DEADLINE
      ↓
ACTION
```

And behind every automated compliance conclusion:

``` text
Decision
   ↓
Rule
   ↓
Rule Version
   ↓
Evidence
   ↓
Authoritative Source
```

That chain is the core product architecture and the core trust
mechanism.

------------------------------------------------------------------------

# Appendix A --- Canonical Vocabulary

Use these terms consistently across frontend, backend, UX, documentation
and demo:

-   Business Profile
-   Business Context
-   Product / Activity
-   Derived Value
-   Lookup Value
-   Requirement
-   Applicability
-   Rule
-   Rule Version
-   Evidence
-   Knowledge Pack
-   Workflow
-   Workflow Step
-   Dependency
-   Document Requirement
-   Document Record
-   Pre-validation
-   Deadline
-   Renewal
-   Scheme
-   Standard
-   Regulatory Update
-   Decision Record
-   Human Review
-   Verification Status
-   Compliance Readiness

Avoid inconsistent synonyms such as using "approval" for every type of
requirement.

------------------------------------------------------------------------

# Appendix B --- Canonical Separation of Concerns

``` text
FRONTEND
Presentation + interaction
        ↓
API / APPLICATION LAYER
        ↓
DOMAIN SERVICES
        ├── Business Profile
        ├── Context / Classification
        ├── Applicability Engine
        ├── Requirements
        ├── Evidence
        ├── Documents
        ├── Workflows
        ├── Calendar
        ├── Schemes
        └── Standards / Assistant
                ↓
KNOWLEDGE LAYER
        ├── Rules
        ├── Rule Versions
        ├── Evidence
        ├── Requirements
        ├── Workflows
        ├── Documents
        └── Tests
```

AI/RAG supports understanding, retrieval and explanation. It does not
replace the deterministic regulatory decision layer.

------------------------------------------------------------------------

# Appendix C --- Demo Screen Inventory

The visual reference establishes the following core screens:

1.  Welcome / onboarding
2.  Business Profile
3.  Products & Activities
4.  Smart Questions
5.  Regulatory Analysis
6.  Initial Results
7.  Overview Dashboard
8.  Compliance
9.  Requirement Detail
10. Documents
11. Workflows
12. Compliance Calendar
13. Schemes & Benefits
14. Standards / Certification Intelligence
15. Regulatory Intelligence + AI Assistant

Additional implementation screens may be introduced for:

-   sign-in;
-   business profile editing;
-   document upload;
-   document validation details;
-   workflow detail;
-   source/evidence detail;
-   reports;
-   settings.

They should use the same visual system and navigation model.

------------------------------------------------------------------------

# Appendix D --- Regression Fixture Coverage

``` text
                         COMPLYWISE
                             │
                  GENERALIZED ENGINE
                             │
       ┌─────────────┬───────┼───────┬─────────────┐
       │             │       │       │             │
    GUJ FOOD     TS ELEC  GUJ TRADE TN AUTO      KA ESDM
       │             │       │       │             │
     FSSAI          BIS     DGFT   Environment    Incentives
     State          QCO     IEC    Safety         Geography
     MSME           Scheme  Trade   Infrastructure Financial
       │             │       │       │             │
       └─────────────┴───────┴───────┴─────────────┘
                             │
                   SAME APPLICABILITY ENGINE
                             │
          Requirements → Documents → Workflow → Calendar
```

------------------------------------------------------------------------

# Appendix E --- Source/Knowledge Trust Rule

The product should always prefer:

``` text
Authoritative official source
        >
Verified structured knowledge
        >
Research / secondary source
        >
LLM inference
```

LLM inference alone must never be represented as a definitive legal
conclusion.

------------------------------------------------------------------------

**End of PRD.md**


---

## Document Control Note — v2.0

This version supersedes the earlier five-scenario-as-scope wording. The five scenarios are retained only for validation, regression and demonstration. The product direction is now a **dynamic generalized compliance engine with progressively expanding verified knowledge**.
