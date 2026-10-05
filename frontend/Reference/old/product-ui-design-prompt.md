# ComplyWise — Product UI/UX Redesign Prompt

Read and follow `product-ui-design-implementation.md` as the **single authoritative specification** for redesigning the authenticated ComplyWise platform.

The landing page is already established. Now bring the same **premium light-theme brand language** into the actual product.

## Mission

Audit and redesign the **entire frontend platform**, not just one screen.

Inspect every existing route, page, interaction and admin flow before changing anything.

The target is:

> **A calm, premium, trustworthy compliance workspace with product-grade interaction design.**

Do not turn the application into a cinematic landing page.

The application should be:

- calm
- precise
- tactile
- fast
- trustworthy
- clean
- information-hierarchical
- progressively disclosed

## Follow the specification

The detailed requirements for:

- visual system
- information hierarchy
- navigation
- sidebar
- dashboard
- onboarding
- compliance
- documents
- workflows
- calendar
- alerts
- standards
- schemes
- regulatory updates
- BIS Copilot
- admin
- micro-interactions
- GSAP usage
- responsive behaviour
- accessibility
- loading/empty/error states
- functional audit
- implementation phases

are all defined in:

```text
product-ui-design-implementation.md
```

Treat that file as the source of truth.

## First step

Before redesigning:

1. inventory every frontend route;
2. inspect every existing page;
3. test major interactions;
4. identify functional bugs;
5. identify inconsistent components;
6. identify information-density problems;
7. identify repeated UI patterns;
8. inspect the current CSS/component/design-token architecture.

Do not redesign blindly.

## Preserve

Keep the existing:

- Next.js/React architecture
- routes
- authentication
- backend integrations
- data flows
- product functionality

unless a frontend bug genuinely requires a change.

## Important visual rule

Do not copy the landing page's 3D storytelling into the application.

Instead translate its brand language into:

```text
premium typography
+
warm light surfaces
+
quiet hierarchy
+
muted sage
+
excellent spacing
+
progressive disclosure
+
tactile micro-interactions
+
smooth state transitions
```

## Motion rule

Use GSAP where it improves interaction.

Motion should communicate:

- selection
- expansion
- progress
- verification
- loading
- completion
- navigation
- state changes

Do not animate continuously just to make the UI look impressive.

## Quality bar

Do not stop after making the application "look cleaner."

The result should feel like a **fully designed product system**.

A user moving through:

```text
Sign in
→ Onboarding
→ Dashboard
→ Compliance
→ Documents
→ Workflow
→ Calendar
→ Alerts
→ Standards
→ Schemes
→ Updates
→ BIS Copilot
```

should feel that every page belongs to the same carefully designed product.

Admin should have the same brand language, with a more operational/review-oriented interface.

## Final instruction

Implement the complete specification in:

```text
product-ui-design-implementation.md
```

Audit first.

Fix functional issues.

Build the design system.

Redesign the product progressively.

Then add the micro-interactions and polish.

Do not provide a generic dashboard redesign.

Build the **ComplyWise product UI system** described by the specification.
