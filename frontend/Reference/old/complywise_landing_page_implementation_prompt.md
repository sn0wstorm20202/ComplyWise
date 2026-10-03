# ComplyWise — Coding Agent Implementation Prompt

You are implementing the ComplyWise landing page redesign.

Read and follow `design_updated.md` as the authoritative design and storytelling specification.

## Primary objective

Transform the current ComplyWise landing page from a polished but relatively static editorial landing page into a **scroll-driven product storytelling experience (scrollytelling)**.

The website should behave like an interactive product film.

The visitor should not merely read what ComplyWise does.

The visitor should **watch the system understand a business, identify missing information, find regulatory knowledge, evaluate rules, establish evidence, and turn the result into action.**

The core experience is:

```text
BUSINESS
  ↓
UNDERSTAND
  ↓
IDENTIFY UNKNOWN
  ↓
ASK
  ↓
DISCOVER
  ↓
EVALUATE
  ↓
PROVE
  ↓
ACT
  ↓
TRUST
  ↓
EXPLORE
```

The final feeling should be:

> “I just watched how ComplyWise thinks.”

---

# 1. CRITICAL CONSTRAINT: PRESERVE THE EXISTING VISUAL IDENTITY

Do NOT replace the current visual direction.

Preserve:

- warm ivory / cream background
- charcoal typography
- muted sage accent
- subtle dusty rose atmosphere
- serif display typography
- modern sans-serif body typography
- mono metadata
- floating pill navigation
- restrained borders
- sophisticated whitespace
- rounded editorial surfaces
- circular final CTA
- premium light-theme aesthetic

The current aesthetic is already good.

The major upgrade is **storytelling + interaction + state transformation**, not a new colour system.

Do NOT convert the site to dark mode.

Do NOT make it look like a generic SaaS template.

Do NOT add generic AI gradients.

Do NOT add excessive glassmorphism.

Do NOT add random decorative animation.

---

# 2. IMPORTANT: USE SCROLL AS THE STORY CONTROL

The landing page must be built around **meaningful scroll-driven transitions**.

Do NOT use scrolling as a trigger for generic:

```text
fade in
slide up
fade in
slide up
```

Instead, scroll should cause actual product-state changes.

Examples:

```text
business sentence
→ structured facts
```

```text
structured facts
→ missing fact
```

```text
missing fact
→ adaptive question
```

```text
question
→ rule
```

```text
rule
→ evidence
```

```text
decision
→ workspace item
```

Every major animation should explain something.

---

# 3. HERO REDESIGN

Do not use:

> The rules decide. The AI explains.

as the only primary hero headline.

That phrase should remain in the site as a **core principle**, but it should land later after the user has seen the mechanism.

Use a more intriguing headline.

Preferred:

# Behind every business is a rulebook.

Potential alternatives:

- Your business is only the beginning.
- Every business has a different rulebook.
- Describe the business. Watch the rulebook unfold.
- There is a rulebook behind everything you build.
- A business has a shape. Compliance has one too.

Choose the strongest one based on visual composition.

## Hero behaviour

The hero must include a subtle living product story.

Start with:

```text
BUSINESS

“We manufacture temperature-control
equipment in Maharashtra.”
```

As the user scrolls:

### State 1

Business description visible.

### State 2

The sentence transforms into:

```text
MAHARASHTRA
MANUFACTURING
TEMPERATURE EQUIPMENT
PRIVATE LIMITED
```

### State 3

Regulatory context begins appearing:

```text
BIS
LABOUR
FIRE
ENVIRONMENT
FACTORY
GST
...
```

### State 4

Irrelevant context recedes.

Relevant context remains.

### State 5

Reveal:

```text
DECISION-CRITICAL FACT MISSING
```

### State 6

Reveal:

```text
What is your annual turnover?
```

Do not turn the hero into a dashboard.

It should feel like an elegant cinematic transformation.

---

# 4. CREATE NARRATIVE CHAPTERS

Implement these story chapters as actual scroll-driven scenes.

Recommended structure:

```text
01 — THE BUSINESS
02 — UNDERSTAND
03 — THE UNKNOWN
04 — ADAPTIVE QUESTION
05 — REGULATORY DISCOVERY
06 — RULE
07 — DECISION
08 — EVIDENCE
09 — TRUST PRINCIPLE
10 — WORKSPACE
11 — COVERAGE
12 — HUMAN VERIFICATION
13 — FAQ
14 — FINAL CTA
```

Use the exact content/logic from `design_updated.md`.

---

# 5. STICKY STORY SCENE A
## BUSINESS → FACTS → QUESTION

Create a sticky/pinned section.

Layout:

```text
LEFT
Chapter label
Large serif narrative heading
Short explanatory line

RIGHT
One dominant visual object
```

The right-side object transitions through:

### State A

```text
BUSINESS DESCRIPTION

“We manufacture temperature-control
equipment in Maharashtra.”
```

### State B

```text
CANONICAL BUSINESS FACTS

Location          Maharashtra
Entity            Private Limited
Activity          Manufacturing
Product           Temperature Equipment
Turnover          ?
```

### State C

```text
DECISION-CRITICAL FACT

What is your annual turnover?
```

### State D

Answer appears.

Example:

```text
₹18 Cr
```

### State E

Show subtle:

```text
RULE PATH UPDATED
```

Important:

This is an illustrative/demo interaction unless the values come from real application state.

---

# 6. STICKY STORY SCENE B
## REGULATORY SOURCES → RETRIEVAL → RULE

Create another sticky scene.

Start with:

```text
OFFICIAL SOURCES

Gazette
Notification
Government Portal
Standard
Order
Rule
```

As the user scrolls:

```text
NORMALIZE
```

then:

```text
FILTER
```

then:

```text
RETRIEVE
```

then:

```text
RERANK
```

Then the scattered information collapses into:

```text
RULE-014
```

Then:

```text
THRESHOLD
CONDITION
EXEMPTION
EFFECTIVE DATE
JURISDICTION
```

Do not claim exact legal applicability from invented demo values.

The rule visual should be clearly illustrative if not backed by actual product data.

---

# 7. STICKY STORY SCENE C
## RULE → DECISION → EVIDENCE

Use one continuous visual object.

Start:

```text
RULE-014

IF
facility_type = manufacturing
AND
product_category = temperature_equipment

THEN
evaluate applicability
```

Scroll into:

```text
CHECKING

THRESHOLD        ✓
CONDITION        ✓
EXEMPTION        —
EFFECTIVE DATE   ✓
```

Then:

```text
APPLICABLE
```

Then show:

```text
WHY
Business context matches
the evaluated rule scope.

SOURCE
Official notification

VERSION
2026.x

EFFECTIVE
2026-04-01
```

Again, use actual demo data where available and avoid unsupported legal claims.

---

# 8. EVIDENCE CHAIN

Do not present provenance as a static card.

Animate:

```text
OFFICIAL SOURCE
      ↓
RELEVANT CLAUSE
      ↓
NORMALIZED RULE
      ↓
APPLICABILITY TEST
      ↓
DECISION
      ↓
USER ACTION
```

Implementation idea:

- source document enters
- relevant text highlights
- highlight extracts into a rule object
- rule object evaluates
- decision badge appears
- action item is created

This should be one of the visual signatures of the site.

---

# 9. REVEAL THE PRINCIPLE AT THE RIGHT MOMENT

After the visitor has already watched:

```text
business
→ facts
→ question
→ retrieval
→ rule
→ evidence
→ decision
```

then reveal the statement:

# AI assists the process.
# Verified knowledge grounds it.
# The rules decide.

Use the final line as the strongest visual emphasis:

> **The rules decide. The AI explains.**

This should now feel earned rather than generic.

---

# 10. INTERACTIVE WORKSPACE PAYOFF

Create a polished real React component representing the ComplyWise workspace.

Do not use a static screenshot.

Structure:

```text
ComplyWise Workspace

Overview
Compliance
Documents
Workflows
Standards
Schemes
Calendar
Alerts
Updates
```

As the user scrolls, the active view changes.

### View A — Compliance

```text
Applicable
Needs Action
Upcoming
```

### View B — Documents

Show:

```text
Required document
Status
Verification
```

### View C — Workflows

Show:

```text
Step
Status
Next action
```

### View D — Calendar

Show:

```text
Upcoming deadline
Reminder
```

### View E — Schemes

Show:

```text
Potentially relevant
Eligibility context
Source
```

### View F — Standards

Show:

```text
Standard
Source
Status
```

The visual should make the previous decision become a real workspace item.

For example:

```text
Decision
↓
Compliance requirement
↓
Action
```

This creates narrative continuity.

---

# 11. COVERAGE SECTION

Create a restrained section communicating actual supported scope.

Start:

```text
CENTRAL GOVERNMENT
MAHARASHTRA
```

Then reveal sectors:

```text
FOOD
AUTOMOTIVE
PHARMA
CHEMICALS
TEXTILES
ELECTRONICS
IT / ITES
RETAIL
HOSPITALITY
CONSTRUCTION
...
```

Only display sectors actually supported in the current product/demo.

Do not invent coverage.

---

# 12. HUMAN VERIFICATION SECTION

Show:

```text
AI PRE-CHECK
      ↓
EVIDENCE REVIEW
      ↓
HUMAN VERIFICATION
      ↓
PUBLISHED KNOWLEDGE
      ↓
RULE ENGINE
```

Then:

```text
✓ Source verified
✓ Version checked
✓ Effective date reviewed
✓ Applicability conditions reviewed
```

Keep these claims consistent with the actual implemented workflow.

---

# 13. COPY / CLAIM SAFETY

Do not use exaggerated claims simply because they sound premium.

Avoid unless genuinely implemented and defensible:

```text
ZERO-HALLUCINATION
100% PROVENANCE
NO LEGAL AMBIGUITY
CERTIFIED IMMUTABLE
TAMPER-PROOF
```

Prefer:

```text
SOURCE-LINKED
EVIDENCE-GROUNDED
VERSIONED
VERIFIED
RULE-GOVERNED
TRACEABLE
```

The site should increase trust, not create technically challengeable claims.

---

# 14. NAVIGATION

Keep the existing floating navigation style.

Prefer labels:

```text
Product
How It Works
Evidence
FAQ
Sign In
[ Explore Workspace ↗ ]
```

Do not make the primary navigation unnecessarily technical.

---

# 15. MOTION TECHNOLOGY

Use the existing project stack.

Preferred:

```text
GSAP
ScrollTrigger
Lenis
```

Do not migrate the project to another framework.

Do not add heavy WebGL.

Do not add large video backgrounds.

Use:

- transforms
- opacity
- clip-path where useful
- scale
- pinned sections
- scrubbed ScrollTrigger timelines

Preferred easing:

```text
expo.out
power2.out
power3.out
```

No bounce or elastic motion.

---

# 16. RESPONSIVENESS

Desktop:

- full scrollytelling
- sticky scenes
- large editorial typography
- cursor
- subtle parallax

Tablet:

- reduce animation distance
- reduce simultaneous objects
- preserve narrative

Mobile:

- preserve the story
- simplify pinned scenes
- stack content
- remove cursor
- remove mouse parallax
- reduce motion distance
- maintain clear state transitions

Do not simply shrink desktop.

---

# 17. ACCESSIBILITY

Support:

- `prefers-reduced-motion`
- keyboard navigation
- visible focus states
- semantic headings
- `aria-expanded`
- accessible buttons
- readable contrast
- essential information available without animation

When reduced motion is enabled:

- remove unnecessary scrubbed transformations
- reveal states progressively without large movement
- preserve the narrative order

---

# 18. PERFORMANCE

Optimize for smooth interaction where practical.

Prefer:

- transform animations
- opacity
- CSS gradients
- SVG
- lightweight DOM
- lazy assets

Avoid:

- continuous expensive filters
- large canvas scenes
- particle systems
- unnecessary background animations

Do not use `will-change` globally. Apply only where justified.

---

# 19. IMPLEMENTATION ORDER

Do the redesign in this order.

## Phase 1 — Narrative foundation

Implement:

1. Hero story
2. Business → Facts → Question
3. Regulatory discovery → Rule
4. Rule → Decision
5. Evidence chain

Get the narrative working before polishing.

## Phase 2 — Product payoff

Implement:

6. Trust principle
7. Interactive workspace
8. Coverage
9. Human verification
10. Final CTA

## Phase 3 — polish

Then tune:

- spacing
- type scale
- easing
- micro-interactions
- cursor
- borders
- ambient gradients
- responsive behavior

Do not spend hours polishing individual buttons before the storytelling architecture works.

---

# 20. DO NOT OVER-ANIMATE

The goal is not:

> more animation.

The goal is:

> **meaningful animation.**

There should be a limited number of memorable moments.

Priority:

### Signature Moment 1
Business description morphs into structured facts.

### Signature Moment 2
A missing fact becomes an adaptive question.

### Signature Moment 3
Regulatory sources collapse into a deterministic rule.

### Signature Moment 4
The rule evaluates into a decision and evidence trail.

### Signature Moment 5
The decision becomes a workspace action.

If these five moments are excellent, the page will feel expensive.

---

# 21. SUCCESS CRITERIA

After implementation, a first-time visitor should understand the following without reading a long technical explanation:

```text
ComplyWise starts with my business.

It understands the business context.

It asks only for facts that can change decisions.

It finds relevant regulatory knowledge.

Rules evaluate what applies.

The decision has supporting evidence.

The outcome becomes actionable compliance work.
```

The final emotional takeaway should be:

> **“I can see how this system thinks.”**

not merely:

> “This is a nice-looking website.”

---

# 22. FINAL IMPLEMENTATION RULE

Do not interpret this task as:

> “Add animations to the current landing page.”

Interpret it as:

> **“Re-author the landing page as a scroll-driven product film while preserving the current visual identity.”**

Keep the best of the current design.

Replace static presentation with:

**story → transformation → state → consequence.**

The website itself should tell the ComplyWise story.
