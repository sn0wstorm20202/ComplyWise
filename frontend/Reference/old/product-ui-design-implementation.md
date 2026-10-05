# ComplyWise — Final Product UI/UX Design Implementation

## 0. FINAL OBJECTIVE

Redesign the **entire authenticated ComplyWise product frontend** so that it feels like the interior of the same premium product introduced by the landing page.

The current application is functionally broad and visually clean, but it still reads as a conventional enterprise/admin dashboard.

The target is:

> **A calm, premium, trustworthy compliance workspace with product-grade interaction design.**

The landing page can be cinematic and scroll-driven.

The application must be:

- precise
- calm
- tactile
- fast
- trustworthy
- highly legible
- information-dense without feeling crowded
- consistent
- polished at every interaction

The product must feel suitable for:

- a serious business owner
- a compliance officer
- a founder
- an enterprise operator
- a consultant
- a judge/investor evaluating the product

The user should feel:

> "This is a real product I can trust with important business work."

---

# 1. THE DESIGN RELATIONSHIP WITH THE LANDING PAGE

The application is **not** the landing page.

Do not copy the landing page's cinematic scroll storytelling into dashboards.

Instead:

```text
LANDING
Editorial
Cinematic
Story-driven
Visual
Emotional
Scroll-controlled

APPLICATION
Editorial
Precise
Tactile
Calm
Functional
State-driven
```

Both must clearly belong to the same brand.

## Shared DNA

Preserve:

- warm ivory / soft white foundation
- charcoal typography
- muted sage as the primary brand interaction colour
- very restrained dusty rose as a secondary atmospheric accent
- elegant typography
- generous whitespace
- refined borders
- soft shadows
- premium rounded surfaces
- subtle metadata typography
- minimal iconography
- careful motion

Do not introduce a separate visual identity for the dashboard.

---

# 2. DESIGN PHILOSOPHY

The application should follow:

> **Clarity over decoration.**

> **Hierarchy over density.**

> **Context over chrome.**

> **Progressive disclosure over information dumping.**

> **Feedback over spectacle.**

> **Motion should explain state, not decorate the screen.**

A premium interface is not one with more UI.

It is one where the user always understands:

1. where they are
2. what matters
3. what changed
4. what needs attention
5. what they can do next

---

# 3. CORE INFORMATION HIERARCHY

Every page must visually prioritize information in this order:

## Level 1 — Primary decision

Examples:

```text
6 actions required
2 deadlines this week
1 requirement needs information
```

## Level 2 — Primary context

Examples:

```text
Meridian Pharma Formulations
Maharashtra
Manufacturing
```

## Level 3 — Supporting information

Examples:

```text
Authority
Jurisdiction
Category
Source
Effective date
```

## Level 4 — Technical metadata

Examples:

```text
REQ-CPCB-001
2026.4
CENTRAL
RULE-014
```

Technical metadata must remain quiet.

---

# 4. GLOBAL APP SHELL

Create one unified application shell.

Structure:

```text
┌─────────────────────────────────────────────┐
│ Brand │ Primary nav │ Search │ Alerts │ User│
├──────────────┬──────────────────────────────┤
│              │                              │
│ Sidebar      │          Page content        │
│              │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

## Top navigation

Should contain:

- ComplyWise identity
- primary context navigation
- search
- notifications
- user profile

Keep it compact.

Avoid excessive pills.

### Interaction

Active primary navigation:

- slightly darker surface
- subtle sage indicator
- no exaggerated movement

Hover:

- background softly appears
- icon and text become slightly darker

Press:

- 0.98 scale
- fast feedback

---

# 5. SIDEBAR INFORMATION ARCHITECTURE

The sidebar should be grouped instead of presenting every feature with equal importance.

Recommended structure:

```text
WORKSPACE

Overview
Compliance
Documents
Workflows
Calendar

INTELLIGENCE

Standards
Schemes
Regulatory Updates
BIS Copilot

ACCOUNT

Business Profile
Settings
```

The exact routes should be preserved from the current application.

The grouping is visual hierarchy, not necessarily route restructuring.

## Sidebar behaviour

Desktop:

- stable width
- quiet background
- minimal separators
- selected state obvious but restrained

Selected item:

```text
warm-gray surface
dark text
small sage indicator
```

Hover:

```text
surface tint
icon shift
2–4px internal movement
```

Mobile:

- drawer / sheet
- smooth slide
- background dimming
- focus trap
- clear close control

---

# 6. PAGE CONTAINER

Avoid excessive nesting.

Current problem:

```text
page
 → card
   → card
     → card
       → badge
```

Preferred:

```text
page background
    ↓
section
    ↓
content block
```

Use cards only when they represent a distinct object.

## Surface hierarchy

### Surface A — page

Warm ivory / soft white.

### Surface B — elevated content

White.

### Surface C — inset

Soft warm gray.

### Surface D — semantic

Very light sage / amber / blue / red only when necessary.

Do not make every section a white rounded rectangle.

---

# 7. SPACING SYSTEM

Use a consistent spacing rhythm.

Suggested scale:

```text
4
8
12
16
24
32
48
64
96
```

Major page sections should breathe.

Dense content can still use 12–20px internal rhythm.

Avoid arbitrary spacing values throughout individual components.

---

# 8. TYPOGRAPHY SYSTEM

## Display

Editorial serif used selectively for:

- major product moments
- empty states
- important page introductions
- contextual statements

## UI

High-quality sans-serif for:

- navigation
- headings
- body
- buttons
- data

## Mono

Use restrained monospace for:

- rule IDs
- case IDs
- source IDs
- version
- dates when useful
- technical metadata

### Typography rule

Do not make the application look like a magazine.

Use the serif to create identity, not to replace UI typography.

---

# 9. COLOUR SYSTEM

## Primary

```text
Warm ivory
#F7F5EF

Soft white
#FFFFFF

Warm gray
#F0EEE7

Charcoal
#171714
```

## Brand

```text
Muted sage
#7FAF9A

Pale sage
#DDEBE3
```

## Secondary atmospheric

```text
Dusty rose
#D8A7A0
```

Use very sparingly.

## Semantic

Success:

```text
sage
```

Warning:

```text
muted amber
```

Information:

```text
quiet blue
```

Critical:

```text
restrained red
```

Never use semantic colour as decoration.

---

# 10. BUTTON SYSTEM

Buttons should feel tactile.

## Primary

Dark charcoal background.

Hover:

- +2% brightness
- arrow shifts 3–4px
- shadow slightly increases

Press:

```text
scale: 0.98
```

## Secondary

Light / white.

Hover:

- warm-gray fill
- border becomes slightly stronger

## Quiet action

Text + arrow.

Hover:

- underline grows
- arrow moves

Do not use large saturated coloured buttons everywhere.

---

# 11. MICRO-INTERACTION SYSTEM

All interactions should follow one shared language.

## Rest

quiet

## Hover

slight lift / highlight

## Press

small compression

## Active

clear state

## Success

soft confirmation

## Error

clear feedback

Never bounce UI aggressively.

Never use spring physics excessively.

---

# 12. GLOBAL GSAP / MOTION RULES

Use GSAP for purposeful interface transitions.

Recommended:

- GSAP
- GSAP timelines
- GSAP context
- `quickTo`
- `matchMedia` where useful

Use Framer Motion only if already present and clearly beneficial.

Do not create competing animation systems unnecessarily.

## Motion duration

Typical:

```text
120–180ms
small interaction

220–350ms
component transition

400–700ms
major layout/state transition
```

Avoid long cinematic animations inside work screens.

---

# 13. ROUTE AUDIT REQUIREMENT

Before redesigning anything, enumerate and audit every existing frontend route.

At minimum inspect:

## Public

```text
Landing
Sign in
Sign up
Password / auth recovery if present
```

## Onboarding

```text
Business profile
Business description
Adaptive questions
Review / completion
```

## User application

```text
Dashboard
Compliance
Documents
Workflows
Calendar
Alerts & Notifications
Standards
Schemes
Regulatory Updates
BIS Copilot
Business Profile
Settings
```

## Admin

```text
Admin dashboard
Enterprise registry
Review queue
Case detail / cockpit
Evidence review
Rule review
Approval
Rejection / request changes
```

Do not assume a page is complete because a route exists.

---

# 14. DASHBOARD

The dashboard is the most important application page.

It should answer:

> What is happening with my business right now?

### Recommended hierarchy

#### Header

```text
Good morning.
Meridian Pharma Formulations

Maharashtra · Manufacturing
```

#### Attention strip

```text
6 actions
2 upcoming deadlines
1 item needs information
```

#### Primary workspace

A small number of high-value modules.

Example:

```text
Needs your attention

[ Compliance requirement ]
[ Deadline ]
[ Missing information ]
```

#### Progress

```text
Compliance
Documents
Workflows
```

#### Intelligence

```text
Recent regulatory changes
```

Do not fill the dashboard with every available metric.

---

# 15. DASHBOARD MOTION

On initial load:

- header fades/slides upward 8–12px
- attention items stagger very slightly
- progress bars animate once
- important metric counts softly resolve

On hover:

- cards lift 2px
- internal action arrow moves
- relevant metadata appears

Do not animate the entire dashboard continuously.

---

# 16. COMPLIANCE PAGE

The current information architecture is good, but information density is too high.

Use progressive disclosure.

## Collapsed requirement card

Show:

```text
Authority
Requirement
Short explanation
Status
Primary next action
```

Example:

```text
Central Pollution Control Board

Plastic Packaging Compliance

Information needed

Why this matters
View details →
```

## Expanded state

Reveal:

```text
Why it applies
Required documents
Due date
Jurisdiction
Source
Effective date
Evidence
Rule conditions
Workflow
```

The expanded content should unfold from the clicked card.

Do not suddenly insert a separate full-screen modal unless necessary.

---

# 17. COMPLIANCE CARD MICRO-INTERACTIONS

Hover:

- card rises 2px
- source chip becomes clearer
- arrow shifts 4px

Click:

- card expands
- content height animates
- evidence line draws in
- primary action becomes visually dominant

When status changes:

```text
Information needed
→
Ready for review
→
Verified
```

The status chip transitions rather than being replaced instantly.

---

# 18. DOCUMENTS

Treat every document as a meaningful product object.

Card hierarchy:

```text
Document title
Status
Category
Statutory basis
Required action
Actions
```

## Document states

```text
Not uploaded
Uploading
Checking
Needs review
Verified
Rejected
Expired
```

Transitions between states must be animated.

### Upload flow

```text
Select
→ Uploading
→ Checking
→ Result
```

Use a thin progress line.

Do not use an unnecessary spinner if progress can be represented spatially.

---

# 19. DOCUMENT VERIFICATION

The verification interaction should feel like the system is actually examining the document.

Sequence:

```text
Checking file
        ↓
Reading fields
        ↓
Checking dates
        ↓
Comparing requirement
        ↓
Result
```

Show this as compact progress feedback.

Do not expose fake AI theatre.

Only show states the product genuinely supports.

---

# 20. WORKFLOWS

Make workflows one of the most tactile screens in the product.

## Header

Show:

```text
Workflow name
Authority
Status
Progress
Estimated time
```

## Progress rail

Use:

```text
1 ─── 2 ─── 3 ─── 4 ─── 5
```

Current step:

- larger circle
- subtle sage halo
- clear label

Completed:

- check
- connected line fills

Upcoming:

- quiet outline

### Interaction

Selecting a step:

- active circle expands
- content panel changes
- required documents transition in
- action control becomes primary

---

# 21. WORKFLOW GSAP DETAILS

Use a restrained GSAP timeline.

When step advances:

```text
current node
→ compress
→ check
→ connecting line fills
→ next node expands
→ next content panel enters
```

Do not slide the whole screen unnecessarily.

The user's spatial orientation must remain stable.

---

# 22. CALENDAR

Primary goal:

> Make the next important obligation immediately obvious.

Use a clean agenda/list view with a secondary calendar view if already implemented.

Each deadline item:

```text
Date
Authority
Requirement
Time remaining
Reminder state
Open action
```

Hover:

- deadline indicator expands
- related workflow subtly highlights

---

# 23. ALERTS & NOTIFICATIONS

Use priority to create hierarchy.

## States

```text
New
Read
High
Critical
Overdue
Delivered
```

Do not give every row a heavy border.

Critical/overdue can have restrained semantic emphasis.

### Read animation

When marked read:

- background softens
- unread dot fades
- count transitions down
- row settles

### Filter animation

Filtering should be smooth.

Rows may fade/reflow rather than abruptly disappearing.

---

# 24. STANDARDS

Make this a reference experience rather than a catalogue.

Card structure:

```text
Standard ID
Title
Authority
Jurisdiction
Mandate status
Verification
```

Expanded state:

```text
Relevant clause
Evidence
Source
View clause
```

Use smooth accordion/side-panel transitions.

---

# 25. SCHEMES

Primary question:

> Why is this scheme relevant to me?

Scheme card:

```text
Scheme
Authority
Benefit
Why matched
Eligibility
Source
```

Do not show all eligibility text by default.

### Interaction

Hover:

- card rises slightly
- "Why matched" becomes clearer

Click:

- detail area expands
- eligibility enters progressively
- source/action row appears

---

# 26. REGULATORY UPDATES

The page should communicate change.

Each update should emphasize:

```text
What changed
Who is affected
When it takes effect
What should I do
```

Use a quiet feed.

Avoid giant metadata blocks.

### Interaction

Hover an update:

- effective date highlights
- affected standard chips sharpen
- action arrow moves

---

# 27. BIS COPILOT

The assistant should look like a **trusted specialist workspace**, not a generic chat prototype.

Layout:

```text
Context
↓
Conversation
↓
Suggested queries
↓
Input
```

Answers should support evidence.

Show:

```text
Answer
Source
Standard / order
Clause
Verification
```

Use staged answer rendering if actual streaming exists.

Do not simulate streaming if the backend does not actually stream.

---

# 28. ONBOARDING

This is where the UI should feel most human.

The user should never feel like they are completing a government form.

Start with:

> **Let's understand your business.**

Then one focused question at a time where practical.

Use:

- large answer area
- minimal chrome
- progress indicator
- save state
- back/next
- adaptive questioning

## Progress

Do not use only:

```text
Question 23 of 56
```

Prefer a conceptual progress state:

```text
Building your business context
████████░░
```

The exact terminology may be changed during content review.

---

# 29. ADAPTIVE QUESTION MICRO-INTERACTION

When a question is generated from missing information:

```text
current context
        ↓
question enters
        ↓
answer
        ↓
context updates
```

Visually, a small business-fact summary can update alongside the question.

This should make the system feel responsive to the user's answers.

---

# 30. SIGN-IN / AUTH

Authentication should feel like the same product.

Avoid generic auth template aesthetics.

Design:

```text
warm ivory background
quiet brand mark
focused card or split layout
clear title
short supporting line
minimal inputs
single primary action
```

Input interactions:

- focus line gently changes
- label remains legible
- validation appears inline
- password visibility uses a quiet icon

No dramatic animation.

---

# 31. PROFILE / SETTINGS

Settings should use grouped sections.

Example:

```text
Account
Business
Notifications
Calendar
Preferences
Security
```

Use dividers rather than dozens of independent cards.

Unsaved changes:

```text
Save changes
```

with subtle sticky action state if necessary.

---

# 32. ADMIN PRODUCT

The admin interface is part of the same brand but should be more operational.

It should not look like a sci-fi "control room."

Rename visual language toward:

```text
Compliance Review
Review Queue
Businesses
Evidence
Rules
Decisions
```

Technical data can remain available.

But default UI should be understandable.

---

# 33. ADMIN REVIEW QUEUE

Use a professional review table/list.

Columns should prioritize:

```text
Business
Review status
Evidence status
Decision
Last updated
Action
```

Hover:

- row lightly highlights
- action becomes visible

Click:

- open review workspace

---

# 34. ADMIN CASE REVIEW

Case page structure:

```text
Business context
        ↓
Applicable requirements
        ↓
Evidence
        ↓
Rule explanation
        ↓
Reviewer decision
```

Keep the decision panel visually anchored.

Actions:

```text
Approve
Request changes
Reject
```

Destructive actions require confirmation.

---

# 35. ADMIN EVIDENCE INSPECTION

Evidence should be inspectable without leaving the case.

Use a side panel / split view:

```text
Evidence source
      │
      ├── excerpt
      ├── source
      ├── version
      ├── effective date
      └── applicability
```

Opening the panel should slide naturally.

The selected evidence item should visually connect to its requirement.

---

# 36. FUNCTIONAL BUG AUDIT

Before visual polish is considered complete, test all important flows.

At minimum:

```text
auth
navigation
business selection
business profile
onboarding
adaptive questions
dashboard actions
compliance details
documents upload/verify
workflow steps
calendar
alerts
standards search
scheme filtering
regulatory update details
BIS Copilot
admin review queue
admin case
approve
reject
request changes
logout
```

For every interactive action verify:

```text
idle
loading
success
empty
error
disabled
permission denied
```

Fix functional bugs before polishing visuals.

---

# 37. EMPTY STATES

Empty states must be designed, not left blank.

Examples:

## No documents

```text
Your document vault is ready.

Upload your first statutory document to begin verification.
```

## No alerts

```text
You're up to date.

We'll surface important compliance changes here.
```

## No matched schemes

```text
No relevant schemes found yet.

As your business context changes, matching opportunities may change too.
```

Keep these calm and reassuring.

---

# 38. LOADING STATES

Use skeletons and progressive placeholders.

Skeletons should match the final geometry.

Do not show generic spinners everywhere.

Where useful:

```text
Searching
Checking
Matching
Preparing
```

Use subtle animated gradients only where helpful.

---

# 39. ERROR STATES

Errors should communicate:

1. what happened
2. what the user can do

Example:

```text
We couldn't load this requirement.

Try again
```

Avoid technical error strings in the main UI.

Technical detail can be available behind "Details" for support/admin.

---

# 40. RESPONSIVE DESIGN

Desktop:

- full sidebar
- multi-column layouts
- generous whitespace

Tablet:

- reduced side navigation
- fewer columns
- preserve hierarchy

Mobile:

- drawer navigation
- single-column content
- sticky action bar where useful
- bottom sheets for secondary information
- side panels become full-screen sheets

Do not simply shrink desktop.

Recompose the hierarchy.

---

# 41. PERFORMANCE

Do not introduce heavy animation everywhere.

Use:

- transform
- opacity
- height where necessary
- GSAP
- CSS transitions
- lazy rendering
- code splitting where appropriate

Avoid expensive continuous effects.

The product must feel fast.

---

# 42. ACCESSIBILITY

Support:

- keyboard navigation
- visible focus states
- semantic buttons
- aria labels
- accessible accordions
- accessible dialogs
- readable contrast
- reduced motion

Do not depend on colour alone for status.

---

# 43. REDUCED MOTION

When `prefers-reduced-motion` is enabled:

- disable decorative movement
- keep functional transitions short
- retain state changes
- preserve focus/feedback

The product must remain understandable.

---

# 44. COMPONENT SYSTEM

Create reusable primitives where appropriate.

Examples:

```text
AppShell
TopBar
Sidebar
PageHeader
Section
Surface
Button
IconButton
StatusPill
Metric
RequirementCard
DocumentCard
WorkflowStepper
EvidencePanel
Timeline
EmptyState
Toast
Modal
Drawer
CommandSearch
```

Do not create dozens of one-off versions of the same component.

---

# 45. DESIGN TOKENS

Centralize:

```text
colours
spacing
radius
shadows
typography
motion duration
motion easing
```

The whole platform should be able to change consistently from one design-token layer.

---

# 46. MOTION TOKENS

Suggested:

```text
ease-out-soft
ease-smooth
ease-emphasized
```

Typical:

```text
fast: 140ms
normal: 240ms
slow: 420ms
```

Use longer transitions only for major contextual changes.

---

# 47. DO NOT

Do not:

- redesign the product as a generic template
- add excessive gradients
- add dark-mode dashboard styling
- add giant 3D assets to normal screens
- use cinematic camera effects inside CRUD pages
- use a novelty cursor throughout the application
- use excessive glassmorphism
- use every color in the palette at once
- show every piece of information at once
- use animation that delays users
- remove product functionality to make the UI cleaner
- change backend behaviour unless required to fix a frontend integration bug

---

# 48. IMPLEMENTATION ORDER

## Phase 1 — Audit

Inventory every route and interaction.

Record:

```text
route
component
current state
visual problems
UX problems
functional bugs
```

## Phase 2 — Foundation

Implement:

- design tokens
- global typography
- surface system
- buttons
- nav
- sidebar
- motion system

## Phase 3 — Core user experience

Redesign:

1. auth
2. onboarding
3. dashboard
4. compliance
5. documents
6. workflows
7. calendar

## Phase 4 — Intelligence

Redesign:

8. alerts
9. standards
10. schemes
11. regulatory updates
12. BIS Copilot

## Phase 5 — Admin

Redesign:

13. admin dashboard
14. review queue
15. case review
16. evidence
17. approval/rejection flows

## Phase 6 — Polish

Add:

- micro-interactions
- loading states
- empty states
- error states
- responsive refinements
- reduced-motion mode
- accessibility
- performance tuning

---

# 49. DEFINITION OF DONE

The redesign is complete when:

## Brand

- All product pages feel like the same ComplyWise brand.
- The light premium visual language is consistent.

## UX

- Every page has a clear hierarchy.
- Important actions are obvious.
- Dense information is progressively disclosed.
- The user always understands where they are and what to do next.

## Motion

- Hover feels tactile.
- Press feedback feels immediate.
- Expansions are smooth.
- Status changes feel alive.
- Workflow progress feels physical.
- No gratuitous animation.

## Functional

- Existing routes still work.
- Existing business flows still work.
- Admin flows are tested.
- Known frontend bugs are fixed.

## Responsive

- Desktop, tablet and mobile are intentionally composed.

## Performance

- No persistent high-cost effects.
- No runaway GSAP timelines.
- No console errors caused by the redesign.

---

# 50. FINAL EXPERIENCE TARGET

The application should feel like:

```text
the calm precision of a premium financial/productivity app
+
the trust of a serious regulatory workspace
+
the editorial visual language of ComplyWise
+
excellent interaction design
```

The user should not notice the animation.

They should notice:

> **"Everything feels clear, considered and dependable."**

That is the product-level equivalent of the premium landing page.
